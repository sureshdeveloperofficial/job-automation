import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  bytes: number;
  resourceType: string;
  originalFilename?: string;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor() {
    const cloudName = process.env['CLOUDINARY_CLOUD_NAME'] || 'doii12l1d';
    const apiKey = process.env['CLOUDINARY_API_KEY'] || '419386317598122';
    const apiSecret = process.env['CLOUDINARY_API_SECRET'] || 'I1vZ9lLG8P9V1RCRkJuzPf0tjeg';

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    this.logger.log(`Initialized Cloudinary storage for cloud: "${cloudName}"`);
  }

  /**
   * Stream upload an in-memory buffer to Cloudinary
   */
  async uploadBuffer(
    buffer: Buffer,
    options: {
      folder?: string;
      publicId?: string;
      resourceType?: 'image' | 'raw' | 'auto' | 'video';
      tags?: string[];
    } = {},
  ): Promise<CloudinaryUploadResult> {
    const folder = options.folder ?? 'job-automation';
    const resourceType = options.resourceType ?? 'auto';

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: options.publicId,
          resource_type: resourceType,
          tags: options.tags,
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            this.logger.error(`Cloudinary upload failed: ${error.message}`, error);
            return reject(new Error(`Cloudinary upload failed: ${error.message}`));
          }
          if (!result) {
            return reject(new Error('Cloudinary upload returned undefined response'));
          }

          resolve({
            publicId: result.public_id,
            url: result.url,
            secureUrl: result.secure_url,
            format: result.format ?? 'raw',
            bytes: result.bytes,
            resourceType: result.resource_type,
            originalFilename: result.original_filename,
          });
        },
      );

      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }

  /**
   * Upload a raw document (PDF, DOCX, TXT)
   */
  async uploadDocument(
    buffer: Buffer,
    originalName: string,
    folder = 'job-automation/resumes',
  ): Promise<CloudinaryUploadResult> {
    // Generate clean safe public id from filename
    const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueId = `${baseName}_${Date.now()}`;

    return this.uploadBuffer(buffer, {
      folder,
      publicId: uniqueId,
      resourceType: 'raw',
      tags: ['resume', 'document'],
    });
  }

  /**
   * Upload an image (Avatar, Company Logo, Evidence Screenshot)
   */
  async uploadImage(
    buffer: Buffer,
    folder = 'job-automation/avatars',
    publicId?: string,
  ): Promise<CloudinaryUploadResult> {
    return this.uploadBuffer(buffer, {
      folder,
      publicId,
      resourceType: 'image',
      tags: ['image', 'avatar'],
    });
  }

  /**
   * Delete an asset from Cloudinary
   */
  async deleteFile(publicId: string, resourceType: 'image' | 'raw' | 'video' = 'raw'): Promise<boolean> {
    try {
      const res = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      return res.result === 'ok';
    } catch (err: any) {
      this.logger.warn(`Failed to delete Cloudinary asset ${publicId}: ${err.message}`);
      return false;
    }
  }
}
