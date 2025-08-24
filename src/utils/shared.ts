import { Page } from 'puppeteer';
import { IEntryObject } from '../types/news';

/*
 * Function to scroll to the bottom of the page
 * Scroll to the bottom to trigger lazy loading
 */
export async function autoScroll(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

export const createEntryObject = (
  title: string,
  link: string | undefined,
  time: string = ''
): IEntryObject => {
  return { title, link, time };
};
