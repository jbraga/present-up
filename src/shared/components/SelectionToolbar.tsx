import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '@theme/tokens';

export type SelectionToolbarProps = {
  count: number;
  itemLabel?: string;
  onClose: () => void;
  onDelete: () => void;
  onEdit?: () => void;
};

export const SelectionToolbar = ({ count, itemLabel = 'item', onClose, onDelete, onEdit }: SelectionToolbarProps) => {
  const plural = count === 1 ? itemLabel : `${itemLabel}s`;

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Pressable onPress={onClose} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Clear selection">
          <MaterialCommunityIcons name="close" size={24} color={palette.onSurfaceVariant} />
        </Pressable>
        <View style={styles.textColumn}>
          <Text style={styles.eyebrow}>SELECTION ACTIVE</Text>
          <Text style={styles.title}>{count} {plural} selected</Text>
        </View>
      </View>
      <View style={styles.actions}>
        {count === 1 && onEdit ? (
          <Pressable
            onPress={onEdit}
            style={styles.editButton}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${itemLabel}`}>
            <MaterialCommunityIcons name="pencil-outline" size={22} color={palette.primary} />
          </Pressable>
        ) : null}
        <Pressable
          onPress={onDelete}
          style={styles.deleteButton}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${count} ${plural}`}>
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
