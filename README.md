# ProAttend - IT Company Attendance & Leave Management System

A complete full-stack attendance and leave management system for IT companies built with React, TypeScript, Node.js, Express, Prisma, and PostgreSQL.

## Features

### Employee Features
- Punch In / Punch Out with time tracking
- Monthly Attendance Calendar
- Leave Balance & Application
- Profile Management
- Holiday View
- Leave History

### Team Leader Features
- Team Dashboard with attendance overview
- Team Members' Attendance View
- Team Members' Leave Management
- Approve/Reject Leave Requests (if enabled)
- Team Attendance Calendar

### Admin/HR Features
- Admin Dashboard with company-wide statistics
- Employee Management (CRUD)
- Team Management
- Shift Management
- Holiday Management
- Leave Request Management
- Attendance Reports
- Department-wise Reports
- Export to CSV/Excel

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- React Hook Form
- Recharts
- Lucide Icons

### Backend
- Node.js + Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- bcryptjs

## Project Structure

```
IT Employee system/
├── server/                 # Backend
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── types/
│       ├── utils/
│       ├── app.ts
│       └── server.ts
├── client/                 # Frontend
│   └── src/
│       ├── api/
│       ├── components/
│       ├── contexts/
│       ├── hooks/
│       ├── layouts/
│       ├── pages/
│       ├── types/
│       ├── utils/
│       ├── App.tsx
│       └── main.tsx
├── .env.example
├── README.md
└── LICENSE
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Database Setup

1. **Create PostgreSQL database**
   ```sql
   CREATE DATABASE proattend;
   ```

2. **Navigate to server directory**
   ```bash
   cd server
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Copy environment file**
   ```bash
   cp .env.example .env
   ```

5. **Update .env with your PostgreSQL credentials**
   ```
   DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/proattend?schema=public"
   JWT_SECRET="your-secret-key-here"
   JWT_REFRESH_SECRET="your-refresh-secret-key-here"
   ```

6. **Run database migration**
   ```bash
   npx prisma migrate dev --name init
   ```

7. **Seed database with sample data**
   ```bash
   npx prisma db seed
   ```

8. **Start development server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to client directory**
   ```bash
   cd client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   Navigate to `http://localhost:5173`

## Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@proattend.com | SuperAdmin@123 |
| HR/Admin | admin@proattend.com | Admin@123 |
| Manager | manager@proattend.com | Manager@123 |
| Team Leader | teamleader@proattend.com | Leader@123 |
| Employee | employee@proattend.com | Employee@123 |

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Attendance
- `POST /api/attendance/punch-in` - Punch in
- `POST /api/attendance/punch-out` - Punch out
- `GET /api/attendance/today` - Get today's attendance
- `GET /api/attendance/monthly` - Get monthly attendance

### Leave
- `GET /api/leaves/balance` - Get leave balance
- `POST /api/leaves/apply` - Apply for leave
- `GET /api/leaves/my-requests` - Get my leave requests
- `GET /api/leaves/admin/requests` - Get all leave requests (admin)
- `PUT /api/leaves/:id/approve` - Approve leave
- `PUT /api/leaves/:id/reject` - Reject leave

### Employees (Admin)
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Teams (Admin)
- `GET /api/teams` - Get all teams
- `POST /api/teams` - Create team
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team
- `POST /api/teams/:id/members` - Add team member
- `DELETE /api/teams/:id/members/:userId` - Remove team member

### Shifts (Admin)
- `GET /api/shifts` - Get all shifts
- `POST /api/shifts` - Create shift
- `PUT /api/shifts/:id` - Update shift
- `DELETE /api/shifts/:id` - Delete shift

### Holidays (Admin)
- `GET /api/holidays` - Get all holidays
- `POST /api/holidays` - Create holiday
- `PUT /api/holidays/:id` - Update holiday
- `DELETE /api/holidays/:id` - Delete holiday

### Dashboard
- `GET /api/dashboard/employee` - Employee dashboard
- `GET /api/dashboard/admin` - Admin dashboard
- `GET /api/dashboard/team-leader` - Team leader dashboard

### Team Leader
- `GET /api/team-leader/dashboard` - Team leader dashboard
- `GET /api/team-leader/team-members` - Get team members
- `GET /api/team-leader/team-attendance/today` - Today's team attendance
- `GET /api/team-leader/team-attendance/monthly` - Monthly team attendance
- `GET /api/team-leader/team-leaves` - Get team leaves
- `PUT /api/team-leader/leaves/:id/approve` - Approve team leave
- `PUT /api/team-leader/leaves/:id/reject` - Reject team leave

### Reports (Admin)
- `GET /api/reports/monthly-attendance` - Monthly attendance report
- `GET /api/reports/employee-attendance` - Employee attendance report
- `GET /api/reports/department-attendance` - Department attendance report
- `GET /api/reports/team-attendance` - Team attendance report
- `GET /api/reports/leave` - Leave report
- `GET /api/reports/late-arrivals` - Late arrivals report

## Database Schema

### Core Tables
- `users` - User accounts with roles
- `departments` - Company departments
- `teams` - Work teams
- `team_members` - Team membership junction
- `shifts` - Work shift definitions
- `attendances` - Daily attendance records
- `leave_types` - Types of leave available
- `leave_balances` - Leave balance per user per type
- `leave_requests` - Leave applications
- `leave_approval_settings` - System settings for leave approval
- `holidays` - Company holidays
- `announcements` - Company announcements

### Enums
- `Role` - SUPER_ADMIN, ADMIN, HR, MANAGER, TEAM_LEADER, EMPLOYEE
- `AttendanceStatus` - PRESENT, ABSENT, HALF_DAY, PAID_LEAVE, etc.
- `LeaveStatus` - PENDING, APPROVED, REJECTED
- `UserStatus` - ACTIVE, INACTIVE

## Role-Based Access Control

| Feature | Employee | Team Leader | Admin |
|---------|----------|------------|-------|
| Dashboard | Own data | Team + Own | Company-wide |
| Punch In/Out | Yes | Yes | Yes |
| Leave Apply | Yes | Yes | Yes |
| Leave Approve | No | Team (if enabled) | Yes |
| Team Attendance | No | Team only | All |
| Employee CRUD | No | No | Yes |
| Team CRUD | No | No | Yes |
| Shift CRUD | No | No | Yes |
| Holiday CRUD | No | No | Yes |
| Reports | No | Team | All |

## Environment Variables

### Server (.env)
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/proattend
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## Development

### Running Tests
```bash
# Backend
cd server
npm run test

# Frontend
cd client
npm run test
```

### Building for Production

```bash
# Backend
cd server
npm run build
npm start

# Frontend
cd client
npm run build
```

## License

This project is proprietary software for IT Company use.

## Support

For support, please contact the development team.
