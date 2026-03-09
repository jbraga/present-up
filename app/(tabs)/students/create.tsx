import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useUpsertStudent } from '@features/students/hooks/useUpsertStudent';
import { FormIconHeader } from '@shared/components/FormIconHeader';
import { FormInput } from '@shared/components/FormInput';
import { palette, spacing, typography } from '@theme/tokens';

const CreateStudentScreen = () => {
  const router = useRouter();
  const upsertStudentMutation = useUpsertStudent();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSubmitDisabled = !firstName.trim() || !lastName.trim() || isSubmitting;

  const handleSubmit = async () => {
    if (isSubmitDisabled) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await upsertStudentMutation.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        guardianEmail: guardianEmail.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
      });

      router.back();
    } catch (submissionError) {
      const message =
        submissionError instanceof Error ? submissionError.message : 'Unable to create student.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isSubmitting) {
      return;
    }

    if (firstName.trim() || lastName.trim() || email.trim()) {
      Alert.alert('Discard changes?', 'Your form data will be lost.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  const behavior = Platform.OS === 'ios' ? 'padding' : undefined;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add Student',
          headerLeft: () => (
            <Pressable onPress={handleCancel} hitSlop={8} accessibilityRole="button">
              <MaterialCommunityIcons name="arrow-left" size={24} color={palette.onSurface} />
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView behavior={behavior} style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          <FormIconHeader
            icon="account-plus-outline"
            description="Enter the student's details to add them to the system."
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

        <View style={styles.footer}>
          <Pressable
            style={[styles.primaryButton, isSubmitDisabled && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitDisabled}
            accessibilityRole="button">
            <Text style={styles.primaryButtonText}>{isSubmitting ? 'Saving…' : 'Add Student'}</Text>
            {!isSubmitting ? (
              <MaterialCommunityIcons name="plus-circle" size={20} color={palette.onPrimary} />
            ) : null}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </>
  );
};

export default CreateStudentScreen;

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
