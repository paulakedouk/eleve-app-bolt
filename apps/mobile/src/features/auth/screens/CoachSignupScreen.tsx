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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../../shared/lib/supabase';
import { processCoachSignup, isUsernameAvailable } from '../../../shared/services/onboardingService';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../../shared/utils/constants';

interface CoachSignupScreenProps {
  route: {
    params: {
      invitationCode: string;
    };
  };
}

interface InvitationData {
  id: string;
  email: string;
  organization_id: string;
  organization_name: string;
  expires_at: string;
  status: string;
}

const CoachSignupScreen: React.FC<CoachSignupScreenProps> = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { invitationCode } = route.params;

  const [loading, setLoading] = useState(false);
  const [validatingInvitation, setValidatingInvitation] = useState(true);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    validateInvitation();
  }, []);

  const validateInvitation = async () => {
    try {
      setValidatingInvitation(true);
      
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          id,
          email,
          organization_id,
          expires_at,
          status,
          organizations (
            name
          )
        `)
        .eq('code', invitationCode)
        .eq('role', 'coach')
        .single();

      if (error || !data) {
        throw new Error('Invalid invitation code');
      }

      if (data.status !== 'pending') {
        throw new Error('This invitation has already been used or expired');
      }

      if (new Date(data.expires_at) < new Date()) {
        throw new Error('This invitation has expired');
      }

      setInvitation({
        ...data,
        organization_name: (data.organizations as any)?.name || 'Unknown Organization',
      });

    } catch (error: any) {
      console.error('Invitation validation error:', error);
      Alert.alert(
        'Invalid Invitation',
        error.message || 'This invitation link is invalid or has expired. Please contact your administrator for a new invitation.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } finally {
      setValidatingInvitation(false);
    }
  };

  const validateUsername = async (username: string) => {
    if (!username.trim()) {
      setUsernameError('Username is required');
      return false;
    }

    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      return false;
    }

    if (!invitation) {
      setUsernameError('Organization not found');
      return false;
    }

    setCheckingUsername(true);
    const available = await isUsernameAvailable(username, invitation.organization_id);
    setCheckingUsername(false);

    if (!available) {
      setUsernameError('Username is already taken');
      return false;
    }

    setUsernameError('');
    return true;
  };

  const handleUsernameChange = (text: string) => {
    setFormData(prev => ({ ...prev, username: text }));
    setUsernameError('');
  };

  const handleUsernameBlur = () => {
    if (formData.username.trim()) {
      validateUsername(formData.username);
    }
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }

    if (!formData.username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return false;
    }

    if (usernameError) {
      Alert.alert('Error', usernameError);
      return false;
    }

    if (!formData.password) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }

    if (formData.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await processCoachSignup(invitationCode, {
        password: formData.password,
        username: formData.username,
        full_name: formData.fullName,
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      Alert.alert(
        'Welcome to Eleve!',
        'Your coach account has been created successfully. You can now log in and start coaching!',
        [
          {
            text: 'Get Started',
            onPress: () => navigation.navigate('Login' as never),
          },
        ]
      );

    } catch (error: any) {
      console.error('Signup error:', error);
      Alert.alert('Signup Failed', error.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (validatingInvitation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Validating invitation...</Text>
      </View>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>🛹 Welcome to Eleve!</Text>
          <Text style={styles.subtitle}>
            Complete your coach account setup for {invitation.organization_name}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={formData.fullName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
              placeholder="Enter your full name"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.usernameContainer}>
              <TextInput
                style={[styles.input, usernameError ? styles.inputError : null]}
                value={formData.username}
                onChangeText={handleUsernameChange}
                onBlur={handleUsernameBlur}
                placeholder="Choose a username"
                placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {checkingUsername && (
                <ActivityIndicator size="small" color={COLORS.primary} style={styles.usernameSpinner} />
              )}
            </View>
            {usernameError ? (
              <Text style={styles.errorText}>{usernameError}</Text>
            ) : (
              <Text style={styles.helpText}>
                This will be your unique username for logging in
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={invitation.email}
              editable={false}
              placeholderTextColor={COLORS.textSecondary}
            />
            <Text style={styles.helpText}>This email is pre-filled from your invitation</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                placeholder="Create a password"
                placeholderTextColor={COLORS.textSecondary}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.passwordToggleText}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helpText}>Must be at least 8 characters</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
                placeholder="Confirm your password"
                placeholderTextColor={COLORS.textSecondary}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Text style={styles.passwordToggleText}>
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textInverse} />
            ) : (
              <Text style={styles.submitButtonText}>Complete Setup</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By creating an account, you agree to Eleve's Terms of Service and Privacy Policy
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    padding: SPACING.screenPadding,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.h1,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    flex: 1,
    padding: SPACING.screenPadding,
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
  usernameContainer: {
    position: 'relative',
  },
  usernameSpinner: {
    position: 'absolute',
    right: SPACING.md,
    top: SPACING.md,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  passwordInput: {
    flex: 1,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
  },
  passwordToggle: {
    padding: SPACING.md,
  },
  passwordToggleText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.medium,
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
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
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

export default CoachSignupScreen; 