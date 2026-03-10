import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAttendanceSummary } from '@features/attendance/hooks/useAttendanceSummary';
import { AddStudentToClassDialog } from '@features/classes/components/AddStudentToClassDialog';
import { ClassStudentAttendanceRow } from '@features/classes/components/ClassStudentAttendanceRow';
import { useAssignStudentToClass } from '@features/classes/hooks/useAssignStudentToClass';
import { useClassList } from '@features/classes/hooks/useClassList';
import { useClassRoster } from '@features/classes/hooks/useClassRoster';
import { useUnassignStudentFromClass } from '@features/classes/hooks/useUnassignStudentFromClass';
import { CLASS_SCHEDULE_DAYS } from '@features/classes/types/class';
import { useStudentsByIds } from '@features/students/hooks/useStudentsByIds';
import { ConfirmationDialog } from '@shared/components/ConfirmationDialog';
import { SearchInput } from '@shared/components/SearchInput';
import { SelectionToolbar } from '@shared/components/SelectionToolbar';

import { palette, shape, spacing, typography } from '@theme/tokens';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const ClassInfoRow = ({
  icon,
  value,
  fullWidth = false,
  numberOfLines = 1,
}: {
  icon: IconName;
  value: string;
  fullWidth?: boolean;
  numberOfLines?: number;
}) => (
  <View style={[styles.infoItem, fullWidth && styles.infoItemFullWidth]}>
    <View style={styles.infoIconContainer}>
      <MaterialCommunityIcons name={icon} size={20} color={palette.primary} />
    </View>
    <Text style={styles.infoValue} numberOfLines={numberOfLines} ellipsizeMode="tail">
      {value}
    </Text>
  </View>
);

const DAY_SHORT_KEY_BY_DAY: Record<(typeof CLASS_SCHEDULE_DAYS)[number], string> = {
  Monday: 'mon',
  Tuesday: 'tue',
  Wednesday: 'wed',
  Thursday: 'thu',
  Friday: 'fri',
};

