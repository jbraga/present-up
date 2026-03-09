import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { palette, spacing, typography } from '@theme/tokens';

type FormInputProps = {
  label: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoCorrect?: boolean;
  returnKeyType?: TextInputProps['returnKeyType'];
  onBlur?: () => void;
};

export const FormInput = ({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  returnKeyType,
  onBlur,
}: FormInputProps) => {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        {icon ? (
          <MaterialCommunityIcons name={icon} size={20} color={palette.onSurfaceMuted} style={styles.icon} />
        ) : null}
        <TextInput
          style={[styles.input, !icon && styles.inputNoIcon]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.onSurfaceMuted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          onBlur={onBlur}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  label: {
    ...typography.labelLarge,
    color: palette.onSurfaceVariant,
    fontFamily: 'Lexend-Medium',
    fontWeight: '500',
    marginLeft: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.bodyLarge,
    color: palette.onSurface,
    padding: 0,
  },
  inputNoIcon: {
    paddingLeft: 4,
  },
});
