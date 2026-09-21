import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseStorageService } from '../storage/supabase-storage.service';

const BUCKET = 'cms-files';

@Injectable()
export class FileUploadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: SupabaseStorageService,
  ) {}

  /**
   * Upload a file to Supabase Storage and save metadata to database
   */
  async uploadFile(file: Express.Multer.File, userId: string, alt?: string) {
    if (!file) {
      throw new Error('No file provided');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.originalname.includes('.')
      ? file.originalname.slice(file.originalname.lastIndexOf('.'))
      : '';
    const base = file.originalname.includes('.')
      ? file.originalname.slice(0, file.originalname.lastIndexOf('.'))
      : file.originalname;
    const filename = `${base}-${timestamp}${ext}`;

    await this.storage.upload(BUCKET, filename, file.buffer, file.mimetype);
    const url = this.storage.getPublicUrl(BUCKET, filename);

    // Save metadata to database
    const cmsFile = await this.prisma.cMSFile.create({
      data: {
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url,
        uploadedBy: userId,
        alt: alt || null,
        tags: '[]',
      },
    });

    return cmsFile;
  }

  /**
   * Get all files uploaded by a user
   */
  async getUserFiles(userId: string, limit = 50) {
    return this.prisma.cMSFile.findMany({
      where: { uploadedBy: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Delete a file from Supabase Storage and the database
   */
  async deleteFile(fileId: string) {
    const file = await this.prisma.cMSFile.findUnique({ where: { id: fileId } });

    if (!file) {
      throw new Error('File not found');
    }

    // Check if file is in use
    if (file.usageCount > 0) {
      throw new Error(`File is in use by ${file.usageCount} blocks`);
    }

    await this.storage.remove(BUCKET, file.filename);

    // Delete from database
    return this.prisma.cMSFile.delete({ where: { id: fileId } });
  }

  /**
   * Increment usage count when a block uses this file
   */
  async incrementUsage(fileId: string) {
    return this.prisma.cMSFile.update({
      where: { id: fileId },
      data: { usageCount: { increment: 1 } },
    });
  }

  /**
   * Decrement usage count when a block stops using this file
   */
  async decrementUsage(fileId: string) {
    return this.prisma.cMSFile.update({
      where: { id: fileId },
      data: { usageCount: { decrement: 1 } },
    });
  }

  /**
   * Update file metadata (alt text, tags)
   */
  async updateFileMetadata(fileId: string, alt?: string, tags?: string[]) {
    return this.prisma.cMSFile.update({
      where: { id: fileId },
      data: {
        alt: alt || undefined,
        tags: tags ? JSON.stringify(tags) : undefined,
      },
    });
  }
}
