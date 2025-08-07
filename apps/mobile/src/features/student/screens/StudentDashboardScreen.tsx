import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { 
  Trophy, 
  Play, 
  TrendingUp, 
  Award, 
  Camera, 
  BarChart3,
  Target,
  Calendar,
  Star,
  Zap,
  ChevronRight,
  Settings,
  Bell,
  LogOut,
  Users
} from 'lucide-react-native';
import { RootStackParamList, Achievement } from '../../../shared/types';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';
import { supabase } from '../../../shared/lib/supabase';

interface Badge {
  id: string;
  name: string;
  xp_reward: number;
  earned_at?: string;
}

interface TrickProgress {
  id: string;
  trick_name: string;
  success_rate: number;
  landings: number;
  attempts: number;
}

interface StudentProfile {
  id: string;
  name: string;
  xp_points: number;
  total_videos: number;
  landed_tricks: number;
  session_count: number;
  badges: Badge[];
  achievements: Achievement[];
  trick_progress: TrickProgress[];
}

type StudentDashboardNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StudentDashboard'>;

const StudentDashboardScreen: React.FC = () => {
  const navigation = useNavigation<StudentDashboardNavigationProp>();
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [recentBadges, setRecentBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [videosCount, setVideosCount] = useState(0);

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadVideosCount = async (studentId: string, userId: string) => {
    try {
      console.log('🎥 Loading videos count for student:', studentId, 'user:', userId);
      
      // Count coach-recorded videos where this student is featured
      console.log('🔍 Counting videos for student ID:', studentId);
      console.log('🔍 Current user context:', userId);
      
      let coachVideosCount = 0;
      let coachVideosError = null;
      
      // Try overlaps first
      const { count: overlapsCount, error: overlapsError } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true })
        .overlaps('student_ids', [studentId]);
        
      console.log('📊 Overlaps count result:', { count: overlapsCount, error: overlapsError });
      
      if (!overlapsError && overlapsCount !== null) {
        coachVideosCount = overlapsCount;
        console.log('✅ Overlaps count successful:', coachVideosCount);
      } else {
        // Try contains as fallback
        const { count: containsCount, error: containsError } = await supabase
          .from('videos')
          .select('*', { count: 'exact', head: true })
          .contains('student_ids', [studentId]);
          
        console.log('📊 Contains count result:', { count: containsCount, error: containsError });
        
        if (!containsError && containsCount !== null) {
          coachVideosCount = containsCount;
          console.log('✅ Contains count successful:', coachVideosCount);
        } else {
          coachVideosError = containsError || overlapsError;
          console.log('❌ Both count queries failed');
        }
      }

      if (coachVideosError) {
        console.log('Error loading coach videos count:', coachVideosError);
      }

      // Skip personal videos count for now since table doesn't exist
      const personalVideosCount = 0;
      const personalVideosError = null;
      
      console.log('⚠️ Skipping personal videos count - table does not exist');

      const totalVideos = (coachVideosCount || 0) + (personalVideosCount || 0);
      setVideosCount(totalVideos);
      
      // Update student profile with the actual videos count
      setStudentProfile(prev => prev ? { ...prev, total_videos: totalVideos } : null);
      
      console.log(`📊 Student has ${coachVideosCount || 0} coach videos + ${personalVideosCount || 0} personal videos = ${totalVideos} total`);

    } catch (error) {
      console.log('Error fetching videos count:', error);
    }
  };

  const loadStudentData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Get student profile linked to this user
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (studentError) throw studentError;

      console.log('✅ Student data loaded successfully:', student);

      // Set student profile with mock data for badges and achievements
      setStudentProfile({
        ...student,
        badges: [], // Will be populated when tables are properly set up
        achievements: [], // Will be populated when tables are properly set up  
        trick_progress: [], // Will be populated when tables are properly set up
        total_videos: 0, // Will be updated after loading videos count
        landed_tricks: 15, // Mock data for now
        session_count: 8 // Mock data for now
      });

      // Mock recent badges for now
      const mockBadges: Badge[] = [
        { id: '1', name: 'First Ollie', xp_reward: 50, earned_at: new Date().toISOString() },
        { id: '2', name: 'Kickflip Master', xp_reward: 100, earned_at: new Date().toISOString() },
        { id: '3', name: 'Consistent Rider', xp_reward: 75, earned_at: new Date().toISOString() }
      ];
      setRecentBadges(mockBadges);

      // Load videos count (both coach-recorded videos featuring this student and personal videos)
      await loadVideosCount(student.id, user.id);

    } catch (error: any) {
      console.error('Error loading student data:', error);
      Alert.alert('Error', 'Failed to load your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getNextLevel = (xp: number) => {
    const levels = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000];
    const currentLevel = levels.findIndex(threshold => xp < threshold);
    return currentLevel === -1 ? levels.length : currentLevel;
  };

  const getXpForNextLevel = (xp: number) => {
    const levels = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000];
    const currentLevel = getNextLevel(xp);
    return currentLevel >= levels.length ? 0 : levels[currentLevel] - xp;
  };

  const getProgressToNextLevel = (xp: number) => {
    const levels = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000];
    const currentLevel = getNextLevel(xp);
    if (currentLevel >= levels.length) return 100;
    
    const currentLevelXp = currentLevel === 0 ? 0 : levels[currentLevel - 1];
    const nextLevelXp = levels[currentLevel];
    const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  const handleLogout = async () => {
    try {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              try {
                await supabase.auth.signOut();
                console.log('✅ Student logged out successfully');
                
                // Explicitly navigate to Login screen and reset navigation stack
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              } catch (error) {
                console.error('❌ Error during logout:', error);
                Alert.alert('Error', 'Failed to logout. Please try again.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error showing logout confirmation:', error);
    }
  };

  const StatCard = ({ 
    icon: Icon, 
    value, 
    label, 
    color = COLORS.primary,
    onPress 
  }: { 
    icon: any; 
    value: string | number; 
    label: string; 
    color?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity 
      style={styles.statCard} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
        <Icon size={SIZES.icon.medium} color={color} />
      </View>
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const ActionCard = ({ 
    icon: Icon, 
    title, 
    subtitle,
    color = COLORS.primary,
    onPress 
  }: { 
    icon: any; 
    title: string; 
    subtitle: string;
    color?: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <View style={[styles.actionIconContainer, { backgroundColor: color }]}>
        <Icon size={SIZES.icon.large} color={COLORS.white} />
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <ChevronRight size={SIZES.icon.medium} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  const BadgeItem = ({ badge }: { badge: Badge }) => (
    <View style={styles.badgeCard}>
      <View style={[styles.badgeIconContainer, { backgroundColor: `${COLORS.secondary}20` }]}>
        <Trophy size={SIZES.icon.medium} color={COLORS.secondary} />
      </View>
      <View style={styles.badgeContent}>
        <Text style={styles.badgeName}>{badge.name}</Text>
        <Text style={styles.badgeDate}>
          {new Date(badge.earned_at!).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.xpBadge}>
        <Text style={styles.xpBadgeText}>+{badge.xp_reward} XP</Text>
      </View>
    </View>
  );

  const TrickCard = ({ trick }: { trick: TrickProgress }) => (
    <View style={styles.trickCard}>
      <Text style={styles.trickName}>{trick.trick_name}</Text>
      <Text style={styles.trickRate}>{trick.success_rate}%</Text>
      <Text style={styles.trickAttempts}>
        {trick.landings}/{trick.attempts}
      </Text>
    </View>
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  };

  if (loading || !studentProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const level = getNextLevel(studentProfile.xp_points);
  const xpToNext = getXpForNextLevel(studentProfile.xp_points);
  const progress = getProgressToNextLevel(studentProfile.xp_points);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerContent}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.studentName}>{studentProfile.name.split(' ')[0]}</Text>
              <View style={styles.levelContainer}>
                <Zap size={SIZES.icon.small} color={COLORS.secondary} />
                <Text style={styles.levelText}>Level {level} • {studentProfile.xp_points} XP</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerButton}>
                <Bell size={SIZES.icon.medium} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton}>
                <Settings size={SIZES.icon.medium} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.headerButton, styles.logoutButton]} 
                onPress={handleLogout}
              >
                <LogOut size={SIZES.icon.medium} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* XP Progress Bar */}
          <View style={styles.xpProgressContainer}>
            <View style={styles.xpBar}>
              <View style={[styles.xpProgress, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.xpProgressText}>
              {xpToNext > 0 ? `${xpToNext} XP to next level` : 'Max level reached!'}
            </Text>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon={Play}
              value={studentProfile.total_videos}
              label="Total Videos"
              color={COLORS.primary}
              onPress={() => navigation.navigate('StudentVideos')}
            />
            <StatCard
              icon={Target}
              value={studentProfile.landed_tricks}
              label="Tricks Landed"
              color={COLORS.success}
              onPress={() => navigation.navigate('StudentTricks')}
            />
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              icon={Calendar}
              value={studentProfile.session_count}
              label="Sessions"
              color={COLORS.secondary}
            />
            <StatCard
              icon={TrendingUp}
              value={`${Math.round((studentProfile.landed_tricks / Math.max(studentProfile.total_videos, 1)) * 100)}%`}
              label="Success Rate"
              color={COLORS.warning}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            <ActionCard
              icon={Camera}
              title="Upload Video"
              subtitle="Share your latest trick attempts"
              color={COLORS.primary}
              onPress={() => navigation.navigate('VideoUpload')}
            />
            <ActionCard
              icon={BarChart3}
              title="View Progress"
              subtitle="Check your improvement over time"
              color={COLORS.success}
              onPress={() => navigation.navigate('StudentProgress')}
            />
          </View>
        </View>

        {/* Recent Badges */}
        {recentBadges.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Badges</Text>
              <TouchableOpacity onPress={() => navigation.navigate('StudentBadges')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.badgesContainer}>
              {recentBadges.map(badge => (
                <BadgeItem key={badge.id} badge={badge} />
              ))}
            </View>
          </View>
        )}

        {/* Trick Progress Summary */}
        {studentProfile.trick_progress.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trick Progress</Text>
              <TouchableOpacity onPress={() => navigation.navigate('StudentTricks')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.tricksContainer}>
                {studentProfile.trick_progress.slice(0, 5).map(trick => (
                  <TrickCard key={trick.id} trick={trick} />
                ))}
              </View>
            </ScrollView>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sizes.h4,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  header: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.black,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.brutalist,
  },
  logoutButton: {
    borderColor: COLORS.error,
  },
  greeting: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  studentName: {
    fontSize: TYPOGRAPHY.sizes.h1,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.families.archivoBold,
    marginBottom: SPACING.sm,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  levelText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  xpProgressContainer: {
    marginTop: SPACING.lg,
  },
  xpBar: {
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  xpProgress: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.sm,
  },
  xpProgressText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  section: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.screenPadding,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.h2,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    fontFamily: TYPOGRAPHY.families.archivoBold,
  },
  seeAllText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.brutalist,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statNumber: {
    fontSize: TYPOGRAPHY.sizes.h2,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    fontFamily: TYPOGRAPHY.families.poppinsBold,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  actionsContainer: {
    gap: SPACING.lg,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: SPACING.xl,
    ...SHADOWS.brutalist,
  },
  actionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    fontFamily: TYPOGRAPHY.families.archivoBold,
  },
  actionSubtitle: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.lineHeights.bodySmall,
  },
  badgesContainer: {
    gap: SPACING.md,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: SPACING.lg,
    ...SHADOWS.brutalist,
  },
  badgeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  badgeContent: {
    flex: 1,
  },
  badgeName: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.families.poppins,
  },
  badgeDate: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  xpBadge: {
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.black,
  },
  xpBadgeText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  tricksContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.screenPadding,
  },
  trickCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: SPACING.lg,
    alignItems: 'center',
    minWidth: 120,
    ...SHADOWS.brutalist,
  },
  trickName: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    fontFamily: TYPOGRAPHY.families.poppins,
  },
  trickRate: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.success,
    marginBottom: SPACING.xs,
    fontFamily: TYPOGRAPHY.families.poppinsBold,
  },
  trickAttempts: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});

export default StudentDashboardScreen; 