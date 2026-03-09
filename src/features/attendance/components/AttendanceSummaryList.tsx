import { FlatList, ListRenderItemInfo, StyleSheet, Text, View } from 'react-native';

import { AttendanceSummary } from '@features/attendance/types/attendance';
import { StudentEntity } from '@features/students/types/student';

import { AttendanceSummaryCard } from './AttendanceSummaryCard';

type AttendanceSummaryListProps = {
  summaries: AttendanceSummary[];
  studentLookup: Record<string, StudentEntity>;
};

export const AttendanceSummaryList = ({ summaries, studentLookup }: AttendanceSummaryListProps) => {
  if (!summaries.length) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No attendance records yet</Text>
        <Text style={styles.emptySubtitle}>Record the first session to see summary data.</Text>
      </View>
    );
  }

  const renderItem = ({ item }: ListRenderItemInfo<AttendanceSummary>) => (
    <AttendanceSummaryCard summary={item} student={studentLookup[item.studentId]} />
  );

  return (
    <FlatList
      data={summaries}
      keyExtractor={(item) => `${item.classId}-${item.studentId}`}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  separator: {
    height: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
  },
});
