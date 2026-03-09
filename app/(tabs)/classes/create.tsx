import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useClassList } from '@features/classes/hooks/useClassList';
import { useCreateClass } from '@features/classes/hooks/useCreateClass';
import { CLASS_SCHEDULE_DAYS, ClassScheduleEntry } from '@features/classes/types/class';
import { FormIconHeader } from '@shared/components/FormIconHeader';
import { FormInput } from '@shared/components/FormInput';
import { palette, shape, spacing, typography } from '@theme/tokens';

type ScheduleFormEntry = {
  dayOfWeek: (typeof CLASS_SCHEDULE_DAYS)[number];
  startTime: string;
  endTime: string;
};

type ActiveTimePicker = {
  index: number;
  field: 'startTime' | 'endTime';
};

const TIME_OPTIONS = generateTimeOptions();

const CreateClassScreen = () => {
  const router = useRouter();
  const createClassMutation = useCreateClass();
  const classListQuery = useClassList();

  const initialThresholdString = useMemo(() => {
    const firstClass = classListQuery.data?.[0];
    return getInitialThreshold(firstClass?.minAttendancePercentage);
  }, [classListQuery.data]);

  const [name, setName] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleFormEntry[]>(createInitialSchedule);
  const [threshold, setThreshold] = useState(initialThresholdString);
  const [capacity, setCapacity] = useState('');
  const [location, setLocation] = useState('');
  const [classIcon, setClassIcon] = useState<string>('school-outline');
  const [activeDayPickerIndex, setActiveDayPickerIndex] = useState<number | null>(null);
  const [activeTimePicker, setActiveTimePicker] = useState<ActiveTimePicker | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasInvalidSchedule = useMemo(
    () =>
      scheduleEntries.some((entry) => {
        const start = normalizeTime(entry.startTime);
        const end = normalizeTime(entry.endTime);

        if (!start || !end) {
          return true;
        }

        if (!isValidTime(start) || !isValidTime(end)) {
          return true;
        }

        return getTimeInMinutes(start) >= getTimeInMinutes(end);
      }),
    [scheduleEntries],
  );

  const activeTimeValue = useMemo(() => {
    if (!activeTimePicker) {
      return null;
    }

    const entry = scheduleEntries[activeTimePicker.index];
    if (!entry) {
      return null;
    }

    return entry[activeTimePicker.field] ?? null;
  }, [activeTimePicker, scheduleEntries]);

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

    if (hasInvalidSchedule) {
      return true;
    }

    return false;
  }, [capacity, instructorName, hasInvalidSchedule, isSubmitting, name, threshold]);

  const handleScheduleChange = (index: number, updates: Partial<ScheduleFormEntry>) => {
    setScheduleEntries((prev) => {
      if (!prev[index]) {
        return prev;
      }

      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleAddSchedule = () => {
    setScheduleEntries((prev) => [...prev, createEmptyScheduleEntry()]);
  };

  const handleRemoveSchedule = (index: number) => {
    setScheduleEntries((prev) => {
      if (prev.length === 1) {
        return prev;
      }

      return prev.filter((_, entryIndex) => entryIndex !== index);
    });
  };

  const handleOpenDayPicker = (index: number) => {
    setActiveDayPickerIndex(index);
  };

  const handleOpenTimePicker = (index: number, field: ActiveTimePicker['field']) => {
    setActiveTimePicker({ index, field });
  };

  const handleTimeOptionSelect = (value: string) => {
    if (!activeTimePicker) {
      return;
    }

    const normalized = normalizeTime(value);

    setScheduleEntries((prev) => {
      const next = [...prev];
      if (!next[activeTimePicker.index]) {
        return prev;
      }

      next[activeTimePicker.index] = {
        ...next[activeTimePicker.index],
        [activeTimePicker.field]: normalized,
      };

      return next;
    });

    setActiveTimePicker(null);
  };

  const handleThresholdChange = (value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    setThreshold(sanitized);
  };

  const handleThresholdBlur = () => {
    if (!threshold.trim()) {
      setThreshold(initialThresholdString);
      return;
    }

    const numeric = Number.parseFloat(threshold.trim());
    if (!Number.isFinite(numeric)) {
      setThreshold(initialThresholdString);
      return;
    }

    const clamped = Math.max(0, Math.min(100, numeric));
    setThreshold(clamped.toString());
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
      const thresholdValue = Number.parseFloat(threshold.trim());
      const capacityValue = Number.parseInt(capacity.trim(), 10);

      const sanitizedSchedule: ClassScheduleEntry[] = scheduleEntries.map((entry) => {
        const start = normalizeTime(entry.startTime);
        const end = normalizeTime(entry.endTime);

        if (!start || !end) {
          throw new Error('Please select start and end times for every schedule entry.');
        }

        if (!isValidTime(start) || !isValidTime(end)) {
          throw new Error('Use valid times in HH:MM format.');
        }

        if (getTimeInMinutes(start) >= getTimeInMinutes(end)) {
          throw new Error('Start time must be earlier than end time.');
        }

        return {
          dayOfWeek: entry.dayOfWeek,
          startTime: start,
          endTime: end,
        };
      });

      await createClassMutation.mutateAsync({
        name: name.trim(),
        instructorName: instructorName.trim(),
        schedule: sanitizedSchedule,
        capacity: capacityValue,
        minAttendancePercentage: thresholdValue / 100,
        location: location.trim(),
        iconName: classIcon,
      });

      router.back();
    } catch (submissionError) {
      const message =
        submissionError instanceof Error ? submissionError.message : 'Unable to create the class right now.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isSubmitting) {
      return;
    }

    if (name.trim() || instructorName.trim() || capacity.trim() || location.trim()) {
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
          title: 'Create Class',
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
            icon={classIcon as any}
            description="Define the details for your new class. Students will use the Class ID to join."
            onPickIcon={(iconName) => setClassIcon(iconName)}
          />

          <FormInput
            label="Class Name"
            icon="book-outline"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Advanced Mathematics"
            autoCapitalize="sentences"
            autoCorrect
            returnKeyType="next"
          />

          <FormInput
            label="Instructor Name"
            icon="account-outline"
            value={instructorName}
            onChangeText={setInstructorName}
            placeholder="e.g. Dr. Sarah Smith"
            autoCapitalize="words"
            autoCorrect
            returnKeyType="next"
          />

          <FormInput
            label="Location (optional)"
            icon="map-marker-outline"
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Main Stadium — Field A"
            autoCapitalize="sentences"
            autoCorrect
            returnKeyType="next"
          />

          <View style={styles.inlineFields}>
            <View style={styles.inlineField}>
              <FormInput
                label="Capacity"
                icon="account-group-outline"
                keyboardType="number-pad"
                value={capacity}
                onChangeText={handleCapacityChange}
                onBlur={handleCapacityBlur}
                placeholder="30"
              />
            </View>
            <View style={styles.inlineField}>
              <FormInput
                label="Min Attendance %"
                icon="chart-box-outline"
                keyboardType="decimal-pad"
                value={threshold}
                onChangeText={handleThresholdChange}
                onBlur={handleThresholdBlur}
                placeholder="75"
              />
            </View>
          </View>

          <View style={styles.scheduleSection}>
            <View style={styles.scheduleHeader}>
              <Text style={styles.label}>Schedule</Text>
              <Pressable style={styles.addScheduleButton} onPress={handleAddSchedule} accessibilityRole="button">
                <MaterialCommunityIcons name="plus-circle" size={16} color={palette.primary} />
                <Text style={styles.addScheduleButtonLabel}>Add Slot</Text>
              </Pressable>
            </View>
            <View style={styles.scheduleList}>
              {scheduleEntries.map((entry, index) => (
                <View key={`${entry.dayOfWeek}-${index}`} style={styles.scheduleCard}>
                  <View style={styles.scheduleCardLeft}>
                    <View style={styles.scheduleIconCircle}>
                      <MaterialCommunityIcons name="clock-outline" size={20} color={palette.primary} />
                    </View>
                    <View style={styles.scheduleCardInfo}>
                      <Pressable onPress={() => handleOpenDayPicker(index)} accessibilityRole="button">
                        <Text style={styles.scheduleDayText}>{entry.dayOfWeek}</Text>
                      </Pressable>
                      <View style={styles.scheduleTimeRow}>
                        <Pressable onPress={() => handleOpenTimePicker(index, 'startTime')} accessibilityRole="button">
                          <Text style={[styles.scheduleTimeText, !entry.startTime && styles.scheduleTimePlaceholder]}>
                            {entry.startTime || 'Start'}
                          </Text>
                        </Pressable>
                        <Text style={styles.scheduleTimeSeparator}>-</Text>
                        <Pressable onPress={() => handleOpenTimePicker(index, 'endTime')} accessibilityRole="button">
                          <Text style={[styles.scheduleTimeText, !entry.endTime && styles.scheduleTimePlaceholder]}>
                            {entry.endTime || 'End'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                  <View style={styles.scheduleCardActions}>
                    <Pressable
                      onPress={() => handleOpenDayPicker(index)}
                      accessibilityRole="button"
                      hitSlop={8}>
                      <MaterialCommunityIcons name="pencil-outline" size={20} color={palette.onSurfaceMuted} />
                    </Pressable>
                    {scheduleEntries.length > 1 ? (
                      <Pressable
                        onPress={() => handleRemoveSchedule(index)}
                        accessibilityRole="button"
                        hitSlop={8}>
                        <MaterialCommunityIcons name="delete-outline" size={20} color={palette.onSurfaceMuted} />
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.primaryButton, (isSubmitDisabled || isSubmitting) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitDisabled}
            accessibilityRole="button">
            <Text style={styles.primaryButtonText}>{isSubmitting ? 'Saving…' : 'Create Class'}</Text>
            {!isSubmitting ? (
              <MaterialCommunityIcons name="plus-circle" size={20} color={palette.onPrimary} />
            ) : null}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={activeDayPickerIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveDayPickerIndex(null)}>
        <View style={styles.pickerOverlay}>
          <Pressable
            style={styles.pickerDismiss}
            onPress={() => setActiveDayPickerIndex(null)}
            accessibilityRole="button"
          />
          <View style={styles.pickerSheet}>
            {CLASS_SCHEDULE_DAYS.map((day) => (
              <Pressable
                key={day}
                style={styles.pickerOption}
                onPress={() => {
                  if (activeDayPickerIndex !== null) {
                    handleScheduleChange(activeDayPickerIndex, { dayOfWeek: day });
                  }
                  setActiveDayPickerIndex(null);
                }}
                accessibilityRole="button">
                <Text style={styles.pickerOptionLabel}>{day}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      <Modal
        visible={activeTimePicker !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveTimePicker(null)}>
        <View style={styles.pickerOverlay}>
          <Pressable style={styles.pickerDismiss} onPress={() => setActiveTimePicker(null)} accessibilityRole="button" />
          <View style={styles.timePickerSheet}>
            <Text style={styles.timePickerTitle}>
              {activeTimePicker?.field === 'startTime' ? 'Select start time' : 'Select end time'}
            </Text>
            <ScrollView contentContainerStyle={styles.timePickerList} showsVerticalScrollIndicator={false}>
              {TIME_OPTIONS.map((option) => {
                const isActive = option === activeTimeValue;
                return (
                  <Pressable
                    key={option}
                    style={[styles.timePickerOption, isActive && styles.timePickerOptionActive]}
                    onPress={() => handleTimeOptionSelect(option)}
                    accessibilityRole="button">
                    <Text style={[styles.timePickerOptionLabel, isActive && styles.timePickerOptionLabelActive]}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default CreateClassScreen;

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
  label: {
    ...typography.titleSmall,
    color: palette.onSurface,
    fontFamily: 'Lexend-Medium',
    fontWeight: '500',
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
  scheduleSection: {
    gap: spacing.md,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  addScheduleButtonLabel: {
    ...typography.labelLarge,
    color: palette.primary,
    fontFamily: 'Lexend-SemiBold',
    fontWeight: '600',
  },
  scheduleList: {
    gap: spacing.md,
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    padding: spacing.md,
  },
  scheduleCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  scheduleIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleCardInfo: {
    flex: 1,
    gap: 2,
  },
  scheduleDayText: {
    ...typography.titleSmall,
    color: palette.onSurface,
    fontFamily: 'Lexend-SemiBold',
    fontWeight: '600',
  },
  scheduleTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  scheduleTimeText: {
    ...typography.labelSmall,
    color: palette.onSurfaceMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scheduleTimePlaceholder: {
    color: palette.outlineVariant,
  },
  scheduleTimeSeparator: {
    ...typography.labelSmall,
    color: palette.onSurfaceMuted,
  },
  scheduleCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  pickerDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  pickerSheet: {
    backgroundColor: palette.surface,
    borderRadius: shape.extraLarge,
    paddingVertical: spacing.md,
    shadowColor: palette.shadow,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 8,
  },
  pickerOption: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: shape.medium,
  },
  pickerOptionLabel: {
    ...typography.titleMedium,
    color: palette.onSurface,
    textAlign: 'center',
    fontWeight: '500',
  },
  timePickerSheet: {
    backgroundColor: palette.surface,
    borderRadius: shape.extraLarge,
    paddingVertical: spacing.md,
    maxHeight: '70%',
    shadowColor: palette.shadow,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 8,
  },
  timePickerTitle: {
    ...typography.titleLarge,
    color: palette.onSurface,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    fontFamily: 'Lexend-SemiBold',
    fontWeight: '600',
  },
  timePickerList: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  timePickerOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.outlineVariant,
  },
  timePickerOptionActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  timePickerOptionLabel: {
    ...typography.titleSmall,
    color: palette.onSurface,
    textAlign: 'center',
    fontWeight: '500',
  },
  timePickerOptionLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

function createEmptyScheduleEntry(): ScheduleFormEntry {
  return {
    dayOfWeek: CLASS_SCHEDULE_DAYS[0],
    startTime: '',
    endTime: '',
  };
}

function createInitialSchedule(): ScheduleFormEntry[] {
  return [createEmptyScheduleEntry()];
}

function getInitialThreshold(value?: number) {
  return Math.round((value ?? 0.5) * 100).toString();
}

function generateTimeOptions() {
  const options: string[] = [];

  for (let hour = 5; hour <= 22; hour += 1) {
    for (const minute of [0, 30]) {
      const formattedHour = `${hour}`.padStart(2, '0');
      const formattedMinute = `${minute}`.padStart(2, '0');
      options.push(`${formattedHour}:${formattedMinute}`);
    }
  }

  return options;
}

function normalizeTime(value: string) {
  return value.trim();
}

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

function isValidTime(value: string) {
  return timeRegex.test(value);
}

function getTimeInMinutes(value: string) {
  const [hours, minutes] = value.split(':').map((segment) => Number.parseInt(segment, 10));
  return hours * 60 + minutes;
}
