import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { 
  Calendar,
  Video,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  FileText,
  Award,
  Clock,
  MapPin,
  Filter,
  Bell,
  LogOut,
  ChevronRight
} from 'lucide-react-native';
import { RootStackParamList } from '../../../shared/types';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';
import { BottomNavigation } from '../../../shared/components/BottomNavigation';
import { supabase } from '../../../shared/lib/supabase';

type CoachMenuScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CoachMenu'>;

interface MenuItemProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  subtitle: string;
  onPress: () => void;
  iconColor?: string;
  backgroundColor?: string;
}

const CoachMenuScreen: React.FC = () => {
  const navigation = useNavigation<CoachMenuScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState('Menu');

  const handleLogout = async () => {
    try {
      console.log('Coach logout initiated from menu...');
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        throw error;
      }
      
      console.log('Successfully signed out');
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const MenuItem: React.FC<MenuItemProps> = ({ 
    icon: Icon, 
    title, 
    subtitle, 
    onPress, 
    iconColor = COLORS.primary,
    backgroundColor = `${COLORS.primary}20`
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.menuIconContainer, { backgroundColor }]}>
        <Icon size={SIZES.icon.large} color={iconColor} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <ChevronRight size={SIZES.icon.medium} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  const menuSections = [
    {
      title: "Content & Analysis",
      items: [
        {
          icon: Calendar,
          title: "Videos Calendar",
          subtitle: "View all recorded videos by date with filters",
          onPress: () => navigation.navigate('VideosCalendar'),
          iconColor: COLORS.primary,
          backgroundColor: `${COLORS.primary}20`
        },
        {
          icon: Video,
          title: "Today's Videos",
          subtitle: "Quick access to today's recordings",
          onPress: () => navigation.navigate('CoachVideosList'),
          iconColor: COLORS.secondary,
          backgroundColor: `${COLORS.secondary}20`
        },
        {
          icon: BarChart3,
          title: "Progress Analytics",
          subtitle: "View student progress and performance metrics",
          onPress: () => { /* TODO: Navigate to analytics */ },
          iconColor: COLORS.success,
          backgroundColor: `${COLORS.success}20`
        },
      ]
    },
    {
      title: "Management",
      items: [
        {
          icon: Users,
          title: "My Students",
          subtitle: "Manage your students and assignments",
          onPress: () => { /* TODO: Navigate to students */ },
          iconColor: COLORS.accentBlue,
          backgroundColor: `${COLORS.accentBlue}20`
        },
        {
          icon: Clock,
          title: "Sessions",
          subtitle: "View and manage coaching sessions",
          onPress: () => { /* TODO: Navigate to sessions */ },
          iconColor: COLORS.warning,
          backgroundColor: `${COLORS.warning}20`
        },
        {
          icon: Award,
          title: "Achievements",
          subtitle: "Track student achievements and milestones",
          onPress: () => { /* TODO: Navigate to achievements */ },
          iconColor: COLORS.accentPink,
          backgroundColor: `${COLORS.accentPink}20`
        },
      ]
    },
    {
      title: "Tools & Settings",
      items: [
        {
          icon: Bell,
          title: "Notifications",
          subtitle: "Manage your notification preferences",
          onPress: () => { /* TODO: Navigate to notifications */ },
          iconColor: COLORS.textSecondary,
          backgroundColor: `${COLORS.textSecondary}20`
        },
        {
          icon: Settings,
          title: "Settings",
          subtitle: "App preferences and account settings",
          onPress: () => { /* TODO: Navigate to settings */ },
          iconColor: COLORS.textSecondary,
          backgroundColor: `${COLORS.textSecondary}20`
        },
        {
          icon: HelpCircle,
          title: "Help & Support",
          subtitle: "Get help and contact support",
          onPress: () => { /* TODO: Navigate to help */ },
          iconColor: COLORS.textSecondary,
          backgroundColor: `${COLORS.textSecondary}20`
        },
      ]
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Menu</Text>
            <Text style={styles.subtitle}>Access all coach features and tools</Text>
          </View>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <LogOut size={SIZES.icon.medium} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <MenuItem
                  key={itemIndex}
                  icon={item.icon}
                  title={item.title}
                  subtitle={item.subtitle}
                  onPress={item.onPress}
                  iconColor={item.iconColor}
                  backgroundColor={item.backgroundColor}
                />
              ))}
            </View>
          </View>
        ))}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoTitle}>Elevé Coach</Text>
          <Text style={styles.appInfoVersion}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      <BottomNavigation
        activeTab={activeTab}
        userRole="coach"
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
    paddingBottom: 100, // Space for bottom navigation
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.black,
    ...SHADOWS.brutalist,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.h1,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.families.archivoBold,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  logoutButton: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.brutalist,
  },
  section: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.screenPadding,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    fontFamily: TYPOGRAPHY.families.archivoBold,
  },
  sectionContent: {
    gap: SPACING.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.black,
    padding: SPACING.lg,
    ...SHADOWS.brutalist,
  },
  menuIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    fontFamily: TYPOGRAPHY.families.poppins,
  },
  menuSubtitle: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.lineHeights.bodySmall,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    marginTop: SPACING.xl,
  },
  appInfoTitle: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontFamily: TYPOGRAPHY.families.archivoBold,
  },
  appInfoVersion: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textTertiary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});

export default CoachMenuScreen; 