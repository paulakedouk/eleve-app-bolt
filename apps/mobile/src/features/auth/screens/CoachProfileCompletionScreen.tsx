import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Check, X } from 'lucide-react-native';
import { supabase } from '../../../shared/lib/supabase';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../../shared/utils/constants';
import BackButton from '../../../shared/components/BackButton';
import { 
  completeCoachProfile, 
  validateCoachProfile,
  CoachProfileData 
} from '../../../shared/services/coachProfileService';

interface CoachProfileFormData extends CoachProfileData {
  email: string;
}

interface SpecialtyOption {
  id: string;
  label: string;
  emoji: string;
}

const specialtyOptions: SpecialtyOption[] = [
  { id: 'street', label: 'Street', emoji: '🛹' },
  { id: 'park', label: 'Park', emoji: '🏊' },
  { id: 'vert', label: 'Vert', emoji: '🌊' },
];

const CoachProfileCompletionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { invitationCode, userId } = route.params;

  const [loading, setLoading] = useState(false);
  const [validatingUser, setValidatingUser] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);

  const [formData, setFormData] = useState<CoachProfileFormData>({
    fullName: '',
    dateOfBirth: '',
    phoneNumber: '',
    email: '',
    specialties: [],
  });

  const [errors, setErrors] = useState<Partial<CoachProfileFormData>>({});

  useEffect(() => {
    validateUserAndInvitation();
  }, []);

  const validateUserAndInvitation = async () => {
    try {
      setValidatingUser(true);
      
      // Get invitation details
      const { data: invitationData, error: inviteError } = await supabase
        .from('invitations')
        .select(`
          id,
          email,
          organization_id,
          expires_at,
          status,
          recipient_name,
          organizations (
            name
          )
        `)
        .eq('code', invitationCode)
        .eq('role', 'coach')
        .single();

      if (inviteError || !invitationData) {
        throw new Error('Invalid invitation code');
      }

      if (invitationData.status !== 'accepted') {
        throw new Error('This invitation has not been accepted yet');
      }

      // Get user data
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        throw new Error('User not authenticated');
      }

      if (userData.user.id !== userId) {
        throw new Error('User mismatch');
      }

      setInvitation({
        ...invitationData,
        organization_name: (invitationData.organizations as any)?.name || 'Unknown Organization',
      });

      // Pre-fill email and name from invitation
      setFormData(prev => ({
        ...prev,
        email: invitationData.email,
        fullName: invitationData.recipient_name || userData.user.user_metadata?.full_name || '',
      }));

    } catch (error: any) {
      console.error('Validation error:', error);
      Alert.alert(
        'Access Error',
        error.message || 'Unable to access this profile completion form.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login' as never),
          },
        ]
      );
    } finally {
      setValidatingUser(false);
    }
  };

  const validateForm = (): boolean => {
    const profileData: CoachProfileData = {
      fullName: formData.fullName,
      dateOfBirth: formData.dateOfBirth,
      phoneNumber: formData.phoneNumber,
      specialties: formData.specialties,
    };

    const validation = validateCoachProfile(profileData);
    setErrors(validation.errors as Partial<CoachProfileFormData>);
    return validation.isValid;
  };

  const toggleSpecialty = (specialtyId: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialtyId)
        ? prev.specialties.filter(id => id !== specialtyId)
        : [...prev.specialties, specialtyId],
    }));
    
    // Clear specialty error if selecting
    if (errors.specialties) {
      setErrors(prev => ({ ...prev, specialties: undefined }));
    }
  };

    const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const profileData: CoachProfileData = {
        fullName: formData.fullName,
        email: formData.email,
        dateOfBirth: formData.dateOfBirth,
        phoneNumber: formData.phoneNumber,
        specialties: formData.specialties,
      };

      const result = await completeCoachProfile(userId, profileData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to complete profile');
      }

      Alert.alert(
        'Profile Complete! 🎉',
        `Welcome to ${invitation?.organization_name || 'your organization'}! Your coach profile has been set up successfully.`,
        [
          {
            text: 'Get Started',
            onPress: () => {
              // Navigate to login with success message
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' as never }],
              });
            },
          },
        ]
      );

    } catch (error: any) {
      console.error('Profile completion error:', error);
      Alert.alert(
        'Update Failed',
        error.message || 'Failed to complete your profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (validatingUser) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your profile setup...</Text>
      </SafeAreaView>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <BackButton
            onPress={() => navigation.goBack()}
            variant="simple"
            title=""
            iconSize={24}
            iconColor={COLORS.textPrimary}
          />
          <Text style={styles.headerTitle}>Complete Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>🛹 Welcome to Eleve!</Text>
            <Text style={styles.welcomeSubtitle}>
              Complete your coach profile for {invitation.organization_name}
            </Text>
          </View>

          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={[styles.input, errors.fullName ? styles.inputError : null]}
                value={formData.fullName}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, fullName: text }));
                  if (errors.fullName) setErrors(prev => ({ ...prev, fullName: undefined }));
                }}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="words"
              />
              {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
            </View>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth *</Text>
              <TextInput
                style={[styles.input, errors.dateOfBirth ? styles.inputError : null]}
                value={formData.dateOfBirth}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, dateOfBirth: text }));
                  if (errors.dateOfBirth) setErrors(prev => ({ ...prev, dateOfBirth: undefined }));
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
              />
              {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
              <Text style={styles.helpText}>Enter your birth date (e.g., 1990-05-15)</Text>
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={[styles.input, errors.phoneNumber ? styles.inputError : null]}
                value={formData.phoneNumber}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, phoneNumber: text }));
                  if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: undefined }));
                }}
                placeholder="Enter your phone number"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="phone-pad"
              />
              {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
            </View>

            {/* Email (pre-filled) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={formData.email}
                editable={false}
                placeholderTextColor={COLORS.textSecondary}
              />
              <Text style={styles.helpText}>This email is from your invitation</Text>
            </View>

            {/* Specialties */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Specialties * (Select one or more)</Text>
              <View style={styles.specialtyContainer}>
                {specialtyOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.specialtyOption,
                      formData.specialties.includes(option.id) && styles.specialtySelected,
                      errors.specialties && styles.specialtyError,
                    ]}
                    onPress={() => toggleSpecialty(option.id)}
                  >
                    <Text style={styles.specialtyEmoji}>{option.emoji}</Text>
                    <Text style={[
                      styles.specialtyLabel,
                      formData.specialties.includes(option.id) && styles.specialtyLabelSelected,
                    ]}>
                      {option.label}
                    </Text>
                    {formData.specialties.includes(option.id) && (
                      <Check size={20} color={COLORS.textInverse} style={styles.specialtyCheck} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              {errors.specialties && <Text style={styles.errorText}>Please select at least one specialty</Text>}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textInverse} />
            ) : (
              <Text style={styles.submitButtonText}>Complete Profile & Get Started 🎉</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              All information is secure and will only be used to personalize your coaching experience.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  headerSpacer: {
    width: 48, // Balance the back button
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  welcomeSection: {
    padding: SPACING.screenPadding,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: TYPOGRAPHY.sizes.h2,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    paddingHorizontal: SPACING.screenPadding,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
  },
  inputDisabled: {
    backgroundColor: COLORS.surfaceElevated,
    color: COLORS.textSecondary,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  helpText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  errorText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  specialtyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  specialtyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    minWidth: 100,
  },
  specialtySelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  specialtyError: {
    borderColor: COLORS.error,
  },
  specialtyEmoji: {
    fontSize: 20,
    marginRight: SPACING.xs,
  },
  specialtyLabel: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    flex: 1,
  },
  specialtyLabelSelected: {
    color: COLORS.textInverse,
  },
  specialtyCheck: {
    marginLeft: SPACING.xs,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginHorizontal: SPACING.screenPadding,
    marginTop: SPACING.xl,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  footer: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default CoachProfileCompletionScreen; 