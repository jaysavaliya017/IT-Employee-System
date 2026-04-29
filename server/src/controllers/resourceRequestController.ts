import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { AuthRequest, ApiResponse } from '../types';

const createResourceRequestSchema = z.object({
  requestType: z.enum(['BOOKS', 'PENS', 'MOUSE', 'KEYBOARD', 'HEADSET', 'LAPTOP', 'OTHER']),
  description: z.string().optional(),
});

const updateResourceRequestSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  rejectionReason: z.string().optional(),
});

export const createResourceRequest = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const data = createResourceRequestSchema.parse(req.body);

    const resourceRequest = await prisma.resourceRequest.create({
      data: {
        userId: req.user.userId,
        requestType: data.requestType,
        description: data.description,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            employeeCode: true,
            department: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Resource request submitted successfully',
      data: { resourceRequest },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    console.error('Create Resource Request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getMyResourceRequests = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { status } = req.query;
    const where: any = { userId: req.user.userId };
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const resourceRequests = await prisma.resourceRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            employeeCode: true,
            department: true,
          },
        },
        approver: {
          select: {
            fullName: true,
          },
        },
        rejecter: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: { resourceRequests },
    });
  } catch (error) {
    console.error('Get My Resource Requests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getAllResourceRequests = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { status, departmentId, page = '1', limit = '10' } = req.query;
    const where: any = {
      user: {
        companyId: req.user.companyId,
      },
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (departmentId) {
      where.user.departmentId = departmentId;
    }

    if (req.user.role === 'TEAM_LEADER') {
      where.user.teamLeaderId = req.user.userId;
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [resourceRequests, total] = await Promise.all([
      prisma.resourceRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              employeeCode: true,
              department: true,
              teamLeader: true,
            },
          },
          approver: {
            select: {
              fullName: true,
            },
          },
          rejecter: {
            select: {
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.resourceRequest.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        resourceRequests,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Get All Resource Requests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const approveResourceRequest = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { id } = req.params;

    const existingRequest = await prisma.resourceRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: 'Resource request not found',
      });
    }

    if (existingRequest.user.companyId !== req.user.companyId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve this request',
      });
    }

    if (existingRequest.user.teamLeaderId !== req.user.userId && !['ADMIN', 'HR', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve this request',
      });
    }

    const resourceRequest = await prisma.resourceRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: req.user.userId,
        approvedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            employeeCode: true,
            department: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Resource request approved successfully',
      data: { resourceRequest },
    });
  } catch (error) {
    console.error('Approve Resource Request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const rejectResourceRequest = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { id } = req.params;
    const { rejectionReason } = updateResourceRequestSchema.parse(req.body);

    const existingRequest = await prisma.resourceRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: 'Resource request not found',
      });
    }

    if (existingRequest.user.companyId !== req.user.companyId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this request',
      });
    }

    if (existingRequest.user.teamLeaderId !== req.user.userId && !['ADMIN', 'HR', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this request',
      });
    }

    const resourceRequest = await prisma.resourceRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedBy: req.user.userId,
        rejectionReason: rejectionReason || 'Request rejected',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            employeeCode: true,
            department: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Resource request rejected successfully',
      data: { resourceRequest },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    console.error('Reject Resource Request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};