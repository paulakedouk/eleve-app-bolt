import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../../shared/lib/supabase';
import { RootStackParamList } from '../../../shared/types';
import { Eye, EyeOff } from 'lucide-react-native';
import { SvgXml } from 'react-native-svg';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Eleve logo SVG content
const eleveLogo = `<svg width="251" height="75" viewBox="0 0 251 75" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M27.5 15.7998C33.4332 15.7998 38.4663 17.1332 42.5996 19.7998C46.7328 22.4664 49.8996 25.9996 52.0996 30.3994C54.2996 34.7327 55.4004 39.4664 55.4004 44.5996V50.3994H16.2314C16.4431 51.5048 16.732 52.5385 17.0996 53.5C17.9662 55.6998 19.2998 57.3996 21.0996 58.5996C22.8995 59.7996 25.2331 60.3994 28.0996 60.3994C30.6329 60.3994 32.6998 59.9663 34.2998 59.0996C35.9665 58.2329 37.1331 57.0663 37.7998 55.5996H54.4004C53.6004 59.3329 51.9996 62.6663 49.5996 65.5996C47.2663 68.5329 44.2663 70.8333 40.5996 72.5C36.9997 74.1666 32.8328 75 28.0996 75C23.4331 75 19.3001 74.1995 15.7002 72.5996C12.1002 70.9996 9.06628 68.8329 6.59961 66.0996C4.13306 63.3663 2.23368 60.2993 0.900391 56.8994C0.799799 56.6294 0.704907 56.3582 0.612305 56.0869L20.2881 16.5879C22.5392 16.0635 24.943 15.7998 27.5 15.7998ZM112.715 15.7998C118.648 15.7998 123.681 17.1332 127.814 19.7998C131.948 22.4664 135.114 25.9996 137.314 30.3994C139.514 34.7327 140.615 39.4664 140.615 44.5996V50.3994H101.446C101.658 51.5048 101.947 52.5385 102.314 53.5C103.181 55.6998 104.515 57.3996 106.314 58.5996C108.114 59.7996 110.448 60.3994 113.314 60.3994C115.848 60.3994 117.915 59.9663 119.515 59.0996C121.181 58.2329 122.348 57.0663 123.015 55.5996H139.615C138.815 59.3329 137.214 62.6663 134.814 65.5996C132.481 68.5329 129.481 70.8333 125.814 72.5C122.215 74.1666 118.048 75 113.314 75C108.648 75 104.515 74.1995 100.915 72.5996C97.315 70.9996 94.2811 68.8329 91.8145 66.0996C89.3479 63.3663 87.4485 60.2993 86.1152 56.8994C84.8486 53.4995 84.2148 49.9993 84.2148 46.3994V44.3994C84.2149 40.6663 84.8487 37.1 86.1152 33.7002C87.4486 30.2336 89.3149 27.1666 91.7148 24.5C94.1815 21.8334 97.1815 19.7335 100.715 18.2002C104.248 16.6002 108.248 15.7998 112.715 15.7998ZM224.492 15.7998C230.425 15.7998 235.459 17.1332 239.592 19.7998C243.725 22.4664 246.892 25.9996 249.092 30.3994C249.819 31.8309 250.423 33.3074 250.909 34.8262L243.152 50.3994H213.224C213.435 51.5048 213.724 52.5385 214.092 53.5C214.958 55.6998 216.292 57.3996 218.092 58.5996C219.892 59.7996 222.225 60.3994 225.092 60.3994C227.625 60.3994 229.692 59.9663 231.292 59.0996C232.959 58.2329 234.125 57.0663 234.792 55.5996H240.562L231.151 74.4893C229.247 74.8284 227.227 75 225.092 75C220.425 75 216.292 74.1995 212.692 72.5996C209.092 70.9996 206.058 68.8329 203.592 66.0996C201.125 63.3663 199.226 60.2993 197.893 56.8994C196.626 53.4995 195.992 49.9993 195.992 46.3994V44.3994C195.992 40.6663 196.626 37.1 197.893 33.7002C199.226 30.2336 201.092 27.1666 203.492 24.5C205.959 21.8334 208.959 19.7335 212.492 18.2002C216.026 16.6002 220.026 15.7998 224.492 15.7998ZM78.9932 73H60.793V13.2002H54.5928V0H78.9932V73ZM168.474 57.7998H170.664L179.722 17.7998H197.122L183.521 73H155.021L139.222 17.7998H157.822L168.474 57.7998ZM27.5 30.3994C25.1001 30.3994 23.0001 30.9664 21.2002 32.0996C19.4669 33.1662 18.1335 34.8331 17.2002 37.0996C16.7615 38.1336 16.4278 39.3006 16.1953 40.5996H38.2617C38.0451 39.3128 37.7249 38.1459 37.2998 37.0996C36.4998 34.8997 35.2662 33.2329 33.5996 32.0996C31.9997 30.9664 29.9665 30.3994 27.5 30.3994ZM112.715 30.3994C110.315 30.3994 108.215 30.9664 106.415 32.0996C104.682 33.1662 103.348 34.8331 102.415 37.0996C101.976 38.1336 101.643 39.3006 101.41 40.5996H123.477C123.26 39.3128 122.94 38.1459 122.515 37.0996C121.715 34.8997 120.481 33.2329 118.814 32.0996C117.215 30.9664 115.181 30.3994 112.715 30.3994ZM224.492 30.3994C222.092 30.3994 219.992 30.9664 218.192 32.0996C216.459 33.1662 215.126 34.8331 214.192 37.0996C213.754 38.1336 213.42 39.3006 213.188 40.5996H235.254C235.037 39.3128 234.717 38.1459 234.292 37.0996C233.492 34.8997 232.258 33.2329 230.592 32.0996C228.992 30.9664 226.959 30.3994 224.492 30.3994Z" fill="black"/>
</svg>`;

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignIn = async () => {
    if (!loginInput) {
      Alert.alert('Hold up! 🛑', 'Please enter your username or email');
      return;
    }

    if (!password) {
      Alert.alert('Almost there! 🔐', 'Please enter your password');
      return;
    }

    setLoading(true);

    try {
      // Determine if input is email or username
      const isEmail = loginInput.includes('@');
      let email = loginInput.trim();

      if (!isEmail) {
        // First, try as a child account (username@child.eleve.app)
        const childEmail = `${loginInput.trim()}@child.eleve.app`;
        
        try {
          const { data: childData, error: childError } = await supabase.auth.signInWithPassword({
            email: childEmail,
            password,
          });

          if (!childError && childData.user) {
            // Successfully logged in as child - proceed with normal flow
            const { data: userRole, error: roleError } = await supabase
              .rpc('get_user_role_mobile', { p_user_id: childData.user.id });

            if (roleError) {
              console.warn('Child account RPC function error, using fallback method:', roleError);
              
              // Fallback: Check if user exists in students table
              const { data: studentData } = await supabase
                .from('students')
                .select('id')
                .eq('id', childData.user.id)
                .single();
              
              if (studentData) {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'StudentDashboard' }],
                });
                setLoading(false);
                return;
              } else {
                // If not found in students, return to login
                console.warn('User not found in any role table, returning to login');
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
                setLoading(false);
                return;
              }
            }

            // Navigate based on role (should be 'student' for children)
            console.log('🔍 Child account user role detected:', userRole, typeof userRole);
            
            switch (userRole) {
              case 'student':
                console.log('✅ Navigating to StudentDashboard for student role');
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'StudentDashboard' }],
                });
                break;
              case 'business':
              case 'admin':
                console.log('👑 User is admin/business, navigating to AdminHome');
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'AdminHome' }],
                });
                break;
              case 'coach':
                console.log('🏀 User is coach, navigating to CoachHome');
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'CoachHome' }],
                });
                break;
              case 'parent':
                console.log('👨‍👩‍👧‍👦 User is parent, navigating to ParentHome');
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'ParentHome' }],
                });
                break;
              case 'child': // Handle 'child' role if that's what's being returned
              case null:
              case undefined:
                console.log('📝 Role is child/null/undefined, checking students table directly');
                // Fallback: Check if user exists in students table
                const { data: fallbackStudentData } = await supabase
                  .from('students')
                  .select('id, first_name, last_name')
                  .eq('id', childData.user.id)
                  .single();
                
                if (fallbackStudentData) {
                  console.log('✅ Found in students table:', fallbackStudentData.first_name, fallbackStudentData.last_name);
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'StudentDashboard' }],
                  });
                } else {
                  console.warn('❌ Child user not found in students table');
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  });
                }
                break;
              default:
                console.warn('❌ Unknown child account role:', userRole, 'checking all role tables...');
                
                // Debug: Check which table the user exists in
                const userId = childData.user.id;
                const debugChecks = await Promise.all([
                  supabase.from('students').select('id, first_name, last_name').eq('id', userId).single(),
                  supabase.from('coaches').select('id, first_name, last_name').eq('id', userId).single(),
                  supabase.from('parents').select('id, first_name, last_name').eq('id', userId).single(),
                  supabase.from('admins').select('id, first_name, last_name').eq('id', userId).single(),
                ]);
                
                console.log('🔍 Debug role checks:', {
                  student: debugChecks[0].data,
                  coach: debugChecks[1].data,
                  parent: debugChecks[2].data,
                  admin: debugChecks[3].data,
                });
                
                // Route based on what we found
                if (debugChecks[0].data) {
                  console.log('🎯 Found in students table, overriding role detection');
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'StudentDashboard' }],
                  });
                } else if (debugChecks[3].data) {
                  console.log('🎯 Found in admins table, routing to AdminHome');
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'AdminHome' }],
                  });
                } else {
                  console.warn('❌ User not found in any role table, returning to login');
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  });
                }
            }
            setLoading(false);
            return;
          }
        } catch (childLoginError) {
          console.log('Not a child account, trying organization login...');
        }

        // If child login failed, show organization login message
        Alert.alert(
          'Student Login', 
          'If this is a student account from your school/organization, please ask your coach for the correct login link!\n\nIf this is a child account created by a parent, please check your username and try again.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Get user role using the RPC function
        const { data: userRole, error: roleError } = await supabase
          .rpc('get_user_role_mobile', { p_user_id: data.user.id });

        if (roleError) {
          console.warn('RPC function error, using fallback method:', roleError);
          
          // Fallback: Check role tables directly (same as web)
          const userId = data.user.id;
          
          // Check admins table
          const { data: adminData } = await supabase
            .from('admins')
            .select('id')
            .eq('id', userId)
            .single();
          
          if (adminData) {
            navigation.navigate('AdminHome');
            return;
          }
          
          // Check coaches table
          const { data: coachData } = await supabase
            .from('coaches')
            .select('id')
            .eq('id', userId)
            .single();
          
          if (coachData) {
            navigation.navigate('CoachHome');
            return;
          }
          
          // Check parents table
          const { data: parentData } = await supabase
            .from('parents')
            .select('id')
            .eq('id', userId)
            .single();
          
          if (parentData) {
            navigation.navigate('ParentHome');
            return;
          }
          
          // Check students table
          const { data: studentData } = await supabase
            .from('students')
            .select('id')
            .eq('id', userId)
            .single();
          
          if (studentData) {
            navigation.navigate('StudentDashboard');
            return;
          }
          
          // Default fallback - return to login
          console.warn('Student data not found, returning to login');
          navigation.navigate('Login');
          return;
        }

        // Navigate based on role (original logic)
        switch (userRole) {
          case 'business':
          case 'admin':
            navigation.navigate('AdminHome');
            break;
          case 'coach':
            navigation.navigate('CoachHome');
            break;
          case 'parent':
            navigation.navigate('ParentHome');
            break;
          case 'student':
            navigation.navigate('StudentDashboard');
            break;
          default:
            console.warn('Unknown user role, returning to login');
            navigation.navigate('Login');
        }
      }
    } catch (error: any) {
      Alert.alert('Login Failed 😅', error.message || 'Something went wrong. Try again!');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!loginInput) {
      Alert.alert('Hold up! 🛑', 'Please enter your email');
      return;
    }

    if (!fullName) {
      Alert.alert('Almost there! 👤', 'Please enter your full name');
      return;
    }

    if (!businessName) {
      Alert.alert('Almost there! 🏢', 'Please enter your business name');
      return;
    }

    if (!password) {
      Alert.alert('Almost there! 🔐', 'Please enter your password');
      return;
    }

    if (!confirmPassword) {
      Alert.alert('Almost there! 🔐', 'Please confirm your password');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please try again.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: loginInput.trim(),
        password,
        options: {
          data: {
            full_name: fullName,
            business_name: businessName,
            role: 'business'
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        Alert.alert('Success! 🎉', 'Account created successfully! Please check your email to verify your account.');
        // Navigate to admin home or appropriate screen
        navigation.navigate('AdminHome');
      }
    } catch (error: any) {
      Alert.alert('Sign Up Failed 😅', error.message || 'Something went wrong. Try again!');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (isSignUp) {
      handleSignUp();
    } else {
      handleSignIn();
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          style={styles.scrollView}
        >
          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <SvgXml xml={eleveLogo} width={Math.min(280, screenWidth * 0.8)} height={80} />
            </View>

            {/* Toggle Buttons */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, !isSignUp && styles.toggleButtonActive]}
                onPress={() => setIsSignUp(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleButtonText, !isSignUp && styles.toggleButtonTextActive]}>
                  Login
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, isSignUp ? styles.toggleButtonActive : styles.toggleButtonInactive]}
                onPress={() => setIsSignUp(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleButtonText, isSignUp && styles.toggleButtonTextActive]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                {isSignUp ? 'Email' : 'Email or Username'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={isSignUp ? "Enter your email" : "Enter your email or username"}
                placeholderTextColor="#A0A0A0"
                value={loginInput}
                onChangeText={setLoginInput}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType={isSignUp ? "email-address" : "default"}
                returnKeyType="next"
                blurOnSubmit={false}
              />
            </View>

            {/* Sign Up Only Fields */}
            {isSignUp && (
              <>
                {/* Full Name Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#A0A0A0"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    returnKeyType="next"
                    blurOnSubmit={false}
                  />
                </View>

                {/* Business Name Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Business Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your business name"
                    placeholderTextColor="#A0A0A0"
                    value={businessName}
                    onChangeText={setBusinessName}
                    autoCapitalize="words"
                    returnKeyType="next"
                    blurOnSubmit={false}
                  />
                </View>
              </>
            )}

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#A0A0A0"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType={isSignUp ? "next" : "done"}
                  blurOnSubmit={!isSignUp}
                  onSubmitEditing={isSignUp ? undefined : handleSubmit}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#666" />
                  ) : (
                    <Eye size={20} color="#666" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input (Sign Up Only) */}
            {isSignUp && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm your password"
                    placeholderTextColor="#A0A0A0"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    activeOpacity={0.7}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} color="#666" />
                    ) : (
                      <Eye size={20} color="#666" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                {loading 
                  ? (isSignUp ? 'Creating Account...' : 'Signing in...') 
                  : (isSignUp ? 'Create Account' : 'Login')
                }
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: screenHeight * 0.9,
  },
  content: {
    flex: 1,
    paddingHorizontal: Math.max(24, screenWidth * 0.06),
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    minHeight: screenHeight * 0.8,
  },
  logoContainer: {
    marginBottom: screenHeight < 700 ? 40 : 60,
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: screenHeight < 700 ? 30 : 40,
    width: '100%',
    gap: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 4,
    minHeight: 48, // Better touch target
  },
  toggleButtonActive: {
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  toggleButtonInactive: {
    backgroundColor: 'transparent',
  },
  toggleButtonText: {
    fontSize: 18,
    fontFamily: 'ArchivoBlack-Regular',
    color: '#000',
  },
  toggleButtonTextActive: {
    color: '#000',
  },
  inputContainer: {
    width: '100%',
    marginBottom: screenHeight < 700 ? 20 : 24,
  },
  label: {
    fontSize: 16,
    fontFamily: 'ArchivoBlack-Regular',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: Math.max(56, screenHeight * 0.07),
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 4,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Archivo-Medium',
    color: '#000',
    shadowColor: '#000',
    shadowOffset: {
      width: 3,
      height: 3,
    },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: Math.max(56, screenHeight * 0.07),
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 3,
      height: 3,
    },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 16,
    borderRadius: 4,
    fontFamily: 'Archivo-Medium',
    color: '#000',
  },
  eyeButton: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 48, // Better touch target
    minHeight: 48,
  },
  button: {
    width: '100%',
    height: Math.max(56, screenHeight * 0.07),
    backgroundColor: '#91A8EB',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: screenHeight < 700 ? 12 : 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 3,
      height: 3,
    },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'ArchivoBlack-Regular',
    color: '#000',
  },
});

export default LoginScreen; 