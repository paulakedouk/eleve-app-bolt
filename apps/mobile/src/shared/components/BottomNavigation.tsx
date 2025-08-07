import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Home, Settings, UserPlus, Users, BarChart3, Heart, TrendingUp, MessageCircle, Menu } from 'lucide-react-native';
import { SvgXml } from 'react-native-svg';

import { RootStackParamList } from '../types';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, SIZES } from '../utils/constants';

type BottomNavigationProps = {
  activeTab: string;
  userRole?: 'admin' | 'coach' | 'parent' | 'student';
  organizationId?: string;
};

// SVG Icons
const coachesIconSvg = `<svg width="23" height="22" viewBox="0 0 23 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3.125 19.5L4.625 18M18.625 4L20.125 2.5M14.625 8L8.625 14M10.625 20V20C11.1702 19.4548 11.4429 19.1821 11.5886 18.888C11.8659 18.3285 11.8659 17.6715 11.5886 17.112C11.4429 16.8179 11.1703 16.5453 10.625 16L6.625 12C6.07975 11.4548 5.80713 11.1821 5.51303 11.0364C4.95348 10.7591 4.29652 10.7591 3.73697 11.0364C3.44287 11.1821 3.17025 11.4548 2.625 12V12C2.07975 12.5452 1.80713 12.8179 1.66139 13.112C1.38411 13.6715 1.38411 14.3285 1.66139 14.888C1.80713 15.1821 2.07975 15.4547 2.625 16L6.625 20C7.17025 20.5452 7.44287 20.8179 7.73697 20.9636C8.29652 21.2409 8.95348 21.2409 9.51303 20.9636C9.80713 20.8179 10.0798 20.5452 10.625 20ZM20.625 10V10C21.1702 9.45475 21.4429 9.18213 21.5886 8.88803C21.8659 8.32848 21.8659 7.67152 21.5886 7.11197C21.4429 6.81787 21.1703 6.54525 20.625 6L16.625 2C16.0798 1.45475 15.8071 1.18213 15.513 1.03639C14.9535 0.759106 14.2965 0.759106 13.737 1.03639C13.4429 1.18213 13.1702 1.45475 12.625 2V2C12.0798 2.54525 11.8071 2.81787 11.6614 3.11197C11.3841 3.67152 11.3841 4.32848 11.6614 4.88803C11.8071 5.18213 12.0797 5.45475 12.625 6L16.625 10C17.1702 10.5452 17.4429 10.8179 17.737 10.9636C18.2965 11.2409 18.9535 11.2409 19.513 10.9636C19.8071 10.8179 20.0798 10.5452 20.625 10Z" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const studentsIconSvg = `<svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.375 1V4M15.375 1V4M13.375 9C13.375 10.1046 12.4796 11 11.375 11C10.2704 11 9.375 10.1046 9.375 9C9.375 7.89543 10.2704 7 11.375 7C12.4796 7 13.375 7.89543 13.375 9ZM8.375 17H14.375C14.9273 17 15.375 16.5523 15.375 16V16C15.375 14.8954 14.4796 14 13.375 14H9.375C8.27043 14 7.375 14.8954 7.375 16V16C7.375 16.5523 7.82272 17 8.375 17ZM10.975 22H11.775C15.1353 22 16.8155 22 18.0989 21.346C19.2279 20.7708 20.1458 19.8529 20.721 18.7239C21.375 17.4405 21.375 15.7603 21.375 12.4V11.6C21.375 8.23969 21.375 6.55953 20.721 5.27606C20.1458 4.14708 19.2279 3.2292 18.0989 2.65396C16.8155 2 15.1353 2 11.775 2H10.975C7.61469 2 5.93453 2 4.65106 2.65396C3.52208 3.2292 2.6042 4.14708 2.02896 5.27606C1.375 6.55953 1.375 8.23969 1.375 11.6V12.4C1.375 15.7603 1.375 17.4405 2.02896 18.7239C2.6042 19.8529 3.52208 20.7708 4.65106 21.346C5.93453 22 7.61469 22 10.975 22Z" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

