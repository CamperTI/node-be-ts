import { Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import { IEntryObject } from '../types/news';
import { launchBrowser } from '../config/puppeteer';

export async function scrapeNewsPage(
  url: string,
  listSelector: string,
  mapRow: ($: cheerio.Root, row: cheerio.Element) => IEntryObject | null,
  autoScrollFn?: (page: Page) => Promise<void>
): Promise<IEntryObject[]> {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  if (autoScrollFn) {
    await autoScrollFn(page);
  }

  const content = await page.content();
  await browser.close();

  const $ = cheerio.load(content);
  const dataResponse: IEntryObject[] = [];
  const tableList = $(listSelector).children();

  console.log('tablelist', tableList.length);

  tableList.each((_, row) => {
    const entry = mapRow($, row);
    if (entry) dataResponse.push(entry);
  });
  return dataResponse;
}

export async function scapeTicketmasterPage(
  url: string,
  listSelector: string,
  mapRow: ($: cheerio.Root, row: cheerio.Element) => IEntryObject | null
): Promise<IEntryObject[]> {
  try {
    const browser = await launchBrowser();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    await page.waitForSelector('#seatmapEventName', { timeout: 10000 }); // wait up to 10 seconds
    await page.waitForSelector('#waitMsg', { timeout: 10000 });

    const content = await page.content();
    await browser.close();

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
  }
}
