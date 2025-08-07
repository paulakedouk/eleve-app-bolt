import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  StatusBar,
} from 'react-native';
import { UserPlus, Mail, User, X } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, SIZES } from '../../../shared/utils/constants';
import { createCoachInvitation } from '../../../shared/services/adminService';

interface CoachInvitationFormProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizationId: string;
}

const CoachInvitationForm: React.FC<CoachInvitationFormProps> = ({
  isVisible,
  onClose,
  onSuccess,
  organizationId,
}) => {
  const [coachName, setCoachName] = useState('');
  const [coachEmail, setCoachEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!coachName.trim()) {
      Alert.alert('Missing Information', 'Please enter the coach\'s name');
      return false;
    }

    if (!coachEmail.trim()) {
      Alert.alert('Missing Information', 'Please enter the coach\'s email address');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(coachEmail.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await createCoachInvitation(
        coachName.trim(),
        coachEmail.trim(),
        organizationId
      );

      if (result.success) {
        Alert.alert(
          'Invitation Sent!',
          `Coach invitation has been sent to ${coachEmail.trim()}. They will receive an email with instructions to join your organization.`,
          [
            {
              text: 'OK',
              onPress: () => {
                handleReset();
                onSuccess();
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error: any) {
      console.error('Error creating coach invitation:', error);
      Alert.alert('Error', 'Failed to send coach invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCoachName('');
    setCoachEmail('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <StatusBar backgroundColor="rgba(0, 0, 0, 0.5)" barStyle="light-content" />
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerIcon}>
                  <UserPlus size={SIZES.icon.large} color={COLORS.primary} />
                </View>
                <Text style={styles.headerTitle}>Invite New Coach</Text>
                <Text style={styles.headerSubtitle}>
                  Send an invitation to a coach to join your organization
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  activeOpacity={0.7}
                >
                  <X size={SIZES.icon.medium} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Form */}
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <View style={styles.inputIcon}>
                    <User size={SIZES.icon.small} color={COLORS.textSecondary} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Coach's Full Name"
                    value={coachName}
                    onChangeText={setCoachName}
                    autoCapitalize="words"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.inputIcon}>
                    <Mail size={SIZES.icon.small} color={COLORS.textSecondary} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Coach's Email Address"
                    value={coachEmail}
                    onChangeText={setCoachEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    📧 The coach will receive an email with instructions to create their account and join your organization.
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleClose}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color={COLORS.textInverse} />
                    ) : (
                      <UserPlus size={SIZES.icon.medium} color={COLORS.textInverse} />
                    )}
                    <Text style={styles.submitButtonText}>
                      {loading ? 'Sending...' : 'Send Invitation'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.medium,
    maxHeight: '80%',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    position: 'relative',
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    padding: SPACING.lg,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
  },
  infoBox: {
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xl,
  },
  infoText: {
    fontSize: TYPOGRAPHY.sizes.bodySmall,
    color: COLORS.primary,
    textAlign: 'center',
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  submitButton: {
    flex: 2,
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    ...SHADOWS.light,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  submitButtonText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});

export default CoachInvitationForm; 