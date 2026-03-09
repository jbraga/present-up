import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { LOCAL_PROFILE } from '@core/constants/profile';
import { classQueryKeys } from '@features/classes/api/queryKeys';
import { ClassList } from '@features/classes/components/ClassList';
import { useClassList } from '@features/classes/hooks/useClassList';
import { useClassService } from '@features/classes/hooks/useClassService';
import { useClassStats } from '@features/classes/hooks/useClassStats';
import { ClassEntity } from '@features/classes/types/class';
import { ScreenHeader } from '@shared/components/ScreenHeader';
import { SelectionToolbar } from '@shared/components/SelectionToolbar';
import { StatCard } from '@shared/components/StatCard';
import { palette, spacing } from '@theme/tokens';

const ClassesListScreen = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(new Set());

  const classListQuery = useClassList();
  const classService = useClassService();
  const deleteClassesMutation = useMutation({
    mutationFn: (classIds: string[]) => classService.deleteClasses(classIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classQueryKeys.list(LOCAL_PROFILE.email) });
    },
  });

  const classes = classListQuery.data ?? [];
  const stats = useClassStats(classes);
  const isRefreshing = classListQuery.isFetching && !classListQuery.isRefetching;

  const handleOpenClass = useCallback((classEntity: ClassEntity) => {
    if (selectedClassIds.size > 0) {
      // In selection mode, toggle selection
      const newSelection = new Set(selectedClassIds);
      if (newSelection.has(classEntity.id)) {
        newSelection.delete(classEntity.id);
      } else {
        newSelection.add(classEntity.id);
      }
      setSelectedClassIds(newSelection);
    } else {
      // Navigate to detail screen
      router.push({ pathname: '/(tabs)/classes/[classId]', params: { classId: classEntity.id } });
    }
  }, [selectedClassIds, router]);

  const handleLongPressClass = useCallback((classEntity: ClassEntity) => {
    const newSelection = new Set(selectedClassIds);
    newSelection.add(classEntity.id);
    setSelectedClassIds(newSelection);
  }, [selectedClassIds]);

  const handleClearSelection = useCallback(() => {
    setSelectedClassIds(new Set());
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    const count = selectedClassIds.size;
    Alert.alert(
      'Delete classes',
      `Are you sure you want to delete ${count} class${count > 1 ? 'es' : ''}? This will also delete all associated attendance records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClassesMutation.mutateAsync(Array.from(selectedClassIds));
              setSelectedClassIds(new Set());
            } catch {
              Alert.alert('Error', 'Unable to delete classes. Please try again.');
            }
          },
        },
      ]
    );
  }, [selectedClassIds, deleteClassesMutation]);

  const handleEditSelected = useCallback(() => {
    if (selectedClassIds.size !== 1) return;
    const classId = Array.from(selectedClassIds)[0];
    setSelectedClassIds(new Set());
    router.push({ pathname: '/(tabs)/classes/edit', params: { classId } });
  }, [selectedClassIds, router]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {selectedClassIds.size > 0 ? (
        <SelectionToolbar
          count={selectedClassIds.size}
          itemLabel="class"
          onClose={handleClearSelection}
          onDelete={handleDeleteSelected}
          onEdit={handleEditSelected}
        />
      ) : null}
      <View style={styles.container}>
        <ScreenHeader
          title="My Classes"
          eyebrow="WELCOME BACK"
          showNotificationBell
        />

        <View style={styles.statsRow}>
          <StatCard
            label="Classes"
            value={String(stats.totalClasses)}
            icon="calendar-month-outline"
            variant="primary"
          />
          <StatCard
            label="Students"
            value={String(stats.totalStudents)}
            icon="account-group-outline"
          />
          <StatCard
            label="Today"
            value={String(stats.todaySessions)}
            icon="clock-outline"
            variant="primary"
          />
          <StatCard
            label="Attend."
            value={stats.attendanceRate !== null ? `${Math.round(stats.attendanceRate * 100)}%` : '—'}
            icon="chart-line"
          />
        </View>

        <View style={styles.listWrapper}>
          <ClassList
            data={classes}
            isLoading={isRefreshing || classListQuery.isLoading}
            onRefresh={() => classListQuery.refetch()}
            onSelectClass={handleOpenClass}
            onLongPressClass={handleLongPressClass}
            selectedClassIds={selectedClassIds}
            emptyTitle="No classes yet"
            emptySubtitle="Create a class to start recording attendance."
          />
        </View>
      </View>

      <Pressable
        style={styles.fab}
        onPress={() => router.push('/(tabs)/classes/create')}
        accessibilityRole="button"
        accessibilityLabel="Add class"
        accessibilityHint="Opens the form to create a class"
        android_ripple={{ color: palette.primaryContainer, foreground: true }}
        hitSlop={FAB_HIT_SLOP}>
        <MaterialCommunityIcons name="plus" size={28} color={palette.onPrimary} />
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  listWrapper: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: palette.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
  },
});

const FAB_HIT_SLOP = {
  top: spacing.sm,
  bottom: spacing.sm,
  left: spacing.sm,
  right: spacing.sm,
};

export default ClassesListScreen;
