import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

export class AuthService {
  async login(email: string, passwordString: string) {
    if (!email || !passwordString) {
      throw new AppError('Email and password are required', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        employee: {
          include: { department: true, position: true }
        }
      }
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.is_active) {
      throw new AppError('Account is locked', 403);
    }

    const isMatch = await bcrypt.compare(passwordString, user.password);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    return { user, accessToken, refreshToken };
  }

  async refreshToken(token?: string) {
    if (!token) throw new AppError('No refresh token provided', 401);

    try {
      const decoded: any = jwt.verify(token, env.JWT_REFRESH_SECRET);
      
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user || !user.is_active) throw new AppError('Invalid user', 401);

      const accessToken = this.generateAccessToken(user.id);
      const refreshToken = this.generateRefreshToken(user.id);

      return { accessToken, refreshToken };
    } catch (error) {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  private generateAccessToken(userId: string) {
    return jwt.sign({ id: userId }, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as any
    });
  }

  private generateRefreshToken(userId: string) {
    return jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any
    });
  }
}
