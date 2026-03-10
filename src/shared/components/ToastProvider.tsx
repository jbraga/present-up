import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette, shape, spacing, typography } from '@theme/tokens';

export type ToastType = 'info' | 'success' | 'error';

type ToastMessage = {
  title: string;
  message: string;
  type: ToastType;
};

type ShowToastInput = {
  title: string;
  message: string;
  type?: ToastType;
  durationMs?: number;
};

type ToastContextValue = {
  showToast: (toast: ShowToastInput) => void;
  hideToast: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider = ({ children }: PropsWithChildren) => {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const toastBottomOffset = insets.bottom + 60 + spacing.sm;

  const hideToast = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(({ title, message, type = 'info', durationMs = 3200 }: ShowToastInput) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setToast({ title, message, type });

    timeoutRef.current = setTimeout(() => {
      setToast(null);
      timeoutRef.current = null;
    }, durationMs);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const contextValue = useMemo(() => ({ showToast, hideToast }), [hideToast, showToast]);

  const iconName =
    toast?.type === 'error'
      ? 'alert-circle-outline'
      : toast?.type === 'success'
        ? 'check-circle-outline'
        : 'information-outline';

  const iconColor =
    toast?.type === 'error'
      ? palette.onErrorContainer
      : toast?.type === 'success'
        ? palette.onSuccessContainer
        : palette.onPrimaryContainer;

  return (
    <ToastContext.Provider value={contextValue}>
      <View style={styles.root}>
        {children}
        {toast ? (
          <View pointerEvents="none" style={[styles.wrapper, { bottom: toastBottomOffset }]}>
            <View
              style={[
                styles.container,
                toast.type === 'success' && styles.containerSuccess,
                toast.type === 'error' && styles.containerError,
              ]}>
              <MaterialCommunityIcons name={iconName} size={20} color={iconColor} style={styles.icon} />
              <View style={styles.textContainer}>
                <Text style={styles.title}>{toast.title}</Text>
                <Text style={styles.message}>{toast.message}</Text>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  wrapper: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
    zIndex: 20,
    elevation: 20,
  },
  container: {
    width: '100%',
    maxWidth: 560,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: shape.medium,
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    backgroundColor: palette.surface,
    shadowColor: palette.shadow,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  containerSuccess: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  containerError: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  icon: {
    marginTop: 1,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.titleSmall,
    color: palette.onSurface,
    fontFamily: 'Lexend-SemiBold',
    includeFontPadding: false,
  },
  message: {
    ...typography.bodyMedium,
    color: palette.onSurfaceVariant,
    fontFamily: 'Lexend-Regular',
    includeFontPadding: false,
  },
});
