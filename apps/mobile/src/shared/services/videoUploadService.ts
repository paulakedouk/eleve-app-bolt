import { supabase } from '../lib/supabase';
import { s3Service } from './awsS3Service';
import { SessionVideo, Student } from '../types';
import uuid from 'react-native-uuid';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';

interface UploadVideoOptions {
  videoUri: string;
  sessionId: string;
  coachId: string;
  organizationId: string; // Add organization_id as required field
  students: Student[];
  trickName?: string;
  landed: boolean;
  comment?: string;
  hasVoiceNote: boolean;
  duration: number;
  location?: string; // Location where video was recorded
  onProgress?: (progress: number) => void;
}

interface UploadResult {
  success: boolean;
  videoId?: string;
  s3Url?: string;
  thumbnailUrl?: string;
  error?: string;
}

class VideoUploadService {
  /**
   * Generate thumbnail from video
   */
  private async generateThumbnail(videoUri: string): Promise<string | null> {
    try {
      console.log('🖼️ Generating thumbnail for video:', videoUri);
      
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: 1000, // Generate thumbnail at 1 second
        quality: 0.8,
      });

      console.log('✅ Thumbnail generated successfully:', uri);
      return uri;
    } catch (error) {
      console.error('❌ Thumbnail generation failed:', error);
      return null;
    }
  }

  /**
   * Upload thumbnail to S3
   */
  private async uploadThumbnail(
    thumbnailUri: string, 
    videoId: string, 
    coachId: string, 
    sessionId: string
  ): Promise<string | null> {
    try {
      console.log('📸 Starting thumbnail upload process...');
      console.log('📸 Thumbnail URI:', thumbnailUri);
      
      // Generate S3 key for thumbnail
      const thumbnailS3Key = s3Service.generateThumbnailKey(coachId, sessionId, videoId);
      console.log('📸 Thumbnail S3 key:', thumbnailS3Key);
      
      // Upload thumbnail to S3
      console.log('📸 Calling s3Service.uploadThumbnail...');
      const s3Result = await s3Service.uploadThumbnail({
        uri: thumbnailUri,
        key: thumbnailS3Key,
        contentType: 'image/jpeg',
      });

      console.log('📸 S3 thumbnail upload result:', {
        success: s3Result.success,
        url: s3Result.url,
        error: s3Result.error
      });

      if (s3Result.success) {
        console.log('✅ Thumbnail uploaded to S3 successfully:', s3Result.url);
        return s3Result.url!;
      } else {
        console.error('❌ Thumbnail upload failed with error:', s3Result.error);
        return null;
      }
    } catch (error) {
      console.error('❌ Thumbnail upload exception:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      return null;
    }
  }

  /**
   * Upload video to S3 and save metadata to Supabase
   */
  async uploadVideo(options: UploadVideoOptions): Promise<UploadResult> {
    const {
      videoUri,
      sessionId,
      coachId,
      organizationId,
      students,
      trickName,
      landed,
      comment,
      hasVoiceNote,
      duration,
      location,
      onProgress,
    } = options;

    try {
      console.log('🎬 Starting video upload process...');
      
      // Generate unique video ID (proper UUID)
      const videoId = uuid.v4() as string;
      
      // Update progress for thumbnail generation
      if (onProgress) onProgress(5);

      // Generate thumbnail
      const thumbnailUri = await this.generateThumbnail(videoUri);
      
      if (onProgress) onProgress(15);

      // Generate S3 key for video
      const s3Key = s3Service.generateVideoKey(coachId, sessionId, videoId);
      
      console.log(`📂 Uploading to S3 key: ${s3Key}`);

      // Upload video to S3 with progress tracking
      const s3Result = await s3Service.uploadVideo({
        uri: videoUri,
        key: s3Key,
        contentType: 'video/mp4',
        onProgress: (progress) => {
          console.log(`📊 S3 Upload Progress: ${progress}%`);
          if (onProgress) {
            // Reserve 15% for thumbnail generation, 60% for video upload, 25% for database ops
            onProgress(15 + (progress * 0.6)); 
          }
        },
      });

      if (!s3Result.success) {
        throw new Error(s3Result.error || 'S3 upload failed');
      }

      console.log('✅ Video uploaded to S3 successfully');
      console.log(`🔗 S3 URL: ${s3Result.url}`);

      // Update progress for thumbnail upload
      if (onProgress) onProgress(80);

      // Upload thumbnail if generated successfully
      let thumbnailUrl: string | null = null;
      if (thumbnailUri) {
        thumbnailUrl = await this.uploadThumbnail(thumbnailUri, videoId, coachId, sessionId);
        
        // Clean up local thumbnail file
        try {
          await FileSystem.deleteAsync(thumbnailUri, { idempotent: true });
        } catch (cleanupError) {
          console.log('⚠️ Failed to cleanup thumbnail file:', cleanupError);
        }
      }

      // Update progress for database operations
      if (onProgress) onProgress(85);

      console.log('💾 Preparing to save video metadata to database...');
      console.log('💾 Video ID:', videoId);
      console.log('💾 Thumbnail URL:', thumbnailUrl);
      console.log('💾 Video URL:', s3Result.url);

      // Save video metadata to Supabase
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .insert({
          id: videoId,
          uri: videoUri, // Local URI for backwards compatibility
          s3_url: s3Result.url!, // S3 public URL
          s3_key: s3Key, // S3 key for future operations
          thumbnail_url: thumbnailUrl,
          duration,
          coach_id: coachId,
          organization_id: organizationId, // Add organization_id
          student_ids: students.map(s => s.id), // Array of student IDs
          trick_name: trickName,
          landed,
          comment,
          has_voice_note: hasVoiceNote,
          location: location || null,
          upload_status: 'uploaded',
          upload_progress: 100,
        })
        .select()
        .single();

      console.log('💾 Database insert result:', {
        success: !videoError,
        error: videoError,
        data: videoData
      });

      if (videoError) {
        console.error('❌ Database insert failed:', videoError);
        // Try to cleanup S3 uploads
        await s3Service.deleteVideo(s3Key);
        if (thumbnailUrl) {
          const thumbnailKey = thumbnailUrl.split('.amazonaws.com/')[1];
          await s3Service.deleteThumbnail(thumbnailKey);
        }
        throw new Error('Failed to save video metadata');
      }

      console.log('✅ Video metadata saved to database successfully');
      console.log('✅ Saved thumbnail URL:', videoData?.thumbnail_url);

      // Update progress
      if (onProgress) onProgress(90);

      // Students are already linked via the student_ids array column
      console.log(`✅ Video linked to ${students.length} students via student_ids array`);

      // Final progress update
      if (onProgress) onProgress(100);

      console.log('🎉 Video upload completed successfully!');

      return {
        success: true,
        videoId,
        s3Url: s3Result.url!,
        thumbnailUrl: thumbnailUrl || undefined,
      };

    } catch (error: any) {
      console.error('❌ Video upload failed:', error);
      return {
        success: false,
        error: error.message || 'Upload failed',
      };
    }
  }

  /**
   * Upload multiple videos (for session batch upload)
   */
  async uploadSessionVideos(
    videos: SessionVideo[],
    sessionId: string,
    coachId: string,
    organizationId: string, // Add organizationId parameter
    onProgress?: (overall: number, currentVideo: number, totalVideos: number) => void
  ): Promise<{ successful: number; failed: number; errors: string[] }> {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      
      try {
        console.log(`📹 Uploading video ${i + 1} of ${videos.length}`);
        
        const uploadResult = await this.uploadVideo({
          videoUri: video.uri!,
          sessionId,
          coachId,
          organizationId, // Use parameter instead of video.organizationId
          students: video.students,
          trickName: video.trickName,
          landed: video.landed,
          comment: video.comment,
          hasVoiceNote: video.hasVoiceNote,
          duration: video.duration || 0,
          location: video.location,
          onProgress: (videoProgress) => {
            if (onProgress) {
              const overallProgress = ((i / videos.length) * 100) + ((videoProgress / videos.length));
              onProgress(overallProgress, i + 1, videos.length);
            }
          },
        });

        if (uploadResult.success) {
          results.successful++;
          console.log(`✅ Video ${i + 1} uploaded successfully`);
        } else {
          results.failed++;
          results.errors.push(`Video ${i + 1}: ${uploadResult.error}`);
          console.error(`❌ Video ${i + 1} failed: ${uploadResult.error}`);
        }

      } catch (error: any) {
        results.failed++;
        results.errors.push(`Video ${i + 1}: ${error.message}`);
        console.error(`❌ Video ${i + 1} failed with exception:`, error);
      }
    }

    console.log(`📊 Batch upload completed: ${results.successful} successful, ${results.failed} failed`);
    return results;
  }

  /**
   * Get video by ID with S3 URL
   */
  async getVideo(videoId: string): Promise<any> {
    const { data, error } = await supabase
      .from('videos')
      .select(`
        *,
        session:sessions(*),
        coach:auth.users!inner(email, raw_user_meta_data),
        video_students(
          student:students(*)
        )
      `)
      .eq('id', videoId)
      .single();

    if (error) {
      console.error('❌ Failed to fetch video:', error);
      return null;
    }

    return data;
  }

  /**
   * Delete video from both S3 and database
   */
  async deleteVideo(videoId: string): Promise<boolean> {
    try {
      // Get video data first
      const video = await this.getVideo(videoId);
      if (!video) {
        console.error('❌ Video not found for deletion');
        return false;
      }

      // Extract S3 key from URL
      const s3Key = video.video_url.split('.amazonaws.com/')[1];
      
      // Delete from S3
      const s3Deleted = await s3Service.deleteVideo(s3Key);
      
      // Delete from database
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (error) {
        console.error('❌ Failed to delete video from database:', error);
        return false;
      }

      console.log(`🗑️ Video ${videoId} deleted successfully`);
      return true;

    } catch (error: any) {
      console.error('❌ Video deletion failed:', error);
      return false;
    }
  }

  /**
   * Validate AWS configuration
   */
  async validateConfiguration(): Promise<boolean> {
    return await s3Service.validateConfiguration();
  }
}

// Export singleton instance
export const videoUploadService = new VideoUploadService();
export default videoUploadService; 