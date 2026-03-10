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

import {
  hasInvalidSchedule,
  sanitizeSchedule,
  ScheduleFormEntry,
} from '@/features/classes/utils/schedulerUtils';
import { ClassScheduler } from '@features/classes/components/ClassScheduler';
import { ClassScheduleEntry } from '@features/classes/types/class';
import { FormIconHeader } from '@shared/components/FormIconHeader';
import { FormInput } from '@shared/components/FormInput';
import { palette, spacing, typography } from '@theme/tokens';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export type ClassFormInitialValues = {
  name: string;
  instructorName: string;
  capacity: string;
  threshold: string;
  location: string;
  iconName: string;
  scheduleEntries: ScheduleFormEntry[];
};

export type ClassFormSubmitPayload = {
  name: string;
  instructorName: string;
  schedule: ClassScheduleEntry[];
  capacity: number;
  minAttendancePercentage: number;
  location: string;
  iconName: string;
};

type ClassFormProps = {
  formKey: string;
  description: string;
  submitLabel: string;
  submitIconName?: IconName;
  initialValues: ClassFormInitialValues;
  onSubmit: (payload: ClassFormSubmitPayload) => Promise<void>;
  onDirtyChange?: (isDirty: boolean) => void;
};

export const ClassForm = ({
  formKey,
  description,
  submitLabel,
  submitIconName,
  initialValues,
  onSubmit,
  onDirtyChange,
}: ClassFormProps) => {
  const { t } = useTranslation();

  const [name, setName] = useState(initialValues.name);
  const [instructorName, setInstructorName] = useState(initialValues.instructorName);
  const [capacity, setCapacity] = useState(initialValues.capacity);
  const [threshold, setThreshold] = useState(initialValues.threshold);
  const [location, setLocation] = useState(initialValues.location);
  const [classIcon, setClassIcon] = useState(initialValues.iconName);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleFormEntry[]>(initialValues.scheduleEntries);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(initialValues.name);
    setInstructorName(initialValues.instructorName);
    setCapacity(initialValues.capacity);
    setThreshold(initialValues.threshold);
    setLocation(initialValues.location);
    setClassIcon(initialValues.iconName);
    setScheduleEntries(initialValues.scheduleEntries);
    setError(null);
  }, [formKey, initialValues]);

  const hasChanges = useMemo(() => {
    if (name !== initialValues.name) return true;
    if (instructorName !== initialValues.instructorName) return true;
    if (capacity !== initialValues.capacity) return true;
    if (threshold !== initialValues.threshold) return true;
    if (location !== initialValues.location) return true;
    if (classIcon !== initialValues.iconName) return true;

    return JSON.stringify(scheduleEntries) !== JSON.stringify(initialValues.scheduleEntries);
  }, [
    name,
    instructorName,
    capacity,
    threshold,
    location,
    classIcon,
    scheduleEntries,
    initialValues,
  ]);

  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  const isSubmitDisabled = useMemo(() => {
    if (isSubmitting) {
      return true;
    }

    if (!name.trim()) {
      return true;
    }

    if (!instructorName.trim()) {
      return true;
    }

    const thresholdValue = Number.parseFloat(threshold.trim());
    if (!Number.isFinite(thresholdValue) || thresholdValue < 0 || thresholdValue > 100) {
      return true;
    }

    const capacityValue = Number.parseInt(capacity.trim(), 10);
    if (!Number.isFinite(capacityValue) || capacityValue <= 0) {
      return true;
    }

    return hasInvalidSchedule(scheduleEntries);
  }, [capacity, instructorName, isSubmitting, name, scheduleEntries, threshold]);

  const handleThresholdChange = (value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    const parts = sanitized.split('.');
    const formatted = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : sanitized;
    setThreshold(formatted);
  };

  const handleThresholdBlur = () => {
    if (!threshold.trim()) {
      setThreshold(initialValues.threshold);
      return;
    }

    const numeric = Number.parseFloat(threshold.trim());
    if (!Number.isFinite(numeric)) {
      setThreshold(initialValues.threshold);
      return;
    }

    const clamped = Math.max(0, Math.min(100, numeric));
    setThreshold(clamped % 1 === 0 ? clamped.toFixed(0) : clamped.toFixed(1));
  };

  const handleCapacityChange = (value: string) => {
    const sanitized = value.replace(/[^0-9]/g, '');
    setCapacity(sanitized);
  };

  const handleCapacityBlur = () => {
    if (!capacity.trim()) {
      return;
    }

    const numeric = Number.parseInt(capacity.trim(), 10);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setCapacity('');
      return;
    }

    setCapacity(numeric.toString());
  };

  const handleSubmit = async () => {
    if (isSubmitDisabled) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const sanitizedSchedule = sanitizeSchedule(scheduleEntries);
      const thresholdValue = Number.parseFloat(threshold.trim());
      const capacityValue = Number.parseInt(capacity.trim(), 10);

      await onSubmit({
        name: name.trim(),
        instructorName: instructorName.trim(),
        schedule: sanitizedSchedule,
        capacity: Number.isFinite(capacityValue) ? capacityValue : 0,
        minAttendancePercentage: Number.isFinite(thresholdValue)
          ? Math.max(0, Math.min(100, thresholdValue)) / 100
          : 0.5,
        location: location.trim(),
        iconName: classIcon,
      });
    } catch (submissionError) {
      const message =
        submissionError instanceof Error ? submissionError.message : 'Unable to save class right now.';
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

        <FormIconHeader
          icon={classIcon as any}
          description={description}
          onPickIcon={(iconName) => setClassIcon(iconName)}
        />

        <FormInput
          label={t('classes.name')}
          icon="book-outline"
          value={name}
          onChangeText={setName}
          placeholder={t('classes.name_placeholder')}
          autoCapitalize="sentences"
          autoCorrect
          returnKeyType="next"
        />

        <FormInput
          label={t('classes.instructor')}
          icon="account-outline"
          value={instructorName}
          onChangeText={setInstructorName}
          placeholder={t('classes.instructor_placeholder')}
          autoCapitalize="words"
          autoCorrect
          returnKeyType="next"
        />

        <FormInput
          label={t('classes.location')}
          icon="map-marker-outline"
          value={location}
          onChangeText={setLocation}
          placeholder={t('classes.location_placeholder')}
          autoCapitalize="sentences"
          autoCorrect
          returnKeyType="next"
        />

        <View style={styles.inlineFields}>
          <View style={styles.inlineField}>
            <FormInput
              label={t('classes.capacity')}
              icon="account-group-outline"
              keyboardType="number-pad"
              value={capacity}
              onChangeText={handleCapacityChange}
              onBlur={handleCapacityBlur}
              placeholder={t('classes.capacity_placeholder')}
            />
          </View>
          <View style={styles.inlineField}>
            <FormInput
              label={t('classes.min_attendance')}
              icon="chart-box-outline"
              keyboardType="decimal-pad"
              value={threshold}
              onChangeText={handleThresholdChange}
              onBlur={handleThresholdBlur}
              placeholder={t('classes.min_attendance_placeholder')}
            />
          </View>
        </View>

        <ClassScheduler entries={scheduleEntries} onChangeEntries={setScheduleEntries} />

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
  inlineFields: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  inlineField: {
    flex: 1,
    minWidth: 140,
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
