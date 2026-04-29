import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, ApiResponse } from '../types';

export const getDepartments = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: {
        departments,
      },
    });
  } catch (error) {
    console.error('Get Departments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
