import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '@theme/tokens';

import { IconPickerModal } from './IconPickerModal';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type FormIconHeaderProps = {
  icon: IconName;
  description: string;
  onPickIcon?: (iconName: IconName) => void;
};

export const FormIconHeader = ({
  icon,
  description,
  onPickIcon,
}: FormIconHeaderProps) => {
  const [iconPickerVisible, setIconPickerVisible] = useState(false);

  const handlePress = useCallback(() => {
    setIconPickerVisible(true);
  }, []);

  const handleIconSelected = useCallback(
    (iconName: IconName) => {
      onPickIcon?.(iconName);
    },
    [onPickIcon],
  );

  return (
    <View style={styles.container}>
      {onPickIcon ? (
        <Pressable
          style={styles.iconCircle}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel="Change icon"
          accessibilityHint="Opens the icon picker">
          <MaterialCommunityIcons name={icon} size={32} color={palette.primary} />
          <View style={styles.editBadge}>
            <MaterialCommunityIcons name="pencil" size={12} color={palette.onPrimary} />
          </View>
        </Pressable>
      ) : (
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name={icon} size={32} color={palette.primary} />
        </View>
      )}
      <Text style={styles.description}>{description}</Text>

      {onPickIcon ? (
        <IconPickerModal
          visible={iconPickerVisible}
          onClose={() => setIconPickerVisible(false)}
          onSelect={handleIconSelected}
          selectedIcon={icon}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: palette.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: palette.surface,
  },
  description: {
    ...typography.bodyMedium,
    color: palette.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
