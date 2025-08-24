import { Request, Response, NextFunction } from 'express';
import { createEntryObject } from '../utils/shared';
import { RedisCacheService } from '../services/RedisCacheService';
import { DEFAULT_REDIS_CACHE } from '../utils/const';
import { scapeTicketmasterPage, scrapeNewsPage } from '../utils/scrapeNewsPage';

const url = 'https://ticketmaster.sg/ticket/area/25sg_blackpink/2560';

const listSelector = '#mapSelectArea';

function mapRow($: cheerio.Root, row: cheerio.Element) {
  const title = $(row).find('#waitMsg').text().trim();
  const link = $(row).find('a.title').attr('href');
  const time = $(row).find('#seatmapEventName').text().trim();
  return title ? createEntryObject(title, link, time) : null;
}

export const ticketmaster = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // const cacheService = new RedisCacheService();
  const CACHE_KEY = 'ticket:ticketmaster';
  try {
    // const cached = await cacheService.get(CACHE_KEY);
    // if (cached) {
    //   return res.standardResponse(cached, 'Data fetch successfully (cache)');
    // }

    const dataResponse = await scapeTicketmasterPage(url, listSelector, mapRow);
    // await cacheService.set(CACHE_KEY, dataResponse, DEFAULT_REDIS_CACHE);
    return res.standardResponse(dataResponse, 'Data fetch successfully');
  } catch (error) {
    return res.standardResponse([], 'Failed');
  }
};
