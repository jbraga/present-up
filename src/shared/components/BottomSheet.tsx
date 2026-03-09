import { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette, shape, spacing } from '@theme/tokens';

export type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
};

export const BottomSheet = ({ visible, onClose, children }: BottomSheetProps) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} onRequestClose={onClose} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
        keyboardVerticalOffset={Platform.select({ ios: 0, android: 0 })}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <View />
        </Pressable>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
          <View style={styles.handle} />
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: palette.scrim,
  },
  overlay: {
    flex: 1,
  },
  sheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: shape.extraLarge,
    borderTopRightRadius: shape.extraLarge,
    paddingHorizontal: spacing.lg,
    maxHeight: '88%',
    gap: spacing.md,
    overflow: 'hidden',
    shadowColor: palette.shadow,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 16,
    elevation: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 4,
    borderRadius: 999,
    backgroundColor: palette.outlineVariant,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
});
