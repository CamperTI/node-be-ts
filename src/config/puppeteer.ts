import puppeteer, { Browser } from 'puppeteer';

export const getPuppeteerConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';

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

  // In production (Render), use the cached Chrome executable
  if (isProduction) {
    config.executablePath = '/opt/render/.cache/puppeteer/chrome/linux-136.0.7103.92/chrome-linux64/chrome';
  }

  return config;
};

export const launchBrowser = async (): Promise<Browser> => {
  const config = getPuppeteerConfig();
  return await puppeteer.launch(config);
};
