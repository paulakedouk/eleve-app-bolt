import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { 
  User, 
  Mail, 
  X, 
  Plus, 
  UserPlus,
  Send
} from 'lucide-react-native';
import { supabase } from '../../../shared/lib/supabase';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';

interface ParentOnboardingFormProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ChildData {
  name: string;
  age: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  notes: string;
}

const ParentOnboardingForm: React.FC<ParentOnboardingFormProps> = ({
  isVisible,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    parentName: '',
    parentEmail: '',
    notes: '',
  });
  const [children, setChildren] = useState<ChildData[]>([
    { name: '', age: '', level: 'Beginner', notes: '' }
  ]);

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

  const validateForm = () => {
    if (!formData.parentName.trim()) {
      Alert.alert('Error', 'Please enter the parent name');
      return false;
    }
    
    if (!formData.parentEmail.trim()) {
      Alert.alert('Error', 'Please enter the parent email');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.parentEmail.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    
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
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Get user's organization using helper function
      const { data: organizationId, error: orgError } = await supabase
        .rpc('get_user_organization', { user_id: user.id });

      if (orgError) throw orgError;
      
      if (!organizationId) {
        throw new Error('No organization found for user');
      }

      // Generate invitation code
      const invitationCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Create invitation record
      const { error: invitationError } = await supabase
        .from('invitations')
        .insert({
          code: invitationCode,
          email: formData.parentEmail.trim(),
          role: 'parent',
          organization_id: organizationId,
          invited_by: user.id,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        });

      if (invitationError) throw invitationError;

      // Send email to parent with invitation link
      const { sendParentInvitation } = await import('../../../shared/services/emailService');
      
      // Get organization name
      const { data: organizationData, error: orgEmailError } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', organizationId)
        .single();

      if (orgEmailError) throw orgEmailError;

      const emailResult = await sendParentInvitation({
        recipientEmail: formData.parentEmail.trim(),
        recipientName: formData.parentName.trim(),
        organizationName: organizationData?.name || 'Academy',
        invitationCode: invitationCode,
        role: 'parent',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      if (!emailResult.success) {
        console.error('Failed to send email:', emailResult.message);
        // Don't throw error, just log it so the process continues
      }
      
      Alert.alert(
        'Success!',
        `Parent invitation sent to ${formData.parentEmail}. They will receive an email with instructions to submit their family information for approval.`,
        [
          {
            text: 'OK',
            onPress: () => {
              onSuccess();
              handleReset();
            },
          },
        ]
      );

    } catch (error: any) {
      console.error('Error creating parent invitation:', error);
      Alert.alert('Error', error.message || 'Failed to create parent invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      parentName: '',
      parentEmail: '',
      notes: '',
    });
    setChildren([{ name: '', age: '', level: 'Beginner', notes: '' }]);
  };

  if (!isVisible) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.overlay}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Add New Family</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={SIZES.icon.medium} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Parent Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parent Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Parent Name *</Text>
              <View style={styles.inputContainer}>
                <User size={SIZES.icon.medium} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter parent's full name"
                  value={formData.parentName}
                  onChangeText={(value) => setFormData({...formData, parentName: value})}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Parent Email *</Text>
              <View style={styles.inputContainer}>
                <Mail size={SIZES.icon.medium} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter parent's email address"
                  value={formData.parentEmail}
                  onChangeText={(value) => setFormData({...formData, parentEmail: value})}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Any additional notes about the family..."
                value={formData.notes}
                onChangeText={(value) => setFormData({...formData, notes: value})}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Children Information */}
          <View style={styles.section}>
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
                    <Text style={styles.label}>Level</Text>
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
                            {level}
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
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Send size={SIZES.icon.medium} color={COLORS.textInverse} />
            <Text style={styles.submitButtonText}>
              {loading ? 'Sending Invitation...' : 'Send Parent Invitation'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.xl,
    width: '90%',
    maxHeight: '80%',
    maxWidth: 500,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  form: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
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
    marginBottom: SPACING.md,
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
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  levelButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  levelButtonText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  levelButtonTextActive: {
    color: COLORS.textInverse,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
    marginTop: SPACING.md,
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

export default ParentOnboardingForm; 