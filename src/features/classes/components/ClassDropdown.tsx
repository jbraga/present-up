import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ClassEntity } from '@features/classes/types/class';
import { palette, shape, spacing, typography } from '@theme/tokens';

export type ClassDropdownProps = {
  classes: ClassEntity[];
  selectedClassId: string | null;
  onSelect: (classId: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export const ClassDropdown = ({
  classes,
  selectedClassId,
  onSelect,
  placeholder = 'Select a class',
  disabled,
}: ClassDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedClass = useMemo(
    () => classes.find((classItem) => classItem.id === selectedClassId) ?? null,
    [classes, selectedClassId],
  );

  const handleSelect = (classId: string) => {
    onSelect(classId);
    setIsOpen(false);
  };

  return (
    <>
      <Pressable
        style={[styles.trigger, disabled && styles.triggerDisabled]}
        onPress={() => setIsOpen(true)}
        disabled={disabled || !classes.length}>
        <View>
          <Text style={styles.triggerLabel}>Class</Text>
          <Text style={[styles.triggerValue, !selectedClass && styles.triggerPlaceholder]}>
            {selectedClass ? selectedClass.name : placeholder}
          </Text>
        </View>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>
      <Modal
        visible={isOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Select a class</Text>
            <ScrollView contentContainerStyle={styles.optionList}>
              {classes.map((classItem) => {
                const isActive = classItem.id === selectedClassId;
                return (
                  <Pressable
                    key={classItem.id}
                    style={[styles.option, isActive && styles.optionActive]}
                    onPress={() => handleSelect(classItem.id)}>
                    <View>
                      <Text style={[styles.optionName, isActive && styles.optionNameActive]}>{classItem.name}</Text>
                      <Text style={styles.optionInstructor}>
                        Instructor: {classItem.instructorName ? classItem.instructorName : classItem.instructorEmail}
                      </Text>
                      {classItem.schedule.length ? (
                        <Text style={styles.optionSchedule}>{formatScheduleSummary(classItem.schedule)}</Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
              {!classes.length ? <Text style={styles.emptyState}>No classes available yet.</Text> : null}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    borderRadius: shape.large,
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  triggerLabel: {
    ...typography.labelSmall,
    color: palette.onSurfaceMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.0,
    marginBottom: 4,
  },
  triggerValue: {
    ...typography.titleSmall,
    color: palette.onSurface,
    fontFamily: 'Lexend-Medium',
    fontWeight: '500',
  },
  triggerPlaceholder: {
    color: palette.onSurfaceVariant,
    fontWeight: '400',
  },
  chevron: {
    fontSize: 18,
    color: palette.primary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheet: {
    backgroundColor: palette.surface,
    borderRadius: shape.extraLarge,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    shadowColor: palette.shadow,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 8,
  },
  sheetTitle: {
    ...typography.titleLarge,
    color: palette.onSurface,
    textAlign: 'center',
    fontFamily: 'Lexend-SemiBold',
    fontWeight: '600',
  },
  optionList: {
    gap: spacing.md,
  },
  option: {
    borderRadius: shape.large,
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: palette.background,
  },
  optionActive: {
    borderColor: palette.primary,
    borderWidth: 2,
    backgroundColor: palette.primaryContainer,
  },
  optionName: {
    ...typography.titleMedium,
    color: palette.onSurface,
    fontFamily: 'Lexend-Medium',
    fontWeight: '500',
  },
  optionNameActive: {
    color: palette.primary,
    fontFamily: 'Lexend-SemiBold',
    fontWeight: '600',
  },
  optionInstructor: {
    ...typography.bodyMedium,
    color: palette.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  optionSchedule: {
    ...typography.bodySmall,
    color: palette.onSurfaceVariant,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  emptyState: {
    ...typography.bodyMedium,
    color: palette.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});

const formatScheduleSummary = (entries: ClassEntity['schedule']) =>
  entries
    .map((entry) => {
      const dayName = entry.dayOfWeek.slice(0, 3);
      return `${dayName} ${entry.startTime}–${entry.endTime}`;
    })
    .join(', ');
