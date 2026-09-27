import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/rbac.middleware';
import { RoleName } from '@prisma/client';

const router = Router();
const dashboardController = new DashboardController();

router.use(authenticate);
// Accessible by Admin and Manager
router.get('/summary', authorizeRoles(RoleName.ADMIN, RoleName.MANAGER), dashboardController.getSummary);

export default router;
