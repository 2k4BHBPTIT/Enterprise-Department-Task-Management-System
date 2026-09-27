import { Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { AuthRequest } from './auth.middleware';
import { RoleName } from '@prisma/client';
import { prisma } from '../config/db';

export const authorizeRoles = (...allowedRoles: RoleName[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }
    
    if (!allowedRoles.includes(req.user.role.name)) {
      return next(new AppError('Forbidden - Insufficient permissions', 403));
    }
    next();
  };
};

export const authorizeDepartmentScope = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.employee) {
    return next(new AppError('Unauthorized', 401));
  }

  const { role, employee } = req.user;
  
  if (role.name === RoleName.ADMIN) {
    return next();
  }

  // Manager logic: checks if they are manipulating data in their own department
  if (role.name === RoleName.MANAGER) {
    // If it's a project creation/update
    if (req.body.department_id && req.body.department_id !== employee.department_id) {
      return next(new AppError('Forbidden - Out of department scope', 403));
    }
    
    // Check if task assignment/update belongs to their department projects
    if (req.params.taskId as string) {
      const task = await prisma.task.findUnique({
        where: { id: req.params.taskId as string },
        include: { project: true }
      });
      if (task && task.project.department_id !== employee.department_id) {
        return next(new AppError('Forbidden - Cannot modify tasks outside your department', 403));
      }
    }
    return next();
  }

  // Employee logic: can only modify their own tasks
  if (role.name === RoleName.EMPLOYEE) {
    if (req.params.taskId as string) {
      const task = await prisma.task.findUnique({
        include: { project: true },
        where: { id: req.params.taskId as string }
      });
      if (task && task.assignee_id !== employee.id) {
        return next(new AppError('Forbidden - Cannot modify tasks assigned to others', 403));
      }
    }
    return next();
  }
};
