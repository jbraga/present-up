import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { CLASS_SCHEDULE_DAYS, ClassScheduleEntry } from '@features/classes/types/class';
import { FormIconHeader } from '@shared/components/FormIconHeader';
import { FormInput } from '@shared/components/FormInput';
import { palette, shape, spacing, typography } from '@theme/tokens';

export type CreateClassDialogProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: {
    name: string;
    instructorName: string;
    schedule: ClassScheduleEntry[];
    capacity: number;
    minAttendancePercentage: number;
  }) => Promise<void>;
  initialThreshold?: number;
};

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

export const CreateClassDialog = ({ visible, onClose, onSubmit, initialThreshold }: CreateClassDialogProps) => {
  const initialThresholdString = useMemo(() => getInitialThreshold(initialThreshold), [initialThreshold]);

  const [name, setName] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleFormEntry[]>(createInitialSchedule);
  const [threshold, setThreshold] = useState(initialThresholdString);
  const [capacity, setCapacity] = useState('');
  const [activeDayPickerIndex, setActiveDayPickerIndex] = useState<number | null>(null);
  const [activeTimePicker, setActiveTimePicker] = useState<ActiveTimePicker | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName('');
      setInstructorName('');
      setScheduleEntries(createInitialSchedule());
      setThreshold(initialThresholdString);
      setCapacity('');
      setError(null);
    } else {
      setActiveDayPickerIndex(null);
      setActiveTimePicker(null);
    }
  }, [visible, initialThresholdString]);

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

  const handleDismiss = () => {
    if (isSubmitting) {
      return;
    }

    onClose();
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

      await onSubmit({
        name: name.trim(),
        instructorName: instructorName.trim(),
        schedule: sanitizedSchedule,
        capacity: capacityValue,
        minAttendancePercentage: thresholdValue / 100,
      });

      setName('');
      setInstructorName('');
      setScheduleEntries(createInitialSchedule());
      setThreshold(initialThresholdString);
      setCapacity('');
      setActiveDayPickerIndex(null);
      setActiveTimePicker(null);
      onClose();
    } catch (submissionError) {
      const message =
        submissionError instanceof Error ? submissionError.message : 'Unable to create the class right now.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const behavior = Platform.OS === 'ios' ? 'padding' : undefined;

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleDismiss}
        presentationStyle="overFullScreen">
        <KeyboardAvoidingView behavior={behavior} style={styles.backdrop}>
          <Pressable style={styles.dismissArea} onPress={handleDismiss} accessibilityRole="button" />
          <View style={styles.overlay}>
            <View style={styles.container}>
              <Text style={styles.title}>Create Class</Text>
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}>

                <FormIconHeader
                  icon="school-outline"
                  description="Define the details for your new class. Students will use the Class ID to join."
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

              <View style={styles.actions}>
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
                <Pressable
                  style={styles.cancelButton}
                  onPress={handleDismiss}
                  disabled={isSubmitting}
                  accessibilityRole="button">
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={activeDayPickerIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveDayPickerIndex(null)}>
        <View style={styles.dayPickerOverlay}>
          <Pressable
            style={styles.dismissArea}
            onPress={() => setActiveDayPickerIndex(null)}
            accessibilityRole="button"
          />
          <View style={styles.dayPickerSheet}>
            {CLASS_SCHEDULE_DAYS.map((day) => (
              <Pressable
                key={day}
                style={styles.dayPickerOption}
                onPress={() => {
                  if (activeDayPickerIndex !== null) {
                    handleScheduleChange(activeDayPickerIndex, { dayOfWeek: day });
                  }
                  setActiveDayPickerIndex(null);
                }}
                accessibilityRole="button">
                <Text style={styles.dayPickerOptionLabel}>{day}</Text>
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
        <View style={styles.timePickerOverlay}>
          <Pressable
            style={styles.dismissArea}
            onPress={() => setActiveTimePicker(null)}
            accessibilityRole="button"
          />
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
    minWidth: 160,
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
  dayPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  dayPickerSheet: {
    backgroundColor: palette.surface,
    borderRadius: shape.extraLarge,
    paddingVertical: spacing.md,
    shadowColor: palette.shadow,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 8,
  },
  dayPickerOption: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: shape.medium,
  },
  dayPickerOptionLabel: {
    ...typography.titleMedium,
    color: palette.onSurface,
    textAlign: 'center',
    fontWeight: '500',
  },
  timePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: spacing.xl,
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
