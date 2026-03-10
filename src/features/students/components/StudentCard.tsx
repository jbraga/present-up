import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StudentEntity } from '@features/students/types/student';
import { palette, shape, spacing, typography } from '@theme/tokens';

export type StudentCardProps = {
  item: StudentEntity;
  isSelected: boolean;
  selectionMode: boolean;
  onPress: (student: StudentEntity) => void;
  onLongPress: (student: StudentEntity) => void;
};

export const StudentCard = memo(({ item, isSelected, selectionMode, onPress, onLongPress }: StudentCardProps) => {
  const fullName = item.firstName + ' ' + item.lastName;
  const initials = (item.firstName[0] + item.lastName[0]).toUpperCase();
  
  return (
    <Pressable
      style={[styles.studentCard, isSelected && styles.studentCardSelected]}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item)}
      android_ripple={{ color: palette.primaryContainer }}>
      <View style={styles.studentRow}>
        {isSelected ? (
          <View style={styles.avatarSelected}>
            <MaterialCommunityIcons name="check" size={22} color={palette.onPrimary} />
          </View>
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{fullName}</Text>
          <View style={styles.metaRows}>
            {item.email ? (
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="email-outline" size={12} color={palette.onSurfaceMuted} />
                <Text style={styles.studentMeta} numberOfLines={1}>{item.email}</Text>
              </View>
            ) : null}
            {item.guardianEmail ? (
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="account-child-outline" size={12} color={palette.onSurfaceMuted} />
                <Text style={styles.studentMeta} numberOfLines={1}>{item.guardianEmail}</Text>
              </View>
            ) : null}
            {item.phoneNumber ? (
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="phone-outline" size={12} color={palette.onSurfaceMuted} />
                <Text style={styles.studentMeta} numberOfLines={1}>{item.phoneNumber}</Text>
              </View>
            ) : null}
          </View>
        </View>
        {!selectionMode ? (
          <View style={styles.chevronContainer}>
            <MaterialCommunityIcons name="chevron-right" size={20} color={palette.onSurfaceMuted} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

StudentCard.displayName = 'StudentCard';

const styles = StyleSheet.create({
  studentCard: {
    borderRadius: shape.large,
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    backgroundColor: palette.surface,
    padding: spacing.lg,
    gap: spacing.xs,
    shadowColor: palette.shadow,
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  studentCardSelected: {
    backgroundColor: palette.surface,
    borderColor: palette.primary,
    borderWidth: 2,
    shadowColor: palette.primary,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSelected: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.titleSmall,
    color: palette.primary,
    fontFamily: 'Lexend-Bold',
    fontWeight: '700',
  },
  studentInfo: {
    flex: 1,
    gap: spacing.xs,
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
  chevronContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentName: {
    ...typography.titleMedium,
    color: palette.onSurface,
    fontFamily: 'Lexend-SemiBold',
    fontWeight: '600',
  },
  studentMeta: {
    ...typography.bodySmall,
    color: palette.onSurfaceVariant,
  },
});
