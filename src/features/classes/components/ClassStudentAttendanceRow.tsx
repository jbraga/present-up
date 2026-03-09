import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AttendanceSummary } from '@features/attendance/types/attendance';
import { StudentEntity } from '@features/students/types/student';

import { formatPercentage } from '@shared/utils/formatPercentage';
import { palette, spacing, typography } from '@theme/tokens';

export type ClassStudentAttendanceRowProps = {
  student: StudentEntity | null;
  summary: AttendanceSummary | null;
  minAttendancePercentage: number;
  onRecordAttendance?: () => void;
  isSelected?: boolean;
  selectionMode?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
};

const getInitials = (student: StudentEntity | null): string => {
  if (!student) return '??';
  const first = student.firstName?.charAt(0) ?? '';
  const last = student.lastName?.charAt(0) ?? '';
  return `${first}${last}`.toUpperCase();
};

const isAtRisk = (summary: AttendanceSummary | null, threshold: number): boolean => {
  if (!summary || summary.totalSessions === 0) return false;
  return summary.attendanceRate < threshold;
};

export const ClassStudentAttendanceRow = memo(
  ({ student, summary, minAttendancePercentage, onRecordAttendance, isSelected, selectionMode, onPress, onLongPress }: ClassStudentAttendanceRowProps) => {
    const atRisk = useMemo(() => isAtRisk(summary, minAttendancePercentage), [summary, minAttendancePercentage]);
    const initials = useMemo(() => getInitials(student), [student]);
    const attended = summary?.sessionsAttended ?? 0;
    const total = summary?.totalSessions ?? 0;

    const handlePress = () => {
      if (selectionMode && onPress) {
        onPress();
      } else if (onRecordAttendance) {
        onRecordAttendance();
      }
    };

    const handleLongPress = () => {
      if (onLongPress) {
        onLongPress();
      }
    };

    const missed = summary?.sessionsMissed ?? 0;
    const excused = summary?.sessionsExcused ?? 0;
    const rate = summary?.attendanceRate ?? 0;
    const hasData = total > 0;

    return (
      <Pressable
        style={[
          styles.container,
          atRisk && styles.containerAtRisk,
          isSelected && styles.containerSelected,
        ]}
        onPress={handlePress}
        onLongPress={handleLongPress}
        accessibilityRole={onRecordAttendance || selectionMode ? 'button' : undefined}
        android_ripple={{ color: palette.primaryContainer }}>
        <View style={styles.topRow}>
          <View style={styles.avatarNameGroup}>
            {isSelected ? (
              <View style={styles.avatarSelected}>
                <MaterialCommunityIcons name="check" size={22} color={palette.onPrimary} />
              </View>
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={styles.nameGroup}>
              <Text style={styles.name} numberOfLines={1}>
                {student ? `${student.firstName} ${student.lastName}` : 'Unknown student'}
              </Text>
              {hasData ? (
                <Text style={[styles.statusText, atRisk && styles.statusTextAtRisk]}>
                  {atRisk ? 'Below threshold' : 'Good standing'}
                </Text>
              ) : (
                <Text style={styles.statusText}>No sessions yet</Text>
              )}
            </View>
          </View>
          {hasData ? (
            <View style={[styles.percentBadge, atRisk && styles.percentBadgeAtRisk]}>
              <Text style={[styles.percentText, atRisk && styles.percentTextAtRisk]}>
                {formatPercentage(rate)}
              </Text>
            </View>
          ) : null}
        </View>
        {hasData ? (
          <>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.round(rate * 100)}%` },
                  atRisk && styles.progressBarFillAtRisk,
                ]}
              />
            </View>
            <View style={styles.metricsRow}>
              <View style={styles.metric}>
                <MaterialCommunityIcons name="check-circle-outline" size={14} color={palette.primary} />
                <Text style={styles.metricText}>{attended} present</Text>
              </View>
              {missed > 0 ? (
                <View style={styles.metric}>
                  <MaterialCommunityIcons name="close-circle-outline" size={14} color={palette.error} />
                  <Text style={styles.metricText}>{missed} missed</Text>
                </View>
              ) : null}
              {excused > 0 ? (
                <View style={styles.metric}>
                  <MaterialCommunityIcons name="information-outline" size={14} color={palette.onSurfaceMuted} />
                  <Text style={styles.metricText}>{excused} excused</Text>
                </View>
              ) : null}
              <Text style={styles.metricTotal}>{total} total</Text>
            </View>
          </>
        ) : null}
      </Pressable>
    );
  },
);

ClassStudentAttendanceRow.displayName = 'ClassStudentAttendanceRow';

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
    backgroundColor: palette.surface,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: palette.shadow,
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  containerAtRisk: {
    backgroundColor: '#F9E4E4',
    borderColor: '#F0D0D4',
  },
  containerSelected: {
    backgroundColor: palette.surface,
    borderColor: palette.primary,
    borderWidth: 2,
    shadowColor: palette.primary,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarNameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
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
    ...typography.labelLarge,
    color: palette.primary,
    fontFamily: 'Lexend-Bold',
    fontWeight: '700',
  },
  nameGroup: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.titleSmall,
    color: palette.onSurface,
    fontFamily: 'Lexend-SemiBold',
    fontWeight: '600',
  },
  statusText: {
    ...typography.labelSmall,
    color: palette.onSurfaceMuted,
  },
  statusTextAtRisk: {
    color: palette.error,
  },
  percentBadge: {
    backgroundColor: palette.primaryContainer,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginLeft: spacing.sm,
  },
  percentBadgeAtRisk: {
    backgroundColor: '#F9E4E4',
  },
  percentText: {
    ...typography.labelLarge,
    color: palette.primary,
    fontFamily: 'Lexend-Bold',
    fontWeight: '700',
  },
  percentTextAtRisk: {
    color: palette.error,
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.surfaceDim,
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.primary,
  },
  progressBarFillAtRisk: {
    backgroundColor: palette.error,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    ...typography.labelSmall,
    color: palette.onSurfaceVariant,
  },
  metricTotal: {
    ...typography.labelSmall,
    color: palette.onSurfaceMuted,
    marginLeft: 'auto',
  },
});