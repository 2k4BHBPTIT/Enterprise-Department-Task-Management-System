import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles, authorizeDepartmentScope } from '../middlewares/rbac.middleware';
import { RoleName } from '@prisma/client';

const router = Router();
const projectController = new ProjectController();

router.use(authenticate);

router.get('/', projectController.getAll);
router.get('/:id', projectController.getById);

// Admin and Manager can create projects. 
// Manager is scoped to their department via `authorizeDepartmentScope`
router.post('/', 
  authorizeRoles(RoleName.ADMIN, RoleName.MANAGER), 
  authorizeDepartmentScope,
  projectController.create
);

router.post('/:id/members', 
  authorizeRoles(RoleName.ADMIN, RoleName.MANAGER),
  projectController.addMember
);

export default router;
