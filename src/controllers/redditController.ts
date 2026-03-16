import { Request, Response, NextFunction } from 'express';
import { IEntryObject } from '../types/news';
import { RedisCacheService } from '../services/RedisCacheService';
import { DEFAULT_REDIS_CACHE } from '../utils/const';

const ALLOWED_SUBREDDITS = new Set([
  'SideProject',
  'Entrepreneur',
  'startups',
  'programming',
  'MachineLearning',
  'webdev',
  'technology',
  'business',
]);

const DEFAULT_SUBREDDIT = 'SideProject';

interface RedditPost {
  title: string;
  url: string;
  permalink: string;
  score: number;
  created_utc: number;
  selftext: string;
}

interface RedditApiResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
  };
}

function formatTime(utcSeconds: number): string {
  return new Date(utcSeconds * 1000).toISOString();
}

export const reddit = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const raw = req.query['subreddit'];
  const subreddit =
    typeof raw === 'string' && ALLOWED_SUBREDDITS.has(raw)
      ? raw
      : DEFAULT_SUBREDDIT;

  const cacheService = new RedisCacheService();
  const CACHE_KEY = `news:reddit:${subreddit}`;

  try {
    const cached = await cacheService.get(CACHE_KEY);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      res.standardResponse(cached, 'Data fetch successfully (cache)');
      return;
    }

    const apiUrl = `https://www.reddit.com/r/${subreddit}/top.json?limit=25&t=week`;
    const response = await fetch(apiUrl, {
      headers: { 'User-Agent': 'nodejs-cheerio-ts/1.0' },
    });

    if (!response.ok) {
      res.standardResponse(null, `Reddit API error: ${response.status}`, 502);
      return;
    }

    const json = (await response.json()) as RedditApiResponse;

    const dataResponse: IEntryObject[] = json.data.children.map(({ data }) => ({
      title: data.title,
      link: `https://www.reddit.com${data.permalink}`,
      time: formatTime(data.created_utc),
    }));

    await cacheService.set(CACHE_KEY, dataResponse, DEFAULT_REDIS_CACHE);
    res.standardResponse(dataResponse, 'Data fetch successfully');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching Reddit:', error.message);
      res.standardResponse(null, error.message, 500);
    }
  }
};
