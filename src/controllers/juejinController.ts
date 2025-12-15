import { Request, Response, NextFunction } from 'express';
import { createEntryObject } from '../utils/shared';
import { RedisCacheService } from '../services/RedisCacheService';
import { DEFAULT_REDIS_CACHE } from '../utils/const';
import { scrapeNewsPage } from '../utils/scrapeNewsPage';

const url = 'https://juejin.cn/frontend';

const listSelector = '.entry-list.list';

function mapRow($: cheerio.Root, row: cheerio.Element) {
  const title = $(row).find('a.jj-link.title').text().trim();
  const link = $(row).find('a.jj-link.title').attr('href');
  const time = $(row).find('.post-meta .post_date_meta').text().trim();
  return title
    ? createEntryObject(title, `https://juejin.cn${link}`, time)
    : null;
}

export const juejin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // const cacheService = new RedisCacheService();
  const CACHE_KEY = 'news:juejin';
  try {
    // const cached = await cacheService.get(CACHE_KEY);
    // if (cached) {
    //   return res.standardResponse(cached, 'Data fetch successfully (cache)');
    // }

    const dataResponse = await scrapeNewsPage(url, listSelector, mapRow);
    // await cacheService.set(CACHE_KEY, dataResponse, DEFAULT_REDIS_CACHE);
    return res.standardResponse(dataResponse, 'Data fetch successfully');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching:', error.message);
      return res.standardResponse(null, error.message, 500);
    }
  }
};
