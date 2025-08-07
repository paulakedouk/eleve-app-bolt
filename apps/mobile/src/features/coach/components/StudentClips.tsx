import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Play, Clock, MessageCircle, Award } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';
import { supabase } from '../../../shared/lib/supabase';

interface StudentClipsProps {
  student: {
    id: string;
    name: string;
    age: number;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    profileImage?: string;
    xp: number;
    badgeLevel: string;
    coachName: string;
    hasActiveInjury: boolean;
    totalBadges: number;
    activeTricks: number;
    completedTricks: number;
    totalSessions: number;
    totalVideos: number;
  };
}

interface VideoClip {
  id: string;
  thumbnail: string;
  title: string;
  duration: number;
  date: Date;
  trickName: string;
  landed: boolean;
  hasComment: boolean;
  hasVoiceNote: boolean;
  location: string;
  s3Url: string;
}

const StudentClips: React.FC<StudentClipsProps> = ({ student }) => {
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStudentVideos();
  }, [student.id]);

  const loadStudentVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🎬 Loading videos for student:', student.id);

             // Query videos where the student is included in the student_ids array
       const { data: videosData, error: videosError } = await supabase
         .from('videos')
         .select(`
           id,
           s3_url,
           thumbnail_url,
           duration,
           trick_name,
           landed,
           comment,
           has_voice_note,
           location,
           created_at,
           upload_status,
           student_ids
         `)
         .contains('student_ids', [student.id]) // Check if student.id exists in the student_ids array
         .eq('upload_status', 'uploaded') // Only show successfully uploaded videos
         .order('created_at', { ascending: false })
         .limit(20); // Limit to recent 20 videos

      if (videosError) {
        console.error('❌ Error fetching student videos:', videosError);
        throw new Error('Failed to load videos');
      }

      console.log('✅ Videos fetched successfully:', videosData?.length || 0);

      // Transform database data to VideoClip format
      const transformedClips: VideoClip[] = videosData?.map((video) => {
        // Generate a display title from trick name or fallback
        const title = video.trick_name 
          ? `${video.trick_name} ${video.landed ? 'Practice' : 'Attempts'}`
          : 'Training Session';

        // Use thumbnail_url if available, otherwise use a default placeholder
        const thumbnail = video.thumbnail_url || 
          'https://eleve-native-app.s3.us-east-2.amazonaws.com/public/assets/images/eleve-avatar.svg';

        // Format location for display
        const location = video.location 
          ? video.location.charAt(0).toUpperCase() + video.location.slice(1).replace('_', ' ')
          : 'Training Area';

        return {
          id: video.id,
          thumbnail,
          title,
          duration: video.duration || 0,
          date: new Date(video.created_at),
          trickName: video.trick_name || 'General Practice',
          landed: video.landed || false,
          hasComment: Boolean(video.comment),
          hasVoiceNote: video.has_voice_note || false,
          location,
          s3Url: video.s3_url,
        };
      }) || [];

      setClips(transformedClips);
      console.log('✅ Clips transformed and set:', transformedClips.length);

    } catch (error: any) {
      console.error('❌ Error loading student videos:', error);
      setError(error.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleClipPress = (clip: VideoClip) => {
    // TODO: Navigate to video player or implement video playback
    Alert.alert(
      'Play Video', 
      `Would you like to play "${clip.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Play', 
          onPress: () => {
            // TODO: Implement video playback
            console.log('Playing video:', clip.s3Url);
            Alert.alert('Video Player', 'Video player not implemented yet');
          }
        },
      ]
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading video clips...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load videos</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadStudentVideos}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

      return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Video Clips</Text>
          <TouchableOpacity 
            style={styles.uploadButtonSmall} 
            onPress={() => Alert.alert('Upload Clip', 'Video upload feature coming soon!')}
          >
            <Play size={SIZES.icon.small} color={COLORS.white} />
            <Text style={styles.uploadButtonSmallText}>Upload</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Clips ({clips.length})</Text>
        
        {clips.length === 0 ? (
          <View style={styles.emptyState}>
            <Play size={64} color={COLORS.textTertiary} />
            <Text style={styles.emptyTitle}>No videos yet</Text>
            <Text style={styles.emptySubtitle}>
              Video clips will appear here once they are uploaded for {student.name}
            </Text>
          </View>
        ) : (
          clips.map((clip) => (
            <TouchableOpacity 
              key={clip.id} 
              style={styles.clipCard} 
              onPress={() => handleClipPress(clip)}
            >
              <View style={styles.clipThumbnail}>
                <Image source={{ uri: clip.thumbnail }} style={styles.thumbnailImage} />
                <View style={styles.playOverlay}>
                  <Play size={SIZES.icon.large} color={COLORS.white} />
                </View>
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{formatDuration(clip.duration)}</Text>
                </View>
                {clip.landed && (
                  <View style={styles.landedBadge}>
                    <Award size={SIZES.icon.small} color={COLORS.white} />
                    <Text style={styles.landedText}>Landed!</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.clipInfo}>
                <View style={styles.clipHeader}>
                  <Text style={styles.clipTitle}>{clip.title}</Text>
                  <Text style={styles.clipDate}>{formatDate(clip.date)}</Text>
                </View>
                
                <View style={styles.clipMeta}>
                  <View style={styles.trickInfo}>
                    <Text style={styles.trickName}>{clip.trickName}</Text>
                    <Text style={styles.location}>{clip.location}</Text>
                  </View>
                  
                  <View style={styles.clipActions}>
                    {clip.hasComment && (
                      <View style={styles.actionBadge}>
                        <MessageCircle size={SIZES.icon.small} color={COLORS.accentBlue} />
                      </View>
                    )}
                    {clip.hasVoiceNote && (
                      <View style={styles.actionBadge}>
                        <Clock size={SIZES.icon.small} color={COLORS.warning} />
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.screenPadding,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.screenPadding,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.screenPadding,
  },
  errorText: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  errorSubtext: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  retryButton: {
    backgroundColor: COLORS.eleveBlue,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.black,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.h2,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.families.poppinsBold,
    flex: 1,
  },
  uploadButtonSmall: {
    backgroundColor: COLORS.eleveBlue,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.black,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  uploadButtonSmallText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  clipCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.black,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  clipThumbnail: {
    position: 'relative',
    height: 180,
    backgroundColor: COLORS.surface,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  durationText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  landedBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  landedText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  clipInfo: {
    padding: SPACING.lg,
  },
  clipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  clipTitle: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  clipDate: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
  },
  clipMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trickInfo: {
    flex: 1,
  },
  trickName: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  location: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
  },
  clipActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

});

export default StudentClips; 