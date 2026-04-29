import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Create policy
export const createPolicy = async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, policyType, version, effectiveDate } = req.body;

    if (!title || !content || !policyType) {
      return res.status(400).json({ success: false, message: 'Title, content and policy type are required' });
    }

    // Get file URL from uploaded file if present
    const fileUrl = req.file ? `/uploads/policies/${req.file.filename}` : null;

    const policy = await prisma.policy.create({
      data: {
        title,
        content,
        policyType,
        fileUrl,
        version: version || '1.0',
        effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
        companyId: req.user?.companyId!,
        createdBy: req.user?.userId!,
      },
      include: {
        creator: { select: { id: true, fullName: true, employeeCode: true } },
        company: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'CREATE_POLICY',
        entityType: 'POLICY',
        entityId: policy.id,
        description: `Policy "${title}" created`,
        companyId: req.user?.companyId,
      },
    });

    return res.status(201).json({ success: true, data: policy });
  } catch (error) {
    console.error('Error in createPolicy:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get policies
export const getPolicies = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, policyType, search } = req.query;

    const where: any = { isActive: true, companyId: req.user?.companyId };
    if (policyType) where.policyType = policyType;
    if (search) where.title = { contains: search as string, mode: 'insensitive' };

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [policies, total] = await Promise.all([
      prisma.policy.findMany({
        where,
        include: {
          creator: { select: { id: true, fullName: true, employeeCode: true } },
          company: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.policy.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        policies,
        pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total, totalPages: Math.ceil(total / parseInt(limit as string)) },
      },
    });
  } catch (error) {
    console.error('Error in getPolicies:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get single policy
export const getPolicyById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const policy = await prisma.policy.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, fullName: true, employeeCode: true } },
        company: true,
      },
    });

    if (!policy) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }

    return res.status(200).json({ success: true, data: policy });
  } catch (error) {
    console.error('Error in getPolicyById:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update policy
export const updatePolicy = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, policyType, version, effectiveDate, isActive } = req.body;

    const policy = await prisma.policy.findUnique({ where: { id } });

    if (!policy) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }

    // If a new file is uploaded, use that; otherwise keep the existing fileUrl
    const fileUrl = req.file ? `/uploads/policies/${req.file.filename}` : policy.fileUrl;

    const updated = await prisma.policy.update({
      where: { id },
      data: { title, content, policyType, fileUrl, version, effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined, isActive },
      include: {
        creator: { select: { id: true, fullName: true, employeeCode: true } },
        company: { select: { id: true, name: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'UPDATE_POLICY',
        entityType: 'POLICY',
        entityId: id,
        description: `Policy "${title}" updated`,
        companyId: req.user?.companyId,
      },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in updatePolicy:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Delete policy
export const deletePolicy = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const policy = await prisma.policy.findUnique({ where: { id } });

    if (!policy) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }

    await prisma.policy.update({
      where: { id },
      data: { isActive: false },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'DELETE_POLICY',
        entityType: 'POLICY',
        entityId: id,
        description: `Policy "${policy.title}" deleted`,
        companyId: req.user?.companyId,
      },
    });

    return res.status(200).json({ success: true, message: 'Policy deleted successfully' });
  } catch (error) {
    console.error('Error in deletePolicy:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Helper function to resolve stored policy file path
const getStoredPolicyPath = (fileUrl: string | null | undefined) => {
  if (!fileUrl) return null;
  
  const uploadRoot = path.join(process.cwd(), 'uploads', 'policies');
  const fileName = path.basename(fileUrl);
  const candidatePath = path.join(uploadRoot, fileName);
  
  if (fs.existsSync(candidatePath)) {
    return candidatePath;
  }
  return null;
};

// Download policy document
export const downloadPolicy = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const policy = await prisma.policy.findUnique({
      where: { id },
      include: { company: { select: { id: true, name: true } } },
    });

    if (!policy) {
      return res.status(404).json({ success: false, message: 'Policy not found' });
    }

    // Check access - user must be from same company
    if (policy.companyId !== req.user?.companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // If no file attached, generate PDF from content
    if (!policy.fileUrl) {
      // For now, return error. In production, you could generate PDF
      return res.status(404).json({ success: false, message: 'No document attached to this policy' });
    }

    const filePath = getStoredPolicyPath(policy.fileUrl);

    if (!filePath) {
      return res.status(404).json({ success: false, message: 'File not found on server. It may have been deleted or moved.' });
    }

    // Set headers for download
    const fileName = `${policy.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${policy.version}.${path.extname(filePath).slice(1)}`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        return res.status(500).json({ success: false, message: 'Error downloading file' });
      }
    });
  } catch (error) {
    console.error('Error in downloadPolicy:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
