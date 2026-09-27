import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/rbac.middleware';
import { RoleName } from '@prisma/client';

const router = Router();
const employeeController = new EmployeeController();

router.use(authenticate);

router.get('/', authorizeRoles(RoleName.ADMIN, RoleName.MANAGER), employeeController.getAll);
router.post('/', authorizeRoles(RoleName.ADMIN), employeeController.create);
router.put('/:id', authorizeRoles(RoleName.ADMIN), employeeController.update);

export default router;
