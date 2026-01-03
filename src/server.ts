import puppeteer from 'puppeteer';
import app from './app';
import config from './config/config';

app.listen(config.port, () => {
  console.log("Executable:", puppeteer.executablePath());
  console.log(`Server running on port ${config.port}`);
});
