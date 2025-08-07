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
import { UserPlus, Mail, User, CheckCircle, Users } from 'lucide-react-native';
import { SvgXml } from 'react-native-svg';
import { createParentInvitation } from '../../../shared/services/adminService';
import { RootStackParamList } from '../../../shared/types';
import BackButton from '../../../shared/components/BackButton';

type InviteParentScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'InviteParent'>;

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

// Students/Parents icon SVG (matching AdminHomeScreen)
const studentsIconSvg = `<svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.375 1V4M15.375 1V4M13.375 9C13.375 10.1046 12.4796 11 11.375 11C10.2704 11 9.375 10.1046 9.375 9C9.375 7.89543 10.2704 7 11.375 7C12.4796 7 13.375 7.89543 13.375 9ZM8.375 17H14.375C14.9273 17 15.375 16.5523 15.375 16V16C15.375 14.8954 14.4796 14 13.375 14H9.375C8.27043 14 7.375 14.8954 7.375 16V16C7.375 16.5523 7.82272 17 8.375 17ZM10.975 22H11.775C15.1353 22 16.8155 22 18.0989 21.346C19.2279 20.7708 20.1458 19.8529 20.721 18.7239C21.375 17.4405 21.375 15.7603 21.375 12.4V11.6C21.375 8.23969 21.375 6.55953 20.721 5.27606C20.1458 4.14708 19.2279 3.2292 18.0989 2.65396C16.8155 2 15.1353 2 11.775 2H10.975C7.61469 2 5.93453 2 4.65106 2.65396C3.52208 3.2292 2.6042 4.14708 2.02896 5.27606C1.375 6.55953 1.375 8.23969 1.375 11.6V12.4C1.375 15.7603 1.375 17.4405 2.02896 18.7239C2.6042 19.8529 3.52208 20.7708 4.65106 21.346C5.93453 22 7.61469 22 10.975 22Z" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const InviteParentScreen: React.FC = () => {
  const navigation = useNavigation<InviteParentScreenNavigationProp>();
  const route = useRoute();
  const { organizationId } = (route.params as RouteParams) || {};

  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!parentName.trim()) {
      Alert.alert('Missing Information', 'Please enter the parent\'s name');
      return false;
    }

    if (!parentEmail.trim()) {
      Alert.alert('Missing Information', 'Please enter the parent\'s email address');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(parentEmail.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await createParentInvitation(
        parentName.trim(),
        parentEmail.trim(),
        organizationId
      );

      if (result.success) {
        Alert.alert(
          'Invitation Sent! 🎉',
          `Parent invitation has been sent to ${parentEmail.trim()}. They will receive an email with instructions to create their account and add their children.`,
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
      console.error('Error creating parent invitation:', error);
      Alert.alert('Error', 'Failed to send parent invitation. Please try again.');
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
          <Text style={styles.headerTitle}>INVITE PARENT</Text>
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
              <SvgXml xml={studentsIconSvg} width={48} height={48} />
            </View> */}
            <Text style={styles.welcomeTitle}>ADD NEW PARENT</Text>
            <Text style={styles.welcomeSubtitle}>
              Invite a parent to join your academy and help their children reach their skateboarding goals.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>PARENT DETAILS</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Parent's Full Name</Text>
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <User size={20} color={DESIGN_COLORS.textSecondary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  value={parentName}
                  onChangeText={setParentName}
                  autoCapitalize="words"
                  placeholderTextColor={DESIGN_COLORS.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Parent's Email Address</Text>
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Mail size={20} color={DESIGN_COLORS.textSecondary} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email address"
                  value={parentEmail}
                  onChangeText={setParentEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
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
              The parent will receive an email invitation with instructions to create their account and add their children's information.
            </Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Text style={styles.featuresTitle}>PARENTS WILL BE ABLE TO:</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureText}>- Add their children's information and create student accounts</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureText}>- Monitor their children's progress and achievements</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureText}>- Receive notifications about sessions and milestones</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureText}>- Access detailed progress reports and session summaries</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureText}>- Communicate with coaches and academy staff</Text>
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
                <Users size={24} color={DESIGN_COLORS.black} />
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
    backgroundColor: DESIGN_COLORS.parent,
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
    backgroundColor: DESIGN_COLORS.parent,
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
  featuresCard: {
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
    backgroundColor: DESIGN_COLORS.parent,
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

export default InviteParentScreen; 