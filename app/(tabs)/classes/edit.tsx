import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
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
import { useUpdateClass } from '@features/classes/hooks/useUpdateClass';
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

const EditClassScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ classId?: string }>();
  const classId = params.classId ?? null;

  const classListQuery = useClassList();
  const updateClassMutation = useUpdateClass();

  const classData = useMemo(
    () => classListQuery.data?.find((c) => c.id === classId) ?? null,
    [classListQuery.data, classId],
  );

  const [name, setName] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [threshold, setThreshold] = useState('');
  const [location, setLocation] = useState('');
  const [classIcon, setClassIcon] = useState<string>('pencil-outline');
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleFormEntry[]>([]);
  const [activeDayPickerIndex, setActiveDayPickerIndex] = useState<number | null>(null);
  const [activeTimePicker, setActiveTimePicker] = useState<ActiveTimePicker | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const initialThresholdString = useMemo(() => {
    if (!classData) return '50';
    const val = classData.minAttendancePercentage * 100;
    return val % 1 === 0 ? val.toFixed(0) : val.toFixed(1);
  }, [classData]);

  useEffect(() => {
    if (classData && !isInitialized) {
      setName(classData.name);
      setInstructorName(classData.instructorName || '');
      setCapacity(classData.capacity?.toString() || '');
      setThreshold(initialThresholdString);
      setLocation(classData.location || '');
      setClassIcon(classData.iconName || 'pencil-outline');
      setScheduleEntries(
        classData.schedule.length > 0
          ? classData.schedule.map((entry) => ({
              dayOfWeek: entry.dayOfWeek,
              startTime: entry.startTime,
              endTime: entry.endTime,
            }))
          : [{ dayOfWeek: 'Monday', startTime: '', endTime: '' }]
      );
      setIsInitialized(true);
    }
  }, [classData, isInitialized, initialThresholdString]);

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  }, []);

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
    if (isSubmitDisabled || !classId) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const parsedCapacity = capacity ? parseInt(capacity, 10) : 0;
      const parsedThreshold = threshold ? parseFloat(threshold) / 100 : (classData?.minAttendancePercentage ?? 0.5);

      const validSchedule: ClassScheduleEntry[] = scheduleEntries
        .filter((entry) => entry.startTime && entry.endTime)
        .map((entry) => ({
          dayOfWeek: entry.dayOfWeek,
          startTime: entry.startTime,
          endTime: entry.endTime,
        }));

      await updateClassMutation.mutateAsync({
        classId,
        name: name.trim(),
        instructorName: instructorName.trim(),
        schedule: validSchedule,
        capacity: parsedCapacity,
        minAttendancePercentage: parsedThreshold,
        location: location.trim(),
        iconName: classIcon,
      });

      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update the class.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isSubmitting) {
      return;
    }

    Alert.alert('Discard changes?', 'Your edits will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const behavior = Platform.OS === 'ios' ? 'padding' : undefined;

  if (classListQuery.isLoading || !classData) {
    return (
      <>
        <Stack.Screen options={{ title: 'Edit Class' }} />
        <View style={styles.centered}>
          {classListQuery.isLoading ? (
            <ActivityIndicator size="large" color={palette.primary} />
          ) : (
            <>
              <MaterialCommunityIcons name="alert-circle-outline" size={48} color={palette.onSurfaceMuted} />
              <Text style={styles.errorTitle}>Class not found</Text>
            </>
          )}
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Edit Class',
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
            description="Update class details, schedule, and attendance requirements."
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
            <Text style={styles.primaryButtonText}>{isSubmitting ? 'Saving…' : 'Save Changes'}</Text>
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
                    handleUpdateScheduleDay(activeDayPickerIndex, day);
                  }
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
              {timeSlots.map((time) => {
                const isActive = activeTimePicker
                  ? scheduleEntries[activeTimePicker.index]?.[activeTimePicker.field] === time
                  : false;
                return (
                  <Pressable
                    key={time}
                    style={[styles.timePickerOption, isActive && styles.timePickerOptionActive]}
                    onPress={() => {
                      if (activeTimePicker) {
                        handleUpdateScheduleTime(activeTimePicker.index, activeTimePicker.field, time);
                      }
                    }}
                    accessibilityRole="button">
                    <Text style={[styles.timePickerOptionLabel, isActive && styles.timePickerOptionLabelActive]}>
                      {time}
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

export default EditClassScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: palette.background,
  },
  errorTitle: {
    ...typography.titleMedium,
    color: palette.onSurfaceMuted,
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
