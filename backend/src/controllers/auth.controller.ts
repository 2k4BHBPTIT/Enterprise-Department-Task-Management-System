import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { env } from '../config/env';
import { AuthRequest } from '../middlewares/auth.middleware';

export class AuthController {
  private authService = new AuthService();

  login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    const { user, accessToken, refreshToken } = await this.authService.login(email, password);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role.name,
          employee: user.employee
        },
        accessToken
      }
    });
  };

  refreshToken = async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken;
    const { accessToken, refreshToken } = await this.authService.refreshToken(token);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      status: 'success',
      data: { accessToken }
    });
  };

  logout = async (req: Request, res: Response) => {
    res.clearCookie('refreshToken');
    res.json({ status: 'success', message: 'Logged out successfully' });
  };

  getMe = async (req: AuthRequest, res: Response) => {
    const user = req.user;
    res.json({
      status: 'success',
      data: {
        id: user.id,
        email: user.email,
        role: user.role.name,
        employee: user.employee
      }
    });
  };
}
