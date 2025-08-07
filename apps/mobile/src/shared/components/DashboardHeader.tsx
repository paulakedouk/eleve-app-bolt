import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Bell, Settings, LogOut } from 'lucide-react-native';
import { SvgXml } from 'react-native-svg';
import { TYPOGRAPHY, SPACING } from '../utils/constants';

interface DashboardHeaderProps {
  userName: string;
  organizationName: string;
  organizationLogoUrl?: string;
  unreadCount?: number;
  onNotificationPress: () => void;
  onSettingsPress: () => void;
  onLogoutPress: () => void;
}

// Design system colors
const DESIGN_COLORS = {
  black: '#000000',
  white: '#FFFFFF',
  background: '#eeeeee',
  text: '#000000',
  textSecondary: '#000',
  error: '#EF4444',
};

// Default logo SVG
const logoSvg = `<svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="25" cy="25" r="25" fill="black"/>
<rect x="8" y="18" width="34" height="8" rx="2" fill="white"/>
<rect x="8" y="28" width="34" height="6" rx="2" fill="#E53E3E"/>
</svg>`;

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userName,
  organizationName,
  organizationLogoUrl,
  unreadCount = 0,
  onNotificationPress,
  onSettingsPress,
  onLogoutPress,
}) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.headerLogo}
        onPress={onSettingsPress}
      >
        {organizationLogoUrl ? (
          <Image 
            source={{ uri: organizationLogoUrl }} 
            style={styles.organizationLogo}
          />
        ) : (
          <SvgXml xml={logoSvg} width={50} height={50} />
        )}
      </TouchableOpacity>
      <View style={styles.headerContent}>
        <Text style={styles.greeting}>Hey, {userName}</Text>
        <View style={styles.academyInfo}>
          <Text style={styles.academyName}>{organizationName}</Text>
        </View>
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onNotificationPress}
          activeOpacity={0.7}
        >
          <Bell size={20} color={DESIGN_COLORS.black} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onSettingsPress}
          activeOpacity={0.7}
        >
          <Settings size={20} color={DESIGN_COLORS.black} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={onLogoutPress}
          activeOpacity={0.7}
        >
          <LogOut size={20} color={DESIGN_COLORS.black} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: DESIGN_COLORS.background,
  },
  headerLogo: {
    borderRadius: 100,
    marginRight: 16,
    shadowColor: DESIGN_COLORS.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  organizationLogo: {
    width: 50,
    height: 50,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: DESIGN_COLORS.black,
    backgroundColor: DESIGN_COLORS.white,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: DESIGN_COLORS.text,
    marginBottom: 4,
  },
  academyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  academyName: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.families.poppins,
    color: DESIGN_COLORS.textSecondary,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: DESIGN_COLORS.error,
    borderRadius: 50,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    color: DESIGN_COLORS.white,
    fontWeight: 'bold',
  },
}); 