import { Request, Response } from 'express';
import { ProjectService } from '../services/project.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class ProjectController {
  private projectService = new ProjectService();

  getAll = async (req: AuthRequest, res: Response) => {
    const projects = await this.projectService.getAll(
      req.user.role.name,
      req.user.employee?.id,
      req.user.employee?.department_id
    );
    res.json({ status: 'success', data: projects });
  };

  getById = async (req: Request, res: Response) => {
    const project = await this.projectService.getById(req.params.id as string);
    res.json({ status: 'success', data: project });
  };

  create = async (req: Request, res: Response) => {
    const project = await this.projectService.create(req.body);
    res.status(201).json({ status: 'success', data: project });
  };

  addMember = async (req: Request, res: Response) => {
    const member = await this.projectService.addMember(req.params.id as string, req.body.employee_id);
    res.status(201).json({ status: 'success', data: member });
  };
}
