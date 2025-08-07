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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Target,
  Play,
  Award,
  ChevronRight,
  Filter,
  Search,
  BarChart3,
  Users
} from 'lucide-react-native';
import { RootStackParamList, SessionReport, ParentChild } from '../../../shared/types';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';
import { supabase } from '../../../shared/lib/supabase';

type ParentSessionReportsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ParentSessionReports'>;

const ParentSessionReportsScreen: React.FC = () => {
  const navigation = useNavigation<ParentSessionReportsNavigationProp>();
  const [reports, setReports] = useState<SessionReport[]>([]);
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Get children linked to this parent
      const { data: childrenData, error: childrenError } = await supabase
        .from('parent_children')
        .select(`
          *,
          students(*)
        `)
        .eq('parent_id', user.id);

      if (childrenError) throw childrenError;

      setChildren(childrenData || []);

      // For now, using mock data - replace with actual session data later
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
        {
          session: {
            id: '2',
            environment_name: 'Street Course',
            start_time: new Date(Date.now() - 172800000).toISOString(),
            end_time: new Date(Date.now() - 169200000).toISOString(),
            duration: 45,
          },
          videos: [],
          stats: {
            total_videos: 8,
            landed_count: 6,
            success_rate: 75,
            new_tricks_attempted: ['Ollie', 'Shuvit'],
          },
        },
        {
          session: {
            id: '3',
            environment_name: 'Bowl',
            start_time: new Date(Date.now() - 259200000).toISOString(),
            end_time: new Date(Date.now() - 255600000).toISOString(),
            duration: 30,
          },
          videos: [],
          stats: {
            total_videos: 6,
            landed_count: 4,
            success_rate: 67,
            new_tricks_attempted: ['Drop In', 'Carve'],
          },
        },
      ];
      setReports(mockReports);

    } catch (error: any) {
      console.error('Error loading reports data:', error);
      Alert.alert('Error', 'Failed to load session reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterReports = (filter: 'all' | 'week' | 'month') => {
    setSelectedFilter(filter);
    // Add actual filtering logic here based on date ranges
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const ReportCard = ({ report }: { report: SessionReport }) => (
    <TouchableOpacity style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={styles.reportHeaderLeft}>
          <View style={styles.environmentIcon}>
            <Target size={SIZES.icon.medium} color={COLORS.primary} />
          </View>
          <View style={styles.reportHeaderInfo}>
            <Text style={styles.reportTitle}>{report.session.environment_name}</Text>
            <Text style={styles.reportDate}>
              {formatDate(report.session.start_time)} • {formatTime(report.session.start_time)}
            </Text>
          </View>
        </View>
        <View style={styles.reportDuration}>
          <Clock size={SIZES.icon.small} color={COLORS.textSecondary} />
          <Text style={styles.reportDurationText}>{report.session.duration}min</Text>
        </View>
      </View>

      <View style={styles.reportStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{report.stats.total_videos}</Text>
          <Text style={styles.statLabel}>Videos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{report.stats.landed_count}</Text>
          <Text style={styles.statLabel}>Landed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: getSuccessRateColor(report.stats.success_rate) }]}>
            {report.stats.success_rate}%
          </Text>
          <Text style={styles.statLabel}>Success</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{report.stats.new_tricks_attempted.length}</Text>
          <Text style={styles.statLabel}>New Tricks</Text>
        </View>
      </View>

      {report.stats.new_tricks_attempted.length > 0 && (
        <View style={styles.tricksSection}>
          <Text style={styles.tricksSectionTitle}>New Tricks Attempted:</Text>
          <View style={styles.tricksContainer}>
            {report.stats.new_tricks_attempted.map((trick, index) => (
              <View key={index} style={styles.trickBadge}>
                <Text style={styles.trickBadgeText}>{trick}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return COLORS.success;
    if (rate >= 60) return COLORS.warning;
    return COLORS.error;
  };

  const FilterButton = ({ filter, title }: { filter: 'all' | 'week' | 'month', title: string }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => filterReports(filter)}
    >
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filter && styles.filterButtonTextActive
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
          <Text style={styles.loadingText}>Loading session reports...</Text>
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
          <Text style={styles.headerTitle}>Session Reports</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton}>
              <Filter size={SIZES.icon.medium} color={COLORS.textInverse} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Stats */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIconContainer}>
                <BarChart3 size={SIZES.icon.large} color={COLORS.primary} />
              </View>
              <Text style={styles.summaryValue}>{reports.length}</Text>
              <Text style={styles.summaryLabel}>Total Sessions</Text>
            </View>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIconContainer}>
                <Play size={SIZES.icon.large} color={COLORS.secondary} />
              </View>
              <Text style={styles.summaryValue}>
                {reports.reduce((sum, report) => sum + report.stats.total_videos, 0)}
              </Text>
              <Text style={styles.summaryLabel}>Total Videos</Text>
            </View>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIconContainer}>
                <Target size={SIZES.icon.large} color={COLORS.success} />
              </View>
              <Text style={styles.summaryValue}>
                {Math.round(reports.reduce((sum, report) => sum + report.stats.success_rate, 0) / reports.length)}%
              </Text>
              <Text style={styles.summaryLabel}>Avg Success</Text>
            </View>
          </View>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterSection}>
          <View style={styles.filterButtons}>
            <FilterButton filter="all" title="All Time" />
            <FilterButton filter="week" title="This Week" />
            <FilterButton filter="month" title="This Month" />
          </View>
        </View>

        {/* Reports List */}
        <View style={styles.reportsSection}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          {reports.length > 0 ? (
            reports.map((report) => (
              <ReportCard key={report.session.id} report={report} />
            ))
          ) : (
                         <View style={styles.emptyState}>
               <Calendar size={SIZES.icon.xlarge} color={COLORS.textTertiary} />
               <Text style={styles.emptyStateTitle}>No Sessions Yet</Text>
              <Text style={styles.emptyStateText}>
                Session reports will appear here after your child attends coaching sessions.
              </Text>
            </View>
          )}
        </View>
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
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textInverse,
  },
  headerRight: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  summarySection: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.light,
  },
  summaryIconContainer: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  filterSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
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
  reportsSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  reportCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.light,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  reportHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  environmentIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  reportHeaderInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  reportDate: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  reportDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  reportDurationText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
  },
  reportStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  tricksSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  tricksSectionTitle: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  tricksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  trickBadge: {
    backgroundColor: `${COLORS.secondary}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  trickBadgeText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.secondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
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
    paddingHorizontal: SPACING.lg,
  },
});

export default ParentSessionReportsScreen; 