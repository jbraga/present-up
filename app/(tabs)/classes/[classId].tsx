import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAttendanceSummary } from '@features/attendance/hooks/useAttendanceSummary';
import { AddStudentToClassDialog } from '@features/classes/components/AddStudentToClassDialog';
import { ClassStudentAttendanceRow } from '@features/classes/components/ClassStudentAttendanceRow';
import { useAssignStudentToClass } from '@features/classes/hooks/useAssignStudentToClass';
import { useClassList } from '@features/classes/hooks/useClassList';
import { useClassRoster } from '@features/classes/hooks/useClassRoster';
import { useUnassignStudentFromClass } from '@features/classes/hooks/useUnassignStudentFromClass';
import { useStudentsByIds } from '@features/students/hooks/useStudentsByIds';
import { FormIconHeader } from '@shared/components/FormIconHeader';
import { SearchInput } from '@shared/components/SearchInput';
import { SelectionToolbar } from '@shared/components/SelectionToolbar';

import { palette, spacing, typography } from '@theme/tokens';

const ClassDetailScreen = () => {
  const params = useLocalSearchParams<{ classId?: string | string[] }>();
  const classIdParam = params.classId;
  const classId = Array.isArray(classIdParam) ? classIdParam[0] : classIdParam ?? null;

  const [isAddStudentDialogOpen, setAddStudentDialogOpen] = useState(false);
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

  const handleDeleteSelected = async () => {
    if (!classId) return;
    const count = selectedStudentIds.size;
    const studentNames = students
      .filter(({ studentId }) => selectedStudentIds.has(studentId))
      .map(({ student }) => student ? `${student.firstName} ${student.lastName}` : 'Unknown student')
      .join(', ');
    
    Alert.alert(
      'Remove students from class',
      `Are you sure you want to remove ${count} student${count > 1 ? 's' : ''} from this class?\n\n${studentNames}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Unassign all selected students
              for (const studentId of selectedStudentIds) {
                await unassignStudentMutation.mutateAsync({ classId, studentId });
              }
              setSelectedStudentIds(new Set());
            } catch {
              Alert.alert('Error', 'Unable to remove students. Please try again.');
            }
          },
        },
      ]
    );
  };

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
      <Stack.Screen options={{ title: currentClass?.name }} />
      {selectedStudentIds.size > 0 ? (
        <SelectionToolbar
          count={selectedStudentIds.size}
          itemLabel="student"
          onClose={handleClearSelection}
          onDelete={handleDeleteSelected}
        />
      ) : null}
      {isLoading && !isRefetching ? (
        <View style={styles.centered}>
          <ActivityIndicator color={palette.primary} size="large" />
        </View>
      ) : null}
      {!isLoading && !currentClass ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="school" size={48} color={palette.onSurfaceMuted} />
          <Text style={styles.missingClassTitle}>Class not found</Text>
          <Text style={styles.missingClassSubtitle}>Go back to the class list to select a different one.</Text>
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
          <FormIconHeader
            icon="clipboard-text-outline"
            description={"Track attendance and manage\nyour enrolled students"}
          />
          <View style={styles.filterRow}>
            {atRiskCount > 0 ? (
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
                  {showAtRiskOnly ? 'Show all' : `${atRiskCount} below threshold`}
                </Text>
              </Pressable>
            ) : <View />}
            <View style={styles.enrolledPill}>
              <MaterialCommunityIcons name="account-group-outline" size={16} color={palette.primary} />
              <Text style={styles.enrolledPillText}>{capacityLabel}</Text>
            </View>
          </View>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search students..."
          />
          {students.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-multiple" size={48} color={palette.onSurfaceMuted} />
              <Text style={styles.emptyTitle}>No students assigned</Text>
              <Text style={styles.emptySubtitle}>Add students to this class to start viewing their attendance metrics.</Text>
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
            accessibilityLabel="Add student to class"
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
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  enrolledPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: palette.primaryContainer,
    borderWidth: 1,
    borderColor: 'rgba(28, 116, 233, 0.10)',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  enrolledPillText: {
    ...typography.labelLarge,
    color: palette.primary,
    fontFamily: 'Lexend-SemiBold',
    fontWeight: '600',
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
