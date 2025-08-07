import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { 
  Check, 
  X, 
  Users, 
  Type, 
  MessageSquare, 
  Mic,
  Save,
  Play,
  Upload
} from 'lucide-react-native';
import { RootStackParamList } from '../../../shared/types';
import BackButton from '../../../shared/components/BackButton';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';
import { supabase } from '../../../shared/lib/supabase';
import { videoUploadService } from '../../../shared/services/videoUploadService';
import * as VideoThumbnails from 'expo-video-thumbnails';

type QuickVideoReviewNavigationProp = NativeStackNavigationProp<RootStackParamList, 'QuickVideoReview'>;

interface Student {
  id: string;
  name: string;
  full_name: string | null;
  skill_level: string | null;
  xp_points: number;
}

interface CoachProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  organization_id: string;
}

interface StudentChipProps {
  student: Student;
  isSelected: boolean;
  onPress: () => void;
}

interface TrickChipProps {
  trick: string;
  isSelected: boolean;
  onPress: () => void;
}

// Helper function to convert local Student to shared Student type
const convertToSharedStudent = (student: Student): import('../../../shared/types').Student => {
  return {
    id: student.id,
    name: student.full_name || student.name,
    level: (student.skill_level as 'Beginner' | 'Intermediate' | 'Advanced') || 'Beginner',
    age: 16, // Default age since it's not available in this context
    xp: student.xp_points || 0,
    badgeLevel: 'Bronze', // Default badge level
    goals: [], // Default empty goals
  };
};

const TRICK_NAMES = [
  'Ollie',
  'Kickflip',
  'Heelflip',
  'Pop Shuvit',
  'Frontside 180',
  'Backside 180',
  'Tre Flip',
  'Varial Flip',
  'Hardflip',
  'Inward Heelflip',
  'Custom',
];

const LOCATION_OPTIONS = [
  'Mini Ramp',
  'Park',
  'Street',
  'Vert',
];

