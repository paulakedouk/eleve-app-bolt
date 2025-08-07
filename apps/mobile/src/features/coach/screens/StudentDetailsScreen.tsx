import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Award,
  AlertTriangle,
  MoreVertical,
  Plus,
  Video,
  FileText,
  Activity,
} from 'lucide-react-native';
import { RootStackParamList } from '../../../shared/types';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';
import Header from '../../../shared/components/Header';
import { supabase } from '../../../shared/lib/supabase';

// Import components (we'll create these)
import StudentProgressOverview from '../components/StudentProgressOverview';
import StudentTricksGoals from '../components/StudentTricksGoals';
import StudentSessions from '../components/StudentSessions';
import StudentClips from '../components/StudentClips';
import StudentInjuryLogs from '../components/StudentInjuryLogs';
import StudentNotes from '../components/StudentNotes';

type StudentDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StudentDetails'>;

interface StudentDetailsScreenProps {}

interface StudentData {
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
}

// Mock student data (Alex - kept as example)
const mockStudentAlex: StudentData = {
  id: 'mock-alex',
  name: 'Alex Johnson',
  age: 14,
  level: 'Intermediate' as const,
  profileImage: 'https://eleve-native-app.s3.us-east-2.amazonaws.com/public/assets/images/eleve-avatar.svg',
  xp: 850,
  badgeLevel: 'Bronze',
  coachName: 'Elite Skating Coach',
  hasActiveInjury: true, // For demo purposes
  totalBadges: 5,
  activeTricks: 3,
  completedTricks: 8,
  totalSessions: 24,
  totalVideos: 15,
};

