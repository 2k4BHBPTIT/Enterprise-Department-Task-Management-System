import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class DashboardController {
  private dashboardService = new DashboardService();

  getSummary = async (req: AuthRequest, res: Response) => {
    const summary = await this.dashboardService.getSummary(
      req.user.role.name,
      req.user.employee?.department_id
    );
    res.json({ status: 'success', data: summary });
  };
}
