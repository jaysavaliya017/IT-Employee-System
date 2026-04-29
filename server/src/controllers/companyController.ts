import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { AuthRequest, ApiResponse } from '../types';

const createCompanySchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(32),
  isActive: z.boolean().optional(),
});

const updateCompanySchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().min(2).max(32).optional(),
  isActive: z.boolean().optional(),
});

const updateCompanyStatusSchema = z.object({
  isActive: z.boolean(),
});

export const getCompanies = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const companies = await prisma.company.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: { companies },
    });
  } catch (error) {
    console.error('Get Companies error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createCompany = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const data = createCompanySchema.parse(req.body);

    const existing = await prisma.company.findFirst({
      where: {
        OR: [
          { name: { equals: data.name.trim(), mode: 'insensitive' } },
          { code: { equals: data.code.trim().toUpperCase() } },
        ],
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Company with same name or code already exists',
      });
    }

    const company = await prisma.company.create({
      data: {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        isActive: data.isActive ?? true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: { company },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }

    console.error('Create Company error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateCompany = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { id } = req.params;
    const data = updateCompanySchema.parse(req.body);

    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    if (data.name || data.code) {
      const duplicate = await prisma.company.findFirst({
        where: {
          id: { not: id },
          OR: [
            data.name ? { name: { equals: data.name.trim(), mode: 'insensitive' } } : undefined,
            data.code ? { code: { equals: data.code.trim().toUpperCase() } } : undefined,
          ].filter(Boolean) as any,
        },
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Another company with same name or code already exists',
        });
      }
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        code: data.code?.trim().toUpperCase(),
        isActive: data.isActive,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      data: { company },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }

    console.error('Update Company error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateCompanyStatus = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { id } = req.params;
    const { isActive } = updateCompanyStatusSchema.parse(req.body);

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true } },
      },
    });

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    if (!isActive && company.id === req.user.companyId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your currently logged-in company',
      });
    }

    const updated = await prisma.company.update({
      where: { id },
      data: { isActive },
    });

    return res.status(200).json({
      success: true,
      message: isActive ? 'Company activated successfully' : 'Company deactivated successfully',
      data: { company: updated },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }

    console.error('Update Company Status error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
