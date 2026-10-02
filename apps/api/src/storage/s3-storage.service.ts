import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

export type StoredObject = {
  buffer: Buffer;
  contentType?: string;
};

/**
 * Thin wrapper around the project's one shared S3-compatible bucket
 * (Railway's Tigris-backed object storage). Every upload path (petition
 * media, ID verification documents, CMS files, constituency reports) uses
 * this under its own key prefix instead of writing to the container's
 * local disk, which is wiped on every deploy/restart.
 */
@Injectable()
export class S3StorageService implements OnModuleInit {
  private client: S3Client | null = null;
  private bucket = '';
  private configured = false;

  onModuleInit() {
    const endpoint = process.env.MEDIA_BUCKET_ENDPOINT;
    const bucket = process.env.MEDIA_BUCKET_NAME;
    const region = process.env.MEDIA_BUCKET_REGION || 'auto';
    const accessKeyId = process.env.MEDIA_BUCKET_ACCESS_KEY_ID;
    const secretAccessKey = process.env.MEDIA_BUCKET_SECRET_ACCESS_KEY;

    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
      // Left unconfigured on purpose for local dev — callers fall back to
      // disk storage via isConfigured(). In production this is required
      // (enforced at the call sites, same pattern as ADMIN_PASSWORD/CORS_ORIGIN).
      return;
    }

    this.bucket = bucket;
    this.client = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: false,
    });
    this.configured = true;
  }

  isConfigured(): boolean {
    return this.configured;
  }

  async putObject(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    if (!this.client) throw new Error('S3StorageService is not configured');
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  /** Returns null if the object doesn't exist. */
  async getObject(key: string): Promise<StoredObject | null> {
    if (!this.client) throw new Error('S3StorageService is not configured');
    try {
      const res = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      const bytes = await res.Body?.transformToByteArray();
      if (!bytes) return null;
      return { buffer: Buffer.from(bytes), contentType: res.ContentType };
    } catch (err) {
      if (err instanceof NoSuchKey) return null;
      throw err;
    }
  }
}
