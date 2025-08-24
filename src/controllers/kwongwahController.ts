import { Request, Response, NextFunction } from 'express';
import { autoScroll, createEntryObject } from '../utils/shared';
import { RedisCacheService } from '../services/RedisCacheService';
import { DEFAULT_REDIS_CACHE } from '../utils/const';
import { scrapeNewsPage } from '../utils/scrapeNewsPage';

const categoryNewsUrl =
  'https://www.kwongwah.com.my/category/%e5%9b%bd%e9%99%85%e6%96%b0%e9%97%bb/';
const listSelector = '.td_block_wrap .td-block-row';

function kwongwahMapRow($: cheerio.Root, row: cheerio.Element) {
  const title = $(row).find('.td-module-thumb a').attr('title');
  const link = $(row).find('.td-module-thumb a').attr('href');
  return title ? createEntryObject(title, link) : null;
}

export const kwongwah = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // const cacheService = new RedisCacheService();
  const CACHE_KEY = 'news:kwongwah';

  try {
    // const cached = await cacheService.get(CACHE_KEY);
    // if (cached) {
    //   return res.standardResponse(cached, 'Data fetch successfully (cache)');
    // }

    const dataResponse = await scrapeNewsPage(
      categoryNewsUrl,
      listSelector,
      kwongwahMapRow,
      autoScroll // pass autoScroll if needed
    );
    // await cacheService.set(CACHE_KEY, dataResponse, DEFAULT_REDIS_CACHE);
    return res.standardResponse(dataResponse, 'Data fetch successfully');
  } catch (error) {
    return res.standardResponse([], 'Failed');
  }
};
