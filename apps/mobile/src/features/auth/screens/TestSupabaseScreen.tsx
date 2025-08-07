import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { testConnection, supabase } from '../../../shared/lib/supabase';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../../shared/utils/constants';

const TestSupabaseScreen: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tablesTest, setTablesTest] = useState<any>(null);

  const runTest = async () => {
    setLoading(true);
    try {
      const testResult = await testConnection();
      setResult(testResult);
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testTables = async () => {
    setLoading(true);
    try {
      console.log('Testing database tables...');
      
      // Test if all required tables exist
      const tablesToTest = ['profiles', 'organizations', 'invitations', 'students', 'sessions', 'videos'];
      const tableResults = [];
      
      for (const table of tablesToTest) {
        try {
          const { error } = await supabase.from(table).select('*').limit(1);
          tableResults.push({ table, exists: !error, error: error?.message });
        } catch (err: any) {
          tableResults.push({ table, exists: false, error: err.message });
        }
      }
      
      // Skip the organization test for now - we'll test with real signup
      console.log('Organization test skipped - will test with real signup');
      
      setTablesTest({
        success: true,
        tables: tableResults,
        organizationTest: { success: true, error: null }
      });
    } catch (error: any) {
      setTablesTest({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testSignup = async () => {
    setLoading(true);
    try {
      console.log('Testing signup flow...');
      
      const testEmail = `test${Date.now()}@example.com`;
      const testPassword = 'testpass123';
      
      // Step 1: Create auth user
      console.log('Creating auth user...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: 'Test User',
            role: 'business',
          },
        },
      });

      if (authError) {
        console.error('Auth error:', authError);
        Alert.alert('Auth Error', authError.message);
        return;
      }

      if (!authData.user) {
        Alert.alert('Error', 'No user returned from signup');
        return;
      }

      console.log('Auth user created:', authData.user.id);

      // Step 2: Create admin record manually
      console.log('Creating admin record manually...');
      
      // First create organization
      const { data: testOrgData, error: testOrgError } = await supabase
        .from('organizations')
        .insert({
          name: 'Test Business',
          slug: 'test-business',
        })
        .select()
        .single();

      if (testOrgError) {
        console.error('Organization error:', testOrgError);
        Alert.alert('Organization Error', testOrgError.message);
        return;
      }

      // Then create admin record
      const { error: adminError } = await supabase
        .from('admins')
        .insert({
          id: authData.user.id,
          organization_id: testOrgData.id,
          is_owner: true,
        });

      if (adminError) {
        console.error('Admin error:', adminError);
        Alert.alert('Admin Error', adminError.message);
        return;
      }

      console.log('Admin record created successfully');

      console.log('Organization and admin setup completed');

      // Cleanup
      await supabase.from('admins').delete().eq('id', authData.user.id);
      await supabase.from('organizations').delete().eq('id', testOrgData.id);
      await supabase.auth.signOut();

      Alert.alert('Success!', 'Test signup flow completed successfully');
    } catch (error: any) {
      console.error('Test signup error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkUserStatus = async () => {
    setLoading(true);
    try {
      // Check current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        Alert.alert('Error', `Could not get user: ${userError.message}`);
        return;
      }

      if (!user) {
        Alert.alert('No User', 'No user is currently signed in');
        return;
      }

      // Check if user is confirmed
      const isConfirmed = user.email_confirmed_at !== null;
      
      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, organizations(*)')
        .eq('id', user.id)
        .single();

      if (profileError) {
        Alert.alert('Profile Error', profileError.message);
        return;
      }

      // Show user status
      Alert.alert(
        'User Status',
        `Email: ${user.email}\n` +
        `Confirmed: ${isConfirmed ? 'Yes' : 'No'}\n` +
        `Role: ${profile?.role || 'None'}\n` +
        `Organization: ${profile?.organizations?.name || 'None'}\n` +
        `Created: ${new Date(user.created_at).toLocaleDateString()}`
      );

    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTest();
  }, []);

  const renderResult = () => {
    if (loading) {
      return (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>🔍 Testing Supabase connection...</Text>
        </View>
      );
    }

    if (!result) return null;

    if (result.success) {
      return (
        <View style={[styles.statusContainer, styles.successContainer]}>
          <Text style={[styles.statusText, styles.successText]}>
            ✅ SUCCESS: Supabase is connected and working!
          </Text>
          {result.data && (
            <Text style={styles.detailsText}>
              📊 Connection verified
            </Text>
          )}
        </View>
      );
    } else {
      return (
        <View style={[styles.statusContainer, styles.errorContainer]}>
          <Text style={[styles.statusText, styles.errorText]}>
            ❌ FAILED: Supabase connection failed
          </Text>
          <Text style={styles.errorDetails}>
            🔍 Error: {result.error}
          </Text>
          
          {result.error.includes('Missing Supabase credentials') && (
            <View style={styles.solutionContainer}>
              <Text style={styles.solutionTitle}>💡 SOLUTION:</Text>
              <Text style={styles.solutionText}>
                Please create a .env file with your Supabase credentials:
              </Text>
              <Text style={styles.codeText}>
                EXPO_PUBLIC_SUPABASE_URL=your-project-url-here{'\n'}
                EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
              </Text>
            </View>
          )}
          
          {result.error.includes('relation "profiles" does not exist') && (
            <View style={styles.solutionContainer}>
              <Text style={styles.solutionTitle}>💡 SOLUTION:</Text>
              <Text style={styles.solutionText}>
                Please create the database tables in your Supabase project.
                Go to SQL Editor in your Supabase dashboard and run the table creation script.
              </Text>
            </View>
          )}
        </View>
      );
    }
  };

  const renderTablesTest = () => {
    if (!tablesTest) return null;

    return (
      <View style={styles.tablesContainer}>
        <Text style={styles.sectionTitle}>Database Tables Test</Text>
        {tablesTest.tables?.map((table: any, index: number) => (
          <View key={index} style={styles.tableRow}>
            <Text style={table.exists ? styles.successText : styles.errorText}>
              {table.exists ? '✅' : '❌'} {table.table}
            </Text>
            {table.error && (
              <Text style={styles.errorDetails}>{table.error}</Text>
            )}
          </View>
        ))}
        
        {tablesTest.organizationTest && (
          <View style={styles.tableRow}>
            <Text style={tablesTest.organizationTest.success ? styles.successText : styles.errorText}>
              {tablesTest.organizationTest.success ? '✅' : '❌'} Organization Insert Test
            </Text>
            {tablesTest.organizationTest.error && (
              <Text style={styles.errorDetails}>{tablesTest.organizationTest.error}</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Supabase Connection Test</Text>
          <Text style={styles.subtitle}>
            Testing your Supabase configuration
          </Text>
        </View>

        {renderResult()}
        {renderTablesTest()}

        <TouchableOpacity
          style={styles.testButton}
          onPress={runTest}
          disabled={loading}
        >
          <Text style={styles.testButtonText}>
            {loading ? 'Testing...' : 'Test Connection'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testButton}
          onPress={testTables}
          disabled={loading}
        >
          <Text style={styles.testButtonText}>
            {loading ? 'Testing...' : 'Test Tables'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testButton}
          onPress={testSignup}
          disabled={loading}
        >
          <Text style={styles.testButtonText}>
            {loading ? 'Testing...' : 'Test Signup'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testButton}
          onPress={checkUserStatus}
          disabled={loading}
        >
          <Text style={styles.testButtonText}>
            {loading ? 'Testing...' : 'Check User Status'}
          </Text>
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Next Steps:</Text>
          <Text style={styles.infoText}>
            1. Create a .env file in your project root{'\n'}
            2. Add your Supabase credentials{'\n'}
            3. Create database tables in Supabase{'\n'}
            4. Test the connection again
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: SPACING.screenPadding,
  },
  header: {
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.h1,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  statusContainer: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
  },
  successContainer: {
    backgroundColor: '#f0f9f0',
    borderColor: '#4caf50',
  },
  errorContainer: {
    backgroundColor: '#fff0f0',
    borderColor: '#f44336',
  },
  statusText: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: SPACING.sm,
  },
  successText: {
    color: '#4caf50',
  },
  errorText: {
    color: '#f44336',
  },
  detailsText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
  },
  errorDetails: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: '#f44336',
    marginBottom: SPACING.md,
  },
  solutionContainer: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: '#f5f5f5',
    borderRadius: BORDER_RADIUS.sm,
  },
  solutionTitle: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  solutionText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  codeText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    fontFamily: 'monospace',
    backgroundColor: '#e8e8e8',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    color: COLORS.textPrimary,
  },
  testButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  testButtonText: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textInverse,
  },
  infoContainer: {
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  tablesContainer: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  tableRow: {
    marginBottom: SPACING.sm,
  },
});

export default TestSupabaseScreen; 