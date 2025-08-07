import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { 
  RotateCcw, 
  CheckCircle, 
  Star, 
  X, 
  ArrowLeft, 
  RotateCw, 
  ZoomIn, 
  ZoomOut,
  Users,
  Timer,
  Circle,
  Square
} from 'lucide-react-native';
import { RootStackParamList, Student } from '../../../shared/types';
import { mockStudents } from '../../../shared/mock/students';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';

type CameraScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Camera'>;

const CameraScreen: React.FC = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [zoom, setZoom] = useState(0);
  const [skillAssessmentStudent, setSkillAssessmentStudent] = useState<Student | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);
  const navigation = useNavigation<CameraScreenNavigationProp>();

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const newZoom = Math.min(Math.max((event.scale - 1) * 0.5, 0), 1);
      setZoom(newZoom);
    })
    .onEnd(() => {
      // Optional: Keep zoom level after pinch ends
    });

  React.useEffect(() => {
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, []);

  const startRecordingTimer = () => {
    setRecordingTime(0);
    recordingInterval.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecordingTimer = () => {
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleStudentSelection = (student: Student) => {
    if (skillAssessmentStudent) {
      setSkillAssessmentStudent(null);
      return;
    }
    
    setSkillAssessmentStudent(student);
    const isSelected = selectedStudents.some(s => s.id === student.id);
    if (!isSelected) {
      setSelectedStudents(prev => [...prev, student]);
    }
  };

  const handleSkillLevel = (level: string) => {
    if (skillAssessmentStudent) {
      console.log(`${skillAssessmentStudent.name} - ${level}`);
      setSkillAssessmentStudent(null);
    }
  };

  const exitSkillAssessment = () => {
    if (skillAssessmentStudent) {
      setSelectedStudents(prev => prev.filter(s => s.id !== skillAssessmentStudent.id));
      setSkillAssessmentStudent(null);
    }
  };

  const getFirstName = (name: string) => {
    return name.split(' ')[0] || '';
  };

  const adjustZoom = (delta: number) => {
    setZoom(prev => Math.min(Math.max(prev + delta, 0), 1));
  };

  if (!permission) {
    return <View style={styles.loadingContainer} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.textPrimary} />
        <View style={styles.permissionContainer}>
          <View style={styles.permissionCard}>
            <View style={styles.permissionIcon}>
              <Users size={SIZES.icon.xlarge} color={COLORS.primary} />
            </View>
            <Text style={styles.permissionTitle}>Camera Access Required</Text>
            <Text style={styles.permissionText}>
              To record videos of your students' progress, please grant camera access.
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const startRecording = async () => {
    if (!cameraRef.current) return;

    try {
      setRecording(true);
      startRecordingTimer();
      
      const video = await cameraRef.current.recordAsync({
        maxDuration: 60,
      });
      
      if (video && video.uri) {
        navigation.navigate('VideoReview', {
          videoUri: video.uri,
          videoDuration: recordingTime,
          preSelectedStudents: selectedStudents,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to record video');
      console.error('Recording error:', error);
    } finally {
      setRecording(false);
      stopRecordingTimer();
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && recording) {
      cameraRef.current.stopRecording();
    }
  };

  const SkillButton = ({ 
    icon: Icon, 
    color, 
    onPress, 
    size = SIZES.icon.large 
  }: {
    icon: React.ComponentType<{ size: number; color: string }>;
    color: string;
    onPress: () => void;
    size?: number;
  }) => (
    <TouchableOpacity
      style={[styles.skillButton, { backgroundColor: color }]}
      onPress={onPress}
    >
      <Icon size={size} color={COLORS.textInverse} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.textPrimary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={SIZES.icon.medium} color={COLORS.textInverse} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Record Session</Text>
          {selectedStudents.length > 0 && (
            <Text style={styles.headerSubtitle}>
              {selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''} selected
            </Text>
          )}
        </View>
        
        <TouchableOpacity style={styles.headerButton} onPress={toggleCameraFacing}>
          <RotateCw size={SIZES.icon.medium} color={COLORS.textInverse} />
        </TouchableOpacity>
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <GestureDetector gesture={pinchGesture}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
            mode="video"
            zoom={zoom}
          />
        </GestureDetector>
        
        {/* Recording Indicator */}
        {recording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>REC</Text>
            <View style={styles.recordingTime}>
              <Timer size={14} color={COLORS.textInverse} />
              <Text style={styles.recordingTimeText}>{formatTime(recordingTime)}</Text>
            </View>
          </View>
        )}

        {/* Selected Students Overlay */}
        {selectedStudents.length > 0 && (
          <View style={styles.selectedStudentsOverlay}>
            {selectedStudents.map((student, index) => (
              <View 
                key={student.id} 
                style={[
                  styles.studentBadge, 
                  { top: SPACING.lg + index * (SIZES.avatar.medium + SPACING.sm) }
                ]}
              >
                <Text style={styles.studentBadgeText}>{getFirstName(student.name)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Zoom Controls */}
        <View style={styles.zoomControls}>
          <TouchableOpacity 
            style={styles.zoomButton} 
            onPress={() => adjustZoom(-0.1)}
          >
            <ZoomOut size={SIZES.icon.small} color={COLORS.textInverse} />
          </TouchableOpacity>
          
          <View style={styles.zoomIndicator}>
            <Text style={styles.zoomText}>{Math.round(zoom * 10)}x</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.zoomButton} 
            onPress={() => adjustZoom(0.1)}
          >
            <ZoomIn size={SIZES.icon.small} color={COLORS.textInverse} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Student Selection and Controls */}
      <LinearGradient
        colors={[COLORS.overlayLight, COLORS.overlay]}
        style={styles.controlsOverlay}
      >
        {skillAssessmentStudent ? (
          <View style={styles.skillAssessmentContainer}>
            <View style={styles.skillAssessmentHeader}>
              <Text style={styles.skillAssessmentTitle}>
                Rate {getFirstName(skillAssessmentStudent.name)}'s attempt
              </Text>
              <TouchableOpacity 
                style={styles.skillExitButton}
                onPress={exitSkillAssessment}
              >
                <X size={SIZES.icon.medium} color={COLORS.textInverse} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.skillButtonsContainer}>
              <SkillButton
                icon={RotateCcw}
                color={COLORS.skillTrying}
                onPress={() => handleSkillLevel('trying')}
              />
              <SkillButton
                icon={CheckCircle}
                color={COLORS.skillLanded}
                onPress={() => handleSkillLevel('landed')}
              />
              <SkillButton
                icon={Star}
                color={COLORS.skillMastered}
                onPress={() => handleSkillLevel('mastered')}
              />
            </View>
          </View>
        ) : (
          <View style={styles.studentSelectionContainer}>
            <Text style={styles.studentSelectionTitle}>Select Students</Text>
            <ScrollView 
              horizontal 
              style={styles.studentsList}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.studentsListContent}
            >
              {mockStudents.map(student => {
                const isSelected = selectedStudents.some(s => s.id === student.id);
                return (
                  <TouchableOpacity
                    key={student.id}
                    style={[
                      styles.studentItem,
                      isSelected && styles.studentItemSelected
                    ]}
                    onPress={() => toggleStudentSelection(student)}
                  >
                    <Text style={[
                      styles.studentName,
                      isSelected && styles.studentNameSelected
                    ]}>
                      {getFirstName(student.name)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </LinearGradient>

      {/* Record Button */}
      <View style={styles.recordingControls}>
        <TouchableOpacity
          style={[styles.recordButton, recording && styles.recordButtonActive]}
          onPress={recording ? stopRecording : startRecording}
        >
          {recording ? (
            <Square size={SIZES.icon.medium} color={COLORS.textInverse} />
          ) : (
            <Circle size={SIZES.icon.large} color={COLORS.primary} />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.textPrimary,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.screenPadding,
  },
  permissionCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.heavy,
  },
  permissionIcon: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  permissionTitle: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeights.body,
    marginBottom: SPACING.xl,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    ...SHADOWS.medium,
  },
  permissionButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.overlay,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  headerSubtitle: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.sizes.caption,
    opacity: 0.8,
    marginTop: SPACING.xs,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  recordingIndicator: {
    position: 'absolute',
    top: SPACING.lg,
    left: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.overlay,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.sm,
  },
  recordingText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginRight: SPACING.sm,
  },
  recordingTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingTimeText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginLeft: SPACING.xs,
  },
  selectedStudentsOverlay: {
    position: 'absolute',
    right: SPACING.lg,
    top: SPACING.lg,
  },
  studentBadge: {
    position: 'absolute',
    right: 0,
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.round,
    width: SIZES.avatar.medium,
    height: SIZES.avatar.medium,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.textInverse,
    ...SHADOWS.medium,
  },
  studentBadgeText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  zoomControls: {
    position: 'absolute',
    bottom: SPACING.xl,
    left: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.overlay,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  zoomButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomIndicator: {
    marginHorizontal: SPACING.md,
  },
  zoomText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.medium,
    minWidth: 24,
    textAlign: 'center',
  },
  controlsOverlay: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  skillAssessmentContainer: {
    alignItems: 'center',
  },
  skillAssessmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  skillAssessmentTitle: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.semibold,
    flex: 1,
    textAlign: 'center',
  },
  skillExitButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
  },
  skillButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  skillButton: {
    width: SIZES.button.heightLarge,
    height: SIZES.button.heightLarge,
    borderRadius: BORDER_RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  studentSelectionContainer: {
    paddingBottom: SPACING.md,
  },
  studentSelectionTitle: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: SPACING.md,
  },
  studentsList: {
    maxHeight: 60,
  },
  studentsListContent: {
    paddingHorizontal: SPACING.sm,
  },
  studentItem: {
    alignItems: 'center',
    backgroundColor: COLORS.overlayLight,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.xs,
    minWidth: 70,
  },
  studentItemSelected: {
    backgroundColor: COLORS.secondary,
  },
  studentName: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.medium,
    textAlign: 'center',
  },
  studentNameSelected: {
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  recordingControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.overlay,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.textInverse,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.primary,
    ...SHADOWS.heavy,
  },
  recordButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.textInverse,
  },
});

export default CameraScreen; 