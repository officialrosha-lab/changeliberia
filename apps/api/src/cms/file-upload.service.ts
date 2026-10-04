import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3StorageService } from '../storage/s3-storage.service';
import { apiPublicBaseUrl } from '../storage/public-base-url';
import * as path from 'path';

const KEY_PREFIX = 'cms-files/';

@Injectable()
export class FileUploadService {
  private readonly publicBase: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3StorageService,
  ) {
    this.publicBase = apiPublicBaseUrl(process.env.CMS_FILES_PUBLIC_BASE_URL);
    if (process.env.NODE_ENV === 'production' && !this.s3.isConfigured()) {
      throw new Error(
        'MEDIA_BUCKET_* environment variables must be set in production — refusing to fall back to ephemeral local disk for CMS files.',
      );
    }
  }

  /**
   * Upload a file and save metadata to database
   */
  async uploadFile(file: Express.Multer.File, userId: string, alt?: string) {
    if (!file) {
      throw new Error('No file provided');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const filename = `${name}-${timestamp}${ext}`;

    await this.s3.putObject(
      `${KEY_PREFIX}${filename}`,
      file.buffer,
      file.mimetype,
    );

    // Save metadata to database
    const cmsFile = await this.prisma.cMSFile.create({
      data: {
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `${this.publicBase}/api/v1/cms/files/${filename}`,
        uploadedBy: userId,
        alt: alt || null,
        tags: '[]',
      },
    });

    return cmsFile;
  }

  /**
   * Get user's uploaded files
   */
  async getUserFiles(userId: string, limit = 50) {
    return this.prisma.cMSFile.findMany({
      where: { uploadedBy: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Fetch a file's bytes by its stored filename, for serving.
   */
  async getFileBuffer(filename: string) {
    return this.s3.getObject(`${KEY_PREFIX}${filename}`);
  }

  /**
   * Delete a file from storage and database
   */
  async deleteFile(fileId: string) {
    const file = await this.prisma.cMSFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new Error('File not found');
    }

    // Check if file is in use
    if (file.usageCount > 0) {
      throw new Error(`File is in use by ${file.usageCount} blocks`);
    }

    // Delete from database (object left in the bucket — not worth a
    // best-effort remote delete call failing this operation)
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
