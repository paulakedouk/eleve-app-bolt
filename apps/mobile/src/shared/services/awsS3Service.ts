import * as FileSystem from 'expo-file-system';
import { supabase } from '../lib/supabase';
import { isWeb } from '../utils/platform';

interface S3UploadOptions {
  uri: string;
  key: string;
  contentType?: string;
  onProgress?: (progress: number) => void;
}

interface S3WebUploadOptions {
  file: File;
  key: string;
  contentType?: string;
  onProgress?: (progress: number) => void;
}

interface S3UploadResult {
  success: boolean;
  url?: string;
  s3Key?: string;
  error?: string;
}

interface PresignedUrlResponse {
  presignedUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
}

class AWSService {
  private bucketName: string;
  private region: string;

  constructor() {
    this.bucketName = 'eleve-native-app';
    this.region = 'us-east-2'; // Bucket is actually in us-east-2, not us-west-2
    
  }

  /**
   * Get pre-signed URL from Supabase Edge Function
   */
  private async getPresignedUrl(key: string, contentType: string): Promise<PresignedUrlResponse> {
    const { data, error } = await supabase.functions.invoke('generate-s3-presigned-url', {
      body: { key, contentType },
    });

  
    if (error) {
      throw new Error(`Failed to get pre-signed URL: ${error.message}`);
    }

    if (!data || !data.presignedUrl) {
      throw new Error('Invalid response from pre-signed URL service');
    }

    return data;
  }

