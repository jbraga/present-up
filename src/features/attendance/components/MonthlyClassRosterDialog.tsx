import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, View } from 'react-native';

import { ClassStudentAttendanceRow } from '@features/classes/components/ClassStudentAttendanceRow';
import { useStudentsByIds } from '@features/students/hooks/useStudentsByIds';
import { BottomSheet } from '@shared/components/BottomSheet';
import { SearchInput } from '@shared/components/SearchInput';
import { palette, spacing, typography } from '@theme/tokens';
import { MonthlyClassSummary } from '../hooks/useMonthlyAttendance';

type MonthlyClassRosterDialogProps = {
  visible: boolean;
  summary: MonthlyClassSummary | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClose: () => void;
};

export const MonthlyClassRosterDialog = ({
  visible,
  summary,
  searchQuery,
  onSearchChange,
  onClose,
}: MonthlyClassRosterDialogProps) => {
  const studentsQuery = useStudentsByIds(summary?.studentIds ?? []);
  const students = studentsQuery.data ?? [];

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      (s) => s.firstName.toLowerCase().includes(q) || s.lastName.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  if (!summary) return null;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.headerRow}>
            <View style={styles.headerTitles}>
              <Text style={styles.sessionLabel}>MONTHLY ROSTER</Text>
              <Text style={styles.className} numberOfLines={1}>{summary.className}</Text>
            </View>
          </View>

          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>{summary.totalSessionsRecorded} Sessions</Text>
            <View style={styles.registeredBadge}>
              <MaterialCommunityIcons name="account-group" size={14} color={palette.primary} />
              <Text style={styles.registeredText}>{students.length} Registered</Text>
            </View>
          </View>

          <SearchInput
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder="Search roster..."
          />

          <FlatList
            data={filteredStudents}
            keyExtractor={(item) => item.id}
            style={styles.studentList}
            contentContainerStyle={styles.studentListContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            bounces
            renderItem={({ item }) => (
              <ClassStudentAttendanceRow
                student={item}
                summary={summary.studentSummaries[item.id] ?? null}
                minAttendancePercentage={summary.minAttendancePercentage}
              />
            )}
            ListEmptyComponent={() => (
              <View style={styles.centerState}>
                <MaterialCommunityIcons name="account-search-outline" size={48} color={palette.onSurfaceMuted} />
                <Text style={styles.centerStateTitle}>No students found</Text>
                <Text style={styles.centerStateText}>
                  {searchQuery.trim() ? 'Try a different search term.' : 'This class has no students enrolled.'}
                </Text>
              </View>
            )}
          />
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitles: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  sessionLabel: {
    ...typography.labelSmall,
    color: palette.primary,
    fontFamily: 'Lexend-Bold',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  className: {
    ...typography.titleMedium,
    color: palette.onSurface,
    fontFamily: 'Lexend-Bold',
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateLabel: {
    ...typography.titleSmall,
    color: palette.onSurface,
    fontFamily: 'Lexend-Bold',
    fontWeight: '700',
  },
  registeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  registeredText: {
    ...typography.labelMedium,
    color: palette.primary,
    fontFamily: 'Lexend-Medium',
    fontWeight: '500',
  },
  studentList: {
    maxHeight: Dimensions.get('window').height * 0.45,
  },
  studentListContent: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  centerStateTitle: {
    ...typography.titleMedium,
    color: palette.onSurface,
  },
  centerStateText: {
    ...typography.bodyMedium,
    color: palette.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 260,
  },
});
