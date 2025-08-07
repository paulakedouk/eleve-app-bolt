import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { 
  Home, 
  Share2, 
  Download, 
  Clock, 
  Users, 
  PlayCircle,
  CheckCircle,
  XCircle,
  Trophy,
  TrendingUp
} from 'lucide-react-native';
import { RootStackParamList, Student } from '../../../shared/types';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';

type SessionSummaryNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SessionSummary'>;

const SessionSummaryScreen: React.FC = () => {
  const navigation = useNavigation<SessionSummaryNavigationProp>();
  const route = useRoute();
  const { environment, environmentName, students, videos, duration } = route.params as {
    environment: string;
    environmentName: string;
    students: Student[];
    videos: any[];
    duration: number;
  };

  const landedVideos = videos.filter(v => v.landed).length;
  const tryingVideos = videos.filter(v => !v.landed).length;
  const successRate = videos.length > 0 ? Math.round((landedVideos / videos.length) * 100) : 0;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Session Summary: ${environmentName}\n${students.length} students, ${videos.length} videos, ${duration} minutes\nSuccess rate: ${successRate}%`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleExport = () => {
    console.log('Exporting session...');
  };

  const StatCard = ({ icon: Icon, value, label, color = COLORS.textPrimary }: { icon: any; value: any; label: any; color?: string }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Icon size={SIZES.icon.medium} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Trophy size={SIZES.icon.xlarge} color={COLORS.primary} />
          </View>
          <Text style={styles.headerTitle}>Session Complete!</Text>
          <Text style={styles.headerSubtitle}>
            {environmentName} • {new Date().toLocaleDateString()}
          </Text>
        </View>

        {/* Main Stats */}
        <View style={styles.section}>
          <View style={styles.statsGrid}>
            <StatCard
              icon={Clock}
              value={`${duration}m`}
              label="Duration"
              color={COLORS.secondary}
            />
            <StatCard
              icon={Users}
              value={students.length.toString()}
              label="Students"
              color={COLORS.primary}
            />
            <StatCard
              icon={PlayCircle}
              value={videos.length.toString()}
              label="Videos"
              color={COLORS.textPrimary}
            />
          </View>
        </View>

        {/* Success Rate */}
        <View style={styles.section}>
          <View style={styles.successCard}>
            <View style={styles.successHeader}>
              <TrendingUp size={SIZES.icon.large} color={COLORS.success} />
              <View style={styles.successContent}>
                <Text style={styles.successRate}>{successRate}%</Text>
                <Text style={styles.successLabel}>Success Rate</Text>
              </View>
            </View>
            <View style={styles.successBreakdown}>
              <View style={styles.successItem}>
                <CheckCircle size={SIZES.icon.small} color={COLORS.success} />
                <Text style={styles.successText}>{landedVideos} Landed</Text>
              </View>
              <View style={styles.successItem}>
                <XCircle size={SIZES.icon.small} color={COLORS.warning} />
                <Text style={styles.successText}>{tryingVideos} Trying</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Students Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Students</Text>
          <View style={styles.studentsGrid}>
            {students.map(student => (
              <View key={student.id} style={styles.studentCard}>
                <View style={styles.studentAvatar}>
                  <Text style={styles.studentInitials}>
                    {student.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentStats}>
                  {videos.filter(v => v.students.some((s: any) => s.id === student.id)).length} videos
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Session Notes */}
        <View style={styles.section}>
          <View style={styles.notesCard}>
            <Text style={styles.notesTitle}>Session Highlights</Text>
            <Text style={styles.notesText}>
              Great energy today! Students showed excellent progression in their technique. 
              Focus on consistency in the next session.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
          <Share2 size={SIZES.icon.medium} color={COLORS.textPrimary} />
          <Text style={styles.secondaryButtonText}>Share</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={handleExport}>
          <Download size={SIZES.icon.medium} color={COLORS.textPrimary} />
          <Text style={styles.secondaryButtonText}>Export</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={() => navigation.navigate('Home')}
        >
          <Home size={SIZES.icon.medium} color={COLORS.textInverse} />
          <Text style={styles.primaryButtonText}>Done</Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.h1,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  section: {
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.screenPadding,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
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
    fontSize: TYPOGRAPHY.sizes.h2,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  successCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.light,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  successContent: {
    marginLeft: SPACING.md,
  },
  successRate: {
    fontSize: TYPOGRAPHY.sizes.h1,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.success,
  },
  successLabel: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  successBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  successItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  successText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  studentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  studentCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.light,
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
  studentInitials: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  studentName: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  studentStats: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
  },
  notesCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  notesTitle: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  notesText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.lineHeights.body,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    ...SHADOWS.medium,
  },
  primaryButtonText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textInverse,
    marginLeft: SPACING.sm,
  },
});

export default SessionSummaryScreen;
