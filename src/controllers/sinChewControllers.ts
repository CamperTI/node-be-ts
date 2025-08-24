import { Request, Response, NextFunction } from 'express';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { autoScroll, createEntryObject } from '../utils/shared';
import { IEntryObject } from '../types/news';
import { RedisCacheService } from '../services/RedisCacheService';
import { scrapeNewsPage } from '../utils/scrapeNewsPage';
import { DEFAULT_REDIS_CACHE } from '../utils/const';

const url =
  'https://www.sinchew.com.my/category/%e8%b4%a2%e7%bb%8f/%e5%9b%bd%e9%99%85%e8%b4%a2%e7%bb%8f';

const hotUrl = 'https://www.sinchew.com.my/hot-posts';

var dataResponse: IEntryObject[] = [];

const listSelector = '#catZone2 #cat-post-list';

export const testSinChew = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Example response data
    const data = {
      title: 'Hot Sin Chew News',
      description: 'Latest news from Sin Chew Daily.',
      url: 'https://www.sinchew.com.my/',
      category: 'News',
    };

    // Send the response
    res.status(200).json(data);
  } catch (error) {
    // Handle errors
    next(error);
  }
};

function sinChewMapRow($: cheerio.Root, row: cheerio.Element) {
  let title = $(row).find('h2.title a').text().trim();
  let link = $(row).find('a.internalLink').attr('href');
  return title ? createEntryObject(title, link, '') : null;
}

export const sinChew = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // const cacheService = new RedisCacheService();
  const CACHE_KEY = 'news:sinChew';

  try {
    // const cached = await cacheService.get(CACHE_KEY);
    // if (cached) {
    //   return res.standardResponse(cached, 'Data fetch successfully (cache)');
    // }

    const dataResponse = await scrapeNewsPage(url, listSelector, sinChewMapRow);
    // await cacheService.set(CACHE_KEY, dataResponse, DEFAULT_REDIS_CACHE);
    return res.standardResponse(dataResponse, 'Data fetch successfully');
  } catch (error) {
    return res.standardResponse([], 'Failed');
  }
};

export const hotSinChew = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Launch a headless browser
    const browser = await puppeteer.launch({
      executablePath:
        '/opt/render/.cache/puppeteer/chrome/linux-136.0.7103.92/chrome-linux64/chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    await page.goto(hotUrl, { waitUntil: 'networkidle2' });

    await page.waitForSelector(
      'h3.skip-default-style.hot-posts-toggle-item.hot-posts-toggle-item-24h'
    );
    await page.click(
      '.skip-default-style.hot-posts-toggle-item.hot-posts-toggle-item-24h'
    );

    // Scroll to the bottom to trigger lazy loading
    await autoScroll(page);

    // Get the HTML content after all lazy-loaded data has been fetched
    const content = await page.content();
    const $ = cheerio.load(content);

    const tableList = $(`#cat-post-list-1D .horizontal-post-frame`).children();

    tableList.each(async (index, row) => {
      let title = $(row).find('a.internalLink').text().trim();
      let link = $(row).find('a.internalLink').attr('href');
      // let time = $(row).find('.meta span.time').text()

      if (title) {
        const entryObject = createEntryObject(title, link);
        dataResponse.push(entryObject);
      }
    });
    await browser.close();
    return res.standardResponse(dataResponse, 'Data fetch successfully');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching:', error.message);
      return res.standardResponse(null, error.message, 500);
    } else {
      console.error('Error fetching:', error);
    }
    return res.standardResponse(dataResponse, 'Failed');
  }
};
