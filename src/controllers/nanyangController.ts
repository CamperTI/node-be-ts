import { Request, Response, NextFunction } from 'express';
import { createEntryObject } from '../utils/shared';
import { RedisCacheService } from '../services/RedisCacheService';
import { scrapeNewsPage } from '../utils/scrapeNewsPage';
import { DEFAULT_REDIS_CACHE } from '../utils/const';

const url = 'https://www.enanyang.my/';

const listSelector = '#article-listing-wrapper .home-page-articles';

function mapRow($: cheerio.Root, row: cheerio.Element) {
  let title = $(row).find('a').text().trim();
  let link = $(row).find('a').attr('href');
  let time = $(row).find('.metadata .time').text().trim();
  return title ? createEntryObject(title, link, time) : null;
}

export const nanyang = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // const cacheService = new RedisCacheService();
    const CACHE_KEY = 'news:nanyang';

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
