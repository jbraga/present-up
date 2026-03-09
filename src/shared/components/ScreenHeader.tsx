import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '@theme/tokens';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type ActionButton = {
  icon: IconName;
  label: string;
  onPress: () => void;
};

type ScreenHeaderProps = {
  title: string;
  eyebrow?: string;
  actions?: ActionButton[];
  showNotificationBell?: boolean;
  children?: ReactNode;
};

export const ScreenHeader = ({
  title,
  eyebrow,
  actions,
  showNotificationBell,
  children,
}: ScreenHeaderProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.left}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.right}>
          {actions?.map((action) => (
            <Pressable
              key={action.icon}
              style={styles.actionButton}
              onPress={action.onPress}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              hitSlop={4}>
              <MaterialCommunityIcons name={action.icon} size={24} color={palette.onSurfaceVariant} />
            </Pressable>
          ))}
          {showNotificationBell ? (
            <View style={styles.bellContainer}>
              <MaterialCommunityIcons name="bell-outline" size={24} color={palette.onSurfaceVariant} />
              <View style={styles.bellDot} />
            </View>
          ) : null}
        </View>
      </View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  left: {
    flex: 1,
    gap: spacing.xs,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  eyebrow: {
    ...typography.labelMedium,
    color: palette.onSurfaceVariant,
    letterSpacing: 1.5,
    fontFamily: 'Lexend-Light',
    fontWeight: '300',
    textTransform: 'uppercase',
  },
  title: {
    ...typography.headlineMedium,
    color: palette.onSurface,
    fontFamily: 'Lexend-SemiBold',
    fontWeight: '600',
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(226, 232, 240, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.primary,
  },
});
