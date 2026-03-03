import { Request, Response, NextFunction } from 'express';

export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  const validKey = process.env.API_KEY;

  if (!validKey) {
    console.warn('[apiKeyAuth] API_KEY env var not set — blocking all requests');
    res.status(500).json({ success: false, message: 'Server misconfiguration' });
    return;
  }

  if (apiKey !== validKey) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  next();
};
