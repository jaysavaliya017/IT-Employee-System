# SALARY MODULE ENHANCEMENT - IMPLEMENTATION STEPS

## 1. DATABASE IMPROVEMENTS

### Step 1.1: Add Unique Constraint (Prevent Duplicate Salary Generation)

**File**: `server/prisma/schema.prisma`

Add to SalaryRecord model:
```prisma
model SalaryRecord {
  id                    String   @id @default(cuid())
  employeeId            String   @db.Uuid
  employee              User     @relation("SalaryRecordEmployee", fields: [employeeId], references: [id], onDelete: Cascade)
  salaryStructureId     String?  @db.Uuid
  salaryStructure       SalaryStructure?  @relation(fields: [salaryStructureId], references: [id])
  
  month                 Int
  year                  Int
  
  // ... existing fields ...
  
  // Add this unique constraint
  @@unique([employeeId, month, year], name: "unique_salary_per_month")
  @@index([month, year])
  @@index([employeeId, status])
}
```

**Command to run after updating schema**:
```bash
cd server
npm run db:generate
npm run db:push
```

### Step 1.2: Add Salary Report Table (Optional but Recommended)

```prisma
model SalaryReport {
  id                String   @id @default(cuid())
  month             Int
  year              Int
  departmentId      String?  @db.Uuid
  department        Department? @relation(fields: [departmentId], references: [id])
  
  totalEmployees    Int
  totalEarnings     Decimal  @db.Decimal(15, 2)
  totalDeductions   Decimal  @db.Decimal(15, 2)
  totalNetSalary    Decimal  @db.Decimal(15, 2)
  
  generatedAt       DateTime @default(now())
  generatedBy       String   @db.Uuid
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@unique([month, year, departmentId])
}
```

---

## 2. BACKEND ENHANCEMENTS

### Step 2.1: Enhance Salary Generation with Duplicate Prevention

**File**: `server/src/controllers/salaryController.ts`

Update the `generateMonthlySalary` function:

