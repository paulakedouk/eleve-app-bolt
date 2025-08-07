import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Import types
import { RootStackParamList } from './src/shared/types';
import { supabase } from './src/shared/lib/supabase';
import { useFonts } from './src/shared/hooks/useFonts';

// Import screens
import CoachHomeScreen from './src/features/coach/screens/CoachHomeScreen';
import CoachVideosListScreen from './src/features/coach/screens/CoachVideosListScreen';
import CoachMenuScreen from './src/features/coach/screens/CoachMenuScreen';
import StudentsListScreen from './src/features/coach/screens/StudentsListScreen';
import StudentDetailsScreen from './src/features/coach/screens/StudentDetailsScreen';
import VideosCalendarScreen from './src/features/coach/screens/VideosCalendarScreen';
import VideoDetailScreen from './src/features/coach/screens/VideoDetailScreen';
import StudentHomeScreen from './src/features/student/screens/StudentHomeScreen';
import ParentHomeScreen from './src/features/parent/screens/ParentHomeScreen';
import AdminHomeScreen from './src/features/admin/screens/AdminHomeScreen';
import AdminCoachesScreen from './src/features/admin/screens/AdminCoachesScreen';
import CameraScreen from './src/features/session/screens/CameraScreen';
import VideoReviewScreen from './src/features/session/screens/VideoReviewScreen';
import QuickVideoReviewScreen from './src/features/session/screens/QuickVideoReviewScreen';
import SessionHomeScreen from './src/features/session/screens/SessionHomeScreen';
import SessionSetupScreen from './src/features/session/screens/SessionSetupScreen';
import SessionSummaryScreen from './src/features/session/screens/SessionSummaryScreen';
import SessionVideoReviewScreen from './src/features/session/screens/SessionVideoReviewScreen';
import SignUpBusinessScreen from './src/features/admin/screens/SignUpBusinessScreen';
import LoginScreen from './src/features/auth/screens/LoginScreen';
import TestSupabaseScreen from './src/features/auth/screens/TestSupabaseScreen';
import StudentDashboardScreen from './src/features/student/screens/StudentDashboardScreen';
import StudentVideosListScreen from './src/features/student/screens/StudentVideosListScreen';