  /**
   * Upload video file to S3 using pre-signed URL
   */
  async uploadVideo(options: S3UploadOptions): Promise<S3UploadResult> {
    try {
      const { uri, key, contentType = 'video/mp4', onProgress } = options;

      console.log(`📁 Starting S3 upload: ${key}`);
      console.log(`🪣 Bucket: ${this.bucketName}`);
      console.log(`🌍 Region: ${this.region}`);

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('File not found');
      }

      console.log(`📏 File size: ${fileInfo.size} bytes`);

      // Start progress
      if (onProgress) {
        onProgress(10);
      }

      console.log(`🔐 Getting pre-signed URL from Supabase Edge Function...`);
      
      // Get pre-signed URL from server
      const urlData = await this.getPresignedUrl(key, contentType);
      
      console.log(`✅ Pre-signed URL obtained, expires in ${urlData.expiresIn} seconds`);

      // Update progress
      if (onProgress) {
        onProgress(25);
      }

      console.log(`🚀 SECURE S3 UPLOAD: Uploading to pre-signed URL`);

      // Upload using pre-signed URL (much simpler and more secure)
      const uploadResult = await FileSystem.uploadAsync(urlData.presignedUrl, uri, {
        httpMethod: 'PUT',
        headers: {
          'Content-Type': contentType,
        },
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      });

      console.log(`📤 Upload result status: ${uploadResult.status}`);

      // Complete progress
      if (onProgress) {
        setTimeout(() => onProgress(100), 100);
      }

      if (uploadResult.status === 200 || uploadResult.status === 201) {
        console.log('✅ Video uploaded successfully to S3');
        console.log(`🔗 Public URL: ${urlData.publicUrl}`);

        return {
          success: true,
          url: urlData.publicUrl,
        };
      } else {
        console.error('❌ Upload failed with status:', uploadResult.status);
        console.error('❌ Upload response:', uploadResult.body);
        
        throw new Error(`Upload failed with status: ${uploadResult.status}`);
      }

    } catch (error: any) {
      console.error('[generate-s3] ERROR object:', error);
      console.error('[generate-s3] ERROR message:', error.message);
      console.error('[generate-s3] ERROR stack:', error.stack);
    
      return {
        success: false,
        error: error.message || 'Upload failed',
      };
    }
  }

  /**
   * Upload thumbnail image to S3
   */
  async uploadThumbnail(options: S3UploadOptions): Promise<S3UploadResult> {
    const thumbnailOptions = {
      ...options,
      contentType: 'image/jpeg',
    };
    
    return this.uploadVideo(thumbnailOptions);
  }

  /**
   * Upload file to S3 from web using File object and fetch API
   */
  private async uploadFileWeb(options: S3WebUploadOptions): Promise<S3UploadResult> {
    try {
      const { file, key, contentType, onProgress } = options;

      console.log(`📁 Starting S3 web upload: ${key}`);
      console.log(`🪣 Bucket: ${this.bucketName}`);
      console.log(`🌍 Region: ${this.region}`);
      console.log(`📏 File size: ${file.size} bytes`);

      // Start progress
      if (onProgress) {
        onProgress(10);
      }

      console.log(`🔐 Getting pre-signed URL from Supabase Edge Function...`);
      
      // Get pre-signed URL from server
      const urlData = await this.getPresignedUrl(key, contentType || file.type);
      
      console.log(`✅ Pre-signed URL obtained, expires in ${urlData.expiresIn} seconds`);

      // Update progress
      if (onProgress) {
        onProgress(25);
      }

      console.log(`🚀 SECURE S3 UPLOAD: Uploading to pre-signed URL via fetch`);

      // Upload using fetch API (web-compatible)
      const uploadResponse = await fetch(urlData.presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': contentType || file.type,
        },
      });

      console.log(`📤 Upload response status: ${uploadResponse.status}`);

      // Complete progress
      if (onProgress) {
        setTimeout(() => onProgress(100), 100);
      }

      if (uploadResponse.ok) {
        console.log('✅ File uploaded successfully to S3 via web');
        console.log(`🔗 Public URL: ${urlData.publicUrl}`);

        return {
          success: true,
          url: urlData.publicUrl,
        };
      } else {
        const errorText = await uploadResponse.text();
        console.error('❌ Web upload failed with status:', uploadResponse.status);
        console.error('❌ Web upload response:', errorText);
        
        throw new Error(`Web upload failed with status: ${uploadResponse.status}`);
      }

    } catch (error: any) {
      console.error('❌ S3 web upload failed:', error);
      console.error('❌ Error details:', error.message);
      
      return {
        success: false,
        error: error.message || 'Web upload failed',
      };
    }
  }

  /**
   * Upload organization logo to S3 from web using File object and fetch API
   */
  private async uploadOrganizationLogoWeb(
    orgId: string,
    file: File,
    contentType: string,
    onProgress?: (progress: number) => void
  ): Promise<S3UploadResult> {
    try {
      console.log(`🏢 Starting organization logo web upload for orgId: ${orgId}`);
      console.log(`📏 Logo file size: ${file.size} bytes`);
      console.log(`📄 Logo file type: ${file.type}`);

      // Start progress
      if (onProgress) {
        onProgress(10);
      }

      console.log(`🔐 Getting organization logo pre-signed URL...`);
      
      // Get pre-signed URL from organization logo function
      const urlData = await this.getOrganizationLogoPresignedUrl(orgId, contentType);
      
      console.log(`✅ Organization logo pre-signed URL obtained, expires in ${urlData.expiresIn} seconds`);

      // Update progress
      if (onProgress) {
        onProgress(25);
      }

      console.log(`🚀 SECURE S3 UPLOAD: Uploading organization logo to pre-signed URL via fetch`);

      // Upload using fetch API (web-compatible)
      const uploadResponse = await fetch(urlData.presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': contentType,
        },
      });

      console.log(`📤 Logo upload response status: ${uploadResponse.status}`);

      // Complete progress
      if (onProgress) {
        setTimeout(() => onProgress(100), 100);
      }

      if (uploadResponse.ok) {
        console.log('✅ Organization logo uploaded successfully to S3 via web');
        console.log(`🔗 Public URL: ${urlData.publicUrl}`);

        return {
          success: true,
          url: urlData.publicUrl,
        };
      } else {
        const errorText = await uploadResponse.text();
        console.error('❌ Logo web upload failed with status:', uploadResponse.status);
        console.error('❌ Logo web upload response:', errorText);
        
        throw new Error(`Logo web upload failed with status: ${uploadResponse.status}`);
      }

    } catch (error: any) {
      console.error('❌ S3 organization logo web upload failed:', error);
      console.error('❌ Error details:', error.message);
      
      return {
        success: false,
        error: error.message || 'Logo web upload failed',
      };
    }
  }

  /**
   * Get pre-signed URL for organization logo upload
   */
  private async getOrganizationLogoPresignedUrl(orgId: string, contentType: string): Promise<PresignedUrlResponse> {
    console.log('🔗 Getting presigned URL for organization logo with orgId:', orgId);
    
    const { data, error } = await supabase.functions.invoke('upload-organization-logo', {
      body: { orgId, contentType }
    });

    if (error) {
      console.error('❌ Organization logo presigned URL error:', error);
      throw new Error(`Failed to get organization logo pre-signed URL: ${error.message}`);
    }

    if (!data || !data.url) {
      console.error('❌ Invalid response data:', data);
      throw new Error('Invalid response from organization logo pre-signed URL service');
    }

    console.log('✅ Got organization logo presigned URL successfully');
    
    // Convert the response to match the expected PresignedUrlResponse interface
    return {
      presignedUrl: data.url,
      publicUrl: `https://eleve-native-app.s3.us-east-2.amazonaws.com/logos/${orgId}.png`,
      key: `logos/${orgId}.png`,
      expiresIn: 3600
    };
  }

  /**
   * Upload organization logo to S3 (supports both web File objects and native URIs)
   */
  async uploadOrganizationLogo(
    orgId: string, 
    imageSource: string | File, 
    onProgress?: (progress: number) => void
  ): Promise<S3UploadResult> {
    try {
      console.log(`🏢 Starting organization logo upload for orgId: ${orgId}`);

      if (isWeb) {
        // Web platform: handle File object
        if (!(imageSource instanceof File)) {
          throw new Error('On web platform, imageSource must be a File object');
        }

        const file = imageSource;
        console.log(`📏 Logo file size: ${file.size} bytes`);
        console.log(`📄 Logo file type: ${file.type}`);

        // Determine content type
        let contentType = file.type || 'image/png';
        if (!contentType.startsWith('image/')) {
          contentType = 'image/png';
        }

        console.log(`🌐 WEB UPLOAD: Using fetch API for logo upload`);

        // Use the web upload method with organization-specific presigned URL
        return await this.uploadOrganizationLogoWeb(orgId, file, contentType, onProgress);

      } else {
        // Native platform: handle URI string
        if (typeof imageSource !== 'string') {
          throw new Error('On native platforms, imageSource must be a URI string');
        }

        const imageUri = imageSource;

        // Check if file exists
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        if (!fileInfo.exists) {
          throw new Error('Logo file not found');
        }

        console.log(`📏 Logo file size: ${fileInfo.size} bytes`);

        // Start progress
        if (onProgress) {
          onProgress(10);
        }

        // Determine content type based on file extension
        const extension = imageUri.split('.').pop()?.toLowerCase();
        let contentType = 'image/png';
        
        if (extension === 'jpg' || extension === 'jpeg') {
          contentType = 'image/jpeg';
        } else if (extension === 'png') {
          contentType = 'image/png';
        } else if (extension === 'gif') {
          contentType = 'image/gif';
        } else if (extension === 'webp') {
          contentType = 'image/webp';
        }

        console.log(`🔐 Getting organization logo pre-signed URL...`);
        
        // Get pre-signed URL from server
        const urlData = await this.getOrganizationLogoPresignedUrl(orgId, contentType);
        
        console.log(`✅ Organization logo pre-signed URL obtained, expires in ${urlData.expiresIn} seconds`);

        // Update progress
        if (onProgress) {
          onProgress(25);
        }

        console.log(`📱 NATIVE UPLOAD: Using expo-file-system for logo upload`);

        // Upload using pre-signed URL
        const uploadResult = await FileSystem.uploadAsync(urlData.presignedUrl, imageUri, {
          httpMethod: 'PUT',
          headers: {
            'Content-Type': contentType,
          },
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        });

        console.log(`📤 Logo upload result status: ${uploadResult.status}`);

        // Complete progress
        if (onProgress) {
          setTimeout(() => onProgress(100), 100);
        }

        if (uploadResult.status === 200 || uploadResult.status === 201) {
          console.log('✅ Organization logo uploaded successfully to S3');
          console.log(`🔗 Public URL: ${urlData.publicUrl}`);

          return {
            success: true,
            url: urlData.publicUrl,
          };
        } else {
          console.error('❌ Logo upload failed with status:', uploadResult.status);
          console.error('❌ Logo upload response:', uploadResult.body);
          
          throw new Error(`Logo upload failed with status: ${uploadResult.status}`);
        }
      }

    } catch (error: any) {
      console.error('❌ S3 organization logo upload failed:', error);
      console.error('❌ Error details:', error.message);
      
      return {
        success: false,
        error: error.message || 'Logo upload failed',
      };
    }
  }

  /**
   * Get pre-signed URL for video upload with folder structure using existing working function
   */
  private async getVideoUploadPresignedUrl(
    organizationId: string,
    coachId: string, 
    studentId: string,
    videoId: string,
    contentType: string
  ): Promise<PresignedUrlResponse> {
    // Construct the S3 key with proper folder structure
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const key = `videos/${organizationId}/${coachId}/${studentId}/${timestamp}_${videoId}.mp4`;
    
    console.log('🎬 Getting presigned URL for video upload with key:', key);
    
    // Use the existing working generate-s3-presigned-url function
    const { data, error } = await supabase.functions.invoke('generate-s3-presigned-url', {
      body: { 
        key, 
        contentType 
      }
    });

    console.log('[generate-s3] Incoming key:', key);
    console.log('[generate-s3] Bucket:', this.bucketName);
    console.log('[generate-s3] Region:', this.region);

    if (error) {
      console.error('❌ Video upload presigned URL error:', error);
      throw new Error(`Failed to get video upload pre-signed URL: ${error.message}`);
    }

    if (!data || !data.presignedUrl) {
      console.error('❌ Invalid video upload response data:', data);
      throw new Error('Invalid response from video upload pre-signed URL service');
    }

    console.log('✅ Got video upload presigned URL successfully');
    
    return {
      presignedUrl: data.presignedUrl,
      publicUrl: data.publicUrl,
      key: data.key,
      expiresIn: data.expiresIn || 3600
    };
  }

  /**
   * Upload video to S3 with organization/coach/student folder structure
   */
  async uploadVideoWithMetadata(
    videoUri: string,
    organizationId: string,
    coachId: string,
    studentId: string,
    videoId: string,
    onProgress?: (progress: number) => void
  ): Promise<S3UploadResult> {
    try {
      console.log(`🎬 Starting video upload with metadata:`, {
        organizationId,
        coachId,
        studentId,
        videoId
      });

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(videoUri);
      if (!fileInfo.exists) {
        throw new Error('Video file not found');
      }

      console.log(`📏 Video file size: ${fileInfo.size} bytes`);

      // Start progress
      if (onProgress) {
        onProgress(10);
      }

      // Determine content type
      const contentType = 'video/mp4';

      console.log(`🔐 Getting video upload pre-signed URL...`);
      
      // Get pre-signed URL from server
      const urlData = await this.getVideoUploadPresignedUrl(
        organizationId,
        coachId,
        studentId,
        videoId,
        contentType
      );
      
      console.log(`✅ Video upload pre-signed URL obtained, expires in ${urlData.expiresIn} seconds`);

      // Update progress
      if (onProgress) {
        onProgress(25);
      }

      console.log(`🚀 SECURE S3 UPLOAD: Uploading video to pre-signed URL`);

      // Upload using pre-signed URL
      const uploadResult = await FileSystem.uploadAsync(urlData.presignedUrl, videoUri, {
        httpMethod: 'PUT',
        headers: {
          'Content-Type': contentType,
        },
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      });

      console.log(`📤 Video upload result status: ${uploadResult.status}`);

      // Complete progress
      if (onProgress) {
        setTimeout(() => onProgress(100), 100);
      }

      if (uploadResult.status === 200 || uploadResult.status === 201) {
        console.log('✅ Video uploaded successfully to S3 with metadata');
        console.log(`🔗 Public URL: ${urlData.publicUrl}`);

        return {
          success: true,
          url: urlData.publicUrl,
          s3Key: urlData.key,
        };
      } else {
        console.error('❌ Video upload failed with status:', uploadResult.status);
        console.error('❌ Video upload response:', uploadResult.body);
        
        throw new Error(`Video upload failed with status: ${uploadResult.status}`);
      }

    } catch (error: any) {
      console.error('❌ S3 video upload with metadata failed:', error);
      console.error('❌ Error details:', error.message);
      
      return {
        success: false,
        error: error.message || 'Video upload failed',
      };
    }
  }

  /**
   * Generate a unique video ID for uploads
   */
  generateVideoId(): string {
    return `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate video S3 key with folder structure
   */
  generateVideoKeyWithMetadata(
    organizationId: string,
    coachId: string,
    studentId: string,
    videoId: string
  ): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `videos/${organizationId}/${coachId}/${studentId}/${timestamp}_${videoId}.mp4`;
  }

  /**
   * Generate video S3 key for simple uploads
   */
  generateVideoKey(coachId: string, sessionId: string, videoId: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `videos/${coachId}/${sessionId}/${timestamp}_${videoId}.mp4`;
  }

  /**
   * Generate thumbnail S3 key
   */
  generateThumbnailKey(coachId: string, sessionId: string, videoId: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `videos/${coachId}/${sessionId}/${timestamp}_${videoId}_thumbnail.jpg`;
  }

  /**
   * Delete video from S3 (would need another Edge Function for this)
   */
  async deleteVideo(key: string): Promise<boolean> {
    try {
      console.log(`🗑️ TODO: Implement S3 delete via Edge Function for key: ${key}`);
      // This would need another Supabase Edge Function for secure delete operations
      return true;
    } catch (error: any) {
      console.error('❌ S3 delete failed:', error);
      return false;
    }
  }

  /**
   * Delete thumbnail from S3
   */
  async deleteThumbnail(key: string): Promise<boolean> {
    return this.deleteVideo(key); // Use same delete logic
  }

  /**
   * Check if S3 configuration is valid
   */
  async validateConfiguration(): Promise<boolean> {
    try {
      console.log('🔍 S3 VALIDATION: Testing pre-signed URL generation');
      console.log(`🪣 Bucket: ${this.bucketName}`);
      console.log(`🌍 Region: ${this.region}`);

      // Test by trying to get a pre-signed URL for a test key
      const testKey = `test/validation-${Date.now()}.txt`;
      await this.getPresignedUrl(testKey, 'text/plain');
      
      console.log('✅ S3 pre-signed URL generation working');
      return true;
    } catch (error: any) {
      console.error(`❌ S3 validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get public URL for S3 object
   */
  getPublicUrl(key: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }
}

// Export singleton instance
export const s3Service = new AWSService();
export default s3Service; 