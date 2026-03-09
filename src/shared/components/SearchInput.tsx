import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { palette, spacing, typography } from '@theme/tokens';

type SearchInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export const SearchInput = ({ value, onChangeText, placeholder = 'Search...' }: SearchInputProps) => {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="magnify" size={20} color={palette.onSurfaceMuted} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={palette.onSurfaceMuted}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={8}>
          <MaterialCommunityIcons name="close-circle" size={18} color={palette.onSurfaceMuted} />
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  input: {
    flex: 1,
    ...typography.bodyMedium,
    color: palette.onSurface,
    padding: 0,
  },
});
