import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Image,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Trophy,
  Star,
  TrendingUp,
  Clock,
  Target,
  Award,
  ChevronRight,
  Play,
  Calendar,
  MessageCircle,
  User,
  Settings,
  Bell,
  LogOut,
  BookOpen,
  Zap,
  Heart,
  PlusCircle
} from 'lucide-react-native';
import { RootStackParamList, Student, Achievement, Timeline } from '../../../shared/types';
import { BottomNavigation } from '../../../shared/components/BottomNavigation';
import { supabase } from '../../../shared/lib/supabase';
import { DESIGN_COLORS, TYPOGRAPHY } from '../../../shared/components/styles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type StudentHomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StudentHome'>;

interface ProgressBarProps {
  progress: number;
  total: number;
  label: string;
  color?: string;
}

interface ClipCardProps {
  uri: string;
  title: string;
  timestamp: Date;
  onPress: () => void;
}

interface TimelineItemProps {
  item: Timeline;
}

interface GoalCardProps {
  title: string;
  description: string;
  progress: number;
  isCompleted: boolean;
  onPress: () => void;
}

interface WellbeingCardProps {
  mood: 'great' | 'good' | 'okay' | 'struggling';
  onPress: () => void;
}

// Additional design constants for spacing and layout
const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  screenPadding: 20,
};

const SHADOWS = {
  light: {
    boxShadow: `3px 3px 0px ${DESIGN_COLORS.black}`,
    elevation: 3,
  },
  medium: {
    boxShadow: `5px 5px 0px ${DESIGN_COLORS.black}`,
    elevation: 5,
  },
};

const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

