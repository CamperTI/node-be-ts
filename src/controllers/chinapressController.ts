import { Request, Response, NextFunction } from "express";
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { createEntryObject } from "../utils/shared";
import { RedisCacheService } from "../services/RedisCacheService";
import { DEFAULT_REDIS_CACHE } from "../utils/const";
import { scrapeNewsPage } from "../utils/scrapeNewsPage";

type CheerioAPI = ReturnType<typeof cheerio.load>;

const hotNewsUrl =
  "https://www.chinapress.com.my/%e6%9c%80%e7%83%ad%e6%96%b0%e9%97%bb/";

const categoryNewsUrl =
  "https://www.chinapress.com.my/category/%e8%b4%a2%e7%bb%8f/%e8%82%a1%e5%b8%82/";

const listSelector = ".page-inner-wrapper .hot-post-tab-listing";

function chinapressMapRow($: CheerioAPI, row: AnyNode) {
  const title = $(row).find("a.title").text().trim();
  const link = $(row).find("a.title").attr("href");
  const time = $(row).find(".post-meta .post_date_meta").text().trim();
  return title ? createEntryObject(title, link, time) : null;
}

export const chinapress = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const cacheService = new RedisCacheService();
  const CACHE_KEY = "news:chinapress";
  try {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return res.standardResponse(cached, "Data fetch successfully (cache)");
    }

    const dataResponse = await scrapeNewsPage(
      hotNewsUrl,
      listSelector,
      chinapressMapRow,
      async (page) => {
        await page
          .waitForSelector(listSelector, { timeout: 30000 })
          .catch(() =>
            console.warn("Chinapress: selector not found within timeout"),
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
