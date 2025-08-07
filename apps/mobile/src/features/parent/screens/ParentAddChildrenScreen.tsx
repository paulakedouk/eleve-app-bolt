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
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Users, 
  Plus, 
  X, 
  Send,
  UserCheck,
  Baby
} from 'lucide-react-native';
import { RootStackParamList } from '../../../shared/types';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';
import { supabase } from '../../../shared/lib/supabase';

type ParentAddChildrenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ParentAddChildren'>;
type ParentAddChildrenRouteProp = RouteProp<RootStackParamList, 'ParentAddChildren'>;

interface ChildData {
  name: string;
  age: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  notes: string;
}

const ParentAddChildrenScreen: React.FC = () => {
  const navigation = useNavigation<ParentAddChildrenNavigationProp>();
  const route = useRoute<ParentAddChildrenRouteProp>();
  const { parentId, organizationId, invitationCode } = route.params;

  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState<ChildData[]>([
    { name: '', age: '', level: 'Beginner', notes: '' }
  ]);
  const [additionalNotes, setAdditionalNotes] = useState('');

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

  const handleSubmit = async () => {
    if (!validateChildrenForm()) return;

    setLoading(true);
    try {
      // Get the current user's session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Call the edge function to submit family approval
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/submit-family-approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          children: children,
          parentNotes: additionalNotes.trim() || undefined,
          invitationCode: invitationCode,
          organizationId: organizationId,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit family information');
      }

      Alert.alert(
        'Application Submitted! 🎉',
        result.message || 'Your family application has been submitted successfully. You will receive a notification once it has been reviewed and approved by the academy administrator.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ParentHome' as never),
          },
        ]
      );

    } catch (error: any) {
      console.error('Submission error:', error);
      Alert.alert('Submission Failed', error.message || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            <Baby size={SIZES.icon.large} color={COLORS.textInverse} />
            <Text style={styles.headerTitle}>Add Your Children</Text>
            <Text style={styles.headerSubtitle}>
              Tell us about your children who will be participating
            </Text>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>Family Information</Text>
              <Text style={styles.stepSubtitle}>
                Provide details about your children for the coaching program
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Children Details</Text>
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
                <Text style={styles.label}>Additional Family Notes (Optional)</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Any additional information about your family..."
                  value={additionalNotes}
                  onChangeText={setAdditionalNotes}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>📋 Review Process</Text>
                <Text style={styles.infoText}>
                  Once submitted, an academy administrator will review your family application. 
                  You'll receive an email notification when your application is approved and your 
                  children's accounts are set up.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textInverse} />
            ) : (
              <>
                <Send size={SIZES.icon.medium} color={COLORS.textInverse} />
                <Text style={styles.submitButtonText}>Submit Application</Text>
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
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textInverse,
    opacity: 0.9,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  formContainer: {
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
    marginBottom: SPACING.sm,
    textAlign: 'center',
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
  infoBox: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.textTertiary,
  },
  submitButtonText: {
    fontSize: TYPOGRAPHY.sizes.h4,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textInverse,
  },
});

export default ParentAddChildrenScreen; 