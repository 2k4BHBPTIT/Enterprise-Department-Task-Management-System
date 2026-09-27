import { PrismaClient, RoleName } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Roles
  const adminRole = await prisma.role.upsert({
    where: { name: RoleName.ADMIN },
    update: {},
    create: { name: RoleName.ADMIN },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: RoleName.MANAGER },
    update: {},
    create: { name: RoleName.MANAGER },
  });

  const employeeRole = await prisma.role.upsert({
    where: { name: RoleName.EMPLOYEE },
    update: {},
    create: { name: RoleName.EMPLOYEE },
  });

  // 2. Positions
  const posDirector = await prisma.position.upsert({
    where: { title: 'Director' },
    update: {},
    create: { title: 'Director' },
  });

  const posManager = await prisma.position.upsert({
    where: { title: 'Manager' },
    update: {},
    create: { title: 'Manager' },
  });

  const posDev = await prisma.position.upsert({
    where: { title: 'Developer' },
    update: {},
    create: { title: 'Developer' },
  });

  // 3. Departments
  const devDept = await prisma.department.upsert({
    where: { name: 'Development' },
    update: {},
    create: { name: 'Development' },
  });

  const hrDept = await prisma.department.upsert({
    where: { name: 'Human Resources' },
    update: {},
    create: { name: 'Human Resources' },
  });

  // 4. Users & Employees
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      email: 'admin@company.com',
      password: hashedPassword,
      role_id: adminRole.id,
      employee: {
        create: {
          full_name: 'System Admin',
          position_id: posDirector.id,
        },
      },
    },
    include: { employee: true },
  });

  // Manager User
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@company.com' },
    update: {},
    create: {
      email: 'manager@company.com',
      password: hashedPassword,
      role_id: managerRole.id,
      employee: {
        create: {
          full_name: 'Dev Manager',
          position_id: posManager.id,
          department_id: devDept.id,
        },
      },
    },
    include: { employee: true },
  });

  // Assign Manager to Development Dept
  if (managerUser.employee) {
    await prisma.department.update({
      where: { id: devDept.id },
      data: { manager_id: managerUser.employee.id },
    });
  }

  // Employee User
  const empUser = await prisma.user.upsert({
    where: { email: 'employee@company.com' },
    update: {},
    create: {
      email: 'employee@company.com',
      password: hashedPassword,
      role_id: employeeRole.id,
      employee: {
        create: {
          full_name: 'Dev Employee',
          position_id: posDev.id,
          department_id: devDept.id,
        },
      },
    },
    include: { employee: true },
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
