import { Injectable, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import { basename, join, resolve } from 'path';

@Injectable()
export class ConstituencyReportStorageService implements OnModuleInit {
  private readonly uploadDir: string;
  private readonly publicBase: string;

  constructor() {
    this.uploadDir =
      process.env.CONSTITUENCY_REPORTS_UPLOAD_DIR ??
      join(process.cwd(), 'uploads', 'constituency-reports');
    this.publicBase = (
      process.env.CONSTITUENCY_REPORTS_PUBLIC_BASE_URL ??
      process.env.PETITION_MEDIA_PUBLIC_BASE_URL ??
      'http://localhost:4000'
    ).replace(/\/$/, '');
  }

  onModuleInit() {
    mkdirSync(this.uploadDir, { recursive: true });
  }

  private ext(format: 'PDF' | 'CSV'): string {
    return format === 'PDF' ? '.pdf' : '.csv';
  }

  async save(
    format: 'PDF' | 'CSV',
    content: Buffer | string,
  ): Promise<{ filePath: string; publicUrl: string }> {
    const name = `${randomUUID()}${this.ext(format)}`;
    const filePath = join(this.uploadDir, name);
    await writeFile(filePath, content);
    return {
      filePath,
      publicUrl: `${this.publicBase}/api/v1/officials/me/reports/files/${name}`,
    };
  }

  resolveSafe(filename: string): string | null {
    const safe = basename(filename);
    if (!safe || safe.includes('..') || safe.includes('/')) return null;
    const abs = resolve(this.uploadDir, safe);
    const root = resolve(this.uploadDir);
    if (abs !== root && !abs.startsWith(`${root}/`)) return null;
    return abs;
  }
}
