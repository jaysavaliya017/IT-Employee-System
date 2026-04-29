# HRMS/LMS SYSTEM - DEVELOPER QUICK REFERENCE

## 🎯 WHAT'S ALREADY WORKING (DO NOT BREAK!)

✅ **Authentication & Authorization**
- JWT-based auth with role checks (SUPER_ADMIN, ADMIN, HR, MANAGER, TEAM_LEADER, EMPLOYEE)
- Protected routes with `authMiddleware` and role-specific middleware
- Session management with tokens

✅ **Salary Module** (70% complete)
- Salary structure creation/update
- Monthly salary generation with pdfkit PDF creation
- Download salary slip as PDF
- Mark as credited
- Integration with attendance data

✅ **Gallery Module** (85% complete)
- Image upload with multer
- Display in grid/list view
- Visibility controls (COMPANY/DEPARTMENT/TEAM/EMPLOYEE)
- Download images
- Delete images
- Proper file path resolution

✅ **Document Management** (90% complete)
- Upload documents
- Download with secure file handling
- Delete documents
- File path resolution for missing files

✅ **Leave Management** (85% complete)
- Apply leave with manager approval
- Leave balance tracking
- Leave history
- Leave calendar

✅ **Attendance** (90% complete)
- Punch in/out functionality
- Daily attendance tracking
- Monthly attendance summary
- Attendance reports

✅ **Announcements** (80% complete)
- Create announcements
- View by role/target audience
- Distribution to employees

✅ **Policies** (85% complete)
- Upload policy documents
- View policies
- Download with secure handling
- Version control

✅ **Dashboard** (70% complete)
- Employee dashboard
- Admin dashboard
- Team leader dashboard
- Basic metrics and widgets

✅ **Notifications** (75% complete)
- System notifications
- Notification listing
- Read/unread status
- Type categorization

✅ **Audit Logs** (80% complete)
- Track sensitive operations
- Filter by action/entity/user
- Export audit logs

✅ **Holidays** (90% complete)
- Add/edit holidays
- Holiday calendar
- Holiday display on dashboard

---

## 📁 PROJECT STRUCTURE

```
IT Employee system/
├── server/
│   ├── src/
│   │   ├── controllers/          # Business logic
│   │   │   ├── salaryController.ts
│   │   │   ├── galleryController.ts
│   │   │   ├── documentController.ts
│   │   │   ├── leaveController.ts
│   │   │   ├── attendanceController.ts
│   │   │   ├── announcementController.ts
│   │   │   ├── policyController.ts
│   │   │   ├── dashboardController.ts
│   │   │   ├── notificationController.ts
│   │   │   ├── auditLogController.ts
│   │   │   └── ...
│   │   ├── routes/               # API endpoints
│   │   ├── middleware/           # Auth, role checks
│   │   ├── config/               # Configuration
│   │   ├── types/                # TypeScript interfaces
│   │   ├── utils/                # Helper functions
│   │   ├── app.ts                # Express app setup
│   │   └── server.ts             # Server entry point
│   ├── prisma/
│   │   └── schema.prisma         # Database schema (ALL MODELS DEFINED)
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── pages/                # Page components
│   │   │   ├── SalaryDashboard.tsx
│   │   │   ├── SalaryGeneration.tsx
│   │   │   ├── SalarySlipList.tsx
│   │   │   ├── GalleryPage.tsx
│   │   │   ├── DocumentCenter.tsx
│   │   │   ├── LeaveRequests.tsx
│   │   │   ├── AnnouncementList.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── EmployeeDashboard.tsx
│   │   │   ├── NotificationPage.tsx
│   │   │   ├── PoliciesPage.tsx
│   │   │   └── ...
│   │   ├── components/           # Reusable components
│   │   │   ├── Modal.tsx
│   │   │   ├── Loader.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── ...
│   │   ├── api/
│   │   │   ├── services.ts       # API integration
│   │   │   ├── index.ts          # Axios setup
│   │   │   └── messagingSocket.ts
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── types/
│   │   │   └── index.ts          # TypeScript interfaces
│   │   ├── utils/
│   │   │   └── attendance.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vite.config.ts            # Vite config (includes /uploads proxy)
│   ├── tailwind.config.js        # Tailwind CSS config
│   └── package.json
│
├── IMPLEMENTATION_GUIDE.md       # Overall implementation guide
├── SALARY_MODULE_ENHANCEMENT.md  # Detailed salary enhancements
├── COMPLETE_SYSTEM_INTEGRATION.md # All modules integration
└── README.md

```

---

