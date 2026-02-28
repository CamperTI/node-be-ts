import { Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import { IEntryObject } from '../types/news';
import {
  launchBrowser,
  createPage,
  navigateTo,
  acquirePageSlot,
  releasePageSlot,
} from '../config/puppeteer';

type CheerioAPI = ReturnType<typeof cheerio.load>;

export async function scrapeNewsPage(
  url: string,
  listSelector: string,
  mapRow: ($: CheerioAPI, row: AnyNode) => IEntryObject | null,
  autoScrollFn?: (page: Page) => Promise<void>,
): Promise<IEntryObject[]> {
  let page: Page | null = null;

  await acquirePageSlot();
  try {
    const browser = await launchBrowser();
    page = await createPage(browser);
    await navigateTo(page, url);

    if (autoScrollFn) {
      await autoScrollFn(page);
    }

    const content = await page.content();
    console.log('Page content preview:', content.slice(0, 500));
    const $ = cheerio.load(content);
    const dataResponse: IEntryObject[] = [];
    const tableList = $(listSelector).children();

    console.log('tablelist', tableList.length);

    tableList.each((_, row) => {
      const entry = mapRow($, row as unknown as AnyNode);
      if (entry) dataResponse.push(entry);
    });
    return dataResponse;
  } finally {
    if (page) {
      await page
        .close()
        .catch((err) => console.error('Error closing page:', err));
    }
    releasePageSlot();
  }
}

export async function scapeTicketmasterPage(
  url: string,
  listSelector: string,
  mapRow: ($: CheerioAPI, row: AnyNode) => IEntryObject | null,
): Promise<IEntryObject[]> {
  let page: Page | null = null;

  await acquirePageSlot();
  try {
    const browser = await launchBrowser();
    page = await createPage(browser);
    await navigateTo(page, url);

    await page.waitForSelector('#seatmapEventName', { timeout: 10000 }); // wait up to 10 seconds
    await page.waitForSelector('#waitMsg', { timeout: 10000 });

    const content = await page.content();
    const $ = cheerio.load(content);
    const dataResponse: IEntryObject[] = [];

    const seatmapEventName = $('#seatmapEventName');
    const waitMsg = $('#waitMsg');

    const data: IEntryObject = {
      title: seatmapEventName.text().trim(),
      link: waitMsg.text().trim(),
      time: seatmapEventName.text().trim(),
    };
    dataResponse.push(data);

    return dataResponse;
  } catch (error) {
    console.error('Error scraping Ticketmaster page:', error);
    return [];
  } finally {
    if (page) {
      await page
        .close()
        .catch((err) => console.error('Error closing page:', err));
    }
    releasePageSlot();
  }
}
