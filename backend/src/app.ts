import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import 'express-async-errors';

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

import authRoutes from './routes/auth.routes';
import departmentRoutes from './routes/department.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import dashboardRoutes from './routes/dashboard.routes';
import employeeRoutes from './routes/employee.routes';
import { errorMiddleware } from './middlewares/error.middleware';

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/employees', employeeRoutes);

// Error Handling Middleware
app.use(errorMiddleware);

export default app;
