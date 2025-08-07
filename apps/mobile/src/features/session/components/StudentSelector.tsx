import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Student } from '../../../shared/types';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../../shared/utils/constants';

interface StudentSelectorProps {
  students: Student[];
  selectedStudents: Student[];
  onStudentToggle: (student: Student) => void;
}

const StudentSelector: React.FC<StudentSelectorProps> = ({
  students,
  selectedStudents,
  onStudentToggle,
}) => {
  const isSelected = (student: Student) =>
    selectedStudents.some(s => s.id === student.id);

  const getLevelColor = (level: Student['level']) => {
    switch (level) {
      case 'Beginner':
        return COLORS.success;
      case 'Intermediate':
        return COLORS.badgeYellow;
      case 'Advanced':
        return COLORS.secondary;
      default:
        return COLORS.textSecondary;
    }
  };

  const getLevelEmoji = (level: Student['level']) => {
    switch (level) {
      case 'Beginner':
        return '🌱';
      case 'Intermediate':
        return '🔥';
      case 'Advanced':
        return '⚡';
      default:
        return '🛹';
    }
  };

  const renderStudent = ({ item }: { item: Student }) => {
    const selected = isSelected(item);
    
    return (
      <TouchableOpacity
        style={[styles.studentCard, selected && styles.studentCardSelected]}
        onPress={() => onStudentToggle(item)}
      >
        <View style={styles.studentInfo}>
          <View style={styles.studentHeader}>
            <Text style={[styles.studentName, selected && styles.studentNameSelected]}>
              {item.name}
            </Text>
            <View style={[styles.levelBadge, { backgroundColor: getLevelColor(item.level) }]}>
              <Text style={styles.levelEmoji}>{getLevelEmoji(item.level)}</Text>
              <Text style={styles.levelText}>{item.level}</Text>
            </View>
          </View>
          <Text style={[styles.studentAge, selected && styles.studentAgeSelected]}>
            {item.age} years old • Ready to shred! 🛹
          </Text>
        </View>
        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
          {selected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={students}
        renderItem={renderStudent}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      
      {selectedStudents.length > 0 && (
        <View style={styles.selectedCount}>
          <Text style={styles.selectedCountText}>
            🎯 {selectedStudents.length} skater{selectedStudents.length > 1 ? 's' : ''} selected
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  studentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  studentCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    ...SHADOWS.medium,
  },
  studentInfo: {
    flex: 1,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  studentName: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginRight: SPACING.sm,
  },
  studentNameSelected: {
    color: COLORS.primary,
  },
  levelBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  levelEmoji: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
  },
  levelText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  studentAge: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  studentAgeSelected: {
    color: COLORS.primary,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  separator: {
    height: SPACING.md,
  },
  selectedCount: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    alignSelf: 'center',
    marginTop: SPACING.lg,
    ...SHADOWS.medium,
  },
  selectedCountText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});

export default StudentSelector; 