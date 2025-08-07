import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  TrendingUp,
  Users,
  Award,
  Calendar,
  Clock,
  CheckCircle,
  Target,
  BarChart3,
} from 'lucide-react-native';
import { RootStackParamList } from '../../../shared/types';
import { BottomNavigation } from '../../../shared/components/BottomNavigation';
import {
  getAdminProfile,
  getOrganizationStats,
  AdminProfile,
  AdminStats,
} from '../../../shared/services/adminService';
import BackButton from '../../../shared/components/BackButton';

type AdminStatsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AdminStats'>;

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
  textSecondary: '#666666',
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
  header: {
    fontFamily: 'ArchivoBlack-Regular',
    fontSize: 24,
    fontWeight: "900" as const,
    textTransform: 'uppercase',
  },
  statNumber: {
    fontFamily: 'Poppins-ExtraBold',
    fontSize: 32,
    fontWeight: "800" as const,
  },
  body: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    fontWeight: "500" as const,
  },
};

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  backgroundColor: string;
  description?: string;
}

interface ChartCardProps {
  title: string;
  data: Array<{ label: string; value: number; color: string }>;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, backgroundColor, description }) => (
  <View style={styles.statCard}>
    <View style={[styles.statHeader, { backgroundColor }]}>
      <View style={styles.statIcon}>
        {icon}
      </View>
      <View style={styles.statValueContainer}>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
    <View style={styles.statBody}>
      <Text style={styles.statLabel}>{label}</Text>
      {description && (
        <Text style={styles.statDescription}>{description}</Text>
      )}
    </View>
  </View>
);