const QuickVideoReviewScreen: React.FC = () => {
  const navigation = useNavigation<QuickVideoReviewNavigationProp>();
  const route = useRoute();
  const { videoUri, videoDuration } = route.params as {
    videoUri: string;
    videoDuration: number;
  };

  const [user, setUser] = useState<any>(null);
  const [coachProfile, setCoachProfile] = useState<CoachProfile | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [selectedTrick, setSelectedTrick] = useState<string>('');
  const [customTrick, setCustomTrick] = useState<string>('');
  const [landed, setLanded] = useState<boolean | null>(null);
  const [comment, setComment] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [uploadLater, setUploadLater] = useState<boolean>(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);
  const [hasVoiceNote, setHasVoiceNote] = useState<boolean>(false);

  useEffect(() => {
    loadStudentsData();
  }, []);

  const loadStudentsData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.log('No user found or error:', userError);
        navigation.navigate('Login');
        return;
      }

      setUser(user);

      // Load coach profile with organization_id
      const { data: coachData, error: coachError } = await supabase
        .from('coaches')
        .select('id, full_name, email, organization_id')
        .eq('id', user.id)
        .single();

      if (coachError) {
        console.error('Error loading coach profile:', coachError);
        Alert.alert('Error', `Failed to load coach profile: ${coachError.message}`);
        return;
      }

      if (!coachData) {
        console.error('No coach profile found');
        Alert.alert('Error', 'Coach profile not found. Please contact support.');
        return;
      }

      console.log('Coach profile loaded:', coachData);
      setCoachProfile(coachData);

      // Load students for this coach
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, name, full_name, skill_level, xp_points')
        .eq('coach_id', user.id)
        .eq('is_active', true)
        .order('full_name', { ascending: true });

      if (studentsError) {
        console.error('Error loading students:', studentsError);
        setStudents([]);
      } else {
        setStudents(studentsData || []);
      }

    } catch (error: any) {
      console.error('Error loading students data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentToggle = (student: Student) => {
    const isSelected = selectedStudents.some(s => s.id === student.id);
    if (isSelected) {
      setSelectedStudents(prev => prev.filter(s => s.id !== student.id));
    } else {
      setSelectedStudents(prev => [...prev, student]);
    }
  };

  const handleTrickSelect = (trick: string) => {
    setSelectedTrick(trick);
    if (trick !== 'Custom') {
      setCustomTrick('');
    }
  };

  const handleVoiceRecording = () => {
    if (isRecordingVoice) {
      setIsRecordingVoice(false);
      setHasVoiceNote(true);
    } else {
      setIsRecordingVoice(true);
    }
  };

  const generateThumbnailForPending = async (videoUri: string): Promise<string | null> => {
    try {
      console.log('🖼️ Generating thumbnail for pending video:', videoUri);
      
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
  };

  const saveVideoToDatabase = async (
    videoUrl: string,
    s3Key: string,
    studentIds: string[],
    trickName: string,
    landed: boolean | null,
    comment: string,
    hasVoiceNote: boolean
  ) => {
    try {
      console.log('💾 Saving video metadata to database...');
      
      // Create video record in database
      const videoData = {
        uri: videoUrl, // For backwards compatibility
        s3_url: videoUrl,
        s3_key: s3Key,
        coach_id: user?.id,
        organization_id: coachProfile?.organization_id,
        student_ids: studentIds,
        trick_name: trickName,
        landed: landed,
        comment: comment,
        has_voice_note: hasVoiceNote,
        duration: videoDuration,
        upload_status: 'uploaded'
      };

      // Save to videos table
      const { data, error } = await supabase
        .from('videos')
        .insert([videoData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error saving video to database:', error);
        throw error;
      }

      console.log('✅ Video metadata saved to database successfully');
      return data;
    } catch (error) {
      console.error('❌ Failed to save video metadata:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (selectedStudents.length === 0) {
      Alert.alert('Students Required', 'Please select at least one student');
      return;
    }

    if (!coachProfile?.organization_id) {
      console.error('Coach organization_id missing:', coachProfile);
      Alert.alert(
        'Setup Required', 
        'Your coach profile needs to be associated with an organization. Please contact your administrator to complete your profile setup.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const finalTrick = selectedTrick === 'Custom' ? customTrick : selectedTrick;

      console.log('🎬 Starting video save process...');

      if (uploadLater) {
        // Save for later upload - create database record with pending status
        console.log('📱 Saving video for later upload...');
        
        // Generate thumbnail for pending video
        setUploadProgress(10);
        const thumbnailUri = await generateThumbnailForPending(videoUri);
        setUploadProgress(30);
        
        const videoData = {
          uri: videoUri,
          s3_url: '', // Empty for pending uploads
          s3_key: '', // Empty for pending uploads
          thumbnail_url: thumbnailUri, // Store local thumbnail URI
          coach_id: user?.id,
          organization_id: coachProfile?.organization_id,
          student_ids: selectedStudents.map(s => s.id),
          trick_name: finalTrick,
          landed: landed,
          comment: comment,
          has_voice_note: hasVoiceNote,
          location: selectedLocation || null,
          duration: videoDuration,
          upload_status: 'pending'
        };

        setUploadProgress(60);
        const { data, error } = await supabase
          .from('videos')
          .insert([videoData])
          .select()
          .single();

        if (error) {
          throw new Error('Failed to save video for later upload');
        }

        setUploadProgress(100);
        console.log('✅ Video saved for later upload with thumbnail');

        Alert.alert(
          'Video Saved! 📱',
          `Video saved locally for ${selectedStudents.map(s => s.full_name || s.name).join(', ')}. It will be uploaded when WiFi is available.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('CoachHome'),
            },
          ]
        );

      } else {
        // Upload immediately
        console.log('☁️ Uploading video to S3 with thumbnail generation...');
        const uploadResult = await videoUploadService.uploadVideo({
          videoUri: videoUri,
          sessionId: 'quick-session', // Use a consistent session ID for quick videos
          coachId: coachProfile.id,
          organizationId: coachProfile.organization_id, // Add organization_id
          students: selectedStudents.map(convertToSharedStudent),
          trickName: finalTrick,
          landed: landed ?? false, // Convert null to false
          comment: comment,
          hasVoiceNote: hasVoiceNote,
          location: selectedLocation || undefined,
          duration: 0, // Duration not available in quick review
          onProgress: (progress: number) => {
            setUploadProgress(progress);
          },
        });

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Failed to upload video');
        }

        console.log('✅ Video uploaded to S3 successfully with thumbnail');
        console.log('📸 Thumbnail URL:', uploadResult.thumbnailUrl);

        console.log('✅ Video save process completed successfully');

        Alert.alert(
          'Video Uploaded! 🎉',
          `Video uploaded and saved for ${selectedStudents.map(s => s.full_name || s.name).join(', ')}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('CoachHome'),
            },
          ]
        );
      }

    } catch (error: any) {
      console.error('❌ Error saving video:', error);
      Alert.alert(
        uploadLater ? 'Save Failed' : 'Upload Failed',
        `Failed to ${uploadLater ? 'save' : 'upload'} video: ${error.message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const StudentChip: React.FC<StudentChipProps> = ({ student, isSelected, onPress }) => (
    <TouchableOpacity
      style={[
        styles.studentChip,
        isSelected && styles.studentChipSelected
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.studentChipText,
        isSelected && styles.studentChipTextSelected
      ]}>
        {student.full_name || student.name}
      </Text>
      {isSelected && (
        <Check size={SIZES.icon.small} color={COLORS.textInverse} />
      )}
    </TouchableOpacity>
  );

  const TrickChip: React.FC<TrickChipProps> = ({ trick, isSelected, onPress }) => (
    <TouchableOpacity
      style={[
        styles.trickChip,
        isSelected && styles.trickChipSelected
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.trickChipText,
        isSelected && styles.trickChipTextSelected
      ]}>
        {trick}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading students...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          variant="minimal"
          title=""
          iconSize={SIZES.icon.medium}
          iconColor={COLORS.textPrimary}
        />
        <Text style={styles.headerTitle}>Review Video</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Video Preview */}
        <View style={styles.videoPreview}>
          <View style={styles.videoThumbnail}>
            <Play size={SIZES.icon.xlarge} color={COLORS.textInverse} />
          </View>
          <Text style={styles.videoDuration}>
            {Math.floor(videoDuration / 60)}:{(videoDuration % 60).toString().padStart(2, '0')}
          </Text>
        </View>

        {/* Upload Progress */}
        {uploading && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Upload size={SIZES.icon.medium} color={COLORS.accentBlue} />
              <Text style={styles.progressTitle}>Uploading Video...</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${uploadProgress}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{uploadProgress}%</Text>
          </View>
        )}

        {/* Student Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={SIZES.icon.medium} color={COLORS.accentBlue} />
            <Text style={styles.sectionTitle}>Select Students</Text>
          </View>
          <View style={styles.studentsContainer}>
            {students.length === 0 ? (
              <Text style={styles.noStudentsText}>No students found</Text>
            ) : (
              students.map(student => (
                <StudentChip
                  key={student.id}
                  student={student}
                  isSelected={selectedStudents.some(s => s.id === student.id)}
                  onPress={() => handleStudentToggle(student)}
                />
              ))
            )}
          </View>
        </View>

        {/* Trick Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Type size={SIZES.icon.medium} color={COLORS.accentBlue} />
            <Text style={styles.sectionTitle}>Trick Name</Text>
          </View>
          <View style={styles.tricksContainer}>
            {TRICK_NAMES.map(trick => (
              <TrickChip
                key={trick}
                trick={trick}
                isSelected={selectedTrick === trick}
                onPress={() => handleTrickSelect(trick)}
              />
            ))}
          </View>
          {selectedTrick === 'Custom' && (
            <TextInput
              style={styles.customTrickInput}
              placeholder="Enter custom trick name"
              value={customTrick}
              onChangeText={setCustomTrick}
              autoFocus
            />
          )}
        </View>

        {/* Location Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Location</Text>
          </View>
          <View style={styles.locationsContainer}>
            {LOCATION_OPTIONS.map(location => (
              <TouchableOpacity
                key={location}
                style={[
                  styles.locationChip,
                  selectedLocation === location.toLowerCase() && styles.locationChipSelected
                ]}
                onPress={() => setSelectedLocation(location.toLowerCase())}
              >
                <Text style={[
                  styles.locationChipText,
                  selectedLocation === location.toLowerCase() && styles.locationChipTextSelected
                ]}>
                  {location}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Landed Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Did they land it?</Text>
          <View style={styles.landedButtons}>
            <TouchableOpacity
              style={[
                styles.landedButton,
                styles.landedButtonNo,
                landed === false && styles.landedButtonSelected
              ]}
              onPress={() => setLanded(false)}
            >
              <X size={SIZES.icon.medium} color={landed === false ? COLORS.textInverse : COLORS.warning} />
              <Text style={[
                styles.landedButtonText,
                landed === false && styles.landedButtonTextSelected
              ]}>
                Trying
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.landedButton,
                styles.landedButtonYes,
                landed === true && styles.landedButtonSelected
              ]}
              onPress={() => setLanded(true)}
            >
              <Check size={SIZES.icon.medium} color={landed === true ? COLORS.textInverse : COLORS.success} />
              <Text style={[
                styles.landedButtonText,
                landed === true && styles.landedButtonTextSelected
              ]}>
                Landed
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Comment */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MessageSquare size={SIZES.icon.medium} color={COLORS.accentBlue} />
            <Text style={styles.sectionTitle}>Add Comment</Text>
          </View>
          <TextInput
            style={styles.commentInput}
            placeholder="Add notes about this attempt..."
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={200}
          />
          <View style={styles.voiceNoteContainer}>
            <TouchableOpacity
              style={[
                styles.voiceButton,
                isRecordingVoice && styles.voiceButtonRecording
              ]}
              onPress={handleVoiceRecording}
            >
              <Mic size={SIZES.icon.medium} color={isRecordingVoice ? COLORS.textInverse : COLORS.textSecondary} />
              <Text style={[
                styles.voiceButtonText,
                isRecordingVoice && styles.voiceButtonTextRecording
              ]}>
                {isRecordingVoice ? 'Stop Recording' : hasVoiceNote ? 'Voice Note Added' : 'Add Voice Note'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upload Later Option */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.uploadLaterContainer,
              uploadLater && styles.uploadLaterSelected
            ]}
            onPress={() => setUploadLater(!uploadLater)}
          >
            <View style={[
              styles.uploadLaterCheckbox,
              uploadLater && styles.uploadLaterCheckboxSelected
            ]}>
              {uploadLater && (
                <Check size={SIZES.icon.small} color={COLORS.textInverse} />
              )}
            </View>
            <View style={styles.uploadLaterTextContainer}>
              <Text style={styles.uploadLaterTitle}>Upload Later</Text>
              <Text style={styles.uploadLaterSubtitle}>Save video and upload when WiFi is available</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveSection}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (selectedStudents.length === 0 || uploading) && styles.saveButtonDisabled
          ]}
          onPress={handleSave}
          disabled={selectedStudents.length === 0 || uploading}
        >
          {uploading ? (
            <Upload size={SIZES.icon.medium} color={COLORS.textInverse} />
          ) : (
            <Save size={SIZES.icon.medium} color={COLORS.textInverse} />
          )}
          <Text style={styles.saveButtonText}>
            {uploading 
              ? (uploadLater ? 'Saving...' : 'Uploading...') 
              : (uploadLater ? 'Save for Later' : 'Upload Video')
            }
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.black,
  },
  headerTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.h2,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.families.archivoBold,
  },
  headerSpacer: {
    width: 44,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  videoPreview: {
    backgroundColor: COLORS.textPrimary,
    height: 200,
    margin: SPACING.screenPadding,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...SHADOWS.brutalist,
  },
  videoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDuration: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.overlay,
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  section: {
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.screenPadding,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
    marginBottom: SPACING.sm,
    fontFamily: TYPOGRAPHY.families.poppins,
  },
  studentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  noStudentsText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  studentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.black,
    ...SHADOWS.brutalist,
  },
  studentChipSelected: {
    backgroundColor: COLORS.black,
  },
  studentChipText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  studentChipTextSelected: {
    color: COLORS.textInverse,
    marginRight: SPACING.xs,
  },
  tricksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  trickChip: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.black,
    ...SHADOWS.brutalist,
  },
  trickChipSelected: {
    backgroundColor: COLORS.black,
  },
  trickChipText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  trickChipTextSelected: {
    color: COLORS.textInverse,
  },
  locationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  locationChip: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.black,
    ...SHADOWS.brutalist,
  },
  locationChipSelected: {
    backgroundColor: COLORS.black,
  },
  locationChipText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  locationChipTextSelected: {
    color: COLORS.textInverse,
  },
  customTrickInput: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
    borderWidth: 2,
    borderColor: COLORS.black,
    //marginTop: SPACING.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    ...SHADOWS.brutalist,
  },
  landedButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  landedButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.black,
    ...SHADOWS.brutalist,
  },
  landedButtonNo: {
    borderColor: COLORS.warning,
  },
  landedButtonYes: {
    borderColor: COLORS.secondary,
  },
  landedButtonSelected: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  landedButtonText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  landedButtonTextSelected: {
    color: COLORS.textInverse,
  },
  commentInput: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
    borderWidth: 2,
    borderColor: COLORS.black,
    minHeight: 80,
    textAlignVertical: 'top',
    fontWeight: TYPOGRAPHY.weights.medium,
    ...SHADOWS.brutalist,
  },
  voiceNoteContainer: {
    marginTop: SPACING.md,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.black,
    ...SHADOWS.brutalist,
  },
  voiceButtonRecording: {
    backgroundColor: COLORS.accentPink,
    borderColor: COLORS.accentPink,
  },
  voiceButtonText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  voiceButtonTextRecording: {
    color: COLORS.textInverse,
  },
  saveSection: {
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.background,
    borderTopWidth: 2,
    borderTopColor: COLORS.black,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.black,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    ...SHADOWS.brutalist,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.textTertiary,
    borderColor: COLORS.textTertiary,
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textInverse,
    marginLeft: SPACING.sm,
    fontFamily: TYPOGRAPHY.families.archivoBold,
  },
  progressSection: {
    marginHorizontal: SPACING.screenPadding,
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: SPACING.lg,
    ...SHADOWS.brutalist,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  progressTitle: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
    fontFamily: TYPOGRAPHY.families.poppins,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.accentBlue,
    borderRadius: BORDER_RADIUS.sm,
  },
  progressText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  uploadLaterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.black,
    ...SHADOWS.brutalist,
  },
  uploadLaterSelected: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.accentBlue,
  },
  uploadLaterCheckbox: {
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.black,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  uploadLaterCheckboxSelected: {
    backgroundColor: COLORS.accentBlue,
    borderColor: COLORS.accentBlue,
  },
  uploadLaterTextContainer: {
    flex: 1,
  },
  uploadLaterTitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  uploadLaterSubtitle: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});

export default QuickVideoReviewScreen;
