import { FlatList, ListRenderItemInfo, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { ClassEntity } from '@features/classes/types/class';

import { palette, spacing, typography } from '@theme/tokens';
import { ClassCard } from './ClassCard';

export type ClassListProps = {
  data: ClassEntity[];
  isLoading: boolean;
  onRefresh: () => void;
  emptyTitle?: string;
  emptySubtitle?: string;
  onSelectClass?: (classEntity: ClassEntity) => void;
  onLongPressClass?: (classEntity: ClassEntity) => void;
  selectedClassIds?: Set<string>;
};
export const ClassList = ({ data, isLoading, onRefresh, emptyTitle, emptySubtitle, onSelectClass, onLongPressClass, selectedClassIds }: ClassListProps) => {
  const selectionMode = (selectedClassIds?.size ?? 0) > 0;
  if (!data.length) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>{emptyTitle ?? 'No classes yet'}</Text>
        <Text style={styles.emptySubtitle}>
          {emptySubtitle ?? 'Create your first class to start tracking attendance.'}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }: ListRenderItemInfo<ClassEntity>) => (
        <ClassCard 
          item={item} 
          onPress={onSelectClass ? () => onSelectClass(item) : undefined}
          onLongPress={onLongPressClass ? () => onLongPressClass(item) : undefined}
          isSelected={selectedClassIds?.has(item.id) ?? false}
          selectionMode={selectionMode}
        />
      )}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={onRefresh}
          colors={[palette.primary]}
          progressBackgroundColor={palette.surfaceContainerLowest}
          tintColor={palette.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: spacing.lg,
    paddingHorizontal: 0,
    paddingBottom: spacing.xxl + spacing.xl,
    gap: spacing.md,
    flexGrow: 1,
  },
  separator: {
    height: spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.titleMedium,
    color: palette.onSurface,
  },
  emptySubtitle: {
    ...typography.bodyMedium,
    textAlign: 'center',
    color: palette.onSurfaceVariant,
  },
});
