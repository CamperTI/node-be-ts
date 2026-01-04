import { Request, Response, NextFunction } from 'express';
import * as cheerio from 'cheerio';
import { autoScroll } from '../utils/shared';
import { IEntryObject } from '../types/news';
import { launchBrowser, createPage } from '../config/puppeteer';

const stocksURl = `https://finance.yahoo.com/quote`;

export const stocks = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stockCodesParam = req.params.stockCode || 'AAPL';
    const stockCodes = stockCodesParam
      .split(',')
      .map((code: string) => code.trim().toUpperCase());
    var dataResponse: IEntryObject[] = [];

    const browser = await launchBrowser();
    const page = await createPage(browser);

    for (const stockCode of stockCodes) {
      await page.goto(`${stocksURl}/${stockCode}`, {
        waitUntil: 'domcontentloaded',
      });
      await autoScroll(page);

      const content = await page.content();
      const $ = cheerio.load(content);

      const stockPriceText = $(
        `fin-streamer[data-symbol='${stockCode}'][data-field='regularMarketPrice']`
      ).text();

      dataResponse.push({
        title: `Stock Price: ${stockCode} - ${stockPriceText}`,
        link: `${stocksURl}/${stockCode}`,
        time: new Date().toLocaleString(),
      });
    }

    await browser.close();
    return res.standardResponse(dataResponse, 'Data fetch successfully');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching:', error.message);
      return res.standardResponse(null, error.message, 500);
    }
  }
};
