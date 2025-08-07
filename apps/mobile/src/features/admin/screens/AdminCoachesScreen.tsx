import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ChevronDown,
  ChevronUp,
  Users,
  UserPlus,
  Settings,
  Mail,
  Star,
  Trophy,
  X,
} from 'lucide-react-native';
import { RootStackParamList } from '../../../shared/types';
import {
  getOrganizationCoaches,
  getAdminProfile,
  AdminProfile,
} from '../../../shared/services/adminService';
import { BottomNavigation } from '../../../shared/components/BottomNavigation';
import BackButton from '../../../shared/components/BackButton';

type AdminCoachesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AdminCoaches'>;
type AdminCoachesScreenProps = NativeStackScreenProps<RootStackParamList, 'AdminCoaches'>;

// Design system colors (matching AdminHomeScreen)
const DESIGN_COLORS = {
  coach: '#FFC900',
  parent: '#91A8EB', 
  partners: '#55C1C3',
  approvals: '#FF5A34',
  tricks: '#91DEF1',
  black: '#000000',
  white: '#FFFFFF',
  background: '#eeeeee',
  text: '#000000',
  textSecondary: '#000',
  border: '#E5E7EB',
};

// Typography styles
const TYPOGRAPHY = {
  sectionTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    fontWeight: "500" as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  buttonTitle: {
    fontFamily: 'ArchivoBlack-Regular',
    fontSize: 18,
    fontWeight: "900" as const,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontFamily: 'ArchivoBlack-Regular',
    fontSize: 16,
    fontWeight: "900" as const,
    textTransform: 'uppercase',
  },
  bodyText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    fontWeight: "500" as const,
  },
};

interface Coach {
  id: string;
  organization_id: string;
  specialties: string[];
  certification_level: string | null;
  bio: string | null;
  user: {
    email: string;
    raw_user_meta_data: {
      full_name: string;
      avatar_url?: string;
    };
  };
  assigned_students: {
    student: {
      id: string;
      full_name: string;
      profile_image: string | null;
      xp_points: number;
      skill_level: string;
      age: number | null;
    };
  }[];
}

interface CoachCardProps {
  coach: Coach;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onViewProfile: () => void;
  onManageStudents: () => void;
}

interface StudentListModalProps {
  visible: boolean;
  coach: Coach | null;
  onClose: () => void;
}

interface StudentItemProps {
  student: {
    id: string;
    full_name: string;
    profile_image: string | null;
    xp_points: number;
    skill_level: string;
    age: number | null;
  };
}

