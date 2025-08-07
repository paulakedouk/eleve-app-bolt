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
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { 
  Home,
  Settings,
  UserPlus,
  Users,
  Shield,
  CheckCircle,
  Award,
  AlertCircle,
  TrendingUp,
  LogOut,
} from 'lucide-react-native';
import { SvgXml } from 'react-native-svg';
import { RootStackParamList } from '../../../shared/types';
import { supabase } from '../../../shared/lib/supabase';
import {
  getAdminProfile,
  getOrganizationStats,
  getPendingInvitations,
  AdminProfile,
  AdminStats,
  PendingInvitation,
} from '../../../shared/services/adminService';
import { BottomNavigation } from '../../../shared/components/BottomNavigation';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';

type AdminHomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AdminHome'>;

// Admin-specific design colors that extend the main design system
const ADMIN_COLORS = {
  coach: '#FFC900',
  parent: '#91A8EB', 
  partners: '#55C1C3',
  approvals: '#FF5A34',
  tricks: '#91DEF1',
};

// SVG Icons
const coachesIconSvg = `<svg width="23" height="22" viewBox="0 0 23 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3.125 19.5L4.625 18M18.625 4L20.125 2.5M14.625 8L8.625 14M10.625 20V20C11.1702 19.4548 11.4429 19.1821 11.5886 18.888C11.8659 18.3285 11.8659 17.6715 11.5886 17.112C11.4429 16.8179 11.1703 16.5453 10.625 16L6.625 12C6.07975 11.4548 5.80713 11.1821 5.51303 11.0364C4.95348 10.7591 4.29652 10.7591 3.73697 11.0364C3.44287 11.1821 3.17025 11.4548 2.625 12V12C2.07975 12.5452 1.80713 12.8179 1.66139 13.112C1.38411 13.6715 1.38411 14.3285 1.66139 14.888C1.80713 15.1821 2.07975 15.4547 2.625 16L6.625 20C7.17025 20.5452 7.44287 20.8179 7.73697 20.9636C8.29652 21.2409 8.95348 21.2409 9.51303 20.9636C9.80713 20.8179 10.0798 20.5452 10.625 20ZM20.625 10V10C21.1702 9.45475 21.4429 9.18213 21.5886 8.88803C21.8659 8.32848 21.8659 7.67152 21.5886 7.11197C21.4429 6.81787 21.1703 6.54525 20.625 6L16.625 2C16.0798 1.45475 15.8071 1.18213 15.513 1.03639C14.9535 0.759106 14.2965 0.759106 13.737 1.03639C13.4429 1.18213 13.1702 1.45475 12.625 2V2C12.0798 2.54525 11.8071 2.81787 11.6614 3.11197C11.3841 3.67152 11.3841 4.32848 11.6614 4.88803C11.8071 5.18213 12.0797 5.45475 12.625 6L16.625 10C17.1702 10.5452 17.4429 10.8179 17.737 10.9636C18.2965 11.2409 18.9535 11.2409 19.513 10.9636C19.8071 10.8179 20.0798 10.5452 20.625 10Z" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const studentsIconSvg = `<svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.375 1V4M15.375 1V4M13.375 9C13.375 10.1046 12.4796 11 11.375 11C10.2704 11 9.375 10.1046 9.375 9C9.375 7.89543 10.2704 7 11.375 7C12.4796 7 13.375 7.89543 13.375 9ZM8.375 17H14.375C14.9273 17 15.375 16.5523 15.375 16V16C15.375 14.8954 14.4796 14 13.375 14H9.375C8.27043 14 7.375 14.8954 7.375 16V16C7.375 16.5523 7.82272 17 8.375 17ZM10.975 22H11.775C15.1353 22 16.8155 22 18.0989 21.346C19.2279 20.7708 20.1458 19.8529 20.721 18.7239C21.375 17.4405 21.375 15.7603 21.375 12.4V11.6C21.375 8.23969 21.375 6.55953 20.721 5.27606C20.1458 4.14708 19.2279 3.2292 18.0989 2.65396C16.8155 2 15.1353 2 11.775 2H10.975C7.61469 2 5.93453 2 4.65106 2.65396C3.52208 3.2292 2.6042 4.14708 2.02896 5.27606C1.375 6.55953 1.375 8.23969 1.375 11.6V12.4C1.375 15.7603 1.375 17.4405 2.02896 18.7239C2.6042 19.8529 3.52208 20.7708 4.65106 21.346C5.93453 22 7.61469 22 10.975 22Z" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const logoSvg = `<svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="25" cy="25" r="25" fill="black"/>
<rect x="8" y="18" width="34" height="8" rx="2" fill="white"/>
<rect x="8" y="28" width="34" height="6" rx="2" fill="#E53E3E"/>
</svg>`;

interface QuickActionCardProps {
  title: string;
  description: string;
  backgroundColor: string;
  icon: React.ReactNode;
  onPress: () => void;
}

interface InsightCardProps {
  value: string;
  label: string;
  color: string;
}



const AdminHomeScreen: React.FC = () => {
  const navigation = useNavigation<AdminHomeScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState('Home');
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [organizationStats, setOrganizationStats] = useState<AdminStats | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  // Breakpoints for responsive design
  const breakpoints = {
    mobile: 0,
    tablet: 500,
    desktop: 1024,
  };

  const getColumnsForWidth = (width: number) => {
    if (width >= breakpoints.desktop) return 4;
    if (width >= breakpoints.tablet) return 2;
    return 1;
  };

  const getCardWidth = (columns: number) => {
    if (columns === 1) return '100%';
    if (columns === 2) return '48%';
    if (columns === 4) return '23%';
    return '100%';
  };

  const columns = getColumnsForWidth(screenWidth);
  const cardWidth = getCardWidth(columns);

  useEffect(() => {
    loadAdminData();
    
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });

    return () => subscription?.remove();
  }, []);

  const loadAdminData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const profile = await getAdminProfile();
      setAdminProfile(profile);

      if (profile?.organization_id) {
        const [stats, invitations] = await Promise.all([
          getOrganizationStats(profile.organization_id),
          getPendingInvitations(profile.organization_id)
        ]);

        setOrganizationStats(stats);
        setPendingInvitations(invitations);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadAdminData(true);
  };

  const handleLogout = async () => {
    console.log('Logout button pressed!'); // Debug log
    
    // Direct logout without confirmation for now (to test if it works)
    try {
      console.log('Starting logout process...');
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
        throw error;
      }
      
      console.log('Successfully signed out from Supabase');
      console.log('Navigating to Login screen...');
      
      // Reset navigation stack to prevent going back
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  };

  const getAdminDisplayName = () => {
    if (adminProfile?.full_name) {
      return adminProfile.full_name;
    }
    return 'Admin';
  };

  const QuickActionCard: React.FC<QuickActionCardProps> = ({ title, description, backgroundColor, icon, onPress }) => (
    <TouchableOpacity style={[styles.quickActionCard, { width: cardWidth }]} onPress={onPress}>
      <View style={[styles.quickActionHeader, { backgroundColor }]}>
        <View style={styles.quickActionIcon}>
          {icon}
        </View>
        <Text style={styles.quickActionTitle}>{title}</Text>
      </View>
      <View style={styles.quickActionBody}>
        <Text style={styles.quickActionDescription}>{description}</Text>
      </View>
    </TouchableOpacity>
  );

  const InsightCard: React.FC<InsightCardProps> = ({ value, label, color }) => (
    <View style={styles.insightCard}>
      <View style={styles.insightValueContainer}>
        {/* Background stroke text */}
        <Text style={[styles.insightValueStroke]}>{value}</Text>
        {/* Foreground colored text */}
        <Text style={[styles.insightValue, { color }]}>{value}</Text>
      </View>
      <Text style={styles.insightLabel}>{label}</Text>
    </View>
  );



  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.black} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.black]}
            tintColor={COLORS.black}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerLogo}
            onPress={() => navigation.navigate('AdminSettings', { 
              organizationId: adminProfile?.organization_id || '' 
            })}
          >
            {adminProfile?.organization_logo_url ? (
              <Image 
                source={{ uri: adminProfile.organization_logo_url }} 
                style={styles.organizationLogo}
              />
            ) : (
              <SvgXml xml={logoSvg} width={50} height={50} />
            )}
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <View style={styles.academyInfo}>
              <Text style={styles.academyName}>{getAdminDisplayName()}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => navigation.navigate('AdminSettings', { 
                organizationId: adminProfile?.organization_id || '' 
              })}
              activeOpacity={0.7}
            >
              <Settings size={SIZES.icon.medium} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <LogOut size={SIZES.icon.medium} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionCard
              title="INVITE COACH"
              description="Add new coaching staff"
              backgroundColor={ADMIN_COLORS.coach}
              icon={<SvgXml xml={coachesIconSvg} width={SIZES.icon.large} height={SIZES.icon.large} />}
              onPress={() => navigation.navigate('InviteCoach', { 
                organizationId: adminProfile?.organization_id || '' 
              })}
            />
            <QuickActionCard
              title="INVITE PARENT"
              description="Onboard new families"
              backgroundColor={ADMIN_COLORS.parent}
              icon={<UserPlus size={SIZES.icon.large} color={COLORS.black} />}
              onPress={() => navigation.navigate('InviteParent', { 
                organizationId: adminProfile?.organization_id || '' 
              })}
            />
            <QuickActionCard
              title="INVITE PARTNERS"
              description="Add partner organizations"
              backgroundColor={ADMIN_COLORS.partners}
              icon={<Shield size={SIZES.icon.large} color={COLORS.black} />}
              onPress={() => navigation.navigate('InvitePartner', { 
                organizationId: adminProfile?.organization_id || '' 
              })}
            />
            <QuickActionCard
              title="REVIEW APPROVALS"
              description="Process pending requests"
              backgroundColor={ADMIN_COLORS.approvals}
              icon={<CheckCircle size={SIZES.icon.large} color={COLORS.black} />}
              onPress={() => navigation.navigate('ReviewApprovals', { 
                organizationId: adminProfile?.organization_id || '' 
              })}
            />
          </View>
        </View>

        {/* Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organization Overview</Text>
          <View style={styles.insightsGrid}>
            <InsightCard 
              value={organizationStats?.total_students?.toString() || "0"} 
              label="STUDENTS ENROLLED" 
              color={ADMIN_COLORS.parent}
            />
            <InsightCard 
              value={organizationStats?.total_coaches?.toString() || "0"} 
              label="ACTIVE COACHES" 
              color={ADMIN_COLORS.coach}
            />
            <InsightCard 
              value={organizationStats?.total_tricks?.toString() || "0"} 
              label="NEW TRICKS" 
              color={ADMIN_COLORS.tricks}
            />
            <InsightCard 
              value={pendingInvitations?.length?.toString() || "0"} 
              label="PENDING APPROVALS" 
              color={ADMIN_COLORS.approvals}
            />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab} 
        userRole="admin" 
        organizationId={adminProfile?.organization_id || ''} 
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.white,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.black,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: TYPOGRAPHY.sizes.h1,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    fontFamily: TYPOGRAPHY.families.archivoBold,
  },
  academyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  academyName: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontFamily: TYPOGRAPHY.families.poppins,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  headerLogo: {
    borderRadius: BORDER_RADIUS.round,
    marginRight: SPACING.md,
    ...SHADOWS.brutalist,
  },
  organizationLogo: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 2,
    borderColor: COLORS.black,
    backgroundColor: COLORS.white,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.brutalist,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.brutalist,
  },
  logoutButtonText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.black,
    marginLeft: SPACING.xs,
  },
  section: {
    paddingHorizontal: SPACING.screenPadding,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.h2,
    fontFamily: TYPOGRAPHY.families.archivoBold,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    letterSpacing: 1,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.black,
    ...SHADOWS.brutalist,
    marginBottom: SPACING.md,
  },
  quickActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    minHeight: 60,
    borderTopLeftRadius: BORDER_RADIUS.xl - 2,
    borderTopRightRadius: BORDER_RADIUS.xl - 2,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.black,
  },
  quickActionIcon: {
    width: SIZES.icon.large,
    height: SIZES.icon.large,
    alignItems: 'flex-end',
  },
  quickActionTitle: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontFamily: TYPOGRAPHY.families.archivoBold,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.black,
    flex: 1,
    textAlign: 'right',
    textTransform: 'uppercase',
    lineHeight: TYPOGRAPHY.lineHeights.h4,
  },
  quickActionBody: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderBottomLeftRadius: BORDER_RADIUS.xl - 2,
    borderBottomRightRadius: BORDER_RADIUS.xl - 2,
  },
  quickActionDescription: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontFamily: TYPOGRAPHY.families.poppins,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.lineHeights.bodySmall,
  },
  insightsGrid: {
    gap: SPACING.md,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.black,
    backgroundColor: COLORS.white,
    ...SHADOWS.brutalist,
    padding: SPACING.lg,
    minHeight: 72,
  },
  insightValueContainer: {
    position: 'relative',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    width: 72,
    minHeight: 44,
    justifyContent: 'center',
  },
  insightValueStroke: {
    position: 'absolute',
    fontSize: TYPOGRAPHY.sizes.h2,
    fontFamily: TYPOGRAPHY.families.poppinsBold,
    fontWeight: TYPOGRAPHY.weights.bold,
    lineHeight: TYPOGRAPHY.lineHeights.h2,
    textAlign: 'center',
    textTransform: 'uppercase',
    color: COLORS.black,
    top: SPACING.sm,
    left: SPACING.md,
    right: SPACING.md,
    textShadowColor: COLORS.black,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  insightValue: {
    fontSize: TYPOGRAPHY.sizes.h2,
    fontFamily: TYPOGRAPHY.families.poppinsBold,
    fontWeight: TYPOGRAPHY.weights.bold,
    lineHeight: TYPOGRAPHY.lineHeights.h2,
    textAlign: 'center',
    textTransform: 'uppercase',
    textShadowColor: COLORS.black,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  insightLabel: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontFamily: TYPOGRAPHY.families.archivoBold,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.black,
    textAlign: 'right',
    flex: 1,
    marginLeft: SPACING.md,
    lineHeight: TYPOGRAPHY.lineHeights.h4,
  },
});

export default AdminHomeScreen;