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

import { CLASS_SCHEDULE_DAYS, ClassEntity, ClassScheduleEntry } from '@features/classes/types/class';
import { FormIconHeader } from '@shared/components/FormIconHeader';
import { FormInput } from '@shared/components/FormInput';
import { palette, shape, spacing, typography } from '@theme/tokens';

export type UpdateClassDialogProps = {
  visible: boolean;
  classData: ClassEntity;
  onClose: () => void;
  onSubmit: (input: {
    name: string;
    instructorName: string;
    schedule: ClassScheduleEntry[];
    capacity: number;
    minAttendancePercentage: number;
  }) => Promise<void>;
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

export const UpdateClassDialog = ({ visible, classData, onClose, onSubmit }: UpdateClassDialogProps) => {
  const [name, setName] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [threshold, setThreshold] = useState('');
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleFormEntry[]>([]);
  const [activeDayPickerIndex, setActiveDayPickerIndex] = useState<number | null>(null);
  const [activeTimePicker, setActiveTimePicker] = useState<ActiveTimePicker | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialThresholdString = useMemo(() => {
    const val = classData.minAttendancePercentage * 100;
    return val % 1 === 0 ? val.toFixed(0) : val.toFixed(1);
  }, [classData.minAttendancePercentage]);

  useEffect(() => {
    if (visible) {
      setName(classData.name);
      setInstructorName(classData.instructorName || '');
      setCapacity(classData.capacity?.toString() || '');
      setThreshold(initialThresholdString);
      setScheduleEntries(
        classData.schedule.length > 0
          ? classData.schedule.map((entry) => ({
              dayOfWeek: entry.dayOfWeek,
              startTime: entry.startTime,
              endTime: entry.endTime,
            }))
          : [{ dayOfWeek: 'Monday', startTime: '', endTime: '' }]
      );
      setError('');
    }
  }, [visible, classData, initialThresholdString]);

  const handleCapacityChange = (value: string) => {
    setCapacity(value.replace(/[^0-9]/g, ''));
  };

  const handleCapacityBlur = () => {
    if (capacity && parseInt(capacity, 10) < 1) {
      setCapacity('1');
    }
  };

  const handleThresholdChange = (value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    const parts = sanitized.split('.');
    const formatted = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : sanitized;
    setThreshold(formatted);
  };

  const handleThresholdBlur = () => {
    if (!threshold) {
      setThreshold(initialThresholdString);
      return;
    }
    const num = parseFloat(threshold);
    if (isNaN(num)) {
      setThreshold(initialThresholdString);
      return;
    }
    const clamped = Math.max(0, Math.min(100, num));
    setThreshold(clamped % 1 === 0 ? clamped.toFixed(0) : clamped.toFixed(1));
  };

  const handleAddSchedule = () => {
    setScheduleEntries([...scheduleEntries, { dayOfWeek: 'Monday', startTime: '', endTime: '' }]);
  };

  const handleRemoveSchedule = (index: number) => {
    setScheduleEntries(scheduleEntries.filter((_, i) => i !== index));
  };

  const handleUpdateScheduleDay = (index: number, dayOfWeek: (typeof CLASS_SCHEDULE_DAYS)[number]) => {
    const updated = [...scheduleEntries];
    updated[index] = { ...updated[index], dayOfWeek };
    setScheduleEntries(updated);
    setActiveDayPickerIndex(null);
  };

  const handleUpdateScheduleTime = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const updated = [...scheduleEntries];
    updated[index] = { ...updated[index], [field]: value };
    setScheduleEntries(updated);
    setActiveTimePicker(null);
  };

  const handleOpenDayPicker = (index: number) => {
    setActiveDayPickerIndex(index);
  };

  const handleOpenTimePicker = (index: number, field: 'startTime' | 'endTime') => {
    setActiveTimePicker({ index, field });
  };

  const isSubmitDisabled = !name.trim() || isSubmitting;

  const handleSubmit = async () => {
    if (isSubmitDisabled) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const parsedCapacity = capacity ? parseInt(capacity, 10) : 0;
      const parsedThreshold = threshold ? parseFloat(threshold) / 100 : classData.minAttendancePercentage;

      const validSchedule = scheduleEntries.filter((entry) => entry.startTime && entry.endTime);

      await onSubmit({
        name: name.trim(),
        instructorName: instructorName.trim(),
        schedule: validSchedule,
        capacity: parsedCapacity,
        minAttendancePercentage: parsedThreshold,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update the class.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const behavior = Platform.OS === 'ios' ? 'padding' : undefined;

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  }, []);

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
              <Text style={styles.title}>Edit Class</Text>
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}>

                <FormIconHeader
                  icon="pencil-outline"
                  description="Update class details, schedule, and attendance requirements."
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
                  <Text style={styles.primaryButtonText}>{isSubmitting ? 'Saving…' : 'Save Changes'}</Text>
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
            <ScrollView>
              {CLASS_SCHEDULE_DAYS.map((day) => (
                <Pressable
                  key={day}
                  style={styles.dayPickerOption}
                  onPress={() => {
                    if (activeDayPickerIndex !== null) {
                      handleUpdateScheduleDay(activeDayPickerIndex, day);
                    }
                  }}
                  accessibilityRole="button">
                  <Text style={styles.dayPickerOptionLabel}>{day}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={activeTimePicker !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveTimePicker(null)}>
        <View style={styles.timePickerOverlay}>
          <Pressable style={styles.dismissArea} onPress={() => setActiveTimePicker(null)} accessibilityRole="button" />
          <View style={styles.timePickerSheet}>
            <Text style={styles.timePickerTitle}>
              {activeTimePicker?.field === 'startTime' ? 'Select start time' : 'Select end time'}
            </Text>
            <ScrollView contentContainerStyle={styles.timePickerList}>
              {timeSlots.map((time) => (
                <Pressable
                  key={time}
                  style={styles.timePickerOption}
                  onPress={() => {
                    if (activeTimePicker) {
                      handleUpdateScheduleTime(activeTimePicker.index, activeTimePicker.field, time);
                    }
                  }}
                  accessibilityRole="button">
                  <Text style={styles.timePickerOptionLabel}>{time}</Text>
                </Pressable>
              ))}
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...typography.titleSmall,
    color: palette.onSurface,
    fontFamily: 'Lexend-Medium',
    fontWeight: '500',
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
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.md,
    borderRadius: shape.medium,
  },
  timePickerOptionLabel: {
    ...typography.bodyLarge,
    color: palette.onSurface,
    textAlign: 'center',
  },
});
