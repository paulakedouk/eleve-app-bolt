import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  StatusBar,
  Image,
  ActionSheetIOS,
  Platform,
  Modal,
  Animated,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import NetInfo from '@react-native-community/netinfo';
import { 
  ArrowLeft, 
  Camera, 
  Play, 
  Users, 
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Mic,
  MoreHorizontal,
  Share,
  Edit3,
  Download,
  X,
  Wifi,
  WifiOff,
  Upload,
  Clock8,
  Check
} from 'lucide-react-native';
import { RootStackParamList, Student, SessionVideo } from '../../../shared/types';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';
import { SessionStorage } from '../../../shared/utils/sessionStorage';
import { videoUploadService } from '../../../shared/services/videoUploadService';
import { getCurrentUser } from '../../../shared/lib/supabase';
import { supabase } from '../../../shared/lib/supabase';

type SessionHomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SessionHome'>;

// Circular Progress Component
interface CircularProgressProps {
  progress: number; // 0-100
  size: number;
  strokeWidth: number;
  color: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ progress, size, strokeWidth, color }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: COLORS.surface,
          position: 'absolute',
        }}
      />
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: color,
          borderTopColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: 'transparent',
          position: 'absolute',
          transform: [
            {
              rotate: animatedValue.interpolate({
                inputRange: [0, 100],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        }}
      />
    </View>
  );
};

