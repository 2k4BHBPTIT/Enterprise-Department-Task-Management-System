import { Request, Response } from 'express';
import { EmployeeService } from '../services/employee.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class EmployeeController {
  private employeeService = new EmployeeService();

  getAll = async (req: AuthRequest, res: Response) => {
    const employees = await this.employeeService.getAll(req.user.role.name, req.user.employee?.department_id);
    res.json({ status: 'success', data: employees });
  };

  create = async (req: Request, res: Response) => {
    const user = await this.employeeService.create({
      email: req.body.email,
      passwordString: req.body.password,
      full_name: req.body.full_name,
      role_id: req.body.role_id,
      department_id: req.body.department_id,
      position_id: req.body.position_id,
      phone: req.body.phone
    });
    res.status(201).json({ status: 'success', data: user });
  };

  update = async (req: Request, res: Response) => {
    const employee = await this.employeeService.update(req.params.id as string, {
      department_id: req.body.department_id,
      position_id: req.body.position_id
    });
    res.json({ status: 'success', data: employee });
  };
}
