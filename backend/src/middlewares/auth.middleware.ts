import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { prisma } from '../config/db';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1] || req.cookies?.accessToken;

  if (!token) {
    throw new AppError('Unauthorized - No token provided', 401);
  }

  try {
    const decoded: any = jwt.verify(token, env.JWT_ACCESS_SECRET);
    
    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: true, employee: true }
    });

    if (!user) throw new AppError('User no longer exists', 401);
    if (!user.is_active) throw new AppError('User is locked', 403);

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