## 🔧 COMMON DEVELOPMENT TASKS

### Task 1: Add New API Endpoint

**Example: Add GET /api/salary/report endpoint**

**Step 1**: Update Controller (`server/src/controllers/salaryController.ts`)
```typescript
export const generateSalaryReport = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year, format } = req.query;
    // Implementation
    res.json({ success: true, data: reportData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

**Step 2**: Add Route (`server/src/routes/salary.ts`)
```typescript
router.get('/report', isAdmin, generateSalaryReport);
```

**Step 3**: Add API Service (`client/src/api/services.ts`)
```typescript
export const salaryApi = {
  // ... existing methods
  generateReport: (month, year) => 
    api.get('/salary/report', { params: { month, year } }),
};
```

**Step 4**: Use in Component
```typescript
const response = await salaryApi.generateReport(4, 2026);
```

### Task 2: Add New Database Field

**Example: Add `department` field to Salary Record**

**Step 1**: Update Schema (`server/prisma/schema.prisma`)
```prisma
model SalaryRecord {
  // ... existing fields
  departmentId  String?  @db.Uuid
  department    Department? @relation(fields: [departmentId], references: [id])
}
```

**Step 2**: Generate Prisma Client
```bash
cd server
npm run db:generate
```

**Step 3**: Run Migration
```bash
npm run db:push
```

**Step 4**: Update Controller to Use New Field
```typescript
const salary = await prisma.salaryRecord.create({
  data: {
    // ... existing fields
    departmentId: employee.departmentId,
  },
  include: { department: true },
});
```

### Task 3: Add New Page Component

**Example: Add Salary Report Page**

**Step 1**: Create Component (`client/src/pages/SalaryReport.tsx`)
```typescript
import { useState, useEffect } from 'react';
import { salaryApi } from '../api/services';

const SalaryReport = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await salaryApi.generateReport(4, 2026);
      setData(response.data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Salary Report</h1>
      {/* Component JSX */}
    </div>
  );
};

export default SalaryReport;
```

**Step 2**: Add Route in App Router
```typescript
// In client/src/App.tsx
import SalaryReport from './pages/SalaryReport';

<Route path="/salary-report" element={<SalaryReport />} />
```

**Step 3**: Add Navigation Link
```typescript
// In client/src/components/Sidebar.tsx
<NavLink to="/salary-report">Salary Report</NavLink>
```

### Task 4: Add Error Handling

**Good Error Handling Pattern**:
```typescript
// Backend
export const generateSalary = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.body;

    // Input validation
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required',
        errorCode: 'INVALID_INPUT',
      });
    }

    // Business logic validation
    if (month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month',
        errorCode: 'INVALID_MONTH',
      });
    }

    // Perform operation
    const result = await performOperation();

    // Success response
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    // Log error for debugging
    console.error('Error in generateSalary:', error);

    // User-friendly error response
    res.status(500).json({
      success: false,
      message: 'An error occurred while generating salary',
      errorCode: 'INTERNAL_ERROR',
    });
  }
};

// Frontend
try {
  const response = await salaryApi.generateSalary(month, year);
  if (response.data.success) {
    // Show success
    toast.success('Salary generated successfully');
  }
} catch (error) {
  // Show error with user-friendly message
  const errorMessage = error.response?.data?.message || 'An error occurred';
  toast.error(errorMessage);
}
```

### Task 5: Add Role-Based Access

**Backend**:
```typescript
import { isAdmin, isManager, isHR } from '../middleware/role';

// Only admins can generate salary
router.post('/generate', isAdmin, generateSalary);

// Only admins and managers can view team data
router.get('/team-records', isAdminOrManager, getTeamRecords);

// All authenticated users can view own data
router.get('/my-records', authMiddleware, getOwnRecords);
```

**Frontend**:
```typescript
import { useAuth } from '../context/AuthContext';

const SalaryPage = () => {
  const { user } = useAuth();

  return (
    <div>
      {user?.role === 'ADMIN' && (
        <button onClick={generateSalary}>Generate Salary for All</button>
      )}

      {['ADMIN', 'MANAGER'].includes(user?.role) && (
        <button onClick={viewTeamSalary}>View Team Salary</button>
      )}

      <button onClick={viewOwnSalary}>View My Salary</button>
    </div>
  );
};
```

### Task 6: Add Pagination

**Backend**:
```typescript
const { page = 1, limit = 10 } = req.query;
const skip = (page - 1) * limit;

const [data, total] = await Promise.all([
  prisma.salaryRecord.findMany({ skip, take: limit }),
  prisma.salaryRecord.count(),
]);

