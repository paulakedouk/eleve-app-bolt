import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../../shared/utils/constants';

interface StudentProgressOverviewProps {
  student: {
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
  };
}

const StudentProgressOverview: React.FC<StudentProgressOverviewProps> = ({ student }) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Progress Overview</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Progress</Text>
        <View style={styles.progressCard}>
          <Text style={styles.progressText}>XP Points: {student.xp}</Text>
          <Text style={styles.progressText}>Badge Level: {student.badgeLevel}</Text>
          <Text style={styles.progressText}>Skill Level: {student.level}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity Summary</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{student.totalSessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{student.totalVideos}</Text>
            <Text style={styles.statLabel}>Videos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{student.completedTricks}</Text>
            <Text style={styles.statLabel}>Completed Tricks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{student.activeTricks}</Text>
            <Text style={styles.statLabel}>Active Goals</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Achievements</Text>
        <View style={styles.achievementCard}>
          <Text style={styles.achievementText}>🏆 Reached {student.badgeLevel} level!</Text>
          <Text style={styles.achievementText}>⚡ Earned {student.xp} XP points</Text>
          <Text style={styles.achievementText}>🎯 {student.completedTricks} tricks mastered</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.screenPadding,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.h2,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    fontFamily: TYPOGRAPHY.families.poppinsBold,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  progressCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: SPACING.lg,
  },
  progressText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: SPACING.md,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  statNumber: {
    fontSize: TYPOGRAPHY.sizes.h2,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.eleveBlue,
    fontFamily: TYPOGRAPHY.families.poppinsBold,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  achievementCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: SPACING.lg,
  },
  achievementText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
});

export default StudentProgressOverview; 