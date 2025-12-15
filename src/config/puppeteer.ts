import puppeteer, { Browser } from 'puppeteer';
import { execSync } from 'child_process';

export const getPuppeteerConfig = () => {
  const config: {
    headless: boolean;
    args: string[];
    executablePath?: string;
  } = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ],
  };

  // Try to find Chrome executable automatically
  try {
    const executablePath = execSync('npx puppeteer browsers path chrome', {
      encoding: 'utf8',
    }).trim();

    if (executablePath) {
      config.executablePath = executablePath;
      console.log('Using Chrome at:', executablePath);
    }
  } catch (error) {
    console.warn('Could not find Chrome executable automatically, using default');
  }

  return config;
};

export const launchBrowser = async (): Promise<Browser> => {
  const config = getPuppeteerConfig();
  return await puppeteer.launch(config);
};