const ClassDetailScreen = () => {
  const params = useLocalSearchParams<{ classId?: string | string[] }>();
  const { t } = useTranslation();
  const router = useRouter();
  const classIdParam = params.classId;
  const classId = Array.isArray(classIdParam) ? classIdParam[0] : classIdParam ?? null;

  const [isAddStudentDialogOpen, setAddStudentDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showAtRiskOnly, setShowAtRiskOnly] = useState(false);

  const classListQuery = useClassList();
  const assignStudentMutation = useAssignStudentToClass();
  const unassignStudentMutation = useUnassignStudentFromClass();
  const rosterQuery = useClassRoster(classId);
  const attendanceSummaryQuery = useAttendanceSummary(classId);

  const rosterStudentIds = useMemo(() => rosterQuery.data ?? [], [rosterQuery.data]);
  const studentsQuery = useStudentsByIds(rosterStudentIds);

  const currentClass = useMemo(() => {
    if (!classId) {
      return undefined;
    }
    return classListQuery.data?.find((classItem) => classItem.id === classId);
  }, [classId, classListQuery.data]);

  const summaryByStudentId = useMemo(() => {
    const map = new Map(attendanceSummaryQuery.data?.map((summary) => [summary.studentId, summary]));
    return map;
  }, [attendanceSummaryQuery.data]);

  const students = useMemo(() => {
    if (!classId) {
      return [];
    }

    const knownStudents = studentsQuery.data ?? [];
    const knownById = new Map(knownStudents.map((student) => [student.id, student]));

    return rosterStudentIds
      .map((studentId) => {
        const student = knownById.get(studentId) ?? null;
        return {
          student,
          studentId,
          summary: summaryByStudentId.get(studentId) ?? null,
        };
      })
      .sort((a, b) => {
        const nameA = a.student ? `${a.student.firstName} ${a.student.lastName}`.toLowerCase() : '';
        const nameB = b.student ? `${b.student.firstName} ${b.student.lastName}`.toLowerCase() : '';
        return nameA.localeCompare(nameB);
      });
  }, [classId, rosterStudentIds, studentsQuery.data, summaryByStudentId]);

  const isLoading =
    classListQuery.isLoading ||
    rosterQuery.isLoading ||
    attendanceSummaryQuery.isLoading ||
    studentsQuery.isLoading;

  const isRefetching =
    classListQuery.isRefetching ||
    rosterQuery.isRefetching ||
    attendanceSummaryQuery.isRefetching ||
    studentsQuery.isRefetching;

  const handleRefresh = async () => {
    await Promise.all([classListQuery.refetch(), rosterQuery.refetch(), attendanceSummaryQuery.refetch()]);
    await studentsQuery.refetch();
  };

  const handleAddStudent = async (studentId: string) => {
    if (!classId) return;
    await assignStudentMutation.mutateAsync({ classId, studentId });
  };

  const handleStudentPress = (studentId: string) => {
    if (selectedStudentIds.size > 0) {
      // In selection mode, toggle selection
      const newSelection = new Set(selectedStudentIds);
      if (newSelection.has(studentId)) {
        newSelection.delete(studentId);
      } else {
        newSelection.add(studentId);
      }
      setSelectedStudentIds(newSelection);
    }
  };

  const handleStudentLongPress = (studentId: string) => {
    const newSelection = new Set(selectedStudentIds);
    newSelection.add(studentId);
    setSelectedStudentIds(newSelection);
  };

  const handleClearSelection = () => {
    setSelectedStudentIds(new Set());
  };

  const handleDeleteSelected = () => {
    if (!classId) return;
    setRemoveDialogOpen(true);
  };

  const handleConfirmDeleteSelected = async () => {
    if (!classId) return;

    try {
      for (const studentId of selectedStudentIds) {
        await unassignStudentMutation.mutateAsync({ classId, studentId });
      }
      setSelectedStudentIds(new Set());
      setRemoveDialogOpen(false);
    } catch {
      Alert.alert(t('common.error'), t('common.error'));
    }
  };

  const selectedStudentNames = useMemo(() => {
    return students
      .filter(({ studentId }) => selectedStudentIds.has(studentId))
      .map(({ student }) => (student ? `${student.firstName} ${student.lastName}` : t('students.unknown')))
      .join(', ');
  }, [students, selectedStudentIds, t]);

  const capacityLabel = currentClass?.capacity
    ? `${rosterStudentIds.length} / ${currentClass.capacity}`
    : `${rosterStudentIds.length}`;

  const atRiskCount = useMemo(() => {
    if (!currentClass) return 0;
    return students.filter(({ summary }) => {
      if (!summary || summary.totalSessions === 0) return false;
      return summary.attendanceRate < currentClass.minAttendancePercentage;
    }).length;
  }, [students, currentClass]);

  const scheduleSummary = useMemo(() => {
    const schedule = currentClass?.schedule ?? [];
    if (!schedule.length) {
      return '—';
    }

    const dayOrder = new Map(CLASS_SCHEDULE_DAYS.map((day, index) => [day, index]));

    const formatted = [...schedule]
      .sort((a, b) => (dayOrder.get(a.dayOfWeek) ?? 0) - (dayOrder.get(b.dayOfWeek) ?? 0))
      .map((entry) => {
        const dayKey = DAY_SHORT_KEY_BY_DAY[entry.dayOfWeek];
        const dayLabel = t(`common.days_short.${dayKey}`);
        return `${dayLabel} ${entry.startTime}-${entry.endTime}`;
      });

    if (formatted.length <= 2) {
      return formatted.join(' · ');
    }

    return `${formatted.slice(0, 2).join(' · ')} · +${formatted.length - 2}`;
  }, [currentClass?.schedule, t]);

  const filteredStudents = useMemo(() => {
    let result = students;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(({ student }) => {
        if (!student) return false;
        const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
        return fullName.includes(q);
      });
    }
    if (showAtRiskOnly && currentClass) {
      result = result.filter(({ summary }) => {
        if (!summary || summary.totalSessions === 0) return false;
        return summary.attendanceRate < currentClass.minAttendancePercentage;
      });
    }
    return result;
  }, [students, searchQuery, showAtRiskOnly, currentClass]);

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <Stack.Screen
        options={{
          title: currentClass?.name,
          headerRight: () =>
            currentClass ? (
              <Pressable
                onPress={() => router.push({ pathname: '/(tabs)/classes/edit', params: { classId: currentClass.id } })}
                style={styles.headerButton}
                accessibilityRole="button"
                accessibilityLabel={t('classes.edit_class')}>
                <MaterialCommunityIcons name="pencil-outline" size={24} color={palette.onSurface} />
              </Pressable>
            ) : null,
        }}
      />
      {selectedStudentIds.size > 0 ? (
        <SelectionToolbar
          count={selectedStudentIds.size}
          itemType="student"
          onClose={handleClearSelection}
          onDelete={handleDeleteSelected}
        />
      ) : null}
      <ConfirmationDialog
        visible={isRemoveDialogOpen}
        title={t('classes.details.remove_title')}
        message={t('classes.details.remove_confirm', { count: selectedStudentIds.size, studentNames: selectedStudentNames })}
        confirmLabel={t('classes.details.remove')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleConfirmDeleteSelected}
        onCancel={() => setRemoveDialogOpen(false)}
        isConfirming={unassignStudentMutation.isPending}
      />
      {isLoading && !isRefetching ? (
        <View style={styles.centered}>
          <ActivityIndicator color={palette.primary} size="large" />
        </View>
      ) : null}
      {!isLoading && !currentClass ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="school" size={48} color={palette.onSurfaceMuted} />
          <Text style={styles.missingClassTitle}>{t('classes.details.not_found')}</Text>
          <Text style={styles.missingClassSubtitle}>{t('classes.details.not_found_subtitle')}</Text>
        </View>
      ) : null}
      {currentClass ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              colors={[palette.primary]}
              tintColor={palette.primary}
            />
          }
          keyboardShouldPersistTaps="handled">
          <View style={styles.infoCard}>
            <View style={styles.infoGrid}>
              <ClassInfoRow icon="account-tie-outline" value={currentClass.instructorName || '—'} />
              <ClassInfoRow icon="map-marker-outline" value={currentClass.location || '—'} />
              <ClassInfoRow icon="account-group-outline" value={capacityLabel} />
              <ClassInfoRow icon="percent-outline" value={`${Math.round(currentClass.minAttendancePercentage * 100)}%`} />
              <ClassInfoRow icon="clock-outline" value={scheduleSummary} fullWidth numberOfLines={2} />
            </View>
          </View>
          {atRiskCount > 0 ? (
            <View style={styles.filterRow}>
              <Pressable
                style={styles.filterLink}
                onPress={() => setShowAtRiskOnly((prev) => !prev)}
                accessibilityRole="button">
                <MaterialCommunityIcons
                  name={showAtRiskOnly ? 'filter-remove-outline' : 'alert-circle-outline'}
                  size={18}
                  color={showAtRiskOnly ? palette.primary : palette.error}
                />
                <Text style={[styles.filterText, showAtRiskOnly && styles.filterTextActive]}>
                  {showAtRiskOnly ? t('classes.details.show_all') : `${atRiskCount} ${t('classes.details.below_threshold')}`}
                </Text>
              </Pressable>
            </View>
          ) : null}
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('common.search')}
          />
          {students.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-multiple" size={48} color={palette.onSurfaceMuted} />
              <Text style={styles.emptyTitle}>{t('classes.details.empty_title')}</Text>
              <Text style={styles.emptySubtitle}>{t('classes.details.empty_subtitle')}</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {filteredStudents.map(({ student, summary, studentId }) => (
                <ClassStudentAttendanceRow
                  key={studentId}
                  student={student}
                  summary={summary}
                  minAttendancePercentage={currentClass.minAttendancePercentage}
                  isSelected={selectedStudentIds.has(studentId)}
                  selectionMode={selectedStudentIds.size > 0}
                  onPress={() => handleStudentPress(studentId)}
                  onLongPress={() => handleStudentLongPress(studentId)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      ) : null}
      {currentClass ? (
        <>
          <Pressable
            style={styles.fab}
            onPress={() => setAddStudentDialogOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={t('classes.details.add_student')}
            {...(Platform.OS === 'ios' ? { hitSlop: FAB_HIT_SLOP } : {})}>
            <MaterialCommunityIcons name="account-plus" size={28} color={palette.onPrimary} />
          </Pressable>
          <AddStudentToClassDialog
            visible={isAddStudentDialogOpen}
            className={currentClass?.name}
            onClose={() => setAddStudentDialogOpen(false)}
            onAddStudent={handleAddStudent}
            enrolledStudentIds={rosterStudentIds}
            isLoading={assignStudentMutation.isPending}
          />
        </>
      ) : null}
    </SafeAreaView>
  );
};

const FAB_HIT_SLOP = {
  top: spacing.sm,
  bottom: spacing.sm,
  left: spacing.sm,
  right: spacing.sm,
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  headerButton: {
    padding: spacing.sm,
    marginHorizontal: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: palette.surface,
    borderRadius: shape.medium,
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    padding: spacing.md,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
  },
  infoItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoItemFullWidth: {
    width: '100%',
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoValue: {
    ...typography.bodyMedium,
    color: palette.onSurface,
    fontFamily: 'Lexend-Regular',
    flex: 1,
  },
  filterLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  filterText: {
    ...typography.labelMedium,
    color: palette.error,
  },
  filterTextActive: {
    color: palette.primary,
  },
  listContainer: {
    gap: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.titleMedium,
    color: palette.onSurface,
    fontFamily: 'Lexend-Medium',
    fontWeight: '500',
  },
  emptySubtitle: {
    ...typography.bodyMedium,
    color: palette.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 280,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  missingClassTitle: {
    ...typography.titleMedium,
    color: palette.onSurface,
    fontFamily: 'Lexend-Medium',
    fontWeight: '500',
    textAlign: 'center',
  },
  missingClassSubtitle: {
    ...typography.bodyMedium,
    color: palette.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 280,
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
    elevation: 8,
    shadowColor: palette.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
  },
});

export default ClassDetailScreen;
