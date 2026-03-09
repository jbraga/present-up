import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { palette, shape, spacing, typography } from '@theme/tokens';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type StatCardProps = {
  label: string;
  value: string;
  icon: IconName;
  variant?: 'primary' | 'neutral';
};

export const StatCard = ({ label, value, icon, variant = 'neutral' }: StatCardProps) => {
  const isPrimary = variant === 'primary';

  return (
    <View style={[styles.card, isPrimary ? styles.cardPrimary : styles.cardNeutral]}>
      <MaterialCommunityIcons
        name={icon}
        size={18}
        color={isPrimary ? palette.primary : palette.onSurfaceVariant}
      />
      <Text style={styles.value}>{value}</Text>
      <Text style={[styles.label, isPrimary && styles.labelPrimary]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    borderRadius: shape.small,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    gap: 2,
  },
  cardPrimary: {
    backgroundColor: palette.primaryContainer,
    borderColor: palette.primaryContainerBorder,
  },
  cardNeutral: {
    backgroundColor: 'rgba(226, 232, 240, 0.3)',
    borderColor: 'rgba(226, 232, 240, 0.6)',
  },
  label: {
    ...typography.labelSmall,
    color: palette.onSurfaceVariant,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  labelPrimary: {
    color: 'rgba(28, 116, 233, 0.70)',
  },
  value: {
    ...typography.titleMedium,
    color: palette.onSurface,
  },
});
