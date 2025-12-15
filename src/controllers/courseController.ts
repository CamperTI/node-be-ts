import { Request, Response, NextFunction } from 'express';
import * as cheerio from 'cheerio';
import { createEntryObject } from '../utils/shared';
import { RedisCacheService } from '../services/RedisCacheService';
import { DEFAULT_REDIS_CACHE } from '../utils/const';
import { launchBrowser } from '../config/puppeteer';

const url = 'https://coursevania.com/courses/';

var dataResponse: any[] = [];
const maxClicks = 3;

export const course = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // const cacheService = new RedisCacheService();
    const CACHE_KEY = 'course:coursevania';
    // const cached = await cacheService.get(CACHE_KEY);
    // if (cached) {
    //   return res.standardResponse(cached, 'Data fetch successfully (cache)');
    // }

    const browser = await launchBrowser();
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle2' });

    for (let i = 0; i < maxClicks; i++) {
      // Wait for the button to be available
      const button = await page.$('.btn.btn-default.stm_lms_load_more_courses');
      if (!button) break;

      await button.click();
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    const content = await page.content();
    const $ = cheerio.load(content);

    const tableList = $(
      `.stm_lms_courses__grid.stm_lms_courses__grid_4.stm_lms_courses__grid_center.archive_grid`
    ).children();
    tableList.each(async (index, row) => {
      let title = $(row)
        .find(
          '.stm_lms_courses__single__inner .stm_lms_courses__single--title a h5'
        )
        .text()
        .trim();
      let link = $(row)
        .find(
          '.stm_lms_courses__single__inner .stm_lms_courses__single--title a'
        )
        .attr('href');

      if (title) {
        const entryObject = createEntryObject(title, link);
        dataResponse.push(entryObject);
      }
    });
    await browser.close();

    // await cacheService.set(CACHE_KEY, dataResponse, DEFAULT_REDIS_CACHE);
    return res.standardResponse(dataResponse, 'Data fetch successfully');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching:', error.message);
    } else {
      console.error('Error fetching:', error);
    }
  }
};
