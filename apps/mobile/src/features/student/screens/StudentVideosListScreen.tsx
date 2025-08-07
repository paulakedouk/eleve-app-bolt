import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
  Video, 
  Clock, 
  Users, 
  Play,
  Calendar,
  ArrowLeft,
  Star,
  Trophy,
  Target,
  X
} from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';
import { supabase } from '../../../shared/lib/supabase';

interface CoachVideo {
  id: string;
  s3_url: string;
  s3_key: string;
  duration: number;
  trick_name?: string;
  landed?: boolean;
  comment?: string;
  student_ids: string[];
  created_at: string;
  upload_status: string;
  coach_id: string;
  thumbnail_url?: string; // Add thumbnail support
  type: 'coach'; // Distinguish from personal videos
}

interface PersonalVideo {
  id: string;
  video_url: string;
  thumbnail_url?: string;
  trick_name?: string;
  description?: string;
  landed?: boolean;
  duration?: number;
  created_at: string;
  upload_status: string;
  student_id: string;
  type: 'personal'; // Distinguish from coach videos
}

type VideoItem = CoachVideo | PersonalVideo;

const StudentVideosListScreen: React.FC = () => {
  const navigation = useNavigation();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    fetchStudentVideos();
  }, []);

  const fetchStudentVideos = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        console.log('No user found');
        setLoading(false);
        return;
      }
      setUser(currentUser);

      // Get student profile
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (studentError) {
        console.error('Error fetching student profile:', studentError);
        Alert.alert('Error', 'Failed to load student profile');
        setLoading(false);
        return;
      }
      setStudent(studentData);

      // Fetch coach-recorded videos where this student is featured
      console.log('🔍 Searching for videos with student ID:', studentData.id);
      
      // Try multiple query methods to debug the issue
      console.log('🔍 Attempting query with student ID:', studentData.id);
      console.log('🔍 Current user context:', user?.id);
      
      let coachVideos: any[] = [];
      let coachError: any = null;
      
      // Method 1: Try overlaps operator
      console.log('🔄 Method 1: Using overlaps operator...');
      const { data: overlapsResult, error: overlapsError } = await supabase
        .from('videos')
        .select('*')
        .overlaps('student_ids', [studentData.id])
        .order('created_at', { ascending: false });
        
      console.log('📊 Overlaps query result:', { data: overlapsResult, error: overlapsError });
      
      if (!overlapsError && overlapsResult && overlapsResult.length > 0) {
        coachVideos = overlapsResult;
        console.log('✅ Overlaps query successful!');
      } else {
        // Method 2: Try contains operator
        console.log('🔄 Method 2: Using contains operator...');
        const { data: containsResult, error: containsError } = await supabase
          .from('videos')
          .select('*')
          .contains('student_ids', [studentData.id])
          .order('created_at', { ascending: false });
          
        console.log('📊 Contains query result:', { data: containsResult, error: containsError });
        
        if (!containsError && containsResult && containsResult.length > 0) {
          coachVideos = containsResult;
          console.log('✅ Contains query successful!');
        } else {
          // Method 3: Try getting all videos and filter client-side (for debugging)
          console.log('🔄 Method 3: Getting all videos for debugging...');
          const { data: allVideos, error: allVideosError } = await supabase
            .from('videos')
            .select('*')
            .limit(10);
            
          console.log('📊 All videos query result:', { data: allVideos, error: allVideosError });
          
          if (allVideos) {
            // Filter client-side to see if any contain Maya's ID
            const mayaVideos = allVideos.filter(video => 
              video.student_ids && video.student_ids.includes(studentData.id)
            );
            console.log('🎯 Client-side filtered videos for Maya:', mayaVideos);
            coachVideos = mayaVideos;
          }
          
          coachError = containsError || overlapsError;
        }
      }

      // Skip personal videos for now since table doesn't exist
      const personalVideos: any[] = [];
      const personalError = null;
      
      console.log('⚠️ Skipping personal videos query - table does not exist');

      if (coachError) {
        console.error('Error fetching coach videos:', coachError);
      }

      // Combine and sort all videos by creation date
      const allVideos: VideoItem[] = [
        ...(coachVideos || []).map((v: any) => ({ ...v, type: 'coach' as const })),
        ...(personalVideos || []).map((v: any) => ({ ...v, type: 'personal' as const }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setVideos(allVideos);
      console.log(`📹 Loaded ${coachVideos?.length || 0} coach videos + ${personalVideos?.length || 0} personal videos = ${allVideos.length} total`);

    } catch (error) {
      console.error('Error in fetchStudentVideos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const generateThumbnailUrl = (video: VideoItem): string | null => {
    const isCoachVideo = video.type === 'coach';
    
    // First, try to use existing thumbnail_url
    if (isCoachVideo && (video as CoachVideo).thumbnail_url) {
      return (video as CoachVideo).thumbnail_url!;
    }
    if (!isCoachVideo && (video as PersonalVideo).thumbnail_url) {
      return (video as PersonalVideo).thumbnail_url!;
    }
    
    // Generate thumbnail URL from video URL if no explicit thumbnail
    if (isCoachVideo && (video as CoachVideo).s3_url) {
      const videoUrl = (video as CoachVideo).s3_url;
      // Try to generate thumbnail by replacing video extension with jpg
      // This assumes thumbnails are stored in the same location with .jpg extension
      const thumbnailUrl = videoUrl.replace(/\.(mp4|mov|avi)$/i, '_thumbnail.jpg');
      return thumbnailUrl;
    }
    
    return null;
  };

  const VideoCard: React.FC<{ video: VideoItem }> = ({ video }) => {
    const isCoachVideo = video.type === 'coach';
    const videoUrl = isCoachVideo ? (video as CoachVideo).s3_url : (video as PersonalVideo).video_url;
    const trickName = video.trick_name || 'Untitled Video';
    const duration = isCoachVideo ? (video as CoachVideo).duration : (video as PersonalVideo).duration;
    const thumbnailUrl = generateThumbnailUrl(video);
    const [thumbnailError, setThumbnailError] = useState(false);
    
    // Enhanced status logic
    const getStatusBadge = () => {
      if (video.landed === null || video.landed === undefined) {
        return null; // No status available
      }
      
      if (video.landed) {
        return {
          text: 'Landed! 🎉',
          backgroundColor: COLORS.success,
          icon: Trophy
        };
      } else {
        return {
          text: 'Trying 💪',
          backgroundColor: COLORS.warning,
          icon: Target
        };
      }
    };

    const statusBadge = getStatusBadge();
    
    return (
      <TouchableOpacity 
        style={styles.videoCard}
        onPress={() => {
          (navigation as any).navigate('VideoDetail', { video });
        }}
      >
        <View style={styles.videoThumbnail}>
          {thumbnailUrl && !thumbnailError ? (
            <Image
              source={{ uri: thumbnailUrl }}
              style={styles.thumbnailImage}
              onError={() => setThumbnailError(true)}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderThumbnail}>
              <Video size={SIZES.icon.large} color={COLORS.white} />
            </View>
          )}
          
          {/* Duration badge */}
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatDuration(duration)}</Text>
          </View>
          
          {/* Video type badge */}
          <View style={[
            styles.typeBadge, 
            { backgroundColor: isCoachVideo ? COLORS.primary : COLORS.secondary }
          ]}>
            {isCoachVideo ? (
              <Users size={12} color={COLORS.white} />
            ) : (
              <Star size={12} color={COLORS.white} />
            )}
          </View>

          {/* Play overlay */}
          <View style={styles.playOverlay}>
            <Play size={SIZES.icon.medium} color={COLORS.white} fill={COLORS.white} />
          </View>
        </View>
        
        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle}>{trickName}</Text>
          
          <View style={styles.videoMeta}>
            <View style={styles.metaItem}>
              <Clock size={SIZES.icon.small} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{formatTime(video.created_at)}</Text>
            </View>
            
            <View style={styles.metaItem}>
              <Text style={[styles.metaText, { 
                color: isCoachVideo ? COLORS.primary : COLORS.secondary,
                fontWeight: 'bold'
              }]}>
                {isCoachVideo ? 'Coach Video' : 'Personal'}
              </Text>
            </View>
          </View>

          {/* Enhanced status badge */}
          {statusBadge && (
            <View style={[
              styles.statusBadge, 
              { backgroundColor: statusBadge.backgroundColor }
            ]}>
              <statusBadge.icon size={14} color={COLORS.white} />
              <Text style={styles.statusText}>
                {statusBadge.text}
              </Text>
            </View>
          )}

          {/* Show description/comment */}
          {isCoachVideo && (video as CoachVideo).comment && (
            <Text style={styles.videoComment} numberOfLines={2}>
              {(video as CoachVideo).comment}
            </Text>
          )}
          {!isCoachVideo && (video as PersonalVideo).description && (
            <Text style={styles.videoComment} numberOfLines={2}>
              {(video as PersonalVideo).description}
            </Text>
          )}
        </View>

        <View style={styles.playButton}>
          <Play size={SIZES.icon.medium} color={COLORS.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Video size={64} color={COLORS.textSecondary} />
      <Text style={styles.emptyTitle}>No Videos Yet</Text>
      <Text style={styles.emptySubtitle}>
        Your coach videos and personal uploads will appear here
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={SIZES.icon.medium} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const coachVideosCount = videos.filter(v => v.type === 'coach').length;
  const personalVideosCount = videos.filter(v => v.type === 'personal').length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={SIZES.icon.medium} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>My Videos</Text>
          <View style={styles.headerMeta}>
            <Calendar size={SIZES.icon.small} color={COLORS.textSecondary} />
            <Text style={styles.headerDate}>All Videos</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {videos.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <View style={styles.videoCount}>
              <Text style={styles.videoCountText}>
                {videos.length} total video{videos.length !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.videoBreakdown}>
                {coachVideosCount} from coach • {personalVideosCount} personal
              </Text>
            </View>
            
            {videos.map((video) => (
              <VideoCard key={`${video.type}-${video.id}`} video={video} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.black,
    ...SHADOWS.brutalist,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.h2,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerDate: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoCount: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  videoCountText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.xs,
  },
  videoBreakdown: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
  },
  videoCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.black,
    ...SHADOWS.brutalist,
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  videoThumbnail: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.md,
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: BORDER_RADIUS.md,
  },
  durationBadge: {
    position: 'absolute',
    bottom: SPACING.xs,
    right: SPACING.xs,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },
  durationText: {
    fontSize: 10,
    color: COLORS.white,
  },
  typeBadge: {
    position: 'absolute',
    top: SPACING.xs,
    left: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },
  videoInfo: {
    flex: 1,
    padding: SPACING.md,
  },
  videoTitle: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.black,
    marginBottom: SPACING.sm,
  },
  videoMeta: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  metaText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },

  videoComment: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  playButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: BORDER_RADIUS.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  statusText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginLeft: SPACING.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
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
    paddingHorizontal: SPACING.xl,
  },
});

export default StudentVideosListScreen; 