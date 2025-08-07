import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Building2, 
  User, 
  Mail, 
  Lock, 
  Phone,
  MapPin,
  Eye,
  EyeOff,
  ArrowLeft,
  Check
} from 'lucide-react-native';
import { supabase } from '../../../shared/lib/supabase';
import { RootStackParamList } from '../../../shared/types';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';

type SignUpBusinessScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SignUpBusiness'>;

const SignUpBusinessScreen: React.FC = () => {
  const navigation = useNavigation<SignUpBusinessScreenNavigationProp>();
  
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    location: '',
    password: '',
    confirmPassword: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleSignUp = async () => {
    // Validation
    if (!formData.businessName || !formData.ownerName || !formData.email || !formData.password) {
      Alert.alert('Missing Information', 'Please fill in all required fields (Business Name, Owner Name, Email, and Password).');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please make sure both password fields are identical.');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Password Too Short', 'Password must be at least 6 characters long for security.');
      return;
    }

    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!acceptedTerms) {
      Alert.alert('Terms Required', 'Please accept the terms and conditions to continue.');
      return;
    }

    setLoading(true);

    try {
      console.log('Starting signup process...');
      
      // Check if email already exists in auth.users
      const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
      const emailExists = existingAuthUser?.users?.some(user => user.email === formData.email.trim());

      if (emailExists) {
        Alert.alert(
          'Account Already Exists',
          'An account with this email already exists. Please use a different email or try signing in instead.',
          [
            {
              text: 'Sign In Instead',
              onPress: () => navigation.navigate('Login'),
            },
            {
              text: 'Try Different Email',
              style: 'cancel',
            },
          ]
        );
        return;
      }

      // Create auth user
      console.log('Creating auth user...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.ownerName.trim(),
            role: 'business',
          },
        },
      });

      if (authError) {
        console.error('Auth error:', authError);
        
        // Handle specific auth errors
        if (authError.message.includes('email')) {
          Alert.alert('Email Issue', 'There was a problem with the email address. Please check it and try again.');
        } else if (authError.message.includes('password')) {
          Alert.alert('Password Issue', 'Password requirements not met. Please use a stronger password.');
        } else if (authError.message.includes('already registered')) {
          Alert.alert('Account Exists', 'This email is already registered. Please use a different email or sign in.');
        } else {
          Alert.alert('Signup Failed', `Authentication error: ${authError.message}`);
        }
        return;
      }

      if (!authData.user) {
        Alert.alert('Signup Failed', 'No user account was created. Please try again.');
        return;
      }

      console.log('Auth user created successfully:', authData.user.id);

      // Create organization first
      console.log('Creating organization...');
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: formData.businessName.trim(),
          owner_id: authData.user.id,
          subscription_plan: 'free',
        })
        .select()
        .single();

      if (orgError) {
        console.error('Organization creation error:', orgError);
        
        if (orgError.code === '23505') {
          Alert.alert('Organization Exists', 'A business with this name already exists. Please choose a different name.');
        } else {
          Alert.alert('Organization Creation Failed', `Unable to create your organization: ${orgError.message}`);
        }
        return;
      }

      console.log('Organization created successfully:', orgData.id);

      // Create admin record for the business owner
      console.log('Creating admin record...');
      const { error: adminError } = await supabase
        .from('admins')
        .insert({
          id: authData.user.id,
          organization_id: orgData.id,
          is_owner: true,
        });

      if (adminError) {
        console.error('Admin creation error:', adminError);
        
        if (adminError.code === '23505') {
          // Admin already exists, update instead
          const { error: updateError } = await supabase
            .from('admins')
            .update({
              organization_id: orgData.id,
              is_owner: true,
            })
            .eq('id', authData.user.id);

          if (updateError) {
            Alert.alert('Admin Setup Failed', 'Unable to set up your admin account. Please contact support.');
            return;
          }
        } else {
          Alert.alert('Admin Creation Failed', `Unable to create your admin account: ${adminError.message}`);
          return;
        }
      }

      console.log('Admin record created successfully');

      // Success - navigate to home
      Alert.alert(
        'Welcome to Eleve! 🎉',
        `Your business "${formData.businessName}" has been created successfully. You can now start inviting coaches and managing your organization.`,
        [
          {
            text: 'Get Started',
            onPress: () => navigation.navigate('AdminHome' as never),
          },
        ]
      );

      // Clear form
      setFormData({
        businessName: '',
        ownerName: '',
        email: '',
        phone: '',
        location: '',
        password: '',
        confirmPassword: '',
      });
      setAcceptedTerms(false);
    } catch (error: any) {
      console.error('Signup error:', error);
      Alert.alert('Signup Failed', error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <LinearGradient
          colors={[COLORS.primary, '#4A90E2']}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={SIZES.icon.medium} color={COLORS.textInverse} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Building2 size={SIZES.icon.large} color={COLORS.textInverse} />
            <Text style={styles.headerTitle}>Start Your Business</Text>
            <Text style={styles.headerSubtitle}>
              Create your coaching business account
            </Text>
          </View>
        </LinearGradient>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.formContent}>
            
            {/* Business Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Name *</Text>
              <View style={styles.inputContainer}>
                <Building2 size={SIZES.icon.medium} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Elite Skate Academy"
                  value={formData.businessName}
                  onChangeText={(value) => updateFormData('businessName', value)}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Owner Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Owner Name *</Text>
              <View style={styles.inputContainer}>
                <User size={SIZES.icon.medium} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="John Smith"
                  value={formData.ownerName}
                  onChangeText={(value) => updateFormData('ownerName', value)}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <View style={styles.inputContainer}>
                <Mail size={SIZES.icon.medium} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="john@eliteskateacademy.com"
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <View style={styles.inputContainer}>
                <Phone size={SIZES.icon.medium} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChangeText={(value) => updateFormData('phone', value)}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <View style={styles.inputContainer}>
                <MapPin size={SIZES.icon.medium} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Los Angeles, CA"
                  value={formData.location}
                  onChangeText={(value) => updateFormData('location', value)}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password *</Text>
              <View style={styles.inputContainer}>
                <Lock size={SIZES.icon.medium} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter password"
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={SIZES.icon.medium} color={COLORS.textSecondary} />
                  ) : (
                    <Eye size={SIZES.icon.medium} color={COLORS.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password *</Text>
              <View style={styles.inputContainer}>
                <Lock size={SIZES.icon.medium} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateFormData('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={SIZES.icon.medium} color={COLORS.textSecondary} />
                  ) : (
                    <Eye size={SIZES.icon.medium} color={COLORS.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms and Conditions */}
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
            >
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms && <Check size={SIZES.icon.small} color={COLORS.textInverse} />}
              </View>
              <Text style={styles.termsText}>
                I accept the{' '}
                <Text style={styles.termsLink}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
            >
              <Text style={styles.signUpButtonText}>
                {loading ? 'Creating Account...' : 'Create Business Account'}
              </Text>
            </TouchableOpacity>

            {/* Login Link */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginLinkText}>
                Already have an account? Sign In
              </Text>
            </TouchableOpacity>

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
  flex: {
    flex: 1,
  },
  header: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.screenPadding,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: SPACING.lg,
    left: SPACING.screenPadding,
    zIndex: 1,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.h2,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textInverse,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textInverse,
    opacity: 0.9,
  },
  form: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  eyeButton: {
    padding: SPACING.xs,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xl,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    marginRight: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  termsText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    lineHeight: 20,
    flex: 1,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  signUpButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  signUpButtonDisabled: {
    backgroundColor: COLORS.textTertiary,
  },
  signUpButtonText: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textInverse,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  loginLinkText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});

export default SignUpBusinessScreen; 