const ChartCard: React.FC<ChartCardProps> = ({ title, data }) => (
  <View style={styles.chartCard}>
    <Text style={styles.chartTitle}>{title}</Text>
    <View style={styles.chartContainer}>
      {data.map((item, index) => (
        <View key={index} style={styles.chartItem}>
          <View style={styles.chartBar}>
            <View
              style={[
                styles.chartBarFill,
                {
                  backgroundColor: item.color,
                  height: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%`
                }
              ]}
            />
          </View>
          <Text style={styles.chartItemLabel}>{item.label}</Text>
          <Text style={styles.chartItemValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  </View>
);

const AdminStatsScreen: React.FC = () => {
  const navigation = useNavigation<AdminStatsScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState('Stats');
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [organizationStats, setOrganizationStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStatsData();
  }, []);

  const loadStatsData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const profile = await getAdminProfile();
      setAdminProfile(profile);

      if (profile?.organization_id) {
        const stats = await getOrganizationStats(profile.organization_id);
        setOrganizationStats(stats);
      }
    } catch (error) {
      console.error('Error loading stats data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadStatsData(true);
  };

  // Mock data for charts
  const skillLevelData = [
    { label: 'Beginner', value: 12, color: DESIGN_COLORS.tricks },
    { label: 'Intermediate', value: 8, color: DESIGN_COLORS.coach },
    { label: 'Advanced', value: 4, color: DESIGN_COLORS.approvals },
  ];

  const monthlyProgressData = [
    { label: 'Jan', value: 5, color: DESIGN_COLORS.parent },
    { label: 'Feb', value: 8, color: DESIGN_COLORS.parent },
    { label: 'Mar', value: 12, color: DESIGN_COLORS.parent },
    { label: 'Apr', value: 15, color: DESIGN_COLORS.parent },
  ];

  const handleBack = () => {
    console.log('Back button pressed'); // Debug log
    try {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        console.log('Cannot go back, navigating to AdminHome');
        navigation.navigate('AdminHome');
      }
    } catch (error) {
      console.error('Error navigating back:', error);
      // Fallback navigation
      navigation.navigate('AdminHome');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DESIGN_COLORS.black} />
          <Text style={styles.loadingText}>Loading stats...</Text>
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
        />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>STATS</Text>
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
        {/* Overview Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OVERVIEW</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon={<Users size={28} color={DESIGN_COLORS.black} />}
              value={organizationStats?.total_students?.toString() || "24"}
              label="TOTAL STUDENTS"
              backgroundColor={DESIGN_COLORS.parent}
              description="Active enrollments"
            />
            <StatCard
              icon={<Award size={28} color={DESIGN_COLORS.black} />}
              value={organizationStats?.total_coaches?.toString() || "6"}
              label="ACTIVE COACHES"
              backgroundColor={DESIGN_COLORS.coach}
              description="Teaching staff"
            />
            <StatCard
              icon={<Target size={28} color={DESIGN_COLORS.black} />}
              value={organizationStats?.total_tricks?.toString() || "127"}
              label="TRICKS LEARNED"
              backgroundColor={DESIGN_COLORS.tricks}
              description="This month"
            />
            <StatCard
              icon={<CheckCircle size={28} color={DESIGN_COLORS.black} />}
              value="98%"
              label="SUCCESS RATE"
              backgroundColor={DESIGN_COLORS.approvals}
              description="Student satisfaction"
            />
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PERFORMANCE</Text>
          <View style={styles.performanceGrid}>
            <View style={styles.performanceCard}>
              <View style={styles.performanceHeader}>
                <Clock size={20} color={DESIGN_COLORS.textSecondary} />
                <Text style={styles.performanceLabel}>AVG SESSION TIME</Text>
              </View>
              <Text style={styles.performanceValue}>45 min</Text>
              <Text style={styles.performanceChange}>+5% from last month</Text>
            </View>
            <View style={styles.performanceCard}>
              <View style={styles.performanceHeader}>
                <Calendar size={20} color={DESIGN_COLORS.textSecondary} />
                <Text style={styles.performanceLabel}>MONTHLY SESSIONS</Text>
              </View>
              <Text style={styles.performanceValue}>142</Text>
              <Text style={styles.performanceChange}>+12% from last month</Text>
            </View>
            <View style={styles.performanceCard}>
              <View style={styles.performanceHeader}>
                <TrendingUp size={20} color={DESIGN_COLORS.textSecondary} />
                <Text style={styles.performanceLabel}>STUDENT GROWTH</Text>
              </View>
              <Text style={styles.performanceValue}>+18%</Text>
              <Text style={styles.performanceChange}>New enrollments</Text>
            </View>
          </View>
        </View>

        {/* Charts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ANALYTICS</Text>
          <ChartCard
            title="STUDENT SKILL LEVELS"
            data={skillLevelData}
          />
          <ChartCard
            title="MONTHLY PROGRESS"
            data={monthlyProgressData}
          />
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} userRole="admin" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 88,
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    //backgroundColor: DESIGN_COLORS.background,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.sectionTitle.fontFamily,
    fontWeight: TYPOGRAPHY.sectionTitle.fontWeight,
    color: DESIGN_COLORS.text,
    textTransform: 'uppercase',
  },
  headerSpacer: {
    width: 44,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.sectionTitle.fontFamily,
    fontWeight: TYPOGRAPHY.sectionTitle.fontWeight,
    color: DESIGN_COLORS.text,
    marginBottom: 16,
    letterSpacing: TYPOGRAPHY.sectionTitle.letterSpacing,
    textTransform: 'uppercase',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  statCard: {
    flexBasis: '48%',
    maxWidth: '48%',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: DESIGN_COLORS.black,
    shadowColor: DESIGN_COLORS.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    marginBottom: 12,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_COLORS.black,
  },
  statIcon: {
    marginRight: 12,
  },
  statValueContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statValue: {
    fontSize: 28,
    fontFamily: TYPOGRAPHY.statNumber.fontFamily,
    fontWeight: TYPOGRAPHY.statNumber.fontWeight,
    color: DESIGN_COLORS.black,
  },
  statBody: {
    backgroundColor: DESIGN_COLORS.white,
    padding: 16,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.sectionTitle.fontFamily,
    fontWeight: TYPOGRAPHY.sectionTitle.fontWeight,
    color: DESIGN_COLORS.text,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statDescription: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.body.fontFamily,
    color: DESIGN_COLORS.textSecondary,
  },
  performanceGrid: {
    gap: 12,
  },
  performanceCard: {
    backgroundColor: DESIGN_COLORS.white,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: DESIGN_COLORS.black,
    shadowColor: DESIGN_COLORS.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    padding: 16,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  performanceLabel: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.sectionTitle.fontFamily,
    fontWeight: TYPOGRAPHY.sectionTitle.fontWeight,
    color: DESIGN_COLORS.textSecondary,
    textTransform: 'uppercase',
    marginLeft: 8,
  },
  performanceValue: {
    fontSize: 24,
    fontFamily: TYPOGRAPHY.statNumber.fontFamily,
    fontWeight: TYPOGRAPHY.statNumber.fontWeight,
    color: DESIGN_COLORS.text,
    marginBottom: 4,
  },
  performanceChange: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.body.fontFamily,
    color: DESIGN_COLORS.textSecondary,
  },
  chartCard: {
    backgroundColor: DESIGN_COLORS.white,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: DESIGN_COLORS.black,
    shadowColor: DESIGN_COLORS.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    padding: 16,
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.sectionTitle.fontFamily,
    fontWeight: TYPOGRAPHY.sectionTitle.fontWeight,
    color: DESIGN_COLORS.text,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  chartItem: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  chartBar: {
    width: 24,
    height: 80,
    backgroundColor: DESIGN_COLORS.background,
    borderRadius: 2,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 2,
    minHeight: 4,
  },
  chartItemLabel: {
    fontSize: 10,
    fontFamily: TYPOGRAPHY.body.fontFamily,
    color: DESIGN_COLORS.textSecondary,
    marginBottom: 2,
  },
  chartItemValue: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.sectionTitle.fontFamily,
    fontWeight: TYPOGRAPHY.sectionTitle.fontWeight,
    color: DESIGN_COLORS.text,
  },
});

export default AdminStatsScreen; 