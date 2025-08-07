import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  TextInput,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Users,
  Plus,
  X,
  Check,
  Shield,
  UserCheck
} from 'lucide-react-native';
import { RootStackParamList } from '../types';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, SIZES } from '../utils/constants';
import { supabase } from '../lib/supabase';

type ParentOnboardingNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ParentOnboarding'>;
type ParentOnboardingRouteProp = RouteProp<RootStackParamList, 'ParentOnboarding'>;

interface ChildData {
  name: string;
  age: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  notes: string;
}

const ParentOnboardingScreen: React.FC = () => {
  const navigation = useNavigation<ParentOnboardingNavigationProp>();
  const route = useRoute<ParentOnboardingRouteProp>();
  const { token } = route.params;

  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [parentData, setParentData] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [accountData, setAccountData] = useState({
    password: '',
    confirmPassword: '',
    username: '',
  });
  
  const [children, setChildren] = useState<ChildData[]>([
    { name: '', age: '', level: 'Beginner', notes: '' }
  ]);
  
  const [additionalNotes, setAdditionalNotes] = useState('');

  useEffect(() => {
    validateToken();
  }, []);

  const validateToken = async () => {
    try {
      setValidatingToken(true);
      
      // Validate the onboarding token
      const { data, error } = await supabase
        .rpc('validate_onboarding_token', { token_value: token });

      if (error) throw error;

      if (!data) {
        throw new Error('Invalid or expired invitation link');
      }

      // Get parent information
      const { data: parentInfo, error: parentError } = await supabase
        .from('parents')
        .select('*')
        .eq('id', data)
        .single();

      if (parentError) throw parentError;
      
      setParentData(parentInfo);
    } catch (error: any) {
      console.error('Token validation error:', error);
      Alert.alert(
        'Invalid Link',
        'This invitation link is invalid or has expired. Please contact your coach for a new invitation.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } finally {
      setValidatingToken(false);
    }
  };

  const addChild = () => {
    setChildren([...children, { name: '', age: '', level: 'Beginner', notes: '' }]);
  };

  const removeChild = (index: number) => {
    if (children.length > 1) {
      setChildren(children.filter((_, i) => i !== index));
    }
  };

  const updateChild = (index: number, field: keyof ChildData, value: string) => {
    setChildren(children.map((child, i) => 
      i === index ? { ...child, [field]: value } : child
    ));
  };

  const validateAccountForm = () => {
    if (!accountData.password.trim()) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }
    
    if (accountData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }
    
    if (accountData.password !== accountData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    
    if (!accountData.username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return false;
    }
    
    if (accountData.username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters long');
      return false;
    }
    
    return true;
  };

  const validateChildrenForm = () => {
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (!child.name.trim()) {
        Alert.alert('Error', `Please enter the name for child ${i + 1}`);
        return false;
      }
      if (!child.age.trim()) {
        Alert.alert('Error', `Please enter the age for child ${i + 1}`);
        return false;
      }
      const age = parseInt(child.age);
      if (isNaN(age) || age < 1 || age > 18) {
        Alert.alert('Error', `Please enter a valid age (1-18) for child ${i + 1}`);
        return false;
      }
    }
    return true;
  };

  const handleNextStep = async () => {
    if (step === 1) {
      if (!validateAccountForm()) return;
      
      setLoading(true);
      try {
        // Check if username is available by checking auth.users metadata
        const { data: existingUsers, error: checkError } = await supabase.auth.admin.listUsers();
        
        if (checkError) throw checkError;
        
        const usernameExists = existingUsers.users.some(user => 
          user.user_metadata?.username === accountData.username.trim()
        );

        if (usernameExists) {
          Alert.alert('Error', 'Username is already taken. Please choose a different username.');
          setLoading(false);
          return;
        }

        // Update auth user with username in metadata
        const { error: updateError } = await supabase.auth.admin.updateUserById(parentData.id, {
          user_metadata: {
            username: accountData.username.trim(),
          }
        });

        if (updateError) throw updateError;

        // Update auth user password
        const { error: passwordError } = await supabase.auth.updateUser({
          password: accountData.password,
        });

        if (passwordError) throw passwordError;

        setStep(2);
      } catch (error: any) {
        console.error('Account setup error:', error);
        Alert.alert('Error', error.message || 'Failed to set up account');
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      if (!validateChildrenForm()) return;
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Create family approval with children data
      const { error: approvalError } = await supabase
        .from('family_approvals')
        .insert({
          parent_id: parentData.id,
          organization_id: parentData.organization_id,
          submitted_by: parentData.id,
          status: 'pending',
          children_data: children,
          parent_notes: additionalNotes.trim(),
        });

      if (approvalError) throw approvalError;

      Alert.alert(
        'Application Submitted!',
        'Your family application has been submitted successfully. You will receive a notification once it has been reviewed and approved.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ParentHome'),
          },
        ]
      );

    } catch (error: any) {
      console.error('Submission error:', error);
      Alert.alert('Error', error.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Shield size={SIZES.icon.large} color={COLORS.primary} />
        <Text style={styles.stepTitle}>Set Up Your Account</Text>
        <Text style={styles.stepSubtitle}>
          Create your login credentials to access your parent dashboard
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username *</Text>
          <View style={styles.inputContainer}>
            <User size={SIZES.icon.medium} color={COLORS.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Choose a username"
              value={accountData.username}
              onChangeText={(value) => setAccountData({...accountData, username: value})}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password *</Text>
          <View style={styles.inputContainer}>
            <Lock size={SIZES.icon.medium} color={COLORS.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              value={accountData.password}
              onChangeText={(value) => setAccountData({...accountData, password: value})}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
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

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password *</Text>
          <View style={styles.inputContainer}>
            <Lock size={SIZES.icon.medium} color={COLORS.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              value={accountData.confirmPassword}
              onChangeText={(value) => setAccountData({...accountData, confirmPassword: value})}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
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

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Your username will be used to log in to your parent dashboard where you can view your children's progress and session reports.
          </Text>
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Users size={SIZES.icon.large} color={COLORS.primary} />
        <Text style={styles.stepTitle}>Add Your Children</Text>
        <Text style={styles.stepSubtitle}>
          Provide information about your children who will be participating in the coaching program
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Children Information</Text>
          <TouchableOpacity onPress={addChild} style={styles.addButton}>
            <Plus size={SIZES.icon.small} color={COLORS.primary} />
            <Text style={styles.addButtonText}>Add Child</Text>
          </TouchableOpacity>
        </View>

        {children.map((child, index) => (
          <View key={index} style={styles.childCard}>
            <View style={styles.childCardHeader}>
              <Text style={styles.childCardTitle}>Child {index + 1}</Text>
              {children.length > 1 && (
                <TouchableOpacity 
                  onPress={() => removeChild(index)}
                  style={styles.removeButton}
                >
                  <X size={SIZES.icon.small} color={COLORS.error} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.childInput}
                placeholder="Enter child's name"
                value={child.name}
                onChangeText={(value) => updateChild(index, 'name', value)}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputGroupHalf}>
                <Text style={styles.label}>Age *</Text>
                <TextInput
                  style={styles.childInput}
                  placeholder="Age"
                  value={child.age}
                  onChangeText={(value) => updateChild(index, 'age', value)}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroupHalf}>
                <Text style={styles.label}>Skill Level</Text>
                <View style={styles.levelButtons}>
                  {(['Beginner', 'Intermediate', 'Advanced'] as const).map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.levelButton,
                        child.level === level && styles.levelButtonActive
                      ]}
                      onPress={() => updateChild(index, 'level', level)}
                    >
                      <Text style={[
                        styles.levelButtonText,
                        child.level === level && styles.levelButtonTextActive
                      ]}>
                        {level.charAt(0)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={styles.childTextArea}
                placeholder="Any special notes about this child..."
                value={child.notes}
                onChangeText={(value) => updateChild(index, 'notes', value)}
                multiline
                numberOfLines={2}
              />
            </View>
          </View>
        ))}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Additional Notes (Optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Any additional information about your family..."
            value={additionalNotes}
            onChangeText={setAdditionalNotes}
            multiline
            numberOfLines={3}
          />
        </View>
      </View>
    </View>
  );

  if (validatingToken) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Validating invitation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <LinearGradient
          colors={[COLORS.primary, '#4A90E2']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Welcome, {parentData?.full_name}!</Text>
            <Text style={styles.headerSubtitle}>
              Complete your profile to join our coaching program
            </Text>
          </View>
        </LinearGradient>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / 2) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>Step {step} of 2</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {step === 1 ? renderStep1() : renderStep2()}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextButton, loading && styles.nextButtonDisabled]}
            onPress={handleNextStep}
            disabled={loading}
          >
            {step === 1 ? (
              <Text style={styles.nextButtonText}>
                {loading ? 'Setting up account...' : 'Continue'}
              </Text>
            ) : (
              <>
                <UserCheck size={SIZES.icon.medium} color={COLORS.textInverse} />
                <Text style={styles.nextButtonText}>
                  {loading ? 'Submitting application...' : 'Submit Application'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
  },
  header: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.screenPadding,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.h2,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textInverse,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textInverse,
    opacity: 0.9,
    textAlign: 'center',
  },
  progressContainer: {
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.round,
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.round,
  },
  progressText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.xl,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  stepTitle: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  stepSubtitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputGroupHalf: {
    flex: 1,
    marginBottom: SPACING.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    borderRadius: 4,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  childInput: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  childTextArea: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  eyeButton: {
    padding: SPACING.xs,
  },
  infoBox: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  infoText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  addButtonText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  childCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  childCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  childCardTitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  removeButton: {
    padding: SPACING.xs,
  },
  levelButtons: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  levelButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  levelButtonText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  levelButtonTextActive: {
    color: COLORS.textInverse,
  },
  footer: {
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  nextButtonDisabled: {
    backgroundColor: COLORS.textTertiary,
  },
  nextButtonText: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textInverse,
  },
});

export default ParentOnboardingScreen; 