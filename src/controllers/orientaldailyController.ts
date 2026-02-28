import { Request, Response, NextFunction } from "express";
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { createEntryObject } from "../utils/shared";
import { IEntryObject } from "../types/news";
import { DEFAULT_REDIS_CACHE } from "../utils/const";
import { RedisCacheService } from "../services/RedisCacheService";
import { scrapeNewsPage } from "../utils/scrapeNewsPage";

type CheerioAPI = ReturnType<typeof cheerio.load>;

const categoryNewsUrl = "https://www.orientaldaily.com.my/news/nation";

const listSelector = "section.mt-3 .col-12.col-md-7.col-lg-8";

function mapRow($: CheerioAPI, row: AnyNode) {
  const title = $(row).find("a.link").attr("title");
  const link = $(row).find("a.link").attr("href");
  const time = $(row).find("time").attr("datetime");
  return title ? createEntryObject(title, link, time) : null;
}

export const orientaldaily = async (
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const cacheService = new RedisCacheService();
  const CACHE_KEY = "news:orientaldaily";

  try {
    const cached = await cacheService.get<IEntryObject[]>(CACHE_KEY);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return res.standardResponse(cached, "Data fetch successfully (cache)");
    }

    const dataResponse = await scrapeNewsPage(
      categoryNewsUrl,
      listSelector,
      mapRow,
      async (page) => {
        await page
          .waitForSelector(listSelector, { timeout: 30000 })
          .catch(() =>
            console.warn("OrientalDaily: selector not found within timeout"),
          );
      },
    );

    await cacheService.set(CACHE_KEY, dataResponse, DEFAULT_REDIS_CACHE);
    return res.standardResponse(dataResponse, "Data fetch successfully");
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching:", error.message);
      return res.standardResponse(null, error.message, 500);
    }
  }
};
