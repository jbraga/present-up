import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { studentQueryKeys } from '@features/students/api/queryKeys';
import { StudentList } from '@features/students/components/StudentList';
import { useStudentList } from '@features/students/hooks/useStudentList';
import { useStudentService } from '@features/students/hooks/useStudentService';
import { StudentEntity } from '@features/students/types/student';
import { ConfirmationDialog } from '@shared/components/ConfirmationDialog';
import { ScreenHeader } from '@shared/components/ScreenHeader';
import { SearchInput } from '@shared/components/SearchInput';
import { SelectionToolbar } from '@shared/components/SelectionToolbar';
import { useToast } from '@shared/components/ToastProvider';
import { palette, spacing, typography } from '@theme/tokens';

const MAX_STUDENTS_LOADED = 1000;

const StudentsScreen = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const hasScrolled = useRef(false);
  const flatListRef = useRef<FlatList>(null);
  const { showToast } = useToast();

  const studentListQuery = useStudentList(query);
  const studentService = useStudentService();
  const deleteStudentsMutation = useMutation({
    mutationFn: (studentIds: string[]) => studentService.deleteStudents(studentIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentQueryKeys.all });
    },
  });

  const handleStudentPress = useCallback((student: StudentEntity) => {
    if (selectedStudentIds.size > 0) {
      const newSelection = new Set(selectedStudentIds);
      if (newSelection.has(student.id)) {
        newSelection.delete(student.id);
      } else {
        newSelection.add(student.id);
      }
      setSelectedStudentIds(newSelection);
    } else {
      router.push({ pathname: '/(tabs)/students/[studentId]', params: { studentId: student.id } });
    }
  }, [selectedStudentIds]);

  const handleStudentLongPress = useCallback((student: StudentEntity) => {
    const newSelection = new Set(selectedStudentIds);
    newSelection.add(student.id);
    setSelectedStudentIds(newSelection);
  }, [selectedStudentIds]);

  const handleClearSelection = useCallback(() => {
    setSelectedStudentIds(new Set());
  }, []);

  const handleDeleteSelected = useCallback(() => {
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDeleteSelected = useCallback(async () => {
    try {
      await deleteStudentsMutation.mutateAsync(Array.from(selectedStudentIds));
      setSelectedStudentIds(new Set());
      setDeleteDialogOpen(false);
    } catch {
      showToast({
        type: 'error',
        title: t('common.error'),
        message: t('common.error')
      });
    }
  }, [selectedStudentIds, deleteStudentsMutation, showToast, t]);

  const handleEditSelected = useCallback(() => {
    if (selectedStudentIds.size !== 1) return;
    const studentId = Array.from(selectedStudentIds)[0];
    setSelectedStudentIds(new Set());
    router.push({ pathname: '/(tabs)/students/edit', params: { studentId } });
  }, [selectedStudentIds]);

  const data = useMemo(
    () => studentListQuery.data?.pages.flatMap(page => page) ?? [],
    [studentListQuery.data]
  );

  const handleLoadMore = useCallback(() => {
    const currentCount = data.length;
    
    if (currentCount >= MAX_STUDENTS_LOADED) {
      showToast({
        type: 'info',
        title: t('students.max_loaded_title'),
        message: t('students.max_loaded_message', { count: MAX_STUDENTS_LOADED })
      });
      return;
    }
    
    if (hasScrolled.current && studentListQuery.hasNextPage && !studentListQuery.isFetchingNextPage) {
      studentListQuery.fetchNextPage();
    }
  }, [studentListQuery, data.length, showToast, t]);

  const handleScroll = useCallback(() => {
    hasScrolled.current = true;
  }, []);

  const handleRefresh = useCallback(async () => {
    hasScrolled.current = false;
    await studentListQuery.refetch();
  }, [studentListQuery]);

  useFocusEffect(
    useCallback(() => {
      hasScrolled.current = false;
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      }, 100);

      return () => {
        queryClient.removeQueries({ queryKey: studentQueryKeys.list('') });
        setQuery('');
        setSelectedStudentIds(new Set());
      };
    }, [queryClient])
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {selectedStudentIds.size > 0 ? (
        <SelectionToolbar
          count={selectedStudentIds.size}
          itemType="student"
          onClose={handleClearSelection}
          onDelete={handleDeleteSelected}
          onEdit={handleEditSelected}
        />
      ) : null}
      <ConfirmationDialog
        visible={isDeleteDialogOpen}
        title={t('common.delete')}
        message={t('students.delete_confirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleConfirmDeleteSelected}
        onCancel={() => setDeleteDialogOpen(false)}
        isConfirming={deleteStudentsMutation.isPending}
      />
      <View style={styles.container}>
        {selectedStudentIds.size === 0 ? (
          <ScreenHeader title={t('students.title')} titleIcon="account-multiple-outline" />
        ) : null}
        <SearchInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('common.search')}
        />
        {studentListQuery.isFetching && data.length === 0 ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={palette.primary} />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : (
          <StudentList
            data={data}
            isRefreshing={studentListQuery.isRefetching && !studentListQuery.isFetchingNextPage}
            isFetchingNextPage={studentListQuery.isFetchingNextPage}
            onRefresh={handleRefresh}
            onEndReached={handleLoadMore}
            onScroll={handleScroll}
            emptyTitle={t('students.empty')}
            emptySubtitle={t('students.empty_search')}
            onSelectStudent={handleStudentPress}
            onLongPressStudent={handleStudentLongPress}
            selectedStudentIds={selectedStudentIds}
            listRef={flatListRef}
          />
        )}
      </View>

      {selectedStudentIds.size === 0 ? (
        <Pressable
          style={styles.fab}
          onPress={() => router.push({ pathname: '/(tabs)/students/create' })}
          accessibilityRole="button"
          accessibilityLabel="Add student"
          accessibilityHint="Opens the form to add a new student"
          android_ripple={{ color: palette.primaryContainer, foreground: true }}>
          <MaterialCommunityIcons name="plus" size={28} color={palette.onPrimary} />
        </Pressable>
      ) : null}
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
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.bodyMedium,
    color: palette.onSurfaceVariant,
  },
});

export default StudentsScreen;
