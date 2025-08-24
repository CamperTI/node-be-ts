import { Request, Response, NextFunction } from 'express';
import { createEntryObject } from '../utils/shared';
import { IEntryObject } from '../types/news';
import { DEFAULT_REDIS_CACHE } from '../utils/const';
import { RedisCacheService } from '../services/RedisCacheService';
import { scrapeNewsPage } from '../utils/scrapeNewsPage';

const categoryNewsUrl = 'https://guangming.com.my/topic/%e7%8b%ac%e5%ae%b6';

const listSelector = '.mag-box-container .posts-items';

function mapRow($: cheerio.Root, row: cheerio.Element) {
  let title = $(row).find('a.post-thumb').attr('aria-label');
  let link = $(row).find('a.post-thumb').attr('href');
  let time = $(row).find('.post-meta .meta-item').text();
  return title ? createEntryObject(title, link, time) : null;
}

export const guangming = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // const cacheService = new RedisCacheService();
  const CACHE_KEY = 'news:guangming';

  try {
    // const cached = await cacheService.get<IEntryObject[]>(CACHE_KEY);
    // if (cached) {
    //   return res.standardResponse(cached, 'Data fetch successfully (cache)');
    // }

    const dataResponse = await scrapeNewsPage(
      categoryNewsUrl,
      listSelector,
      mapRow
    );

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