```typescript
export const generateMonthlySalary = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year, employeeId, regenerate = false } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }

    if (month < 1 || month > 12) {
      return res.status(400).json({ success: false, message: 'Invalid month' });
    }

    // Get employees to generate salary for
    let employees;
    if (employeeId) {
      employees = await prisma.user.findMany({
        where: { id: employeeId, status: 'ACTIVE' },
        include: { salaryStructure: true, company: true, department: true },
      });
    } else {
      employees = await prisma.user.findMany({
        where: { status: 'ACTIVE', role: 'EMPLOYEE' },
        include: { salaryStructure: true, company: true, department: true },
      });
    }

    const results = [];
    let successCount = 0;
    let skipCount = 0;

    for (const employee of employees) {
      try {
        if (!employee.salaryStructure) {
          results.push({
            employeeId: employee.id,
            status: 'FAILED',
            message: 'No salary structure found for employee',
          });
          continue;
        }

        // Check if salary already exists for this month/year (unless regenerating)
        const existing = await prisma.salaryRecord.findUnique({
          where: {
            unique_salary_per_month: {
              employeeId: employee.id,
              month,
              year,
            },
          },
        });

        if (existing && !regenerate) {
          skipCount++;
          results.push({
            employeeId: employee.id,
            status: 'ALREADY_EXISTS',
            message: `Salary already generated for ${getMonthName(month)} ${year}`,
          });
          continue;
        }

        // Calculate salary based on attendance and leaves
        const salaryData = await calculateSalary(employee, month, year);

        // Create or update salary record
        let salaryRecord;
        if (existing && regenerate) {
          salaryRecord = await prisma.salaryRecord.update({
            where: { id: existing.id },
            data: {
              ...salaryData,
              generatedAt: new Date(),
              isGenerated: true,
            },
            include: { employee: true, salaryComponents: true },
          });
        } else {
          salaryRecord = await prisma.salaryRecord.create({
            data: {
              employeeId: employee.id,
              salaryStructureId: employee.salaryStructure.id,
              ...salaryData,
              generatedAt: new Date(),
              isGenerated: true,
            },
            include: { employee: true, salaryComponents: true },
          });
        }

        // Create audit log
        await prisma.auditLog.create({
          data: {
            userId: req.user?.userId,
            action: regenerate && existing ? 'REGENERATE_SALARY' : 'GENERATE_SALARY',
            entityType: 'SALARY_RECORD',
            entityId: salaryRecord.id,
            description: `Salary generated for ${employee.fullName} - ${getMonthName(month)} ${year}`,
            companyId: req.user?.companyId,
          },
        });

        successCount++;
        results.push({
          employeeId: employee.id,
          status: 'SUCCESS',
          message: `Salary generated successfully`,
          netSalary: salaryRecord.netSalary,
        });
      } catch (error) {
        results.push({
          employeeId: employee.id,
          status: 'FAILED',
          message: (error as Error).message || 'Error generating salary',
        });
      }
    }

    // Create summary report
    const totalEarnings = results
      .filter(r => r.status === 'SUCCESS')
      .reduce((sum, r) => sum + (Number(r.netSalary) || 0), 0);

    res.status(200).json({
      success: true,
      data: results,
      summary: {
        total: employees.length,
        successful: successCount,
        skipped: skipCount,
        failed: results.filter(r => r.status === 'FAILED').length,
        totalNetSalary: totalEarnings,
      },
    });
  } catch (error) {
    console.error('Error in generateMonthlySalary:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Helper function to calculate salary based on attendance
async function calculateSalary(employee: any, month: number, year: number) {
  const structure = employee.salaryStructure;

  // Get attendance for the month
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      userId: employee.id,
      date: {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      },
    },
  });

  // Calculate working days, paid days, leave days
  const totalWorkingDays = 26; // Standard working days per month
  let paidDays = 0;
  let unpaidDays = 0;
  let leaveDays = 0;

  attendanceRecords.forEach(record => {
    if (record.status === 'PRESENT' || record.status === 'HALF_DAY') {
      paidDays += record.status === 'HALF_DAY' ? 0.5 : 1;
    } else if (['PAID_LEAVE', 'CASUAL_LEAVE', 'SICK_LEAVE'].includes(record.status)) {
      leaveDays += 1;
      paidDays += 1; // Paid leaves count as paid days
    } else if (record.status === 'UNPAID_LEAVE') {
      unpaidDays += 1;
    }
  });

  // Calculate salary components
  const basicSalary = Number(structure.basicSalary);
  const totalEarnings = 
    basicSalary +
    Number(structure.hra || 0) +
    Number(structure.conveyanceAllowance || 0) +
    Number(structure.medicalAllowance || 0) +
    Number(structure.specialAllowance || 0) +
    Number(structure.otherAllowances || 0);

  const totalDeductions =
    Number(structure.pfDeduction || 0) +
    Number(structure.taxDeduction || 0) +
    Number(structure.professionalTax || 0) +
    Number(structure.otherDeductions || 0);

  // Calculate leave deduction if there are unpaid leaves
  const leaveDeduction = (basicSalary / totalWorkingDays) * unpaidDays;

  const grossSalary = totalEarnings;
  const netSalary = grossSalary - totalDeductions - leaveDeduction;

  return {
    month,
    year,
    basicSalary,
    hra: structure.hra || 0,
    conveyanceAllowance: structure.conveyanceAllowance || 0,
    medicalAllowance: structure.medicalAllowance || 0,
    specialAllowance: structure.specialAllowance || 0,
    otherAllowances: structure.otherAllowances || 0,
    totalEarnings,
    pfDeduction: structure.pfDeduction || 0,
    taxDeduction: structure.taxDeduction || 0,
    professionalTax: structure.professionalTax || 0,
    leaveDeduction,
    otherDeductions: structure.otherDeductions || 0,
    totalDeductions: totalDeductions + leaveDeduction,
    grossSalary,
    netSalary,
    workingDays: totalWorkingDays,
    paidDays: Math.round(paidDays * 100) / 100,
    unpaidDays,
    leaveDays,
    status: 'PENDING',
  };
}
```

### Step 2.2: Add Salary Report Generation

**File**: `server/src/controllers/salaryController.ts`

