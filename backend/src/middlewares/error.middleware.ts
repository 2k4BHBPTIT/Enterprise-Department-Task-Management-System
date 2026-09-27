import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { ZodError } from 'zod';

export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors = null;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    errors = err.issues;
  } else if (err.code === 'P2002') { // Prisma Unique constraint failed
    statusCode = 409;
    message = 'Data conflict: Unique constraint failed';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token';
  } else {
    console.error('Unhandled Error:', err);
    message = err.message || message; // Output actual message in dev
  }

  res.status(statusCode).json({
    status: 'error',
    message,
    errors,
  });
};
