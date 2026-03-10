import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@shared/components/BottomSheet';
import { palette, shape, spacing, typography } from '@theme/tokens';

type ConfirmationDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isConfirming?: boolean;
};

export const ConfirmationDialog = ({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isConfirming = false,
}: ConfirmationDialogProps) => {
  const handleClose = isConfirming ? () => {} : onCancel;

  return (
    <BottomSheet visible={visible} onClose={handleClose}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="alert-circle-outline" size={22} color={palette.error} />
        </View>

        <View style={styles.textGroup}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.cancelButton, isConfirming && styles.buttonDisabled]}
            onPress={onCancel}
            disabled={isConfirming}
            accessibilityRole="button">
            <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
          </Pressable>

          <Pressable
            style={[styles.confirmButton, isConfirming && styles.buttonDisabled]}
            onPress={onConfirm}
            disabled={isConfirming}
            accessibilityRole="button">
            {isConfirming ? (
              <ActivityIndicator color={palette.onError} />
            ) : (
              <>
                <MaterialCommunityIcons name="delete-outline" size={18} color={palette.onError} />
                <Text style={styles.confirmButtonText}>{confirmLabel}</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.sm,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.errorContainer,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.18)',
    alignSelf: 'center',
  },
  textGroup: {
    gap: spacing.xs,
  },
  title: {
    ...typography.titleMedium,
    color: palette.onSurface,
    fontFamily: 'Lexend-Bold',
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    ...typography.bodyMedium,
    color: palette.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: shape.medium,
    borderWidth: 1,
    borderColor: palette.outline,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    ...typography.labelLarge,
    color: palette.onSurface,
    fontFamily: 'Lexend-SemiBold',
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    height: 44,
    borderRadius: shape.medium,
    backgroundColor: palette.error,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  confirmButtonText: {
    ...typography.labelLarge,
    color: palette.onError,
    fontFamily: 'Lexend-Bold',
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
