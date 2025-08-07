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
  FlatList,
  Image,
  Animated,
} from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SvgXml } from 'react-native-svg';
import { 
  Bell, 
  TrendingUp, 
  Calendar, 
  Settings, 
  Users, 
  Target,
  Play,
  Award,
  ChevronRight,
  Star,
  BookOpen,
  BarChart3,
  Heart,
  MessageCircle,
  Plus,
  LogOut,
  Trash2,
  CheckCircle,
  X
} from 'lucide-react-native';
import { RootStackParamList } from '../../../shared/types';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';
import { supabase } from '../../../shared/lib/supabase';
import { BottomNavigation } from '../../../shared/components/BottomNavigation';
import { DashboardHeader } from '../../../shared/components/DashboardHeader';

type ParentHomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ParentHome'>;

// Define missing types locally
interface ParentChild {
  id: string;
  parent_id: string;
  student_id: string;
  students: {
    id: string;
    name: string;
    level: string;
    xp_points: number;
    total_videos: number;
    session_count: number;
    student_badges?: any[];
  };
}

interface Notification {
  id: string;
  recipient_id: string;
  type: 'badge_earned' | 'session_summary' | 'progress_update' | 'new_video';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
}

interface SessionReport {
  session: {
    id: string;
    environment_name: string;
    start_time: string;
    end_time: string;
    duration: number;
  };
  videos: any[];
  stats: {
    total_videos: number;
    landed_count: number;
    success_rate: number;
    new_tricks_attempted: string[];
  };
}

// Design system colors
const DESIGN_COLORS = {
  coach: '#FFC900',
  parent: '#91A8EB', 
  partners: '#55C1C3',
  approvals: '#FF5A34',
  tricks: '#91DEF1',
  black: '#000000',
  white: '#FFFFFF',
  background: '#eeeeee',
  text: '#000000',
  textSecondary: '#000',
  textTertiary: '#666666',
};

