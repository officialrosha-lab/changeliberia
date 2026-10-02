import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { basename } from 'path';
import type { MemoryUploadedFile } from './uploaded-file.types';
import { S3StorageService } from '../storage/s3-storage.service';
import { apiPublicBaseUrl } from '../storage/public-base-url';

const KEY_PREFIX = 'id-documents/';

@Injectable()
export class IdDocumentStorageService {
  private readonly publicBase: string;

  constructor(private readonly s3: S3StorageService) {
    this.publicBase = apiPublicBaseUrl(process.env.ID_DOCUMENT_PUBLIC_BASE_URL);
    if (process.env.NODE_ENV === 'production' && !this.s3.isConfigured()) {
      throw new Error(
        'MEDIA_BUCKET_* environment variables must be set in production — refusing to fall back to ephemeral local disk for ID documents.',
      );
    }
  }

  private makeFilename(original: string, mimetype: string): string {
    const ext =
      original.includes('.') && original.length < 200
        ? original.slice(original.lastIndexOf('.'))
        : mimetype === 'image/png'
          ? '.png'
          : mimetype === 'image/jpeg'
            ? '.jpg'
            : '.pdf';
    return `${randomUUID()}${ext}`;
  }

  async saveBuffer(file: MemoryUploadedFile): Promise<string> {
    const name = this.makeFilename(file.originalname, file.mimetype);
    await this.s3.putObject(`${KEY_PREFIX}${name}`, file.buffer, file.mimetype);
    return `${this.publicBase}/uploads/id-documents/${name}`;
  }

  /**
   * If `storedFileUrl` was produced by this service, return the on-disk basename; otherwise null
   * (caller may treat the URL as an external resource).
   */
  extractDiskFilename(storedFileUrl: string): string | null {
    const marker = '/uploads/id-documents/';
    const idx = storedFileUrl.indexOf(marker);
    if (idx === -1) return null;
    const fragment = storedFileUrl.slice(idx + marker.length).split(/[?#]/)[0];
    if (
      fragment.includes('/') ||
      fragment.includes('\\') ||
      fragment.includes('..')
    ) {
      return null;
    }
    const name = basename(fragment);
    if (!name) return null;
    if (!/^[a-zA-Z0-9._-]+\.(pdf|png|jpe?g)$/i.test(name)) return null;
    return name;
  }

  safeKey(filename: string): string {
    return `${KEY_PREFIX}${filename}`;
  }
}
