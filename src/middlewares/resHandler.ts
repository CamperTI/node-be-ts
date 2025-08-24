import { Response, Request, NextFunction } from 'express';
import { StandardResponse } from '../types/response';

// Extend the Response interface to include the custom method
declare module 'express-serve-static-core' {
  interface Response {
    standardResponse: (data: any, message: string, statusCode?: number) => void;
  }
}

// Middleware to add the standardResponse method
export const resHandler = (req: Request, res: Response, next: NextFunction) => {
  res.standardResponse = <T = any>(
    data: T,
    message: string,
    statusCode: number = 200
  ) => {
    const response: StandardResponse<T> = {
      success: statusCode >= 200 && statusCode < 300,
      message,
      data,
    };
    res.status(statusCode).json(response);
  };
  next();
};
