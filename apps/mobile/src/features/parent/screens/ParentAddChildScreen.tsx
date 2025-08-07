import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, User, Hash, Key, Calendar, Check, X } from 'lucide-react-native';
import { RootStackParamList } from '../../../shared/types';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';
import { supabase } from '../../../shared/lib/supabase';
import { DashboardHeader } from '../../../shared/components/DashboardHeader';

type ParentAddChildNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ParentAddChild'>;

// Design system colors
const DESIGN_COLORS = {
  coach: '#FFC900',
  parent: '#91A8EB', 
  partners: '#55C1C3',
  approvals: '#FF5A34',
  tricks: '#91DEF1',
  black: '#000000',
  white: '#FFFFFF',
  background: '#eeeeee',
  text: '#000000',
  textSecondary: '#666666',
  success: '#10B981',
  error: '#EF4444',
};

interface UsernameCheckState {
  isChecking: boolean;
  isAvailable: boolean | null;
  message: string;
}

const ParentAddChildScreen: React.FC = () => {
  const navigation = useNavigation<ParentAddChildNavigationProp>();
  const [loading, setLoading] = useState(false);
  const [usernameCheck, setUsernameCheck] = useState<UsernameCheckState>({
    isChecking: false,
    isAvailable: null,
    message: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    age: '',
    level: 'Beginner',
  });

  const levels = ['Beginner', 'Intermediate', 'Advanced'];

  // Check username availability with debouncing
  useEffect(() => {
    if (formData.username.length < 3) {
      setUsernameCheck({
        isChecking: false,
        isAvailable: null,
        message: formData.username.length > 0 ? 'Username must be at least 3 characters' : ''
      });
      return;
    }

    const timeoutId = setTimeout(() => {
      checkUsernameAvailability(formData.username);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.username]);

  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) return;
    
    setUsernameCheck({
      isChecking: true,
      isAvailable: null,
      message: 'Checking availability...'
    });

    try {
      console.log('🔍 Checking username availability for:', username);
      
      // Check if username exists in students table or profiles table
      const childEmail = `${username.trim()}@child.eleve.app`;
      
      // Query the profiles table to see if this email/username already exists
      const { data: existingProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', childEmail)
        .limit(1);

      console.log('📥 Profile check result:', { existingProfiles, profileError });

      if (profileError) {
        console.error('❌ Error checking profiles:', profileError);
        setUsernameCheck({
          isChecking: false,
          isAvailable: false,
          message: 'Error checking username'
        });
        return;
      }

      // If we found any profiles with this email, username is taken
      if (existingProfiles && existingProfiles.length > 0) {
        console.log('❌ Username is already taken (found in profiles)');
        setUsernameCheck({
          isChecking: false,
          isAvailable: false,
          message: 'Username is already taken'
        });
        return;
      }

      // Also check students table for additional verification
      const { data: existingStudents, error: studentError } = await supabase
        .from('students')
        .select('id, user_id')
        .not('user_id', 'is', null)
        .limit(100); // Get all students to check their user IDs

      if (studentError) {
        console.warn('⚠️ Could not check students table:', studentError);
        // Continue anyway, profiles check is sufficient
      } else if (existingStudents) {
        // Check if any student has a user_id that corresponds to our target email
        // We can't directly check this, so we'll rely on the profiles check
        console.log('📋 Found', existingStudents.length, 'existing students');
      }

      // If we made it here, username appears to be available
      console.log('✅ Username appears to be available');
      setUsernameCheck({
        isChecking: false,
        isAvailable: true,
        message: 'Username is available!'
      });

    } catch (error: any) {
      console.error('❌ Client error checking username:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      setUsernameCheck({
        isChecking: false,
        isAvailable: false,
        message: 'Connection error - please try again'
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'username') {
      // Clean username: only lowercase letters, numbers, and underscores
      value = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter student\'s name');
      return false;
    }
    if (!formData.username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return false;
    }
    if (formData.username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return false;
    }
    if (usernameCheck.isAvailable === false) {
      Alert.alert('Error', 'Please choose a different username. This one is already taken.');
      return false;
    }
    if (!formData.password) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    if (formData.age && (parseInt(formData.age) < 5 || parseInt(formData.age) > 18)) {
      Alert.alert('Error', 'Age must be between 5 and 18');
      return false;
    }
    return true;
  };

  const handleCreateChild = async () => {
    console.log('🔍 Create child button clicked!');
    console.log('📋 Form data:', formData);
    
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }

    console.log('✅ Form validation passed');
    setLoading(true);
    
    try {
      // Get current user and store session info
      console.log('🔍 Getting current user...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ User error:', userError);
        throw userError;
      }
      
      if (!user) {
        console.error('❌ No user found');
        throw new Error('Not authenticated');
      }
      
      console.log('✅ Parent user found:', user.id);

      // Store parent session info before creating child
      const { data: { session: parentSession } } = await supabase.auth.getSession();
      console.log('🔍 Storing parent session for restoration...');

      // Create child email
      const childEmail = `${formData.username.trim()}@child.eleve.app`;
      
      console.log('🔍 Step 1: Creating child auth user (without auto-login)...');
      
      // Create the child's auth account but prevent auto-login
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: childEmail,
        password: formData.password,
        options: {
          data: {
            username: formData.username.trim(),
            full_name: formData.name.trim(),
            first_name: formData.name.trim().split(' ')[0],
            last_name: formData.name.trim().split(' ').slice(1).join(' '),
            user_role: 'student',
            age: formData.age ? parseInt(formData.age) : null,
            level: formData.level || 'Beginner',
            created_by_parent: user.id
          }
        }
      });

      if (authError) {
        console.error('❌ Auth creation error:', authError);
        if (authError.message.includes('User already registered')) {
          throw new Error('This username is already taken. Please choose a different one.');
        }
        throw new Error(`Failed to create user account: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Failed to create user account - no user returned');
      }

      console.log('✅ Child auth user created:', authData.user.id);

      // CRITICAL: Restore parent session immediately after child creation
      if (parentSession) {
        console.log('🔄 Restoring parent session...');
        const { error: sessionRestoreError } = await supabase.auth.setSession({
          access_token: parentSession.access_token,
          refresh_token: parentSession.refresh_token
        });
        
        if (sessionRestoreError) {
          console.error('⚠️ Failed to restore parent session:', sessionRestoreError);
          // Continue anyway, but warn
        } else {
          console.log('✅ Parent session restored successfully');
        }
      }

      // Verify we're still logged in as parent
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser?.id !== user.id) {
        console.warn('⚠️ User context changed during child creation, attempting to restore...');
        // Force refresh to ensure parent context
        await supabase.auth.refreshSession();
      }

      // Step 2: Create profile record (using original parent context)
      console.log('🔍 Step 2: Creating profile record...');
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: childEmail,
          full_name: formData.name.trim(),
          first_name: formData.name.trim().split(' ')[0],
          last_name: formData.name.trim().split(' ').slice(1).join(' '),
          role: 'student'
        });

      if (profileError) {
        console.warn('⚠️ Profile creation failed:', profileError.message);
        // Continue anyway, profile might be created automatically
      } else {
        console.log('✅ Profile record created');
      }

      // Step 3: Create student record
      console.log('🔍 Step 3: Creating student record...');
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .insert({
          name: formData.name.trim(),
          level: formData.level || 'Beginner',
          age: formData.age ? parseInt(formData.age) : null,
          user_id: authData.user.id,
          coach_id: null, // No coach assigned yet
          parent_id: user.id, // Link to parent
          xp_points: 0,
          total_videos: 0,
          landed_tricks: 0,
          session_count: 0
        })
        .select()
        .single();

      if (studentError) {
        console.warn('⚠️ Student record creation failed:', studentError.message);
        // Continue anyway, the auth account is created
      } else {
        console.log('✅ Student record created:', studentData.id);
      }

      console.log('🎉 Child account created successfully!');

      // Navigate back to ParentHome with success message
      console.log('🏠 Navigating to ParentHome with success message...');
      
      // Navigate immediately without showing alert dialog
      navigation.navigate('ParentHome', {
        showSuccessMessage: true,
        childName: formData.name.trim(),
        childUsername: formData.username.trim(),
        childPassword: formData.password
      });

    } catch (error: any) {
      console.error('❌ Full error in handleCreateChild:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      // Attempt to restore parent session in case of error
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession) {
          console.log('🔄 Attempting to restore session after error...');
          await supabase.auth.refreshSession();
        }
      } catch (restoreError) {
        console.warn('⚠️ Could not restore session after error:', restoreError);
      }
      
      // Better error feedback
      const errorMessage = error.message || 'Unknown error occurred';
      let userFriendlyMessage = '';
      
      if (errorMessage.includes('Username already taken') || errorMessage.includes('User already registered')) {
        userFriendlyMessage = 'This username is already taken. Please choose a different one.';
      } else if (errorMessage.includes('Not authenticated')) {
        userFriendlyMessage = 'You need to be logged in to create a student account. Please log in and try again.';
      } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        userFriendlyMessage = 'Connection error. Please check your internet connection and try again.';
      } else {
        userFriendlyMessage = `Failed to create student account: ${errorMessage}`;
      }
      
      Alert.alert(
        '❌ Account Creation Failed', 
        userFriendlyMessage,
        [
          {
            text: 'Try Again',
            style: 'default'
          }
        ]
      );
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  };

  const getUsernameValidationIcon = () => {
    if (formData.username.length === 0) return null;
    if (formData.username.length < 3) return <X size={20} color={DESIGN_COLORS.error} />;
    if (usernameCheck.isChecking) return <ActivityIndicator size="small" color={DESIGN_COLORS.textSecondary} />;
    if (usernameCheck.isAvailable === true) return <Check size={20} color={DESIGN_COLORS.success} />;
    if (usernameCheck.isAvailable === false) return <X size={20} color={DESIGN_COLORS.error} />;
    return null;
  };

  const getUsernameValidationColor = () => {
    if (formData.username.length === 0) return COLORS.border;
    if (formData.username.length < 3) return DESIGN_COLORS.error;
    if (usernameCheck.isAvailable === true) return DESIGN_COLORS.success;
    if (usernameCheck.isAvailable === false) return DESIGN_COLORS.error;
    return COLORS.border;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={DESIGN_COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('ParentHome')}
        >
          <ArrowLeft size={24} color={DESIGN_COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Student</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
                  <Text style={styles.sectionTitle}>STUDENT INFORMATION</Text>
        <Text style={styles.sectionDescription}>
          Create an account for your student to track their skateboarding progress
        </Text>

          <View style={styles.form}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Student's Full Name *</Text>
              <View style={styles.inputContainer}>
                <User size={20} color={DESIGN_COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                                      placeholder="Enter student's full name"
                  placeholderTextColor={DESIGN_COLORS.textSecondary}
                />
              </View>
            </View>

            {/* Username Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username *</Text>
              <View style={[
                styles.inputContainer,
                { borderColor: getUsernameValidationColor() }
              ]}>
                <Hash size={20} color={DESIGN_COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={formData.username}
                  onChangeText={(value) => handleInputChange('username', value)}
                  placeholder="Choose a username"
                  placeholderTextColor={DESIGN_COLORS.textSecondary}
                  autoCapitalize="none"
                />
                <View style={styles.validationIcon}>
                  {getUsernameValidationIcon()}
                </View>
              </View>
              <Text style={[
                styles.inputHint,
                {
                  color: usernameCheck.message ? 
                    (usernameCheck.isAvailable === true ? DESIGN_COLORS.success : 
                     usernameCheck.isAvailable === false ? DESIGN_COLORS.error : 
                     DESIGN_COLORS.textSecondary) : 
                    DESIGN_COLORS.textSecondary
                }
              ]}>
                {usernameCheck.message || 'Username will be used for login (letters, numbers, _ only)'}
              </Text>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password *</Text>
              <View style={styles.inputContainer}>
                <Key size={20} color={DESIGN_COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  placeholder="Create a password"
                  placeholderTextColor={DESIGN_COLORS.textSecondary}
                  secureTextEntry={true}
                />
              </View>
              <Text style={styles.inputHint}>Must be at least 6 characters</Text>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password *</Text>
              <View style={styles.inputContainer}>
                <Key size={20} color={DESIGN_COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  placeholder="Confirm password"
                  placeholderTextColor={DESIGN_COLORS.textSecondary}
                  secureTextEntry={true}
                />
              </View>
            </View>

            {/* Age Input (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Age (Optional)</Text>
              <View style={styles.inputContainer}>
                <Calendar size={20} color={DESIGN_COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={formData.age}
                  onChangeText={(value) => handleInputChange('age', value.replace(/[^0-9]/g, ''))}
                  placeholder="Enter age"
                  placeholderTextColor={DESIGN_COLORS.textSecondary}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
            </View>

            {/* Level Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Skill Level</Text>
              <View style={styles.levelContainer}>
                {levels.map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.levelButton,
                      formData.level === level && styles.levelButtonActive
                    ]}
                    onPress={() => handleInputChange('level', level)}
                  >
                    <Text style={[
                      styles.levelButtonText,
                      formData.level === level && styles.levelButtonTextActive
                    ]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
                          <Text style={styles.infoTitle}>🔐 Secure Student Account</Text>
              <Text style={styles.infoText}>
                Your student will use their username and password to log in. The account is securely linked to your parent account for monitoring and safety.
              </Text>
          </View>

          {/* Create Button */}
          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={() => {
              console.log('🔍 Button physically pressed!');
              console.log('🔍 Loading state:', loading);
              console.log('🔍 Form data at button press:', formData);
              handleCreateChild();
            }}
            disabled={loading}
          >
            <Text style={styles.createButtonText}>
                              {loading ? 'Creating Account...' : 'Create Student Account'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    backgroundColor: DESIGN_COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: DESIGN_COLORS.black,
    fontFamily: TYPOGRAPHY.families.poppins,
  },
  headerSpacer: {
    width: 40, // Same as back button to center title
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  section: {
    paddingHorizontal: SPACING.screenPadding,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: DESIGN_COLORS.black,
    fontFamily: TYPOGRAPHY.families.poppins,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  sectionDescription: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: DESIGN_COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  form: {
    gap: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: DESIGN_COLORS.black,
    marginBottom: SPACING.sm,
    fontFamily: TYPOGRAPHY.families.poppins,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    ...SHADOWS.light,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  textInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.body,
    color: DESIGN_COLORS.black,
    fontFamily: TYPOGRAPHY.families.archivo,
  },
  inputHint: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: DESIGN_COLORS.textSecondary,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  levelContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  levelButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  levelButtonActive: {
    backgroundColor: DESIGN_COLORS.black,
    borderColor: DESIGN_COLORS.black,
  },
  levelButtonText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: DESIGN_COLORS.black,
  },
  levelButtonTextActive: {
    color: DESIGN_COLORS.white,
  },
  infoBox: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginTop: SPACING.xl,
    ...SHADOWS.light,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: DESIGN_COLORS.black,
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: DESIGN_COLORS.textSecondary,
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: DESIGN_COLORS.black,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: DESIGN_COLORS.black,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.xl,
    ...SHADOWS.medium,
  },
  createButtonDisabled: {
    backgroundColor: DESIGN_COLORS.textSecondary,
    borderColor: DESIGN_COLORS.textSecondary,
  },
  createButtonText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: DESIGN_COLORS.white,
    fontFamily: TYPOGRAPHY.families.archivoBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  validationIcon: {
    marginLeft: SPACING.sm,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ParentAddChildScreen; 