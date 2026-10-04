import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { basename } from 'path';
import { S3StorageService } from '../storage/s3-storage.service';
import { apiPublicBaseUrl } from '../storage/public-base-url';

const KEY_PREFIX = 'constituency-reports/';

@Injectable()
export class ConstituencyReportStorageService {
  private readonly publicBase: string;

  constructor(private readonly s3: S3StorageService) {
    this.publicBase = apiPublicBaseUrl(
      process.env.CONSTITUENCY_REPORTS_PUBLIC_BASE_URL ??
        process.env.PETITION_MEDIA_PUBLIC_BASE_URL,
    );
    if (process.env.NODE_ENV === 'production' && !this.s3.isConfigured()) {
      throw new Error(
        'MEDIA_BUCKET_* environment variables must be set in production — refusing to fall back to ephemeral local disk for constituency reports.',
      );
    }
  }

  private ext(format: 'PDF' | 'CSV'): string {
    return format === 'PDF' ? '.pdf' : '.csv';
  }

  async save(
    format: 'PDF' | 'CSV',
    content: Buffer | string,
  ): Promise<{ filePath: string; publicUrl: string }> {
    const name = `${randomUUID()}${this.ext(format)}`;
    const body = typeof content === 'string' ? Buffer.from(content) : content;
    const contentType = format === 'PDF' ? 'application/pdf' : 'text/csv';
    await this.s3.putObject(`${KEY_PREFIX}${name}`, body, contentType);
    return {
      // Stored as the bare filename (no directory component) — callers
      // extract it via its final path segment, which also works for this
      // S3 key suffix unchanged.
      filePath: name,
      publicUrl: `${this.publicBase}/api/v1/officials/me/reports/files/${name}`,
    };
  }

  safeKey(filename: string): string | null {
    const safe = basename(filename);
    if (!safe || safe.includes('..') || safe.includes('/')) return null;
    return `${KEY_PREFIX}${safe}`;
  }
}
