import { Injectable, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import { basename, join, resolve } from 'path';
import type { MemoryUploadedFile } from '../verification/uploaded-file.types';

@Injectable()
export class PetitionMediaStorageService implements OnModuleInit {
  private readonly uploadDir: string;
  private readonly publicBase: string;

  constructor() {
    this.uploadDir =
      process.env.PETITION_MEDIA_UPLOAD_DIR ??
      join(process.cwd(), 'uploads', 'petition-media');
    this.publicBase = (
      process.env.PETITION_MEDIA_PUBLIC_BASE_URL ??
      process.env.ID_DOCUMENT_PUBLIC_BASE_URL ??
      'http://localhost:4000'
    ).replace(/\/$/, '');
  }

  onModuleInit() {
    mkdirSync(this.uploadDir, { recursive: true });
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
    await writeFile(join(this.uploadDir, name), file.buffer);
    return `${this.publicBase}/api/v1/petitions/media/${name}`;
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
