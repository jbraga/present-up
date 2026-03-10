import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '@theme/tokens';

export type SelectionToolbarProps = {
  count: number;
  itemType: 'class' | 'student';
  onClose: () => void;
  onDelete: () => void;
  onEdit?: () => void;
};

export const SelectionToolbar = ({ count, itemType, onClose, onDelete, onEdit }: SelectionToolbarProps) => {
  const { t } = useTranslation();
  const isSingular = count === 1;
  
  // Gets keys like 'common.selected_class_singular', 'common.selected_student_plural'
  const selectionText = t(`common.selected_${itemType}_${isSingular ? 'singular' : 'plural'}`);

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Pressable onPress={onClose} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Clear selection">
          <MaterialCommunityIcons name="close" size={24} color={palette.onSurfaceVariant} />
        </Pressable>
        <View style={styles.textColumn}>
          <Text style={styles.eyebrow}>{t('attendance.selection_active')}</Text>
          <Text style={styles.title}>{count} {selectionText}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        {count === 1 && onEdit ? (
          <Pressable
            onPress={onEdit}
            style={styles.editButton}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${selectionText}`}>
            <MaterialCommunityIcons name="pencil-outline" size={22} color={palette.primary} />
          </Pressable>
        ) : null}
        <Pressable
          onPress={onDelete}
          style={styles.deleteButton}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${count} ${selectionText}`}>
          <MaterialCommunityIcons name="delete-outline" size={22} color={palette.error} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.surfaceDim,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    gap: 2,
  },
  eyebrow: {
    ...typography.labelSmall,
    color: palette.primary,
    fontFamily: 'Lexend-Medium',
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    ...typography.titleMedium,
    color: palette.onSurface,
    fontFamily: 'Lexend-SemiBold',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
