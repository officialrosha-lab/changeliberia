import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { MemoryUploadedFile } from '../verification/uploaded-file.types';
import { S3StorageService } from '../storage/s3-storage.service';
import { apiPublicBaseUrl } from '../storage/public-base-url';

const KEY_PREFIX = 'petition-media/';

@Injectable()
export class PetitionMediaStorageService {
  private readonly publicBase: string;

  constructor(private readonly s3: S3StorageService) {
    this.publicBase = apiPublicBaseUrl(
      process.env.PETITION_MEDIA_PUBLIC_BASE_URL,
    );
    if (process.env.NODE_ENV === 'production' && !this.s3.isConfigured()) {
      throw new Error(
        'MEDIA_BUCKET_* environment variables must be set in production — refusing to fall back to ephemeral local disk for petition media.',
      );
    }
  }

  private ext(original: string, mimetype: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/quicktime': '.mov',
    };
    if (original.includes('.') && original.length < 200) {
      return original.slice(original.lastIndexOf('.'));
    }
    return map[mimetype] ?? '.bin';
  }

  async save(file: MemoryUploadedFile): Promise<string> {
    const name = `${randomUUID()}${this.ext(file.originalname, file.mimetype)}`;
    await this.s3.putObject(`${KEY_PREFIX}${name}`, file.buffer, file.mimetype);
    return `${this.publicBase}/api/v1/petitions/media/${name}`;
  }

  /** Validates a filename came from this service's own naming scheme. */
  safeKey(filename: string): string | null {
    if (!filename || filename.includes('..') || filename.includes('/'))
      return null;
    return `${KEY_PREFIX}${filename}`;
  }
}
