import { Request, Response, NextFunction } from 'express';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { autoScroll, createEntryObject } from '../utils/shared';
import { IEntryObject } from '../types/news';

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
      .map((code) => code.trim().toUpperCase());
    var dataResponse: IEntryObject[] = [];

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    for (const stockCode of stockCodes) {
      await page.goto(`${stocksURl}/${stockCode}`, {
        waitUntil: 'networkidle2',
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
    } else {
      console.error('Error fetching:', error);
    }
  }
};
