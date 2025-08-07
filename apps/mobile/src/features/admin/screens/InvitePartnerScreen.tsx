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
import { UserPlus, Mail, User, CheckCircle, Shield } from 'lucide-react-native';
import { SvgXml } from 'react-native-svg';
import { RootStackParamList } from '../../../shared/types';
import BackButton from '../../../shared/components/BackButton';

type InvitePartnerScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'InvitePartner'>;

interface RouteParams {
  organizationId: string;
}

// Design system colors (matching AdminHomeScreen)
const DESIGN_COLORS = {
  coach: '#FFC900',
  parent: '#91A8EB', 
  partners: '#55C1C3',
  approvals: '#FF5A34',
  tricks: '#91DEF1',
  black: '#000000',
  white: '#FFFFFF',
  background: '#F5F5F5',
  text: '#000000',
  textSecondary: '#666666',
};

// Typography styles (matching AdminHomeScreen)
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
  header: {
    fontFamily: 'ArchivoBlack-Regular',
    fontSize: 24,
    fontWeight: "900" as const,
    textTransform: 'uppercase',
  },
  body: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    fontWeight: "500" as const,
  },
};

// Logo SVG (matching AdminHomeScreen)
const logoSvg = `<svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="25" cy="25" r="25" fill="black"/>
<rect x="8" y="18" width="34" height="8" rx="2" fill="white"/>
<rect x="8" y="28" width="34" height="6" rx="2" fill="#E53E3E"/>
</svg>`;

const InvitePartnerScreen: React.FC = () => {
  const navigation = useNavigation<InvitePartnerScreenNavigationProp>();
  const route = useRoute();
  const { organizationId } = (route.params as RouteParams) || {};

  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!partnerName.trim()) {
      Alert.alert('Missing Information', 'Please enter the partner contact\'s name');
      return false;
    }

    if (!partnerEmail.trim()) {
      Alert.alert('Missing Information', 'Please enter the partner contact\'s email address');
      return false;
    }

    if (!organizationName.trim()) {
      Alert.alert('Missing Information', 'Please enter the partner organization name');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(partnerEmail.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // TODO: Implement createPartnerInvitation service
      // const result = await createPartnerInvitation(
      //   partnerName.trim(),
      //   partnerEmail.trim(),
      //   organizationName.trim(),
      //   organizationId
      // );

      // For now, simulate success
      const result = { success: true };

      if (result.success) {
        Alert.alert(
          'Invitation Sent! 🎉',
          `Partner invitation has been sent to ${partnerEmail.trim()}. They will receive an email with instructions to set up their partnership with your organization.`,
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
        Alert.alert('Error', 'Failed to send partner invitation');
      }
    } catch (error: any) {
      console.error('Error creating partner invitation:', error);
      Alert.alert('Error', 'Failed to send partner invitation. Please try again.');
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
          {/* <SvgXml xml={logoSvg} width={32} height={32} /> */}
          <Text style={styles.headerTitle}>INVITE PARTNER</Text>
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
              <Shield size={48} color={DESIGN_COLORS.black} />
            </View> */}
            <Text style={styles.welcomeTitle}>ADD NEW PARTNER</Text>
            <Text style={styles.welcomeSubtitle}>
              Invite a partner organization to collaborate with your academy and expand your skateboarding community.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>PARTNER DETAILS</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Contact Person's Name</Text>
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <User size={20} color={DESIGN_COLORS.textSecondary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter contact person's name"
                  value={partnerName}
                  onChangeText={setPartnerName}
                  autoCapitalize="words"
                  placeholderTextColor={DESIGN_COLORS.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Contact Email Address</Text>
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Mail size={20} color={DESIGN_COLORS.textSecondary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter contact email address"
                  value={partnerEmail}
                  onChangeText={setPartnerEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholderTextColor={DESIGN_COLORS.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Organization Name</Text>
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Shield size={20} color={DESIGN_COLORS.textSecondary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter organization name"
                  value={organizationName}
                  onChangeText={setOrganizationName}
                  autoCapitalize="words"
                  placeholderTextColor={DESIGN_COLORS.textSecondary}
                />
              </View>
            </View>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              {/* <CheckCircle size={24} color={DESIGN_COLORS.black} /> */}
              <Text style={styles.infoTitle}>WHAT HAPPENS NEXT?</Text>
            </View>
            <Text style={styles.infoText}>
              The partner organization will receive an email invitation with instructions to set up their partnership and collaboration with your academy.
            </Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Text style={styles.featuresTitle}>PARTNERS WILL BE ABLE TO:</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureText}>- Cross-promote events and programs with your academy</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureText}>- Share resources and collaborate on joint initiatives</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureText}>- Access partner-only features and networking opportunities</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureText}>- Participate in multi-academy tournaments and events</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureText}>- Share best practices and coaching methodologies</Text>
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
                <ActivityIndicator size="small" color={DESIGN_COLORS.black} />
              ) : (
                <Shield size={24} color={DESIGN_COLORS.black} />
              )}
              <Text style={styles.submitButtonText}>
                {loading ? 'SENDING INVITATION...' : 'SEND INVITATION'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: DESIGN_COLORS.background,
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
    backgroundColor: DESIGN_COLORS.partners,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: DESIGN_COLORS.black,
    shadowColor: DESIGN_COLORS.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  welcomeTitle: {
    fontSize: 24,
    fontFamily: TYPOGRAPHY.header.fontFamily,
    fontWeight: TYPOGRAPHY.header.fontWeight,
    color: DESIGN_COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.body.fontFamily,
    color: DESIGN_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  formCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: DESIGN_COLORS.black,
    backgroundColor: DESIGN_COLORS.white,
    shadowColor: DESIGN_COLORS.black,
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
    color: DESIGN_COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    padding: 16,
    backgroundColor: DESIGN_COLORS.partners,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_COLORS.black,
  },
  inputContainer: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontWeight: TYPOGRAPHY.body.fontWeight,
    color: DESIGN_COLORS.text,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN_COLORS.background,
    borderRadius: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: DESIGN_COLORS.black,
    minHeight: 48,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.body.fontFamily,
    color: DESIGN_COLORS.text,
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: DESIGN_COLORS.black,
    backgroundColor: DESIGN_COLORS.white,
    shadowColor: DESIGN_COLORS.black,
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
    backgroundColor: DESIGN_COLORS.tricks,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_COLORS.black,
    gap: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.buttonTitle.fontFamily,
    fontWeight: TYPOGRAPHY.buttonTitle.fontWeight,
    color: DESIGN_COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.body.fontFamily,
    color: DESIGN_COLORS.textSecondary,
    lineHeight: 24,
    padding: 16,
  },
  featuresTitle: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.buttonTitle.fontFamily,
    fontWeight: TYPOGRAPHY.buttonTitle.fontWeight,
    color: DESIGN_COLORS.text,
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
  featureText: {
    flex: 1,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.body.fontFamily,
    color: DESIGN_COLORS.textSecondary,
    lineHeight: 24,
  },
  bottomSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: DESIGN_COLORS.background,
  },
  submitButton: {
    borderRadius: 4,
    backgroundColor: DESIGN_COLORS.partners,
    borderWidth: 1,
    borderColor: DESIGN_COLORS.black,
    shadowColor: DESIGN_COLORS.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    minHeight: 60,
  },
  submitButtonDisabled: {
    backgroundColor: DESIGN_COLORS.textSecondary,
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
    color: DESIGN_COLORS.black,
    textTransform: 'uppercase',
  },
});

export default InvitePartnerScreen; 