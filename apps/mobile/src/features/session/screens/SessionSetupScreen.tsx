import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { 
  ArrowLeft, 
  Check, 
  MapPin, 
  Users, 
  Play 
} from 'lucide-react-native';
import { RootStackParamList, Student } from '../../../shared/types';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';
import { mockCoachStudents } from '../../../shared/mock/coach-test-data';
import { SessionStorage } from '../../../shared/utils/sessionStorage';

type SessionSetupNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SessionSetup'>;

interface EnvironmentCardProps {
  environment: { id: string; name: string; icon?: string };
  isSelected: boolean;
  onPress: () => void;
}

interface StudentCardProps {
  student: Student;
  isSelected: boolean;
  onPress: () => void;
}

const ENVIRONMENTS = [
  { id: 'street', name: 'Street' },
  { id: 'bowl', name: 'Bowl' },
  { id: 'vert', name: 'Vert' },
  { id: 'other', name: 'Other' },
];

const SessionSetupScreen: React.FC = () => {
  const navigation = useNavigation<SessionSetupNavigationProp>();
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [isStarting, setIsStarting] = useState<boolean>(false);

  const handleEnvironmentSelect = (environmentId: string) => {
    setSelectedEnvironment(environmentId);
  };

  const handleStudentToggle = (student: Student) => {
    const isSelected = selectedStudents.some(s => s.id === student.id);
    if (isSelected) {
      setSelectedStudents(prev => prev.filter(s => s.id !== student.id));
    } else {
      setSelectedStudents(prev => [...prev, student]);
    }
  };

  const handleStartSession = async () => {
    if (!selectedEnvironment) {
      Alert.alert('Environment Required', 'Please select a session environment');
      return;
    }
    
    if (selectedStudents.length === 0) {
      Alert.alert('Students Required', 'Please select at least one student');
      return;
    }

    setIsStarting(true);
    
    try {
      const environmentName = ENVIRONMENTS.find(e => e.id === selectedEnvironment)?.name || 'Unknown';
      
      // Create session in storage
      const sessionId = await SessionStorage.createSession(
        selectedEnvironment,
        environmentName,
        selectedStudents
      );
      
      console.log('Session created:', sessionId);
      
      navigation.navigate('SessionHome', {
        environment: selectedEnvironment,
        environmentName: environmentName,
        students: selectedStudents,
      });
    } catch (error) {
      console.error('Error creating session:', error);
      Alert.alert('Error', 'Failed to create session. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  const EnvironmentCard = ({ environment, isSelected, onPress }: EnvironmentCardProps) => (
    <TouchableOpacity
      style={[
        styles.environmentCard,
        isSelected && styles.environmentCardSelected
      ]}
      onPress={onPress}
    >
      <View style={styles.environmentCardContent}>
        <View style={[
          styles.environmentIcon,
          isSelected && styles.environmentIconSelected
        ]}>
          <MapPin size={SIZES.icon.medium} color={isSelected ? COLORS.textInverse : COLORS.textSecondary} />
        </View>
        <Text style={[
          styles.environmentName,
          isSelected && styles.environmentNameSelected
        ]}>
          {environment.name}
        </Text>
      </View>
      {isSelected && (
        <Check size={SIZES.icon.medium} color={COLORS.textInverse} />
      )}
    </TouchableOpacity>
  );

  const StudentCard = ({ student, isSelected, onPress }: StudentCardProps) => (
    <TouchableOpacity
      style={[
        styles.studentCard,
        isSelected && styles.studentCardSelected
      ]}
      onPress={onPress}
    >
      <View style={[
        styles.studentAvatar,
        isSelected && styles.studentAvatarSelected
      ]}>
        <Text style={[
          styles.studentInitials,
          isSelected && styles.studentInitialsSelected
        ]}>
          {student.name.split(" ").map((n: string) => n[0]).join('')}
        </Text>
      </View>
      <Text style={[
        styles.studentName,
        isSelected && styles.studentNameSelected
      ]}>
        {student.name}
      </Text>
      {isSelected && (
        <View style={styles.studentCheckIcon}>
          <Check size={SIZES.icon.small} color={COLORS.primary} />
        </View>
      )}
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
        <Text style={styles.headerTitle}>Setup Session</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Environment Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={SIZES.icon.medium} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Choose Environment</Text>
          </View>
          <View style={styles.environmentsContainer}>
            {ENVIRONMENTS.map(environment => (
              <EnvironmentCard
                key={environment.id}
                environment={environment}
                isSelected={selectedEnvironment === environment.id}
                onPress={() => handleEnvironmentSelect(environment.id)}
              />
            ))}
          </View>
        </View>

        {/* Student Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={SIZES.icon.medium} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Add Students</Text>
          </View>
          <View style={styles.studentsGrid}>
            {mockCoachStudents.map((student: Student) => (
              <StudentCard
                key={student.id}
                student={student}
                isSelected={selectedStudents.some(s => s.id === student.id)}
                onPress={() => handleStudentToggle(student)}
              />
            ))}
          </View>
        </View>

        {/* Selected Summary */}
        {(selectedEnvironment || selectedStudents.length > 0) && (
          <View style={styles.section}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Session Summary</Text>
              {selectedEnvironment && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Environment:</Text>
                  <Text style={styles.summaryValue}>
                    {ENVIRONMENTS.find(e => e.id === selectedEnvironment)?.name}
                  </Text>
                </View>
              )}
              {selectedStudents.length > 0 && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Students:</Text>
                  <Text style={styles.summaryValue}>
                    {selectedStudents.length} selected
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Start Session Button */}
      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={[
            styles.startButton,
            (selectedEnvironment === '' || selectedStudents.length === 0 || isStarting) && styles.startButtonDisabled
          ]}
          onPress={handleStartSession}
          disabled={selectedEnvironment === '' || selectedStudents.length === 0 || isStarting}
        >
          <Text style={styles.startButtonText}>
            {isStarting ? 'Starting Session...' : 'Start Session'}
          </Text>
          <Play size={SIZES.icon.medium} color={COLORS.textInverse} />
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
  headerTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.screenPadding,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  environmentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 80,
  },
  environmentCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  environmentCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  environmentIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  environmentIconSelected: {
    backgroundColor: COLORS.textInverse,
  },
  environmentName: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  environmentNameSelected: {
    color: COLORS.textInverse,
  },
  studentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  studentCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  studentCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  studentAvatarSelected: {
    backgroundColor: COLORS.primary,
  },
  studentInitials: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  studentInitialsSelected: {
    color: COLORS.textInverse,
  },
  studentName: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  studentNameSelected: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  studentCheckIcon: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.light,
  },
  summaryTitle: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  bottomAction: {
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    ...SHADOWS.medium,
  },
  startButtonDisabled: {
    backgroundColor: COLORS.textTertiary,
  },
  startButtonText: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textInverse,
    marginRight: SPACING.sm,
  },
  startButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
  environmentsContainer: {
    flexDirection: 'column',
    gap: SPACING.md,
  },
  studentsSection: {
    marginBottom: SPACING.xl,
  },
});

export default SessionSetupScreen;
