import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class FileUploadService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(private readonly prisma: PrismaService) {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
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
    const filepath = path.join(this.uploadDir, filename);

    // Write file to disk
    fs.writeFileSync(filepath, file.buffer);

    // Save metadata to database
    const cmsFile = await this.prisma.cMSFile.create({
      data: {
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/${filename}`,
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
   * Delete a file from disk and database
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

    // Delete from disk
    const filepath = path.join(this.uploadDir, file.filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

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