interface BottomNavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const BottomNavItem: React.FC<BottomNavItemProps> = ({ icon, label, isActive, onPress }) => (
  <TouchableOpacity style={[styles.bottomNavItem, isActive && styles.bottomNavItemActive]} onPress={onPress}>
    <View style={styles.bottomNavIcon}>
      {icon}
    </View>
    <Text style={[styles.bottomNavLabel, isActive && styles.bottomNavLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  userRole = 'admin',
  organizationId = ''
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const getNavigationItems = () => {
    switch (userRole) {
      case 'admin':
        return [
          {
            key: 'Home',
            label: 'Home',
            icon: <Home size={SIZES.icon.medium} color={activeTab === 'Home' ? COLORS.white : COLORS.black} />,
            onPress: () => navigation.navigate('AdminHome'),
          },
          {
            key: 'Coaches',
            label: 'Coaches',
            icon: <SvgXml xml={coachesIconSvg.replace('stroke="black"', `stroke="${activeTab === 'Coaches' ? COLORS.white : COLORS.black}"`)} width={SIZES.icon.medium} height={SIZES.icon.medium} />,
            onPress: () => navigation.navigate('AdminCoaches', { organizationId }),
          },
          {
            key: 'Students',
            label: 'Students',
            icon: <SvgXml xml={studentsIconSvg.replace('stroke="black"', `stroke="${activeTab === 'Students' ? COLORS.white : COLORS.black}"`)} width={SIZES.icon.medium} height={SIZES.icon.medium} />,
            onPress: () => navigation.navigate('StudentsListScreen', { role: 'admin' }),
          },
          {
            key: 'Stats',
            label: 'Stats',
            icon: <BarChart3 size={SIZES.icon.medium} color={activeTab === 'Stats' ? COLORS.white : COLORS.black} />,
            onPress: () => navigation.navigate('AdminStats'),
          },
        ];
      case 'coach':
        return [
          {
            key: 'Home',
            label: 'Home',
            icon: <Home size={SIZES.icon.medium} color={activeTab === 'Home' ? COLORS.white : COLORS.black} />,
            onPress: () => navigation.navigate('CoachHome'),
          },
          {
            key: 'Students',
            label: 'Students',
            icon: <SvgXml xml={studentsIconSvg.replace('stroke="black"', `stroke="${activeTab === 'Students' ? COLORS.white : COLORS.black}"`)} width={SIZES.icon.medium} height={SIZES.icon.medium} />,
            onPress: () => navigation.navigate('StudentsListScreen', { role: 'coach' }),
          },
          {
            key: 'Sessions',
            label: 'Sessions',
            icon: <UserPlus size={SIZES.icon.medium} color={activeTab === 'Sessions' ? COLORS.white : COLORS.black} />,
            onPress: () => { }, // TODO: Navigate to sessions
          },
          {
            key: 'Menu',
            label: 'Menu',
            icon: <Menu size={SIZES.icon.medium} color={activeTab === 'Menu' ? COLORS.white : COLORS.black} />,
            onPress: () => navigation.navigate('CoachMenu'),
          },
        ];
      case 'parent':
        return [
          {
            key: 'Home',
            label: 'Home',
            icon: <Home size={SIZES.icon.medium} color={activeTab === 'Home' ? COLORS.white : COLORS.black} />,
            onPress: () => navigation.navigate('ParentHome'),
          },
          {
            key: 'Wellbeing',
            label: 'Wellbeing',
            icon: <Heart size={SIZES.icon.medium} color={activeTab === 'Wellbeing' ? COLORS.white : COLORS.black} />,
            onPress: () => { }, // TODO: Navigate to wellbeing
          },
          {
            key: 'Progress',
            label: 'Progress',
            icon: <TrendingUp size={SIZES.icon.medium} color={activeTab === 'Progress' ? COLORS.white : COLORS.black} />,
            onPress: () => { }, // TODO: Navigate to progress
          },
          {
            key: 'Chat',
            label: 'Chat',
            icon: <MessageCircle size={SIZES.icon.medium} color={activeTab === 'Chat' ? COLORS.white : COLORS.black} />,
            onPress: () => { }, // TODO: Navigate to chat
          },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <View style={styles.bottomNav}>
      {navigationItems.map((item) => (
        <BottomNavItem
          key={item.key}
          icon={item.icon}
          label={item.label}
          isActive={activeTab === item.key}
          onPress={item.onPress}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 2,
    borderTopColor: COLORS.black,
    justifyContent: 'space-around',
    minHeight: 80,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    ...SHADOWS.brutalist,
  },
  bottomNavItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: SPACING.sm,
    marginBottom: Platform.OS === 'ios' ? 20 : 0,
    paddingHorizontal: SPACING.xs,
    minHeight: 60,
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.sm,
    marginHorizontal: SPACING.xs,
  },
  bottomNavItemActive: {
    backgroundColor: COLORS.black,
    ...SHADOWS.brutalist,
  },
  bottomNavIcon: {
    marginBottom: SPACING.xs,
  },
  bottomNavLabel: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.families.poppins,
    fontWeight: TYPOGRAPHY.weights.medium,
    lineHeight: TYPOGRAPHY.lineHeights.caption,
    textAlign: 'center',
  },
  bottomNavLabelActive: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});