import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SupabaseStorageService } from '../storage/supabase-storage.service';
import type { MemoryUploadedFile } from './uploaded-file.types';

const BUCKET = 'id-documents';
const REF_PREFIX = 'supabase:id-documents/';

@Injectable()
export class IdDocumentStorageService {
  constructor(private readonly storage: SupabaseStorageService) {}

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

  /** Uploads to the private `id-documents` bucket; returns an internal reference stored as IDDocument.fileUrl. */
  async saveBuffer(file: MemoryUploadedFile): Promise<string> {
    const name = this.makeFilename(file.originalname, file.mimetype);
    await this.storage.upload(BUCKET, name, file.buffer, file.mimetype);
    return `${REF_PREFIX}${name}`;
  }

  /** If `fileUrl` was produced by this service, return its storage object path; otherwise null (external URL). */
  extractStoragePath(fileUrl: string): string | null {
    if (!fileUrl.startsWith(REF_PREFIX)) return null;
    const name = fileUrl.slice(REF_PREFIX.length);
    if (!name || name.includes('/') || name.includes('..')) return null;
    return name;
  }

  /** Short-lived signed URL for the document owner or an admin to view the file. */
  async getSignedUrl(path: string, expiresInSeconds = 300): Promise<string> {
    return this.storage.createSignedUrl(BUCKET, path, expiresInSeconds);
  }
}
