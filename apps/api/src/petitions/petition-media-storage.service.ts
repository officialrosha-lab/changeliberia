import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SupabaseStorageService } from '../storage/supabase-storage.service';
import type { MemoryUploadedFile } from '../verification/uploaded-file.types';

const BUCKET = 'petition-media';

@Injectable()
export class PetitionMediaStorageService {
  constructor(private readonly storage: SupabaseStorageService) {}

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

  /** Uploads to the public `petition-media` bucket; returns its public CDN URL. */
  async save(file: MemoryUploadedFile): Promise<string> {
    const name = `${randomUUID()}${this.ext(file.originalname, file.mimetype)}`;
    await this.storage.upload(BUCKET, name, file.buffer, file.mimetype);
    return this.storage.getPublicUrl(BUCKET, name);
  }
}
