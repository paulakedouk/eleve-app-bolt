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
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getOrganizationBySlug, authenticateStudent } from '../../../shared/services/onboardingService';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../../shared/utils/constants';

interface StudentOrgLoginScreenProps {
  route: {
    params: {
      organizationSlug: string;
    };
  };
}

interface OrganizationData {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
}

const StudentOrgLoginScreen: React.FC<StudentOrgLoginScreenProps> = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { organizationSlug } = route.params;

  const [loading, setLoading] = useState(false);
  const [loadingOrg, setLoadingOrg] = useState(true);
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [showPasscode, setShowPasscode] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    passcode: '',
  });

  useEffect(() => {
    loadOrganization();
  }, []);

  const loadOrganization = async () => {
    try {
      setLoadingOrg(true);
      const org = await getOrganizationBySlug(organizationSlug);
      
      if (!org) {
        Alert.alert(
          'Organization Not Found',
          'The organization you\'re trying to access doesn\'t exist or has been disabled.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
        return;
      }

      setOrganization(org);
    } catch (error) {
      console.error('Error loading organization:', error);
      Alert.alert(
        'Error',
        'Failed to load organization information. Please try again.',
        [
          {
            text: 'Retry',
            onPress: loadOrganization,
          },
          {
            text: 'Cancel',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } finally {
      setLoadingOrg(false);
    }
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      Alert.alert('Missing Username', 'Please enter your username');
      return false;
    }

    if (!formData.passcode.trim()) {
      Alert.alert('Missing Passcode', 'Please enter your passcode');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateForm() || !organization) return;

    setLoading(true);
    try {
      const result = await authenticateStudent(
        formData.username,
        formData.passcode,
        organization.id
      );

      if (!result.success) {
        Alert.alert(
          'Login Failed',
          result.message || 'Invalid username or passcode. Please check your credentials and try again.'
        );
        return;
      }

      // Store student data for the session
      // In a real app, you might want to use a more secure storage method
      console.log('Student logged in:', result.student);

      Alert.alert(
        'Welcome Back!',
        `Hi ${result.student.name}! Ready to practice some tricks?`,
        [
          {
            text: 'Let\'s Go!',
            onPress: () => navigation.navigate('StudentDashboard' as never),
          },
        ]
      );

    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Error',
        'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingOrg) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading {organizationSlug}...</Text>
      </View>
    );
  }

  if (!organization) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={COLORS.gradients.primary as [string, string]}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              {organization.logo_url ? (
                <Image
                  source={{ uri: organization.logo_url }}
                  style={styles.logo}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.logoText}>🛹</Text>
              )}
            </View>
            <Text style={styles.title}>Welcome to {organization.name}</Text>
            <Text style={styles.subtitle}>Student Login</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.form}>
              <Text style={styles.formTitle}>Ready to ride? 🚀</Text>
              <Text style={styles.formSubtitle}>
                Enter your username and passcode to access your student dashboard
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  value={formData.username}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
                  placeholder="Enter your username"
                  placeholderTextColor={COLORS.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Passcode</Text>
                <View style={styles.passcodeContainer}>
                  <TextInput
                    style={styles.passcodeInput}
                    value={formData.passcode}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, passcode: text }))}
                    placeholder="Enter your passcode"
                    placeholderTextColor={COLORS.textSecondary}
                    secureTextEntry={!showPasscode}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="numeric"
                    maxLength={6}
                  />
                  <TouchableOpacity
                    style={styles.passcodeToggle}
                    onPress={() => setShowPasscode(!showPasscode)}
                  >
                    <Text style={styles.passcodeToggleText}>
                      {showPasscode ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.helpText}>
                  Your 6-digit passcode from your parent
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.textInverse} />
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </TouchableOpacity>

              <View style={styles.helpSection}>
                <Text style={styles.helpTitle}>Need Help? 🤔</Text>
                <Text style={styles.helpContent}>
                  • Can't remember your username or passcode? Ask your parent!
                </Text>
                <Text style={styles.helpContent}>
                  • Having trouble logging in? Contact your coach or academy administrator
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
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
    paddingTop: SPACING.xxl,
    paddingHorizontal: SPACING.screenPadding,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.overlayWhite,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logo: {
    width: 60,
    height: 60,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.h1,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textInverse,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.h4,
    color: COLORS.textInverse,
    opacity: 0.9,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  form: {
    flex: 1,
  },
  formTitle: {
    fontSize: TYPOGRAPHY.sizes.h2,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
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
  passcodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  passcodeInput: {
    flex: 1,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: 2,
  },
  passcodeToggle: {
    padding: SPACING.md,
  },
  passcodeToggleText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  helpText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  helpSection: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.lg,
  },
  helpTitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  helpContent: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
});

export default StudentOrgLoginScreen; 