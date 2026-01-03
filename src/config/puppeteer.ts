import puppeteer, { Browser } from 'puppeteer';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

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

    if (executablePath && fs.existsSync(executablePath)) {
      config.executablePath = executablePath;
      console.log('Using Chrome at:', executablePath);
      return config;
    }
  } catch (error) {
    console.warn('Could not find Chrome using npx command');
  }

  // Fallback: Check common Puppeteer cache locations
  const possiblePaths = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.PUPPETEER_CACHE_DIR
      ? path.join(
          process.env.PUPPETEER_CACHE_DIR,
          'chrome/linux-*/chrome-linux*/chrome'
        )
      : null,
    '/opt/render/.cache/puppeteer/chrome/linux-*/chrome-linux*/chrome',
    path.join(process.cwd(), '.cache/puppeteer/chrome/linux-*/chrome-linux*/chrome'),
  ].filter(Boolean) as string[];

  for (const pathPattern of possiblePaths) {
    try {
      if (pathPattern.includes('*')) {
        // Handle glob patterns
        const execResult = execSync(`find ${path.dirname(pathPattern)} -name chrome -type f 2>/dev/null | head -1`, {
          encoding: 'utf8',
        }).trim();

        if (execResult && fs.existsSync(execResult)) {
          config.executablePath = execResult;
          console.log('Found Chrome at:', execResult);
          return config;
        }
      } else if (fs.existsSync(pathPattern)) {
        config.executablePath = pathPattern;
        console.log('Using Chrome at:', pathPattern);
        return config;
      }
    } catch (error) {
      // Continue to next path
    }
  }

  console.log('Using Puppeteer default Chrome path');
  return config;
};

export const launchBrowser = async (): Promise<Browser> => {
  const config = getPuppeteerConfig();
  return await puppeteer.launch(config);
};
