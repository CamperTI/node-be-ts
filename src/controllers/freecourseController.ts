import { Request, Response, NextFunction } from "express";
import puppeteer from "puppeteer";
import type { Browser, Page } from "puppeteer";
import {
  navigateTo,
  acquirePageSlot,
  releasePageSlot,
  NAVIGATION_TIMEOUT,
  PROTOCOL_TIMEOUT,
} from "../config/puppeteer";

const UDEMY_LOGIN_URL = "https://www.udemy.com/join/login-popup/";
const MANUAL_LOGIN_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// ─── Wait for manual Udemy login ─────────────────────────────────────────────

async function waitForManualLogin(page: Page): Promise<void> {
  console.log("[freecourse] Browser opened — please login to Udemy manually.");
  console.log(`[freecourse] Waiting up to 5 minutes...`);

  await navigateTo(page, UDEMY_LOGIN_URL);

  const deadline = Date.now() + MANUAL_LOGIN_TIMEOUT;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2000));

    const url = page.url();
    const isLoggedIn =
      !url.includes("/join/") &&
      !url.includes("/login") &&
      url.includes("udemy.com");

    if (isLoggedIn) {
      console.log(`[freecourse] Logged in detected (${url})`);
      return;
    }
  }

  throw new Error("[freecourse] Manual login timed out after 5 minutes.");
}

// ─── Extract Udemy link from freecourse.io ────────────────────────────────────

async function extractUdemyLink(
  page: Page,
  freecourseUrl: string,
): Promise<string | null> {
  console.log(`[freecourse] Fetching: ${freecourseUrl}`);
  await navigateTo(page, freecourseUrl);
  await new Promise((r) => setTimeout(r, 2000));

  // Primary: anchor with udemy.com href and enroll/get/free text
  const udemyLink = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll("a"));
    const match = anchors.find(
      (a) =>
        a.href.includes("udemy.com") &&
        (a.textContent?.toLowerCase().includes("enroll") ||
          a.textContent?.toLowerCase().includes("get") ||
          a.textContent?.toLowerCase().includes("free")),
    );
    return match?.href ?? null;
  });

  if (udemyLink) return udemyLink;

  // Fallback: any udemy.com/course link with a coupon code
  return page.evaluate(() => {
    const anchors = Array.from(
      document.querySelectorAll('a[href*="udemy.com/course"]'),
    );
    const withCoupon = anchors.find((a) =>
      (a as HTMLAnchorElement).href.includes("couponCode"),
    );
    return (withCoupon as HTMLAnchorElement)?.href ?? null;
  });
}

// ─── Enroll on Udemy ──────────────────────────────────────────────────────────

async function enrollOnUdemy(
  page: Page,
  udemyUrl: string,
): Promise<{ success: boolean; message: string }> {
  console.log(`[freecourse] Enrolling: ${udemyUrl}`);
  await navigateTo(page, udemyUrl);
  await new Promise((r) => setTimeout(r, 2000));

  // Already enrolled?
  const alreadyEnrolled = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase();
    return (
      text.includes("go to course") ||
      text.includes("start learning") ||
      text.includes("already enrolled")
    );
  });

  if (alreadyEnrolled) {
    return { success: true, message: "Already enrolled" };
  }

  const ENROLL_SELECTORS = [
    'button[data-purpose="buy-this-course-button"]',
    'button[data-purpose="add-to-cart-button"]',
    'button[class*="buy-button"]',
    ".buy-button button",
  ];

  let clicked = false;
  for (const sel of ENROLL_SELECTORS) {
    try {
      await page.waitForSelector(sel, { timeout: 3000 });
      await page.click(sel);
      console.log(`[freecourse] Clicked: ${sel}`);
      clicked = true;
      break;
    } catch {
      // try next
    }
  }

  if (!clicked) {
    const found = await page.evaluate(() =>
      Array.from(document.querySelectorAll("button"))
        .map((b) => `"${b.textContent?.trim()}" [data-purpose=${b.dataset["purpose"] ?? ""}]`)
        .slice(0, 15)
        .join(", "),
    );
    console.warn(`[freecourse] Enroll button not found. Buttons: ${found}`);
    return { success: false, message: "Enroll button not found on Udemy page" };
  }

  await new Promise((r) => setTimeout(r, 2000));
  await page
    .waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 })
    .catch(() => {});

  const finalUrl = page.url();

  // Handle free checkout confirmation page
  if (finalUrl.includes("/cart/") || finalUrl.includes("/checkout/")) {
    const confirmSel =
      'button[data-purpose="checkout-button"], button[class*="checkout"], button[type="submit"]';
    try {
      await page.waitForSelector(confirmSel, { timeout: 5000 });
      await page.click(confirmSel);
      await page
        .waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 })
        .catch(() => {});
    } catch {
      console.warn("[freecourse] No checkout confirm button — may have enrolled directly");
    }
  }

  const endUrl = page.url();
  console.log(`[freecourse] Done: ${endUrl}`);
  return { success: true, message: `Enrolled — ${endUrl}` };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export const freecourseEnroll = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { urls } = req.body as { urls?: string[] };

  if (!Array.isArray(urls) || urls.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "`urls` array is required" });
  }

  let browser: Browser | null = null;
  let page: Page | null = null;

  await acquirePageSlot();
  try {
    // Launch a visible (non-headless) browser so user can login manually
    browser = await puppeteer.launch({
      headless: false,
      protocolTimeout: PROTOCOL_TIMEOUT,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--start-maximized"],
      defaultViewport: null,
    });

    page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    );
    page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);
    page.setDefaultTimeout(NAVIGATION_TIMEOUT);

    // Step 1: Manual login
    await waitForManualLogin(page);

    const results: {
      freecourseUrl: string;
      udemyUrl: string | null;
      success: boolean;
      message: string;
    }[] = [];

    // Step 2: Enroll each course
    for (const freecourseUrl of urls) {
      let udemyUrl: string | null = null;
      try {
        udemyUrl = await extractUdemyLink(page, freecourseUrl);

        if (!udemyUrl) {
          results.push({
            freecourseUrl,
            udemyUrl: null,
            success: false,
            message: "No Udemy link found on freecourse.io page",
          });
          continue;
        }

        console.log(`[freecourse] Udemy URL: ${udemyUrl}`);
        const { success, message } = await enrollOnUdemy(page, udemyUrl);
        results.push({ freecourseUrl, udemyUrl, success, message });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({ freecourseUrl, udemyUrl, success: false, message: msg });
      }

      await new Promise((r) => setTimeout(r, 2000));
    }

    const successCount = results.filter((r) => r.success).length;
    return res.standardResponse(
      results,
      `Enrolled ${successCount}/${urls.length} courses`,
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("[freecourse] Fatal error:", error.message);
    }
    next(error);
  } finally {
    if (browser) {
      await browser
        .close()
        .catch((err) => console.error("Error closing browser:", err));
    }
    releasePageSlot();
  }
};
