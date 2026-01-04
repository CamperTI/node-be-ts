import puppeteer, { Browser, Page } from "puppeteer";

// Navigation timeout in milliseconds (2 minutes for slow servers)
export const NAVIGATION_TIMEOUT = 120000;
export const PROTOCOL_TIMEOUT = 180000;

// Singleton browser instance
let browserInstance: Browser | null = null;
let browserLaunching: Promise<Browser> | null = null;

export const launchBrowser = async (): Promise<Browser> => {
  // If browser is already running, return it
  if (browserInstance && browserInstance.connected) {
    console.log("Reusing existing browser instance");
    return browserInstance;
  }

  // If browser is currently launching, wait for it
  if (browserLaunching) {
    console.log("Waiting for browser to finish launching...");
    return browserLaunching;
  }

  // Launch new browser
  console.log("Launching new browser instance...");
  const executablePath = puppeteer.executablePath();
  console.log("Using Chrome at:", executablePath);

  browserLaunching = puppeteer.launch({
    executablePath,
    headless: true,
    timeout: 120000, // 2 minutes for browser launch
    protocolTimeout: PROTOCOL_TIMEOUT,
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
      "--disable-backgrounding-occluded-windows",
      "--disable-canvas-aa",
      "--disable-2d-canvas-clip-aa",
      "--disable-gl-drawing-for-tests",
      "--disable-features=IsolateOrigins,site-per-process",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor"
    ]
  }).then(browser => {
    browserInstance = browser;
    browserLaunching = null;
    console.log("Browser launched successfully");

    // Handle browser disconnect
    browser.on('disconnected', () => {
      console.log("Browser disconnected, clearing instance");
      browserInstance = null;
    });

    return browser;
  }).catch(error => {
    browserLaunching = null;
    browserInstance = null;
    console.error("Failed to launch browser:", error.message);
    throw error;
  });

  return browserLaunching;
};

export const createPage = async (browser: Browser): Promise<Page> => {
  const page = await browser.newPage();

  // Set longer timeout for slow servers
  page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);
  page.setDefaultTimeout(NAVIGATION_TIMEOUT);

  // Block only heavy resources (images, videos) to speed up loading
  // Keep stylesheets and fonts so the page renders properly
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const resourceType = request.resourceType();
    // Only block images and media to reduce bandwidth
    if (['image', 'media'].includes(resourceType)) {
      request.abort();
    } else {
      request.continue();
    }
  });

  return page;
};
