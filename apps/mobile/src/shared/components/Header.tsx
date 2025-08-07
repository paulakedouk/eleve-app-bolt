import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, SIZES } from '../utils/constants';

interface HeaderProps {
  title: string;
  onBack: () => void;
  rightAction?: {
    icon: React.ComponentType<any>;
    onPress: () => void;
    accessibilityLabel?: string;
  };
  backgroundColor?: string;
}

const Header: React.FC<HeaderProps> = ({
  title,
  onBack,
  rightAction,
  backgroundColor = COLORS.white,
}) => {
  return (
    <>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={backgroundColor}
        translucent={false}
      />
      <SafeAreaView style={[styles.safeArea, { backgroundColor }]} edges={['top']}>
        <View style={[styles.container, { backgroundColor }]}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={SIZES.icon.medium} color={COLORS.textPrimary} />
          </TouchableOpacity>

          {/* Centered Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          </View>

          {/* Right Action or Spacer */}
          <View style={styles.rightContainer}>
            {rightAction ? (
              <TouchableOpacity
                style={styles.rightButton}
                onPress={rightAction.onPress}
                activeOpacity={0.7}
                accessibilityLabel={rightAction.accessibilityLabel}
              >
                <rightAction.icon size={SIZES.icon.medium} color={COLORS.textPrimary} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.white,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    // iOS-style shadow
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 1,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    fontFamily: Platform.select({
      ios: 'System',
      android: TYPOGRAPHY.families.poppinsBold,
    }),
    textAlign: 'center',
  },
  rightContainer: {
    width: 44,
    alignItems: 'center',
  },
  rightButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
});

export default Header; 