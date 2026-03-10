import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_VALUES } from '@core/constants/attendance';
import { logger } from '@core/utils/logger';

import { LOCAL_PROFILE } from '@core/constants/profile';
import { attendanceQueryKeys } from '@features/attendance/api/queryKeys';
import { useAttendanceRecords } from '@features/attendance/hooks/useAttendanceRecords';
import { useAttendanceService } from '@features/attendance/hooks/useAttendanceService';
import { useClassRoster } from '@features/classes/hooks/useClassRoster';
import { useStudentsByIds } from '@features/students/hooks/useStudentsByIds';
import { StudentEntity } from '@features/students/types/student';
import { BottomSheet } from '@shared/components/BottomSheet';
import { SearchInput } from '@shared/components/SearchInput';
import { palette, shape, spacing, typography } from '@theme/tokens';

type StudentAttendanceState = {
  studentId: string;
  status: (typeof ATTENDANCE_STATUS_VALUES)[number];
  notes: string;
};

type RecordAttendanceDialogProps = {
  visible: boolean;
  classId: string;
  className?: string;
  date?: Date;
  initialStudents?: StudentEntity[];
  onClose: () => void;
  onRecorded?: () => void;
};

export const RecordAttendanceDialog = ({
  visible,
  classId,
  className,
  date,
  initialStudents,
  onClose,
  onRecorded,
}: RecordAttendanceDialogProps) => {
  const { t, i18n } = useTranslation();
  const [attendanceStates, setAttendanceStates] = useState<Record<string, StudentAttendanceState>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [rosterSearch, setRosterSearch] = useState('');

  const hasInitialStudents = Boolean(initialStudents && initialStudents.length > 0);
  const classRosterQuery = useClassRoster(hasInitialStudents ? null : (classId || null));
  const studentIds = classRosterQuery.data ?? [];
  const studentsQuery = useStudentsByIds(hasInitialStudents ? [] : studentIds);
  const students = useMemo(() => {
    if (hasInitialStudents) {
      return initialStudents ?? [];
    }

    return studentsQuery.data ?? [];
  }, [hasInitialStudents, initialStudents, studentsQuery.data]);
  const attendanceRecordsQuery = useAttendanceRecords(classId || null);

  const attendanceService = useAttendanceService();
  const queryClient = useQueryClient();

  const resetState = () => {
    setAttendanceStates({});
    setIsSaving(false);
    setRosterSearch('');
  };

  const targetDate = useMemo(() => {
    if (date) return date;
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  }, [date]);

  const dateFormatted = useMemo(() => {
    return new Intl.DateTimeFormat(i18n.language || 'en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(targetDate);
  }, [targetDate, i18n.language]);

  const filteredStudents = useMemo(() => {
    if (!rosterSearch.trim()) return students;
    const q = rosterSearch.toLowerCase();
    return students.filter(
      (s) =>
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q),
    );
  }, [students, rosterSearch]);

  const targetDateKey = useMemo(() => {
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [targetDate]);

  const existingRecords = useMemo(() => {
    if (!attendanceRecordsQuery.data) return [];
    return attendanceRecordsQuery.data.filter((record) => {
      const recordDate = new Date(record.date);
      const year = recordDate.getFullYear();
      const month = String(recordDate.getMonth() + 1).padStart(2, '0');
      const day = String(recordDate.getDate()).padStart(2, '0');
      const recordKey = `${year}-${month}-${day}`;
      return recordKey === targetDateKey;
    });
  }, [attendanceRecordsQuery.data, targetDateKey]);

  useEffect(() => {
    if (!visible) {
      resetState();
    }
  }, [visible]);

  // Initialize states with existing attendance or 'present' for all enrolled students
  useEffect(() => {
    if (visible && students.length > 0) {
      const initialStates: Record<string, StudentAttendanceState> = {};
      
      // Create a map of existing records by student ID
      const existingRecordsMap = new Map(
        existingRecords.map(record => [record.studentId, record])
      );
      
      students.forEach((student) => {
        const existingRecord = existingRecordsMap.get(student.id);
        initialStates[student.id] = {
          studentId: student.id,
          status: existingRecord?.status || ATTENDANCE_STATUS.present,
          notes: existingRecord?.notes || '',
        };
      });
      
      setAttendanceStates(initialStates);
    }
  }, [visible, students, existingRecords]);

  const handleStatusChange = (studentId: string, status: (typeof ATTENDANCE_STATUS_VALUES)[number]) => {
    setAttendanceStates((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId]!,
        status,
      },
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendanceStates((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId]!,
        notes,
      },
    }));
  };

  const handleSaveAll = async () => {

    try {
      setIsSaving(true);
      
      await Promise.all(
        Object.values(attendanceStates).map((state) =>
          attendanceService.recordAttendance({
            classId,
            studentId: state.studentId,
            date: targetDate,
            status: state.status,
            notes: state.notes.trim() || undefined,
            instructorEmail: LOCAL_PROFILE.email,
          }),
        ),
      );

      // Invalidate caches - parent will handle refetching through onRecorded callback
      await queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.records(classId) });
      await queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.summary(classId) });

      // Trigger parent's refetch callback BEFORE closing
      if (onRecorded) {
        await onRecorded();
      }

      onClose();
    } catch (error) {
      logger.error('Failed to save attendance records', { error });
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = hasInitialStudents ? false : (classRosterQuery.isLoading || studentsQuery.isLoading);
  const hasStudents = students.length > 0;

  const statusDotColor = (status: (typeof ATTENDANCE_STATUS_VALUES)[number]) => {
    if (status === ATTENDANCE_STATUS.present) return palette.success;
    if (status === ATTENDANCE_STATUS.absent) return palette.error;
    if (status === ATTENDANCE_STATUS.excused) return palette.warning;
    return palette.surfaceDim;
  };

  const renderStudentCard = ({ item }: { item: StudentEntity }) => {
    const state = attendanceStates[item.id];
    if (!state) return null;

    const showNotes = state.status === ATTENDANCE_STATUS.absent || state.status === ATTENDANCE_STATUS.excused;
    const initials = (item.firstName[0] + item.lastName[0]).toUpperCase();
    const isAbsent = state.status === ATTENDANCE_STATUS.absent;
    const isExcused = state.status === ATTENDANCE_STATUS.excused;
    const cardBorderColor = isAbsent
      ? palette.errorContainer
      : isExcused
        ? palette.warningContainer
        : palette.outlineVariant;

    return (
      <View style={[styles.studentCard, { borderColor: cardBorderColor }]}>
        <View style={styles.studentHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: statusDotColor(state.status) }]} />
          </View>
          <View style={styles.studentMeta}>
            <Text style={styles.studentName} numberOfLines={1}>
              {item.firstName} {item.lastName}
            </Text>
          </View>
        </View>

        <View style={styles.statusGrid}>
          <Pressable
            style={[
              styles.statusPill,
              state.status === ATTENDANCE_STATUS.present ? styles.statusPillPresentActive : styles.statusPillInactive,
            ]}
            onPress={() => handleStatusChange(item.id, ATTENDANCE_STATUS.present)}>
            {state.status === ATTENDANCE_STATUS.present ? (
              <MaterialCommunityIcons name="check-circle" size={14} color={palette.onSuccess} />
            ) : null}
            <Text
              style={[
                styles.statusPillLabel,
                state.status === ATTENDANCE_STATUS.present ? styles.statusPillLabelActive : styles.statusPillLabelInactive,
              ]}>
              {t('attendance.mark_present')}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.statusPill,
              state.status === ATTENDANCE_STATUS.absent ? styles.statusPillAbsentActive : styles.statusPillInactive,
            ]}
            onPress={() => handleStatusChange(item.id, ATTENDANCE_STATUS.absent)}>
            {state.status === ATTENDANCE_STATUS.absent ? (
              <MaterialCommunityIcons name="close-circle" size={14} color={palette.onError} />
            ) : null}
            <Text
              style={[
                styles.statusPillLabel,
                state.status === ATTENDANCE_STATUS.absent ? styles.statusPillLabelActive : styles.statusPillLabelInactive,
              ]}>
              {t('attendance.mark_absent')}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.statusPill,
              state.status === ATTENDANCE_STATUS.excused ? styles.statusPillExcusedActive : styles.statusPillInactive,
            ]}
            onPress={() => handleStatusChange(item.id, ATTENDANCE_STATUS.excused)}>
            {state.status === ATTENDANCE_STATUS.excused ? (
              <MaterialCommunityIcons name="information" size={14} color={palette.onWarning} />
            ) : null}
            <Text
              style={[
                styles.statusPillLabel,
                state.status === ATTENDANCE_STATUS.excused ? styles.statusPillLabelActive : styles.statusPillLabelInactive,
              ]}>
              {t('attendance.mark_excused')}
            </Text>
          </Pressable>
        </View>

        {showNotes ? (
          <TextInput
            style={[
              styles.notesInput,
              isAbsent && styles.notesInputAbsent,
              isExcused && styles.notesInputExcused,
            ]}
            placeholder={
              isAbsent
                ? t('attendance.record_dialog.note_placeholder_absent')
                : t('attendance.record_dialog.note_placeholder_excused')
            }
            placeholderTextColor={palette.onSurfaceVariant}
            value={state.notes}
            onChangeText={(text) => handleNotesChange(item.id, text)}
            maxLength={200}
          />
        ) : null}
      </View>
    );
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>

          <View style={styles.headerRow}>
            <View style={styles.headerTitles}>
              <Text style={styles.className} numberOfLines={1}>{className || t('attendance.record_dialog.title')}</Text>
            </View>
          </View>

          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>{dateFormatted}</Text>
            <View style={styles.registeredBadge}>
              <MaterialCommunityIcons name="account-group" size={14} color={palette.primary} />
              <Text style={styles.registeredText}>{students.length} {t('report.enrolled')}</Text>
            </View>
          </View>

          {hasStudents ? (
            <SearchInput
              value={rosterSearch}
              onChangeText={setRosterSearch}
              placeholder={t('common.search')}
            />
          ) : null}

          {isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={palette.primary} size="large" />
              <Text style={styles.centerStateText}>{t('attendance.loading_data')}</Text>
            </View>
          ) : !hasStudents ? (
            <View style={styles.centerState}>
              <MaterialCommunityIcons name="account-off-outline" size={48} color={palette.onSurfaceMuted} />
              <Text style={styles.centerStateTitle}>{t('classes.details.empty_title')}</Text>
              <Text style={styles.centerStateText}>{t('classes.details.empty_subtitle')}</Text>
            </View>
          ) : (
            <FlatList
              data={filteredStudents}
              keyExtractor={(item) => item.id}
              renderItem={renderStudentCard}
              style={styles.studentList}
              contentContainerStyle={styles.studentListContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              bounces
            />
          )}

          <Pressable
            style={[
              styles.submitButton,
              (isSaving || !hasStudents) && styles.submitButtonDisabled,
            ]}
            onPress={handleSaveAll}
            disabled={isSaving || !hasStudents}>
            {isSaving ? (
              <ActivityIndicator color={palette.onPrimary} />
            ) : (
              <>
                <MaterialCommunityIcons name="cloud-upload" size={20} color={palette.onPrimary} />
                <Text style={styles.submitButtonText}>{t('attendance.record_dialog.save')}</Text>
              </>
            )}
          </Pressable>
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
  studentList: {
    maxHeight: Dimensions.get('window').height * 0.45,
  },
  studentListContent: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  studentCard: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    gap: spacing.md,
    shadowColor: palette.shadow,
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: 'Lexend-Bold',
    fontWeight: '700',
    color: palette.primary,
  },
  statusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: palette.surface,
  },
  studentMeta: {
    flex: 1,
  },
  studentName: {
    ...typography.bodyLarge,
    color: palette.onSurface,
    fontFamily: 'Lexend-Bold',
    fontWeight: '700',
  },
  statusGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: shape.medium,
  },
  statusPillInactive: {
    backgroundColor: palette.surfaceContainerHighest,
  },
  statusPillPresentActive: {
    backgroundColor: palette.primary,
    shadowColor: palette.primary,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  statusPillAbsentActive: {
    backgroundColor: palette.error,
    shadowColor: palette.error,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  statusPillExcusedActive: {
    backgroundColor: palette.warning,
    shadowColor: palette.warning,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  statusPillLabel: {
    ...typography.labelSmall,
    fontFamily: 'Lexend-SemiBold',
    fontWeight: '600',
  },
  statusPillLabelActive: {
    color: '#FFFFFF',
  },
  statusPillLabelInactive: {
    color: palette.onSurfaceVariant,
  },
  notesInput: {
    borderRadius: shape.medium,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.bodySmall,
    color: palette.onSurface,
    fontFamily: 'Lexend-Regular',
    height: 44,
  },
  notesInputAbsent: {
    backgroundColor: palette.errorContainer,
  },
  notesInputExcused: {
    backgroundColor: palette.warningContainer,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: palette.primary,
    paddingVertical: spacing.md,
    borderRadius: 100,
    shadowColor: palette.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  submitButtonText: {
    ...typography.labelLarge,
    color: palette.onPrimary,
    fontFamily: 'Lexend-Bold',
    fontWeight: '700',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
});
