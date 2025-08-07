import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Target, CheckCircle, Clock } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';

interface StudentTricksGoalsProps {
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

const StudentTricksGoals: React.FC<StudentTricksGoalsProps> = ({ student }) => {
  // Mock data for tricks/goals
  const activeTricks = [
    { id: '1', name: 'Kickflip', difficulty: 'Intermediate', progress: 75, daysActive: 12 },
    { id: '2', name: 'Frontside 180', difficulty: 'Beginner', progress: 90, daysActive: 5 },
    { id: '3', name: 'Heel Flip', difficulty: 'Advanced', progress: 30, daysActive: 20 },
  ];

  const completedTricks = [
    { id: '4', name: 'Ollie', difficulty: 'Beginner', completedDays: 30 },
    { id: '5', name: 'Shuvit', difficulty: 'Beginner', completedDays: 15 },
    { id: '6', name: 'Manual', difficulty: 'Intermediate', completedDays: 8 },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return COLORS.warning;
      case 'Intermediate':
        return COLORS.accentBlue;
      case 'Advanced':
        return COLORS.success;
      default:
        return COLORS.textSecondary;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Tricks & Goals</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Goals ({activeTricks.length})</Text>
        {activeTricks.map((trick) => (
          <View key={trick.id} style={styles.trickCard}>
            <View style={styles.trickHeader}>
              <View style={styles.trickInfo}>
                <Text style={styles.trickName}>{trick.name}</Text>
                <View style={styles.trickMeta}>
                  <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(trick.difficulty) }]}>
                    <Text style={styles.difficultyText}>{trick.difficulty}</Text>
                  </View>
                  <View style={styles.daysActive}>
                    <Clock size={SIZES.icon.small} color={COLORS.textSecondary} />
                    <Text style={styles.daysText}>{trick.daysActive} days</Text>
                  </View>
                </View>
              </View>
              <Target size={SIZES.icon.medium} color={COLORS.eleveBlue} />
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${trick.progress}%` }]} 
                />
              </View>
              <Text style={styles.progressText}>{trick.progress}%</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Completed Tricks ({completedTricks.length})</Text>
        {completedTricks.map((trick) => (
          <View key={trick.id} style={styles.completedTrickCard}>
            <View style={styles.trickHeader}>
              <View style={styles.trickInfo}>
                <Text style={styles.trickName}>{trick.name}</Text>
                <View style={styles.trickMeta}>
                  <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(trick.difficulty) }]}>
                    <Text style={styles.difficultyText}>{trick.difficulty}</Text>
                  </View>
                  <Text style={styles.completedText}>Completed {trick.completedDays} days ago</Text>
                </View>
              </View>
              <CheckCircle size={SIZES.icon.medium} color={COLORS.success} />
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.addGoalButton}>
        <Target size={SIZES.icon.medium} color={COLORS.white} />
        <Text style={styles.addGoalText}>Assign New Trick Goal</Text>
      </TouchableOpacity>
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
  trickCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  completedTrickCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  trickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  trickInfo: {
    flex: 1,
  },
  trickName: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  trickMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  difficultyBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  difficultyText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  daysActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  daysText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
  },
  completedText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.eleveBlue,
  },
  progressText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  addGoalButton: {
    backgroundColor: COLORS.eleveBlue,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  addGoalText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
});

export default StudentTricksGoals; 