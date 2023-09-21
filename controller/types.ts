import { Request, Response, NextFunction } from "express";

declare module 'express-serve-static-core' {
    interface Request {
        user: { id: number };
    }
}

export type ExtendedRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;
