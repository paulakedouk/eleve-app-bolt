import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Calendar, Clock, MapPin, Users } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';

interface StudentSessionsProps {
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

const StudentSessions: React.FC<StudentSessionsProps> = ({ student }) => {
  // Mock session data
  const sessions = [
    {
      id: '1',
      date: new Date('2024-02-15'),
      duration: 60,
      location: 'Main Skate Park',
      coach: 'Elite Skating Coach',
      videos: 3,
      notes: 'Great progress on kickflips! Need to work on landing consistency.',
      status: 'completed',
    },
    {
      id: '2',
      date: new Date('2024-02-12'),
      duration: 45,
      location: 'Street Course',
      coach: 'Elite Skating Coach',
      videos: 2,
      notes: 'Worked on manual balance and board control.',
      status: 'completed',
    },
    {
      id: '3',
      date: new Date('2024-02-08'),
      duration: 90,
      location: 'Bowl Section',
      coach: 'Elite Skating Coach',
      videos: 5,
      notes: 'First bowl session - focused on carving and pumping.',
      status: 'completed',
    },
    {
      id: '4',
      date: new Date('2024-02-20'),
      duration: 60,
      location: 'Main Skate Park',
      coach: 'Elite Skating Coach',
      videos: 0,
      notes: 'Upcoming session - kickflip practice',
      status: 'scheduled',
    },
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return COLORS.success;
      case 'scheduled':
        return COLORS.eleveBlue;
      case 'cancelled':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const completedSessions = sessions.filter(s => s.status === 'completed');
  const upcomingSessions = sessions.filter(s => s.status === 'scheduled');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Sessions</Text>
      
      {upcomingSessions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
          {upcomingSessions.map((session) => (
            <View key={session.id} style={[styles.sessionCard, styles.upcomingSession]}>
              <View style={styles.sessionHeader}>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
                  <View style={styles.sessionMeta}>
                    <View style={styles.metaItem}>
                      <Clock size={SIZES.icon.small} color={COLORS.textSecondary} />
                      <Text style={styles.metaText}>{session.duration} min</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <MapPin size={SIZES.icon.small} color={COLORS.textSecondary} />
                      <Text style={styles.metaText}>{session.location}</Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(session.status) }]}>
                  <Text style={styles.statusText}>Scheduled</Text>
                </View>
              </View>
              
              <Text style={styles.sessionNotes}>{session.notes}</Text>
              
              <TouchableOpacity style={styles.sessionButton}>
                <Text style={styles.sessionButtonText}>View Details</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Session History ({completedSessions.length})</Text>
        {completedSessions.map((session) => (
          <View key={session.id} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
                <View style={styles.sessionMeta}>
                  <View style={styles.metaItem}>
                    <Clock size={SIZES.icon.small} color={COLORS.textSecondary} />
                    <Text style={styles.metaText}>{session.duration} min</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <MapPin size={SIZES.icon.small} color={COLORS.textSecondary} />
                    <Text style={styles.metaText}>{session.location}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Users size={SIZES.icon.small} color={COLORS.textSecondary} />
                    <Text style={styles.metaText}>{session.videos} videos</Text>
                  </View>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(session.status) }]}>
                <Text style={styles.statusText}>Completed</Text>
              </View>
            </View>
            
            <Text style={styles.sessionNotes}>{session.notes}</Text>
            
            <TouchableOpacity style={styles.sessionButton}>
              <Text style={styles.sessionButtonText}>View Session</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.scheduleButton}>
        <Calendar size={SIZES.icon.medium} color={COLORS.white} />
        <Text style={styles.scheduleButtonText}>Schedule New Session</Text>
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
  sessionCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  upcomingSession: {
    borderColor: COLORS.eleveBlue,
    backgroundColor: '#F0F8FF',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  sessionMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  metaText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  sessionNotes: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    fontStyle: 'italic',
  },
  sessionButton: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignSelf: 'flex-start',
  },
  sessionButtonText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  scheduleButton: {
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
  scheduleButtonText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
});

export default StudentSessions; 