Add new function:
```typescript
export const generateSalaryReport = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year, departmentId, format = 'json' } = req.query;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }

    // Get salary records for the period
    const records = await prisma.salaryRecord.findMany({
      where: {
        month: parseInt(month as string),
        year: parseInt(year as string),
        ...(departmentId && {
          employee: { departmentId: departmentId as string },
        }),
      },
      include: {
        employee: true,
        salaryComponents: true,
      },
    });

    if (format === 'pdf') {
      // Generate PDF report
      const pdfBuffer = await generateSalaryReportPDF(records, month as string, year as string, departmentId as string);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Salary_Report_${month}_${year}.pdf"`);
      return res.send(pdfBuffer);
    }

    // JSON format
    const summary = {
      period: `${getMonthName(parseInt(month as string))} ${year}`,
      totalEmployees: records.length,
      totalEarnings: records.reduce((sum, r) => sum + Number(r.totalEarnings || 0), 0),
      totalDeductions: records.reduce((sum, r) => sum + Number(r.totalDeductions || 0), 0),
      totalNetSalary: records.reduce((sum, r) => sum + Number(r.netSalary || 0), 0),
      recordsByStatus: {
        pending: records.filter(r => r.status === 'PENDING').length,
        processed: records.filter(r => r.status === 'PROCESSED').length,
        credited: records.filter(r => r.status === 'CREDITED').length,
      },
    };

    res.status(200).json({ success: true, data: { summary, records } });
  } catch (error) {
    console.error('Error in generateSalaryReport:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

async function generateSalaryReportPDF(records: any[], month: string, year: string, departmentId?: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new pdfkit({ margin: 30 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('SALARY REPORT', { align: 'center' });
      doc.fontSize(12).text(`Period: ${getMonthName(parseInt(month))} ${year}`, { align: 'center' });
      doc.moveDown(0.5);

      // Summary Box
      const summaryY = doc.y;
      doc.rect(30, summaryY, 535, 80).stroke('#e2e8f0');
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text(`Total Employees: ${records.length}`, 40, summaryY + 10);
      doc.text(`Total Earnings: ₹${records.reduce((sum, r) => sum + Number(r.totalEarnings || 0), 0).toLocaleString('en-IN')}`, 40, summaryY + 30);
      doc.text(`Total Deductions: ₹${records.reduce((sum, r) => sum + Number(r.totalDeductions || 0), 0).toLocaleString('en-IN')}`, 40, summaryY + 50);
      doc.text(`Total Net Salary: ₹${records.reduce((sum, r) => sum + Number(r.netSalary || 0), 0).toLocaleString('en-IN')}`, 280, summaryY + 10);

      doc.moveDown(6);

      // Table Header
      const tableTop = doc.y;
      doc.rect(30, tableTop, 535, 25).fill('#f0f0f0');
      doc.fillColor('#000').fontSize(9).font('Helvetica-Bold');
      doc.text('Emp Code', 35, tableTop + 7);
      doc.text('Name', 120, tableTop + 7);
      doc.text('Basic', 250, tableTop + 7, { align: 'right' });
      doc.text('Earnings', 320, tableTop + 7, { align: 'right' });
      doc.text('Deductions', 400, tableTop + 7, { align: 'right' });
      doc.text('Net Salary', 480, tableTop + 7, { align: 'right' });

      // Table Rows
      let tableY = tableTop + 30;
      records.forEach((record, idx) => {
        if (tableY > 750) {
          doc.addPage();
          tableY = 30;
        }

        doc.fontSize(8).font('Helvetica').fillColor('#333');
        doc.text(record.employee?.employeeCode || '', 35, tableY);
        doc.text(record.employee?.fullName || '', 120, tableY);
        doc.text(`₹${Number(record.basicSalary || 0).toLocaleString('en-IN')}`, 250, tableY, { align: 'right' });
        doc.text(`₹${Number(record.totalEarnings || 0).toLocaleString('en-IN')}`, 320, tableY, { align: 'right' });
        doc.text(`₹${Number(record.totalDeductions || 0).toLocaleString('en-IN')}`, 400, tableY, { align: 'right' });
        doc.font('Helvetica-Bold').text(`₹${Number(record.netSalary || 0).toLocaleString('en-IN')}`, 480, tableY, { align: 'right' });

        tableY += 18;
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
```

### Step 2.3: Add Credit Salary Enhancement

**File**: `server/src/controllers/salaryController.ts`

Update the `creditSalary` function:
```typescript
export const creditSalary = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentDate, paymentReference, bulkIds } = req.body;

    // Handle bulk crediting
    if (bulkIds && Array.isArray(bulkIds)) {
      const updated = await prisma.salaryRecord.updateMany({
        where: { id: { in: bulkIds } },
        data: {
          status: 'CREDITED',
          paymentDate: new Date(paymentDate || new Date()),
          paymentReference,
        },
      });

      // Create audit log for bulk operation
      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId,
          action: 'BULK_CREDIT_SALARY',
          entityType: 'SALARY_RECORD',
          entityId: 'BULK',
          description: `${updated.count} salary records marked as credited`,
          companyId: req.user?.companyId,
        },
      });

      return res.status(200).json({ success: true, message: `${updated.count} salaries credited successfully` });
    }

    // Single record crediting
    const salaryRecord = await prisma.salaryRecord.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!salaryRecord) {
      return res.status(404).json({ success: false, message: 'Salary record not found' });
    }

    const updated = await prisma.salaryRecord.update({
      where: { id },
      data: {
        status: 'CREDITED',
        paymentDate: new Date(paymentDate || new Date()),
        paymentReference,
      },
    });

    // Create notification for employee
    await prisma.notification.create({
      data: {
        userId: salaryRecord.employeeId,
        title: 'Salary Credited',
        message: `Your salary for ${getMonthName(salaryRecord.month)} ${salaryRecord.year} has been credited. Net amount: ₹${Number(salaryRecord.netSalary).toLocaleString('en-IN')}`,
        type: 'SALARY_CREDITED',
        relatedEntityId: id,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'CREDIT_SALARY',
        entityType: 'SALARY_RECORD',
        entityId: id,
        description: `Salary credited for ${salaryRecord.employee?.fullName}`,
        companyId: req.user?.companyId,
      },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in creditSalary:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
```

### Step 2.4: Update Routes

**File**: `server/src/routes/salary.ts`

Add new routes:
```typescript
// Add these routes
router.post('/report/generate', isAdmin, generateSalaryReport);
router.get('/report/download', isAdmin, generateSalaryReport);
router.put('/credit-bulk', isAdmin, creditSalary); // Bulk credit
```

---

## 3. FRONTEND ENHANCEMENTS

### Step 3.1: Enhanced Salary Dashboard

**File**: `client/src/pages/SalaryDashboard.tsx`

Create comprehensive salary dashboard with:
- YTD salary summary
- Monthly trend chart
- Status breakdown
- Recent salary slips

### Step 3.2: Salary Slip List Filters

**File**: `client/src/pages/SalarySlipList.tsx`

Add advanced filters:
- Department filter
- Employee filter
- Date range filter
- Status filter (pending/processed/credited)
- Search

### Step 3.3: Bulk Operations Component

**File**: `client/src/components/SalaryBulkOperations.tsx`

```typescript
import { useState } from 'react';
import { salaryApi } from '../api/services';

const SalaryBulkOperations = ({ selectedIds }: { selectedIds: string[] }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleBulkCredit = async () => {
    try {
      setIsLoading(true);
      await salaryApi.creditSalaryBulk({
        bulkIds: selectedIds,
        paymentDate: new Date().toISOString(),
      });
      // Show success message and refresh
    } catch (error) {
      console.error('Error crediting salaries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleBulkCredit}
        disabled={selectedIds.length === 0 || isLoading}
        className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
      >
        Mark {selectedIds.length} as Credited
      </button>
    </div>
  );
};

export default SalaryBulkOperations;
```

---

## 4. API INTEGRATION

### Step 4.1: Update API Services

**File**: `client/src/api/services.ts`

Add new methods:
```typescript
export const salaryApi = {
  // ... existing methods ...
  
  generateReport: (params: { month: number; year: number; departmentId?: string; format?: 'json' | 'pdf' }) =>
    format === 'pdf'
      ? api.get('/salary/report/download', { params, responseType: 'blob' })
      : api.get('/salary/report/generate', { params }),

  downloadReport: (month: number, year: number) =>
    api.get('/salary/report/download', {
      params: { month, year, format: 'pdf' },
      responseType: 'blob',
    }),

  creditSalaryBulk: (data: { bulkIds: string[]; paymentDate: string }) =>
    api.put('/salary/credit-bulk', data),
};
```

---

## 5. TESTING STEPS

### Test Duplicate Prevention
```bash
1. Generate salary for month 1, 2026
2. Try to generate again - should show "Already exists"
3. Use regenerate flag - should overwrite
```

### Test Salary Reports
```bash
1. Generate salary for multiple employees
2. Download report as PDF
3. Verify all calculations are correct
4. Check department filter works
```

### Test Bulk Operations
```bash
1. Select multiple salary records
2. Click "Mark as Credited"
3. Verify all marked as CREDITED
4. Check employee received notification
```

---

## 6. DEPLOYMENT STEPS

```bash
# 1. Update database schema
cd server
npm run db:generate
npm run db:push

# 2. Restart server
npm run dev

# 3. Update client
cd ../client
npm run dev

# 4. Test all functionality

# 5. Build for production
npm run build
```

---

## FILES TO UPDATE SUMMARY

```
✅ server/prisma/schema.prisma - Add unique constraint, optional report table
✅ server/src/controllers/salaryController.ts - Enhanced generation, reports, crediting
✅ server/src/routes/salary.ts - New endpoints
✅ client/src/api/services.ts - New API methods
✅ client/src/pages/SalarySlipList.tsx - Advanced filters
✅ client/src/pages/SalaryDashboard.tsx - Enhanced dashboard
✅ client/src/components/SalaryBulkOperations.tsx - New component
```

---

**Status**: This enhancement makes the Salary module production-ready with proper duplicate prevention, reporting, and bulk operations.

**Time to Implement**: ~2-3 hours

