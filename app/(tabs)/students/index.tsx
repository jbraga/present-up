import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { studentQueryKeys } from '@features/students/api/queryKeys';
import { useStudentList } from '@features/students/hooks/useStudentList';
import { useStudentService } from '@features/students/hooks/useStudentService';
import { StudentEntity } from '@features/students/types/student';
import { ConfirmationDialog } from '@shared/components/ConfirmationDialog';
import { ScreenHeader } from '@shared/components/ScreenHeader';
import { SearchInput } from '@shared/components/SearchInput';
import { SelectionToolbar } from '@shared/components/SelectionToolbar';
import { palette, shape, spacing, typography } from '@theme/tokens';


const MAX_STUDENTS_LOADED = 1000;
const STUDENT_ITEM_HEIGHT = 88;

type StudentCardProps = {
  item: StudentEntity;
  isSelected: boolean;
  selectionMode: boolean;
  onPress: (student: StudentEntity) => void;
  onLongPress: (student: StudentEntity) => void;
};

const StudentCard = memo(({ item, isSelected, selectionMode, onPress, onLongPress }: StudentCardProps) => {
  const fullName = item.firstName + ' ' + item.lastName;
  const initials = (item.firstName[0] + item.lastName[0]).toUpperCase();
  
  return (
    <Pressable
      style={[styles.studentCard, isSelected && styles.studentCardSelected]}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item)}
      android_ripple={{ color: palette.primaryContainer }}>
      <View style={styles.studentRow}>
        {isSelected ? (
          <View style={styles.avatarSelected}>
            <MaterialCommunityIcons name="check" size={22} color={palette.onPrimary} />
          </View>
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{fullName}</Text>
          <View style={styles.metaRows}>
            {item.email ? (
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="email-outline" size={12} color={palette.onSurfaceMuted} />
                <Text style={styles.studentMeta} numberOfLines={1}>{item.email}</Text>
              </View>
            ) : null}
            {item.guardianEmail ? (
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="account-child-outline" size={12} color={palette.onSurfaceMuted} />
                <Text style={styles.studentMeta} numberOfLines={1}>{item.guardianEmail}</Text>
              </View>
            ) : null}
            {item.phoneNumber ? (
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="phone-outline" size={12} color={palette.onSurfaceMuted} />
                <Text style={styles.studentMeta} numberOfLines={1}>{item.phoneNumber}</Text>
              </View>
            ) : null}
          </View>
        </View>
        {!selectionMode ? (
          <View style={styles.chevronContainer}>
            <MaterialCommunityIcons name="chevron-right" size={20} color={palette.onSurfaceMuted} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

StudentCard.displayName = 'StudentCard';

const StudentsScreen = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const hasScrolled = useRef(false);
  const flatListRef = useRef<FlatList>(null);

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
      Alert.alert(t('common.error'), t('common.error'));
    }
  }, [selectedStudentIds, deleteStudentsMutation, t]);

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
      Alert.alert(
        t('common.error'),
        t('common.search'),
        [{ text: t('common.done') }]
      );
      return;
    }
    
    if (hasScrolled.current && studentListQuery.hasNextPage && !studentListQuery.isFetchingNextPage) {
      studentListQuery.fetchNextPage();
    }
  }, [studentListQuery, data.length, t]);

  const handleScroll = useCallback(() => {
    hasScrolled.current = true;
  }, []);

  const handleRefresh = useCallback(async () => {
    hasScrolled.current = false;
    await studentListQuery.refetch();
  }, [studentListQuery]);

  const renderItem = useCallback(
    ({ item }: { item: StudentEntity }) => (
      <StudentCard
        item={item}
        isSelected={selectedStudentIds.has(item.id)}
        selectionMode={selectedStudentIds.size > 0}
        onPress={handleStudentPress}
        onLongPress={handleStudentLongPress}
      />
    ),
    [selectedStudentIds, handleStudentPress, handleStudentLongPress]
  );

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
          <FlatList
            ref={flatListRef}
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.studentList}
            onScroll={handleScroll}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.8}
            windowSize={5}
            maxToRenderPerBatch={10}
            initialNumToRender={10}
            removeClippedSubviews={true}
            refreshControl={
              <RefreshControl
                refreshing={studentListQuery.isRefetching && !studentListQuery.isFetchingNextPage}
                onRefresh={handleRefresh}
                colors={[palette.primary]}
                tintColor={palette.primary}
              />
            }
            getItemLayout={(data, index) => ({
              length: STUDENT_ITEM_HEIGHT,
              offset: STUDENT_ITEM_HEIGHT * index,
              index,
            })}
            ListFooterComponent={
              studentListQuery.isFetchingNextPage ? (
                <View style={styles.footerLoading}>
                  <ActivityIndicator color={palette.primary} />
                </View>
              ) : null
            }
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>{t('students.empty')}</Text>
                <Text style={styles.emptySubtitle}>{t('common.search')}</Text>
              </View>
            )}
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
  studentList: {
    gap: spacing.md,
    paddingBottom: 80,
  },
  footerLoading: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  studentCard: {
    borderRadius: shape.large,
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    backgroundColor: palette.surface,
    padding: spacing.lg,
    gap: spacing.xs,
    shadowColor: palette.shadow,
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  studentCardSelected: {
    backgroundColor: palette.surface,
    borderColor: palette.primary,
    borderWidth: 2,
    shadowColor: palette.primary,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
    ...typography.titleSmall,
    color: palette.primary,
    fontFamily: 'Lexend-Bold',
    fontWeight: '700',
  },
  studentInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  metaRows: {
    gap: spacing.xs,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  chevronContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentName: {
    ...typography.titleMedium,
    color: palette.onSurface,
    fontFamily: 'Lexend-SemiBold',
    fontWeight: '600',
  },
  studentMeta: {
    ...typography.bodySmall,
    color: palette.onSurfaceVariant,
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

export default StudentsScreen;
