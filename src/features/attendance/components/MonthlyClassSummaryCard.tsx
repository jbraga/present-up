import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatPercentage } from '@shared/utils/formatPercentage';
import { palette, shape, spacing, typography } from '@theme/tokens';
import { MonthlyClassSummary } from '../hooks/useMonthlyAttendance';

type MonthlyClassSummaryCardProps = {
  summary: MonthlyClassSummary;
  onPress: (classId: string) => void;
};

export const MonthlyClassSummaryCard = memo(({ summary, onPress }: MonthlyClassSummaryCardProps) => {
  const { t } = useTranslation();
  const isAtRisk = summary.attendanceRate < summary.minAttendancePercentage;

  return (
    <Pressable
      style={[styles.card, isAtRisk && styles.cardAtRisk]}
      onPress={() => onPress(summary.classId)}
      android_ripple={{ color: palette.primaryContainer }}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={styles.className} numberOfLines={1}>
            {summary.className}
          </Text>
          {summary.instructorName ? (
            <Text style={styles.instructorName} numberOfLines={1}>
              {summary.instructorName}
            </Text>
          ) : null}
        </View>
        <View style={[styles.percentBadge, isAtRisk && styles.percentBadgeAtRisk]}>
          <Text style={[styles.percentText, isAtRisk && styles.percentTextAtRisk]}>
            {formatPercentage(summary.attendanceRate)}
          </Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <MaterialCommunityIcons name="calendar-check" size={16} color={palette.onSurfaceVariant} />
          <Text style={styles.metricText}>{summary.totalSessionsRecorded} {t('report.sessions').toLowerCase()}</Text>
        </View>
        <View style={styles.metric}>
          <MaterialCommunityIcons name="account-group" size={16} color={palette.onSurfaceVariant} />
          <Text style={styles.metricText}>{summary.totalEnrolled} {t('students.title').toLowerCase()}</Text>
        </View>
      </View>
    </Pressable>
  );
});

MonthlyClassSummaryCard.displayName = 'MonthlyClassSummaryCard';

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: shape.medium,
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: palette.shadow,
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  cardAtRisk: {
    backgroundColor: '#F9E4E4',
    borderColor: '#F0D0D4',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  titleGroup: {
    flex: 1,
    gap: 2,
  },
  className: {
    ...typography.titleMedium,
    color: palette.onSurface,
    fontFamily: 'Lexend-SemiBold',
    fontWeight: '600',
  },
  instructorName: {
    ...typography.bodySmall,
    color: palette.onSurfaceVariant,
  },
  percentBadge: {
    backgroundColor: palette.primaryContainer,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  percentBadgeAtRisk: {
    backgroundColor: '#F0D0D4',
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
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricText: {
    ...typography.labelSmall,
    color: palette.onSurfaceVariant,
  },
});
