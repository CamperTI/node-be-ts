import { Request, Response, NextFunction } from "express";
import * as cheerio from "cheerio";
import type { Page } from "puppeteer";
import {
  launchBrowser,
  createPage,
  navigateTo,
  acquirePageSlot,
  releasePageSlot,
} from "../config/puppeteer";

const url = "https://dividends.my/aeon-6599/"; //'https://dividends.my/maybank-1155/';

var dataResponse: any[] = [];

export const dividends = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let page: Page | null = null;

  await acquirePageSlot();
  try {
    // Launch a headless browser (reuses existing instance)
    const browser = await launchBrowser();
    page = await createPage(browser);

    await navigateTo(page, url);

    const content = await page.content();
    const $ = cheerio.load(content);

    const tableList = $(`#table_3 tbody`).children();
    tableList.each((index, row) => {
      let title = $(row).find("td.column-year").text().trim();
      let dy = $(row).find("td.column-dy").text().trim();
      let cyield = $(row).find("td.column-yield").text().trim();

      let dividendModel = {
        title: title,
        dy: dy,
        yield: cyield,
      };
      title ? dataResponse.push(dividendModel) : null;
    });

    return res.standardResponse(dataResponse, "Data fetch successfully");
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching:", error.message);
    } else {
      console.error("Error fetching:", error);
    }
    return res.standardResponse(dataResponse, "Failed");
  } finally {
    if (page) {
      await page
        .close()
        .catch((err) => console.error("Error closing page:", err));
    }
    releasePageSlot();
  }
};
