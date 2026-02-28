import { Request, Response, NextFunction } from 'express';
import * as cheerio from 'cheerio';
import type { Page } from 'puppeteer';
import {
  launchBrowser,
  createPage,
  acquirePageSlot,
  releasePageSlot,
} from '../config/puppeteer';

const STASHAWAY_FD_URL =
  'https://www.stashaway.my/r/malaysia-fixed-deposit-rates';

export interface IFixedDepositRate {
  bank: string;
  product: string;
  tenure: string;
  rate: string;
  minDeposit: string;
  type: 'promotional' | 'board';
}

export const getFixedDepositRates = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let page: Page | null = null;

  await acquirePageSlot();
  try {
    const browser = await launchBrowser();
    page = await createPage(browser);

    // StashAway uses React/JS rendering — wait for network idle so tables load
    await page.goto(STASHAWAY_FD_URL, {
      waitUntil: 'networkidle2',
      timeout: 120000,
    });

    // Wait for a table or rate element to appear
    await page
      .waitForSelector('table', { timeout: 30000 })
      .catch(() => console.warn('No <table> found, parsing whatever rendered'));

    const content = await page.content();
    const $ = cheerio.load(content);

    const rates: IFixedDepositRate[] = [];

    // Parse all tables on the page
    $('table').each((_, table) => {
      const headers: string[] = [];

      // Extract column headers
      $(table)
        .find('thead tr th')
        .each((_, th) => {
          headers.push($(th).text().trim());
        });

      // Determine type from surrounding heading/caption
      const sectionHeading = $(table)
        .closest('section, div')
        .find('h1, h2, h3, h4')
        .first()
        .text()
        .toLowerCase();
      const isPromo =
        sectionHeading.includes('promot') ||
        sectionHeading.includes('campaign');

      // Extract each row
      $(table)
        .find('tbody tr')
        .each((_, tr) => {
          const cells: string[] = [];
          $(tr)
            .find('td')
            .each((_, td) => {
              cells.push($(td).text().trim());
            });

          if (cells.length === 0) return;

          // Map cells to known fields using header names when available,
          // otherwise fall back to positional mapping
          const get = (keywords: string[], fallbackIndex: number): string => {
            if (headers.length > 0) {
              const idx = headers.findIndex((h) =>
                keywords.some((k) => h.toLowerCase().includes(k)),
              );
              return idx !== -1
                ? (cells[idx] ?? '')
                : (cells[fallbackIndex] ?? '');
            }
            return cells[fallbackIndex] ?? '';
          };

          const bank = get(['bank', 'institution', 'issuer'], 0);
          const product = get(['product', 'name', 'account'], 1);
          const tenure = get(['tenure', 'period', 'month', 'duration'], 2);
          const rate = get(['rate', 'interest', '%', 'p.a'], 3);
          const minDeposit = get(['min', 'minimum', 'deposit'], 4);

          if (bank || rate) {
            rates.push({
              bank,
              product,
              tenure,
              rate,
              minDeposit,
              type: isPromo ? 'promotional' : 'board',
            });
          }
        });
    });

    if (rates.length === 0) {
      return res.standardResponse(
        null,
        'No rate data found — the page structure may have changed',
        404,
      );
    }

    // Find best deal: highest numeric rate
    const parseRate = (r: string): number => {
      const match = r.match(/([\d.]+)/);
      return match ? parseFloat(match[1]) : 0;
    };

    const best = rates.reduce((prev, curr) =>
      parseRate(curr.rate) > parseRate(prev.rate) ? curr : prev,
    );

    return res.standardResponse(
      { rates, best, total: rates.length },
      'Fixed deposit rates fetched successfully',
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching fixed deposit rates:', error.message);
      return res.standardResponse(null, error.message, 500);
    }
  } finally {
    if (page) {
      await page
        .close()
        .catch((err) => console.error('Error closing page:', err));
    }
    releasePageSlot();
  }
};
