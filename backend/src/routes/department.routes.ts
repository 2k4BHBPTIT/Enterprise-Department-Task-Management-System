import { Router } from 'express';
import { DepartmentController } from '../controllers/department.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/rbac.middleware';
import { RoleName } from '@prisma/client';

const router = Router();
const deptController = new DepartmentController();

router.use(authenticate);

router.get('/', deptController.getAll);
router.post('/', authorizeRoles(RoleName.ADMIN), deptController.create);
router.put('/:id', authorizeRoles(RoleName.ADMIN), deptController.update);
router.delete('/:id', authorizeRoles(RoleName.ADMIN), deptController.delete);
router.post('/:id/manager', authorizeRoles(RoleName.ADMIN), deptController.assignManager);

export default router;
