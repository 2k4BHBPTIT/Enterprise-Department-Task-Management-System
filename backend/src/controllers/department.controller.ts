import { Request, Response } from 'express';
import { DepartmentService } from '../services/department.service';

export class DepartmentController {
  private deptService = new DepartmentService();

  getAll = async (req: Request, res: Response) => {
    const depts = await this.deptService.getAll();
    res.json({ status: 'success', data: depts });
  };

  create = async (req: Request, res: Response) => {
    const dept = await this.deptService.create(req.body.name);
    res.status(201).json({ status: 'success', data: dept });
  };

  update = async (req: Request, res: Response) => {
    const dept = await this.deptService.update(req.params.id as string, req.body.name);
    res.json({ status: 'success', data: dept });
  };

  delete = async (req: Request, res: Response) => {
    await this.deptService.delete(req.params.id as string);
    res.json({ status: 'success', message: 'Deleted successfully' });
  };

  assignManager = async (req: Request, res: Response) => {
    const dept = await this.deptService.assignManager(req.params.id as string, req.body.employee_id);
    res.json({ status: 'success', data: dept });
  };
}