import FamilyApprovalsScreen from './src/features/parent/screens/FamilyApprovalsScreen';
import ParentSessionReportsScreen from './src/features/parent/screens/ParentSessionReportsScreen';
import ParentNotificationsScreen from './src/features/parent/screens/ParentNotificationsScreen';
import ParentAddChildScreen from './src/features/parent/screens/ParentAddChildScreen';
import InviteCoachScreen from './src/features/admin/screens/InviteCoachScreen';
import InviteParentScreen from './src/features/admin/screens/InviteParentScreen';
import InvitePartnerScreen from './src/features/admin/screens/InvitePartnerScreen';
import ReviewApprovalsScreen from './src/features/admin/screens/ReviewApprovalsScreen';
import AdminSettingsScreen from './src/features/admin/screens/AdminSettingsScreen';
import AdminStatsScreen from './src/features/admin/screens/AdminStatsScreen';
import CoachProfileCompletionScreen from './src/features/auth/screens/CoachProfileCompletionScreen';
import AdminStudentsScreen from './src/features/admin/screens/AdminStudentsScreen';
import ParentAddChildrenScreen from './src/features/parent/screens/ParentAddChildrenScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Login');
  const { fontsLoaded } = useFonts();

  useEffect(() => {
    if (fontsLoaded) {
      checkAuthState();
    }
  }, [fontsLoaded]);

  const checkAuthState = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // User is authenticated, get their role
        const { data: userRole, error } = await supabase
          .rpc('get_user_role', { user_id: user.id });

        if (!error && userRole) {
          // Navigate based on role
          switch (userRole) {
            case 'business':
            case 'admin':
              setInitialRoute('AdminHome');
              break;
            case 'coach':
              setInitialRoute('CoachHome');
              break;
            case 'parent':
              setInitialRoute('ParentHome');
              break;
            case 'student':
              setInitialRoute('StudentDashboard');
              break;
            default:
              setInitialRoute('StudentDashboard'); // Default to student dashboard for unrecognized roles
          }
        } else {
          console.warn('RPC function error in auth check, using fallback method:', error);
          
          // Fallback: Check role tables directly
          const userId = user.id;
          
          // Check admins table
          const { data: adminData } = await supabase
            .from('admins')
            .select('id')
            .eq('id', userId)
            .single();
          
          if (adminData) {
            setInitialRoute('AdminHome');
          } else {
            // Check coaches table
            const { data: coachData } = await supabase
              .from('coaches')
              .select('id')
              .eq('id', userId)
              .single();
            
            if (coachData) {
              setInitialRoute('CoachHome');
            } else {
              // Check parents table
              const { data: parentData } = await supabase
                .from('parents')
                .select('id')
                .eq('id', userId)
                .single();
              
              if (parentData) {
                setInitialRoute('ParentHome');
              } else {
                // Check students table
                const { data: studentData } = await supabase
                  .from('students')
                  .select('id')
                  .eq('id', userId)
                  .single();
                
                if (studentData) {
                  setInitialRoute('StudentDashboard');
                } else {
                  // Default fallback
                  setInitialRoute('Login');
                }
              }
            }
          }
        }
      } else {
        setInitialRoute('Login');
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      setInitialRoute('Login');
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setInitialRoute('Login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (!fontsLoaded || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

        const linking = {
        prefixes: ['http://localhost:8081', 'https://eleve-app.vercel.app', 'exp://eleve-app'],
        config: {
          screens: {
            Login: 'login',
            SignUpBusiness: 'signup',
            CoachProfileCompletion: 'profile-completion',
            AdminHome: 'admin',
        AdminStats: 'admin/stats',
        CoachHome: 'coach',
        ParentHome: 'parent',
        StudentHome: 'student',
        InviteCoach: 'admin/invite-coach',
        InviteParent: 'admin/invite-parent',
        InvitePartner: 'admin/invite-partner',
        ReviewApprovals: 'admin/review-approvals',
        Camera: 'camera',
        VideoReview: 'video-review',
        QuickVideoReview: 'quick-video-review',
        SessionHome: 'session',
        SessionSetup: 'session-setup',
        SessionSummary: 'session-summary',
        SessionVideoReview: 'session-video-review',
        StudentDashboard: 'student/dashboard',
        StudentVideos: 'student/videos',

        FamilyApprovals: 'family-approvals',
        ParentSessionReports: 'parent/reports',
        ParentNotifications: 'parent/notifications',
        ParentAddChild: 'parent/add-child',
        ParentAddChildren: 'parent/add-children',
        TestSupabase: 'test',
      },
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <NavigationContainer linking={linking}>
        <Stack.Navigator initialRouteName={initialRoute}>
          <Stack.Screen 
            name="TestSupabase" 
            component={TestSupabaseScreen} 
            options={{ title: 'Test Supabase' }}
          />
          <Stack.Screen 
            name="SignUpBusiness" 
            component={SignUpBusinessScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="CoachProfileCompletion" 
            component={CoachProfileCompletionScreen} 
            options={{ headerShown: false }}
          />

          <Stack.Screen 
            name="CoachHome" 
            component={CoachHomeScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="CoachVideosList" 
            component={CoachVideosListScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="CoachMenu" 
            component={CoachMenuScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="StudentsListScreen" 
            component={StudentsListScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="StudentDetails" 
            component={StudentDetailsScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="VideosCalendar" 
            component={VideosCalendarScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="VideoDetail" 
            component={VideoDetailScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="StudentHome" 
            component={StudentHomeScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="ParentHome" 
            component={ParentHomeScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="AdminHome" 
            component={AdminHomeScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="AdminCoaches" 
            component={AdminCoachesScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
          name="AdminStudents"
          component={AdminStudentsScreen}
          options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="AdminSettings" 
            component={AdminSettingsScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="AdminStats" 
            component={AdminStatsScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="InviteCoach" 
            component={InviteCoachScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="InviteParent" 
            component={InviteParentScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="InvitePartner" 
            component={InvitePartnerScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="ReviewApprovals" 
            component={ReviewApprovalsScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Camera" 
            component={CameraScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="VideoReview" 
            component={VideoReviewScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="QuickVideoReview" 
            component={QuickVideoReviewScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="SessionHome" 
            component={SessionHomeScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="SessionSetup" 
            component={SessionSetupScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="SessionSummary" 
            component={SessionSummaryScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="SessionVideoReview" 
            component={SessionVideoReviewScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="StudentDashboard" 
            component={StudentDashboardScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="StudentVideos" 
            component={StudentVideosListScreen} 
            options={{ headerShown: false }}
          />

          <Stack.Screen 
            name="FamilyApprovals" 
            component={FamilyApprovalsScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="ParentSessionReports" 
            component={ParentSessionReportsScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="ParentNotifications" 
            component={ParentNotificationsScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="ParentAddChild" 
            component={ParentAddChildScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="ParentAddChildren" 
            component={ParentAddChildrenScreen} 
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
});
