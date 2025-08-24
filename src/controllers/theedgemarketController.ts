import { Request, Response, NextFunction } from 'express';
import { RedisCacheService } from '../services/RedisCacheService';
import { createEntryObject } from '../utils/shared';
import { scrapeNewsPage } from '../utils/scrapeNewsPage';
import { DEFAULT_REDIS_CACHE } from '../utils/const';

const url = 'https://theedgemalaysia.com/categories/news';

const listSelector =
  '.NewsList_newsListWrap__yFGqL .NewsList_newsListContent__4UpiN';

function mapRow($: cheerio.Root, row: cheerio.Element) {
  let title = $(row).find('.NewsList_newsListItemHead__dg7eK').text().trim();
  let link = $(row).find('.NewsList_newsListText__hstO7 a').attr('href');
  let time = $(row).find('.NewsList_infoNewsListSub__Ui2_Z span').text();
  return title ? createEntryObject(title, link, time) : null;
}

export const theedgemarket = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // const cacheService = new RedisCacheService();
    const CACHE_KEY = 'news:theedgemarket';

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
    } else {
      console.error('Error fetching:', error);
    }
  }
};
