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
  Modal,
  TextInput,
  Animated,
  PanResponder,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
  Video, 
  Clock, 
  Users, 
  Play,
  Calendar,
  Trophy,
  Target,
  X,
  Upload,
  Wifi,
  WifiOff,
  MoreVertical,
  Trash2,
  Edit3,
  Grid3x3,
  List
} from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';
import BackButton from '../../../shared/components/BackButton';
import { supabase } from '../../../shared/lib/supabase';
import { videoUploadService } from '../../../shared/services/videoUploadService';
import { Student } from '../../../shared/types';

interface VideoItem {
  id: string;
  video_url: string; // Changed from s3_url to match database
  duration: number;
  trick_name?: string;
  landed?: boolean;
  comment?: string;
  location?: string; // Location where video was recorded
  student_ids: string[];
  created_at: string;
  upload_status: string;
  thumbnail_url?: string;
  s3_key?: string; // S3 key for deletion
  session_id?: string; // Add session_id field
}

interface LocalStudent {
  id: string;
  full_name: string;
  skill_level?: string;
}

const CoachVideosListScreen: React.FC = () => {
  const navigation = useNavigation();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [pendingVideos, setPendingVideos] = useState<VideoItem[]>([]);
  const [students, setStudents] = useState<LocalStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingVideos, setUploadingVideos] = useState<Set<string>>(new Set());
  const [deletingVideos, setDeletingVideos] = useState<Set<string>>(new Set());
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchStudents = async () => {
    try {
      console.log('🔍 Fetching students...');
      const { data: studentsData, error } = await supabase
        .from('students')
        .select('id, full_name, skill_level');

      if (error) {
        console.error('❌ Error fetching students:', error);
      } else {
        console.log('👥 Loaded students:', studentsData?.length || 0);
        setStudents(studentsData || []);
      }
    } catch (error) {
      console.error('Error in fetchStudents:', error);
    }
  };

  const getStudentNames = (studentIds: string[]): string => {
    if (!studentIds || studentIds.length === 0) {
      return 'No students';
    }

    const names = studentIds
      .map(id => {
        const student = students.find(s => s.id === id);
        return student?.full_name || `Student ${id.slice(0, 8)}`;
      })
      .filter(name => name && name.trim().length > 0); // Filter out empty strings

    if (names.length === 0) {
      return 'Unknown student(s)';
    }

    if (names.length === 1) {
      return names[0] || 'Unknown student';
    }

    if (names.length === 2) {
      return `${names[0]} & ${names[1]}`;
    }

    return `${names[0]} +${names.length - 1} others`;
  };

  const fetchVideos = async () => {
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

      // Fetch students first
      await fetchStudents();

      console.log('🔍 Fetching videos for coach:', currentUser.id);

      // Fetch pending videos (all time)
      const { data: pendingData, error: pendingError } = await supabase
        .from('videos')
        .select(`
          id,
          uri,
          s3_url,
          s3_key,
          thumbnail_url,
          duration,
          trick_name,
          landed,
          comment,
          location,
          student_ids,
          upload_status,
          created_at
        `)
        .eq('coach_id', currentUser.id)
        .eq('upload_status', 'pending')
        .order('created_at', { ascending: false });

      if (pendingError) {
        console.error('❌ Error fetching pending videos:', pendingError);
      } else {
        const transformedPending = (pendingData || []).map(video => ({
          ...video,
          video_url: video.s3_url || video.uri, // Use uri for pending videos
          student_ids: video.student_ids || []
        }));
        setPendingVideos(transformedPending);
        console.log(`📱 Loaded ${transformedPending.length} pending videos`);
      }

      // Get today's date range for uploaded videos
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      // Fetch today's uploaded videos
      const { data: videosData, error } = await supabase
        .from('videos')
        .select(`
          id,
          s3_url,
          s3_key,
          thumbnail_url,
          duration,
          trick_name,
          landed,
          comment,
          location,
          student_ids,
          upload_status,
          created_at
        `)
        .eq('coach_id', currentUser.id)
        .eq('upload_status', 'uploaded')
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching uploaded videos:', error);
        Alert.alert('Error', 'Failed to load videos');
      } else {
        const transformedVideos = (videosData || []).map(video => ({
          ...video,
          video_url: video.s3_url,
          student_ids: video.student_ids || []
        }));
        
        setVideos(transformedVideos);
        console.log(`📹 Loaded ${transformedVideos.length} uploaded videos for today`);
      }
    } catch (error) {
      console.error('Error in fetchVideos:', error);
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

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const generateThumbnailUrl = (video: VideoItem): string | null => {
    // First, try to use existing thumbnail_url
    if (video.thumbnail_url) {
      return video.thumbnail_url;
    }
    
    // Generate thumbnail URL from video URL if no explicit thumbnail
    if (video.video_url) {
      // Try to generate thumbnail by replacing video extension with jpg
      // This assumes thumbnails are stored in the same location with _thumbnail.jpg suffix
      const thumbnailUrl = video.video_url.replace(/\.(mp4|mov|avi)$/i, '_thumbnail.jpg');
      return thumbnailUrl;
    }
    
    return null;
  };

  const convertToSharedStudent = (localStudent: LocalStudent): Student => {
    return {
      id: localStudent.id,
      name: localStudent.full_name,
      level: (localStudent.skill_level as 'Beginner' | 'Intermediate' | 'Advanced') || 'Beginner',
      age: 16, // Default age since it's not available
      xp: 0, // Default XP
      badgeLevel: 'Bronze', // Default badge level
      goals: [], // Default empty goals
    };
  };

  const uploadVideo = async (video: VideoItem) => {
    try {
      setUploadingVideos(prev => new Set(prev).add(video.id));
      
      console.log('🚀 Uploading pending video:', video.id);
      
      // Get current user for organization_id
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Get coach profile for organization_id
      const { data: coachData, error: coachError } = await supabase
        .from('coaches')
        .select('organization_id')
        .eq('id', currentUser.id)
        .single();

      if (coachError || !coachData) {
        throw new Error('Coach profile not found');
      }

      // Get students for this video
      const videoStudents = video.student_ids
        .map(id => students.find(s => s.id === id))
        .filter(s => s) as LocalStudent[];

      if (videoStudents.length === 0) {
        throw new Error('No students found for this video');
      }

      // Upload using videoUploadService
      const uploadResult = await videoUploadService.uploadVideo({
        videoUri: video.video_url, // Local video URI
        sessionId: `pending-${video.id}`,
        coachId: currentUser.id,
        organizationId: coachData.organization_id,
        students: videoStudents.map(convertToSharedStudent),
        trickName: video.trick_name,
        landed: video.landed ?? false,
        comment: video.comment,
        hasVoiceNote: false, // TODO: Get from video data
        location: video.location,
        duration: video.duration,
        onProgress: (progress) => {
          console.log(`📊 Upload Progress: ${progress}%`);
        },
      });

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      console.log('✅ Video uploaded successfully, updating database record');

      // Update the existing database record with new upload info
      const { error: updateError } = await supabase
        .from('videos')
        .update({
          s3_url: uploadResult.s3Url,
          s3_key: uploadResult.s3Url?.split('.amazonaws.com/')[1] || '',
          thumbnail_url: uploadResult.thumbnailUrl,
          upload_status: 'uploaded'
        })
        .eq('id', video.id);
        
      if (updateError) {
        throw updateError;
      }
      
      // Refresh videos to show updated status
      await fetchVideos();
      
      Alert.alert('Success! 🎉', 'Video uploaded successfully');
    } catch (error: any) {
      console.error('❌ Upload failed:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload video');
    } finally {
      setUploadingVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(video.id);
        return newSet;
      });
    }
  };

  const deleteVideo = async (video: VideoItem) => {
    Alert.alert(
      'Delete Video',
      `Are you sure you want to delete this video? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingVideos(prev => new Set(prev).add(video.id));
              
              console.log('🗑️ Deleting video:', video.id);
              
              // Delete from S3 if it was uploaded
              if (video.upload_status === 'uploaded' && video.s3_key) {
                console.log('🗂️ Deleting from S3:', video.s3_key);
                // The videoUploadService has a deleteVideo method we can use
                const deleteSuccess = await videoUploadService.deleteVideo(video.id);
                if (!deleteSuccess) {
                  console.warn('⚠️ S3 deletion may have failed, but continuing with database deletion');
                }
              } else {
                // For pending videos, just delete from database
                const { error } = await supabase
                  .from('videos')
                  .delete()
                  .eq('id', video.id);
                  
                if (error) {
                  throw error;
                }
              }
              
              // Refresh the videos list
              await fetchVideos();
              
              Alert.alert('Success', 'Video deleted successfully');
            } catch (error: any) {
              console.error('❌ Delete failed:', error);
              Alert.alert('Delete Failed', error.message || 'Failed to delete video');
            } finally {
              setDeletingVideos(prev => {
                const newSet = new Set(prev);
                newSet.delete(video.id);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };

  const editVideo = (video: VideoItem) => {
    setEditingVideo(video);
  };

  const saveVideoEdit = async (updatedVideo: VideoItem) => {
    try {
      console.log('✏️ Updating video:', updatedVideo.id);
      
      const { error } = await supabase
        .from('videos')
        .update({
          trick_name: updatedVideo.trick_name,
          location: updatedVideo.location,
          comment: updatedVideo.comment,
          landed: updatedVideo.landed,
        })
        .eq('id', updatedVideo.id);
        
      if (error) {
        throw error;
      }
      
      // Refresh videos
      await fetchVideos();
      setEditingVideo(null);
      
      Alert.alert('Success', 'Video updated successfully');
    } catch (error: any) {
      console.error('❌ Update failed:', error);
      Alert.alert('Update Failed', error.message || 'Failed to update video');
    }
  };

  const PendingVideoCard: React.FC<{ video: VideoItem }> = ({ video }) => {
    const isUploading = uploadingVideos.has(video.id);
    const isDeleting = deletingVideos.has(video.id);
    const [thumbnailError, setThumbnailError] = useState(false);
    const [showActions, setShowActions] = useState(false);
    
    const handleVideoPress = () => {
      // For pending videos, we can still preview the local video
      if (!isUploading && !isDeleting && video.video_url) {
        // You could implement a local video player here
        console.log('Playing local video:', video.video_url);
        // navigation.navigate('VideoPlayer', { videoUri: video.video_url });
      }
    };

    const handleActionsPress = () => {
      Alert.alert(
        'Video Actions',
        'Choose an action:',
        [
          {
            text: 'Edit',
            onPress: () => editVideo(video),
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteVideo(video),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    };
    
    return (
      <View style={[styles.videoCard, styles.pendingVideoCard]}>
        {/* Thumbnail Section */}
        <TouchableOpacity 
          style={styles.thumbnailContainer}
          onPress={handleVideoPress}
          activeOpacity={0.8}
        >
          {video.thumbnail_url && !thumbnailError ? (
            <Image
              source={{ uri: video.thumbnail_url }}
              style={styles.thumbnailImage}
              onError={(error) => {
                console.log('❌ Pending thumbnail load error:', error.nativeEvent.error);
                setThumbnailError(true);
              }}
              onLoad={() => {
                console.log('✅ Pending thumbnail loaded successfully:', video.thumbnail_url);
              }}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderThumbnail}>
              <Video size={SIZES.icon.xlarge} color={COLORS.white} />
            </View>
          )}
          
          <Text style={styles.pendingBadge}>PENDING</Text>
          
          {/* Duration badge */}
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatDuration(video.duration)}</Text>
          </View>

          {/* Play overlay for preview */}
          <View style={styles.playOverlay}>
            <View style={styles.playButton}>
              <Play size={SIZES.icon.large} color={COLORS.primary} fill={COLORS.primary} />
            </View>
          </View>

          {/* Actions overlay */}
          <View style={styles.actionsOverlay}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleActionsPress}
            >
              <MoreVertical size={SIZES.icon.small} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* Upload button overlay */}
          <View style={styles.uploadOverlay}>
            <TouchableOpacity
              style={[styles.uploadButton, (isUploading || isDeleting) && styles.uploadButtonDisabled]}
              onPress={() => !isUploading && !isDeleting && uploadVideo(video)}
              disabled={isUploading || isDeleting}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : isDeleting ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Upload size={SIZES.icon.medium} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        
        {/* Content Section */}
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.videoTitle} numberOfLines={1}>
              {video.trick_name || 'Untitled Video'}
            </Text>
            <View style={styles.pendingStatusBadge}>
              <WifiOff size={12} color={COLORS.warning} />
            </View>
          </View>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={SIZES.icon.small} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{formatTime(video.created_at)}</Text>
            </View>
            
            <View style={styles.metaItem}>
              <Users size={SIZES.icon.small} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{getStudentNames(video.student_ids)}</Text>
            </View>
          </View>

          {video.location && (
            <View style={styles.metaRow}>
              <Text style={styles.locationText}>📍 {video.location}</Text>
            </View>
          )}

          {video.comment && (
            <Text style={styles.videoComment} numberOfLines={2}>
              {video.comment}
            </Text>
          )}
          
          <Text style={styles.pendingText}>
            {isUploading ? 'Uploading...' : 'Tap upload button to upload when ready'}
          </Text>
        </View>
      </View>
    );
  };

  const VideoCard: React.FC<{ video: VideoItem }> = ({ video }) => {
    const thumbnailUrl = generateThumbnailUrl(video);
    const [thumbnailError, setThumbnailError] = useState(false);
    const isDeleting = deletingVideos.has(video.id);

    const handleActionsPress = () => {
      Alert.alert(
        'Video Actions',
        'Choose an action:',
        [
          {
            text: 'Edit',
            onPress: () => editVideo(video),
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteVideo(video),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    };
    
    // Debug thumbnail URL
    console.log('🖼️ Video thumbnail debug:', {
      videoId: video.id,
      thumbnailUrl: thumbnailUrl,
      databaseThumbnailUrl: video.thumbnail_url,
      videoUrl: video.video_url,
      thumbnailError
    });
    
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
    
    const handleCardPress = () => {
      console.log('Opening video detail for:', video.id);
      // TODO: Navigate to video detail page
      // (navigation as any).navigate('VideoDetail', { video });
    };

    return (
      <TouchableOpacity 
        style={styles.videoCard}
        onPress={handleCardPress}
        activeOpacity={0.8}
      >
        {/* Thumbnail Section */}
        <View style={styles.thumbnailContainer}>
          {thumbnailUrl && !thumbnailError ? (
            <Image
              source={{ uri: thumbnailUrl }}
              style={styles.thumbnailImage}
              onError={(error) => {
                console.log('❌ Thumbnail load error:', error.nativeEvent.error);
                console.log('🔗 Failed URL:', thumbnailUrl);
                setThumbnailError(true);
              }}
              onLoad={() => {
                console.log('✅ Thumbnail loaded successfully:', thumbnailUrl);
              }}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderThumbnail}>
              <Video size={SIZES.icon.xlarge} color={COLORS.white} />
              {/* Debug text to show why placeholder is showing */}
              <Text style={styles.debugText}>
                {!thumbnailUrl ? 'No URL' : 'Load Failed'}
              </Text>
            </View>
          )}
          
          {/* Duration badge */}
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatDuration(video.duration)}</Text>
          </View>

          {/* Play overlay */}
          <View style={styles.playOverlay}>
            <View style={styles.playButton}>
              <Play size={SIZES.icon.large} color={COLORS.primary} fill={COLORS.primary} />
            </View>
          </View>

          {/* Actions overlay - positioned above play overlay */}
          <View style={styles.actionsOverlay}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleActionsPress}
            >
              <MoreVertical size={SIZES.icon.small} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Content Section */}
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.videoTitle} numberOfLines={1}>
              {video.trick_name || 'Untitled Video'}
            </Text>
            {statusBadge && (
              <View style={[
                styles.statusBadge, 
                { backgroundColor: statusBadge.backgroundColor }
              ]}>
                <statusBadge.icon size={12} color={COLORS.white} />
              </View>
            )}
          </View>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={SIZES.icon.small} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{formatTime(video.created_at)}</Text>
            </View>
            
            <View style={styles.metaItem}>
              <Users size={SIZES.icon.small} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{getStudentNames(video.student_ids)}</Text>
            </View>
          </View>

          {video.location && (
            <View style={styles.metaRow}>
              <Text style={styles.locationText}>📍 {video.location}</Text>
            </View>
          )}

          {video.comment && (
            <Text style={styles.videoComment} numberOfLines={2}>
              {video.comment}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const ListVideoCard: React.FC<{ video: VideoItem; isPending?: boolean }> = ({ video, isPending = false }) => {
    const thumbnailUrl = generateThumbnailUrl(video);
    const [thumbnailError, setThumbnailError] = useState(false);
    const isUploading = uploadingVideos.has(video.id);
    const isDeleting = deletingVideos.has(video.id);
    
    const translateX = new Animated.Value(0);

    const panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 50;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Allow both left and right swipes
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 60) {
          // Right swipe (left to right) - Delete
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          handleDelete();
        } else if (gestureState.dx < -60) {
          // Left swipe (right to left) - Edit
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          handleEdit();
        } else {
          // Reset position if threshold not reached
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    });

    const handleCardPress = () => {
      console.log('Opening video detail for:', video.id);
      // TODO: Navigate to video detail page
      // (navigation as any).navigate('VideoDetail', { video });
    };

    const handleEdit = () => {
      editVideo(video);
    };

    const handleDelete = () => {
      deleteVideo(video);
    };

          return (
        <View style={styles.listItemContainer}>
          {/* Swipe Action Backgrounds */}
          <View style={styles.swipeBackgroundContainer}>
            {/* Delete background (left side) */}
            <View style={styles.swipeDeleteBackground}>
              <Text style={styles.swipeActionText}>DELETE</Text>
            </View>
            {/* Edit background (right side) */}
            <View style={styles.swipeEditBackground}>
              <Text style={styles.swipeActionText}>EDIT</Text>
            </View>
          </View>

          {/* Main Content */}
          <Animated.View
            style={[
              styles.listItem,
              isPending && styles.listItemPending,
              { transform: [{ translateX }] }
            ]}
            {...panResponder.panHandlers}
          >
          <TouchableOpacity
            style={styles.listItemContent}
            onPress={handleCardPress}
            activeOpacity={0.8}
          >
            {/* Thumbnail */}
            <View style={styles.listThumbnailContainer}>
              {(thumbnailUrl || video.thumbnail_url) && !thumbnailError ? (
                <Image
                  source={{ uri: thumbnailUrl || video.thumbnail_url }}
                  style={styles.listThumbnail}
                  onError={() => setThumbnailError(true)}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.listThumbnailPlaceholder}>
                  <Video size={SIZES.icon.large} color={COLORS.white} />
                </View>
              )}
              
              {isPending && (
                <View style={styles.listPendingBadge}>
                  <Text style={styles.listPendingText}>PENDING</Text>
                </View>
              )}
              
              <View style={styles.listDurationBadge}>
                <Text style={styles.listDurationText}>{formatDuration(video.duration)}</Text>
              </View>
            </View>

            {/* Content */}
            <View style={styles.listContentContainer}>
              <View style={styles.listHeader}>
                <Text style={styles.listTitle} numberOfLines={1}>
                  {video.trick_name || 'Untitled Video'}
                </Text>
                <Text style={styles.listTime}>{formatTime(video.created_at)}</Text>
              </View>
              
              <View style={styles.listMeta}>
                <View style={styles.listMetaItem}>
                  <Users size={SIZES.icon.small} color={COLORS.textSecondary} />
                  <Text style={styles.listMetaText}>{getStudentNames(video.student_ids)}</Text>
                </View>
                
                {video.location && (
                  <Text style={styles.listLocation}>📍 {video.location}</Text>
                )}
              </View>

              {video.landed !== null && video.landed !== undefined && (
                <View style={[
                  styles.listStatusBadge,
                  video.landed ? styles.listStatusLanded : styles.listStatusTrying
                ]}>
                  {video.landed ? (
                    <Trophy size={12} color={COLORS.success} />
                  ) : (
                    <Target size={12} color={COLORS.warning} />
                  )}
                  <Text style={[
                    styles.listStatusText,
                    video.landed ? styles.listStatusTextLanded : styles.listStatusTextTrying
                  ]}>
                    {video.landed ? 'Landed' : 'Trying'}
                  </Text>
                </View>
              )}
            </View>

            {/* Upload Status */}
            {isPending && (
              <View style={styles.listUploadStatus}>
                {isUploading ? (
                  <ActivityIndicator size="small" color={COLORS.warning} />
                ) : (
                  <Upload size={SIZES.icon.medium} color={COLORS.warning} />
                )}
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Video size={64} color={COLORS.textSecondary} />
      </View>
      <Text style={styles.emptyTitle}>No Videos Today</Text>
      <Text style={styles.emptySubtitle}>
        Record your first video today to see it here
      </Text>
    </View>
  );

  const LOCATION_OPTIONS = ['mini ramp', 'park', 'street', 'vert'];

  const EditVideoModal = () => {
    const [editedVideo, setEditedVideo] = useState<VideoItem | null>(editingVideo);

    useEffect(() => {
      setEditedVideo(editingVideo);
    }, [editingVideo]);

    if (!editedVideo) return null;

    const handleSave = () => {
      saveVideoEdit(editedVideo);
    };

    const handleCancel = () => {
      setEditingVideo(null);
    };

    return (
      <Modal
        visible={!!editingVideo}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancel}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCancel} style={styles.modalCancelButton}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Video</Text>
            <TouchableOpacity onPress={handleSave} style={styles.modalSaveButton}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Trick Name */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Trick Name</Text>
              <TextInput
                style={styles.modalInput}
                value={editedVideo.trick_name || ''}
                onChangeText={(text) => setEditedVideo({ ...editedVideo, trick_name: text })}
                placeholder="Enter trick name"
              />
            </View>

            {/* Location */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Location</Text>
              <View style={styles.modalChipsContainer}>
                {LOCATION_OPTIONS.map(location => (
                  <TouchableOpacity
                    key={location}
                    style={[
                      styles.modalChip,
                      editedVideo.location === location && styles.modalChipSelected
                    ]}
                    onPress={() => setEditedVideo({ ...editedVideo, location })}
                  >
                    <Text style={[
                      styles.modalChipText,
                      editedVideo.location === location && styles.modalChipTextSelected
                    ]}>
                      {location.charAt(0).toUpperCase() + location.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Landed Status */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Status</Text>
              <View style={styles.modalLandedButtons}>
                <TouchableOpacity
                  style={[
                    styles.modalLandedButton,
                    editedVideo.landed === false && styles.modalLandedButtonSelected
                  ]}
                  onPress={() => setEditedVideo({ ...editedVideo, landed: false })}
                >
                  <X size={SIZES.icon.medium} color={editedVideo.landed === false ? COLORS.white : COLORS.warning} />
                  <Text style={[
                    styles.modalLandedButtonText,
                    editedVideo.landed === false && styles.modalLandedButtonTextSelected
                  ]}>
                    Trying
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.modalLandedButton,
                    editedVideo.landed === true && styles.modalLandedButtonSelected
                  ]}
                  onPress={() => setEditedVideo({ ...editedVideo, landed: true })}
                >
                  <Trophy size={SIZES.icon.medium} color={editedVideo.landed === true ? COLORS.white : COLORS.success} />
                  <Text style={[
                    styles.modalLandedButtonText,
                    editedVideo.landed === true && styles.modalLandedButtonTextSelected
                  ]}>
                    Landed
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Comment */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Comment</Text>
              <TextInput
                style={styles.modalTextArea}
                value={editedVideo.comment || ''}
                onChangeText={(text) => setEditedVideo({ ...editedVideo, comment: text })}
                placeholder="Add notes about this video..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.headerContent}>
          <Text style={styles.title}>Videos</Text>
          <View style={styles.headerMeta}>
            <Calendar size={SIZES.icon.small} color={COLORS.textSecondary} />
            <Text style={styles.headerDate}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long',
                month: 'short', 
                day: 'numeric' 
              })}
            </Text>
          </View>
        </View>
        
        {/* View Toggle */}
        <TouchableOpacity
          style={styles.viewToggle}
          onPress={() => setViewMode(viewMode === 'card' ? 'list' : 'card')}
        >
          {viewMode === 'card' ? (
            <List size={SIZES.icon.medium} color={COLORS.textPrimary} />
          ) : (
            <Grid3x3 size={SIZES.icon.medium} color={COLORS.textPrimary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Pending Uploads Section */}
        {pendingVideos.length > 0 && (
          <View style={styles.videosContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderContent}>
                <Upload size={SIZES.icon.medium} color={COLORS.warning} />
                <Text style={styles.sectionTitle}>Pending Uploads</Text>
              </View>
              <Text style={styles.sectionCount}>
                {pendingVideos.length} video{pendingVideos.length !== 1 ? 's' : ''}
              </Text>
            </View>
            
            {pendingVideos.map((video) => (
              viewMode === 'card' ? (
                <PendingVideoCard key={video.id} video={video} />
              ) : (
                <ListVideoCard key={video.id} video={video} isPending={true} />
              )
            ))}
          </View>
        )}

        {/* Today's Videos Section */}
        {videos.length === 0 && pendingVideos.length === 0 ? (
          <EmptyState />
        ) : (
          <View style={styles.videosContainer}>
            {videos.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderContent}>
                    <Video size={SIZES.icon.medium} color={COLORS.primary} />
                    <Text style={styles.sectionTitle}>Today's Videos</Text>
                  </View>
                  <Text style={styles.sectionCount}>
                    {videos.length} video{videos.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                
                {videos.map((video) => (
                  viewMode === 'card' ? (
                    <VideoCard key={video.id} video={video} />
                  ) : (
                    <ListVideoCard key={video.id} video={video} isPending={false} />
                  )
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>
      
      <EditVideoModal />
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
    borderBottomWidth: 2,
    borderBottomColor: COLORS.black,
    ...SHADOWS.brutalist,
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
    fontFamily: TYPOGRAPHY.families.archivoBold,
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
  viewToggle: {
    padding: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.black,
    ...SHADOWS.brutalist,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videosContainer: {
    paddingHorizontal: SPACING.lg,
  },
  videoCount: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  videoCountText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  videoCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 3,
    borderColor: COLORS.black,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    // Neo-brutalism light gray shadow
    shadowColor: '#E5E7EB', // Light gray
    shadowOffset: {
      width: 6,
      height: 6,
    },
    shadowOpacity: 1,
    shadowRadius: 0, // Hard shadow, no blur
    elevation: 8, // Android shadow
  },
  thumbnailContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  durationText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.brutalist,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  videoTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.black,
    fontFamily: TYPOGRAPHY.families.archivoBold,
    marginRight: SPACING.sm,
  },
  statusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.brutalist,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  metaText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  videoComment: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: TYPOGRAPHY.lineHeights.bodySmall,
    marginTop: SPACING.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 3,
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.surface,
    borderWidth: 3,
    borderColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.brutalist,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.h2,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    fontFamily: TYPOGRAPHY.families.archivoBold,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeights.body,
  },
  debugText: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.white,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },
  pendingVideoCard: {
    borderColor: COLORS.warning,
    backgroundColor: '#FFF4E6', // Light orange background
  },
  pendingBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.white,
    backgroundColor: COLORS.warning,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  actionsOverlay: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xs,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadOverlay: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xs,
  },
  uploadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.warning,
    borderWidth: 2,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: COLORS.textTertiary,
    borderColor: COLORS.textTertiary,
  },
  pendingStatusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.warning,
    backgroundColor: '#FFF4E6',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.brutalist,
  },
  locationText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
    fontStyle: 'italic',
  },
  pendingText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.warning,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
    fontFamily: TYPOGRAPHY.families.archivoBold,
  },
  sectionCount: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.black,
  },
  modalCancelButton: {
    padding: SPACING.sm,
  },
  modalCancelText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.families.archivoBold,
  },
  modalSaveButton: {
    padding: SPACING.sm,
  },
  modalSaveText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.accentBlue,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  modalSection: {
    marginBottom: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  modalSectionTitle: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    fontFamily: TYPOGRAPHY.families.poppins,
  },
  modalInput: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.black,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.medium,
    ...SHADOWS.brutalist,
  },
  modalChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  modalChip: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.black,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    ...SHADOWS.brutalist,
  },
  modalChipSelected: {
    backgroundColor: COLORS.black,
  },
  modalChipText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  modalChipTextSelected: {
    color: COLORS.white,
  },
  modalLandedButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modalLandedButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.black,
    paddingVertical: SPACING.md,
    ...SHADOWS.brutalist,
  },
  modalLandedButtonSelected: {
    backgroundColor: COLORS.secondary,
  },
  modalLandedButtonText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  modalLandedButtonTextSelected: {
    color: COLORS.white,
  },
  modalTextArea: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.black,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
    fontWeight: TYPOGRAPHY.weights.medium,
    ...SHADOWS.brutalist,
  },
  // List view styles
  listItemContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  listItem: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.black,
    ...SHADOWS.brutalist,
  },
  listItemPending: {
    backgroundColor: '#FFF4E6',
    borderColor: COLORS.warning,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  listThumbnailContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  listThumbnail: {
    width: 80,
    height: 60,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.black,
  },
  listThumbnailPlaceholder: {
    width: 80,
    height: 60,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.black,
    backgroundColor: COLORS.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listPendingBadge: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: COLORS.warning,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  listPendingText: {
    fontSize: 8,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  listDurationBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  listDurationText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  listContentContainer: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  listTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginRight: SPACING.sm,
    fontFamily: TYPOGRAPHY.families.archivoBold,
  },
  listTime: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: SPACING.xs,
  },
  listMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  listMetaText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  listLocation: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  listStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  listStatusLanded: {
    backgroundColor: '#E6F7E6',
    borderColor: COLORS.success,
  },
  listStatusTrying: {
    backgroundColor: '#FFF4E6',
    borderColor: COLORS.warning,
  },
  listStatusText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginLeft: 4,
  },
  listStatusTextLanded: {
    color: COLORS.success,
  },
  listStatusTextTrying: {
    color: COLORS.warning,
  },
  listUploadStatus: {
    marginLeft: SPACING.sm,
  },
  // Swipe action background styles
  swipeBackgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  swipeDeleteBackground: {
    flex: 1,
    backgroundColor: COLORS.warning,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: SPACING.xl,
  },
  swipeEditBackground: {
    flex: 1,
    backgroundColor: COLORS.accentBlue,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: SPACING.xl,
  },
  swipeActionText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
    letterSpacing: 1,
  },
});

export default CoachVideosListScreen; 