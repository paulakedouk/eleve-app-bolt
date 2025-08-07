import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { AlertTriangle, Shield, Calendar, FileText } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';

interface StudentInjuryLogsProps {
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

const StudentInjuryLogs: React.FC<StudentInjuryLogsProps> = ({ student }) => {
  // Mock injury data
  const activeInjuries = [
    {
      id: '1',
      type: 'Sprain',
      bodyPart: 'Right Ankle',
      severity: 'Moderate',
      date: new Date('2024-02-10'),
      expectedRecovery: new Date('2024-02-24'),
      description: 'Ankle sprain during kickflip attempt. Avoid jumping tricks.',
      restrictions: ['No jumping tricks', 'Light skateboarding only', 'Wear ankle support'],
      status: 'active',
    },
  ];

  const injuryHistory = [
    {
      id: '2',
      type: 'Bruise',
      bodyPart: 'Left Knee',
      severity: 'Minor',
      date: new Date('2024-01-15'),
      recoveredDate: new Date('2024-01-22'),
      description: 'Minor bruise from fall while learning heelflip.',
      status: 'recovered',
    },
    {
      id: '3',
      type: 'Scrape',
      bodyPart: 'Right Palm',
      severity: 'Minor',
      date: new Date('2024-01-03'),
      recoveredDate: new Date('2024-01-10'),
      description: 'Scrape from catching fall on concrete.',
      status: 'recovered',
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Minor':
        return COLORS.warning;
      case 'Moderate':
        return COLORS.eleveOrange;
      case 'Severe':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysRemaining = (date: Date) => {
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Injury Logs</Text>
      
      {/* Current Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Status</Text>
        <View style={[styles.statusCard, student.hasActiveInjury ? styles.injuredStatus : styles.healthyStatus]}>
          {student.hasActiveInjury ? (
            <>
              <AlertTriangle size={SIZES.icon.large} color={COLORS.error} />
              <Text style={styles.statusText}>Active Injury</Text>
              <Text style={styles.statusSubtext}>Requires attention</Text>
            </>
          ) : (
            <>
              <Shield size={SIZES.icon.large} color={COLORS.success} />
              <Text style={styles.statusText}>Healthy</Text>
              <Text style={styles.statusSubtext}>No active injuries</Text>
            </>
          )}
        </View>
      </View>

      {/* Active Injuries */}
      {activeInjuries.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Injuries</Text>
          {activeInjuries.map((injury) => (
            <View key={injury.id} style={styles.injuryCard}>
              <View style={styles.injuryHeader}>
                <View style={styles.injuryInfo}>
                  <Text style={styles.injuryType}>{injury.type} - {injury.bodyPart}</Text>
                  <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(injury.severity) }]}>
                    <Text style={styles.severityText}>{injury.severity}</Text>
                  </View>
                </View>
                <AlertTriangle size={SIZES.icon.medium} color={COLORS.error} />
              </View>
              
              <Text style={styles.injuryDescription}>{injury.description}</Text>
              
              <View style={styles.injuryDetails}>
                <View style={styles.detailItem}>
                  <Calendar size={SIZES.icon.small} color={COLORS.textSecondary} />
                  <Text style={styles.detailText}>Occurred: {formatDate(injury.date)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Calendar size={SIZES.icon.small} color={COLORS.textSecondary} />
                  <Text style={styles.detailText}>
                    Expected Recovery: {formatDate(injury.expectedRecovery)} ({getDaysRemaining(injury.expectedRecovery)} days)
                  </Text>
                </View>
              </View>

              <View style={styles.restrictionsSection}>
                <Text style={styles.restrictionsTitle}>Current Restrictions:</Text>
                {injury.restrictions.map((restriction, index) => (
                  <Text key={index} style={styles.restrictionItem}>• {restriction}</Text>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Injury History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Injury History ({injuryHistory.length})</Text>
        {injuryHistory.map((injury) => (
          <View key={injury.id} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <View style={styles.historyInfo}>
                <Text style={styles.historyType}>{injury.type} - {injury.bodyPart}</Text>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(injury.severity) }]}>
                  <Text style={styles.severityText}>{injury.severity}</Text>
                </View>
              </View>
              <Shield size={SIZES.icon.medium} color={COLORS.success} />
            </View>
            
            <Text style={styles.historyDescription}>{injury.description}</Text>
            
            <View style={styles.historyDetails}>
              <Text style={styles.historyDate}>
                {formatDate(injury.date)} - {formatDate(injury.recoveredDate!)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.addInjuryButton}>
        <FileText size={SIZES.icon.medium} color={COLORS.white} />
        <Text style={styles.addInjuryText}>Report New Injury</Text>
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
  statusCard: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  healthyStatus: {
    backgroundColor: '#D1FAE5',
  },
  injuredStatus: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  statusSubtext: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  injuryCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.error,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  injuryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  injuryInfo: {
    flex: 1,
  },
  injuryType: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  severityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  severityText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  injuryDescription: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    fontStyle: 'italic',
  },
  injuryDetails: {
    marginBottom: SPACING.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  detailText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
  },
  restrictionsSection: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
  },
  restrictionsTitle: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  restrictionItem: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  historyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  historyInfo: {
    flex: 1,
  },
  historyType: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  historyDescription: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    fontStyle: 'italic',
  },
  historyDetails: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  historyDate: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
  },
  addInjuryButton: {
    backgroundColor: COLORS.error,
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
  addInjuryText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
});

export default StudentInjuryLogs; 