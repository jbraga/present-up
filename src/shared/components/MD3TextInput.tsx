import { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { palette, typography } from '@theme/tokens';

export type MD3TextInputProps = TextInputProps & {
  label?: string;
  error?: string;
  supportingText?: string;
};

export const MD3TextInput = ({ label, error, supportingText, style, ...props }: MD3TextInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = Boolean(props.value);
  const hasError = Boolean(error);
  const isLabelFloating = isFocused || hasValue;

  const labelStyle = [
    styles.label,
    isLabelFloating && styles.labelFloating,
    hasError && styles.labelError,
    isFocused && !hasError && styles.labelFocused,
  ];

  const containerStyle = [
    styles.container,
    isFocused && styles.containerFocused,
    hasError && styles.containerError,
  ];

  return (
    <View style={styles.wrapper}>
      <View style={containerStyle}>
        {label ? (
          <View style={[styles.labelContainer, isLabelFloating && styles.labelContainerFloating]}>
            <Text style={labelStyle}>{label}</Text>
          </View>
        ) : null}
        <TextInput
          {...props}
          style={[styles.input, style]}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          placeholderTextColor={palette.onSurfaceVariant}
        />
      </View>
      {(error || supportingText) && (
        <Text style={[styles.supportingText, hasError && styles.supportingTextError]}>
          {error || supportingText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  container: {
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    minHeight: 56,
    justifyContent: 'center',
    backgroundColor: palette.surface,
  },
  containerFocused: {
    borderWidth: 2,
    borderColor: palette.primary,
  },
  containerError: {
    borderWidth: 2,
    borderColor: palette.error,
  },
  labelContainer: {
    position: 'absolute',
    left: 12,
    top: 16,
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
  },
  labelContainerFloating: {
    top: -8,
    backgroundColor: palette.background,
  },
  label: {
    ...typography.bodyLarge,
    color: palette.onSurfaceVariant,
    fontFamily: 'Lexend-Regular',
  },
  labelFloating: {
    ...typography.bodySmall,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Lexend-Regular',
  },
  labelFocused: {
    color: palette.primary,
  },
  labelError: {
    color: palette.error,
  },
  input: {
    ...typography.bodyLarge,
    color: palette.onSurface,
    fontFamily: 'Lexend-Regular',
    paddingTop: 8,
    paddingBottom: 8,
    minHeight: 24,
  },
  supportingText: {
    ...typography.bodySmall,
    color: palette.onSurfaceVariant,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  supportingTextError: {
    color: palette.error,
  },
});
