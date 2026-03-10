import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FormIconHeader } from '@shared/components/FormIconHeader';
import { FormInput } from '@shared/components/FormInput';
import { palette, spacing, typography } from '@theme/tokens';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export type StudentFormInitialValues = {
  firstName: string;
  lastName: string;
  email: string;
  guardianEmail: string;
  phoneNumber: string;
};

export type StudentFormSubmitPayload = {
  firstName: string;
  lastName: string;
  email?: string;
  guardianEmail?: string;
  phoneNumber?: string;
};

type StudentFormProps = {
  formKey: string;
  headerIcon: IconName;
  description: string;
  submitLabel: string;
  submitIconName?: IconName;
  initialValues: StudentFormInitialValues;
  onSubmit: (payload: StudentFormSubmitPayload) => Promise<void>;
  onDirtyChange?: (isDirty: boolean) => void;
};

export const StudentForm = ({
  formKey,
  headerIcon,
  description,
  submitLabel,
  submitIconName,
  initialValues,
  onSubmit,
  onDirtyChange,
}: StudentFormProps) => {
  const { t } = useTranslation();

  const [firstName, setFirstName] = useState(initialValues.firstName);
  const [lastName, setLastName] = useState(initialValues.lastName);
  const [email, setEmail] = useState(initialValues.email);
  const [guardianEmail, setGuardianEmail] = useState(initialValues.guardianEmail);
  const [phoneNumber, setPhoneNumber] = useState(initialValues.phoneNumber);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFirstName(initialValues.firstName);
    setLastName(initialValues.lastName);
    setEmail(initialValues.email);
    setGuardianEmail(initialValues.guardianEmail);
    setPhoneNumber(initialValues.phoneNumber);
    setError(null);
  }, [formKey, initialValues]);

  const isDirty = useMemo(() => {
    if (firstName !== initialValues.firstName) return true;
    if (lastName !== initialValues.lastName) return true;
    if (email !== initialValues.email) return true;
    if (guardianEmail !== initialValues.guardianEmail) return true;
    if (phoneNumber !== initialValues.phoneNumber) return true;
    return false;
  }, [email, firstName, guardianEmail, initialValues, lastName, phoneNumber]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const isSubmitDisabled = !firstName.trim() || !lastName.trim() || isSubmitting;

  const handleSubmit = async () => {
    if (isSubmitDisabled) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        guardianEmail: guardianEmail.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
      });
    } catch (submissionError) {
      const message =
        submissionError instanceof Error ? submissionError.message : 'Unable to save student.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const behavior = Platform.OS === 'ios' ? 'padding' : undefined;

  return (
    <KeyboardAvoidingView behavior={behavior} style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        <FormIconHeader icon={headerIcon} description={description} />

        <FormInput
          label={t('students.first_name')}
          icon="account-outline"
          value={firstName}
          onChangeText={setFirstName}
          placeholder={t('students.first_name_placeholder')}
          autoCapitalize="words"
          autoCorrect
          returnKeyType="next"
        />

        <FormInput
          label={t('students.last_name')}
          icon="account-outline"
          value={lastName}
          onChangeText={setLastName}
          placeholder={t('students.last_name_placeholder')}
          autoCapitalize="words"
          autoCorrect
          returnKeyType="next"
        />

        <FormInput
          label={t('students.email')}
          icon="email-outline"
          value={email}
          onChangeText={setEmail}
          placeholder={t('students.email_placeholder')}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
        />

        <FormInput
          label={t('students.guardian_email')}
          icon="account-child-outline"
          value={guardianEmail}
          onChangeText={setGuardianEmail}
          placeholder={t('students.guardian_email_placeholder')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
        />

        <FormInput
          label={t('students.phone')}
          icon="phone-outline"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder={t('students.phone_placeholder')}
          keyboardType="phone-pad"
          returnKeyType="done"
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.primaryButton, isSubmitDisabled && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitDisabled}
          accessibilityRole="button">
          <Text style={styles.primaryButtonText}>{isSubmitting ? t('common.loading') : submitLabel}</Text>
          {submitIconName && !isSubmitting ? (
            <MaterialCommunityIcons name={submitIconName} size={20} color={palette.onPrimary} />
          ) : null}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  errorText: {
    ...typography.bodySmall,
    color: palette.error,
  },
  footer: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: palette.outlineVariant,
    backgroundColor: palette.background,
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
  buttonDisabled: {
    opacity: 0.5,
  },
});
