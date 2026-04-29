import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany({
    where: {
      code: {
        not: 'PROATTEND',
      },
    },
    orderBy: { name: 'asc' },
  });

  const itDepartment = await prisma.department.findFirst({
    where: { name: 'Information Technology' },
  });
  const hrDepartment = await prisma.department.findFirst({
    where: { name: 'Human Resources' },
  });
  const morningShift = await prisma.shift.findFirst({
    where: { name: 'Morning Shift' },
  });

  if (!itDepartment || !hrDepartment || !morningShift) {
    throw new Error('Required master data not found');
  }

  const adminHash = await bcrypt.hash('Admin@123', 10);
  const managerHash = await bcrypt.hash('Manager@123', 10);
  const employeeHash = await bcrypt.hash('Employee@123', 10);
  const leaveTypes = await prisma.leaveType.findMany();
  const year = new Date().getFullYear();

  for (const company of companies) {
    const prefix = company.code.slice(0, 4).toUpperCase();

    const admin = await prisma.user.upsert({
      where: { email: `admin.${company.code.toLowerCase()}@company.com` },
      update: {},
      create: {
        employeeCode: `${prefix}A01`,
        fullName: `${company.name} Admin`,
        email: `admin.${company.code.toLowerCase()}@company.com`,
        passwordHash: adminHash,
        companyId: company.id,
        phone: '+1-555-1001',
        role: 'ADMIN',
        status: 'ACTIVE',
        departmentId: hrDepartment.id,
        designation: 'Company Admin',
        shiftId: morningShift.id,
        joiningDate: new Date('2023-01-02'),
      },
    });

    const manager = await prisma.user.upsert({
      where: { email: `manager.${company.code.toLowerCase()}@company.com` },
      update: {},
      create: {
        employeeCode: `${prefix}M01`,
        fullName: `${company.name} Manager`,
        email: `manager.${company.code.toLowerCase()}@company.com`,
        passwordHash: managerHash,
        companyId: company.id,
        phone: '+1-555-1002',
        role: 'MANAGER',
        status: 'ACTIVE',
        departmentId: itDepartment.id,
        designation: 'Engineering Manager',
        shiftId: morningShift.id,
        joiningDate: new Date('2023-01-10'),
      },
    });

    const employee = await prisma.user.upsert({
      where: { email: `employee.${company.code.toLowerCase()}@company.com` },
      update: {},
      create: {
        employeeCode: `${prefix}E01`,
        fullName: `${company.name} Employee`,
        email: `employee.${company.code.toLowerCase()}@company.com`,
        passwordHash: employeeHash,
        companyId: company.id,
        phone: '+1-555-1003',
        role: 'EMPLOYEE',
        status: 'ACTIVE',
        departmentId: itDepartment.id,
        designation: 'Software Developer',
        shiftId: morningShift.id,
        managerId: manager.id,
        joiningDate: new Date('2023-02-01'),
      },
    });

    for (const user of [admin, manager, employee]) {
      for (const leaveType of leaveTypes) {
        await prisma.leaveBalance.upsert({
          where: {
            userId_leaveTypeId_year: {
              userId: user.id,
              leaveTypeId: leaveType.id,
              year,
            },
          },
          update: {},
          create: {
            userId: user.id,
            leaveTypeId: leaveType.id,
            totalLeaves: leaveType.defaultBalance,
            usedLeaves: 0,
            remainingLeaves: leaveType.defaultBalance,
            year,
          },
        });
      }
    }
  }

  console.log(`Created or verified sample users for ${companies.length} companies.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
