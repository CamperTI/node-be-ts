import { Request, Response, NextFunction } from 'express';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

const url = 'https://dividends.my/aeon-6599/'; //'https://dividends.my/maybank-1155/';

var dataResponse: any[] = [];

export const dividends = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Launch a headless browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle2' });

    // Function to scroll to the bottom of the page
    async function autoScroll(page: any) {
      await page.evaluate(async () => {
        await new Promise<void>((resolve, reject) => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          }, 100);
        });
      });
    }

    // Scroll to the bottom to trigger lazy loading
    // await autoScroll(page);
    // Get the HTML content after all lazy-loaded data has been fetched

    const content = await page.content();
    const $ = cheerio.load(content);

    const tableList = $(`#table_3 tbody`).children();
    tableList.each(async (index, row) => {
      let title = $(row).find('td.column-year').text().trim();
      let dy = $(row).find('td.column-dy').text().trim();
      let cyield = $(row).find('td.column-yield').text().trim();

      let dividendModel = {
        title: title,
        dy: dy,
        yield: cyield,
      };
      // console.log('title', title, "dy", dy, "yield", yield);
      title ? dataResponse.push(dividendModel) : null;
    });
    await browser.close();
    return res.standardResponse(dataResponse, 'Data fetch successfully');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching:', error.message);
    } else {
      console.error('Error fetching:', error);
    }
    return res.standardResponse(dataResponse, 'Failed');
  }
};
