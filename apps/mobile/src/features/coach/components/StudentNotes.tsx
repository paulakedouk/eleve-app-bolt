import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { FileText, User, Calendar, MessageSquare } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';

interface StudentNotesProps {
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

const StudentNotes: React.FC<StudentNotesProps> = ({ student }) => {
  // Mock notes data
  const notes = [
    {
      id: '1',
      type: 'Session Note',
      title: 'Kickflip Progress Session',
      content: 'Great improvement in foot placement today! Alex is getting much more consistent with the flick motion. Still needs to work on committing to the landing - tends to bail out early when the rotation looks good. Recommend practicing on grass first to build confidence.',
      author: 'Elite Skating Coach',
      date: new Date('2024-02-15'),
      tags: ['kickflip', 'progress', 'confidence'],
      priority: 'normal',
    },
    {
      id: '2',
      type: 'Behavior Note',
      title: 'Focus and Attitude',
      content: 'Alex showed excellent focus and determination during today\'s session. Asked great questions about technique and was very receptive to feedback. Shows natural leadership when skating with other students.',
      author: 'Elite Skating Coach',
      date: new Date('2024-02-12'),
      tags: ['attitude', 'leadership', 'focus'],
      priority: 'positive',
    },
    {
      id: '3',
      type: 'Safety Note',
      title: 'Ankle Injury Follow-up',
      content: 'Alex reported some minor discomfort in right ankle during warm-up. Advised to take it easy on jumping tricks and focus on flow and carving exercises. Monitor closely and check with parents about any lingering pain.',
      author: 'Elite Skating Coach',
      date: new Date('2024-02-10'),
      tags: ['safety', 'injury', 'ankle'],
      priority: 'important',
    },
    {
      id: '4',
      type: 'Progress Note',
      title: 'Monthly Assessment',
      content: 'Alex has made excellent progress this month. Kickflip consistency up to about 6/10 attempts. Balance and board control have improved significantly. Ready to start working on heelflips next month. Great attitude and work ethic.',
      author: 'Elite Skating Coach',
      date: new Date('2024-02-01'),
      tags: ['assessment', 'monthly', 'progress'],
      priority: 'normal',
    },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Session Note':
        return COLORS.eleveBlue;
      case 'Behavior Note':
        return COLORS.success;
      case 'Safety Note':
        return COLORS.error;
      case 'Progress Note':
        return COLORS.warning;
      default:
        return COLORS.textSecondary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'important':
        return COLORS.error;
      case 'positive':
        return COLORS.success;
      case 'normal':
        return COLORS.textSecondary;
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Session Note':
        return FileText;
      case 'Behavior Note':
        return User;
      case 'Safety Note':
        return MessageSquare;
      case 'Progress Note':
        return Calendar;
      default:
        return FileText;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Coaching Notes</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Notes ({notes.length})</Text>
        {notes.map((note) => {
          const TypeIcon = getTypeIcon(note.type);
          return (
            <View key={note.id} style={styles.noteCard}>
              <View style={styles.noteHeader}>
                <View style={styles.noteInfo}>
                  <View style={styles.noteTitleRow}>
                    <TypeIcon size={SIZES.icon.small} color={getTypeColor(note.type)} />
                    <Text style={styles.noteTitle}>{note.title}</Text>
                  </View>
                  <View style={styles.noteMeta}>
                    <View style={[styles.typeBadge, { backgroundColor: getTypeColor(note.type) }]}>
                      <Text style={styles.typeText}>{note.type}</Text>
                    </View>
                    {note.priority !== 'normal' && (
                      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(note.priority) }]}>
                        <Text style={styles.priorityText}>{note.priority}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.noteDate}>{formatDate(note.date)}</Text>
              </View>
              
              <Text style={styles.noteContent}>{note.content}</Text>
              
              <View style={styles.noteFooter}>
                <View style={styles.tags}>
                  {note.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.noteAuthor}>by {note.author}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <TouchableOpacity style={styles.addNoteButton}>
        <FileText size={SIZES.icon.medium} color={COLORS.white} />
        <Text style={styles.addNoteText}>Add New Note</Text>
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
  noteCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  noteInfo: {
    flex: 1,
  },
  noteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  noteTitle: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  noteMeta: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  typeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  typeText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  priorityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  priorityText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
    textTransform: 'uppercase',
  },
  noteDate: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
  },
  noteContent: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.lineHeights.body,
    marginBottom: SPACING.md,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    flex: 1,
  },
  tag: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  tagText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
  },
  noteAuthor: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  addNoteButton: {
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
  addNoteText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
});

export default StudentNotes; 