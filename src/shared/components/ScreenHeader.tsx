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
  titleIcon?: IconName;
  eyebrow?: string;
  actions?: ActionButton[];
  showNotificationBell?: boolean;
  children?: ReactNode;
};

export const ScreenHeader = ({
  title,
  titleIcon,
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
          <View style={styles.titleRow}>
            {titleIcon ? <MaterialCommunityIcons name={titleIcon} size={24} color={palette.onSurface} /> : null}
            <Text style={styles.title}>{title}</Text>
          </View>
        </View>
        <View style={[styles.right, eyebrow ? styles.rightWithEyebrow : null]}>
          {actions?.map((action) => (
            <Pressable
              key={action.icon}
              style={styles.actionButton}
              onPress={action.onPress}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              hitSlop={4}>
              <MaterialCommunityIcons name={action.icon} size={24} color={palette.onSurfaceVariant} style={styles.actionIcon} />
            </Pressable>
          ))}
          {showNotificationBell ? (
            <View style={styles.bellContainer}>
              <MaterialCommunityIcons name="bell-outline" size={24} color={palette.onSurfaceVariant} style={styles.actionIcon} />
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
    marginTop: -spacing.md,
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
  rightWithEyebrow: {
    alignSelf: 'flex-end',
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
    includeFontPadding: false,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.xs,
  },
  bellContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(226, 232, 240, 0.3)',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.xs,
  },
  actionIcon: {
    marginTop: 1,
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
