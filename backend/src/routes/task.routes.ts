import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles, authorizeDepartmentScope } from '../middlewares/rbac.middleware';
import { RoleName } from '@prisma/client';

const router = Router();
const taskController = new TaskController();

router.use(authenticate);

router.get('/', taskController.getAll);
router.get('/:id', taskController.getById);

// Admin/Manager can create tasks
router.post('/', 
  authorizeRoles(RoleName.ADMIN, RoleName.MANAGER), 
  taskController.create
);

// Employee can update status/progress of their own tasks
router.put('/:taskId', 
  authorizeDepartmentScope,
  taskController.update
);

router.post('/:taskId/comments', taskController.addComment);

export default router;
