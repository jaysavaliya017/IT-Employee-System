import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

const getStoredDocumentPath = (document: { fileUrl?: string | null; fileName?: string | null }) => {
  const uploadRoot = path.join(process.cwd(), 'uploads', 'documents');
  const candidates = [
    document.fileUrl ? path.basename(document.fileUrl) : '',
    document.fileName || '',
  ].filter(Boolean);

  for (const candidate of candidates) {
    const candidatePath = path.join(uploadRoot, candidate);
    if (fs.existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  return path.join(uploadRoot, candidates[0] || '');
};

// Upload document
export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, documentType, visibilityType, companyId, departmentId, teamId, targetEmployeeId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    if (!title || !documentType) {
      return res.status(400).json({ success: false, message: 'Title and document type are required' });
    }

    const fileUrl = `/uploads/documents/${file.filename}`;

    const document = await prisma.document.create({
      data: {
        title,
        description,
        documentType,
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        visibilityType: visibilityType || 'COMPANY',
        companyId: companyId || req.user?.companyId,
        departmentId: departmentId || null,
        teamId: teamId || null,
        targetEmployeeId: targetEmployeeId || null,
        uploadedBy: req.user?.userId!,
      },
      include: {
        uploadedByUser: { select: { id: true, fullName: true, employeeCode: true } },
        company: true,
        department: true,
        team: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'UPLOAD_DOCUMENT',
        entityType: 'DOCUMENT',
        entityId: document.id,
        description: `Document "${title}" uploaded`,
        companyId: req.user?.companyId,
      },
    });

    return res.status(201).json({ success: true, data: document });
  } catch (error) {
    console.error('Error in uploadDocument:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get documents
export const getDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, documentType, visibilityType, search } = req.query;

    const where: any = { isActive: true };

    // Role-based filtering
    if (req.user?.role === 'EMPLOYEE') {
      where.OR = [
        { visibilityType: 'ALL', companyId: req.user.companyId },
        { visibilityType: 'COMPANY', companyId: req.user.companyId },
        { visibilityType: 'DEPARTMENT', departmentId: req.user.departmentId },
        { visibilityType: 'TEAM', teamId: req.user.teamId },
        { visibilityType: 'EMPLOYEE', targetEmployeeId: req.user.userId },
        { uploadedBy: req.user.userId },
      ];
    } else if (req.user?.role === 'MANAGER' || req.user?.role === 'TEAM_LEADER') {
      where.companyId = req.user.companyId;
    } else {
      where.companyId = req.user?.companyId;
    }

    if (documentType) where.documentType = documentType;
    if (visibilityType) where.visibilityType = visibilityType;
    if (search) where.title = { contains: search as string, mode: 'insensitive' };

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          uploadedByUser: { select: { id: true, fullName: true, employeeCode: true, profileImage: true } },
          company: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          team: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.document.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        documents,
        pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total, totalPages: Math.ceil(total / parseInt(limit as string)) },
      },
    });
  } catch (error) {
    console.error('Error in getDocuments:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get single document
export const getDocumentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        uploadedByUser: { select: { id: true, fullName: true, employeeCode: true, profileImage: true } },
        company: true,
        department: true,
        team: true,
      },
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    return res.status(200).json({ success: true, data: document });
  } catch (error) {
    console.error('Error in getDocumentById:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Download document
export const downloadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({ where: { id } });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Access check
    if (req.user?.role === 'EMPLOYEE') {
      const hasAccess =
        (document.visibilityType === 'ALL' && document.companyId === req.user.companyId) ||
        (document.visibilityType === 'COMPANY' && document.companyId === req.user.companyId) ||
        (document.visibilityType === 'DEPARTMENT' && document.departmentId === req.user.departmentId) ||
        (document.visibilityType === 'TEAM' && document.teamId === req.user.teamId) ||
        (document.visibilityType === 'EMPLOYEE' && document.targetEmployeeId === req.user.userId) ||
        document.uploadedBy === req.user.userId;

      if (!hasAccess) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'DOWNLOAD_DOCUMENT',
        entityType: 'DOCUMENT',
        entityId: id,
        description: `Document "${document.title}" downloaded`,
        companyId: req.user?.companyId,
      },
    });

    const filePath = getStoredDocumentPath(document);

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    const downloadName = document.fileName || path.basename(filePath) || 'document';

    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    res.setHeader('Content-Length', document.fileSize || 0);

    return res.status(200).sendFile(filePath);
  } catch (error) {
    console.error('Error in downloadDocument:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Delete document
export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({ where: { id } });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Only uploader or admin can delete
    if (document.uploadedBy !== req.user?.userId && !['SUPER_ADMIN', 'ADMIN', 'HR'].includes(req.user?.role || '')) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Delete file
    const filePath = getStoredDocumentPath(document);
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.document.delete({ where: { id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'DELETE_DOCUMENT',
        entityType: 'DOCUMENT',
        entityId: id,
        description: `Document "${document.title}" deleted`,
        companyId: req.user?.companyId,
      },
    });

    return res.status(200).json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error in deleteDocument:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
