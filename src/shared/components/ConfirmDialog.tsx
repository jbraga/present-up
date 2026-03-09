import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, shape, spacing, typography } from '@theme/tokens';

export type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
};

export const ConfirmDialog = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmDialogProps) => {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={onCancel} accessibilityRole="button">
              <Text style={styles.cancelText}>{cancelText}</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmButton, destructive && styles.confirmButtonDestructive]}
              onPress={onConfirm}
              accessibilityRole="button">
              <Text style={[styles.confirmText, destructive && styles.confirmTextDestructive]}>{confirmText}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  dialog: {
    backgroundColor: palette.surface,
    borderRadius: shape.extraLarge,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    gap: spacing.md,
    shadowColor: palette.shadow,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 10,
  },
  title: {
    ...typography.titleLarge,
    color: palette.onSurface,
    fontFamily: 'Lexend-SemiBold',
    fontWeight: '600',
  },
  message: {
    ...typography.bodyMedium,
    color: palette.onSurfaceVariant,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: shape.large,
  },
  cancelText: {
    ...typography.labelLarge,
    color: palette.primary,
    fontWeight: '600',
  },
  confirmButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: shape.large,
    backgroundColor: palette.primary,
  },
  confirmButtonDestructive: {
    backgroundColor: palette.error,
  },
  confirmText: {
    ...typography.labelLarge,
    color: palette.onPrimary,
    fontWeight: '600',
  },
  confirmTextDestructive: {
    color: palette.onError,
  },
});
