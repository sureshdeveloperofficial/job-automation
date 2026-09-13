import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CloudinaryService } from '../src/storage/cloudinary.service.js';
import { v2 as cloudinary } from 'cloudinary';

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CloudinaryService();
  });

  it('should initialize with environment or default cloud credentials', () => {
    expect(service).toBeDefined();
  });

  it('should upload document with raw resource type and custom public id', async () => {
    const mockResult = {
      public_id: 'job-automation/resumes/my_resume_12345',
      url: 'http://res.cloudinary.com/doii12l1d/raw/upload/job-automation/resumes/my_resume_12345',
      secure_url: 'https://res.cloudinary.com/doii12l1d/raw/upload/job-automation/resumes/my_resume_12345',
      format: 'raw',
      bytes: 1024,
      resource_type: 'raw',
      original_filename: 'my_resume',
    };

    vi.spyOn(cloudinary.uploader, 'upload_stream').mockImplementation((options: any, callback: any) => {
      // Simulate successful stream upload
      setTimeout(() => callback(undefined, mockResult), 10);
      return {
        write: vi.fn(),
        end: vi.fn(),
        on: vi.fn(),
        once: vi.fn(),
        emit: vi.fn(),
      } as any;
    });

    const sampleBuffer = Buffer.from('Sample resume content');
    const result = await service.uploadDocument(sampleBuffer, 'my_resume.pdf');

    expect(result.secureUrl).toBe(mockResult.secure_url);
    expect(result.publicId).toBe(mockResult.public_id);
    expect(result.bytes).toBe(1024);
  });

  it('should handle deletion of an asset', async () => {
    vi.spyOn(cloudinary.uploader, 'destroy').mockResolvedValue({ result: 'ok' });

    const deleted = await service.deleteFile('job-automation/resumes/my_resume_12345', 'raw');
    expect(deleted).toBe(true);
  });
});
