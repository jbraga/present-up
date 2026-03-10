import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  ActiveTimePicker,
  createEmptyScheduleEntry,
  normalizeTime,
  ScheduleFormEntry,
  TIME_OPTIONS,
} from '@/features/classes/utils/schedulerUtils';
import { CLASS_SCHEDULE_DAYS } from '@features/classes/types/class';
import { palette, shape, spacing, typography } from '@theme/tokens';

type ClassScheduleSectionProps = {
  entries: ScheduleFormEntry[];
  onChangeEntries: React.Dispatch<React.SetStateAction<ScheduleFormEntry[]>>;
};

export const ClassScheduler = ({
  entries,
  onChangeEntries,
}: ClassScheduleSectionProps) => {
  const { t } = useTranslation();
  const [activeDayPickerIndex, setActiveDayPickerIndex] = useState<number | null>(null);
  const [activeTimePicker, setActiveTimePicker] = useState<ActiveTimePicker | null>(null);

  const activeTimeValue = useMemo(() => {
    if (!activeTimePicker) {
      return null;
    }

    const entry = entries[activeTimePicker.index];
    if (!entry) {
      return null;
    }

    return entry[activeTimePicker.field] ?? null;
  }, [activeTimePicker, entries]);

  const handleAddSlot = () => {
    onChangeEntries((prev) => [...prev, createEmptyScheduleEntry()]);
  };

  const handleRemoveSlot = (index: number) => {
    onChangeEntries((prev) => {
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

    onChangeEntries((prev) => {
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

  return (
    <>
      <View style={styles.scheduleSection}>
        <View style={styles.scheduleHeader}>
          <Text style={styles.label}>{t('classes.schedule')}</Text>
          <Pressable style={styles.addScheduleButton} onPress={handleAddSlot} accessibilityRole="button">
            <MaterialCommunityIcons name="plus-circle" size={16} color={palette.primary} />
            <Text style={styles.addScheduleButtonLabel}>{t('classes.add_slot')}</Text>
          </Pressable>
        </View>

        <View style={styles.scheduleList}>
          {entries.map((entry, index) => (
            <View key={`${entry.dayOfWeek}-${index}`} style={styles.scheduleCard}>
              <View style={styles.scheduleCardLeft}>
                <View style={styles.scheduleIconCircle}>
                  <MaterialCommunityIcons name="clock-outline" size={20} color={palette.primary} />
                </View>

                <View style={styles.scheduleCardInfo}>
                  <Pressable onPress={() => handleOpenDayPicker(index)} accessibilityRole="button">
                    <Text style={styles.scheduleDayText}>{t(`common.days.${entry.dayOfWeek.toLowerCase()}` as any)}</Text>
                  </Pressable>

                  <View style={styles.scheduleTimeRow}>
                    <Pressable onPress={() => handleOpenTimePicker(index, 'startTime')} accessibilityRole="button">
                      <Text style={[styles.scheduleTimeText, !entry.startTime && styles.scheduleTimePlaceholder]}>
                        {entry.startTime || t('common.start')}
                      </Text>
                    </Pressable>

                    <Text style={styles.scheduleTimeSeparator}>-</Text>

                    <Pressable onPress={() => handleOpenTimePicker(index, 'endTime')} accessibilityRole="button">
                      <Text style={[styles.scheduleTimeText, !entry.endTime && styles.scheduleTimePlaceholder]}>
                        {entry.endTime || t('common.end')}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              <View style={styles.scheduleCardActions}>
                <Pressable onPress={() => handleOpenDayPicker(index)} accessibilityRole="button" hitSlop={8}>
                  <MaterialCommunityIcons name="pencil-outline" size={20} color={palette.onSurfaceMuted} />
                </Pressable>

                {entries.length > 1 ? (
                  <Pressable onPress={() => handleRemoveSlot(index)} accessibilityRole="button" hitSlop={8}>
                    <MaterialCommunityIcons name="delete-outline" size={20} color={palette.onSurfaceMuted} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      </View>

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
                    onChangeEntries((prev) => {
                      if (!prev[activeDayPickerIndex]) {
                        return prev;
                      }

                      const next = [...prev];
                      next[activeDayPickerIndex] = { ...next[activeDayPickerIndex], dayOfWeek: day };
                      return next;
                    });
                  }
                  setActiveDayPickerIndex(null);
                }}
                accessibilityRole="button">
                <Text style={styles.pickerOptionLabel}>{t(`common.days.${day.toLowerCase()}` as any)}</Text>
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
              {activeTimePicker?.field === 'startTime' ? t('common.select_start_time') : t('common.select_end_time')}
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
  scheduleSection: {
    gap: spacing.md,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    borderRadius: shape.medium,
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
    color: palette.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scheduleTimePlaceholder: {
    color: palette.onSurfaceMuted,
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
