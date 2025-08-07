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
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Video, ResizeMode } from 'expo-av';
import { 
  ArrowLeft, 
  Check, 
  X, 
  Users, 
  Type, 
  MessageSquare, 
  Mic,
  Save,
  Play,
  Pause,
  Maximize
} from 'lucide-react-native';
import { RootStackParamList, Student } from '../../../shared/types';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';
import { generateVideoId } from '../../../shared/utils/videoUtils';

type SessionVideoReviewNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SessionVideoReview'>;

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

const SessionVideoReviewScreen: React.FC = () => {
  const navigation = useNavigation<SessionVideoReviewNavigationProp>();
  const route = useRoute();
  const { 
    videoUri, 
    videoDuration, 
    sessionStudents, 
    environment, 
    environmentName,
    editingVideoId 
  } = route.params as {
    videoUri: string;
    videoDuration: number;
    sessionStudents: Student[];
    environment: string;
    environmentName: string;
    editingVideoId?: string;
  };

  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [selectedTrick, setSelectedTrick] = useState<string>('');
  const [customTrick, setCustomTrick] = useState<string>('');
  const [landed, setLanded] = useState<boolean | null>(null);
  const [comment, setComment] = useState<string>('');
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);
  const [hasVoiceNote, setHasVoiceNote] = useState<boolean>(false);
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);
  const [videoStatus, setVideoStatus] = useState<any>({});

  // Pre-fill form when editing
  useEffect(() => {
    if (editingVideoId) {
      // In a real app, you'd fetch the video data from your state management
      // For now, we'll simulate with the navigation params
      const editingVideo = {
        students: sessionStudents.slice(0, 1), // Placeholder for existing video data
        trickName: 'Ollie', // Placeholder
        landed: false, // Placeholder
        comment: '', // Placeholder
        hasVoiceNote: false, // Placeholder
      };
      
      // Pre-fill form with existing video data
      setSelectedStudents(editingVideo.students);
      setSelectedTrick(editingVideo.trickName || '');
      setLanded(editingVideo.landed);
      setComment(editingVideo.comment || '');
      setHasVoiceNote(editingVideo.hasVoiceNote);
    }
  }, [editingVideoId, sessionStudents]);

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

  const handlePlayVideo = () => {
    setShowVideoModal(true);
  };

  const handleSave = () => {
    if (selectedStudents.length === 0) {
      Alert.alert('Students Required', 'Please select at least one student');
      return;
    }

    const finalTrick = selectedTrick === 'Custom' ? customTrick : selectedTrick;
    
    const videoData = {
      id: editingVideoId || generateVideoId(),
      thumbnail: videoUri,
      students: selectedStudents,
      trickName: finalTrick,
      landed: landed || false,
      hasComment: comment.length > 0,
      hasVoiceNote: hasVoiceNote,
      timestamp: new Date(),
      uri: videoUri,
      duration: videoDuration,
      comment: comment,
      isEditing: !!editingVideoId,
    };

    console.log('Saving session video:', videoData);
    
    // Navigate back to session with the video data
    navigation.navigate('SessionHome', {
      environment,
      environmentName,
      students: sessionStudents,
      newVideo: videoData,
    });
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
        {student.name}
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
          <Text style={styles.headerTitle}>Tag Video</Text>
          <Text style={styles.headerSubtitle}>{environmentName} Session</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Video Preview */}
        <TouchableOpacity style={styles.videoPreview} onPress={handlePlayVideo}>
          <View style={styles.videoThumbnail}>
            <Play size={SIZES.icon.xlarge} color={COLORS.textInverse} />
          </View>
          <Text style={styles.videoDuration}>
            {Math.floor(videoDuration / 60)}:{(videoDuration % 60).toString().padStart(2, '0')}
          </Text>
          <View style={styles.playHint}>
            <Text style={styles.playHintText}>Tap to watch</Text>
          </View>
        </TouchableOpacity>

        {/* Student Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={SIZES.icon.medium} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Select Students</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Who was in this video?</Text>
          <View style={styles.studentsContainer}>
            {sessionStudents.map(student => (
              <StudentChip
                key={student.id}
                student={student}
                isSelected={selectedStudents.some(s => s.id === student.id)}
                onPress={() => handleStudentToggle(student)}
              />
            ))}
          </View>
        </View>

        {/* Trick Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Type size={SIZES.icon.medium} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Trick Name</Text>
          </View>
          <Text style={styles.sectionSubtitle}>What trick were they attempting?</Text>
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
            <MessageSquare size={SIZES.icon.medium} color={COLORS.primary} />
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
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveSection}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            selectedStudents.length === 0 && styles.saveButtonDisabled
          ]}
          onPress={handleSave}
          disabled={selectedStudents.length === 0}
        >
          <Save size={SIZES.icon.medium} color={COLORS.textInverse} />
          <Text style={styles.saveButtonText}>Add to Session</Text>
        </TouchableOpacity>
      </View>

      {/* Video Player Modal */}
      <Modal
        visible={showVideoModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.videoModalContainer}>
          <View style={styles.videoModalHeader}>
            <TouchableOpacity
              style={styles.videoModalClose}
              onPress={() => setShowVideoModal(false)}
            >
              <X size={SIZES.icon.large} color={COLORS.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.videoModalExpand}>
              <Maximize size={SIZES.icon.medium} color={COLORS.textInverse} />
            </TouchableOpacity>
          </View>
          
          <Video
            source={{ uri: videoUri }}
            style={styles.videoPlayer}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping={false}
            onPlaybackStatusUpdate={setVideoStatus}
            shouldPlay={true}
          />
          
          <View style={styles.videoModalFooter}>
            <Text style={styles.videoModalTitle}>Review Video</Text>
            <Text style={styles.videoModalSubtitle}>
              {Math.floor(videoDuration / 60)}:{(videoDuration % 60).toString().padStart(2, '0')} • {environmentName} Session
            </Text>
          </View>
        </View>
      </Modal>
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
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
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
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
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
    fontWeight: TYPOGRAPHY.weights.medium,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  playHint: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    backgroundColor: COLORS.overlay,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  playHintText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  section: {
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.screenPadding,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  studentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  studentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  studentChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  studentChipText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.medium,
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
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  trickChipSelected: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  trickChipText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  trickChipTextSelected: {
    color: COLORS.textInverse,
  },
  customTrickInput: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.md,
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
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  landedButtonNo: {
    borderColor: COLORS.warning,
  },
  landedButtonYes: {
    borderColor: COLORS.success,
  },
  landedButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  landedButtonText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  landedButtonTextSelected: {
    color: COLORS.textInverse,
  },
  commentInput: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  voiceNoteContainer: {
    marginTop: SPACING.md,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  voiceButtonRecording: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  voiceButtonText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.medium,
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
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    ...SHADOWS.medium,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.textTertiary,
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textInverse,
    marginLeft: SPACING.sm,
  },
  // Video Modal Styles
  videoModalContainer: {
    flex: 1,
    backgroundColor: COLORS.textPrimary,
  },
  videoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  videoModalClose: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoModalExpand: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayer: {
    flex: 1,
    width: '100%',
  },
  videoModalFooter: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.overlay,
  },
  videoModalTitle: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textInverse,
    marginBottom: SPACING.xs,
  },
  videoModalSubtitle: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textInverse,
    opacity: 0.8,
  },
});

export default SessionVideoReviewScreen;
