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
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  Bell, 
  CheckCircle, 
  Circle, 
  Award, 
  Calendar, 
  TrendingUp, 
  Play,
  Users,
  Settings,
  MoreHorizontal,
  Trash2,
  Check
} from 'lucide-react-native';
import { RootStackParamList, Notification } from '../../../shared/types';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';
import { supabase } from '../../../shared/lib/supabase';

type ParentNotificationsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ParentNotifications'>;

const ParentNotificationsScreen: React.FC = () => {
  const navigation = useNavigation<ParentNotificationsNavigationProp>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Get notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (notificationsError) throw notificationsError;

             // If no notifications exist, create some mock data for demonstration
       if (!notificationsData || notificationsData.length === 0) {
         const mockNotifications: Notification[] = [
           {
             id: '1',
             type: 'badge_earned',
             title: 'New Badge Earned!',
             message: 'Your child earned the "First Kickflip" badge! 🛹',
             data: { badge_name: 'First Kickflip', child_name: 'Alex' },
             read: false,
             created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
           },
           {
             id: '2',
             type: 'session_summary',
             title: 'Session Complete',
             message: 'Alex completed a 60-minute session at Main Ramp with 75% success rate.',
             data: { session_id: '123', environment: 'Main Ramp', success_rate: 75 },
             read: false,
             created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
           },
           {
             id: '3',
             type: 'progress_update',
             title: 'Progress Milestone',
             message: 'Alex has landed 50 tricks this month! Keep up the great work!',
             data: { milestone: '50_tricks', child_name: 'Alex' },
             read: true,
             created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
           },
           {
             id: '4',
             type: 'new_video',
             title: 'New Video Available',
             message: 'A new video of Alex practicing kickflips is available for review.',
             data: { video_id: '456', child_name: 'Alex', trick_name: 'Kickflip' },
             read: true,
             created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
           },
           {
             id: '5',
             type: 'badge_earned',
             title: 'Consistency Badge',
             message: 'Alex earned the "5 Sessions" badge for attending 5 sessions this month!',
             data: { badge_name: '5 Sessions', child_name: 'Alex' },
             read: true,
             created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
           },
         ];
        setNotifications(mockNotifications);
      } else {
        setNotifications(notificationsData);
      }

    } catch (error: any) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('recipient_id', user.id);

      if (error) throw error;

      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId)
      );
    } catch (error: any) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'badge_earned':
        return <Award size={SIZES.icon.medium} color={COLORS.warning} />;
      case 'session_summary':
        return <Calendar size={SIZES.icon.medium} color={COLORS.primary} />;
      case 'progress_update':
        return <TrendingUp size={SIZES.icon.medium} color={COLORS.success} />;
      case 'new_video':
        return <Play size={SIZES.icon.medium} color={COLORS.secondary} />;
      default:
        return <Bell size={SIZES.icon.medium} color={COLORS.textSecondary} />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.read);

  const unreadCount = notifications.filter(n => !n.read).length;

  const NotificationItem = ({ notification }: { notification: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !notification.read && styles.unreadNotification
      ]}
      onPress={() => {
        if (!notification.read) {
          markAsRead(notification.id);
        }
      }}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIcon}>
            {getNotificationIcon(notification.type)}
          </View>
          <View style={styles.notificationInfo}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            <Text style={styles.notificationTime}>{getTimeAgo(notification.created_at)}</Text>
          </View>
          <View style={styles.notificationActions}>
            {!notification.read && (
              <View style={styles.unreadDot} />
            )}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => deleteNotification(notification.id)}
            >
              <Trash2 size={SIZES.icon.small} color={COLORS.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.notificationMessage}>{notification.message}</Text>
      </View>
    </TouchableOpacity>
  );

  const FilterButton = ({ filterType, title }: { filterType: 'all' | 'unread', title: string }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && styles.filterButtonActive
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[
        styles.filterButtonText,
        filter === filterType && styles.filterButtonTextActive
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={SIZES.icon.medium} color={COLORS.textInverse} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={markAllAsRead}
          >
            <Check size={SIZES.icon.medium} color={COLORS.textInverse} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Filter Section */}
      <View style={styles.filterSection}>
        <View style={styles.filterButtons}>
          <FilterButton filterType="all" title="All" />
          <FilterButton filterType="unread" title="Unread" />
        </View>
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {filteredNotifications.length > 0 ? (
          <View style={styles.notificationsList}>
            {filteredNotifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Bell size={SIZES.icon.xlarge} color={COLORS.textTertiary} />
            <Text style={styles.emptyStateTitle}>
              {filter === 'unread' ? 'No Unread Notifications' : 'No Notifications'}
            </Text>
            <Text style={styles.emptyStateText}>
              {filter === 'unread' 
                ? 'You\'re all caught up! No new notifications to review.'
                : 'You\'ll receive notifications about your child\'s progress, badges, and session updates here.'
              }
            </Text>
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
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
  },
  header: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerTitleText: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textInverse,
  },
  headerBadge: {
    backgroundColor: COLORS.warning,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    minWidth: 24,
    alignItems: 'center',
  },
  headerBadgeText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textInverse,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
  },
  filterButtonTextActive: {
    color: COLORS.textInverse,
  },
  content: {
    flex: 1,
  },
  notificationsList: {
    padding: SPACING.lg,
  },
  notificationItem: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.light,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  notificationContent: {
    padding: SPACING.md,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
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
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  notificationTime: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
  },
  notificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  actionButton: {
    padding: SPACING.sm,
  },
  notificationMessage: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  emptyStateTitle: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 22,
  },
});

export default ParentNotificationsScreen; 