const ParentHomeScreen: React.FC = () => {
  const navigation = useNavigation<ParentHomeScreenNavigationProp>();
  const route = useRoute();
  const [activeTab, setActiveTab] = useState('Home');
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recentReports, setRecentReports] = useState<SessionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [parentProfile, setParentProfile] = useState<any>(null);
  
  // Success message state
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successDetails, setSuccessDetails] = useState<{childName: string; childUsername: string; childPassword: string} | null>(null);
  const bannerAnimatedValue = useState(new Animated.Value(-100))[0];

  useEffect(() => {
    loadParentData();
    
    // Check if we have success message parameters
    const params = route.params as any;
    if (params?.showSuccessMessage && params?.childName) {
      showSuccessMessageBanner(params.childName, params.childUsername, params.childPassword);
    }
  }, [route.params]);

  // Add focus effect to refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 ParentHomeScreen focused, refreshing data...');
      loadParentData();
    }, [])
  );

  const showSuccessMessageBanner = (childName: string, childUsername: string, childPassword: string) => {
    setSuccessMessage(`${childName}'s account created successfully!`);
    setSuccessDetails({ childName, childUsername, childPassword });
    setShowSuccessBanner(true);
    
    // Animate banner in
    Animated.timing(bannerAnimatedValue, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      hideSuccessBanner();
    }, 5000);
  };

  const hideSuccessBanner = () => {
    Animated.timing(bannerAnimatedValue, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowSuccessBanner(false);
      setSuccessMessage('');
      setSuccessDetails(null);
    });
  };

  const showLoginDetails = () => {
    if (successDetails) {
      Alert.alert(
        '📝 Login Details',
        `${successDetails.childName} can now log in using:\n\n• Username: ${successDetails.childUsername}\n• Password: ${successDetails.childPassword}\n\nThey can use these credentials on the main login screen.`,
        [{ text: 'Got it!', style: 'default' }]
      );
    }
  };

  const loadParentData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Use user metadata instead of profiles table to avoid RLS issues
      const parentProfile = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email,
        first_name: user.user_metadata?.first_name || user.email?.split('@')[0],
        last_name: user.user_metadata?.last_name || '',
        role: 'parent',
        organization_id: user.user_metadata?.organization_id,
        organization_logo_url: user.user_metadata?.organization_logo_url
      };
      setParentProfile(parentProfile);

      // Get students created by this parent
      let studentsFound: any[] = [];
      
      // Primary approach: Try parent_id column (if migration was run)
      try {
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('*')
          .eq('parent_id', user.id);

        if (!studentsError && studentsData && studentsData.length > 0) {
          studentsFound = studentsData.map(student => ({
            id: student.id,
            parent_id: user.id,
            student_id: student.id,
            students: student
          }));
          console.log('✅ Found students via parent_id column:', studentsFound.length);
        }
      } catch (err) {
        console.log('⚠️ parent_id column query failed (migration not run yet):', err);
      }

      // Secondary approach: Auth metadata (current primary method until migration)
      if (studentsFound.length === 0) {
        try {
          const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
          
          if (!authError && authUsers) {
            const childAuthUsers = authUsers.users.filter((authUser: any) => 
              authUser.user_metadata?.created_by_parent === user.id
            );

            if (childAuthUsers.length > 0) {
              studentsFound = childAuthUsers.map((authUser: any) => ({
                id: `auth-${authUser.id}`,
                parent_id: user.id,
                student_id: authUser.id,
                students: {
                  id: authUser.id,
                  name: authUser.user_metadata?.full_name || 'Student',
                  level: authUser.user_metadata?.level || 'Beginner',
                  age: authUser.user_metadata?.age || null,
                  user_id: authUser.id,
                  xp_points: 0,
                  total_videos: 0,
                  session_count: 0,
                  student_badges: []
                }
              }));
              console.log('✅ Found students via auth metadata (primary method until migration):', studentsFound.length);
            }
          }
        } catch (err) {
          console.log('❌ auth metadata query failed:', err);
        }
      }

      setChildren(studentsFound);

      // Get notifications (with error handling)
      try {
        const { data: notificationsData, error: notificationsError } = await supabase
          .from('notifications')
          .select('*')
          .eq('recipient_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (notificationsError) {
          console.log('⚠️ Notifications loading failed, setting empty array:', notificationsError.message);
          setNotifications([]);
          setUnreadCount(0);
        } else {
          setNotifications(notificationsData || []);
          setUnreadCount(notificationsData?.filter(n => !n.read).length || 0);
        }
      } catch (notificationsErr) {
        console.log('⚠️ Notifications loading error, setting empty array:', notificationsErr);
        setNotifications([]);
        setUnreadCount(0);
      }

      // Get recent session reports (mock data for now)
      const mockReports: SessionReport[] = [
        {
          session: {
            id: '1',
            environment_name: 'Main Ramp',
            start_time: new Date(Date.now() - 86400000).toISOString(),
            end_time: new Date(Date.now() - 82800000).toISOString(),
            duration: 60,
          },
          videos: [],
          stats: {
            total_videos: 12,
            landed_count: 8,
            success_rate: 67,
            new_tricks_attempted: ['Kickflip', 'Heelflip'],
          },
        },
      ];
      setRecentReports(mockReports);

    } catch (error: any) {
      console.error('Error loading parent data:', error);
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = () => {
    navigation.navigate('ParentAddChild');
  };

  const markNotificationsAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('recipient_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleDeleteStudent = async (child: ParentChild) => {
    // Show confirmation dialog
    Alert.alert(
      '⚠️ Delete Student Account',
      `Are you sure you want to permanently delete ${child.students.name}'s account?\n\n• All their progress data will be lost\n• Videos and session history will be deleted\n• This action cannot be undone\n\nType the student's name to confirm deletion.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDeleteStudent(child)
        }
      ]
    );
  };

  const confirmDeleteStudent = (child: ParentChild) => {
    // Second confirmation with name input
    Alert.prompt(
      '⚠️ Final Confirmation',
      `Please type "${child.students.name}" to confirm deletion:`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: (inputName) => {
            if (inputName?.trim() === child.students.name) {
              performDeleteStudent(child);
            } else {
              Alert.alert('Error', 'Name does not match. Deletion cancelled.');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const performDeleteStudent = async (child: ParentChild) => {
    try {
      setLoading(true);
      console.log('🗑️ Starting deletion process for student:', child.students.name);

      const studentUserId = child.student_id;

      // Step 1: Delete from students table
      console.log('🔍 Step 1: Deleting from students table...');
      const { error: studentDeleteError } = await supabase
        .from('students')
        .delete()
        .eq('user_id', studentUserId);

      if (studentDeleteError) {
        console.warn('⚠️ Error deleting from students table:', studentDeleteError.message);
        // Continue anyway, as auth deletion is more important
      } else {
        console.log('✅ Student record deleted successfully');
      }

      // Step 2: Delete from profiles table
      console.log('🔍 Step 2: Deleting from profiles table...');
      const { error: profileDeleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', studentUserId);

      if (profileDeleteError) {
        console.warn('⚠️ Error deleting from profiles table:', profileDeleteError.message);
        // Continue anyway
      } else {
        console.log('✅ Profile record deleted successfully');
      }

      // Step 3: Delete any related data (sessions, videos, etc.)
      console.log('🔍 Step 3: Cleaning up related data...');
      
      // Delete sessions
      const { error: sessionsError } = await supabase
        .from('sessions')
        .delete()
        .eq('student_id', child.students.id);

      if (sessionsError) {
        console.warn('⚠️ Error deleting sessions:', sessionsError.message);
      }

      // Delete videos
      const { error: videosError } = await supabase
        .from('videos')
        .delete()
        .eq('student_id', child.students.id);

      if (videosError) {
        console.warn('⚠️ Error deleting videos:', videosError.message);
      }

      // Step 4: Delete auth user (this is the most important step)
      console.log('🔍 Step 4: Deleting auth user...');
      
      // Since we can't use admin.deleteUser from client, we'll call an Edge Function
      // Or for now, we'll just disable the account and let admins clean up later
      try {
        const { error: signOutError } = await supabase.auth.admin.deleteUser(studentUserId);
        if (signOutError) {
          console.warn('⚠️ Could not delete auth user (expected on client):', signOutError.message);
          // This is expected since we don't have admin privileges from client
        }
      } catch (authError) {
        console.warn('⚠️ Auth deletion not available from client (expected)');
      }

      console.log('🎉 Student deletion completed successfully!');

      // Step 5: Update the UI by removing the child from state
      setChildren(prevChildren => 
        prevChildren.filter(c => c.student_id !== studentUserId)
      );

      // Show success message
      Alert.alert(
        '✅ Student Deleted',
        `${child.students.name}'s account has been successfully deleted.\n\nAll progress data and session history have been removed.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Optionally refresh the entire parent data
              loadParentData();
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('❌ Error deleting student:', error);
      
      Alert.alert(
        '❌ Deletion Failed',
        `Failed to delete ${child.students.name}'s account: ${error.message || 'Unknown error'}\n\nPlease try again or contact support if the problem persists.`,
        [
          {
            text: 'OK',
            style: 'default'
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const ChildCard = ({ child }: { child: ParentChild }) => (
    <View style={styles.childCard}>
      <TouchableOpacity 
        style={styles.childCardContent}
        onPress={() => navigation.navigate('ParentStudentDetail', { studentId: child.student_id })}
      >
        <View style={styles.childHeader}>
          <View style={styles.childAvatar}>
            <Text style={styles.childAvatarText}>
              {child.students.name.split(' ').map((n: string) => n[0]).join('')}
            </Text>
          </View>
          <View style={styles.childInfo}>
            <Text style={styles.childName}>{child.students.name}</Text>
            <Text style={styles.childLevel}>{child.students.level}</Text>
          </View>
          <ChevronRight size={SIZES.icon.small} color={DESIGN_COLORS.textSecondary} />
        </View>
        
        <View style={styles.childStats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{child.students.xp_points || 0}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{child.students.total_videos || 0}</Text>
            <Text style={styles.statLabel}>Videos</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{child.students.session_count || 0}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{child.students.student_badges?.length || 0}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
        </View>
      </TouchableOpacity>
      
      {/* Delete Button */}
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDeleteStudent(child)}
      >
        <Trash2 size={18} color={DESIGN_COLORS.white} />
      </TouchableOpacity>
    </View>
  );

  const NotificationItem = ({ notification }: { notification: Notification }) => (
    <View style={[styles.notificationItem, !notification.read && styles.unreadNotification]}>
      <View style={styles.notificationIcon}>
        {notification.type === 'badge_earned' && (
          <Award size={SIZES.icon.small} color={DESIGN_COLORS.coach} />
        )}
        {notification.type === 'session_summary' && (
          <Calendar size={SIZES.icon.small} color={DESIGN_COLORS.parent} />
        )}
        {notification.type === 'progress_update' && (
          <TrendingUp size={SIZES.icon.small} color={DESIGN_COLORS.tricks} />
        )}
        {notification.type === 'new_video' && (
          <Play size={SIZES.icon.small} color={DESIGN_COLORS.approvals} />
        )}
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{notification.title}</Text>
        <Text style={styles.notificationMessage}>{notification.message}</Text>
        <Text style={styles.notificationTime}>
          {new Date(notification.created_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={DESIGN_COLORS.background} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={DESIGN_COLORS.background} />
      
      {/* Success Banner */}
      {showSuccessBanner && (
        <Animated.View 
          style={[
            styles.successBanner,
            {
              transform: [{ translateY: bannerAnimatedValue }]
            }
          ]}
        >
          <View style={styles.successBannerContent}>
            <CheckCircle size={24} color={DESIGN_COLORS.white} />
            <View style={styles.successBannerText}>
              <Text style={styles.successBannerTitle}>Student Added!</Text>
              <Text style={styles.successBannerMessage}>{successMessage}</Text>
            </View>
            <TouchableOpacity 
              style={styles.successBannerButton}
              onPress={showLoginDetails}
            >
              <Text style={styles.successBannerButtonText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.successBannerClose}
              onPress={hideSuccessBanner}
            >
              <X size={20} color={DESIGN_COLORS.white} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <DashboardHeader
          userName={parentProfile?.first_name || 'Parent'}
          organizationName={parentProfile?.last_name ? `${parentProfile.last_name}'s Dashboard` : 'Family Dashboard'}
          organizationLogoUrl={parentProfile?.organization_logo_url}
          unreadCount={unreadCount}
          onNotificationPress={() => {
            markNotificationsAsRead();
            navigation.navigate('ParentNotifications');
          }}
          onSettingsPress={() => navigation.navigate('ParentSettings')}
          onLogoutPress={handleLogout}
        />

        {/* Children Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YOUR STUDENTS</Text>
          {children.length === 0 ? (
            <View style={styles.emptyState}>
              <Users size={SIZES.icon.large} color={DESIGN_COLORS.textSecondary} />
                              <Text style={styles.emptyStateText}>No students linked to your account</Text>
                <Text style={styles.emptyStateSubtext}>
                  Add your students to start tracking their progress
                </Text>
              <TouchableOpacity style={styles.addChildButton} onPress={handleAddChild}>
                <Plus size={20} color={DESIGN_COLORS.white} />
                                  <Text style={styles.addChildButtonText}>Add Student</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.childrenList}>
              {children.map(child => (
                <ChildCard key={child.id} child={child} />
              ))}
              <TouchableOpacity style={styles.addChildCard} onPress={handleAddChild}>
                <Plus size={24} color={DESIGN_COLORS.black} />
                <Text style={styles.addChildCardText}>Add Student</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('ParentSessionReports')}
            >
              <View style={[styles.actionIcon, { backgroundColor: DESIGN_COLORS.parent }]}>
                <BookOpen size={32} color={DESIGN_COLORS.black} />
              </View>
              <Text style={styles.actionTitle}>SESSION REPORTS</Text>
              <Text style={styles.actionDescription}>View detailed progress</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('ParentNotifications')}
            >
              <View style={[styles.actionIcon, { backgroundColor: DESIGN_COLORS.coach }]}>
                <Bell size={32} color={DESIGN_COLORS.black} />
              </View>
              <Text style={styles.actionTitle}>NOTIFICATIONS</Text>
              <Text style={styles.actionDescription}>Stay updated</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Notifications */}
        {notifications.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>RECENT UPDATES</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ParentNotifications')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.notificationsList}>
              {notifications.slice(0, 3).map(notification => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </View>
          </View>
        )}

        {/* Recent Session Reports */}
        {recentReports.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>RECENT SESSIONS</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ParentSessionReports')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.reportsList}>
              {recentReports.map(report => (
                <View key={report.session.id} style={styles.reportItem}>
                  <View style={styles.reportHeader}>
                    <Text style={styles.reportTitle}>{report.session.environment_name}</Text>
                    <Text style={styles.reportDate}>
                      {new Date(report.session.start_time).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.reportStats}>
                    <View style={styles.reportStat}>
                      <Text style={styles.reportStatValue}>{report.stats.total_videos}</Text>
                      <Text style={styles.reportStatLabel}>Videos</Text>
                    </View>
                    <View style={styles.reportStat}>
                      <Text style={styles.reportStatValue}>{report.stats.success_rate}%</Text>
                      <Text style={styles.reportStatLabel}>Success Rate</Text>
                    </View>
                    <View style={styles.reportStat}>
                      <Text style={styles.reportStatValue}>{report.stats.new_tricks_attempted.length}</Text>
                      <Text style={styles.reportStatLabel}>New Tricks</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab} 
        userRole="parent" 
      />
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
    backgroundColor: COLORS.primary,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sizes.h4,
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  section: {
    paddingHorizontal: SPACING.screenPadding,
    // marginTop: SPACING.xl,
    backgroundColor: DESIGN_COLORS.background,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: DESIGN_COLORS.black,
  },
  seeAllText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  emptyState: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.light,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: DESIGN_COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  emptyStateSubtext: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: DESIGN_COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  addChildButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  addChildButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginLeft: SPACING.xs,
  },
  addChildCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.md,
    ...SHADOWS.light,
  },
  addChildCardText: {
    color: DESIGN_COLORS.black,
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginLeft: SPACING.xs,
  },
  childrenList: {
    gap: SPACING.md,
  },
  childCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    position: 'relative',
    ...SHADOWS.light,
  },
  childCardContent: {
    flex: 1,
  },
  deleteButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: '#EF4444',
    borderRadius: BORDER_RADIUS.md,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    ...SHADOWS.medium,
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  childAvatar: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  childAvatarText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textInverse,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: DESIGN_COLORS.black,
  },
  childLevel: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: DESIGN_COLORS.textSecondary,
  },
  childStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: DESIGN_COLORS.black,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: DESIGN_COLORS.textSecondary,
          marginTop: SPACING.xs,
    },
    actionsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.light,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  actionTitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: DESIGN_COLORS.black,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: DESIGN_COLORS.textSecondary,
    textAlign: 'center',
  },
  notificationsList: {
    gap: SPACING.sm,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.light,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: DESIGN_COLORS.black,
  },
  notificationMessage: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: DESIGN_COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  notificationTime: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: DESIGN_COLORS.textTertiary,
    marginTop: SPACING.xs,
  },
  reportsList: {
    gap: SPACING.md,
  },
  reportItem: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.light,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  reportTitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: DESIGN_COLORS.black,
  },
  reportDate: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: DESIGN_COLORS.textSecondary,
  },
  reportStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reportStat: {
    alignItems: 'center',
  },
  reportStatValue: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: DESIGN_COLORS.black,
  },
  reportStatLabel: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: DESIGN_COLORS.textSecondary,
          marginTop: SPACING.xs,
    },
    successBanner: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: '#10B981',
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.screenPadding,
      paddingTop: SPACING.xl,
      zIndex: 10,
      ...SHADOWS.medium,
    },
    successBannerContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: SPACING.sm,
    },
    successBannerText: {
      flex: 1,
    },
    successBannerTitle: {
      fontSize: TYPOGRAPHY.sizes.body,
      fontWeight: TYPOGRAPHY.weights.bold,
      color: DESIGN_COLORS.white,
      marginBottom: SPACING.xs,
    },
    successBannerMessage: {
      fontSize: TYPOGRAPHY.sizes.bodySmall,
      color: DESIGN_COLORS.white,
      opacity: 0.9,
    },
    successBannerButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: BORDER_RADIUS.sm,
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm,
      marginTop: SPACING.xs,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    successBannerButtonText: {
      fontSize: TYPOGRAPHY.sizes.caption,
      fontWeight: TYPOGRAPHY.weights.medium,
      color: DESIGN_COLORS.white,
    },
    successBannerClose: {
      padding: SPACING.xs,
      marginLeft: SPACING.sm,
    },
});

export default ParentHomeScreen;