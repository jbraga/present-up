import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { StudentEntity } from '@features/students/types/student';
import { FormIconHeader } from '@shared/components/FormIconHeader';
import { FormInput } from '@shared/components/FormInput';
import { palette, shape, spacing, typography } from '@theme/tokens';

export type CreateStudentDialogProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: {
    id?: string;
    firstName: string;
    lastName: string;
    email?: string;
    guardianEmail?: string;
    phoneNumber?: string;
  }) => Promise<void>;
  student?: StudentEntity;
};

export const CreateStudentDialog = ({ visible, onClose, onSubmit, student }: CreateStudentDialogProps) => {
  const isEditMode = !!student;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      setFirstName(student.firstName);
      setLastName(student.lastName);
      setEmail(student.email || '');
      setGuardianEmail(student.guardianEmail || '');
      setPhoneNumber(student.phoneNumber || '');
    }
  }, [student]);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setGuardianEmail('');
    setPhoneNumber('');
    setError(null);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  const isSubmitDisabled = !firstName.trim() || !lastName.trim() || isSubmitting;

  const handleSubmit = async () => {
    if (isSubmitDisabled) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        id: student?.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        guardianEmail: guardianEmail.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
      });

      resetForm();
      onClose();
    } catch (submissionError) {
      const message =
        submissionError instanceof Error ? submissionError.message : 'Unable to create student.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const behavior = Platform.OS === 'ios' ? 'padding' : undefined;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      presentationStyle="overFullScreen">
      <KeyboardAvoidingView behavior={behavior} style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={handleClose} accessibilityRole="button" />
        <View style={styles.overlay}>
          <View style={styles.container}>
            <Text style={styles.title}>{isEditMode ? 'Edit Student' : 'Add Student'}</Text>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}>

              <FormIconHeader
                icon={isEditMode ? 'account-edit-outline' : 'account-plus-outline'}
                description={isEditMode ? 'Update the student\'s information below.' : 'Enter the student\'s details to add them to the system.'}
              />

              <FormInput
                label="First Name"
                icon="account-outline"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="e.g. John"
                autoCapitalize="words"
                autoCorrect
                returnKeyType="next"
              />

              <FormInput
                label="Last Name"
                icon="account-outline"
                value={lastName}
                onChangeText={setLastName}
                placeholder="e.g. Smith"
                autoCapitalize="words"
                autoCorrect
                returnKeyType="next"
              />

              <FormInput
                label="Student Email (optional)"
                icon="email-outline"
                value={email}
                onChangeText={setEmail}
                placeholder="e.g. john@school.edu"
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />

              <FormInput
                label="Guardian Email (optional)"
                icon="email-outline"
                value={guardianEmail}
                onChangeText={setGuardianEmail}
                placeholder="e.g. parent@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />

              <FormInput
                label="Phone (optional)"
                icon="phone-outline"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="e.g. (555) 123-4567"
                keyboardType="phone-pad"
                returnKeyType="done"
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </ScrollView>

            <View style={styles.actions}>
              <Pressable
                style={[styles.primaryButton, isSubmitDisabled && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitDisabled}>
                {isSubmitting ? (
                  <ActivityIndicator color={palette.onPrimary} />
                ) : (
                  <Text style={styles.primaryButtonText}>{isEditMode ? 'Save Changes' : 'Add Student'}</Text>
                )}
              </Pressable>
              <Pressable
                style={styles.cancelButton}
                onPress={handleClose}
                disabled={isSubmitting}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
  },
  dismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    backgroundColor: palette.surface,
    borderRadius: shape.extraLarge,
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    maxHeight: '80%',
    shadowColor: palette.shadow,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 8,
  },
  scroll: {
    flexShrink: 1,
  },
  content: {
    gap: spacing.lg,
    paddingVertical: spacing.xs,
  },
  title: {
    ...typography.titleLarge,
    color: palette.onSurface,
    fontFamily: 'Lexend-SemiBold',
    fontWeight: '600',
  },
  errorText: {
    ...typography.bodySmall,
    color: palette.error,
  },
  actions: {
    gap: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: palette.outlineVariant,
    marginTop: spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: palette.primary,
    borderRadius: 16,
    paddingVertical: spacing.md,
    shadowColor: palette.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: {
    ...typography.labelLarge,
    color: palette.onPrimary,
    fontFamily: 'Lexend-Bold',
    fontWeight: '700',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  cancelButtonText: {
    ...typography.labelLarge,
    color: palette.onSurfaceMuted,
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
