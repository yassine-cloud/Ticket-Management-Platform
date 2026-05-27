import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME') || '',
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY') || '',
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET') || '',
    });
  }

  async uploadFile(
    file: { path: string },
    folder: string = 'ticket-management',
  ): Promise<{ url: string; publicId: string }> {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder,
        resource_type: 'auto',
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error: any) {
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error: any) {
      throw new Error(`Cloudinary delete failed: ${error.message}`);
    }
  }

  async generateUploadSignature(folder: string = 'ticket-management'): Promise<{
    signature: string;
    timestamp: number;
    cloudName: string;
    apiKey: string;
    folder: string;
  }> {
    const timestamp = Math.floor(Date.now() / 1000);
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET') || '';
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
      },
      apiSecret,
    );

    return {
      signature,
      timestamp,
      cloudName: this.configService.get<string>('CLOUDINARY_CLOUD_NAME') || '',
      apiKey: this.configService.get<string>('CLOUDINARY_API_KEY') || '',
      folder,
    };
  }
}
