import puppeteer, { Browser } from "puppeteer";
import fs from "fs";

const CHROME_PATH =
  "/opt/render/.cache/puppeteer/chrome/linux-143.0.7499.169/chrome-linux64/chrome";

export const launchBrowser = async (): Promise<Browser> => {
  const executablePath = fs.existsSync(CHROME_PATH)
    ? CHROME_PATH
    : undefined;

  if (executablePath) {
    console.log("Using Chrome at:", executablePath);
  } else {
    console.log("Using Puppeteer default Chrome");
  }

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
