import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import {
  User,
  TrendingUp,
  Video,
  MessageCircle,
  FileText,
  Award,
  UserCheck,
  UserPlus,
  Clock,
  Star,
} from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, SIZES } from '../utils/constants';

export interface StudentCardData {
  id: string;
  name: string;
  age: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  profileImage?: string;
  xp: number;
  badgeLevel: string;
  lastSessionDate?: Date;
  recentActivity?: string;
  status: 'Approved' | 'Pending' | 'Active' | 'Inactive';
  coachName?: string; // For admin/parent views
}

export interface StudentCardProps {
  student: StudentCardData;
  role: 'coach' | 'admin' | 'parent';
  onActionPress?: (action: string, studentId: string) => void;
  onCardPress?: (studentId: string) => void;
}

const StudentCard: React.FC<StudentCardProps> = ({
  student,
  role,
  onActionPress,
  onCardPress,
}) => {
  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner':
        return { bg: '#FEF3C7', color: COLORS.warning, text: COLORS.textPrimary };
      case 'Intermediate':
        return { bg: '#DBEAFE', color: COLORS.accentBlue, text: COLORS.textPrimary };
      case 'Advanced':
        return { bg: '#D1FAE5', color: COLORS.success, text: COLORS.textPrimary };
      default:
        return { bg: COLORS.surface, color: COLORS.textSecondary, text: COLORS.textPrimary };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Active':
        return { bg: '#D1FAE5', color: COLORS.success };
      case 'Pending':
        return { bg: '#FEF3C7', color: COLORS.warning };
      case 'Inactive':
        return { bg: '#FEE2E2', color: COLORS.error };
      default:
        return { bg: COLORS.surface, color: COLORS.textSecondary };
    }
  };

  const getXPProgress = () => {
    // Calculate progress to next level (every 1000 XP)
    const nextLevelXP = Math.ceil(student.xp / 1000) * 1000;
    const currentLevelXP = nextLevelXP - 1000;
    const progress = ((student.xp - currentLevelXP) / 1000) * 100;
    return Math.min(progress, 100);
  };

  const formatLastSession = () => {
    if (!student.lastSessionDate) return 'No recent sessions';
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - student.lastSessionDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const renderActionButtons = () => {
    const handleAction = (action: string) => {
      if (onActionPress) {
        onActionPress(action, student.id);
      } else {
        Alert.alert('Action', `${action} for ${student.name}`);
      }
    };

    const buttonStyle = [styles.actionButton];
    const textStyle = [styles.actionButtonText];

    switch (role) {
      case 'coach':
        return (
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={buttonStyle} 
              onPress={() => handleAction('assign_trick')}
            >
              <Star size={SIZES.icon.small} color={COLORS.accentBlue} />
              <Text style={textStyle}>Assign Trick</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={buttonStyle} 
              onPress={() => handleAction('upload_clip')}
            >
              <Video size={SIZES.icon.small} color={COLORS.elevePink} />
              <Text style={textStyle}>Upload Clip</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={buttonStyle} 
              onPress={() => handleAction('add_note')}
            >
              <FileText size={SIZES.icon.small} color={COLORS.eleveYellow} />
              <Text style={textStyle}>Add Note</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={buttonStyle} 
              onPress={() => handleAction('view_progress')}
            >
              <TrendingUp size={SIZES.icon.small} color={COLORS.success} />
              <Text style={textStyle}>Progress</Text>
            </TouchableOpacity>
          </View>
        );

      case 'parent':
        return (
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={buttonStyle} 
              onPress={() => handleAction('view_progress')}
            >
              <TrendingUp size={SIZES.icon.small} color={COLORS.success} />
              <Text style={textStyle}>View Progress</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={buttonStyle} 
              onPress={() => handleAction('latest_clip')}
            >
              <Video size={SIZES.icon.small} color={COLORS.elevePink} />
              <Text style={textStyle}>Latest Clip</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={buttonStyle} 
              onPress={() => handleAction('message_coach')}
            >
              <MessageCircle size={SIZES.icon.small} color={COLORS.accentBlue} />
              <Text style={textStyle}>Message Coach</Text>
            </TouchableOpacity>
          </View>
        );

      case 'admin':
        return (
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={buttonStyle} 
              onPress={() => handleAction('edit_profile')}
            >
              <User size={SIZES.icon.small} color={COLORS.primary} />
              <Text style={textStyle}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={buttonStyle} 
              onPress={() => handleAction('assign_coach')}
            >
              <UserPlus size={SIZES.icon.small} color={COLORS.eleveOrange} />
              <Text style={textStyle}>Assign Coach</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={buttonStyle} 
              onPress={() => handleAction('view_progress')}
            >
              <TrendingUp size={SIZES.icon.small} color={COLORS.success} />
              <Text style={textStyle}>Progress</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={buttonStyle} 
              onPress={() => handleAction('message_parent')}
            >
              <MessageCircle size={SIZES.icon.small} color={COLORS.accentBlue} />
              <Text style={textStyle}>Message Parent</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  const skillColor = getSkillLevelColor(student.level);
  const statusColor = getStatusColor(student.status);

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => onCardPress?.(student.id)}
      activeOpacity={0.8}
    >
      {/* Header with avatar and basic info */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ 
              uri: student.profileImage || 'https://eleve-native-app.s3.us-east-2.amazonaws.com/public/assets/images/eleve-avatar.svg' 
            }}
            style={styles.avatar}
          />
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor.color }]} />
          </View>
        </View>

        <View style={styles.basicInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{student.name}</Text>
            <Text style={styles.age}>{student.age}y</Text>
          </View>
          
          <View style={styles.badgesRow}>
            <View style={[styles.skillBadge, { backgroundColor: skillColor.bg }]}>
              <Text style={[styles.skillBadgeText, { color: skillColor.text }]}>
                {student.level}
              </Text>
            </View>
            <View style={styles.xpContainer}>
              <Award size={SIZES.icon.small} color={COLORS.eleveYellow} />
              <Text style={styles.xpText}>{student.xp} XP</Text>
            </View>
          </View>
        </View>
      </View>

      {/* XP Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${getXPProgress()}%` }
            ]} 
          />
        </View>
        <View style={styles.progressInfo}>
          <Text style={styles.badgeLevel}>{student.badgeLevel}</Text>
          <Text style={styles.progressPercentage}>{Math.round(getXPProgress())}%</Text>
        </View>
      </View>

      {/* Activity Info */}
      <View style={styles.activitySection}>
        <View style={styles.activityItem}>
          <Clock size={SIZES.icon.small} color={COLORS.textSecondary} />
          <Text style={styles.activityText}>{formatLastSession()}</Text>
        </View>
        {student.recentActivity && (
          <View style={styles.activityItem}>
            <Star size={SIZES.icon.small} color={COLORS.accentBlue} />
            <Text style={styles.activityText} numberOfLines={1}>
              {student.recentActivity}
            </Text>
          </View>
        )}
        {role === 'admin' && student.coachName && (
          <View style={styles.activityItem}>
            <UserCheck size={SIZES.icon.small} color={COLORS.primary} />
            <Text style={styles.activityText}>Coach: {student.coachName}</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      {renderActionButtons()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.brutalist,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: COLORS.black,
  },
  statusBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  basicInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  name: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.families.poppinsBold,
    flex: 1,
  },
  age: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  skillBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.black,
  },
  skillBadgeText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  xpText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  progressSection: {
    marginBottom: SPACING.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.eleveGreen,
    borderRadius: 3,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeLevel: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  progressPercentage: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
  },
  activitySection: {
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  activityText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
});

export default StudentCard; 