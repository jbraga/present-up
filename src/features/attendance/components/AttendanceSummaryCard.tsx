import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ATTENDANCE_THRESHOLD } from '@core/constants/attendance';

import { AttendanceSummary } from '@features/attendance/types/attendance';
import { StudentEntity } from '@features/students/types/student';

import { formatPercentage } from '@shared/utils/formatPercentage';
import { palette, shape, spacing, typography } from '@theme/tokens';

export type AttendanceSummaryCardProps = {
  summary: AttendanceSummary;
  student?: StudentEntity;
};

export const AttendanceSummaryCard = memo(({ summary, student }: AttendanceSummaryCardProps) => {
  const attendancePercentage = formatPercentage(summary.attendanceRate, 1);
  const isBelowThreshold = useMemo(() => summary.attendanceRate < ATTENDANCE_THRESHOLD, [summary.attendanceRate]);

  return (
    <View style={[styles.container, isBelowThreshold && styles.atRiskContainer]}>
      <View style={styles.header}>
        <Text style={styles.name}>{student ? `${student.firstName} ${student.lastName}` : summary.studentId}</Text>
        <Text style={styles.percentage}>{attendancePercentage}</Text>
      </View>
      <View style={styles.metrics}>
        <Metric label="Total" value={summary.totalSessions} />
        <Metric label="Attended" value={summary.sessionsAttended} />
        <Metric label="Missed" value={summary.sessionsMissed} />
        <Metric label="Excused" value={summary.sessionsExcused} />
      </View>
      {isBelowThreshold ? (
        <Text style={styles.warning}>Below required attendance threshold</Text>
      ) : (
        <Text style={styles.goodStanding}>In good standing</Text>
      )}
    </View>
  );
});

AttendanceSummaryCard.displayName = 'AttendanceSummaryCard';

const Metric = ({ label, value }: { label: string; value: number }) => (
  <View style={styles.metric}>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    borderRadius: shape.large,
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    backgroundColor: palette.surface,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: palette.shadow,
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  atRiskContainer: {
    borderColor: palette.warning,
    backgroundColor: palette.warningContainer,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    ...typography.titleMedium,
    color: palette.onSurface,
    fontFamily: 'Lexend-Medium',
    fontWeight: '500',
  },
  percentage: {
    ...typography.titleLarge,
    color: palette.success,
    fontWeight: '700',
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    ...typography.titleMedium,
    color: palette.onSurface,
    fontFamily: 'Lexend-Bold',
    fontWeight: '700',
  },
  metricLabel: {
    ...typography.labelSmall,
    color: palette.onSurfaceVariant,
  },
  warning: {
    ...typography.labelSmall,
    color: palette.onWarningContainer,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  goodStanding: {
    ...typography.labelSmall,
    color: palette.success,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
