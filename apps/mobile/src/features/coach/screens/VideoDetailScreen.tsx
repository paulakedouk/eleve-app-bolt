import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Video, ResizeMode } from 'expo-av';
import { 
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Users,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  MessageCircle,
  Share2,
  Download,
  Star,
  MoreVertical
} from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';

const { width: screenWidth } = Dimensions.get('window');
const videoHeight = (screenWidth * 9) / 16; // 16:9 aspect ratio

interface VideoDetailRouteParams {
  video: {
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
  };
}

const VideoDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { video } = (route.params as VideoDetailRouteParams) || {};
  
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<any>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!video) {
      Alert.alert('Error', 'Video not found');
      navigation.goBack();
    }
  }, [video, navigation]);

  if (!video) {
    return null;
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = async () => {
    if (videoRef.current) {
      await videoRef.current.setIsMutedAsync(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const handleRestart = async () => {
    if (videoRef.current) {
      await videoRef.current.replayAsync();
      setIsPlaying(true);
    }
  };

  const handleShare = () => {
    Alert.alert('Share Video', 'Share functionality coming soon!');
  };

  const handleDownload = () => {
    Alert.alert('Download Video', 'Download functionality coming soon!');
  };

  const onPlaybackStatusUpdate = (playbackStatus: any) => {
    setStatus(playbackStatus);
    if (playbackStatus.isLoaded) {
      setIsLoading(false);
      setIsPlaying(playbackStatus.isPlaying);
    }
  };

  const MetaRow: React.FC<{ 
    icon: React.ComponentType<{ size: number; color: string }>;
    label: string;
    value: string;
    color?: string;
  }> = ({ icon: Icon, label, value, color = COLORS.textPrimary }) => (
    <View style={styles.metaRow}>
      <View style={styles.metaIcon}>
        <Icon size={SIZES.icon.small} color={COLORS.textSecondary} />
        <Text style={styles.metaLabel}>{label}</Text>
      </View>
      <Text style={[styles.metaValue, { color }]}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={SIZES.icon.medium} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {video.trick_name || 'Video Details'}
        </Text>
        <TouchableOpacity style={styles.moreButton}>
          <MoreVertical size={SIZES.icon.medium} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Video Player */}
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            style={styles.video}
            source={{ uri: video.s3_url }}
            useNativeControls={false}
            resizeMode={ResizeMode.CONTAIN}
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            shouldPlay={false}
          />
          
          {/* Video Overlay Controls */}
          <View style={styles.videoOverlay}>
            <View style={styles.topControls}>
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>
                  {formatDuration(video.duration)}
                </Text>
              </View>
            </View>
            
            <View style={styles.centerControls}>
              <TouchableOpacity 
                style={styles.playButton}
                onPress={handlePlayPause}
              >
                {isPlaying ? (
                  <Pause size={48} color={COLORS.white} />
                ) : (
                  <Play size={48} color={COLORS.white} />
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.bottomControls}>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={handleRestart}
              >
                <RotateCcw size={SIZES.icon.medium} color={COLORS.white} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={handleMuteToggle}
              >
                {isMuted ? (
                  <VolumeX size={SIZES.icon.medium} color={COLORS.white} />
                ) : (
                  <Volume2 size={SIZES.icon.medium} color={COLORS.white} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <Text style={styles.loadingText}>Loading video...</Text>
            </View>
          )}
        </View>

        {/* Video Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.titleSection}>
            <Text style={styles.videoTitle}>
              {video.trick_name || 'Untitled Video'}
            </Text>
            {video.landed !== null && (
              <View style={[
                styles.statusBadge,
                { backgroundColor: video.landed ? COLORS.success : COLORS.error }
              ]}>
                {video.landed ? (
                  <CheckCircle size={SIZES.icon.small} color={COLORS.white} />
                ) : (
                  <XCircle size={SIZES.icon.small} color={COLORS.white} />
                )}
                <Text style={styles.statusText}>
                  {video.landed ? 'Landed' : 'Missed'}
                </Text>
              </View>
            )}
          </View>

          {/* Video Metadata */}
          <View style={styles.metaSection}>
            <MetaRow 
              icon={Calendar}
              label="Recorded"
              value={formatTime(video.created_at)}
            />
            <MetaRow 
              icon={Clock}
              label="Duration"
              value={formatDuration(video.duration)}
            />
            <MetaRow 
              icon={Users}
              label="Students"
              value={`${video.student_ids.length} student${video.student_ids.length !== 1 ? 's' : ''}`}
            />
          </View>

          {/* Comment Section */}
          {video.comment && (
            <View style={styles.commentSection}>
              <View style={styles.commentHeader}>
                <MessageCircle size={SIZES.icon.small} color={COLORS.textSecondary} />
                <Text style={styles.commentLabel}>Coach Notes</Text>
              </View>
              <Text style={styles.commentText}>{video.comment}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryAction]}
              onPress={handleShare}
            >
              <Share2 size={SIZES.icon.small} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={handleDownload}
            >
              <Download size={SIZES.icon.small} color={COLORS.primary} />
              <Text style={[styles.actionButtonText, { color: COLORS.primary }]}>
                Download
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
  headerTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.black,
    marginLeft: SPACING.sm,
  },
  moreButton: {
    padding: SPACING.sm,
  },
  content: {
    flex: 1,
  },
  videoContainer: {
    width: screenWidth,
    height: videoHeight,
    backgroundColor: COLORS.black,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: SPACING.md,
  },
  durationBadge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  durationText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  centerControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 3,
    borderColor: COLORS.black,
    ...SHADOWS.brutalist,
    padding: SPACING.lg,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  videoTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.h2,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.black,
    marginRight: SPACING.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  statusText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginLeft: SPACING.xs,
  },
  metaSection: {
    marginBottom: SPACING.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  metaIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  metaValue: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  commentSection: {
    marginBottom: SPACING.lg,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  commentLabel: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  commentText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.lineHeights.body,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 3,
    borderColor: COLORS.black,
    ...SHADOWS.brutalist,
  },
  primaryAction: {
    backgroundColor: COLORS.primary,
  },
  secondaryAction: {
    backgroundColor: COLORS.white,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
    marginLeft: SPACING.xs,
  },
});

export default VideoDetailScreen; 