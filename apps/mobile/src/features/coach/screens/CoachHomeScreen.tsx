import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { 
  Camera, 
  Play, 
  Users, 
  PlayCircle, 
  TrendingUp,
  Zap,
  Award,
  ChevronRight,
  Settings,
  Bell,
  Calendar,
  MessageCircle,
  Star,
  Clock,
  LogOut,
  BarChart3,
  Video,
  Upload
} from 'lucide-react-native';
import { RootStackParamList, SessionFeedItem } from '../../../shared/types';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';
import { BottomNavigation } from '../../../shared/components/BottomNavigation';
import { supabase } from '../../../shared/lib/supabase';
import { s3Service } from '../../../shared/services/awsS3Service';
import { isWeb } from '../../../shared/utils/platform';

type CoachHomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CoachHome'>;

interface MainActionCardProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  subtitle: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

interface StatCardProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  number: string;
  label: string;
  iconBgColor?: string;
  iconColor?: string;
  onPress?: () => void;
}

interface ShortcutCardProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  subtitle: string;
  onPress: () => void;
}

interface FeedItemProps {
  item: SessionFeedItem;
}

const CoachHomeScreen: React.FC = () => {
  const navigation = useNavigation<CoachHomeScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<any>(null);
  const [coachProfile, setCoachProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingUploadsCount, setPendingUploadsCount] = useState(0);
  const [avatarUri, setAvatarUri] = useState<string>('https://eleve-native-app.s3.us-east-2.amazonaws.com/public/assets/images/eleve-avatar.svg');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeSessions: 0,
    videosRecorded: 0,
    thisWeekHours: 0
  });

  // Mock data for session feed
  const sessionFeed: SessionFeedItem[] = [
    {
      id: '1',
      type: 'video',
      content: 'New video recorded in Session #23',
      timestamp: new Date(Date.now() - 3600000),
      studentName: 'Emma Johnson',
      videoUri: 'mock-video-uri'
    },
    {
      id: '2',
      type: 'trick_tag',
      content: 'Kickflip landed successfully',
      timestamp: new Date(Date.now() - 7200000),
      studentName: 'Alex Chen'
    },
    {
      id: '3',
      type: 'xp_update',
      content: 'Earned 50 XP for consistent practice',
      timestamp: new Date(Date.now() - 10800000),
      studentName: 'Maya Patel'
    },
    {
      id: '4',
      type: 'coach_note',
      content: 'Great improvement in ollie technique',
      timestamp: new Date(Date.now() - 14400000),
      studentName: 'Jordan Smith'
    }
  ];

  useEffect(() => {
    loadCoachData();
  }, []);

  const loadCoachData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.log('No user found or error:', userError);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }

      setUser(user);

      // Load coach profile
      try {
        const { data: coachData, error: coachError } = await supabase
          .from('coaches')
          .select('full_name, email, avatar_url')
          .eq('id', user.id)
          .single();

        if (coachError) {
          console.log('Coach profile not found or error:', coachError);
        } else {
          setCoachProfile(coachData);
          // Set avatar URL if available, otherwise keep default
          if (coachData.avatar_url) {
            setAvatarUri(coachData.avatar_url);
          }
        }
      } catch (error) {
        console.log('Error loading coach profile:', error);
      }

      // Fetch today's video count from database
      let videosCount = 0;
      try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const { count, error: videosError } = await supabase
          .from('videos')
          .select('*', { count: 'exact', head: true })
          .eq('coach_id', user?.id)
          .gte('created_at', startOfDay.toISOString())
          .lt('created_at', endOfDay.toISOString());

        if (videosError) {
          console.log('Error loading videos count:', videosError);
        } else {
          videosCount = count || 0;
          console.log(`📊 Coach has ${videosCount} videos today`);
        }
      } catch (error) {
        console.log('Error fetching videos count:', error);
      }

      // Fetch pending uploads count
      let pendingCount = 0;
      try {
        const { count, error: pendingError } = await supabase
          .from('videos')
          .select('*', { count: 'exact', head: true })
          .eq('coach_id', user?.id)
          .eq('upload_status', 'pending');

        if (pendingError) {
          console.log('Error loading pending uploads count:', pendingError);
        } else {
          pendingCount = count || 0;
          console.log(`📱 Coach has ${pendingCount} pending uploads`);
        }
      } catch (error) {
        console.log('Error fetching pending uploads count:', error);
      }

      setPendingUploadsCount(pendingCount);

      // Fetch real students count
      let studentsCount = 0;
      try {
        const { count, error: studentsError } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('coach_id', user?.id);

        if (studentsError) {
          console.log('Error loading students count:', studentsError);
        } else {
          studentsCount = count || 0;
          console.log(`📊 Coach has ${studentsCount} students`);
        }
      } catch (error) {
        console.log('Error fetching students count:', error);
      }

      // Set stats with real data
      setStats({
        totalStudents: studentsCount,
        activeSessions: 12,
        videosRecorded: videosCount,
        thisWeekHours: 18.5
      });

    } catch (error: any) {
      console.error('Error loading coach data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadCoachData();
    } catch (error) {
      console.error('Error refreshing coach data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRecordQuickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to record videos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets[0]) {
        const video = result.assets[0];
        navigation.navigate('QuickVideoReview', {
          videoUri: video.uri,
          videoDuration: video.duration ? Math.floor(video.duration / 1000) : 0,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to access camera');
      console.error('Camera error:', error);
    }
  };

  const handleStartSession = () => {
    navigation.navigate('SessionSetup');
  };

  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
    // Navigate to respective screens based on tab
    if (tab === 'record') {
      handleRecordQuickVideo();
    }
  };

  const handleLogout = async () => {
    console.log('Coach logout button pressed!');
    
    try {
      console.log('Starting coach logout process...');
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
        throw error;
      }
      
      console.log('Successfully signed out from Supabase');
      console.log('Navigating to Login screen...');
      
      // Reset navigation stack to prevent going back
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const pickAvatar = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need camera roll permissions to update your avatar.');
        return;
      }

      if (isWeb) {
        // Web platform: use HTML file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
              Alert.alert('File too large', 'Please select an image smaller than 5MB');
              return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
              Alert.alert('Invalid file type', 'Please select an image file');
              return;
            }

            setAvatarFile(file);
            setAvatarUri(URL.createObjectURL(file));
          }
        };
        input.click();
      } else {
        // Native platform: use expo-image-picker
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          allowsMultipleSelection: false,
        });

        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          
          // Validate file size (max 5MB)
          if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
            Alert.alert('File too large', 'Please select an image smaller than 5MB');
            return;
          }

          setAvatarUri(asset.uri);
          setAvatarFile(null);
        }
      }
    } catch (error) {
      console.error('Error picking avatar:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const updateAvatar = async () => {
    if (!user) return;

    try {
      setAvatarLoading(true);

      let avatarUrl: string = avatarUri;

      // Upload avatar if a new image was selected
      const hasNewAvatar = isWeb 
        ? avatarFile !== null 
        : (avatarUri && avatarUri !== coachProfile?.avatar_url && !avatarUri.includes('eleve-avatar.svg'));

      if (hasNewAvatar) {
        console.log('🚀 Starting avatar upload...');
        
        // Determine the correct image source for upload
        const imageSource = isWeb ? avatarFile! : avatarUri!;
        
        const uploadResult = await s3Service.uploadOrganizationLogo(
          `coach-${user.id}`,
          imageSource
        );

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Avatar upload failed');
        }

        avatarUrl = uploadResult.url || avatarUri;
        console.log('✅ Avatar uploaded successfully:', avatarUrl);
      }

      // Update coach profile in database
      const { error } = await supabase
        .from('coaches')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      // Update local state
      if (coachProfile) {
        setCoachProfile({ ...coachProfile, avatar_url: avatarUrl });
      }
      setAvatarUri(avatarUrl);

      Alert.alert('Success', 'Avatar updated successfully!');

    } catch (error: any) {
      console.error('Error updating avatar:', error);
      Alert.alert('Error', `Failed to update avatar: ${error.message}`);
    } finally {
      setAvatarLoading(false);
    }
  };

  const MainActionCard: React.FC<MainActionCardProps> = ({ 
    icon: Icon, 
    title, 
    subtitle, 
    onPress, 
    variant = 'primary' 
  }) => (
    <TouchableOpacity 
      style={[
        styles.mainActionCard, 
        variant === 'secondary' && styles.mainActionCardSecondary
      ]} 
      onPress={onPress}
    >
      <View style={[
        styles.mainActionIcon, 
        variant === 'secondary' && styles.mainActionIconSecondary
      ]}>
        <Icon 
          size={SIZES.icon.xlarge} 
          color={variant === 'primary' ? '#8B5CF6' : '#10B981'} 
        />
      </View>
      <View style={styles.mainActionContent}>
        <Text style={[
          styles.mainActionTitle, 
          variant === 'secondary' && styles.mainActionTitleSecondary
        ]}>
          {title}
        </Text>
        <Text style={[
          styles.mainActionSubtitle, 
          variant === 'secondary' && styles.mainActionSubtitleSecondary
        ]}>
          {subtitle}
        </Text>
      </View>
      <ChevronRight 
        size={SIZES.icon.medium} 
        color={variant === 'primary' ? COLORS.textInverse : COLORS.textSecondary} 
      />
    </TouchableOpacity>
  );

  const StatCard: React.FC<StatCardProps> = ({ 
    icon: Icon, 
    number, 
    label, 
    iconBgColor = COLORS.surface,
    iconColor = COLORS.primary,
    onPress
  }) => {
    const content = (
      <>
        <View style={[styles.statIconContainer, { backgroundColor: iconBgColor }]}>
          <Icon size={SIZES.icon.medium} color={iconColor} />
        </View>
        <Text style={styles.statNumber}>{number}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </>
    );

    if (onPress) {
      return (
        <TouchableOpacity style={styles.statCard} onPress={onPress}>
          {content}
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.statCard}>
        {content}
      </View>
    );
  };

  const ShortcutCard: React.FC<ShortcutCardProps> = ({ icon: Icon, title, subtitle, onPress }) => (
    <TouchableOpacity style={styles.shortcutCard} onPress={onPress}>
      <View style={styles.shortcutIcon}>
        <Icon size={SIZES.icon.medium} color={COLORS.primary} />
      </View>
      <View style={styles.shortcutContent}>
        <Text style={styles.shortcutTitle}>{title}</Text>
        <Text style={styles.shortcutSubtitle}>{subtitle}</Text>
      </View>
      <ChevronRight size={SIZES.icon.small} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  const FeedItem: React.FC<FeedItemProps> = ({ item }) => {
    const getTimeAgo = (timestamp: Date) => {
      const now = new Date();
      const diff = now.getTime() - timestamp.getTime();
      const hours = Math.floor(diff / 3600000);
      if (hours < 1) return 'Just now';
      if (hours === 1) return '1 hour ago';
      return `${hours} hours ago`;
    };

    const getFeedIcon = () => {
      switch (item.type) {
        case 'video':
          return <PlayCircle size={SIZES.icon.medium} color={COLORS.accentBlue} />;
        case 'trick_tag':
          return <Star size={SIZES.icon.medium} color={COLORS.secondary} />;
        case 'xp_update':
          return <Award size={SIZES.icon.medium} color={COLORS.success} />;
        case 'coach_note':
          return <MessageCircle size={SIZES.icon.medium} color={COLORS.accentPink} />;
        default:
          return <Clock size={SIZES.icon.medium} color={COLORS.textSecondary} />;
      }
    };

    return (
      <View style={styles.feedItem}>
        <View style={styles.feedIconContainer}>
          {getFeedIcon()}
        </View>
        <View style={styles.feedContent}>
          <Text style={styles.feedText}>{item.content}</Text>
          <View style={styles.feedMeta}>
            <Text style={styles.feedStudent}>{item.studentName}</Text>
            <Text style={styles.feedTime}>{getTimeAgo(item.timestamp)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const getCurrentDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  };

  const getCoachDisplayName = () => {
    // First priority: full_name from coach profile
    if (coachProfile?.full_name) {
      return coachProfile.full_name;
    }
    
    // Second priority: name from user metadata
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    
    // Third priority: name from user metadata (alternative field)
    if (user?.user_metadata?.name) {
      return user.user_metadata.name;
    }
    
    // Fourth priority: first and last name combined
    if (user?.user_metadata?.first_name || user?.user_metadata?.last_name) {
      const firstName = user.user_metadata.first_name || '';
      const lastName = user.user_metadata.last_name || '';
      return `${firstName} ${lastName}`.trim();
    }
    
    // Last resort: use email username part (before @)
    if (user?.email) {
      const emailUsername = user.email.split('@')[0];
      return emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
    }
    
    return 'Coach';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.eleveBlue]} // Android
            tintColor={COLORS.eleveBlue} // iOS
            title="Pull to refresh"
            titleColor={COLORS.textSecondary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <TouchableOpacity 
                style={styles.avatarContainer}
                onPress={pickAvatar}
                activeOpacity={0.8}
              >
                <Image 
                  source={{ uri: avatarUri }} 
                  style={styles.avatar}
                  onError={() => {
                    // Fallback to default avatar if image fails to load
                    setAvatarUri('https://eleve-native-app.s3.us-east-2.amazonaws.com/public/assets/images/eleve-avatar.svg');
                  }}
                />
                {avatarLoading && (
                  <View style={styles.avatarLoadingOverlay}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.headerContent}>
                <Text style={styles.greeting}>{getGreeting()}</Text>
                <Text style={styles.coachName}>{getCoachDisplayName()}</Text>
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
                style={styles.headerButton} 
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <LogOut size={SIZES.icon.medium} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Avatar update functionality */}
          {(avatarUri !== coachProfile?.avatar_url && avatarUri !== 'https://eleve-native-app.s3.us-east-2.amazonaws.com/public/assets/images/eleve-avatar.svg') && (
            <View style={styles.avatarUpdateContainer}>
              <TouchableOpacity 
                style={styles.updateAvatarButton}
                onPress={updateAvatar}
                disabled={avatarLoading}
              >
                {avatarLoading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Upload size={16} color={COLORS.white} />
                )}
                <Text style={styles.updateAvatarText}>
                  {avatarLoading ? 'Updating...' : 'Update Avatar'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Stats Grid - Compact */}
        <View style={styles.sectionCompact}>
          <Text style={styles.sectionTitleCompact}>Today's Overview</Text>
          <View style={styles.statsGridCompact}>
            <StatCard
              icon={Users}
              number={stats.totalStudents.toString()}
              label="Students"
              iconBgColor="#DBEAFE"
              iconColor="#3B82F6"
              onPress={() => {
                // Navigate to students list screen
                navigation.navigate('StudentsListScreen' as any, { role: 'coach' });
              }}
            />
            <StatCard
              icon={Video}
              number={stats.videosRecorded.toString()}
              label="Videos"
              iconBgColor="#F3E8FF"
              iconColor="#8B5CF6"
              onPress={() => {
                // Navigate to videos list screen
                navigation.navigate('CoachVideosList' as any);
              }}
            />
            <StatCard
              icon={Clock}
              number={stats.activeSessions.toString()}
              label="Sessions"
              iconBgColor="#D1FAE5"
              iconColor="#10B981"
            />
            <StatCard
              icon={BarChart3}
              number={stats.thisWeekHours.toString()}
              label="Hours"
              iconBgColor="#FEF3C7"
              iconColor="#F59E0B"
            />
          </View>
        </View>

        {/* Main Actions */}
        <View style={styles.section}>
          <View style={styles.mainActions}>
            <MainActionCard
              icon={Camera}
              title="Record a quick video"
              subtitle="Capture a single trick or moment"
              onPress={handleRecordQuickVideo}
              variant="primary"
            />
            <MainActionCard
              icon={Play}
              title="Start a session"
              subtitle="Begin a structured coaching session"
              onPress={handleStartSession}
              variant="secondary"
            />
          </View>
        </View>

        {/* Pending Uploads Notification */}
        {pendingUploadsCount > 0 && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.pendingUploadsCard}
              onPress={() => navigation.navigate('CoachVideosList')}
              activeOpacity={0.8}
            >
              <View style={styles.pendingUploadsContent}>
                <View style={styles.pendingUploadsIconContainer}>
                  <Upload size={SIZES.icon.large} color={COLORS.warning} />
                </View>
                <View style={styles.pendingUploadsTextContainer}>
                  <Text style={styles.pendingUploadsTitle}>
                    {pendingUploadsCount} Video{pendingUploadsCount !== 1 ? 's' : ''} Waiting to Upload
                  </Text>
                  <Text style={styles.pendingUploadsSubtitle}>
                    Tap to view and upload when WiFi is available
                  </Text>
                </View>
                <View style={styles.pendingUploadsBadge}>
                  <Text style={styles.pendingUploadsBadgeText}>{pendingUploadsCount}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Shortcuts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shortcuts</Text>
          <View style={styles.shortcutsContainer}>
            <ShortcutCard
              icon={Users}
              title="My Students"
              subtitle="View all students"
              onPress={() => {}}
            />
            <ShortcutCard
              icon={Calendar}
              title="My Sessions"
              subtitle="View session history"
              onPress={() => {}}
            />
            <ShortcutCard
              icon={Bell}
              title="Notifications"
              subtitle="View all notifications"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Session Feed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Feed</Text>
          <View style={styles.feedContainer}>
            {sessionFeed.map((item) => (
              <FeedItem key={item.id} item={item} />
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomNavigation
        activeTab={activeTab}
        userRole="coach"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  header: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 2,
    ...SHADOWS.brutalist,
    borderBottomColor: COLORS.black,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerContent: {
    flex: 1,
    //marginLeft: SPACING.md,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: COLORS.black,
  },
  avatarLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
  },
  avatarUpdateContainer: {
    marginTop: SPACING.sm,
    alignItems: 'center',
  },
  updateAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.eleveBlue,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    ...SHADOWS.brutalist,
  },
  updateAvatarText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.white,
    marginLeft: SPACING.xs,
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
  greeting: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  coachName: {
    fontSize: TYPOGRAPHY.sizes.h1,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.families.archivoBold,
  },
  section: {
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.screenPadding,
  },
  sectionCompact: {
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.screenPadding,
  },
  sectionTitle: {
    marginTop: SPACING.lg,
    fontSize: TYPOGRAPHY.sizes.h2,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    fontFamily: TYPOGRAPHY.families.poppinsBold,
  },
  sectionTitleCompact: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
    fontFamily: TYPOGRAPHY.families.poppinsBold,
  },
  mainActions: {
    gap: SPACING.lg,
  },
  mainActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: 15,
    ...SHADOWS.brutalist,
  },
  mainActionCardSecondary: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.black,
  },
  mainActionIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  mainActionIconSecondary: {
    // No background or border - clean icon display
  },
  mainActionContent: {
    flex: 1,
  },
  mainActionTitle: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    fontFamily: TYPOGRAPHY.families.archivoBold,
  },
  mainActionTitleSecondary: {
    color: COLORS.textPrimary,
  },
  mainActionSubtitle: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.black,
    opacity: 0.8,
    lineHeight: TYPOGRAPHY.lineHeights.bodySmall,
  },
  mainActionSubtitleSecondary: {
    color: COLORS.black,
    opacity: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statsGridCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: SPACING.sm,
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
    fontFamily: TYPOGRAPHY.families.poppinsBold,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.black,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  shortcutsContainer: {
    gap: SPACING.md,
  },
  shortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: SPACING.lg,
    ...SHADOWS.brutalist,
  },
  shortcutIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  shortcutContent: {
    flex: 1,
  },
  shortcutTitle: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    fontFamily: TYPOGRAPHY.families.poppins,
  },
  shortcutSubtitle: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
  },
  feedContainer: {
    gap: SPACING.md,
  },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: SPACING.lg,
    ...SHADOWS.brutalist,
  },
  feedIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  feedContent: {
    flex: 1,
  },
  feedText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginBottom: SPACING.xs,
  },
  feedMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedStudent: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.accentBlue,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  feedTime: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textTertiary,
  },
  pendingUploadsCard: {
    backgroundColor: '#FFF4E6', // Light orange background
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.warning,
    ...SHADOWS.brutalist,
  },
  pendingUploadsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  pendingUploadsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  pendingUploadsTextContainer: {
    flex: 1,
  },
  pendingUploadsTitle: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    fontFamily: TYPOGRAPHY.families.poppinsBold,
  },
  pendingUploadsSubtitle: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  pendingUploadsBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.warning,
    borderWidth: 2,
    borderColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.brutalist,
  },
  pendingUploadsBadgeText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
});

export default CoachHomeScreen;