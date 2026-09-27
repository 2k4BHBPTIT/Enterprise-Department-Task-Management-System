import { Request, Response } from 'express';
import { TaskService } from '../services/task.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../utils/AppError';

export class TaskController {
  private taskService = new TaskService();

  getAll = async (req: AuthRequest, res: Response) => {
    const tasks = await this.taskService.getAll(
      req.user.role.name,
      req.user.employee?.id,
      req.user.employee?.department_id
    );
    res.json({ status: 'success', data: tasks });
  };

  getById = async (req: Request, res: Response) => {
    const task = await this.taskService.getById(req.params.id as string);
    res.json({ status: 'success', data: task });
  };

  create = async (req: Request, res: Response) => {
    const task = await this.taskService.create(req.body);
    res.status(201).json({ status: 'success', data: task });
  };

  update = async (req: AuthRequest, res: Response) => {
    if (!req.user.employee) throw new AppError('Only employees can update tasks', 400);
    const task = await this.taskService.update(req.params.taskId as string, req.user.employee.id, req.body);
    res.json({ status: 'success', data: task });
  };

  addComment = async (req: AuthRequest, res: Response) => {
    if (!req.user.employee) throw new AppError('Only employees can comment', 400);
    const comment = await this.taskService.addComment(req.params.taskId as string, req.user.employee.id, req.body.content);
    res.status(201).json({ status: 'success', data: comment });
  };
}
