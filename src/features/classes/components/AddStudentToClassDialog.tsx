import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, ListRenderItemInfo, Pressable, StyleSheet, Text, View } from 'react-native';

import { useStudentSearch } from '@features/students/hooks/useStudentSearch';
import { StudentEntity } from '@features/students/types/student';
import { BottomSheet } from '@shared/components/BottomSheet';
import { SearchInput } from '@shared/components/SearchInput';
import { palette, spacing, typography } from '@theme/tokens';

export type AddStudentToClassDialogProps = {
  visible: boolean;
  className?: string;
  onClose: () => void;
  onAddStudent: (studentId: string) => void;
  enrolledStudentIds: string[];
  isLoading?: boolean;
};

export const AddStudentToClassDialog = ({
  visible,
  className,
  onClose,
  onAddStudent,
  enrolledStudentIds,
  isLoading,
}: AddStudentToClassDialogProps) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [addedStudentIds, setAddedStudentIds] = useState<Set<string>>(new Set());

  const searchQuery = useStudentSearch(query);

  const availableStudents = useMemo(() => {
    const allStudents = searchQuery.data ?? [];
    return allStudents.filter(
      (student) => !enrolledStudentIds.includes(student.id) && !addedStudentIds.has(student.id)
    );
  }, [searchQuery.data, enrolledStudentIds, addedStudentIds]);

  const handleAddStudent = (studentId: string) => {
    setAddedStudentIds((prev) => new Set([...prev, studentId]));
    onAddStudent(studentId);
  };

  const handleClose = () => {
    setQuery('');
    setAddedStudentIds(new Set());
    onClose();
  };

  const renderStudentItem = ({ item }: ListRenderItemInfo<StudentEntity>) => {
    const fullName = `${item.firstName} ${item.lastName}`;
    const initials = (item.firstName[0] + item.lastName[0]).toUpperCase();

    return (
      <View style={styles.studentRow}>
        <View style={styles.studentInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.studentDetails}>
            <Text style={styles.studentName}>{fullName}</Text>
            {item.email ? <Text style={styles.studentMeta}>{item.email}</Text> : null}
          </View>
        </View>
        <Pressable
          style={[styles.addButton, isLoading && styles.addButtonDisabled]}
          onPress={() => handleAddStudent(item.id)}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel={`Add ${fullName}`}>
          <Text style={styles.addButtonText}>{t('common.add')}</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <BottomSheet visible={visible} onClose={handleClose}>
      <View style={styles.header}>
        <View style={styles.headerTitles}>
          <Text style={styles.eyebrowLabel}>{t('classes.details.add_student').toUpperCase()}</Text>
          {className ? (
            <Text style={styles.title} numberOfLines={1}>{className}</Text>
          ) : null}
        </View>
      </View>

      <SearchInput
        value={query}
        onChangeText={setQuery}
        placeholder={t('common.search')}
      />

      {searchQuery.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : availableStudents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="account-off-outline" size={64} color={palette.onSurfaceVariant} />
          <Text style={styles.emptyTitle}>
            {query ? t('students.empty') : t('students.empty_search')}
          </Text>
          <Text style={styles.emptySubtitle}>
            {query
              ? t('students.empty_search')
              : t('classes.details.empty_title')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={availableStudents}
          keyExtractor={(item) => item.id}
          renderItem={renderStudentItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </BottomSheet>
  );
};


const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitles: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  eyebrowLabel: {
    ...typography.labelSmall,
    color: palette.primary,
    fontFamily: 'Lexend-Bold',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    ...typography.titleMedium,
    color: palette.onSurface,
    fontFamily: 'Lexend-Bold',
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: spacing.sm,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  studentInfo: {
    flex: 1,
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
  avatarText: {
    ...typography.titleSmall,
    color: palette.primary,
    fontFamily: 'Lexend-Bold',
    fontWeight: '700',
  },
  studentDetails: {
    flex: 1,
    gap: spacing.xs,
  },
  studentName: {
    ...typography.titleMedium,
    color: palette.onSurface,
    fontFamily: 'Lexend-Medium',
    fontWeight: '500',
  },
  studentMeta: {
    ...typography.bodySmall,
    color: palette.onSurfaceVariant,
  },
  addButton: {
    backgroundColor: palette.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 100,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    ...typography.labelMedium,
    color: palette.onPrimary,
    fontFamily: 'Lexend-Bold',
    fontWeight: '700',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.outlineVariant,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  loadingText: {
    ...typography.bodyMedium,
    color: palette.onSurfaceVariant,
  },
  emptyContainer: {
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
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.bodyMedium,
    color: palette.onSurfaceVariant,
    textAlign: 'center',
  },
});
