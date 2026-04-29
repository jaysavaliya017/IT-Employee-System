import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../config/database';
import { config } from '../config';
import { AuthRequest, ApiResponse, JwtPayload } from '../types';

const loginSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const companyValidationSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(1, 'Full name is required'),
  employeeCode: z.string().min(1, 'Employee code is required'),
  departmentId: z.string().optional(),
  designation: z.string().optional(),
  role: z.string().optional(),
});

const resolveCompany = async (companyName: string) => {
  const normalized = companyName.trim();
  if (!normalized) {
    return null;
  }

  return prisma.company.findFirst({
    where: {
      OR: [
        { name: { equals: normalized, mode: 'insensitive' } },
        { code: { equals: normalized.toUpperCase() } },
      ],
    },
  });
};

export const validateCompany = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const { companyName } = companyValidationSchema.parse(req.body);
    const company = await resolveCompany(companyName);

    if (!company || !company.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Company is not eligible for this LMS',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Company is eligible',
      data: {
        company: {
          id: company.id,
          name: company.name,
          code: company.code,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }

    console.error('Validate Company error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const login = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const { companyName, email, password } = loginSchema.parse(req.body);
    const company = await resolveCompany(companyName);

    if (!company || !company.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Company is not eligible for this LMS',
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        email,
        companyId: company.id,
      },
      include: {
        company: true,
        department: true,
        shift: true,
        teamLeader: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (user.status === 'INACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact HR.',
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        companyCode: user.company.code,
      },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        companyCode: user.company.code,
      },
      config.jwtRefreshSecret,
      { expiresIn: '7d' }
    );

    const { passwordHash, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const register = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const data = registerSchema.parse(req.body);

    const defaultCompany = await prisma.company.findFirst({
      where: { code: 'PROATTEND', isActive: true },
    });

    if (!defaultCompany) {
      return res.status(400).json({
        success: false,
        message: 'No eligible company found for registration',
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const existingCode = await prisma.user.findUnique({
      where: { employeeCode: data.employeeCode },
    });

    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: 'Employee code already exists',
      });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        companyId: defaultCompany.id,
        fullName: data.fullName,
        employeeCode: data.employeeCode,
        departmentId: data.departmentId,
        designation: data.designation,
        role: data.role as any || 'EMPLOYEE',
      },
      include: {
        company: true,
        department: true,
        shift: true,
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        company: true,
        department: true,
        shift: true,
        teamLeader: true,
        manager: true,
        team: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const { passwordHash, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      data: {
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const refreshToken = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        company: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const newAccessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        companyCode: user.company.code,
      },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    const newRefreshToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        companyCode: user.company.code,
      },
      config.jwtRefreshSecret,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
    });
  }
};

export const logout = async (req: AuthRequest, res: Response<ApiResponse>) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};
