import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { memo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ClassEntity } from '@features/classes/types/class';

import { palette, shape, spacing, typography } from '@theme/tokens';

export type ClassCardProps = {
  item: ClassEntity;
  onPress?: (item: ClassEntity) => void;
  onLongPress?: (item: ClassEntity) => void;
  isSelected?: boolean;
  selectionMode?: boolean;
};

export const ClassCard = memo(({ item, onPress, onLongPress, isSelected = false, selectionMode = false }: ClassCardProps) => {
  const CardContainer = onPress ? Pressable : View;

  return (
    <CardContainer
      style={[
        styles.card,
        isSelected && styles.cardSelected,
      ]}
      {...(onPress
        ? {
            onPress: () => onPress(item),
            onLongPress: onLongPress ? () => onLongPress(item) : undefined,
            accessibilityRole: 'button',
            android_ripple: { color: palette.primaryContainer },
          }
        : {})}
      {...(onPress && Platform.OS === 'ios' ? { hitSlop: styles.hitSlop } : {})}>

      {isSelected ? (
        <View style={styles.thumbnailSelected}>
          <MaterialCommunityIcons name="check" size={28} color={palette.onPrimary} />
        </View>
      ) : item.imageUri ? (
        <View style={styles.thumbnail}>
          <ExpoImage source={{ uri: item.imageUri }} style={styles.thumbnailImage} contentFit="cover" />
        </View>
      ) : (
        <View style={styles.thumbnail}>
          <MaterialCommunityIcons
            name={(item.iconName || 'calendar-month-outline') as any}
            size={28}
            color={palette.primary}
          />
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
        {item.instructorName ? (
          <Text style={styles.subtitle} numberOfLines={1}>{item.instructorName}</Text>
        ) : null}
        <View style={styles.metaRows}>
          {item.location ? (
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={12} color={palette.onSurfaceMuted} />
              <Text style={styles.locationLabel} numberOfLines={1}>{item.location}</Text>
            </View>
          ) : null}
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="clock-outline" size={12} color={palette.primary} />
            <Text style={styles.timeLabel}>{formatScheduleSummary(item.schedule)}</Text>
          </View>
        </View>
      </View>

      {!selectionMode ? (
        <View style={styles.chevronContainer}>
          <MaterialCommunityIcons name="chevron-right" size={20} color={palette.onSurfaceMuted} />
        </View>
      ) : null}
    </CardContainer>
  );
});

ClassCard.displayName = 'ClassCard';

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: shape.medium,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
    padding: spacing.lg,
    backgroundColor: palette.surface,
    gap: spacing.lg,
    shadowColor: palette.shadow,
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  cardSelected: {
    borderColor: palette.primary,
    borderWidth: 2,
    shadowColor: palette.primary,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: palette.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  thumbnailSelected: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.titleMedium,
    color: palette.onSurface,
  },
  subtitle: {
    ...typography.bodySmall,
    color: palette.onSurfaceVariant,
  },
  metaRows: {
    gap: spacing.xs,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timeLabel: {
    ...typography.labelSmall,
    color: palette.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.0,
  },
  locationLabel: {
    ...typography.bodySmall,
    color: palette.onSurfaceVariant,
  },
  chevronContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  hitSlop: {
    top: spacing.xs,
    bottom: spacing.xs,
    left: spacing.xs,
    right: spacing.xs,
  },
});

const formatScheduleSummary = (entries: ClassEntity['schedule']) => {
  if (!entries.length) {
    return 'No schedule set';
  }

  const [first, ...rest] = entries;
  const dayName = first.dayOfWeek.slice(0, 3);
  const formattedFirst = `${dayName} ${first.startTime}\u2013${first.endTime}`;

  if (!rest.length) {
    return formattedFirst;
  }

  return `${formattedFirst} \u00B7 +${rest.length} more`;
};
