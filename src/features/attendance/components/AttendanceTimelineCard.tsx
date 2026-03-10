import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DailyTimelineEntry, SessionStatus } from '@features/attendance/hooks/useDailyTimeline';
import { StudentEntity } from '@features/students/types/student';
import i18n from '@shared/localization/i18n';
import { palette, shape, spacing, typography } from '@theme/tokens';

type AttendanceTimelineCardProps = {
  entry: DailyTimelineEntry;
  studentLookup: Record<string, StudentEntity>;
  onPress: (classId: string) => void;
};

const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; bgColor: string }> = {
  completed: { label: i18n.t('attendance.completed'), color: palette.success, bgColor: palette.successContainer },
  in_progress: { label: i18n.t('attendance.in_progress'), color: palette.warning, bgColor: palette.warningContainer },
  upcoming: { label: i18n.t('attendance.upcoming'), color: palette.onSurfaceMuted, bgColor: palette.surfaceDim },
  not_recorded: { label: i18n.t('attendance.not_recorded'), color: palette.error, bgColor: palette.errorContainer },
};

const MAX_VISIBLE_AVATARS = 5;

export const AttendanceTimelineCard = memo(
  ({ entry, studentLookup, onPress }: AttendanceTimelineCardProps) => {
    const isFuture = entry.sessionStatus === 'upcoming';
    const isPastOrCurrent = entry.sessionStatus === 'completed' || entry.sessionStatus === 'in_progress';
    const statusConfig = STATUS_CONFIG[entry.sessionStatus];

    return (
      <View style={styles.entryContainer}>
        <View
          style={[
            styles.timeCircle,
            isPastOrCurrent ? styles.timeCircleActive : styles.timeCircleInactive,
          ]}>
          <Text
            style={[
              styles.timeCircleText,
              isPastOrCurrent ? styles.timeCircleTextActive : styles.timeCircleTextInactive,
            ]}>
            {entry.startTime}
          </Text>
        </View>

        <Pressable
          style={[styles.card, isFuture && styles.cardFuture]}
          onPress={() => onPress(entry.classId)}
          accessibilityRole="button"
          accessibilityLabel={`${entry.className} at ${entry.startTime}`}
          android_ripple={{ color: palette.primaryContainer }}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {entry.className}
          </Text>

          <View style={styles.attendanceLine}>
            {entry.hasRecords ? (
              <>
                <View style={styles.statChip}>
                  <MaterialCommunityIcons name="check-circle-outline" size={14} color={palette.primary} />
                  <Text style={[styles.statChipText, { color: palette.primary }]}>
                    {entry.presentCount}
                  </Text>
                </View>
                <View style={styles.statChip}>
                  <MaterialCommunityIcons name="close-circle-outline" size={14} color={palette.error} />
                  <Text style={[styles.statChipText, { color: palette.error }]}>
                    {entry.absentCount}
                  </Text>
                </View>
                <View style={styles.statChip}>
                  <MaterialCommunityIcons name="information-outline" size={14} color={palette.onSurfaceMuted} />
                  <Text style={[styles.statChipText, { color: palette.onSurfaceMuted }]}>
                    {entry.excusedCount}
                  </Text>
                </View>
              </>
            ) : (
              <Text style={styles.noRecordsText}>
                {entry.totalEnrolled} {i18n.t('common.enrolled')}
              </Text>
            )}
            {entry.instructorName ? (
              <>
                <View style={styles.dot} />
                <Text style={styles.instructorName} numberOfLines={1}>
                  {entry.instructorName}
                </Text>
              </>
            ) : null}
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.avatarStack}>
              {entry.studentIds.slice(0, MAX_VISIBLE_AVATARS).map((studentId, i) => {
                const student = studentLookup[studentId];
                const initials = student
                  ? `${student.firstName[0]}${student.lastName[0]}`
                  : '?';
                return (
                  <View
                    key={studentId}
                    style={[
                      styles.avatar,
                      { marginLeft: i > 0 ? -8 : 0, zIndex: MAX_VISIBLE_AVATARS - i },
                    ]}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                );
              })}
              {entry.studentIds.length > MAX_VISIBLE_AVATARS ? (
                <View style={[styles.avatar, styles.avatarOverflow, { marginLeft: -8 }]}>
                  <Text style={styles.avatarOverflowText}>
                    +{entry.studentIds.length - MAX_VISIBLE_AVATARS}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
              <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
        </Pressable>
      </View>
    );
  },
);

AttendanceTimelineCard.displayName = 'AttendanceTimelineCard';

const styles = StyleSheet.create({
  entryContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  timeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -24,
    borderWidth: 4,
    borderColor: palette.background,
  },
  timeCircleActive: {
    backgroundColor: palette.primary,
  },
  timeCircleInactive: {
    backgroundColor: palette.surface,
    borderColor: palette.background,
  },
  timeCircleText: {
    fontSize: 10,
    fontFamily: 'Lexend-Bold',
    fontWeight: '700',
  },
  timeCircleTextActive: {
    color: palette.onPrimary,
  },
  timeCircleTextInactive: {
    color: palette.onSurfaceMuted,
  },
  card: {
    flex: 1,
    borderRadius: shape.medium,
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    backgroundColor: palette.surface,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: palette.shadow,
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  cardFuture: {
    opacity: 0.7,
  },
  cardTitle: {
    ...typography.titleMedium,
    color: palette.onSurface,
    fontFamily: 'Lexend-SemiBold',
    fontWeight: '600',
  },
  attendanceLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statChipText: {
    ...typography.labelSmall,
    fontFamily: 'Lexend-Bold',
    fontWeight: '700',
  },
  noRecordsText: {
    ...typography.bodySmall,
    color: palette.onSurfaceMuted,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.outlineVariant,
  },
  instructorName: {
    ...typography.bodySmall,
    color: palette.onSurfaceVariant,
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: palette.surface,
  },
  avatarText: {
    fontSize: 8,
    fontFamily: 'Lexend-Bold',
    fontWeight: '700',
    color: palette.primary,
  },
  avatarOverflow: {
    backgroundColor: palette.primaryContainer,
  },
  avatarOverflowText: {
    fontSize: 8,
    fontFamily: 'Lexend-Bold',
    fontWeight: '700',
    color: palette.primary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  statusBadgeText: {
    ...typography.labelSmall,
    fontWeight: '500',
  },
});
