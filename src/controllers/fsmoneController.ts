import { Request, Response, NextFunction } from "express";
import * as cheerio from "cheerio";
import type { Page } from "puppeteer";
import {
  launchBrowser,
  createPage,
  acquirePageSlot,
  releasePageSlot,
} from "../config/puppeteer";
import { cacheService } from "../services/RedisCacheService";
import { FUND_REDIS_CACHE } from "../utils/const";

const FSMONE_FACTSHEET_BASE = "https://www.fsmone.com.my/funds/tools/factsheet";

export interface IFundPrice {
  fundCode: string;
  fundName: string;
  nav: string;
  currency: string;
  priceDate: string;
  change: string;
  changePercent: string;
  url: string;
}

export const getFundPrice = async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const fundCode = (req.query.fund as string | undefined) ?? "MYKNGAPTR";
  // The factsheet slug (path segment) can be passed via `slug` query param.
  // Defaults to the Kenanga Asia Pacific Total Return Fund.
  const slug =
    (req.query.slug as string | undefined) ??
    "kenanga-asia-pacific-total-return-fund";

  const CACHE_KEY = `fund:fsmone:${fundCode}:${slug}`;
  const url = `${FSMONE_FACTSHEET_BASE}/${slug}?fund=${fundCode}`;

  const cached = await cacheService.get(CACHE_KEY);
  if (cached && typeof cached === "object") {
    return res.standardResponse(
      cached,
      "Fund price fetched successfully (cache)",
    );
  }

  let page: Page | null = null;

  await acquirePageSlot();
  try {
    const browser = await launchBrowser();
    page = await createPage(browser);

    // FSMOne is a Vue-rendered SPA — wait for network to settle so prices load
    await page.goto(url, { waitUntil: "networkidle2", timeout: 120000 });

    // Wait for a price element or any visible numeric text on the page
    await page
      .waitForSelector('.price, .nav-price, [class*="price"], [class*="nav"]', {
        timeout: 30000,
      })
      .catch(() =>
        console.warn("Price selector not found, parsing rendered content"),
      );

    const content = await page.content();
    const $ = cheerio.load(content);

    // Try to extract price data via page.evaluate for accuracy on Vue-rendered content
    const priceData = await page.evaluate(() => {
      const getText = (selectors: string[]): string => {
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.textContent?.trim()) return el.textContent.trim();
        }
        return "";
      };

      // FSMOne typically renders fund name in <h1> or a heading with "fund" class
      const fundName = getText([
        "h1",
        ".fund-name",
        '[class*="fund-name"]',
        '[class*="fundName"]',
        ".title",
      ]);

      // NAV / price — FSMOne shows NAV per unit prominently
      const nav = getText([
        ".nav-price",
        '[class*="nav-price"]',
        '[class*="navPrice"]',
        '[class*="unit-price"]',
        '[class*="unitPrice"]',
        ".price-value",
        '[class*="price-value"]',
        "[data-v] .price",
      ]);

      // Date
      const priceDate = getText([
        '[class*="price-date"]',
        '[class*="priceDate"]',
        '[class*="nav-date"]',
        '[class*="navDate"]',
        ".as-of-date",
        '[class*="asOfDate"]',
      ]);

      // Change
      const change = getText([
        '[class*="change"]:not([class*="percent"])',
        ".price-change",
      ]);
      const changePercent = getText([
        '[class*="change-percent"]',
        '[class*="changePercent"]',
        '[class*="percent"]',
      ]);

      // Currency
      const currency = getText([
        '[class*="currency"]',
        ".currency",
        '[class*="ccy"]',
      ]);

      return { fundName, nav, priceDate, change, changePercent, currency };
    });

    // Fallback: scan the page text for the first standalone decimal number
    // that looks like a NAV (0.xxxx or 1.xxxx pattern)
    let nav = priceData.nav;
    if (!nav) {
      const bodyText = $("body").text();
      const navMatch = bodyText.match(/\b(\d+\.\d{4})\b/);
      nav = navMatch ? navMatch[1] : "";
    }

    // Fallback for fund name
    let fundName = priceData.fundName;
    if (!fundName) {
      fundName = $("h1").first().text().trim() || $("title").text().trim();
    }

    if (!nav) {
      return res.standardResponse(
        null,
        "Could not extract NAV price — the page structure may have changed",
        404,
      );
    }

    const result: IFundPrice = {
      fundCode,
      fundName,
      nav,
      currency: priceData.currency || "MYR",
      priceDate: priceData.priceDate,
      change: priceData.change,
      changePercent: priceData.changePercent,
      url,
    };

    await cacheService.set(CACHE_KEY, result, FUND_REDIS_CACHE);

    return res.standardResponse(result, "Fund price fetched successfully");
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching fund price:", error.message);
      return res.standardResponse(null, error.message, 500);
    }
  } finally {
    if (page) {
      await page
        .close()
        .catch((err) => console.error("Error closing page:", err));
    }
    releasePageSlot();
  }
};
