/**
 * Object storage (S3 / MinIO / Cloudflare R2) integration point.
 *
 * When ready:
 * 1. Install: `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
 * 2. Implement the ObjectStorageClient interface below
 * 3. Use for: model 3D files, thumbnails, reference images, order attachments
 *
 * Bucket structure (suggested):
 *   - modelo-models/        → cached 3D model files (STL, OBJ)
 *   - modelo-thumbnails/    → generated model thumbnails
 *   - modelo-uploads/       → customer reference image uploads
 *   - modelo-exports/       → generated order export PDFs
 */

export interface ObjectStorageConfig {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  etag: string;
}

export interface ObjectStorageClient {
  upload(key: string, data: Buffer | ReadableStream, contentType: string): Promise<UploadResult>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  list(prefix: string): Promise<{ key: string; size: number; lastModified: Date }[]>;
}

export function createObjectStorageClient(_config: ObjectStorageConfig): ObjectStorageClient {
  throw new Error(
    'Object storage is not configured. Set S3_ENDPOINT and S3_BUCKET in environment variables.'
  );
}