const StudentDetailsScreen: React.FC<StudentDetailsScreenProps> = () => {
  const navigation = useNavigation<StudentDetailsScreenNavigationProp>();
  const route = useRoute();
  const [activeTab, setActiveTab] = useState('progress');
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  // Get studentId from route params
  const { studentId } = (route.params as any) || {};

  const actionTabs = [
    { id: 'assign_trick', label: 'Assign Trick', icon: Activity },
    { id: 'upload_clip', label: 'Upload Clip', icon: Video },
    { id: 'add_note', label: 'Add Note', icon: FileText },
    { id: 'add_injury', label: 'Add Injury', icon: AlertTriangle },
  ];

  const contentTabs = [
    { id: 'progress', label: 'Progress', icon: Award },
    { id: 'tricks', label: 'Tricks', icon: Activity },
    { id: 'sessions', label: 'Sessions', icon: FileText },
    { id: 'clips', label: 'Clips', icon: Video },
    { id: 'injuries', label: 'Injuries', icon: AlertTriangle },
    { id: 'notes', label: 'Notes', icon: FileText },
  ];

  useEffect(() => {
    loadStudent();
  }, [studentId]);

  const loadStudent = async () => {
    try {
      setLoading(true);

      // If no studentId provided or it's the mock student, use mock data
      if (!studentId || studentId === 'mock-alex') {
        setStudent(mockStudentAlex);
        setLoading(false);
        return;
      }

      // Fetch student from database with related data
      const [studentResult, videosResult, sessionsResult] = await Promise.all([
        // 1. Fetch student basic data
        supabase
          .from('students')
          .select(`
            id,
            full_name,
            age,
            skill_level,
            profile_image,
            xp_points,
            organization_id,
            coach_id
          `)
          .eq('id', studentId)
          .single(),

        // 2. Count total videos for this student
        supabase
          .from('video_students')
          .select('video_id', { count: 'exact' })
          .eq('student_id', studentId),

        // 3. Count total sessions for this student
        supabase
          .from('session_students')
          .select('session_id', { count: 'exact' })
          .eq('student_id', studentId)
      ]);

      const { data: studentData, error: studentError } = studentResult;
      
      if (studentError) {
        console.error('Error fetching student:', studentError);
        Alert.alert('Error', 'Failed to load student details');
        navigation.goBack();
        return;
      }

      if (studentData) {
        // Now fetch the coach's full_name using the coach_id
        let coachName = 'No Coach Assigned';
        if (studentData.coach_id) {
          const { data: coachData } = await supabase
            .from('coaches')
            .select('full_name')
            .eq('id', studentData.coach_id)
            .single();
          
          coachName = coachData?.full_name || 'No Coach Assigned';
        }

        const totalVideos = videosResult.count || 0;
        const totalSessions = sessionsResult.count || 0;

        // Transform database data to StudentData format
        const transformedStudent: StudentData = {
          id: studentData.id,
          name: studentData.full_name,
          age: studentData.age || 0,
          level: studentData.skill_level as 'Beginner' | 'Intermediate' | 'Advanced',
          profileImage: studentData.profile_image || undefined,
          xp: studentData.xp_points || 0,
          badgeLevel: getBadgeLevel(studentData.xp_points || 0),
          coachName: coachName,
          hasActiveInjury: false, // TODO: Fetch from injury logs when table exists
          totalBadges: calculateBadges(studentData.xp_points || 0),
          activeTricks: 0, // TODO: Fetch from tricks/goals table when exists
          completedTricks: 0, // TODO: Fetch from completed tricks when exists
          totalSessions: totalSessions,
          totalVideos: totalVideos,
        };

        setStudent(transformedStudent);
      }
    } catch (error) {
      console.error('Error loading student:', error);
      Alert.alert('Error', 'Failed to load student details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const getBadgeLevel = (xp: number): string => {
    if (xp >= 2000) return 'Gold';
    if (xp >= 1000) return 'Silver';
    if (xp >= 500) return 'Bronze';
    return 'Rookie';
  };

  const calculateBadges = (xp: number): number => {
    return Math.floor(xp / 200); // 1 badge per 200 XP
  };

  const handleMenuPress = () => {
    Alert.alert(
      'Student Actions',
      'Choose an action',
      [
        { text: 'Open Injury Report Form', onPress: () => navigation.navigate('InjuryReportForm' as any) },
        { text: 'Edit Student Profile', onPress: () => Alert.alert('Edit Profile', 'Coming soon') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleFloatingAction = (action: string) => {
    if (!student) return;
    
    switch (action) {
      case 'assign_trick':
        Alert.alert('Assign Trick', `Assign a new trick to ${student.name}`);
        break;
      case 'upload_clip':
        Alert.alert('Upload Clip', `Upload a video clip for ${student.name}`);
        break;
      case 'add_note':
        Alert.alert('Add Note', `Add a coaching note for ${student.name}`);
        break;
      case 'add_injury':
        Alert.alert('Add Injury Log', `Add an injury log for ${student.name}`);
        break;
    }
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner':
        return { bg: '#FEF3C7', color: COLORS.warning };
      case 'Intermediate':
        return { bg: '#DBEAFE', color: COLORS.accentBlue };
      case 'Advanced':
        return { bg: '#D1FAE5', color: COLORS.success };
      default:
        return { bg: COLORS.surface, color: COLORS.textSecondary };
    }
  };

  const renderTabContent = () => {
    if (!student) return null;
    
    switch (activeTab) {
      case 'progress':
        return <StudentProgressOverview student={student} />;
      case 'tricks':
        return <StudentTricksGoals student={student} />;
      case 'sessions':
        return <StudentSessions student={student} />;
      case 'clips':
        return <StudentClips student={student} />;
      case 'injuries':
        return <StudentInjuryLogs student={student} />;
      case 'notes':
        return <StudentNotes student={student} />;
      default:
        return <StudentProgressOverview student={student} />;
    }
  };

  if (loading) {
    return (
      <View style={styles.fullScreenContainer}>
        <Header 
          title="Student Details"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading student details...</Text>
        </View>
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.fullScreenContainer}>
        <Header 
          title="Student Details"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Student not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const skillColor = getSkillLevelColor(student.level);

  return (
    <View style={styles.fullScreenContainer}>
      <Header 
        title="Student Details"
        onBack={() => navigation.goBack()}
        rightAction={{
          icon: MoreVertical,
          onPress: handleMenuPress,
          accessibilityLabel: 'Menu options',
        }}
      />

      <SafeAreaView style={styles.contentArea} edges={['bottom']}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Profile-Style Student Header */}
          <View style={styles.profileHeader}>
            {/* Circular Avatar */}
            <View style={styles.avatarContainer}>
              <Image 
                source={{ 
                  uri: student.profileImage || 'https://eleve-native-app.s3.us-east-2.amazonaws.com/public/assets/images/eleve-avatar.svg'
                }}
                style={styles.profileAvatar}
                defaultSource={{
                  uri: 'https://eleve-native-app.s3.us-east-2.amazonaws.com/public/assets/images/eleve-avatar.svg'
                }}
              />
              {student.hasActiveInjury && (
                <View style={styles.injuryBadge}>
                  <AlertTriangle size={16} color={COLORS.white} />
                </View>
              )}
            </View>
            
            {/* Student Name and Status */}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{student.name}</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.levelBadge, { backgroundColor: skillColor.bg }]}>
                  <Text style={[styles.levelBadgeText, { color: skillColor.color }]}>
                    {student.level}
                  </Text>
                </View>
                <Text style={styles.profileSubtitle}>• {student.age} years • {student.coachName}</Text>
              </View>
            </View>
            
            {/* Circular Stats */}
            <View style={styles.circularStats}>
              <View style={styles.circularStat}>
                <View style={styles.statCircle}>
                  <Award size={20} color={COLORS.warning} />
                  <Text style={styles.circularStatNumber}>{student.xp}</Text>
                </View>
                <Text style={styles.circularStatLabel}>XP</Text>
              </View>
              
              <View style={styles.circularStat}>
                <View style={styles.statCircle}>
                  <Activity size={20} color={COLORS.success} />
                  <Text style={styles.circularStatNumber}>{student.totalBadges}</Text>
                </View>
                <Text style={styles.circularStatLabel}>Badges</Text>
              </View>
              
              <View style={styles.circularStat}>
                <View style={styles.statCircle}>
                  <Video size={20} color={COLORS.accentBlue} />
                  <Text style={styles.circularStatNumber}>{student.totalSessions}</Text>
                </View>
                <Text style={styles.circularStatLabel}>Sessions</Text>
              </View>
            </View>
          </View>

      {/* Enhanced Action Cards */}
      {/* <View style={styles.actionCardsContainer}>
        <View style={styles.actionCardsRow}>
          <TouchableOpacity
            style={[styles.actionCard, styles.actionCardPrimary]}
            onPress={() => handleFloatingAction('add_injury')}
          >
            <View style={styles.actionCardIconContainer}>
              <AlertTriangle size={SIZES.icon.medium} color={COLORS.white} />
            </View>
            <Text style={styles.actionCardText}>Add Injury</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionCard, styles.actionCardSecondary]}
            onPress={() => handleFloatingAction('upload_clip')}
          >
            <View style={styles.actionCardIconContainer}>
              <Video size={SIZES.icon.medium} color={COLORS.white} />
            </View>
            <Text style={styles.actionCardText}>Upload Clip</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.actionCardsRow}>
          <TouchableOpacity
            style={[styles.actionCard, styles.actionCardTertiary]}
            onPress={() => handleFloatingAction('assign_trick')}
          >
            <View style={styles.actionCardIconContainer}>
              <Activity size={SIZES.icon.medium} color={COLORS.white} />
            </View>
            <Text style={styles.actionCardText}>Assign Trick</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionCard, styles.actionCardQuaternary]}
            onPress={() => handleFloatingAction('add_note')}
          >
            <View style={styles.actionCardIconContainer}>
              <FileText size={SIZES.icon.medium} color={COLORS.white} />
            </View>
            <Text style={styles.actionCardText}>Add Note</Text>
          </TouchableOpacity>
        </View>
      </View> */}

                {/* Enhanced Content Navigation */}
          <View style={styles.contentNavigationContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.contentNavigationContent}
            >
              {contentTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.contentNavTab, isActive && styles.contentNavTabActive]}
                    onPress={() => setActiveTab(tab.id)}
                  >
                    <Icon 
                      size={SIZES.icon.small} 
                      color={isActive ? COLORS.eleveBlue : COLORS.textSecondary} 
                    />
                    <Text style={[styles.contentNavTabText, isActive && styles.contentNavTabTextActive]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Tab Content */}
          <View style={styles.contentContainer}>
            {renderTabContent()}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
  },
  errorText: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  backButton: {
    backgroundColor: COLORS.eleveBlue,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.black,
    ...SHADOWS.brutalist,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },

  profileHeader: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: COLORS.black,
    ...SHADOWS.medium,
  },
  injuryBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  profileName: {
    fontSize: TYPOGRAPHY.sizes.h2,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.families.poppinsBold,
    marginBottom: SPACING.xs,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  levelBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.black,
  },
  levelBadgeText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  profileSubtitle: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  circularStats: {
    flexDirection: 'row',
    gap: SPACING.xl,
    justifyContent: 'center',
  },
  circularStat: {
    alignItems: 'center',
  },
  statCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    ...SHADOWS.light,
  },
  circularStatNumber: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  circularStatLabel: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },

  actionCardsContainer: {
    paddingHorizontal: SPACING.screenPadding,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  actionCardsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  actionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.black,
    gap: SPACING.sm,
    ...SHADOWS.brutalist,
  },
  actionCardPrimary: {
    backgroundColor: '#FF6B6B', // Red for injury
  },
  actionCardSecondary: {
    backgroundColor: COLORS.eleveBlue, // Blue for upload
  },
  actionCardTertiary: {
    backgroundColor: '#9C88FF', // Purple for assign trick
  },
  actionCardQuaternary: {
    backgroundColor: '#4ECDC4', // Teal for notes
  },
  actionCardIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCardText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
    flex: 1,
  },
  contentNavigationContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  contentNavigationContent: {
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  contentNavTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  contentNavTabActive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.eleveBlue,
    borderWidth: 2,
    ...SHADOWS.light,
  },
  contentNavTabText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
  },
  contentNavTabTextActive: {
    color: COLORS.eleveBlue,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  contentContainer: {
    flex: 1,
  },
});

export default StudentDetailsScreen; 