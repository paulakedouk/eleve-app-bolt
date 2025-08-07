import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserPlus, Mail, User, CheckCircle } from 'lucide-react-native';
import { SvgXml } from 'react-native-svg';
import { createCoachInvitation } from '../../../shared/services/adminService';
import { RootStackParamList } from '../../../shared/types';
import BackButton from '../../../shared/components/BackButton';
import { BottomNavigation } from '../../../shared/components/BottomNavigation';
import { COLORS, TYPOGRAPHY as DESIGN_TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';

type InviteCoachScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'InviteCoach'>;

interface RouteParams {
  organizationId: string;
}

// Admin-specific design colors that extend the main design system
const ADMIN_COLORS = {
  coach: '#FFC900',
  parent: '#91A8EB', 
  partners: '#55C1C3',
  approvals: '#FF5A34',
  tricks: '#91DEF1',
};

// Typography styles (matching centralized design system)
const TYPOGRAPHY = {
  sectionTitle: {
    fontFamily: DESIGN_TYPOGRAPHY.families.poppins,
    fontSize: DESIGN_TYPOGRAPHY.sizes.bodySmall,
    fontWeight: DESIGN_TYPOGRAPHY.weights.medium,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  buttonTitle: {
    fontFamily: DESIGN_TYPOGRAPHY.families.archivoBold,
    fontSize: DESIGN_TYPOGRAPHY.sizes.h4,
    fontWeight: DESIGN_TYPOGRAPHY.weights.bold,
    textTransform: 'uppercase' as const,
  },
  header: {
    fontFamily: DESIGN_TYPOGRAPHY.families.archivoBold,
    fontSize: DESIGN_TYPOGRAPHY.sizes.h1,
    fontWeight: DESIGN_TYPOGRAPHY.weights.bold,
    letterSpacing: 0.5,
  },
  body: {
    fontFamily: DESIGN_TYPOGRAPHY.families.poppins,
    fontSize: DESIGN_TYPOGRAPHY.sizes.body,
    fontWeight: DESIGN_TYPOGRAPHY.weights.medium,
  },
};

// Logo SVG (matching AdminHomeScreen)
const logoSvg = `<svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="25" cy="25" r="25" fill="black"/>
<rect x="8" y="18" width="34" height="8" rx="2" fill="white"/>
<rect x="8" y="28" width="34" height="6" rx="2" fill="#E53E3E"/>
</svg>`;

// Coaches icon SVG (matching AdminHomeScreen)
const coachesIconSvg = `<svg width="23" height="22" viewBox="0 0 23 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3.125 19.5L4.625 18M18.625 4L20.125 2.5M14.625 8L8.625 14M10.625 20V20C11.1702 19.4548 11.4429 19.1821 11.5886 18.888C11.8659 18.3285 11.8659 17.6715 11.5886 17.112C11.4429 16.8179 11.1703 16.5453 10.625 16L6.625 12C6.07975 11.4548 5.80713 11.1821 5.51303 11.0364C4.95348 10.7591 4.29652 10.7591 3.73697 11.0364C3.44287 11.1821 3.17025 11.4548 2.625 12V12C2.07975 12.5452 1.80713 12.8179 1.66139 13.112C1.38411 13.6715 1.38411 14.3285 1.66139 14.888C1.80713 15.1821 2.07975 15.4547 2.625 16L6.625 20C7.17025 20.5452 7.44287 20.8179 7.73697 20.9636C8.29652 21.2409 8.95348 21.2409 9.51303 20.9636C9.80713 20.8179 10.0798 20.5452 10.625 20ZM20.625 10V10C21.1702 9.45475 21.4429 9.18213 21.5886 8.88803C21.8659 8.32848 21.8659 7.67152 21.5886 7.11197C21.4429 6.81787 21.1703 6.54525 20.625 6L16.625 2C16.0798 1.45475 15.8071 1.18213 15.513 1.03639C14.9535 0.759106 14.2965 0.759106 13.737 1.03639C13.4429 1.18213 13.1702 1.45475 12.625 2V2C12.0798 2.54525 11.8071 2.81787 11.6614 3.11197C11.3841 3.67152 11.3841 4.32848 11.6614 4.88803C11.8071 5.18213 12.0797 5.45475 12.625 6L16.625 10C17.1702 10.5452 17.4429 10.8179 17.737 10.9636C18.2965 11.2409 18.9535 11.2409 19.513 10.9636C19.8071 10.8179 20.0798 10.5452 20.625 10Z" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const InviteCoachScreen: React.FC = () => {
  const navigation = useNavigation<InviteCoachScreenNavigationProp>();
  const route = useRoute();
  const { organizationId } = (route.params as RouteParams) || {};

  const [coachName, setCoachName] = useState('');
  const [coachEmail, setCoachEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!coachName.trim()) {
      Alert.alert('Missing Information', 'Please enter the coach\'s name');
      return false;
    }

    if (!coachEmail.trim()) {
      Alert.alert('Missing Information', 'Please enter the coach\'s email address');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(coachEmail.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await createCoachInvitation(
        coachName.trim(),
        coachEmail.trim(),
        organizationId
      );

      if (result.success) {
        Alert.alert(
          'Invitation Sent! 🎉',
          `Coach invitation has been sent to ${coachEmail.trim()}. They will receive an email with instructions to join your organization.`,
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error: any) {
      console.error('Error creating coach invitation:', error);
      Alert.alert('Error', 'Failed to send coach invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={ADMIN_COLORS.tricks} />
      
      {/* Header */}
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          variant="simple"
          iconSize={20}
          iconColor={COLORS.black}
        />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>INVITE COACH</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            {/* <View style={styles.welcomeIconContainer}>
              <SvgXml xml={coachesIconSvg} width={48} height={48} />
            </View> */}
            <Text style={styles.welcomeTitle}>ADD NEW COACH</Text>
            <Text style={styles.welcomeSubtitle}>
              Invite a coach to join your organization and start helping students reach their goals.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>COACH DETAILS</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Coach's Full Name</Text>
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <User size={20} color={COLORS.textSecondary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  value={coachName}
                  onChangeText={setCoachName}
                  autoCapitalize="words"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Coach's Email Address</Text>
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Mail size={20} color={COLORS.textSecondary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email address"
                  value={coachEmail}
                  onChangeText={setCoachEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
            </View>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              {/* <CheckCircle size={24} color={COLORS.black} /> */}
              <Text style={styles.infoTitle}>WHAT HAPPENS NEXT?</Text>
            </View>
            <Text style={styles.infoText}>
              The coach will receive a beautifully designed email invitation with instructions to create their account and join your organization.
            </Text>
            
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
              <Text style={styles.featuresTitle}>COACHES WILL BE ABLE TO:</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureText}>- Record and review student progress videos</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureText}>- Track student achievements and milestones</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureText}>- Access detailed progress analytics</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureText}>- Communicate with parents and students</Text>
              </View>
            </View>
          </View>

         
        </ScrollView>

        {/* Bottom Action Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.7}
          >
            <View style={styles.submitButtonContent}>
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.black} />
              ) : (
                <UserPlus size={24} color={COLORS.black} />
              )}
              <Text style={styles.submitButtonText}>
                {loading ? 'SENDING INVITATION...' : 'SEND INVITATION'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab="" 
        userRole="admin" 
        organizationId={organizationId} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    //backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    //backgroundColor: COLORS.background,
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
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
  },
  headerSpacer: {
    width: 44,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    //paddingVertical: 32,
    marginBottom: 16,
  },
  welcomeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 4,
    backgroundColor: ADMIN_COLORS.coach,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.black,
    shadowColor: COLORS.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  welcomeTitle: {
    fontSize: 24,
    fontFamily: TYPOGRAPHY.header.fontFamily,
    fontWeight: TYPOGRAPHY.header.fontWeight,
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.body.fontFamily,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  formCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.black,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    overflow: 'hidden',
  },
  formTitle: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.buttonTitle.fontFamily,
    fontWeight: TYPOGRAPHY.buttonTitle.fontWeight,
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    padding: 16,
    backgroundColor: ADMIN_COLORS.coach,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.black,
  },
  inputContainer: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontWeight: TYPOGRAPHY.body.fontWeight,
    color: COLORS.textPrimary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.black,
    minHeight: 48,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.body.fontFamily,
    color: COLORS.textPrimary,
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.black,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    overflow: 'hidden',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: ADMIN_COLORS.tricks,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.black,
    gap: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.buttonTitle.fontFamily,
    fontWeight: TYPOGRAPHY.buttonTitle.fontWeight,
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.body.fontFamily,
    color: COLORS.textSecondary,
    lineHeight: 24,
    padding: 16,
  },
  featuresCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.black,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    overflow: 'hidden',
  },
  featuresTitle: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.buttonTitle.fontFamily,
    fontWeight: TYPOGRAPHY.buttonTitle.fontWeight,
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  featuresList: {
    padding: 16,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureBullet: {
    fontSize: 20,
    marginRight: 16,
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.body.fontFamily,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  bottomSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.background,
  },
  submitButton: {
    borderRadius: 4,
    backgroundColor: ADMIN_COLORS.coach,
    borderWidth: 1,
    borderColor: COLORS.black,
    shadowColor: COLORS.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    minHeight: 60,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  submitButtonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.buttonTitle.fontFamily,
    fontWeight: TYPOGRAPHY.buttonTitle.fontWeight,
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
  },
});

export default InviteCoachScreen; 