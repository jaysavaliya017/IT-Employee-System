import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import pdfkit from 'pdfkit';
import { config } from '../config';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// Generate professional salary slip PDF
const generateSalarySlipPDF = async (salaryRecord: any, employee: any, company: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new pdfkit({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header with company info
      doc.rect(0, 0, 595.28, 120).fill('#1a365d');

      doc.fillColor('#ffffff')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text(company.name, 50, 30, { align: 'center' })
        .fontSize(10)
        .font('Helvetica')
        .text(`${company.address || ''}`, { align: 'center' })
        .text(`Email: ${company.email || ''} | Phone: ${company.phone || ''}`, { align: 'center' });

      // Salary Slip title
      doc.moveDown(2);
      doc.fillColor('#1a365d')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('SALARY SLIP', { align: 'center' });

      doc.moveDown(0.5);
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#4a5568')
        .text(`Pay Period: ${getMonthName(salaryRecord.month)} ${salaryRecord.year}`, { align: 'center' });

      // Employee details box
      doc.moveDown(1);
      const detailsY = doc.y;
      doc.rect(50, detailsY, 495, 80).stroke('#e2e8f0');

      const leftX = 60;
      const rightX = 320;
      let detailY = detailsY + 15;

      doc.fillColor('#2d3748').fontSize(10).font('Helvetica-Bold');
      doc.text('Employee Name:', leftX, detailY).font('Helvetica').text(employee.fullName, leftX + 100, detailY);
      doc.text('Employee ID:', rightX, detailY).text(employee.employeeCode, rightX + 80, detailY);

      detailY += 18;
      doc.font('Helvetica-Bold');
      doc.text('Designation:', leftX, detailY).font('Helvetica').text(employee.designation || 'N/A', leftX + 100, detailY);
      doc.font('Helvetica-Bold');
      doc.text('Department:', rightX, detailY).font('Helvetica').text(employee.department?.name || 'N/A', rightX + 80, detailY);

      detailY += 18;
      doc.font('Helvetica-Bold');
      doc.text('Payment Date:', leftX, detailY).font('Helvetica').text(salaryRecord.paymentDate ? new Date(salaryRecord.paymentDate).toLocaleDateString() : 'Pending', leftX + 100, detailY);
      doc.font('Helvetica-Bold');
      doc.text('Status:', rightX, detailY).font('Helvetica').text(salaryRecord.status, rightX + 80, detailY);

      // Earnings Section
      doc.moveDown(2);
      doc.y = detailsY + 100;
      doc.rect(50, doc.y, 495, 25).fill('#48bb78');
      doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold');
      doc.text('EARNINGS', 60, doc.y + 7);

      doc.moveDown(1);
      doc.rect(50, doc.y + 25, 495, 25).fill('#f0fff4');
      doc.fillColor('#2d3748').fontSize(10).font('Helvetica-Bold');
      doc.text('Component', 60, doc.y + 32).text('Amount (₹)', 450, doc.y + 32, { align: 'right' });

      const earnings = [
        { name: 'Basic Salary', value: salaryRecord.basicSalary },
        { name: 'House Rent Allowance (HRA)', value: salaryRecord.hra },
        { name: 'Conveyance Allowance', value: salaryRecord.conveyanceAllowance },
        { name: 'Medical Allowance', value: salaryRecord.medicalAllowance },
        { name: 'Special Allowance', value: salaryRecord.specialAllowance },
        { name: 'Other Allowances', value: salaryRecord.otherAllowances },
      ];

      let earningsY = doc.y + 50;
      doc.font('Helvetica').font('Helvetica');
      earnings.forEach((item) => {
        if (item.value > 0) {
          doc.fillColor('#4a5568').text(item.name, 60, earningsY);
          doc.text(formatCurrency(item.value), 450, earningsY, { align: 'right' });
          earningsY += 18;
        }
      });

      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').fillColor('#2d3748');
      doc.text('Total Earnings:', 60, earningsY + 5);
      doc.text(formatCurrency(salaryRecord.totalEarnings), 450, earningsY + 5, { align: 'right' });

      // Deductions Section
      earningsY += 35;
      doc.rect(50, earningsY, 495, 25).fill('#e53e3e');
      doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold');
      doc.text('DEDUCTIONS', 60, earningsY + 7);

      earningsY += 25;
      doc.rect(50, earningsY, 495, 25).fill('#fff5f5');
      doc.fillColor('#2d3748').fontSize(10).font('Helvetica-Bold');
      doc.text('Component', 60, earningsY + 7).text('Amount (₹)', 450, earningsY + 7, { align: 'right' });

      const deductions = [
        { name: 'Provident Fund (PF)', value: salaryRecord.pfDeduction },
        { name: 'Tax Deduction', value: salaryRecord.taxDeduction },
        { name: 'Professional Tax', value: salaryRecord.professionalTax },
        { name: 'Leave Deduction', value: salaryRecord.leaveDeduction },
        { name: 'Other Deductions', value: salaryRecord.otherDeductions },
      ];

      let deductionsY = earningsY + 50;
      doc.font('Helvetica');
      deductions.forEach((item) => {
        if (item.value > 0) {
          doc.fillColor('#4a5568').text(item.name, 60, deductionsY);
          doc.text(formatCurrency(item.value), 450, deductionsY, { align: 'right' });
          deductionsY += 18;
        }
      });

      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').fillColor('#2d3748');
      doc.text('Total Deductions:', 60, deductionsY + 5);
      doc.text(formatCurrency(salaryRecord.totalDeductions), 450, deductionsY + 5, { align: 'right' });

      // Net Salary
      deductionsY += 40;
      doc.rect(50, deductionsY, 495, 35).fill('#1a365d');
      doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold');
      doc.text('NET SALARY:', 60, deductionsY + 10);
      doc.text(formatCurrency(salaryRecord.netSalary), 450, deductionsY + 10, { align: 'right' });

      // Working Details
      deductionsY += 50;
      doc.rect(50, deductionsY, 495, 60).stroke('#e2e8f0');
      doc.fillColor('#2d3748').fontSize(9).font('Helvetica-Bold');
      doc.text('Working Details:', 60, deductionsY + 10);
      doc.font('Helvetica').fontSize(9);
      doc.text(`Working Days: ${salaryRecord.workingDays}  |  Paid Days: ${salaryRecord.paidDays}  |  Unpaid Days: ${salaryRecord.unpaidDays}  |  Leave Days: ${salaryRecord.leaveDays}`, 60, deductionsY + 28);

      // Footer
      const footerY = 750;
      doc.fontSize(8).fillColor('#718096');
      doc.text('This is a system-generated salary slip.', 50, footerY, { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 50, footerY + 12, { align: 'center' });

      doc.moveDown(2);
      doc.fontSize(9).fillColor('#2d3748');
      doc.text('Authorized Signature', 450, footerY, { align: 'right' });
      doc.moveTo(430, footerY + 5).lineTo(550, footerY + 5).stroke();

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

function getMonthName(month: number): string {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1] || '';
}

function formatCurrency(amount: number | Prisma.Decimal): string {
  const num = typeof amount === 'number' ? amount : Number(amount);
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Create/Update salary structure for employee
export const createOrUpdateSalaryStructure = async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId, basicSalary, hra, conveyanceAllowance, medicalAllowance, specialAllowance, otherAllowances, pfDeduction, taxDeduction, professionalTax, otherDeductions } = req.body;

    if (!employeeId || !basicSalary) {
      return res.status(400).json({ success: false, message: 'Employee ID and basic salary are required' });
    }

    // Check if structure already exists
    const existing = await prisma.salaryStructure.findUnique({
      where: { employeeId },
    });

    let salaryStructure;
    if (existing) {
      salaryStructure = await prisma.salaryStructure.update({
        where: { employeeId },
        data: {
          basicSalary, hra, conveyanceAllowance, medicalAllowance, specialAllowance,
          otherAllowances, pfDeduction, taxDeduction, professionalTax, otherDeductions,
        },
        include: { employee: { include: { department: true, company: true } } },
      });
    } else {
      salaryStructure = await prisma.salaryStructure.create({
        data: {
          employeeId, basicSalary, hra, conveyanceAllowance, medicalAllowance, specialAllowance,
          otherAllowances, pfDeduction, taxDeduction, professionalTax, otherDeductions,
        },
        include: { employee: { include: { department: true, company: true } } },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: existing ? 'UPDATE_SALARY_STRUCTURE' : 'CREATE_SALARY_STRUCTURE',
        entityType: 'SALARY_STRUCTURE',
        entityId: salaryStructure.id,
        newValue: req.body,
        description: `Salary structure ${existing ? 'updated' : 'created'} for employee ${employeeId}`,
        companyId: req.user?.companyId,
      },
    });

    return res.status(200).json({ success: true, data: salaryStructure });
  } catch (error) {
    console.error('Error in createOrUpdateSalaryStructure:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get salary structure for employee
export const getSalaryStructure = async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId } = req.params;

    const structure = await prisma.salaryStructure.findUnique({
      where: { employeeId },
      include: {
        employee: {
          include: { department: true, company: true },
        },
      },
    });

    if (!structure) {
      return res.status(404).json({ success: false, message: 'Salary structure not found' });
    }

    return res.status(200).json({ success: true, data: structure });
  } catch (error) {
    console.error('Error in getSalaryStructure:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Generate monthly salary for all employees or specific employee
export const generateMonthlySalary = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year, employeeId } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }

    const whereClause: any = { companyId: req.user?.companyId, status: 'ACTIVE' };
    if (employeeId) whereClause.id = employeeId;

    const employees = await prisma.user.findMany({
      where: whereClause,
      include: {
        salaryStructure: true,
        attendances: {
          where: {
            date: { gte: new Date(`${year}-${month.toString().padStart(2, '0')}-01`), lt: new Date(`${year}-${(month + 1).toString().padStart(2, '0')}-01`) },
          },
        },
        leaveRequests: {
          where: {
            status: 'APPROVED',
            fromDate: { gte: new Date(`${year}-${month.toString().padStart(2, '0')}-01`) },
            toDate: { lt: new Date(`${year}-${(month + 1).toString().padStart(2, '0')}-01`) },
          },
        },
      },
    });

    const results = [];
    for (const employee of employees) {
      if (!employee.salaryStructure) continue;

      const { salaryStructure, attendances, leaveRequests } = employee;

      // Check if already generated
      const existing = await prisma.salaryRecord.findUnique({
        where: { employeeId_month_year: { employeeId: employee.id, month, year } },
      });

      if (existing?.isGenerated) {
        results.push({ employeeId: employee.id, status: 'ALREADY_EXISTS', message: 'Salary already generated' });
        continue;
      }

      // Calculate days
      const totalDays = new Date(year, month, 0).getDate();
      const unpaidDays = attendances.filter((a: any) => a.status === 'UNPAID_LEAVE' || a.status === 'ABSENT').length;
      const leaveDays = leaveRequests.reduce((sum: number, lr: any) => sum + lr.totalDays, 0);
      const paidDays = totalDays - unpaidDays;
      const perDaySalary = Number(salaryStructure.basicSalary) / totalDays;

      // Calculate earnings
      const totalEarnings = Number(salaryStructure.basicSalary) + Number(salaryStructure.hra) +
        Number(salaryStructure.conveyanceAllowance) + Number(salaryStructure.medicalAllowance) +
        Number(salaryStructure.specialAllowance) + Number(salaryStructure.otherAllowances);

      // Calculate deductions
      const leaveDeduction = Math.round(perDaySalary * unpaidDays * 100) / 100;
      const totalDeductions = Number(salaryStructure.pfDeduction) + Number(salaryStructure.taxDeduction) +
        Number(salaryStructure.professionalTax) + leaveDeduction + Number(salaryStructure.otherDeductions);

      const grossSalary = totalEarnings;
      const netSalary = grossSalary - totalDeductions;

      const salaryData = {
        employeeId: employee.id,
        salaryStructureId: salaryStructure.id,
        month,
        year,
        basicSalary: salaryStructure.basicSalary,
        hra: salaryStructure.hra,
        conveyanceAllowance: salaryStructure.conveyanceAllowance,
        medicalAllowance: salaryStructure.medicalAllowance,
        specialAllowance: salaryStructure.specialAllowance,
        otherAllowances: salaryStructure.otherAllowances,
        totalEarnings,
        pfDeduction: salaryStructure.pfDeduction,
        taxDeduction: salaryStructure.taxDeduction,
        professionalTax: salaryStructure.professionalTax,
        leaveDeduction,
        otherDeductions: salaryStructure.otherDeductions,
        totalDeductions,
        grossSalary,
        netSalary,
        workingDays: totalDays,
        paidDays,
        unpaidDays,
        leaveDays,
        status: 'PROCESSED',
        isGenerated: true,
        generatedAt: new Date(),
      };

      let salaryRecord;
      if (existing) {
        salaryRecord = await prisma.salaryRecord.update({
          where: { employeeId_month_year: { employeeId: employee.id, month, year } },
          data: salaryData,
        });
      } else {
        salaryRecord = await prisma.salaryRecord.create({ data: salaryData });
      }

      // Create notification for employee
      await prisma.notification.create({
        data: {
          userId: employee.id,
          title: 'Salary Slip Generated',
          message: `Your salary slip for ${getMonthName(month)} ${year} has been generated.`,
          type: 'SALARY_SLIP',
          referenceId: salaryRecord.id,
          referenceType: 'SALARY_RECORD',
        },
      });

      results.push({ employeeId: employee.id, status: 'SUCCESS', salaryRecordId: salaryRecord.id });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'GENERATE_MONTHLY_SALARY',
        entityType: 'SALARY_RECORD',
        newValue: { month, year, employeeCount: results.length },
        description: `Monthly salary generated for ${results.length} employees`,
        companyId: req.user?.companyId,
      },
    });

    return res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error('Error in generateMonthlySalary:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get salary records with filters
export const getSalaryRecords = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, employeeId, departmentId, month, year, status, search } = req.query;

    const where: any = {};

    // Role-based filtering
    if (req.user?.role === 'EMPLOYEE') {
      where.employeeId = req.user.userId;
    } else if (req.user?.role === 'MANAGER' || req.user?.role === 'TEAM_LEADER') {
      // Get team members
      const teamMembers = await prisma.user.findMany({
        where: { teamLeaderId: req.user.userId },
        select: { id: true },
      });
      where.employeeId = { in: teamMembers.map((m: any) => m.id) };
    }

    if (employeeId) where.employeeId = employeeId;
    if (month) where.month = parseInt(month as string);
    if (year) where.year = parseInt(year as string);
    if (status) where.status = status;

    if (departmentId || search) {
      where.employee = { ...(departmentId && { departmentId }), ...(search && { fullName: { contains: search as string, mode: 'insensitive' } }) };
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [records, total] = await Promise.all([
      prisma.salaryRecord.findMany({
        where,
        include: {
          employee: { include: { department: true, company: true } },
          salaryStructure: true,
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        skip,
        take: parseInt(limit as string),
      }),
      prisma.salaryRecord.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: { records, pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total, totalPages: Math.ceil(total / parseInt(limit as string)) } },
    });
  } catch (error) {
    console.error('Error in getSalaryRecords:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get salary record by ID
export const getSalaryRecordById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const record = await prisma.salaryRecord.findUnique({
      where: { id },
      include: {
        employee: { include: { department: true, company: true, manager: true, shift: true } },
        salaryStructure: true,
        salaryComponents: true,
      },
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Salary record not found' });
    }

    // Access control
    if (req.user?.role === 'EMPLOYEE' && record.employeeId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.status(200).json({ success: true, data: record });
  } catch (error) {
    console.error('Error in getSalaryRecordById:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get salary slip for download/view
export const getSalarySlip = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const record = await prisma.salaryRecord.findUnique({
      where: { id },
      include: {
        employee: { include: { department: true, company: true } },
      },
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Salary record not found' });
    }

    // Access control
    if (req.user?.role === 'EMPLOYEE' && record.employeeId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.status(200).json({ success: true, data: record });
  } catch (error) {
    console.error('Error in getSalarySlip:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Download salary slip as PDF
export const downloadSalarySlip = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const record = await prisma.salaryRecord.findUnique({
      where: { id },
      include: {
        employee: { include: { department: true, company: true } },
        salaryStructure: true,
      },
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Salary record not found' });
    }

    // Access control
    if (req.user?.role === 'EMPLOYEE' && record.employeeId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const company = record.employee.company;
    const pdfBuffer = await generateSalarySlipPDF(record, record.employee, company);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Salary_Slip_${record.employee.employeeCode}_${getMonthName(record.month)}_${record.year}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error('Error in downloadSalarySlip:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Mark salary as credited
export const creditSalary = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentDate, paymentReference } = req.body;

    const record = await prisma.salaryRecord.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Salary record not found' });
    }

    const updated = await prisma.salaryRecord.update({
      where: { id },
      data: {
        status: 'CREDITED',
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentReference,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: record.employeeId,
        title: 'Salary Credited',
        message: `Your salary for ${getMonthName(record.month)} ${record.year} has been credited. Net Amount: ₹${record.netSalary.toLocaleString()}`,
        type: 'SALARY_CREDITED',
        referenceId: id,
        referenceType: 'SALARY_RECORD',
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'SALARY_CREDITED',
        entityType: 'SALARY_RECORD',
        entityId: id,
        newValue: { status: 'CREDITED', paymentDate: updated.paymentDate },
        description: `Salary credited for employee ${record.employeeId}`,
        companyId: req.user?.companyId,
      },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in creditSalary:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Add bonus/deduction to salary record
export const addSalaryComponent = async (req: AuthRequest, res: Response) => {
  try {
    const { salaryRecordId, type, componentName, amount, description, isTaxable } = req.body;

    if (!salaryRecordId || !type || !componentName || !amount) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const salaryRecord = await prisma.salaryRecord.findUnique({
      where: { id: salaryRecordId },
      include: { employee: true },
    });

    if (!salaryRecord) {
      return res.status(404).json({ success: false, message: 'Salary record not found' });
    }

    const component = await prisma.salaryComponent.create({
      data: {
        salaryRecordId,
        employeeId: salaryRecord.employeeId,
        type,
        componentName,
        amount: parseFloat(amount),
        description,
        isTaxable: isTaxable ?? true,
      },
    });

    // Recalculate net salary
    const allComponents = await prisma.salaryComponent.findMany({
      where: { salaryRecordId },
    });

    const bonusTotal = allComponents.filter((c: any) => c.type === 'BONUS' || c.type === 'REIMBURSEMENT').reduce((sum: number, c: any) => sum + Number(c.amount), 0);
    const deductionTotal = allComponents.filter((c: any) => c.type === 'DEDUCTION').reduce((sum: number, c: any) => sum + Number(c.amount), 0);

    await prisma.salaryRecord.update({
      where: { id: salaryRecordId },
      data: {
        totalEarnings: salaryRecord.totalEarnings + bonusTotal,
        totalDeductions: salaryRecord.totalDeductions + deductionTotal,
        netSalary: salaryRecord.grossSalary - salaryRecord.totalDeductions + deductionTotal - bonusTotal,
      },
    });

    return res.status(201).json({ success: true, data: component });
  } catch (error) {
    console.error('Error in addSalaryComponent:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get employee's salary history
export const getMySalaryHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 12 } = req.query;

    const where = { employeeId: req.user?.userId };

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [records, total] = await Promise.all([
      prisma.salaryRecord.findMany({
        where,
        include: { salaryStructure: true },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        skip,
        take: parseInt(limit as string),
      }),
      prisma.salaryRecord.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: { records, pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total, totalPages: Math.ceil(total / parseInt(limit as string)) } },
    });
  } catch (error) {
    console.error('Error in getMySalaryHistory:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
