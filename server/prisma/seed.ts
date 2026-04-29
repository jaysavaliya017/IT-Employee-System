import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...\n');

  const companies = [
    { name: 'CodeQuantum Technologies Private Limited', code: 'CQTPL' },
    { name: 'ProAttend Technologies', code: 'PROATTEND' },
    { name: 'Nexora Systems', code: 'NEXORA' },
    { name: 'Asterbyte Solutions', code: 'ASTERBYTE' },
    { name: 'Infinix Labs', code: 'INFINIX' },
    { name: 'Vertexon Tech', code: 'VERTEXON' },
    { name: 'CloudBridge Innovations', code: 'CLOUDBRIDGE' },
    { name: 'DevSphere InfoTech', code: 'DEVSPHERE' },
    { name: 'PixelRoot Digital', code: 'PIXELROOT' },
    { name: 'BlueOrbit Software', code: 'BLUEORBIT' },
  ];

  await prisma.company.createMany({
    data: companies,
    skipDuplicates: true,
  });

  const defaultCompany = await prisma.company.findUnique({
    where: { code: 'PROATTEND' },
  });

  if (!defaultCompany) {
    throw new Error('Default company PROATTEND was not created');
  }

  const otherCompanies = await prisma.company.findMany({
    where: {
      code: {
        not: 'PROATTEND',
      },
    },
    orderBy: { name: 'asc' },
  });

  console.log('✓ Companies created');

  // Create Departments
  const itDepartment = await prisma.department.create({
    data: {
      name: 'Information Technology',
      description: 'IT Department - Software Development & Infrastructure',
    },
  });

  const hrDepartment = await prisma.department.create({
    data: {
      name: 'Human Resources',
      description: 'HR Department - People Operations & Recruitment',
    },
  });

  console.log('✓ Departments created');

  // Create Shifts
  const morningShift = await prisma.shift.create({
    data: {
      name: 'Morning Shift',
      startTime: '09:00',
      endTime: '18:00',
      graceMinutes: 15,
      halfDayHours: 4,
      fullDayHours: 8,
    },
  });

  const eveningShift = await prisma.shift.create({
    data: {
      name: 'Evening Shift',
      startTime: '14:00',
      endTime: '23:00',
      graceMinutes: 15,
      halfDayHours: 4,
      fullDayHours: 8,
    },
  });

  console.log('✓ Shifts created');

  // Create Leave Types
  const paidLeave = await prisma.leaveType.create({
    data: {
      name: 'Paid Leave',
      isPaid: true,
      defaultBalance: 12,
    },
  });

  const sickLeave = await prisma.leaveType.create({
    data: {
      name: 'Sick Leave',
      isPaid: true,
      defaultBalance: 10,
    },
  });

  const casualLeave = await prisma.leaveType.create({
    data: {
      name: 'Casual Leave',
      isPaid: true,
      defaultBalance: 6,
    },
  });

  const unpaidLeave = await prisma.leaveType.create({
    data: {
      name: 'Unpaid Leave',
      isPaid: false,
      defaultBalance: 0,
    },
  });

  const workFromHome = await prisma.leaveType.create({
    data: {
      name: 'Work From Home',
      isPaid: true,
      defaultBalance: 24,
    },
  });

  console.log('✓ Leave types created');

  // Create Super Admin
  const superAdminPassword = await bcrypt.hash('SuperAdmin@123', 10);
  const superAdmin = await prisma.user.create({
    data: {
      employeeCode: 'SA001',
      fullName: 'Super Admin',
      email: 'superadmin@proattend.com',
      passwordHash: superAdminPassword,
      companyId: defaultCompany.id,
      phone: '+1-555-0100',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      departmentId: itDepartment.id,
      designation: 'System Administrator',
      shiftId: morningShift.id,
      joiningDate: new Date('2020-01-15'),
    },
  });

  console.log('✓ Super Admin created');

  // Create HR/Admin
  const hrPassword = await bcrypt.hash('Admin@123', 10);
  const hrAdmin = await prisma.user.create({
    data: {
      employeeCode: 'HR001',
      fullName: 'Sarah Johnson',
      email: 'admin@proattend.com',
      passwordHash: hrPassword,
      companyId: defaultCompany.id,
      phone: '+1-555-0101',
      role: 'ADMIN',
      status: 'ACTIVE',
      departmentId: hrDepartment.id,
      designation: 'HR Manager',
      shiftId: morningShift.id,
      joiningDate: new Date('2021-03-20'),
    },
  });

  console.log('✓ HR/Admin created');

  // Create Manager
  const managerPassword = await bcrypt.hash('Manager@123', 10);
  const manager = await prisma.user.create({
    data: {
      employeeCode: 'MG001',
      fullName: 'Jignesh Patel',
      email: 'manager@proattend.com',
      passwordHash: managerPassword,
      companyId: defaultCompany.id,
      phone: '+1-555-0102',
      role: 'MANAGER',
      status: 'ACTIVE',
      departmentId: itDepartment.id,
      designation: 'Engineering Manager',
      shiftId: morningShift.id,
      joiningDate: new Date('2021-06-10'),
    },
  });

  console.log('✓ Manager created');

  // Create Team Leader
  const teamLeaderPassword = await bcrypt.hash('Leader@123', 10);
  const teamLeader = await prisma.user.create({
    data: {
      employeeCode: 'TL001',
      fullName: 'mayank Dobariya',
      email: 'teamleader@proattend.com',
      passwordHash: teamLeaderPassword,
      companyId: defaultCompany.id,
      phone: '+1-555-0103',
      role: 'TEAM_LEADER',
      status: 'ACTIVE',
      departmentId: itDepartment.id,
      designation: 'Team Lead',
      shiftId: morningShift.id,
      managerId: manager.id,
      joiningDate: new Date('2022-01-15'),
    },
  });

  console.log('✓ Team Leader created');

  // Create Employees
  const employeePassword = await bcrypt.hash('Employee@123', 10);

  const employee1 = await prisma.user.create({
    data: {
      employeeCode: 'EMP001',
      fullName: 'Jay Savaliya',
      email: 'employee@proattend.com',
      passwordHash: employeePassword,
      companyId: defaultCompany.id,
      phone: '+1-555-0104',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      departmentId: itDepartment.id,
      designation: 'Software Engineer',
      shiftId: morningShift.id,
      managerId: manager.id,
      teamLeaderId: teamLeader.id,
      joiningDate: new Date('2022-04-01'),
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      employeeCode: 'EMP002',
      fullName: 'Suresh Jadav',
      email: 'lisa@proattend.com',
      passwordHash: employeePassword,
      companyId: defaultCompany.id,
      phone: '+1-555-0105',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      departmentId: itDepartment.id,
      designation: 'Frontend Developer',
      shiftId: morningShift.id,
      managerId: manager.id,
      teamLeaderId: teamLeader.id,
      joiningDate: new Date('2022-06-15'),
    },
  });

  const employee3 = await prisma.user.create({
    data: {
      employeeCode: 'EMP003',
      fullName: 'Krunal Bhatt',
      email: 'robert@proattend.com',
      passwordHash: employeePassword,
      companyId: defaultCompany.id,
      phone: '+1-555-0106',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      departmentId: itDepartment.id,
      designation: 'Backend Developer',
      shiftId: morningShift.id,
      managerId: manager.id,
      teamLeaderId: teamLeader.id,
      joiningDate: new Date('2022-08-20'),
    },
  });

  const employee4 = await prisma.user.create({
    data: {
      employeeCode: 'EMP004',
      fullName: 'Mayuri Jagani',
      email: 'amanda@proattend.com',
      passwordHash: employeePassword,
      companyId: defaultCompany.id,
      phone: '+1-555-0107',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      departmentId: itDepartment.id,
      designation: 'UI/UX Designer',
      shiftId: morningShift.id,
      managerId: manager.id,
      teamLeaderId: teamLeader.id,
      joiningDate: new Date('2023-01-10'),
    },
  });

  const employee5 = await prisma.user.create({
    data: {
      employeeCode: 'EMP005',
      fullName: 'Jatin Solanki',
      email: 'david@proattend.com',
      passwordHash: employeePassword,
      companyId: defaultCompany.id,
      phone: '+1-555-0108',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      departmentId: itDepartment.id,
      designation: 'QA Engineer',
      shiftId: morningShift.id,
      managerId: manager.id,
      teamLeaderId: teamLeader.id,
      joiningDate: new Date('2023-03-25'),
    },
  });

  const companyAdminPassword = await bcrypt.hash('Admin@123', 10);
  const companyManagerPassword = await bcrypt.hash('Manager@123', 10);

  const otherCompanyUsers = [];

  for (const company of otherCompanies) {
    const prefix = company.code.slice(0, 4).toUpperCase();

    const companyAdmin = await prisma.user.upsert({
      where: { email: `admin.${company.code.toLowerCase()}@company.com` },
      update: {},
      create: {
        employeeCode: `${prefix}A01`,
        fullName: `${company.name} Admin`,
        email: `admin.${company.code.toLowerCase()}@company.com`,
        passwordHash: companyAdminPassword,
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

    const companyManager = await prisma.user.upsert({
      where: { email: `manager.${company.code.toLowerCase()}@company.com` },
      update: {},
      create: {
        employeeCode: `${prefix}M01`,
        fullName: `${company.name} Manager`,
        email: `manager.${company.code.toLowerCase()}@company.com`,
        passwordHash: companyManagerPassword,
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

    const companyEmployee = await prisma.user.upsert({
      where: { email: `employee.${company.code.toLowerCase()}@company.com` },
      update: {},
      create: {
        employeeCode: `${prefix}E01`,
        fullName: `${company.name} Employee`,
        email: `employee.${company.code.toLowerCase()}@company.com`,
        passwordHash: employeePassword,
        companyId: company.id,
        phone: '+1-555-1003',
        role: 'EMPLOYEE',
        status: 'ACTIVE',
        departmentId: itDepartment.id,
        designation: 'Software Developer',
        shiftId: morningShift.id,
        managerId: companyManager.id,
        joiningDate: new Date('2023-02-01'),
      },
    });

    otherCompanyUsers.push(companyAdmin, companyManager, companyEmployee);
  }

  console.log('✓ Employees created');

  // Create Teams
  const developmentTeam = await prisma.team.create({
    data: {
      name: 'Development Team',
      teamLeaderId: teamLeader.id,
      departmentId: itDepartment.id,
    },
  });

  const qaTeam = await prisma.team.create({
    data: {
      name: 'QA Team',
      teamLeaderId: teamLeader.id,
      departmentId: itDepartment.id,
    },
  });

  console.log('✓ Teams created');

  // Add team members
  await prisma.teamMember.createMany({
    data: [
      { teamId: developmentTeam.id, userId: employee1.id },
      { teamId: developmentTeam.id, userId: employee2.id },
      { teamId: developmentTeam.id, userId: employee3.id },
      { teamId: developmentTeam.id, userId: employee4.id },
      { teamId: qaTeam.id, userId: employee5.id },
    ],
  });

  console.log('✓ Team members added');

  // Create Leave Approval Setting
  await prisma.leaveApprovalSetting.create({
    data: {
      canTeamLeaderApproveLeave: true,
    },
  });

  console.log('✓ Leave approval settings created');

  // Create Holidays
  const holidays = [
    { title: "New Year's Day", date: new Date('2024-01-01'), description: 'Public Holiday' },
    { title: 'Martin Luther King Jr. Day', date: new Date('2024-01-15'), description: 'Federal Holiday' },
    { title: "President's Day", date: new Date('2024-02-19'), description: 'Federal Holiday' },
    { title: 'Good Friday', date: new Date('2024-03-29'), description: 'Christian Holiday' },
    { title: 'Memorial Day', date: new Date('2024-05-27'), description: 'Federal Holiday' },
    { title: 'Independence Day', date: new Date('2024-07-04'), description: 'Federal Holiday' },
    { title: 'Labor Day', date: new Date('2024-09-02'), description: 'Federal Holiday' },
    { title: 'Thanksgiving Day', date: new Date('2024-11-28'), description: 'Federal Holiday' },
    { title: 'Christmas Day', date: new Date('2024-12-25'), description: 'Federal Holiday' },
    { title: 'Company Foundation Day', date: new Date('2024-03-15'), description: 'Company Holiday' },
    { title: 'Annual Team Outing', date: new Date('2024-06-15'), description: 'Company Event' },
  ];

  for (const holiday of holidays) {
    await prisma.holiday.create({ data: holiday });
  }

  console.log('✓ Holidays created');

  // Create Announcements
  await prisma.announcement.create({
    data: {
      title: 'Welcome to ProAttend',
      message: 'Welcome to our new attendance management system. Please ensure you punch in/out daily.',
      createdBy: hrAdmin.id,
    },
  });

  await prisma.announcement.create({
    data: {
      title: 'Policy Update',
      message: 'Starting next month, all employees must submit leave requests at least 3 days in advance.',
      createdBy: hrAdmin.id,
    },
  });

  console.log('✓ Announcements created');

  // Create Leave Balances for all employees
  const currentYear = new Date().getFullYear();
  const allEmployees = [
    superAdmin,
    hrAdmin,
    manager,
    teamLeader,
    employee1,
    employee2,
    employee3,
    employee4,
    employee5,
    ...otherCompanyUsers,
  ];
  const leaveTypes = [paidLeave, sickLeave, casualLeave, unpaidLeave, workFromHome];

  for (const emp of allEmployees) {
    for (const lt of leaveTypes) {
      await prisma.leaveBalance.create({
        data: {
          userId: emp.id,
          leaveTypeId: lt.id,
          totalLeaves: lt.defaultBalance,
          usedLeaves: 0,
          remainingLeaves: lt.defaultBalance,
          year: currentYear,
        },
      });
    }
  }

  console.log('✓ Leave balances created for all employees');

  // Create Sample Attendance Records
  const today = new Date();
  const employees = [employee1, employee2, employee3, employee4, employee5];

  // Create attendance for the past 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    for (const emp of employees) {
      const punchInTime = new Date(date);
      punchInTime.setHours(9 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 30), 0, 0);

      const punchOutTime = new Date(date);
      punchOutTime.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);

      const totalHours = (punchOutTime.getTime() - punchInTime.getTime()) / (1000 * 60 * 60);

      await prisma.attendance.create({
        data: {
          userId: emp.id,
          date,
          punchInTime,
          punchOutTime,
          totalHours,
          netHours: totalHours - 1, // subtracting lunch break
          status: totalHours >= 8 ? 'PRESENT' : 'HALF_DAY',
          isLate: punchInTime.getHours() > 9 || (punchInTime.getHours() === 9 && punchInTime.getMinutes() > 15),
          overtimeHours: totalHours > 8 ? totalHours - 8 : 0,
        },
      });
    }
  }

  console.log('✓ Sample attendance records created');

  // Create Sample Leave Requests
  const leaveRequest1 = await prisma.leaveRequest.create({
    data: {
      userId: employee1.id,
      leaveTypeId: paidLeave.id,
      fromDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5),
      toDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7),
      totalDays: 3,
      reason: 'Family vacation',
      status: 'PENDING',
    },
  });

  const leaveRequest2 = await prisma.leaveRequest.create({
    data: {
      userId: employee2.id,
      leaveTypeId: sickLeave.id,
      fromDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3),
      toDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2),
      totalDays: 2,
      reason: 'Medical appointment',
      status: 'APPROVED',
      approvedBy: hrAdmin.id,
    },
  });

  const leaveRequest3 = await prisma.leaveRequest.create({
    data: {
      userId: employee3.id,
      leaveTypeId: casualLeave.id,
      fromDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5),
      toDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 4),
      totalDays: 2,
      reason: 'Personal work',
      status: 'REJECTED',
      rejectedBy: hrAdmin.id,
      rejectionReason: 'Insufficient notice period',
    },
  });

  console.log('✓ Sample leave requests created');

  console.log('\n========================================');
  console.log('  Database seed completed successfully!');
  console.log('========================================\n');
  console.log('\nLogin Credentials:\n');
  console.log('  Super Admin:');
  console.log('    Email: superadmin@proattend.com');
  console.log('    Password: SuperAdmin@123');
  console.log('\n  HR/Admin:');
  console.log('    Email: admin@proattend.com');
  console.log('    Password: Admin@123');
  console.log('\n  Manager:');
  console.log('    Email: manager@proattend.com');
  console.log('    Password: Manager@123');
  console.log('\n  Team Leader:');
  console.log('    Email: teamleader@proattend.com');
  console.log('    Password: Leader@123');
  console.log('\n  Employee:');
  console.log('    Email: employee@proattend.com');
  console.log('    Password: Employee@123');
  console.log('\n========================================\n');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