res.json({
  success: true,
  data,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  },
});
```

**Frontend**:
```typescript
const [pagination, setPagination] = useState({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});

const fetchData = async () => {
  const response = await api.get('/salary/records', {
    params: { page: pagination.page, limit: pagination.limit },
  });
  setPagination(response.data.pagination);
};

// Render pagination buttons
<button onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>
  Previous
</button>
```

### Task 7: Add Audit Logging

**Pattern**:
```typescript
// After sensitive operation
await prisma.auditLog.create({
  data: {
    userId: req.user?.userId,
    action: 'GENERATE_SALARY',           // Action name
    entityType: 'SALARY_RECORD',         // Entity type
    entityId: salaryRecord.id,            // Entity ID
    description: `Salary generated for ${employee.fullName}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    companyId: req.user?.companyId,
    oldValue: JSON.stringify(oldData),   // Before update
    newValue: JSON.stringify(newData),   // After update
  },
});
```

---

## 🚀 RUNNING THE SYSTEM

### Start Backend
```bash
cd server
npm install              # First time only
npm run db:push         # Setup database
npm run dev             # Start development server (port 5000)
```

### Start Frontend
```bash
cd client
npm install              # First time only
npm run dev             # Start dev server (port 5173)
```

### Build for Production
```bash
cd server
npm run build

cd ../client
npm run build
```

---

## 🔍 DEBUGGING COMMON ISSUES

### Issue: 500 Error on Salary Generation
**Solution**:
1. Check if employee has salary structure: `SELECT * FROM SalaryStructure WHERE employeeId = '...'`
2. Check if employee exists: `SELECT * FROM User WHERE id = '...' AND status = 'ACTIVE'`
3. Check server logs for error details
4. Verify attendance data exists for the month

### Issue: Gallery Images Not Displaying
**Solution**:
1. Check vite.config.ts has `/uploads` proxy configured
2. Verify image URL is correct in database
3. Check uploads folder exists: `server/uploads/gallery/`
4. Restart dev server to pick up proxy changes

### Issue: "File not found on server"
**Solution**:
1. Check actual file exists: `ls server/uploads/documents/`
2. Check fileUrl in database matches actual filename
3. Verify file permissions (readable by Node.js process)
4. Check file wasn't manually deleted from uploads folder

### Issue: Duplicate Salary Generation
**Solution**:
1. Before running migrations: `DROP TABLE IF EXISTS SalaryRecord CASCADE;`
2. Apply unique constraint in schema.prisma
3. Run: `npm run db:push`
4. Verify constraint exists: `\d SalaryRecord` (in psql)

### Issue: Permission Denied Errors
**Solution**:
1. Check user role: `SELECT role FROM User WHERE id = '...'`
2. Verify route has correct middleware (isAdmin, isManager, etc.)
3. Check token is valid and not expired
4. Verify company/department/team relationships are correct

---

## 📊 TESTING CHECKLIST

Before deploying any changes:

```
□ Unit tests pass
□ Integration tests pass
□ API endpoints tested with Postman/Insomnia
□ Error scenarios tested (missing data, invalid input)
□ File uploads tested
□ File downloads tested
□ Pagination tested
□ Filters tested
□ Role-based access tested
□ PDF generation tested
□ Database constraints enforced
□ Audit logs created correctly
□ Notifications sent
□ Frontend displays correctly
□ Mobile responsive
□ All links work
□ All forms validate
□ Error messages user-friendly
```

---

## 📚 USEFUL COMMANDS

```bash
# Database
npm run db:generate     # Regenerate Prisma Client
npm run db:push         # Push schema to database
npm run db:studio       # Open Prisma Studio UI
npm run db:seed         # Run seed script
npm run db:migrate      # Run migrations

# Development
npm run dev             # Start dev server
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # Run linter
npm run type-check      # Check TypeScript

# Database queries (in psql)
\d                      # List all tables
\d SalaryRecord         # Describe SalaryRecord table
SELECT * FROM SalaryRecord;
SELECT COUNT(*) FROM User WHERE role = 'ADMIN';
```

---

## 🎯 NEXT STEPS

1. **Review** this quick reference frequently
2. **Read** SALARY_MODULE_ENHANCEMENT.md for specific implementation
3. **Check** COMPLETE_SYSTEM_INTEGRATION.md for full system overview
4. **Test** each feature thoroughly before committing
5. **Document** any new patterns or conventions you establish

---

**Last Updated**: April 28, 2026
**Version**: 1.0
**Maintainer**: Development Team

