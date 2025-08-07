import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { 
  Search, 
  Filter, 
  Plus, 
  Users,
  ArrowLeft,
} from 'lucide-react-native';
import { RootStackParamList } from '../../../shared/types';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';
import Header from '../../../shared/components/Header';
import StudentCard, { StudentCardData } from '../../../shared/components/StudentCard';
import { BottomNavigation } from '../../../shared/components/BottomNavigation';
import { supabase } from '../../../shared/lib/supabase';

type StudentsListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StudentsListScreen'>;
type StudentsListScreenProps = NativeStackScreenProps<RootStackParamList, 'StudentsListScreen'>;

const StudentsListScreen: React.FC = () => {
  const navigation = useNavigation<StudentsListScreenNavigationProp>();
  const route = useRoute<StudentsListScreenProps['route']>();
  const { role = 'coach' } = route.params || {};
  
  const [searchText, setSearchText] = useState('');
  const [filterLevel, setFilterLevel] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All');
  const [students, setStudents] = useState<StudentCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string>('');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('No user found:', userError);
        return;
      }

      let studentsQuery = supabase
        .from('students')
        .select(`
          id,
          name,
          level,
          age,
          profile_image,
          xp_points,
          total_videos,
          landed_tricks,
          session_count,
          created_at,
          coach_id,
          organization_id
        `);

      // Filter based on role
      if (role === 'coach') {
        // Coach sees only their assigned students
        studentsQuery = studentsQuery.eq('coach_id', user.id);
      } else if (role === 'admin') {
        // Admin sees all students in their organization
        // First get the admin's organization
        const { data: adminData } = await supabase
          .from('admins')
          .select('organization_id')
          .eq('id', user.id)
          .single();
        
        if (adminData?.organization_id) {
          studentsQuery = studentsQuery.eq('organization_id', adminData.organization_id);
          setOrganizationId(adminData.organization_id);
        }
      } else if (role === 'parent') {
        // Parent sees only their children
        studentsQuery = studentsQuery.eq('parent_id', user.id);
      }

      const { data: studentsData, error: studentsError } = await studentsQuery
        .order('created_at', { ascending: false });

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        return;
      }

      // Get recent sessions for last session dates
      const studentIds = studentsData?.map(s => s.id) || [];
      let recentSessions: any[] = [];
      
      if (studentIds.length > 0) {
        const { data: sessionsData } = await supabase
          .from('session_students')
          .select(`
            student_id,
            sessions!inner(
              start_time,
              end_time
            )
          `)
          .in('student_id', studentIds)
          .order('sessions(start_time)', { ascending: false });
        
        recentSessions = sessionsData || [];
      }

      // Transform database data to StudentCardData format
      const transformedStudents: StudentCardData[] = studentsData?.map((student, index) => {
        // Find most recent session for this student
        const studentSessions = recentSessions.filter(s => s.student_id === student.id);
        const lastSession = studentSessions[0]?.sessions;
        
        // Generate badge level based on XP
        const getBadgeLevel = (xp: number) => {
          if (xp >= 2000) return 'Gold';
          if (xp >= 1000) return 'Silver';
          if (xp >= 500) return 'Bronze';
          return 'Rookie';
        };

        // Generate recent activity based on stats
        const getRecentActivity = (student: any) => {
          if (student.landed_tricks > 0) {
            const activities = [
              'Landed kickflip!',
              'Improved ollie height',
              'Practicing shuvit',
              'Great session today',
              'Working on balance'
            ];
            return activities[index % activities.length];
          }
          return 'Recent practice session';
        };

        return {
          id: student.id,
          name: student.name,
          age: student.age,
          level: student.level as 'Beginner' | 'Intermediate' | 'Advanced',
          profileImage: student.profile_image || undefined,
          xp: student.xp_points || 0,
          badgeLevel: getBadgeLevel(student.xp_points || 0),
          lastSessionDate: lastSession?.start_time ? new Date(lastSession.start_time) : undefined,
          recentActivity: getRecentActivity(student),
          status: 'Active' as const,
          coachName: role === 'admin' ? 'Coach Name' : undefined, // TODO: Fetch actual coach name for admin view
        };
      }) || [];

      setStudents(transformedStudents);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  const handleActionPress = (action: string, studentId: string) => {
    const student = students.find(s => s.id === studentId);
    const studentName = student?.name || 'Student';

    switch (action) {
      case 'assign_trick':
        Alert.alert('Assign Trick', `Assign a new trick to ${studentName}`);
        break;
      case 'upload_clip':
        Alert.alert('Upload Clip', `Upload a video clip for ${studentName}`);
        break;
      case 'add_note':
        Alert.alert('Add Note', `Add a coaching note for ${studentName}`);
        break;
      case 'view_progress':
        Alert.alert('View Progress', `View ${studentName}'s progress and stats`);
        break;
      case 'latest_clip':
        Alert.alert('Latest Clip', `View ${studentName}'s latest video clip`);
        break;
      case 'message_coach':
        Alert.alert('Message Coach', `Send a message to ${studentName}'s coach`);
        break;
      case 'edit_profile':
        Alert.alert('Edit Profile', `Edit ${studentName}'s profile information`);
        break;
      case 'assign_coach':
        Alert.alert('Assign Coach', `Assign a coach to ${studentName}`);
        break;
      case 'message_parent':
        Alert.alert('Message Parent', `Send a message to ${studentName}'s parent`);
        break;
      default:
        Alert.alert('Action', `${action} for ${studentName}`);
    }
  };

  const handleCardPress = (studentId: string) => {
    navigation.navigate('StudentDetails' as any, { studentId });
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesFilter = filterLevel === 'All' || student.level === filterLevel;
    return matchesSearch && matchesFilter;
  });

  const getFilterButtonStyle = (level: string) => [
    styles.filterButton,
    filterLevel === level && styles.filterButtonActive,
  ];

  const getFilterButtonTextStyle = (level: string) => [
    styles.filterButtonText,
    filterLevel === level && styles.filterButtonTextActive,
  ];

  const getRoleTitle = () => {
    switch (role) {
      case 'coach':
        return 'My Students';
      case 'admin':
        return 'All Students';
      case 'parent':
        return 'My Children';
      default:
        return 'Students';
    }
  };

  return (
    <View style={styles.fullScreenContainer}>
      <Header 
        title={getRoleTitle()}
        onBack={() => navigation.goBack()}
      />
      
      {/* Subtitle with student count */}
      <View style={styles.subtitleContainer}>
        <View style={styles.headerStats}>
          <Users size={SIZES.icon.small} color={COLORS.textSecondary} />
          <Text style={styles.statsText}>{filteredStudents.length} students</Text>
        </View>
      </View>

      <SafeAreaView style={styles.contentArea} edges={['bottom']}>
        {/* Students List */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            role === 'admin' && { paddingBottom: 100 } // Extra padding for bottom navigation
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Search and Filter */}
          <View style={styles.searchSectionInContent}>
            <View style={styles.searchContainer}>
              <Search size={SIZES.icon.medium} color={COLORS.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search students..."
                value={searchText}
                onChangeText={handleSearch}
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.filtersContainer}
              contentContainerStyle={styles.filtersContent}
            >
              {['All', 'Beginner', 'Intermediate', 'Advanced'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={getFilterButtonStyle(level)}
                  onPress={() => setFilterLevel(level as any)}
                >
                  <Text style={getFilterButtonTextStyle(level)}>{level}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading students...</Text>
            </View>
          ) : filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                role={role}
                onActionPress={handleActionPress}
                onCardPress={handleCardPress}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Users size={64} color={COLORS.textTertiary} />
              <Text style={styles.emptyTitle}>
                {students.length === 0 ? 'No students yet' : 'No students found'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {students.length === 0 
                  ? 'Students will appear here once they are assigned to you'
                  : searchText 
                    ? `No students match "${searchText}"`
                    : 'No students match the selected filter'
                }
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom Navigation for Admin */}
        {role === 'admin' && (
          <BottomNavigation 
            activeTab="Students" 
            userRole="admin" 
            organizationId={organizationId} 
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  subtitleContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.sm,
    //borderBottomWidth: 1,
    //borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statsText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  searchSection: {
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchSectionInContent: {
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.black,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
    ...SHADOWS.brutalist,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
    fontFamily: TYPOGRAPHY.families.archivo,
  },
  filtersContainer: {
    flexGrow: 0,
  },
  filtersContent: {
    paddingRight: SPACING.screenPadding,
    gap: SPACING.sm,
  },
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.eleveBlue,
    borderColor: COLORS.black,
    borderWidth: 2,
    ...SHADOWS.brutalist,
  },
  filterButtonText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
  },
  filterButtonTextActive: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    fontFamily: TYPOGRAPHY.families.poppinsBold,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});

export default StudentsListScreen; 