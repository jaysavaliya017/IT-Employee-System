import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Upload gallery image
export const uploadGalleryImage = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, visibilityType, companyId, departmentId, teamId, employeeId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const imageUrl = `/uploads/gallery/${file.filename}`;

    const galleryImage = await prisma.galleryImage.create({
      data: {
        title,
        description,
        imageUrl,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        category,
        visibilityType: visibilityType || 'ALL',
        companyId: companyId || req.user?.companyId,
        departmentId: departmentId || null,
        teamId: teamId || null,
        employeeId: employeeId || null,
        uploadedBy: req.user?.userId!,
      },
      include: {
        uploadedByUser: { select: { id: true, fullName: true, employeeCode: true } },
        company: true,
        department: true,
        team: true,
      },
    });

    // Create notifications for visibility
    await createGalleryNotifications(galleryImage, req.user?.userId!);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'UPLOAD_GALLERY_IMAGE',
        entityType: 'GALLERY_IMAGE',
        entityId: galleryImage.id,
        description: `Gallery image "${title}" uploaded`,
        companyId: req.user?.companyId,
      },
    });

    return res.status(201).json({ success: true, data: galleryImage });
  } catch (error) {
    console.error('Error in uploadGalleryImage:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get gallery images with filters
export const getGalleryImages = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, category, search, featured } = req.query;

    const where: any = { isFeatured: featured === 'true' ? true : undefined };

    // Role-based visibility
    if (req.user?.role === 'EMPLOYEE') {
      where.OR = [
        { visibilityType: 'ALL', companyId: req.user.companyId },
        { visibilityType: 'COMPANY', companyId: req.user.companyId },
        { visibilityType: 'DEPARTMENT', departmentId: req.user.departmentId },
        { visibilityType: 'TEAM', teamId: req.user.teamId },
        { visibilityType: 'EMPLOYEE', employeeId: req.user.userId },
        { uploadedBy: req.user.userId },
      ];
    } else if (req.user?.role === 'MANAGER' || req.user?.role === 'TEAM_LEADER') {
      const teamMembers = await prisma.user.findMany({
        where: { teamLeaderId: req.user.userId },
        select: { id: true },
      });
      where.OR = [
        { visibilityType: { in: ['ALL', 'COMPANY'] }, companyId: req.user.companyId },
        { visibilityType: 'DEPARTMENT', departmentId: req.user.departmentId },
        { visibilityType: 'TEAM', teamId: req.user.teamId },
        { uploadedBy: req.user.userId },
        { employeeId: { in: teamMembers.map((m: any) => m.id) } },
      ];
    } else {
      where.companyId = req.user?.companyId;
    }

    if (category) where.category = category;
    if (search) where.title = { contains: search as string, mode: 'insensitive' };

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [images, total] = await Promise.all([
      prisma.galleryImage.findMany({
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
      prisma.galleryImage.count({ where }),
    ]);

    // Get categories for filter
    const categories = await prisma.galleryImage.groupBy({
      by: ['category'],
      where: { category: { not: null }, companyId: req.user?.companyId },
    });

    return res.status(200).json({
      success: true,
      data: {
        images,
        categories: categories.map((c: any) => c.category).filter(Boolean),
        pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total, totalPages: Math.ceil(total / parseInt(limit as string)) },
      },
    });
  } catch (error) {
    console.error('Error in getGalleryImages:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get single gallery image
export const getGalleryImageById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const image = await prisma.galleryImage.findUnique({
      where: { id },
      include: {
        uploadedByUser: { select: { id: true, fullName: true, employeeCode: true, profileImage: true } },
        company: true,
        department: true,
        team: true,
      },
    });

    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    return res.status(200).json({ success: true, data: image });
  } catch (error) {
    console.error('Error in getGalleryImageById:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update gallery image
export const updateGalleryImage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, category, visibilityType, departmentId, teamId, employeeId, isFeatured } = req.body;

    const image = await prisma.galleryImage.findUnique({ where: { id } });

    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    // Access control
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN' && req.user?.role !== 'HR' && image.uploadedBy !== req.user?.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const updated = await prisma.galleryImage.update({
      where: { id },
      data: {
        title,
        description,
        category,
        visibilityType,
        departmentId,
        teamId,
        employeeId,
        isFeatured,
      },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in updateGalleryImage:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Delete gallery image
export const deleteGalleryImage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const image = await prisma.galleryImage.findUnique({ where: { id } });

    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    // Access control
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN' && req.user?.role !== 'HR' && image.uploadedBy !== req.user?.userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Delete file
    const filePath = path.join(process.cwd(), 'uploads', 'gallery', image.fileName || '');
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.galleryImage.delete({ where: { id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId,
        action: 'DELETE_GALLERY_IMAGE',
        entityType: 'GALLERY_IMAGE',
        entityId: id,
        description: `Gallery image "${image.title}" deleted`,
        companyId: req.user?.companyId,
      },
    });

    return res.status(200).json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error in deleteGalleryImage:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Helper function to create notifications for gallery images
async function createGalleryNotifications(image: any, uploadedById: string) {
  let targetUsers: string[] = [];

  switch (image.visibilityType) {
    case 'ALL':
      const allUsers = await prisma.user.findMany({
        where: { companyId: image.companyId, status: 'ACTIVE' },
        select: { id: true },
      });
      targetUsers = allUsers.map((u: any) => u.id);
      break;
    case 'COMPANY':
      const companyUsers = await prisma.user.findMany({
        where: { companyId: image.companyId, status: 'ACTIVE' },
        select: { id: true },
      });
      targetUsers = companyUsers.map((u: any) => u.id);
      break;
    case 'DEPARTMENT':
      const deptUsers = await prisma.user.findMany({
        where: { departmentId: image.departmentId, status: 'ACTIVE' },
        select: { id: true },
      });
      targetUsers = deptUsers.map((u: any) => u.id);
      break;
    case 'TEAM':
      const teamUsers = await prisma.user.findMany({
        where: { teamId: image.teamId, status: 'ACTIVE' },
        select: { id: true },
      });
      targetUsers = teamUsers.map((u: any) => u.id);
      break;
    case 'EMPLOYEE':
      targetUsers = [image.employeeId];
      break;
  }

  // Remove uploader from notifications
  targetUsers = targetUsers.filter((id) => id !== uploadedById);

  await prisma.notification.createMany({
    data: targetUsers.map((userId) => ({
      userId,
      title: 'New Gallery Image',
      message: `${image.title} - ${image.description || 'Check out the new gallery image!'}`,
      type: 'GALLERY_IMAGE',
      referenceId: image.id,
      referenceType: 'GALLERY_IMAGE',
    })),
  });
}
