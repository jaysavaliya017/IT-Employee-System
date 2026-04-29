import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import pdfkit from 'pdfkit';
import { config } from '../config';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// Helper function to get month name
function getMonthName(month: number): string {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1] || '';
}

// Helper function to format currency
function formatCurrency(amount: number | any): string {
  const num = typeof amount === 'number' ? amount : Number(amount);
  return `Rs. ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Helper function to ensure directory exists
function ensureDirExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Generate professional salary slip PDF
const generateSalarySlipPDF = async (
  salarySlip: any,
  employee: any,
  company: any,
  generatedByUser?: any
): Promise<{ buffer: Buffer; fileName: string }> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new pdfkit({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve({
        buffer: Buffer.concat(chunks),
        fileName: `salary-slip-${employee.fullName.replace(/\s+/g, '-')}-${getMonthName(salarySlip.month)}-${salarySlip.year}.pdf`
      }));
      doc.on('error', reject);

      // Colors
      const primaryColor = '#1e3a5f';
      const secondaryColor = '#2c5282';
      const accentGreen = '#38a169';
      const accentRed = '#e53e3e';
      const lightGray = '#f7fafc';
      const darkGray = '#2d3748';

      // Header background
      doc.rect(0, 0, 595.28, 100).fill(primaryColor);

      // Company name
      doc.fillColor('#ffffff')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text(company.name || 'Company Name', 50, 25, { align: 'center' });

      // Company details
      doc.fontSize(10)
        .font('Helvetica')
        .text(company.address || '', { align: 'center' })
        .text(`Email: ${company.email || ''} | Phone: ${company.phone || ''}`, { align: 'center' });

      // Salary Slip title
      doc.moveDown(1);
      doc.fillColor(primaryColor)
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('SALARY SLIP', { align: 'center' });

      doc.moveDown(0.5);
      doc.fontSize(11)
        .font('Helvetica')
        .fillColor(darkGray)
        .text(`Pay Period: ${getMonthName(salarySlip.month)} ${salarySlip.year}`, { align: 'center' });

      // Employee details box
      doc.moveDown(1.5);
      const detailsY = doc.y;
      doc.rect(50, detailsY, 495, 90).stroke(secondaryColor);

      const leftX = 70;
      const rightX = 340;
      let detailY = detailsY + 15;

      // Left column
      doc.fillColor(darkGray).fontSize(10).font('Helvetica-Bold');
      doc.text('Employee Name:', leftX, detailY);
      doc.font('Helvetica').text(employee.fullName || 'N/A', leftX + 110, detailY);

      doc.font('Helvetica-Bold');
      doc.text('Designation:', leftX, detailY + 18);
      doc.font('Helvetica').text(employee.designation || 'N/A', leftX + 110, detailY + 18);

      doc.font('Helvetica-Bold');
      doc.text('Email:', leftX, detailY + 36);
      doc.font('Helvetica').text(employee.email || 'N/A', leftX + 110, detailY + 36);

      // Right column
      doc.font('Helvetica-Bold');
      doc.text('Employee ID:', rightX, detailY);
      doc.font('Helvetica').text(employee.employeeCode || 'N/A', rightX + 90, detailY);

      doc.font('Helvetica-Bold');
      doc.text('Department:', rightX, detailY + 18);
      doc.font('Helvetica').text(employee.department?.name || 'N/A', rightX + 90, detailY + 18);

      doc.font('Helvetica-Bold');
      doc.text('Status:', rightX, detailY + 36);
      doc.font('Helvetica').fillColor(accentGreen).text(salarySlip.status, rightX + 90, detailY + 36);
      doc.fillColor(darkGray);

      // Earnings Section
      doc.moveDown(2);
      const earningsY = doc.y + 10;

      doc.rect(50, earningsY, 495, 25).fill(secondaryColor);
      doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold');
      doc.text('EARNINGS', 60, earningsY + 7);

      const earningsStartY = earningsY + 30;
      doc.rect(50, earningsStartY, 495, 30).fill(lightGray);
      doc.fillColor(darkGray).fontSize(10).font('Helvetica-Bold');
      doc.text('Description', 60, earningsStartY + 10);
      doc.text('Amount', 450, earningsStartY + 10, { align: 'right' });

      // Earnings items
      let itemY = earningsStartY + 35;
      const earningsItems = [
        { name: 'Basic Salary', value: Number(salarySlip.salaryAmount) },
        { name: 'Bonus', value: Number(salarySlip.bonus) },
      ];

      doc.font('Helvetica');
      earningsItems.forEach((item) => {
        if (item.value > 0) {
          doc.fillColor(darkGray).text(item.name, 60, itemY);
          doc.text(formatCurrency(item.value), 450, itemY, { align: 'right' });
          itemY += 20;
        }
      });

      // Total Earnings
      itemY += 5;
      doc.moveTo(50, itemY).lineTo(545, itemY).stroke('#e2e8f0');
      itemY += 10;
      doc.font('Helvetica-Bold').fillColor(darkGray);
      doc.text('Total Earnings:', 60, itemY);
      const totalEarnings = Number(salarySlip.salaryAmount) + Number(salarySlip.bonus);
      doc.text(formatCurrency(totalEarnings), 450, itemY, { align: 'right' });

      // Deductions Section
      itemY += 30;
      doc.rect(50, itemY, 495, 25).fill(accentRed);
      doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold');
      doc.text('DEDUCTIONS', 60, itemY + 7);

      const deductionsStartY = itemY + 30;
      doc.rect(50, deductionsStartY, 495, 30).fill(lightGray);
      doc.fillColor(darkGray).fontSize(10).font('Helvetica-Bold');
      doc.text('Description', 60, deductionsStartY + 10);
      doc.text('Amount', 450, deductionsStartY + 10, { align: 'right' });

      let deductionY = deductionsStartY + 35;
      doc.font('Helvetica');
      if (Number(salarySlip.deduction) > 0) {
        doc.fillColor(darkGray).text('Deductions', 60, deductionY);
        doc.text(formatCurrency(salarySlip.deduction), 450, deductionY, { align: 'right' });
        deductionY += 20;
      } else {
        doc.fillColor(darkGray).text('No Deductions', 60, deductionY);
        doc.text(formatCurrency(0), 450, deductionY, { align: 'right' });
        deductionY += 20;
      }

      // Total Deductions
      deductionY += 5;
      doc.moveTo(50, deductionY).lineTo(545, deductionY).stroke('#e2e8f0');
      deductionY += 10;
      doc.font('Helvetica-Bold').fillColor(darkGray);
      doc.text('Total Deductions:', 60, deductionY);
      doc.text(formatCurrency(salarySlip.deduction), 450, deductionY, { align: 'right' });

      // Net Salary (highlighted box)
      deductionY += 35;
      doc.rect(50, deductionY, 495, 45).fill(primaryColor);
      doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold');
      doc.text('NET SALARY:', 60, deductionY + 15);
      doc.text(formatCurrency(salarySlip.netSalary), 350, deductionY + 15, { align: 'right' });

      // Generated info
      const generatedDate = salarySlip.generatedAt
        ? new Date(salarySlip.generatedAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : new Date().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

      // Footer section
      const footerY = 680;
      doc.fontSize(9).fillColor('#718096');
      doc.text('This is a computer-generated salary slip.', 50, footerY, { align: 'center' });
      doc.text(`Generated on: ${generatedDate}`, 50, footerY + 14, { align: 'center' });

      if (generatedByUser) {
        doc.text(`Authorized by: ${generatedByUser.fullName}`, 50, footerY + 28, { align: 'center' });
      }

      // Signature line
      doc.moveDown(2);
      doc.fontSize(10).fillColor(darkGray);
      doc.text('Authorized Signature', 420, footerY + 50, { align: 'right' });
      doc.moveTo(400, footerY + 54).lineTo(545, footerY + 54).stroke();

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Get employees for salary generation
export const getEmployeesForSalaryGeneration = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required',
      });
    }

    const selectedMonth = parseInt(month as string);
    const selectedYear = parseInt(year as string);

    // Get all active employees
    const employees = await prisma.user.findMany({
      where: {
        companyId: req.user?.companyId,
        status: 'ACTIVE',
      },
      include: {
        department: true,
      },
      orderBy: { fullName: 'asc' },
    });

    // Get existing salary slips for the selected month/year
    const existingSlips = await prisma.salarySlip.findMany({
      where: {
        month: selectedMonth,
        year: selectedYear,
        employee: { companyId: req.user?.companyId },
      },
    });

    // Combine employee data with salary slip status
    const employeesWithStatus = employees.map((emp) => {
      const slip = existingSlips.find((s) => s.employeeId === emp.id);
      return {
        id: emp.id,
        fullName: emp.fullName,
        employeeCode: emp.employeeCode,
        email: emp.email,
        designation: emp.designation,
        department: emp.department,
        salaryAmount: slip ? Number(slip.salaryAmount) : 0,
        bonus: slip ? Number(slip.bonus) : 0,
        deduction: slip ? Number(slip.deduction) : 0,
        netSalary: slip ? Number(slip.netSalary) : 0,
        status: slip?.status || 'NOT_GENERATED',
        slipId: slip?.id || null,
      };
    });

    return res.status(200).json({
      success: true,
      data: employeesWithStatus,
    });
  } catch (error) {
    console.error('Error in getEmployeesForSalaryGeneration:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Generate salary slip for one employee
export const generateSalarySlip = async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId, month, year, salaryAmount, bonus = 0, deduction = 0 } = req.body;

    // Validation
    if (!employeeId || !month || !year || !salaryAmount) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, month, year, and salary amount are required',
      });
    }

    if (salaryAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Salary amount must be greater than 0',
      });
    }

    if (bonus < 0 || deduction < 0) {
      return res.status(400).json({
        success: false,
        message: 'Bonus and deduction cannot be negative',
      });
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    if (monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        message: 'Month must be between 1 and 12',
      });
    }

    // Check if employee exists
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      include: { department: true, company: true },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Check for duplicate salary slip
    const existingSlip = await prisma.salarySlip.findUnique({
      where: {
        employeeId_month_year: {
          employeeId,
          month: monthNum,
          year: yearNum,
        },
      },
    });

    if (existingSlip && existingSlip.status !== 'NOT_GENERATED') {
      return res.status(400).json({
        success: false,
        message: `Salary slip already exists for ${getMonthName(monthNum)} ${yearNum}`,
      });
    }

    // Calculate net salary
    const netSalary = Number(salaryAmount) + Number(bonus) - Number(deduction);

    if (netSalary < 0) {
      return res.status(400).json({
        success: false,
        message: 'Net salary cannot be less than 0',
      });
    }

    // Generate PDF
    const { buffer, fileName } = await generateSalarySlipPDF(
      { month: monthNum, year: yearNum, salaryAmount, bonus, deduction, netSalary, status: 'GENERATED', generatedAt: new Date() },
      employee,
      employee.company
    );

    // Save PDF to uploads directory
    const uploadDir = path.join(process.cwd(), 'uploads', 'salary-slips');
    ensureDirExists(uploadDir);

    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);

    const pdfUrl = `/uploads/salary-slips/${fileName}`;

    // Create or update salary slip
    let salarySlip;
    if (existingSlip) {
      salarySlip = await prisma.salarySlip.update({
        where: { id: existingSlip.id },
        data: {
          salaryAmount,
          bonus,
          deduction,
          netSalary,
          status: 'GENERATED',
          pdfUrl,
          generatedBy: req.user?.userId,
          generatedAt: new Date(),
        },
        include: { employee: { include: { department: true } } },
      });
    } else {
      salarySlip = await prisma.salarySlip.create({
        data: {
          employeeId,
          month: monthNum,
          year: yearNum,
          salaryAmount,
          bonus,
          deduction,
          netSalary,
          status: 'GENERATED',
          pdfUrl,
          generatedBy: req.user?.userId,
          generatedAt: new Date(),
        },
        include: { employee: { include: { department: true } } },
      });
    }

    // Create notification for employee
    await prisma.notification.create({
      data: {
        userId: employeeId,
        title: 'Salary Slip Generated',
        message: `Your salary slip for ${getMonthName(monthNum)} ${yearNum} has been generated. You can now view and download it.`,
        type: 'SALARY_SLIP',
        referenceId: salarySlip.id,
        referenceType: 'SALARY_SLIP',
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'SALARY_SLIP_GENERATED',
        entityType: 'SALARY_SLIP',
        entityId: salarySlip.id,
        newValue: {
          employeeId,
          month: monthNum,
          year: yearNum,
          salaryAmount,
          bonus,
          deduction,
          netSalary,
        },
        description: `Salary slip generated for employee ${employee.fullName} for ${getMonthName(monthNum)} ${yearNum}`,
        companyId: req.user?.companyId,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Salary slip generated successfully',
      data: salarySlip,
    });
  } catch (error) {
    console.error('Error in generateSalarySlip:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Generate salary slips for multiple employees
export const generateBulkSalarySlips = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year, employees } = req.body;

    if (!month || !year || !employees || !Array.isArray(employees)) {
      return res.status(400).json({
        success: false,
        message: 'Month, year, and employees array are required',
      });
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    if (monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        message: 'Month must be between 1 and 12',
      });
    }

    const results = {
      success: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
      generatedSlips: [] as any[],
    };

    for (const empData of employees) {
      try {
        const { employeeId, salaryAmount, bonus = 0, deduction = 0 } = empData;

        // Skip if salary amount is not provided or invalid
        if (!salaryAmount || salaryAmount <= 0) {
          results.skipped++;
          continue;
        }

        // Check if employee exists
        const employee = await prisma.user.findUnique({
          where: { id: employeeId },
          include: { department: true, company: true },
        });

        if (!employee) {
          results.skipped++;
          results.errors.push(`Employee ${employeeId} not found`);
          continue;
        }

        // Check for duplicate
        const existingSlip = await prisma.salarySlip.findUnique({
          where: {
            employeeId_month_year: {
              employeeId,
              month: monthNum,
              year: yearNum,
            },
          },
        });

        if (existingSlip && existingSlip.status !== 'NOT_GENERATED') {
          results.skipped++;
          results.errors.push(`Salary slip already exists for ${employee.fullName}`);
          continue;
        }

        // Calculate net salary
        const netSalary = Number(salaryAmount) + Number(bonus) - Number(deduction);

        if (netSalary < 0) {
          results.failed++;
          results.errors.push(`Net salary cannot be less than 0 for ${employee.fullName}`);
          continue;
        }

        // Generate PDF
        const { buffer, fileName } = await generateSalarySlipPDF(
          { month: monthNum, year: yearNum, salaryAmount, bonus, deduction, netSalary, status: 'GENERATED', generatedAt: new Date() },
          employee,
          employee.company
        );

        // Save PDF
        const uploadDir = path.join(process.cwd(), 'uploads', 'salary-slips');
        ensureDirExists(uploadDir);

        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buffer);

        const pdfUrl = `/uploads/salary-slips/${fileName}`;

        // Create or update salary slip
        let salarySlip;
        if (existingSlip) {
          salarySlip = await prisma.salarySlip.update({
            where: { id: existingSlip.id },
            data: {
              salaryAmount,
              bonus,
              deduction,
              netSalary,
              status: 'GENERATED',
              pdfUrl,
              generatedBy: req.user?.userId,
              generatedAt: new Date(),
            },
          });
        } else {
          salarySlip = await prisma.salarySlip.create({
            data: {
              employeeId,
              month: monthNum,
              year: yearNum,
              salaryAmount,
              bonus,
              deduction,
              netSalary,
              status: 'GENERATED',
              pdfUrl,
              generatedBy: req.user?.userId,
              generatedAt: new Date(),
            },
          });
        }

        // Create notification
        await prisma.notification.create({
          data: {
            userId: employeeId,
            title: 'Salary Slip Generated',
            message: `Your salary slip for ${getMonthName(monthNum)} ${yearNum} has been generated. You can now view and download it.`,
            type: 'SALARY_SLIP',
            referenceId: salarySlip.id,
            referenceType: 'SALARY_SLIP',
          },
        });

        results.generatedSlips.push(salarySlip);
        results.success++;
      } catch (empError) {
        results.failed++;
        results.errors.push(`Error processing employee ${empData.employeeId}: ${(empError as Error).message}`);
      }
    }

    // Create audit log for bulk operation
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'BULK_SALARY_SLIP_GENERATED',
        entityType: 'SALARY_SLIP',
        newValue: {
          month: monthNum,
          year: yearNum,
          successCount: results.success,
          skippedCount: results.skipped,
          failedCount: results.failed,
        },
        description: `Bulk salary slip generation: ${results.success} success, ${results.skipped} skipped, ${results.failed} failed`,
        companyId: req.user?.companyId,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Bulk generation completed: ${results.success} success, ${results.skipped} skipped, ${results.failed} failed`,
      data: results,
    });
  } catch (error) {
    console.error('Error in generateBulkSalarySlips:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Employee view own salary slips
export const getMySalarySlips = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 12, month, year } = req.query;

    const where: any = { employeeId: req.user?.userId };

    if (month) where.month = parseInt(month as string);
    if (year) where.year = parseInt(year as string);

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [slips, total] = await Promise.all([
      prisma.salarySlip.findMany({
        where,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        skip,
        take: parseInt(limit as string),
      }),
      prisma.salarySlip.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        slips,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    console.error('Error in getMySalarySlips:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Admin/HR view all salary slips
export const getAllSalarySlips = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, month, year, employeeId, departmentId, search, status } = req.query;

    const where: any = {};

    if (month) where.month = parseInt(month as string);
    if (year) where.year = parseInt(year as string);
    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;

    if (departmentId || search) {
      where.employee = {
        ...(departmentId && { departmentId }),
        ...(search && { fullName: { contains: search as string, mode: 'insensitive' } }),
      };
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [slips, total] = await Promise.all([
      prisma.salarySlip.findMany({
        where,
        include: {
          employee: { include: { department: true } },
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        skip,
        take: parseInt(limit as string),
      }),
      prisma.salarySlip.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        slips,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    console.error('Error in getAllSalarySlips:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Download salary slip
export const downloadSalarySlip = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const salarySlip = await prisma.salarySlip.findUnique({
      where: { id },
      include: {
        employee: { include: { department: true, company: true } },
        generatedByUser: true,
      },
    });

    if (!salarySlip) {
      return res.status(404).json({
        success: false,
        message: 'Salary slip not found',
      });
    }

    // Access control - employee can only download their own
    if (req.user?.role === 'EMPLOYEE' && salarySlip.employeeId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only download your own salary slips.',
      });
    }

    // If PDF already exists, serve it directly
    if (salarySlip.pdfUrl) {
      const filePath = path.join(process.cwd(), salarySlip.pdfUrl);
      if (fs.existsSync(filePath)) {
        // Audit log for download by admin/hr
        if (req.user?.role !== 'EMPLOYEE') {
          await prisma.auditLog.create({
            data: {
              userId: req.user?.userId,
              action: 'SALARY_SLIP_DOWNLOADED',
              entityType: 'SALARY_SLIP',
              entityId: id,
              description: `Salary slip downloaded for employee ${salarySlip.employee.fullName}`,
              companyId: req.user?.companyId,
            },
          });
        }

        return res.download(filePath);
      }
    }

    // Generate PDF on the fly if it doesn't exist
    const { buffer, fileName } = await generateSalarySlipPDF(
      salarySlip,
      salarySlip.employee,
      salarySlip.employee.company,
      salarySlip.generatedByUser
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);

    // Audit log
    if (req.user?.role !== 'EMPLOYEE') {
      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'SALARY_SLIP_DOWNLOADED',
          entityType: 'SALARY_SLIP',
          entityId: id,
          description: `Salary slip downloaded for employee ${salarySlip.employee.fullName}`,
          companyId: req.user?.companyId,
        },
      });
    }

    return res.status(200).send(buffer);
  } catch (error) {
    console.error('Error in downloadSalarySlip:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Mark salary as paid
export const markSalaryAsPaid = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const salarySlip = await prisma.salarySlip.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!salarySlip) {
      return res.status(404).json({
        success: false,
        message: 'Salary slip not found',
      });
    }

    if (salarySlip.status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Salary slip is already marked as paid',
      });
    }

    const updatedSlip = await prisma.salarySlip.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
      include: {
        employee: { include: { department: true } },
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: salarySlip.employeeId,
        title: 'Salary Paid',
        message: `Your salary for ${getMonthName(salarySlip.month)} ${salarySlip.year} has been marked as paid.`,
        type: 'SALARY_CREDITED',
        referenceId: id,
        referenceType: 'SALARY_SLIP',
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'SALARY_MARKED_PAID',
        entityType: 'SALARY_SLIP',
        entityId: id,
        newValue: { status: 'PAID', paidAt: updatedSlip.paidAt },
        description: `Salary marked as paid for employee ${salarySlip.employee.fullName}`,
        companyId: req.user?.companyId,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Salary marked as paid successfully',
      data: updatedSlip,
    });
  } catch (error) {
    console.error('Error in markSalaryAsPaid:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
