import puppeteer, { Browser } from "puppeteer";

export const launchBrowser = async (): Promise<Browser> => {
  const executablePath = puppeteer.executablePath();

  console.log("Using Chrome at:", executablePath);

  return puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage"
    ]
  });
};
