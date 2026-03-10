import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { StudentCard } from '@features/students/components/StudentCard';
import { StudentEntity } from '@features/students/types/student';
import { palette, spacing, typography } from '@theme/tokens';

const STUDENT_ITEM_HEIGHT = 88;

export type StudentListProps = {
  data: StudentEntity[];
  isRefreshing: boolean;
  isFetchingNextPage: boolean;
  onRefresh: () => void;
  onEndReached: () => void;
  onScroll?: () => void;
  emptyTitle?: string;
  emptySubtitle?: string;
  onSelectStudent?: (student: StudentEntity) => void;
  onLongPressStudent?: (student: StudentEntity) => void;
  selectedStudentIds?: Set<string>;
  listRef?: React.RefObject<FlatList | null>;
};

export const StudentList = ({
  data,
  isRefreshing,
  isFetchingNextPage,
  onRefresh,
  onEndReached,
  onScroll,
  emptyTitle,
  emptySubtitle,
  onSelectStudent,
  onLongPressStudent,
  selectedStudentIds,
  listRef,
}: StudentListProps) => {
  const selectionMode = (selectedStudentIds?.size ?? 0) > 0;

  const renderItem = useCallback(
    ({ item }: { item: StudentEntity }) => (
      <StudentCard
        item={item}
        isSelected={selectedStudentIds?.has(item.id) ?? false}
        selectionMode={selectionMode}
        onPress={onSelectStudent ?? (() => {})}
        onLongPress={onLongPressStudent ?? (() => {})}
      />
    ),
    [selectedStudentIds, selectionMode, onSelectStudent, onLongPressStudent],
  );

  return (
    <FlatList
      ref={listRef}
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      onScroll={onScroll}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.8}
      windowSize={5}
      maxToRenderPerBatch={10}
      initialNumToRender={10}
      removeClippedSubviews={true}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={[palette.primary]}
          tintColor={palette.primary}
        />
      }
      getItemLayout={(_data, index) => ({
        length: STUDENT_ITEM_HEIGHT,
        offset: STUDENT_ITEM_HEIGHT * index,
        index,
      })}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={styles.footerLoading}>
            <ActivityIndicator color={palette.primary} />
          </View>
        ) : null
      }
      ListEmptyComponent={() => (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{emptyTitle ?? 'No students found'}</Text>
          {emptySubtitle ? <Text style={styles.emptySubtitle}>{emptySubtitle}</Text> : null}
        </View>
      )}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    gap: spacing.md,
    paddingBottom: 80,
  },
  footerLoading: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.titleMedium,
    color: palette.onSurface,
  },
  emptySubtitle: {
    ...typography.bodyMedium,
    color: palette.onSurfaceVariant,
    textAlign: 'center',
  },
});