const AdminCoachesScreen: React.FC = () => {
  const navigation = useNavigation<AdminCoachesScreenNavigationProp>();
  const route = useRoute<AdminCoachesScreenProps['route']>();
  const { organizationId } = route.params;
  
  console.log('🏢 AdminCoachesScreen - Organization ID:', organizationId);
  
  const [activeTab] = useState('Coaches');
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCoaches, setExpandedCoaches] = useState<Set<string>>(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [profileData, coachesData] = await Promise.all([
        getAdminProfile(),
        getOrganizationCoaches(organizationId)
      ]);

      console.log('🏢 Admin Profile:', profileData);
      console.log('👨‍🏫 Coaches Data:', JSON.stringify(coachesData, null, 2));
      console.log('📊 Number of coaches found:', coachesData.length);

      setAdminProfile(profileData);
      setCoaches(coachesData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load coaches data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadData(true);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const toggleCoachExpanded = (coachId: string) => {
    const newExpanded = new Set(expandedCoaches);
    if (newExpanded.has(coachId)) {
      newExpanded.delete(coachId);
    } else {
      newExpanded.add(coachId);
    }
    setExpandedCoaches(newExpanded);
  };

  const handleViewProfile = (coach: Coach) => {
    Alert.alert('Coach Profile', `View profile for ${coach.user.raw_user_meta_data.full_name}`);
  };

  const handleManageStudents = (coach: Coach) => {
    setSelectedCoach(coach);
    setModalVisible(true);
  };

  const getSkillLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return DESIGN_COLORS.tricks;
      case 'intermediate': return DESIGN_COLORS.coach;
      case 'advanced': return DESIGN_COLORS.approvals;
      default: return DESIGN_COLORS.partners;
    }
  };

  const getSkillLevelEmoji = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return '🌱';
      case 'intermediate': return '🔥';
      case 'advanced': return '⚡';
      default: return '🛹';
    }
  };

  const StudentItem: React.FC<StudentItemProps> = ({ student }) => (
    <View style={styles.studentItem}>
      <View style={styles.studentImageContainer}>
        {student.profile_image ? (
          <Image source={{ uri: student.profile_image }} style={styles.studentImage as any} />
                 ) : (
           <View style={styles.placeholderImageSmall}>
             <Text style={styles.placeholderTextSmall}>
               {student.full_name.split(' ').map(n => n[0]).join('')}
             </Text>
           </View>
         )}
      </View>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{student.full_name}</Text>
        <View style={styles.studentMeta}>
          <View style={[styles.skillBadge, { backgroundColor: getSkillLevelColor(student.skill_level) }]}>
            <Text style={styles.skillBadgeText}>
              {getSkillLevelEmoji(student.skill_level)} {student.skill_level}
            </Text>
          </View>
          <View style={styles.xpContainer}>
            <Trophy size={14} color={DESIGN_COLORS.coach} />
            <Text style={styles.xpText}>{student.xp_points} XP</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const CoachCard: React.FC<CoachCardProps> = ({ 
    coach, 
    isExpanded, 
    onToggleExpanded, 
    onViewProfile, 
    onManageStudents 
  }) => (
    <View style={styles.coachCard}>
      {/* Coach Header */}
      <View style={styles.coachHeader}>
        <View style={styles.coachImageContainer}>
          {coach.user.raw_user_meta_data.avatar_url ? (
            <Image 
              source={{ uri: coach.user.raw_user_meta_data.avatar_url }} 
              style={styles.coachImage as any} 
            />
                     ) : (
             <View style={styles.placeholderImageLarge}>
               <Text style={styles.placeholderText}>
                 {coach.user.raw_user_meta_data.full_name.split(' ').map(n => n[0]).join('')}
               </Text>
             </View>
           )}
        </View>
        <View style={styles.coachInfo}>
          <Text style={styles.coachName}>{coach.user.raw_user_meta_data.full_name}</Text>
          <Text style={styles.coachEmail}>{coach.user.email}</Text>
          <View style={styles.studentCount}>
            <Users size={16} color={DESIGN_COLORS.textSecondary} />
            <Text style={styles.studentCountText}>
              {coach.assigned_students.length} student{coach.assigned_students.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.expandButton} onPress={onToggleExpanded}>
          {isExpanded ? (
            <ChevronUp size={24} color={DESIGN_COLORS.black} />
          ) : (
            <ChevronDown size={24} color={DESIGN_COLORS.black} />
          )}
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={onViewProfile}>
          <Settings size={16} color={DESIGN_COLORS.black} />
          <Text style={styles.actionButtonText}>View Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryActionButton]} 
          onPress={onManageStudents}
        >
          <UserPlus size={16} color={DESIGN_COLORS.black} />
          <Text style={[styles.actionButtonText, styles.primaryActionButtonText]}>
            Manage Students
          </Text>
        </TouchableOpacity>
      </View>

      {/* Expanded Students List */}
      {isExpanded && (
        <View style={styles.studentsContainer}>
          <Text style={styles.studentsTitle}>ASSIGNED STUDENTS</Text>
          {coach.assigned_students.length > 0 ? (
            coach.assigned_students.map((assignment, index) => (
              <StudentItem key={assignment.student.id} student={assignment.student} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No students assigned yet</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  const StudentListModal: React.FC<StudentListModalProps> = ({ visible, coach, onClose }) => (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {coach?.user.raw_user_meta_data.full_name}'s Students
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={DESIGN_COLORS.black} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalContent}>
          {coach?.assigned_students.map((assignment) => (
            <StudentItem key={assignment.student.id} student={assignment.student} />
          ))}
          {coach?.assigned_students.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No students assigned</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DESIGN_COLORS.black} />
          <Text style={styles.loadingText}>Loading coaches...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={DESIGN_COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <BackButton
          onPress={handleBack}
          variant="simple"
          title=""
          iconSize={20}
          iconColor={DESIGN_COLORS.black}
          style={styles.backButton}
        />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>COACHES</Text>
          {/* <Text style={styles.headerSubtitle}>
            {coaches.length} coach{coaches.length !== 1 ? 'es' : ''} in your organization
          </Text> */}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[DESIGN_COLORS.black]}
            tintColor={DESIGN_COLORS.black}
          />
        }
      >
        {coaches.length > 0 ? (
          coaches.map((coach) => (
            <CoachCard
              key={coach.id}
              coach={coach}
              isExpanded={expandedCoaches.has(coach.id)}
              onToggleExpanded={() => toggleCoachExpanded(coach.id)}
              onViewProfile={() => handleViewProfile(coach)}
              onManageStudents={() => handleManageStudents(coach)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Coaches Yet</Text>
            <Text style={styles.emptyStateText}>
              Invite coaches to your organization to get started
            </Text>
            <TouchableOpacity 
              style={styles.inviteButton}
              onPress={() => navigation.navigate('InviteCoach', { organizationId })}
            >
              <Text style={styles.inviteButtonText}>INVITE COACH</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Student List Modal */}
      <StudentListModal
        visible={modalVisible}
        coach={selectedCoach}
        onClose={() => setModalVisible(false)}
      />

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab} 
        userRole="admin" 
        organizationId={organizationId} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: DESIGN_COLORS.textSecondary,
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 44, // Same width as back button to center content
  },
  headerTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    fontWeight: '500' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    color: DESIGN_COLORS.black,
    marginBottom: 4,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 100,
  },
  coachCard: {
    backgroundColor: DESIGN_COLORS.white,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: DESIGN_COLORS.black,
    shadowColor: DESIGN_COLORS.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  coachImageContainer: {
    marginRight: 12,
  },
  coachImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: DESIGN_COLORS.black,
  },
     placeholderImageLarge: {
     width: 60,
     height: 60,
     borderRadius: 30,
     backgroundColor: DESIGN_COLORS.coach,
     borderWidth: 2,
     borderColor: DESIGN_COLORS.black,
     justifyContent: 'center',
     alignItems: 'center',
   },
   placeholderImageSmall: {
     width: 40,
     height: 40,
     borderRadius: 20,
     backgroundColor: DESIGN_COLORS.coach,
     borderWidth: 1,
     borderColor: DESIGN_COLORS.black,
     justifyContent: 'center',
     alignItems: 'center',
   },
     placeholderText: {
     fontSize: 20,
     fontWeight: 'bold',
     color: DESIGN_COLORS.black,
   },
   placeholderTextSmall: {
     fontSize: 16,
     fontWeight: 'bold',
     color: DESIGN_COLORS.black,
   },
  coachInfo: {
    flex: 1,
  },
  coachName: {
    ...TYPOGRAPHY.cardTitle,
    fontSize: 18,
    color: DESIGN_COLORS.black,
    marginBottom: 4,
  },
  coachEmail: {
    ...TYPOGRAPHY.bodyText,
    fontSize: 14,
    color: DESIGN_COLORS.textSecondary,
    marginBottom: 8,
  },
  studentCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentCountText: {
    ...TYPOGRAPHY.bodyText,
    fontSize: 14,
    color: DESIGN_COLORS.textSecondary,
    marginLeft: 4,
  },
  expandButton: {
    padding: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: DESIGN_COLORS.black,
    backgroundColor: DESIGN_COLORS.white,
    gap: 8,
  },
  primaryActionButton: {
    backgroundColor: DESIGN_COLORS.coach,
  },
  actionButtonText: {
    ...TYPOGRAPHY.bodyText,
    fontSize: 14,
    color: DESIGN_COLORS.black,
    fontWeight: '600',
  },
  primaryActionButtonText: {
    color: DESIGN_COLORS.black,
  },
  studentsContainer: {
    borderTopWidth: 1,
    borderTopColor: DESIGN_COLORS.border,
    padding: 16,
    backgroundColor: '#F9F9F9',
  },
  studentsTitle: {
    ...TYPOGRAPHY.sectionTitle,
    fontSize: 12,
    color: DESIGN_COLORS.black,
    marginBottom: 12,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: DESIGN_COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DESIGN_COLORS.border,
    marginBottom: 8,
  },
  studentImageContainer: {
    marginRight: 12,
  },
  studentImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: DESIGN_COLORS.black,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    ...TYPOGRAPHY.bodyText,
    fontSize: 16,
    color: DESIGN_COLORS.black,
    fontWeight: '600',
    marginBottom: 4,
  },
  studentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DESIGN_COLORS.black,
  },
  skillBadgeText: {
    fontSize: 12,
    color: DESIGN_COLORS.black,
    fontWeight: '600',
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  xpText: {
    fontSize: 12,
    color: DESIGN_COLORS.textSecondary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
     emptyStateTitle: {
     fontFamily: 'ArchivoBlack-Regular',
     fontSize: 20,
     fontWeight: '900' as const,
     textTransform: 'uppercase' as const,
     color: DESIGN_COLORS.black,
     marginBottom: 8,
   },
  emptyStateText: {
    ...TYPOGRAPHY.bodyText,
    fontSize: 16,
    color: DESIGN_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  inviteButton: {
    backgroundColor: DESIGN_COLORS.coach,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: DESIGN_COLORS.black,
    shadowColor: DESIGN_COLORS.black,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  inviteButtonText: {
    fontFamily: 'ArchivoBlack-Regular',
    fontSize: 14,
    fontWeight: '900' as const,
    textTransform: 'uppercase' as const,
    color: DESIGN_COLORS.black,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: DESIGN_COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_COLORS.border,
    backgroundColor: DESIGN_COLORS.white,
  },
  modalTitle: {
    fontFamily: 'ArchivoBlack-Regular',
    fontSize: 18,
    fontWeight: '900' as const,
    textTransform: 'uppercase' as const,
    color: DESIGN_COLORS.black,
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
});

export default AdminCoachesScreen; 