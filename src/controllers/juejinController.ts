import { Request, Response, NextFunction } from 'express';
import * as cheerio from 'cheerio';
import type { Page } from 'puppeteer';
import { autoScroll, createEntryObject } from '../utils/shared';
import { RedisCacheService } from '../services/RedisCacheService';
import { DEFAULT_REDIS_CACHE } from '../utils/const';
import {
  launchBrowser,
  createPage,
  navigateTo,
  acquirePageSlot,
  releasePageSlot,
  NAVIGATION_TIMEOUT,
} from '../config/puppeteer';

// const url = 'https://juejin.cn/frontend';
const url = 'https://juejin.cn/frontend?sort=newest';
const listSelector = '.entry-list.list';

export const juejin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const cacheService = new RedisCacheService();
  const CACHE_KEY = 'news:juejin';

  let page: Page | null = null;

  const cached = await cacheService.get(CACHE_KEY);
  if (cached && Array.isArray(cached) && (cached as any[]).length > 0) {
    return res.standardResponse(cached, 'Data fetch successfully (cache)');
  }

  await acquirePageSlot();
  try {
    const browser = await launchBrowser();
    page = await createPage(browser);

    await navigateTo(page, url);

    // Juejin is a React SPA — wait for the article list to be rendered by JS
    await page.waitForSelector(listSelector, { timeout: NAVIGATION_TIMEOUT });

    await autoScroll(page);

    const content = await page.content();
    const $ = cheerio.load(content);

    const dataResponse: ReturnType<typeof createEntryObject>[] = [];
    $(listSelector)
      .children()
      .each((_, row) => {
        const title = $(row).find('a.jj-link.title').text().trim();
        const link = $(row).find('a.jj-link.title').attr('href');
        const time = $(row).find('.item.date').text().trim();
        if (title) {
          dataResponse.push(
            createEntryObject(title, `https://juejin.cn${link}`, time),
          );
        }
      });

    await cacheService.set(CACHE_KEY, dataResponse, DEFAULT_REDIS_CACHE);
    return res.standardResponse(dataResponse, 'Data fetch successfully');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching:', error.message);
      return res.standardResponse(null, error.message, 500);
    }
  } finally {
    if (page) {
      await page
        .close()
        .catch((err) => console.error('Error closing page:', err));
    }
    releasePageSlot();
  }
};