const SessionHomeScreen: React.FC = () => {
  const navigation = useNavigation<SessionHomeNavigationProp>();
  const route = useRoute();
  const { environment, environmentName, students, newVideo } = route.params as {
    environment: string;
    environmentName: string;
    students: Student[];
    newVideo?: SessionVideo;
  };

  const [sessionVideos, setSessionVideos] = useState<SessionVideo[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date());
  const [sessionEndTime, setSessionEndTime] = useState<Date | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [showContextMenu, setShowContextMenu] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [showUploadDialog, setShowUploadDialog] = useState<boolean>(false);

  // Load session data when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      const loadSessionData = async () => {
        try {
          const activeSession = await SessionStorage.getActiveSession();
          if (activeSession) {
            setSessionVideos(activeSession.videos);
            setSessionStartTime(activeSession.startTime);
          }
        } catch (error) {
          console.error('Error loading session data:', error);
        }
      };

      loadSessionData();
    }, [])
  );

  // Handle new video from SessionVideoReview
  useEffect(() => {
    const handleNewVideo = async () => {
      if (newVideo) {
        try {
          // Set initial upload status for new videos
          const videoWithStatus = {
            ...newVideo,
            uploadStatus: 'pending' as const,
            uploadProgress: 0,
          };

          if (newVideo.isEditing) {
            // Update existing video
            await SessionStorage.updateVideoInSession(newVideo.id, videoWithStatus);
          } else {
            // Add new video
            await SessionStorage.addVideoToSession(videoWithStatus);
                      // Upload to S3 for new videos
          uploadToS3(videoWithStatus.id);
          }
          
          // Reload session data
          const activeSession = await SessionStorage.getActiveSession();
          if (activeSession) {
            setSessionVideos(activeSession.videos);
          }
        } catch (error) {
          console.error('Error saving video:', error);
          Alert.alert('Error', 'Failed to save video. Please try again.');
        }
        
        // Clear the newVideo param to prevent re-adding on re-renders
        navigation.setParams({ newVideo: undefined });
      }
    };

    handleNewVideo();
  }, [newVideo, navigation]);

  // Monitor network connection
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
    });

    return unsubscribe;
  }, []);

  // Real S3 upload process
  const uploadToS3 = async (videoId: string) => {
    try {
      console.log(`🎬 Starting S3 upload for video: ${videoId}`);
      
      // Get current authenticated user
      const currentUser = await getCurrentUser();
      if (!currentUser?.id) {
        console.error('❌ No authenticated user found');
        Alert.alert('Error', 'Please log in to upload videos');
        return;
      }
      
      const activeSession = await SessionStorage.getActiveSession();
      if (!activeSession) {
        console.error('❌ No active session found');
        return;
      }

      const video = activeSession.videos.find(v => v.id === videoId);
      if (!video || !video.uri) {
        console.error('❌ Video not found or missing URI');
        return;
      }

      // Update status to uploading
      video.uploadStatus = 'uploading';
      video.uploadProgress = 0;
      await SessionStorage.updateVideoInSession(videoId, video);
      setSessionVideos([...activeSession.videos]);

      // Get coach's organization_id
      const { data: coachData } = await supabase
        .from('coaches')
        .select('organization_id')
        .eq('id', currentUser.id)
        .single();
      
      const organizationId = coachData?.organization_id;
      if (!organizationId) {
        console.error('❌ Coach organization_id not found');
        Alert.alert('Error', 'Unable to upload video. Coach profile is incomplete.');
        return;
      }

      // Upload to S3 and save to database
      const uploadResult = await videoUploadService.uploadVideo({
        videoUri: video.uri,
        sessionId: activeSession.id,
        coachId: currentUser.id, // Use actual authenticated user ID
        organizationId, // Add organization_id
        students: video.students,
        trickName: video.trickName,
        landed: video.landed,
        comment: video.comment,
        hasVoiceNote: video.hasVoiceNote,
        duration: video.duration || 0,
        onProgress: async (progress) => {
          // Update progress in real-time
          video.uploadProgress = progress;
          await SessionStorage.updateVideoInSession(videoId, video);
          setSessionVideos([...activeSession.videos]);
        },
      });

      if (uploadResult.success) {
        console.log(`✅ Video uploaded successfully: ${uploadResult.s3Url}`);
        
        // Mark as uploaded with S3 URL
        video.uploadStatus = 'uploaded';
        video.uploadProgress = 100;
        video.s3Url = uploadResult.s3Url;
        video.databaseId = uploadResult.videoId;
        
        await SessionStorage.updateVideoInSession(videoId, video);
        setSessionVideos([...activeSession.videos]);
      } else {
        console.error(`❌ Upload failed: ${uploadResult.error}`);
        
        // Mark as failed
        video.uploadStatus = 'failed';
        video.uploadProgress = 0;
        
        await SessionStorage.updateVideoInSession(videoId, video);
        setSessionVideos([...activeSession.videos]);
      }

    } catch (error) {
      console.error('❌ S3 upload error:', error);
      
      // Mark as failed
      const activeSession = await SessionStorage.getActiveSession();
      if (activeSession) {
        const video = activeSession.videos.find(v => v.id === videoId);
        if (video) {
          video.uploadStatus = 'failed';
          video.uploadProgress = 0;
          await SessionStorage.updateVideoInSession(videoId, video);
          setSessionVideos([...activeSession.videos]);
        }
      }
    }
  };

  const getSessionDuration = () => {
    const endTime = sessionEndTime || new Date();
    const diffMs = endTime.getTime() - sessionStartTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins;
  };

  const getSessionTimeDisplay = () => {
    const startTime = sessionStartTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    
    if (sessionEndTime) {
      const endTime = sessionEndTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${startTime} - ${endTime}`;
    }
    
    return `Started ${startTime}`;
  };

  const getSessionDate = () => {
    return sessionStartTime.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleRecordNewVideo = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to record videos');
        return;
      }

      // Launch camera for video recording
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1, // Highest quality
        videoMaxDuration: 60, // 1 minute max
      });

      if (!result.canceled && result.assets[0]) {
        const video = result.assets[0];
        // Navigate to session video review
        navigation.navigate('SessionVideoReview', {
          videoUri: video.uri,
          videoDuration: video.duration ? Math.floor(video.duration / 1000) : 0,
          sessionStudents: students,
          environment: environment,
          environmentName: environmentName,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to access camera');
      console.error('Camera error:', error);
    }
  };

  const handleEndSession = () => {
    setSessionEndTime(new Date());
    setShowUploadDialog(true);
  };

  const handleEndSessionWithUpload = async (shouldUpload: boolean) => {
    setShowUploadDialog(false);
    
    try {
      // Get current authenticated user
      const currentUser = await getCurrentUser();
      if (!currentUser?.id && shouldUpload) {
        console.error('❌ No authenticated user found');
        Alert.alert('Error', 'Please log in to upload videos');
        return;
      }
      
      const endedSession = await SessionStorage.endSession();
      
              if (shouldUpload && endedSession) {
        if (isConnected) {
          // Real S3 batch upload
          Alert.alert(
            'Uploading to Cloud...',
            'Your session videos are being uploaded to AWS S3.',
            [
              {
                text: 'Upload in Background',
                onPress: async () => {
                  // Start batch upload process
                  const videosToUpload = sessionVideos.filter(v => v.uploadStatus !== 'uploaded');
                  
                  if (videosToUpload.length > 0) {
                    console.log(`📤 Starting batch upload of ${videosToUpload.length} videos`);
                    
                    // Get coach's organization_id
                    const { data: coachData } = await supabase
                      .from('coaches')
                      .select('organization_id')
                      .eq('id', currentUser!.id)
                      .single();
                    
                    const organizationId = coachData?.organization_id;
                    if (!organizationId) {
                      console.error('❌ Coach organization_id not found');
                      Alert.alert('Error', 'Unable to upload videos. Coach profile is incomplete.');
                      return;
                    }
                    
                    // Upload videos in background
                    videoUploadService.uploadSessionVideos(
                      videosToUpload,
                      endedSession.id,
                      currentUser!.id, // Use actual authenticated user ID
                      organizationId, // Add organization_id
                      (overallProgress, currentVideo, totalVideos) => {
                        console.log(`📊 Overall progress: ${overallProgress}% (${currentVideo}/${totalVideos})`);
                      }
                    ).then((results) => {
                      console.log(`✅ Batch upload completed: ${results.successful} successful, ${results.failed} failed`);
                      
                      if (results.successful > 0) {
                        SessionStorage.markSessionAsUploaded(endedSession.id);
                      }
                      
                      if (results.failed > 0) {
                        console.error(`❌ Some uploads failed:`, results.errors);
                      }
                    }).catch((error) => {
                      console.error('❌ Batch upload failed:', error);
                    });
                  }
                  
                  // Navigate immediately (uploads continue in background)
                  navigation.navigate('SessionSummary', {
                    environment,
                    environmentName,
                    students,
                    videos: sessionVideos,
                    duration: getSessionDuration(),
                  });
                },
              },
            ]
          );
        } else {
          Alert.alert(
            'No Internet Connection',
            'Videos will be uploaded automatically when you\'re connected to WiFi.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Queue videos for upload when connection is restored
                  navigation.navigate('SessionSummary', {
                    environment,
                    environmentName,
                    students,
                    videos: sessionVideos,
                    duration: getSessionDuration(),
                  });
                },
              },
            ]
          );
        }
      } else {
        navigation.navigate('SessionSummary', {
          environment,
          environmentName,
          students,
          videos: sessionVideos,
          duration: getSessionDuration(),
        });
      }
    } catch (error) {
      console.error('Error ending session:', error);
      Alert.alert('Error', 'Failed to end session. Please try again.');
    }
  };

  const handleVideoPress = (videoId: string) => {
    handleEditVideo(videoId);
  };

  const handleVideoContextMenu = (videoId: string) => {
    setSelectedVideoId(videoId);
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Edit Video', 'Share Video', 'Save to Camera Roll'],
          cancelButtonIndex: 0,
          title: 'Video Options',
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleEditVideo(videoId);
          } else if (buttonIndex === 2) {
            handleShareVideo(videoId);
          } else if (buttonIndex === 3) {
            handleSaveVideo(videoId);
          }
          setSelectedVideoId(null);
        }
      );
    } else {
      setShowContextMenu(true);
    }
  };

  const handleEditVideo = (videoId: string) => {
    const video = sessionVideos.find(v => v.id === videoId);
    if (video && video.uri && video.duration !== undefined) {
      navigation.navigate('SessionVideoReview', {
        videoUri: video.uri,
        videoDuration: video.duration,
        sessionStudents: students,
        environment: environment,
        environmentName: environmentName,
        editingVideoId: videoId,
      });
    }
    setShowContextMenu(false);
  };

  const handleShareVideo = async (videoId: string) => {
    try {
      const video = sessionVideos.find(v => v.id === videoId);
      if (video && video.uri) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(video.uri, {
            mimeType: 'video/mp4',
            dialogTitle: 'Share Video',
          });
        } else {
          Alert.alert('Sharing not available', 'Sharing is not available on this device');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share video');
      console.error('Share error:', error);
    }
    setShowContextMenu(false);
  };

  const handleSaveVideo = async (videoId: string) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Media library permission is required to save videos');
        return;
      }

      const video = sessionVideos.find(v => v.id === videoId);
      if (video && video.uri) {
        await MediaLibrary.saveToLibraryAsync(video.uri);
        Alert.alert('Success', 'Video saved to camera roll');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save video');
      console.error('Save error:', error);
    }
    setShowContextMenu(false);
  };

  const UploadDialog = () => (
    <Modal
      visible={showUploadDialog}
      transparent
      animationType="slide"
      onRequestClose={() => setShowUploadDialog(false)}
    >
      <View style={styles.uploadDialogOverlay}>
        <View style={styles.uploadDialogContainer}>
          <View style={styles.uploadDialogHeader}>
            <View style={styles.uploadDialogIcon}>
              {isConnected ? (
                <Wifi size={SIZES.icon.large} color={COLORS.success} />
              ) : (
                <WifiOff size={SIZES.icon.large} color={COLORS.warning} />
              )}
            </View>
            <Text style={styles.uploadDialogTitle}>End Session</Text>
            <Text style={styles.uploadDialogSubtitle}>
              {sessionVideos.length} video{sessionVideos.length !== 1 ? 's' : ''} recorded
            </Text>
          </View>
          
          <View style={styles.uploadDialogContent}>
            <Text style={styles.uploadDialogDescription}>
              {isConnected 
                ? 'You\'re connected to WiFi. Would you like to upload your videos now or save them for later?'
                : 'No internet connection. Videos will be saved locally and uploaded when you\'re connected to WiFi.'
              }
            </Text>
          </View>
          
          <View style={styles.uploadDialogButtons}>
            {isConnected ? (
              <>
                <TouchableOpacity
                  style={[styles.uploadDialogButton, styles.uploadDialogButtonSecondary]}
                  onPress={() => handleEndSessionWithUpload(false)}
                >
                  <Clock8 size={SIZES.icon.medium} color={COLORS.textSecondary} />
                  <Text style={styles.uploadDialogButtonTextSecondary}>Save for Later</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.uploadDialogButton, styles.uploadDialogButtonPrimary]}
                  onPress={() => handleEndSessionWithUpload(true)}
                >
                  <Upload size={SIZES.icon.medium} color={COLORS.textInverse} />
                  <Text style={styles.uploadDialogButtonTextPrimary}>Upload Now</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.uploadDialogButton, styles.uploadDialogButtonPrimary]}
                onPress={() => handleEndSessionWithUpload(false)}
              >
                <Text style={styles.uploadDialogButtonTextPrimary}>End Session</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );

  const ContextMenu = () => (
    <Modal
      visible={showContextMenu}
      transparent
      animationType="fade"
      onRequestClose={() => setShowContextMenu(false)}
    >
      <TouchableOpacity
        style={styles.contextMenuOverlay}
        activeOpacity={1}
        onPress={() => setShowContextMenu(false)}
      >
        <View style={styles.contextMenuContainer}>
          <TouchableOpacity
            style={styles.contextMenuItem}
            onPress={() => selectedVideoId && handleEditVideo(selectedVideoId)}
          >
            <Edit3 size={SIZES.icon.medium} color={COLORS.textPrimary} />
            <Text style={styles.contextMenuItemText}>Edit Video</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.contextMenuItem}
            onPress={() => selectedVideoId && handleShareVideo(selectedVideoId)}
          >
            <Share size={SIZES.icon.medium} color={COLORS.textPrimary} />
            <Text style={styles.contextMenuItemText}>Share Video</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.contextMenuItem}
            onPress={() => selectedVideoId && handleSaveVideo(selectedVideoId)}
          >
            <Download size={SIZES.icon.medium} color={COLORS.textPrimary} />
            <Text style={styles.contextMenuItemText}>Save to Camera Roll</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const VideoCard = ({ video }: { video: SessionVideo }) => (
    <TouchableOpacity 
      style={styles.videoCard}
      onPress={() => handleVideoPress(video.id)}
    >
      <View style={styles.videoThumbnail}>
        <View style={styles.videoThumbnailContent}>
          <Play size={SIZES.icon.large} color={COLORS.textInverse} />
          {video.duration && (
            <Text style={styles.videoDuration}>
              {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
            </Text>
          )}
        </View>
        <View style={styles.playOverlay}>
          <Play size={SIZES.icon.medium} color={COLORS.textInverse} />
        </View>
        
        {/* Upload Status Indicator */}
        <View style={styles.uploadStatusContainer}>
          {video.uploadStatus === 'uploading' && video.uploadProgress !== undefined && (
            <View style={styles.uploadProgress}>
              <CircularProgress
                progress={video.uploadProgress}
                size={24}
                strokeWidth={2}
                color={COLORS.success}
              />
              <Text style={styles.uploadPercentage}>
                {Math.round(video.uploadProgress)}%
              </Text>
            </View>
          )}
          {video.uploadStatus === 'uploaded' && (
            <View style={styles.uploadedTag}>
              <Check size={SIZES.icon.small} color={COLORS.textInverse} />
              <Text style={styles.uploadedText}>Uploaded</Text>
            </View>
          )}
          {video.uploadStatus === 'failed' && (
            <View style={styles.failedTag}>
              <X size={SIZES.icon.small} color={COLORS.textInverse} />
              <Text style={styles.failedText}>Failed</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.videoInfo}>
        <View style={styles.videoHeader}>
          <View style={styles.videoStudents}>
            {video.students.map((student, index) => (
              <Text key={student.id} style={styles.studentName}>
                {student.name.split(' ')[0]}
                {index < video.students.length - 1 && ', '}
              </Text>
            ))}
          </View>
          <Text style={styles.videoTime}>
            {video.timestamp.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        
        {video.trickName && (
          <Text style={styles.trickName}>{video.trickName}</Text>
        )}
        
        <View style={styles.videoFooter}>
          <View style={styles.videoStatus}>
            {video.landed ? (
              <CheckCircle size={SIZES.icon.small} color={COLORS.success} />
            ) : (
              <XCircle size={SIZES.icon.small} color={COLORS.warning} />
            )}
            <Text style={[
              styles.statusText,
              { color: video.landed ? COLORS.success : COLORS.warning }
            ]}>
              {video.landed ? 'Landed' : 'Trying'}
            </Text>
          </View>
          
          <View style={styles.videoActions}>
            {video.hasComment && (
              <View style={styles.actionIcon}>
                <MessageSquare size={SIZES.icon.small} color={COLORS.textSecondary} />
              </View>
            )}
            {video.hasVoiceNote && (
              <View style={styles.actionIcon}>
                <Mic size={SIZES.icon.small} color={COLORS.textSecondary} />
              </View>
            )}
            <TouchableOpacity 
              style={styles.actionIcon}
              onPress={(e) => {
                e.stopPropagation();
                handleVideoContextMenu(video.id);
              }}
            >
              <MoreHorizontal size={SIZES.icon.small} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={SIZES.icon.medium} color={COLORS.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {environmentName} Session 🛹
          </Text>
          <Text style={styles.headerSubtitle}>
            {getSessionDate()} • {getSessionTimeDisplay()}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.endButton} onPress={handleEndSession}>
          <Text style={styles.endButtonText}>End</Text>
        </TouchableOpacity>
      </View>

      {/* Session Info */}
      <View style={styles.sessionInfo}>
        <View style={styles.sessionStat}>
          <Users size={SIZES.icon.small} color={COLORS.primary} />
          <Text style={styles.sessionStatText}>{students.length} skaters</Text>
        </View>
        <View style={styles.sessionStat}>
          <Play size={SIZES.icon.small} color={COLORS.secondary} />
          <Text style={styles.sessionStatText}>{sessionVideos.length} clips</Text>
        </View>
        <View style={styles.sessionStat}>
          <Clock size={SIZES.icon.small} color={COLORS.badgeYellow} />
          <Text style={styles.sessionStatText}>{getSessionDuration()} min</Text>
        </View>
      </View>

      {/* Videos List */}
      <ScrollView 
        style={styles.videosList}
        contentContainerStyle={styles.videosContent}
        showsVerticalScrollIndicator={false}
      >
        {sessionVideos.length === 0 ? (
          <View style={styles.emptyState}>
            <Camera size={SIZES.icon.xlarge} color={COLORS.textTertiary} />
            <Text style={styles.emptyTitle}>Ready to film some tricks? 🎬</Text>
            <Text style={styles.emptySubtitle}>
              Hit that record button and start capturing epic moments!
            </Text>
          </View>
        ) : (
          <View style={styles.videosGrid}>
            {sessionVideos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Record Button */}
      <View style={styles.recordSection}>
        <TouchableOpacity
          style={styles.recordButton}
          onPress={handleRecordNewVideo}
        >
          <Camera size={SIZES.icon.large} color={COLORS.textInverse} />
          <Text style={styles.recordButtonText}>Capture the Magic 🎬</Text>
        </TouchableOpacity>
      </View>

      {/* Context Menu */}
      <ContextMenu />
      
      {/* Upload Dialog */}
      <UploadDialog />
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
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  endButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  endButtonText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textInverse,
  },
  sessionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  sessionStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionStatText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  videosList: {
    flex: 1,
  },
  videosContent: {
    padding: SPACING.screenPadding,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeights.body,
  },
  videosGrid: {
    gap: SPACING.md,
  },
  videoCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    ...SHADOWS.light,
  },
  videoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.md,
    position: 'relative',
    overflow: 'hidden',
  },
  videoThumbnailContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  videoDuration: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textInverse,
    marginTop: SPACING.xs,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadStatusContainer: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
  },
  uploadProgress: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  uploadPercentage: {
    position: 'absolute',
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textInverse,
  },
  uploadedTag: {
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  uploadedText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textInverse,
  },
  failedTag: {
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  failedText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textInverse,
  },
  videoInfo: {
    flex: 1,
  },
  videoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  videoStudents: {
    flexDirection: 'row',
    flex: 1,
  },
  studentName: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  videoTime: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
  },
  trickName: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  videoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginLeft: SPACING.xs,
  },
  videoActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    marginLeft: SPACING.md,
  },
  recordSection: {
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    ...SHADOWS.medium,
  },
  recordButtonText: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textInverse,
    marginLeft: SPACING.sm,
  },
  // Context Menu Styles
  contextMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contextMenuContainer: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    minWidth: 200,
    ...SHADOWS.heavy,
  },
  contextMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  contextMenuItemText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  // Upload Dialog Styles
  uploadDialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  uploadDialogContainer: {
    backgroundColor: COLORS.surfaceElevated,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingBottom: SPACING.xl,
  },
  uploadDialogHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  uploadDialogIcon: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  uploadDialogTitle: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  uploadDialogSubtitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
  },
  uploadDialogContent: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  uploadDialogDescription: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.lineHeights.body,
    textAlign: 'center',
  },
  uploadDialogButtons: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  uploadDialogButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  uploadDialogButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  uploadDialogButtonSecondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  uploadDialogButtonTextPrimary: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textInverse,
  },
  uploadDialogButtonTextSecondary: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
  },
});

export default SessionHomeScreen;
