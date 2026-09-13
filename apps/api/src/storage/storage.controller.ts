/// <reference types="multer" />
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CloudinaryService } from './cloudinary.service.js';

@ApiTags('Storage')
@ApiBearerAuth()
@Controller('storage')
export class StorageController {
  constructor(private readonly cloudinary: CloudinaryService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a generic file to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const isImage = file.mimetype.startsWith('image/');
    const targetFolder = folder || (isImage ? 'job-automation/images' : 'job-automation/documents');

    const result = await this.cloudinary.uploadBuffer(file.buffer, {
      folder: targetFolder,
      resourceType: isImage ? 'image' : 'raw',
    });

    return {
      publicId: result.publicId,
      url: result.secureUrl,
      format: result.format,
      bytes: result.bytes,
      originalName: file.originalname,
      mimeType: file.mimetype,
    };
  }
}