const StudentHomeScreen: React.FC = () => {
  const navigation = useNavigation<StudentHomeScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState('home');
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [screenDimensions, setScreenDimensions] = useState({
    width: screenWidth,
    height: screenHeight,
  });

  // Responsive breakpoints
  const isDesktop = screenDimensions.width >= 1024;
  const isTablet = screenDimensions.width >= 768 && screenDimensions.width < 1024;
  const isMobile = screenDimensions.width < 768;

  useEffect(() => {
    loadStudentData();
    
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.log('No authenticated user, using mock data');
        setStudentProfile(mockStudentData);
        return;
      }

      // Get student profile
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select(`
          *,
          student_badges(
            id,
            earned_at,
            badges(*)
          ),
          achievements(*),
          trick_progress(*),
          timeline_entries:student_timeline(
            id,
            type,
            content,
            created_at,
            metadata
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (studentError) {
        console.error('Error loading student data:', studentError);
        setStudentProfile(mockStudentData);
        return;
      }

      setStudentProfile({
        ...student,
        badges: student.student_badges?.map((sb: any) => ({
          ...sb.badges,
          earned_at: sb.earned_at
        })) || [],
        achievements: student.achievements || [],
        trick_progress: student.trick_progress || [],
        timeline: student.timeline_entries || []
      });

    } catch (error: any) {
      console.error('Error in loadStudentData:', error);
      setStudentProfile(mockStudentData);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for fallback
  const mockStudentData = {
    id: '1',
    name: 'Alex Chen',
    level: 'Intermediate',
    age: 16,
    xp_points: 1250,
    badgeLevel: 'Bronze Skater',
    goals: ['Master kickflip', 'Improve balance', 'Land 360 flip'],
    profileImage: undefined,
    total_videos: 24,
    landed_tricks: 18,
    session_count: 12,
    badges: [],
    achievements: [],
    trick_progress: [],
    timeline: []
  };

  // Mock clips data
  const latestClips = [
    {
      id: '1',
      uri: 'mock-video-1',
      title: 'Kickflip attempt',
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: '2',
      uri: 'mock-video-2',
      title: 'Ollie practice',
      timestamp: new Date(Date.now() - 7200000),
    },
    {
      id: '3',
      uri: 'mock-video-3',
      title: 'Balance training',
      timestamp: new Date(Date.now() - 10800000),
    },
  ];

  // Mock timeline data
  const timelineData: Timeline[] = [
    {
      id: '1',
      type: 'achievement',
      content: 'Landed first kickflip!',
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: '2',
      type: 'feedback',
      content: 'Great improvement in balance - Coach Ana',
      timestamp: new Date(Date.now() - 7200000),
    },
    {
      id: '3',
      type: 'trick_tag',
      content: 'Ollie technique getting better',
      timestamp: new Date(Date.now() - 10800000),
    },
    {
      id: '4',
      type: 'milestone',
      content: 'Reached 1000 XP milestone',
      timestamp: new Date(Date.now() - 14400000),
    },
  ];

  // Mock goals data
  const goalsData = [
    {
      id: '1',
      title: 'Master kickflip',
      description: 'Land 5 kickflips in a row',
      progress: 60,
      isCompleted: false,
    },
    {
      id: '2',
      title: 'Improve balance',
      description: 'Practice board control exercises',
      progress: 85,
      isCompleted: false,
    },
    {
      id: '3',
      title: 'Learn shuvit',
      description: 'Master the shuvit technique',
      progress: 100,
      isCompleted: true,
    },
  ];

  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  const getLevel = (xp: number) => {
    const levels = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000];
    const currentLevel = levels.findIndex(threshold => xp < threshold);
    return currentLevel === -1 ? levels.length : currentLevel;
  };

  const getXpForNextLevel = (xp: number) => {
    const levels = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000];
    const currentLevel = getLevel(xp);
    return currentLevel >= levels.length ? 0 : levels[currentLevel] - xp;
  };

  const getProgressToNextLevel = (xp: number) => {
    const levels = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000];
    const currentLevel = getLevel(xp);
    if (currentLevel >= levels.length) return 100;
    
    const currentLevelXp = currentLevel === 0 ? 0 : levels[currentLevel - 1];
    const nextLevelXp = levels[currentLevel];
    const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  const ProgressBar: React.FC<ProgressBarProps> = ({ progress, total, label, color = DESIGN_COLORS.tricks }) => {
    const percentage = (progress / total) * 100;
    
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>{label}</Text>
          <Text style={styles.progressText}>{progress}/{total} XP</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: color }]} />
        </View>
      </View>
    );
  };

  const ClipCard: React.FC<ClipCardProps> = ({ uri, title, timestamp, onPress }) => (
    <TouchableOpacity style={styles.clipCard} onPress={onPress}>
      <View style={styles.clipThumbnail}>
        <Play size={24} color={DESIGN_COLORS.white} />
      </View>
      <View style={styles.clipInfo}>
        <Text style={styles.clipTitle}>{title}</Text>
        <Text style={styles.clipTime}>{getTimeAgo(timestamp)}</Text>
      </View>
    </TouchableOpacity>
  );

  const TimelineItem: React.FC<TimelineItemProps> = ({ item }) => {
    const getIcon = () => {
      switch (item.type) {
        case 'achievement':
          return <Trophy size={24} color={DESIGN_COLORS.coach} />;
        case 'feedback':
          return <MessageCircle size={24} color={DESIGN_COLORS.parent} />;
        case 'trick_tag':
          return <Star size={24} color={DESIGN_COLORS.tricks} />;
        case 'milestone':
          return <Award size={24} color={DESIGN_COLORS.approvals} />;
        default:
          return <Clock size={24} color={DESIGN_COLORS.textSecondary} />;
      }
    };

    return (
      <View style={styles.timelineItem}>
        <View style={styles.timelineIconContainer}>
          {getIcon()}
        </View>
        <View style={styles.timelineContent}>
          <Text style={styles.timelineText}>{item.content}</Text>
          <Text style={styles.timelineTime}>{getTimeAgo(item.timestamp)}</Text>
        </View>
      </View>
    );
  };

  const GoalCard: React.FC<GoalCardProps> = ({ title, description, progress, isCompleted, onPress }) => (
    <TouchableOpacity style={styles.goalCard} onPress={onPress}>
      <View style={styles.goalHeader}>
        <View style={styles.goalIcon}>
          <Target size={24} color={isCompleted ? DESIGN_COLORS.coach : DESIGN_COLORS.tricks} />
        </View>
        <View style={styles.goalInfo}>
          <Text style={[styles.goalTitle, isCompleted && styles.completedGoalTitle]}>
            {title}
          </Text>
          <Text style={styles.goalDescription}>{description}</Text>
        </View>
        <View style={styles.goalProgress}>
          <Text style={[styles.goalPercentage, isCompleted && styles.completedGoalPercentage]}>
            {progress}%
          </Text>
        </View>
      </View>
      <View style={styles.goalProgressBar}>
        <View style={[
          styles.goalProgressFill, 
          { width: `${progress}%` },
          isCompleted && styles.completedGoalProgressFill
        ]} />
      </View>
    </TouchableOpacity>
  );

  const WellbeingCard: React.FC<WellbeingCardProps> = ({ mood, onPress }) => {
    const getMoodColor = () => {
      switch (mood) {
        case 'great': return DESIGN_COLORS.coach;
        case 'good': return DESIGN_COLORS.tricks;
        case 'okay': return DESIGN_COLORS.parent;
        case 'struggling': return DESIGN_COLORS.approvals;
        default: return DESIGN_COLORS.textSecondary;
      }
    };

    const getMoodText = () => {
      switch (mood) {
        case 'great': return 'Feeling Great!';
        case 'good': return 'Doing Good';
        case 'okay': return 'Just Okay';
        case 'struggling': return 'Need Support';
        default: return 'How are you?';
      }
    };

    return (
      <TouchableOpacity style={styles.wellbeingCard} onPress={onPress}>
        <View style={[styles.wellbeingIcon, { backgroundColor: `${getMoodColor()}20` }]}>
          <Heart size={24} color={getMoodColor()} />
        </View>
        <View style={styles.wellbeingContent}>
          <Text style={styles.wellbeingTitle}>Mental Health</Text>
          <Text style={[styles.wellbeingMood, { color: getMoodColor() }]}>
            {getMoodText()}
          </Text>
        </View>
        <ChevronRight size={16} color={DESIGN_COLORS.textSecondary} />
      </TouchableOpacity>
    );
  };

  const EmptyState: React.FC<{ title: string; description: string; actionText: string; onAction: () => void; icon: any }> = ({ 
    title, 
    description, 
    actionText, 
    onAction,
    icon: Icon 
  }) => (
    <View style={styles.emptyState}>
      <View style={styles.emptyStateIcon}>
        <Icon size={48} color={DESIGN_COLORS.textSecondary} />
      </View>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateDescription}>{description}</Text>
      <TouchableOpacity style={styles.emptyStateButton} onPress={onAction}>
        <Text style={styles.emptyStateButtonText}>{actionText}</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={DESIGN_COLORS.background} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your skate journey...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentStudentData = studentProfile || mockStudentData;
  const level = getLevel(currentStudentData.xp_points);
  const xpToNext = getXpForNextLevel(currentStudentData.xp_points);
  const progressPercentage = getProgressToNextLevel(currentStudentData.xp_points);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={DESIGN_COLORS.background} />
      
      {/* Desktop/Tablet Navigation - Fixed Top */}
      {(isDesktop || isTablet) && (
        <View style={styles.desktopNav}>
          <View style={styles.desktopNavContent}>
            <View style={styles.desktopNavLeft}>
              <Image 
                source={{ uri: 'https://eleve-native-app.s3.us-east-2.amazonaws.com/public/assets/images/eleve-logo.svg' }} 
                style={styles.desktopLogo}
                resizeMode="contain"
              />
            </View>
            <View style={styles.desktopNavCenter}>
              <TouchableOpacity 
                style={[styles.desktopNavItem, activeTab === 'home' && styles.desktopNavItemActive]}
                onPress={() => setActiveTab('home')}
              >
                <Text style={[styles.desktopNavItemText, activeTab === 'home' && styles.desktopNavItemTextActive]}>
                  Dashboard
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.desktopNavItem}
                onPress={() => navigation.navigate('StudentProgress')}
              >
                <Text style={styles.desktopNavItemText}>Progress</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.desktopNavItem}
                onPress={() => navigation.navigate('StudentVideos')}
              >
                <Text style={styles.desktopNavItemText}>Videos</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.desktopNavItem}
                onPress={() => navigation.navigate('StudentTricks')}
              >
                <Text style={styles.desktopNavItemText}>Tricks</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.desktopNavRight}>
              <TouchableOpacity style={styles.desktopNavIcon}>
                <Bell size={24} color={DESIGN_COLORS.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.desktopNavIcon}>
                <Settings size={24} color={DESIGN_COLORS.textSecondary} />
              </TouchableOpacity>
              <View style={styles.desktopNavAvatar}>
                <Text style={styles.desktopNavAvatarText}>
                  {currentStudentData.name.split(' ').map((n: string) => n[0]).join('')}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

              <ScrollView 
          contentContainerStyle={[
            styles.scrollContent,
            (isDesktop || isTablet) && styles.desktopScrollContent
          ]}
          showsVerticalScrollIndicator={false}
        >
        {/* Mobile Header */}
        {isMobile && (
          <View style={styles.mobileHeader}>
            <View style={styles.mobileHeaderContent}>
              <Text style={styles.mobileHeaderTitle}>Dashboard</Text>
              <Text style={styles.mobileHeaderSubtitle}>
                {getGreeting()} {currentStudentData.name.split(' ')[0]}
              </Text>
            </View>
            <TouchableOpacity style={styles.mobileHeaderNotification}>
              <Bell size={24} color={DESIGN_COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Desktop/Tablet Welcome Header */}
        {(isDesktop || isTablet) && (
          <View style={styles.desktopHeader}>
            <View style={styles.desktopHeaderContent}>
              <Text style={styles.desktopGreeting}>
                {getGreeting()} {currentStudentData.name.split(' ')[0]}!
              </Text>
              <Text style={styles.desktopSubtitle}>Ready to level up your skating?</Text>
            </View>
          </View>
        )}

        {/* Main Content Grid */}
        <View style={[
          styles.mainGrid,
          isDesktop && styles.desktopMainGrid,
          isTablet && styles.tabletMainGrid
        ]}>
          {/* XP Progress Card */}
          <View style={[
            styles.gridItem,
            styles.xpCard,
            isDesktop && styles.desktopXpCard,
            isTablet && styles.tabletXpCard
          ]}>
                         <LinearGradient
               colors={['#8B5CF6', '#7C3AED'] as const}
               style={styles.xpGradient}
             >
              <View style={styles.xpHeader}>
                <View style={styles.xpLevel}>
                  <Award size={32} color={DESIGN_COLORS.white} />
                  <View style={styles.xpLevelInfo}>
                    <Text style={styles.xpLevelNumber}>Level {level}</Text>
                    <Text style={styles.xpLevelTitle}>{currentStudentData.badgeLevel}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.xpDetailsButton}>
                  <Zap size={24} color={DESIGN_COLORS.white} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.xpProgressSection}>
                <View style={styles.xpBar}>
                  <View style={[styles.xpFill, { width: `${progressPercentage}%` }]} />
                </View>
                <Text style={styles.xpText}>
                  {currentStudentData.xp_points} XP • {xpToNext} to level {level + 1}
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Quick Stats Cards */}
          <View style={[
            styles.gridItem,
            styles.statsContainer,
            isDesktop && styles.desktopStatsContainer
          ]}>
            <View style={styles.statsGrid}>
                              <TouchableOpacity style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: `${DESIGN_COLORS.tricks}20` }]}>
                    <Play size={24} color={DESIGN_COLORS.tricks} />
                  </View>
                <Text style={styles.statValue}>{currentStudentData.total_videos}</Text>
                <Text style={styles.statLabel}>Videos</Text>
              </TouchableOpacity>
              
                              <TouchableOpacity style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: `${DESIGN_COLORS.coach}20` }]}>
                    <Target size={24} color={DESIGN_COLORS.coach} />
                  </View>
                <Text style={styles.statValue}>{currentStudentData.landed_tricks}</Text>
                <Text style={styles.statLabel}>Tricks Landed</Text>
              </TouchableOpacity>
              
                              <TouchableOpacity style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: `${DESIGN_COLORS.parent}20` }]}>
                    <Calendar size={24} color={DESIGN_COLORS.parent} />
                  </View>
                <Text style={styles.statValue}>{currentStudentData.session_count}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: `${DESIGN_COLORS.approvals}20` }]}>
                  <TrendingUp size={24} color={DESIGN_COLORS.approvals} />
                </View>
                <Text style={styles.statValue}>
                  {Math.round((currentStudentData.landed_tricks / Math.max(currentStudentData.total_videos, 1)) * 100)}%
                </Text>
                <Text style={styles.statLabel}>Success Rate</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Latest Clips Section */}
          <View style={[
            styles.gridItem,
            styles.sectionCard,
            isDesktop && styles.desktopSectionCard
          ]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Latest Clips</Text>
              <TouchableOpacity style={styles.sectionButton}>
                <Text style={styles.sectionButtonText}>View All</Text>
                <ChevronRight size={16} color={DESIGN_COLORS.tricks} />
              </TouchableOpacity>
            </View>
            
            {latestClips.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.clipsContainer}
              >
                {latestClips.map((clip) => (
                  <ClipCard
                    key={clip.id}
                    uri={clip.uri}
                    title={clip.title}
                    timestamp={clip.timestamp}
                    onPress={() => {}}
                  />
                ))}
              </ScrollView>
            ) : (
              <EmptyState
                title="No clips yet"
                description="Upload your first skating video to get started!"
                actionText="Upload Video"
                onAction={() => navigation.navigate('VideoUpload')}
                icon={Play}
              />
            )}
          </View>

          {/* Timeline Section */}
          <View style={[
            styles.gridItem,
            styles.sectionCard,
            isDesktop && styles.desktopSectionCard
          ]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Timeline</Text>
              <TouchableOpacity style={styles.sectionButton}>
                <Text style={styles.sectionButtonText}>View All</Text>
                <ChevronRight size={16} color={DESIGN_COLORS.tricks} />
              </TouchableOpacity>
            </View>
            
            {timelineData.length > 0 ? (
              <View style={styles.timelineContainer}>
                {timelineData.slice(0, 3).map((item) => (
                  <TimelineItem key={item.id} item={item} />
                ))}
              </View>
            ) : (
              <EmptyState
                title="No timeline yet"
                description="Your skating journey will appear here as you progress!"
                actionText="Start Session"
                onAction={() => navigation.navigate('SessionSetup')}
                icon={Clock}
              />
            )}
          </View>

          {/* Goals Section */}
          <View style={[
            styles.gridItem,
            styles.sectionCard,
            isDesktop && styles.desktopSectionCard
          ]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Current Goals</Text>
              <TouchableOpacity style={styles.sectionButton}>
                <PlusCircle size={16} color={DESIGN_COLORS.coach} />
                <Text style={styles.sectionButtonText}>Add Goal</Text>
              </TouchableOpacity>
            </View>
            
            {goalsData.length > 0 ? (
              <View style={styles.goalsContainer}>
                {goalsData.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    title={goal.title}
                    description={goal.description}
                    progress={goal.progress}
                    isCompleted={goal.isCompleted}
                    onPress={() => {}}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                title="No goals set"
                description="Set some skating goals to track your progress!"
                actionText="Set Goals"
                onAction={() => {}}
                icon={Target}
              />
            )}
          </View>

          {/* Wellbeing Card */}
          <View style={[
            styles.gridItem,
            styles.sectionCard,
            isDesktop && styles.desktopSectionCard
          ]}>
            <Text style={styles.sectionTitle}>Wellbeing Check</Text>
            <WellbeingCard
              mood="good"
              onPress={() => {}}
            />
          </View>
        </View>
      </ScrollView>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <BottomNavigation
          activeTab={activeTab}
          userRole="student"
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_COLORS.background,
  },
       scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  desktopScrollContent: {
    paddingTop: 80, // Account for fixed nav
    paddingBottom: SPACING.xl,
  },
  header: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: DESIGN_COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontFamily: 'ArchivoBlack-Regular',
    fontSize: 24,
    fontWeight: '900' as const,
    color: DESIGN_COLORS.text,
  },
  subtitle: {
    ...TYPOGRAPHY.bodyText,
    fontSize: 18,
    color: DESIGN_COLORS.tricks,
  },
  section: {
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.screenPadding,
  },
  xpCard: {
    backgroundColor: DESIGN_COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 2,
    borderColor: DESIGN_COLORS.black,
  },
  badgeContainer: {
    alignItems: 'center',
  },
  badgeLevel: {
    ...TYPOGRAPHY.bodyText,
    color: DESIGN_COLORS.text,
    marginTop: SPACING.xs,
  },
  progressContainer: {
    width: '100%',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  progressLabel: {
    ...TYPOGRAPHY.bodyText,
    color: DESIGN_COLORS.text,
  },
  progressText: {
    ...TYPOGRAPHY.bodyText,
    color: DESIGN_COLORS.textSecondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: DESIGN_COLORS.background,
    borderRadius: BORDER_RADIUS.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: DESIGN_COLORS.tricks,
    borderRadius: BORDER_RADIUS.xs,
  },
  clipsContainer: {
    paddingRight: SPACING.screenPadding,
  },
  clipCard: {
    width: 120,
    marginRight: SPACING.md,
    backgroundColor: DESIGN_COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.light,
  },
  clipThumbnail: {
    height: 80,
    backgroundColor: DESIGN_COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clipInfo: {
    padding: SPACING.sm,
  },
  clipTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: DESIGN_COLORS.text,
    marginBottom: SPACING.xs,
  },
  clipTime: {
    fontSize: 10,
    color: DESIGN_COLORS.textSecondary,
  },
  timelineContainer: {
    gap: SPACING.md,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: DESIGN_COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.light,
  },
  timelineIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: DESIGN_COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  timelineContent: {
    flex: 1,
  },
  timelineText: {
    fontSize: 14,
    color: DESIGN_COLORS.text,
    marginBottom: SPACING.xs,
  },
  timelineTime: {
    fontSize: 12,
    color: DESIGN_COLORS.textSecondary,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  viewMoreText: {
    fontSize: 14,
    color: DESIGN_COLORS.tricks,
    fontWeight: '500',
    marginRight: SPACING.xs,
  },
  goalsContainer: {
    gap: SPACING.md,
  },
  goalCard: {
    backgroundColor: DESIGN_COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.light,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: DESIGN_COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DESIGN_COLORS.text,
    marginBottom: SPACING.xs,
  },
  completedGoalTitle: {
    textDecorationLine: 'line-through',
    color: DESIGN_COLORS.textSecondary,
  },
  goalDescription: {
    fontSize: 12,
    color: DESIGN_COLORS.textSecondary,
  },
  goalProgress: {
    marginLeft: SPACING.sm,
  },
  goalPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: DESIGN_COLORS.tricks,
  },
  completedGoalPercentage: {
    color: DESIGN_COLORS.coach,
  },
  goalProgressBar: {
    height: 4,
    backgroundColor: DESIGN_COLORS.background,
    borderRadius: BORDER_RADIUS.xs,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: DESIGN_COLORS.tricks,
    borderRadius: BORDER_RADIUS.xs,
  },
  completedGoalProgressFill: {
    backgroundColor: DESIGN_COLORS.coach,
     },
   // Mobile header styles
   mobileHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     paddingHorizontal: SPACING.screenPadding,
     paddingVertical: SPACING.lg,
     backgroundColor: DESIGN_COLORS.white,
     ...SHADOWS.light,
   },
   mobileHeaderContent: {
     flex: 1,
   },
   mobileHeaderTitle: {
     fontSize: 20,
     fontWeight: '700',
     color: DESIGN_COLORS.text,
   },
   mobileHeaderSubtitle: {
     fontSize: 14,
     color: DESIGN_COLORS.textSecondary,
     marginTop: SPACING.xs,
   },
   mobileHeaderNotification: {
     width: 44,
     height: 44,
     borderRadius: BORDER_RADIUS.md,
     backgroundColor: DESIGN_COLORS.background,
     justifyContent: 'center',
     alignItems: 'center',
     ...SHADOWS.light,
   },
   wellbeingCard: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: DESIGN_COLORS.white,
     borderRadius: BORDER_RADIUS.lg,
     padding: SPACING.md,
     ...SHADOWS.light,
   },
  wellbeingIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  wellbeingContent: {
    flex: 1,
  },
  wellbeingTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: DESIGN_COLORS.text,
    marginBottom: SPACING.xs,
  },
  wellbeingMood: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: DESIGN_COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DESIGN_COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: DESIGN_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  emptyStateButton: {
    backgroundColor: DESIGN_COLORS.tricks,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  emptyStateButtonText: {
    color: DESIGN_COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DESIGN_COLORS.background,
  },
  loadingText: {
    ...TYPOGRAPHY.sectionTitle,
    fontSize: 18,
    color: DESIGN_COLORS.text,
    textTransform: 'none',
  },
  // New styles for desktop layout
  desktopNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: DESIGN_COLORS.white,
    paddingTop: Platform.OS === 'ios' ? SPACING.lg : SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: DESIGN_COLORS.black,
  },
  desktopNavContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
  },
  desktopNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  desktopLogo: {
    width: 120,
    height: 50,
    marginRight: SPACING.sm,
  },
  desktopNavTitle: {
    fontSize: 20,
    color: DESIGN_COLORS.text,
  },
  desktopNavCenter: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
  },
  desktopNavItem: {
    marginHorizontal: SPACING.md,
  },
  desktopNavItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: DESIGN_COLORS.tricks,
  },
  desktopNavItemText: {
    ...TYPOGRAPHY.bodyText,
    color: DESIGN_COLORS.textSecondary,
  },
  desktopNavItemTextActive: {
    fontSize: 14,
    color: DESIGN_COLORS.tricks,
  },
  desktopNavRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  desktopNavIcon: {
    marginHorizontal: SPACING.sm,
  },
  desktopNavAvatar: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: DESIGN_COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  desktopNavAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: DESIGN_COLORS.text,
  },
  desktopHeader: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
    backgroundColor: DESIGN_COLORS.white,
    ...SHADOWS.light,
  },
  desktopHeaderContent: {
    alignItems: 'flex-start',
  },
  desktopGreeting: {
    fontSize: 32,
    fontWeight: '700',
    color: DESIGN_COLORS.text,
  },
  desktopSubtitle: {
    fontSize: 18,
    color: DESIGN_COLORS.black,
    fontWeight: '500',
  },
  mainGrid: {
    flexDirection: 'column',
    gap: SPACING.md,
    paddingHorizontal: SPACING.screenPadding,
  },
  gridItem: {
    backgroundColor: DESIGN_COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.light,
  },
  sectionCard: {
    backgroundColor: DESIGN_COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.light,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DESIGN_COLORS.text,
  },
  sectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionButtonText: {
    fontSize: 14,
    color: DESIGN_COLORS.tricks,
    fontWeight: '500',
    marginRight: SPACING.xs,
  },
  xpGradient: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  xpLevel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  xpLevelInfo: {
    marginLeft: SPACING.sm,
  },
  xpLevelNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: DESIGN_COLORS.white,
  },
  xpLevelTitle: {
    fontSize: 12,
    color: DESIGN_COLORS.white,
  },
  xpDetailsButton: {
    backgroundColor: DESIGN_COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xs,
  },
  xpProgressSection: {
    alignItems: 'center',
  },
  xpBar: {
    width: '100%',
    height: 8,
    backgroundColor: DESIGN_COLORS.background,
    borderRadius: BORDER_RADIUS.xs,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: DESIGN_COLORS.white,
    borderRadius: BORDER_RADIUS.xs,
  },
  xpText: {
    fontSize: 12,
    color: DESIGN_COLORS.white,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
         statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      width: '100%',
    },
    statCard: {
      flex: 1,
      backgroundColor: DESIGN_COLORS.background,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.md,
      alignItems: 'center',
      margin: SPACING.xs,
      ...SHADOWS.light,
    },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: DESIGN_COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: DESIGN_COLORS.textSecondary,
  },
  desktopXpCard: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  tabletXpCard: {
    width: '100%',
    marginBottom: SPACING.md,
  },
     desktopMainGrid: {
     flexDirection: 'column',
   },
   tabletMainGrid: {
     flexDirection: 'column',
   },
   desktopStatsContainer: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     flexWrap: 'wrap',
   },
   desktopSectionCard: {
     marginBottom: SPACING.md,
   },
});

export default StudentHomeScreen;