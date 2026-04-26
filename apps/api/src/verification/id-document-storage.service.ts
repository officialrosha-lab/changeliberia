import { Injectable, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import { basename, join, resolve } from 'path';
import type { MemoryUploadedFile } from './uploaded-file.types';

@Injectable()
export class IdDocumentStorageService implements OnModuleInit {
  private readonly uploadDir: string;
  private readonly publicBase: string;

  constructor() {
    this.uploadDir =
      process.env.ID_DOCUMENT_UPLOAD_DIR ??
      join(process.cwd(), 'uploads', 'id-documents');
    this.publicBase = (
      process.env.ID_DOCUMENT_PUBLIC_BASE_URL ?? 'http://localhost:4000'
    ).replace(/\/$/, '');
  }

  onModuleInit() {
    mkdirSync(this.uploadDir, { recursive: true });
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
    const dest = join(this.uploadDir, name);
    await writeFile(dest, file.buffer);
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

  /** Absolute path inside uploadDir, or null if traversal / invalid. */
  resolveSafeAbsolutePath(filename: string): string | null {
    const abs = resolve(this.uploadDir, filename);
    const root = resolve(this.uploadDir);
    if (abs !== root && !abs.startsWith(`${root}/`)) return null;
    return abs;
  }
}
