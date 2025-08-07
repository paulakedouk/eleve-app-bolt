import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../utils/constants';

interface BackButtonProps {
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  iconSize?: number;
  iconColor?: string;
  variant?: 'default' | 'minimal' | 'outline' | 'simple';
}

const BackButton: React.FC<BackButtonProps> = ({
  onPress,
  style,
  textStyle,
  iconSize = 20,
  iconColor,
  variant = 'simple'
}) => {
  const getButtonStyle = () => {
    switch (variant) {
      case 'minimal':
        return styles.minimal;
      case 'outline':
        return styles.outline;
      case 'simple':
        return styles.simple;
      default:
        return styles.default;
    }
  };

  const getIconColor = () => {
    if (iconColor) return iconColor;
    switch (variant) {
      case 'minimal':
        return COLORS.primary;
      case 'outline':
        return COLORS.textPrimary;
      case 'simple':
        return COLORS.textPrimary;
      default:
        return COLORS.textPrimary;
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <ArrowLeft size={iconSize} color={getIconColor()} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  default: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    width: 44,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  minimal: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    width: 44,
  },
  simple: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    width: 44,
  },
  outline: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    width: 44,
    borderRadius: 4,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.textPrimary,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  text: {
    marginLeft: 8,
    fontSize: TYPOGRAPHY.sizes.body,
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontWeight: TYPOGRAPHY.body.fontWeight,
    color: COLORS.textPrimary,
  },
});

export default BackButton; 