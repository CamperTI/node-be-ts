import puppeteer, { Browser, Page } from "puppeteer";

// Navigation timeout in milliseconds (2 minutes for slow servers)
export const NAVIGATION_TIMEOUT = 120000;

export const launchBrowser = async (): Promise<Browser> => {
  const executablePath = puppeteer.executablePath();

  console.log("Using Chrome at:", executablePath);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-software-rasterizer",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-sync",
      "--metrics-recording-only",
      "--mute-audio",
      "--no-first-run",
      "--disable-default-apps",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--disable-backgrounding-occluded-windows"
    ]
  });

  return browser;
};

export const createPage = async (browser: Browser): Promise<Page> => {
  const page = await browser.newPage();

  // Set longer timeout for slow servers
  page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);
  page.setDefaultTimeout(NAVIGATION_TIMEOUT);

  // Block unnecessary resources to speed up loading
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const resourceType = request.resourceType();
    // Block images, stylesheets, fonts to speed up page load
    if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
      request.abort();
    } else {
      request.continue();
    }
  });

  return page;
};
