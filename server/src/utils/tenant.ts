import { Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { AuthRequest, ApiResponse } from '../types';

export const companyIdOf = (req: AuthRequest): string => {
  const companyId = req.user?.companyId;
  if (!companyId) throw new TenantError('Session is missing company context. Please sign in again.', 401);
  return companyId;
};

export class TenantError extends Error {
  constructor(message: string, public status = 403) {
    super(message);
    this.name = 'TenantError';
  }
}

type OwnedModel = 'shift' | 'department' | 'team' | 'holiday' | 'leaveType' | 'user';

export const findOwned = async <T = any>(
  model: OwnedModel,
  id: string,
  companyId: string,
  options: { include?: any; select?: any } = {}
): Promise<T> => {
  const record = await (prisma as any)[model].findFirst({
    where: { id, companyId },
    ...options,
  });

  if (!record) {
    throw new TenantError('Record not found', 404);
  }

  return record as T;
};

export const assertUsersInCompany = async (userIds: string[], companyId: string) => {
  const ids = userIds.filter(Boolean);
  if (ids.length === 0) return;

  const count = await prisma.user.count({
    where: { id: { in: ids }, companyId },
  });

  if (count !== ids.length) {
    throw new TenantError('One or more employees do not belong to your company', 403);
  }
};

export const handleError = (res: Response<ApiResponse>, error: any, fallback: string) => {
  if (error instanceof TenantError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }

  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.errors.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  if (error?.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'A record with this name already exists in your company',
    });
  }

  if (error?.code === 'P2003') {
    return res.status(409).json({
      success: false,
      message: 'This record is still linked to other data and cannot be removed',
    });
  }

  if (error?.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }

  console.error(`${fallback}:`, error);
  return res.status(500).json({ success: false, message: fallback });
};
