import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { Role } from '@prisma/client';

export const roleMiddleware = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const userRole = req.user.role as Role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
    }

    next();
  };
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  const adminRoles: Role[] = ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER'];
  const userRole = req.user.role as Role;

  if (!adminRoles.includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }

  next();
};

export const isTeamLeaderOrAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  const allowedRoles: Role[] = ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'TEAM_LEADER'];
  const userRole = req.user.role as Role;

  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied.',
    });
  }

  next();
};

export const isTeamLeader = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  const teamLeaderRoles: Role[] = ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'TEAM_LEADER'];
  const userRole = req.user.role as Role;

  if (!teamLeaderRoles.includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied.',
    });
  }

  next();
};
