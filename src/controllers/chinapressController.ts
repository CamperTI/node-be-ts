import { Request, Response, NextFunction } from 'express';
import { createEntryObject } from '../utils/shared';
import { RedisCacheService } from '../services/RedisCacheService';
import { DEFAULT_REDIS_CACHE } from '../utils/const';
import { scrapeNewsPage } from '../utils/scrapeNewsPage';

const hotNewsUrl =
  'https://www.chinapress.com.my/%e6%9c%80%e7%83%ad%e6%96%b0%e9%97%bb/';

const categoryNewsUrl =
  'https://www.chinapress.com.my/category/%e8%b4%a2%e7%bb%8f/%e8%82%a1%e5%b8%82/';

const listSelector = '.page-inner-wrapper .hot-post-tab-listing';

function chinapressMapRow($: cheerio.Root, row: cheerio.Element) {
  const title = $(row).find('a.title').text().trim();
  const link = $(row).find('a.title').attr('href');
  const time = $(row).find('.post-meta .post_date_meta').text().trim();
  return title ? createEntryObject(title, link, time) : null;
}

export const chinapress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // const cacheService = new RedisCacheService();
  const CACHE_KEY = 'news:chinapress';
  try {
    // const cached = await cacheService.get(CACHE_KEY);
    // if (cached) {
    //   return res.standardResponse(cached, 'Data fetch successfully (cache)');
    // }

    const dataResponse = await scrapeNewsPage(
      hotNewsUrl,
      listSelector,
      chinapressMapRow
    );
    // await cacheService.set(CACHE_KEY, dataResponse, DEFAULT_REDIS_CACHE);
    return res.standardResponse(dataResponse, 'Data fetch successfully');
  } catch (error) {
    return res.standardResponse([], 'Failed');
  }
};
