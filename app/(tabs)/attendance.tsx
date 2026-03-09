import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AttendanceTimelineCard } from '@features/attendance/components/AttendanceTimelineCard';
import { MonthlyClassRosterDialog } from '@features/attendance/components/MonthlyClassRosterDialog';
import { MonthlyClassSummaryCard } from '@features/attendance/components/MonthlyClassSummaryCard';
import { RecordAttendanceDialog } from '@features/attendance/components/RecordAttendanceDialog';
import { useDailyTimeline } from '@features/attendance/hooks/useDailyTimeline';
import { useGenerateReport } from '@features/attendance/hooks/useGenerateReport';
import { useMonthlyAttendance } from '@features/attendance/hooks/useMonthlyAttendance';
import { useStudentsByIds } from '@features/students/hooks/useStudentsByIds';
import { StudentEntity } from '@features/students/types/student';
import { ScreenHeader } from '@shared/components/ScreenHeader';
import { SearchInput } from '@shared/components/SearchInput';
import { palette, shape, spacing, typography } from '@theme/tokens';

const AttendanceScreen = () => {
  const { width: screenWidth } = useWindowDimensions();
  const dayPickerRef = useRef<ScrollView>(null);
  const monthPickerRef = useRef<ScrollView>(null);
  const [dayPickerViewportWidth, setDayPickerViewportWidth] = useState(0);
  const [monthPickerViewportWidth, setMonthPickerViewportWidth] = useState(0);

  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  
  // Day View State
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => getWeekStart(new Date()));
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() => dateKey(new Date()));
  const [dialogClassId, setDialogClassId] = useState<string | null>(null);
  const [dialogClassName, setDialogClassName] = useState('');
  const [dialogStudentIds, setDialogStudentIds] = useState<string[]>([]);
  
  // Month View State
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [rosterDialogClassId, setRosterDialogClassId] = useState<string | null>(null);
  const [rosterSearchQuery, setRosterSearchQuery] = useState('');
  
  // Shared State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setSearchVisible] = useState(false);
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [isReportClassModalOpen, setReportClassModalOpen] = useState(false);
  const [selectedReportClassIds, setSelectedReportClassIds] = useState<string[]>([]);

  const selectedDate = useMemo(() => parseDateKey(selectedDateKey), [selectedDateKey]);
  const timeline = useDailyTimeline(selectedDate);
  const monthlyData = useMonthlyAttendance(selectedMonth);
  const { generateMonthlyReport, isGeneratingReport } = useGenerateReport();

  const allStudentIds = useMemo(() => {
    const ids = new Set<string>();
    timeline.entries.forEach((entry) => {
      entry.studentIds.forEach((id) => ids.add(id));
    });
    monthlyData.entries.forEach((entry) => {
      entry.studentIds.forEach((id) => ids.add(id));
    });
    return Array.from(ids);
  }, [timeline.entries, monthlyData.entries]);

  const studentsQuery = useStudentsByIds(allStudentIds);
  const studentLookup = useMemo(() => {
    const lookup: Record<string, StudentEntity> = {};
    if (studentsQuery.data) {
      for (const student of studentsQuery.data) {
        lookup[student.id] = student;
      }
    }
    return lookup;
  }, [studentsQuery.data]);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return timeline.entries;
    const q = searchQuery.toLowerCase();
    return timeline.entries.filter(
      (entry) =>
        entry.className.toLowerCase().includes(q) ||
        entry.instructorName.toLowerCase().includes(q),
    );
  }, [timeline.entries, searchQuery]);

  const filteredMonthlyEntries = useMemo(() => {
    if (!searchQuery.trim()) return monthlyData.entries;
    const q = searchQuery.toLowerCase();
    return monthlyData.entries.filter(
      (entry) =>
        entry.className.toLowerCase().includes(q) ||
        entry.instructorName.toLowerCase().includes(q),
    );
  }, [monthlyData.entries, searchQuery]);

  const reportClassOptions = useMemo(
    () => [...monthlyData.entries].sort((a, b) => a.className.localeCompare(b.className)),
    [monthlyData.entries],
  );

  const weekDays = useMemo(() => buildWeekDays(selectedWeekStart), [selectedWeekStart]);
  const todayKey = useMemo(() => dateKey(new Date()), []);
  const currentMonthKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}`;
  }, []);

  const isViewingCurrentWeek = todayKey >= dateKey(selectedWeekStart) && todayKey <= dateKey(addDays(selectedWeekStart, 6));

  const handleDayPress = (key: string) => {
    setSelectedDateKey(key);
  };

  const handleGoToToday = useCallback(() => {
    const today = new Date();
    setSelectedDateKey(dateKey(today));
    setSelectedWeekStart(getWeekStart(today));
  }, []);

  const handleGoToCurrentMonth = useCallback(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    setSelectedMonth(d);
  }, []);

  const handleCardPress = (classId: string) => {
    const entry = timeline.entries.find((e) => e.classId === classId);
    setDialogClassName(entry?.className ?? '');
    setDialogStudentIds(entry?.studentIds ?? []);
    setDialogClassId(classId);
  };

  const handleMonthlyCardPress = (classId: string) => {
    setRosterDialogClassId(classId);
    setRosterSearchQuery('');
  };

  const handleRefresh = () => {
    if (viewMode === 'day') {
      timeline.refetch();
    } else {
      monthlyData.refetch();
    }
  };

  const handleToggleSearch = useCallback(() => {
    setSearchVisible((prev) => {
      if (prev) setSearchQuery('');
      return !prev;
    });
  }, []);

  const handleCalendarDateSelect = useCallback((key: string) => {
    setSelectedDateKey(key);
    setSelectedWeekStart(getWeekStart(parseDateKey(key)));
    setCalendarOpen(false);
  }, []);

  const handleOpenReportClassModal = useCallback(() => {
    if (isGeneratingReport) {
      return;
    }

    if (monthlyData.isLoading) {
      Alert.alert('Report not ready', 'Please wait until the monthly attendance data is loaded.');
      return;
    }

    if (monthlyData.entries.length === 0) {
      Alert.alert('No data', 'There are no attendance records available for this month.');
      return;
    }

    setSelectedReportClassIds(monthlyData.entries.map((entry) => entry.classId));
    setReportClassModalOpen(true);
  }, [isGeneratingReport, monthlyData.entries, monthlyData.isLoading]);

  const handleToggleReportClass = useCallback((classId: string) => {
    setSelectedReportClassIds((previousIds) => {
      if (previousIds.includes(classId)) {
        return previousIds.filter((id) => id !== classId);
      }

      return [...previousIds, classId];
    });
  }, []);

  const handleSelectAllReportClasses = useCallback(() => {
    setSelectedReportClassIds(monthlyData.entries.map((entry) => entry.classId));
  }, [monthlyData.entries]);

  const handleClearReportClasses = useCallback(() => {
    setSelectedReportClassIds([]);
  }, []);

  const handleGenerateReport = useCallback(async (outputMode: 'download' | 'share') => {
    if (isGeneratingReport) {
      return;
    }

    if (monthlyData.isLoading) {
      Alert.alert('Report not ready', 'Please wait until the monthly attendance data is loaded.');
      return;
    }

    if (monthlyData.entries.length === 0) {
      Alert.alert('No data', 'There are no attendance records available for this month.');
      return;
    }

    const selectedEntries = monthlyData.entries.filter((entry) => selectedReportClassIds.includes(entry.classId));
    if (selectedEntries.length === 0) {
      Alert.alert('Select classes', 'Choose at least one class to include in the report.');
      return;
    }

    try {
      const reportUri = await generateMonthlyReport({
        selectedMonth,
        entries: selectedEntries,
        studentLookup,
        outputMode,
      });
      setReportClassModalOpen(false);

      if (outputMode === 'download' && reportUri) {
        Alert.alert('Report downloaded', 'The PDF report was generated and saved on your device.');
      }
    } catch {
      Alert.alert('Report generation failed', 'Unable to generate the monthly PDF report. Please try again.');
    }
  }, [
    generateMonthlyReport,
    isGeneratingReport,
    monthlyData.entries,
    monthlyData.isLoading,
    selectedReportClassIds,
    selectedMonth,
    studentLookup,
  ]);

  const headerActions = useMemo(
    () => [
      { icon: 'magnify' as const, label: 'Search', onPress: handleToggleSearch },
      ...(viewMode === 'month'
        ? [{ icon: 'file-chart-outline' as const, label: 'Generate report', onPress: handleOpenReportClassModal }]
        : [{ icon: 'calendar' as const, label: 'Calendar', onPress: () => setCalendarOpen(true) }]),
    ],
    [handleOpenReportClassModal, handleToggleSearch, viewMode],
  );

  const monthOptions = useMemo(() => {
    const options: Date[] = [];
    // Show 6 months before and 6 months after the selected month
    for (let i = -6; i <= 6; i++) {
      const d = new Date(selectedMonth);
      d.setMonth(d.getMonth() + i);
      options.push(d);
    }
    return options;
  }, [selectedMonth]);

  const pickerDimensions = useMemo(() => {
    const itemWidth = Number(StyleSheet.flatten(styles.dayPickerItem).width ?? 56);
    const navWidth = Number(StyleSheet.flatten(styles.dayPickerNav).width ?? 32);
    const gap = Number(StyleSheet.flatten(styles.dayPickerContent).gap ?? spacing.md);

    return { itemWidth, navWidth, gap };
  }, []);

  const handleDayPickerLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    setDayPickerViewportWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth));
  }, []);

  const handleMonthPickerLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    setMonthPickerViewportWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth));
  }, []);

  const scrollPickerToSelectedIndex = useCallback(({
    ref,
    selectedIndex,
    viewportWidth,
  }: {
    ref: React.RefObject<ScrollView | null>;
    selectedIndex: number;
    viewportWidth: number;
  }) => {
    if (selectedIndex < 0) {
      return;
    }

    const effectiveViewportWidth = viewportWidth > 0 ? viewportWidth : screenWidth;
    const { itemWidth, navWidth, gap } = pickerDimensions;
    const itemCenterX = navWidth + gap + selectedIndex * (itemWidth + gap) + itemWidth / 2;
    const targetX = Math.max(0, itemCenterX - effectiveViewportWidth / 2);

    ref.current?.scrollTo({ x: targetX, animated: false });
  }, [pickerDimensions, screenWidth]);

  useEffect(() => {
    if (viewMode !== 'day') {
      return;
    }

    const selectedDayIndex = weekDays.findIndex((day) => dateKey(day) === selectedDateKey);
    requestAnimationFrame(() => {
      scrollPickerToSelectedIndex({
        ref: dayPickerRef,
        selectedIndex: selectedDayIndex,
        viewportWidth: dayPickerViewportWidth,
      });
    });
  }, [dayPickerViewportWidth, scrollPickerToSelectedIndex, selectedDateKey, viewMode, weekDays]);

  useEffect(() => {
    if (viewMode !== 'month') {
      return;
    }

    const selectedMonthIndex = monthOptions.findIndex(
      (monthDate) =>
        monthDate.getFullYear() === selectedMonth.getFullYear() && monthDate.getMonth() === selectedMonth.getMonth(),
    );

    requestAnimationFrame(() => {
      scrollPickerToSelectedIndex({
        ref: monthPickerRef,
        selectedIndex: selectedMonthIndex,
        viewportWidth: monthPickerViewportWidth,
      });
    });
  }, [monthOptions, monthPickerViewportWidth, scrollPickerToSelectedIndex, selectedMonth, viewMode]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <ScreenHeader
          title="Attendance"
          actions={headerActions}
        />

        {isGeneratingReport ? (
          <View style={styles.reportStatusContainer}>
            <ActivityIndicator size="small" color={palette.primary} />
            <Text style={styles.reportStatusText}>Generating monthly report PDF...</Text>
          </View>
        ) : null}

        <View style={styles.toggleContainer}>
          <Pressable
            style={[styles.toggleButton, viewMode === 'day' && styles.toggleButtonActive]}
            onPress={() => setViewMode('day')}>
            <Text style={[styles.toggleText, viewMode === 'day' && styles.toggleTextActive]}>Day</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleButton, viewMode === 'month' && styles.toggleButtonActive]}
            onPress={() => setViewMode('month')}>
            <Text style={[styles.toggleText, viewMode === 'month' && styles.toggleTextActive]}>Month</Text>
          </Pressable>
        </View>

        {isSearchVisible ? (
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search classes or instructors..."
          />
        ) : null}

        {viewMode === 'day' ? (
          <>
            <ScrollView
              ref={dayPickerRef}
              onLayout={handleDayPickerLayout}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayPickerContent}
              style={styles.dayPickerStrip}>
              <Pressable
                style={styles.dayPickerNav}
                onPress={() => setSelectedWeekStart(addDays(selectedWeekStart, -7))}
                accessibilityRole="button"
                accessibilityLabel="Previous week">
                <MaterialCommunityIcons name="chevron-left" size={20} color={palette.onSurfaceVariant} />
              </Pressable>
              {weekDays.map((day) => {
                const key = dateKey(day);
                const isSelected = selectedDateKey === key;
                const isToday = todayKey === key;
                return (
                  <Pressable
                    key={key}
                    style={[styles.dayPickerItem, isSelected && styles.dayPickerItemSelected]}
                    onPress={() => handleDayPress(key)}
                    accessibilityRole="button">
                    <Text style={[styles.dayPickerDayName, isSelected && styles.dayPickerDayNameSelected]}>
                      {DAY_NAMES[day.getDay()]}
                    </Text>
                    <Text style={[styles.dayPickerDate, isSelected && styles.dayPickerDateSelected]}>
                      {day.getDate()}
                    </Text>
                    {isToday && !isSelected ? <View style={styles.dayPickerTodayDot} /> : null}
                  </Pressable>
                );
              })}
              <Pressable
                style={styles.dayPickerNav}
                onPress={() => setSelectedWeekStart(addDays(selectedWeekStart, 7))}
                accessibilityRole="button"
                accessibilityLabel="Next week">
                <MaterialCommunityIcons name="chevron-right" size={20} color={palette.onSurfaceVariant} />
              </Pressable>
            </ScrollView>

            {!isViewingCurrentWeek || selectedDateKey !== todayKey ? (
              <Pressable style={styles.todayPill} onPress={handleGoToToday} accessibilityRole="button">
                <MaterialCommunityIcons name="calendar-today" size={14} color={palette.primary} />
                <Text style={styles.todayPillText}>Today</Text>
              </Pressable>
            ) : null}
          </>
        ) : (
          <>
            <ScrollView
              ref={monthPickerRef}
              onLayout={handleMonthPickerLayout}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayPickerContent}
              style={styles.dayPickerStrip}>
              <Pressable
                style={styles.dayPickerNav}
                onPress={() => {
                  const d = new Date(selectedMonth);
                  d.setFullYear(d.getFullYear() - 1);
                  setSelectedMonth(d);
                }}
                accessibilityRole="button"
                accessibilityLabel="Previous year">
                <MaterialCommunityIcons name="chevron-double-left" size={20} color={palette.onSurfaceVariant} />
              </Pressable>
              {monthOptions.map((monthDate) => {
                const key = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
                const isSelected = selectedMonth.getFullYear() === monthDate.getFullYear() && selectedMonth.getMonth() === monthDate.getMonth();
                const isCurrentMonth = currentMonthKey === key;
                return (
                  <Pressable
                    key={key}
                    style={[styles.dayPickerItem, isSelected && styles.dayPickerItemSelected]}
                    onPress={() => setSelectedMonth(monthDate)}
                    accessibilityRole="button">
                    <Text style={[styles.dayPickerDayName, isSelected && styles.dayPickerDayNameSelected]}>
                      {monthDate.getFullYear().toString().slice(-2)}
                    </Text>
                    <Text style={[styles.dayPickerDate, isSelected && styles.dayPickerDateSelected]}>
                      {MONTH_NAMES[monthDate.getMonth()]}
                    </Text>
                    {isCurrentMonth && !isSelected ? <View style={styles.dayPickerTodayDot} /> : null}
                  </Pressable>
                );
              })}
              <Pressable
                style={styles.dayPickerNav}
                onPress={() => {
                  const d = new Date(selectedMonth);
                  d.setFullYear(d.getFullYear() + 1);
                  setSelectedMonth(d);
                }}
                accessibilityRole="button"
                accessibilityLabel="Next year">
                <MaterialCommunityIcons name="chevron-double-right" size={20} color={palette.onSurfaceVariant} />
              </Pressable>
            </ScrollView>

            {currentMonthKey !== `${selectedMonth.getFullYear()}-${selectedMonth.getMonth()}` ? (
              <Pressable style={styles.todayPill} onPress={handleGoToCurrentMonth} accessibilityRole="button">
                <MaterialCommunityIcons name="calendar-month" size={14} color={palette.primary} />
                <Text style={styles.todayPillText}>Current Month</Text>
              </Pressable>
            ) : null}
          </>
        )}

        <ScrollView
          style={styles.timelineScroll}
          contentContainerStyle={styles.timelineContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={handleRefresh}
              tintColor={palette.primary}
            />
          }>
          {viewMode === 'day' ? (
            timeline.isLoading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator color={palette.primary} />
                <Text style={styles.loadingText}>Loading attendance data…</Text>
              </View>
            ) : timeline.isError ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="alert-circle-outline" size={48} color={palette.error} />
                <Text style={styles.emptyTitle}>Failed to load attendance</Text>
                <Text style={styles.emptySubtitle}>Pull down to try again.</Text>
              </View>
            ) : filteredEntries.length > 0 ? (
              <View style={styles.timelineContainer}>
                <View style={styles.timelineLine} />
                {filteredEntries.map((entry) => (
                  <View key={entry.classId} style={styles.timelineEntryWrapper}>
                    <AttendanceTimelineCard
                      entry={entry}
                      studentLookup={studentLookup}
                      onPress={handleCardPress}
                    />
                  </View>
                ))}
              </View>
            ) : searchQuery.trim() ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="magnify" size={48} color={palette.onSurfaceMuted} />
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptySubtitle}>Try a different search term.</Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="calendar-blank-outline" size={48} color={palette.onSurfaceMuted} />
                <Text style={styles.emptyTitle}>No classes scheduled</Text>
                <Text style={styles.emptySubtitle}>There are no classes scheduled for this day.</Text>
              </View>
            )
          ) : (
            monthlyData.isLoading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator color={palette.primary} />
                <Text style={styles.loadingText}>Loading monthly data…</Text>
              </View>
            ) : monthlyData.isError ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="alert-circle-outline" size={48} color={palette.error} />
                <Text style={styles.emptyTitle}>Failed to load attendance</Text>
                <Text style={styles.emptySubtitle}>Pull down to try again.</Text>
              </View>
            ) : filteredMonthlyEntries.length > 0 ? (
              <View style={styles.monthlyListContainer}>
                {filteredMonthlyEntries.map((entry) => (
                  <MonthlyClassSummaryCard
                    key={entry.classId}
                    summary={entry}
                    onPress={handleMonthlyCardPress}
                  />
                ))}
              </View>
            ) : searchQuery.trim() ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="magnify" size={48} color={palette.onSurfaceMuted} />
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptySubtitle}>Try a different search term.</Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="calendar-blank-outline" size={48} color={palette.onSurfaceMuted} />
                <Text style={styles.emptyTitle}>No classes found</Text>
                <Text style={styles.emptySubtitle}>You do not have any active classes.</Text>
              </View>
            )
          )}
        </ScrollView>
      </View>

      <RecordAttendanceDialog
        visible={Boolean(dialogClassId)}
        classId={dialogClassId ?? ''}
        className={dialogClassName}
        date={selectedDate}
        initialStudents={dialogStudentIds.map((id) => studentLookup[id]).filter(Boolean)}
        onClose={() => setDialogClassId(null)}
        onRecorded={async () => {
          timeline.refetch();
          monthlyData.refetch();
        }}
      />

      <MonthlyClassRosterDialog
        visible={Boolean(rosterDialogClassId)}
        summary={monthlyData.entries.find((e) => e.classId === rosterDialogClassId) ?? null}
        searchQuery={rosterSearchQuery}
        onSearchChange={setRosterSearchQuery}
        onClose={() => setRosterDialogClassId(null)}
      />

      <ReportClassPickerModal
        visible={isReportClassModalOpen}
        entries={reportClassOptions}
        selectedClassIds={selectedReportClassIds}
        isGeneratingReport={isGeneratingReport}
        onToggleClass={handleToggleReportClass}
        onSelectAll={handleSelectAllReportClasses}
        onClear={handleClearReportClasses}
        onDownloadReport={() => handleGenerateReport('download')}
        onShareReport={() => handleGenerateReport('share')}
        onClose={() => setReportClassModalOpen(false)}
      />

      <CalendarModal
        visible={isCalendarOpen}
        month={calendarMonth}
        selectedDateKey={selectedDateKey}
        todayKey={todayKey}
        onSelectDate={handleCalendarDateSelect}
        onChangeMonth={setCalendarMonth}
        onClose={() => setCalendarOpen(false)}
      />
    </SafeAreaView>
  );
};

type CalendarModalProps = {
  visible: boolean;
  month: Date;
  selectedDateKey: string;
  todayKey: string;
  onSelectDate: (key: string) => void;
  onChangeMonth: (date: Date) => void;
  onClose: () => void;
};

type ReportClassPickerModalProps = {
  visible: boolean;
  entries: { classId: string; className: string; instructorName: string }[];
  selectedClassIds: string[];
  isGeneratingReport: boolean;
  onToggleClass: (classId: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  onDownloadReport: () => void;
  onShareReport: () => void;
  onClose: () => void;
};

const ReportClassPickerModal = ({
  visible,
  entries,
  selectedClassIds,
  isGeneratingReport,
  onToggleClass,
  onSelectAll,
  onClear,
  onDownloadReport,
  onShareReport,
  onClose,
}: ReportClassPickerModalProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={reportStyles.overlay} onPress={onClose}>
        <View style={reportStyles.sheet} onStartShouldSetResponder={() => true}>
          <View style={reportStyles.header}>
            <Text style={reportStyles.title}>Include Classes</Text>
            <Text style={reportStyles.subtitle}>{selectedClassIds.length} selected</Text>
          </View>

          <View style={reportStyles.actionsRow}>
            <Pressable onPress={onSelectAll} accessibilityRole="button">
              <Text style={reportStyles.actionText}>Select all</Text>
            </Pressable>
            <Pressable onPress={onClear} accessibilityRole="button">
              <Text style={reportStyles.actionText}>Clear</Text>
            </Pressable>
          </View>

          <ScrollView style={reportStyles.classList} contentContainerStyle={reportStyles.classListContent}>
            {entries.map((entry) => {
              const isSelected = selectedClassIds.includes(entry.classId);
              return (
                <Pressable
                  key={entry.classId}
                  style={[reportStyles.classRow, isSelected && reportStyles.classRowSelected]}
                  onPress={() => onToggleClass(entry.classId)}
                  accessibilityRole="button"
                  accessibilityLabel={`Include ${entry.className} in report`}>
                  <View style={reportStyles.classInfo}>
                    <Text style={reportStyles.className}>{entry.className}</Text>
                    {entry.instructorName ? <Text style={reportStyles.instructorName}>{entry.instructorName}</Text> : null}
                  </View>
                  <MaterialCommunityIcons
                    name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={24}
                    color={isSelected ? palette.primary : palette.onSurfaceMuted}
                  />
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={reportStyles.footer}>
            <Pressable
              style={[
                reportStyles.actionButton,
                reportStyles.actionButtonSecondary,
                (isGeneratingReport || selectedClassIds.length === 0) && reportStyles.actionButtonDisabled,
              ]}
              onPress={onDownloadReport}
              disabled={isGeneratingReport || selectedClassIds.length === 0}
              accessibilityRole="button">
              <View style={reportStyles.actionButtonContent}>
                <MaterialCommunityIcons name="download" size={18} color={palette.primary} />
                <Text style={reportStyles.actionButtonText}>Download</Text>
              </View>
            </Pressable>

            <Pressable
              style={[
                reportStyles.actionButton,
                reportStyles.actionButtonPrimary,
                (isGeneratingReport || selectedClassIds.length === 0) && reportStyles.actionButtonDisabled,
              ]}
              onPress={onShareReport}
              disabled={isGeneratingReport || selectedClassIds.length === 0}
              accessibilityRole="button">
              <View style={reportStyles.actionButtonContent}>
                <MaterialCommunityIcons name="share-variant-outline" size={18} color={palette.onPrimary} />
                <Text style={reportStyles.actionButtonTextPrimary}>Share</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const CALENDAR_DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

const CalendarModal = ({
  visible,
  month,
  selectedDateKey,
  todayKey,
  onSelectDate,
  onChangeMonth,
  onClose,
}: CalendarModalProps) => {
  const monthLabel = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(month);
  }, [month]);

  const calendarDays = useMemo(() => {
    const year = month.getFullYear();
    const m = month.getMonth();
    const firstDay = new Date(year, m, 1);
    const lastDay = new Date(year, m + 1, 0);
    const startPad = firstDay.getDay();
    const days: (Date | null)[] = [];

    for (let i = 0; i < startPad; i++) {
      days.push(null);
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, m, d));
    }

    return days;
  }, [month]);

  const handlePrevMonth = () => {
    const prev = new Date(month.getFullYear(), month.getMonth() - 1, 1);
    onChangeMonth(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    onChangeMonth(next);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={calStyles.overlay} onPress={onClose}>
        <View style={calStyles.sheet} onStartShouldSetResponder={() => true}>
          <View style={calStyles.handle} />
          <View style={calStyles.header}>
            <Pressable onPress={handlePrevMonth} accessibilityRole="button" accessibilityLabel="Previous month">
              <MaterialCommunityIcons name="chevron-left" size={24} color={palette.onSurface} />
            </Pressable>
            <Text style={calStyles.monthLabel}>{monthLabel}</Text>
            <Pressable onPress={handleNextMonth} accessibilityRole="button" accessibilityLabel="Next month">
              <MaterialCommunityIcons name="chevron-right" size={24} color={palette.onSurface} />
            </Pressable>
          </View>

          <View style={calStyles.dayLabelsRow}>
            {CALENDAR_DAY_LABELS.map((label, i) => (
              <View key={i} style={calStyles.dayLabelCell}>
                <Text style={calStyles.dayLabelText}>{label}</Text>
              </View>
            ))}
          </View>

          <View style={calStyles.grid}>
            {calendarDays.map((day, i) => {
              if (!day) {
                return <View key={`pad-${i}`} style={calStyles.dayCell} />;
              }
              const key = dateKey(day);
              const isSelected = key === selectedDateKey;
              const isToday = key === todayKey;
              return (
                <Pressable
                  key={key}
                  style={[calStyles.dayCell, isSelected && calStyles.dayCellSelected, isToday && !isSelected && calStyles.dayCellToday]}
                  onPress={() => onSelectDate(key)}
                  accessibilityRole="button">
                  <Text
                    style={[
                      calStyles.dayText,
                      isSelected && calStyles.dayTextSelected,
                      isToday && !isSelected && calStyles.dayTextToday,
                    ]}>
                    {day.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={calStyles.todayButton} onPress={() => onSelectDate(todayKey)}>
            <Text style={calStyles.todayButtonText}>Go to Today</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

const calStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: palette.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  sheet: {
    backgroundColor: palette.surface,
    borderRadius: shape.extraLarge,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 360,
    gap: spacing.md,
    shadowColor: palette.shadow,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 16,
    elevation: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 4,
    borderRadius: 999,
    backgroundColor: palette.outlineVariant,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthLabel: {
    ...typography.titleMedium,
    color: palette.onSurface,
    fontFamily: 'Lexend-SemiBold',
    fontWeight: '600',
  },
  dayLabelsRow: {
    flexDirection: 'row',
  },
  dayLabelCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  dayLabelText: {
    ...typography.labelSmall,
    color: palette.onSurfaceMuted,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%` as unknown as number,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: palette.primary,
    borderRadius: 999,
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: palette.primary,
    borderRadius: 999,
  },
  dayText: {
    ...typography.bodyMedium,
    color: palette.onSurface,
    fontFamily: 'Lexend-Medium',
    fontWeight: '500',
  },
  dayTextSelected: {
    color: palette.onPrimary,
    fontFamily: 'Lexend-Bold',
    fontWeight: '700',
  },
  dayTextToday: {
    color: palette.primary,
    fontFamily: 'Lexend-Bold',
    fontWeight: '700',
  },
  todayButton: {
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 100,
    backgroundColor: palette.primaryContainer,
  },
  todayButtonText: {
    ...typography.labelMedium,
    color: palette.primary,
    fontFamily: 'Lexend-Bold',
    fontWeight: '700',
  },
});

const reportStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: palette.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    borderRadius: shape.extraLarge,
    backgroundColor: palette.surface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    ...typography.titleLarge,
    color: palette.onSurface,
    fontFamily: 'Lexend-SemiBold',
    fontWeight: '600',
  },
  subtitle: {
    ...typography.bodySmall,
    color: palette.onSurfaceVariant,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionText: {
    ...typography.labelMedium,
    color: palette.primary,
    fontFamily: 'Lexend-SemiBold',
    fontWeight: '600',
  },
  classList: {
    maxHeight: 360,
  },
  classListContent: {
    gap: spacing.sm,
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: shape.medium,
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  classRowSelected: {
    borderColor: palette.primary,
    backgroundColor: palette.primaryContainer,
  },
  classInfo: {
    flex: 1,
    gap: 2,
    paddingRight: spacing.sm,
  },
  className: {
    ...typography.bodyLarge,
    color: palette.onSurface,
    fontFamily: 'Lexend-Medium',
    fontWeight: '500',
  },
  instructorName: {
    ...typography.bodySmall,
    color: palette.onSurfaceVariant,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  actionButtonPrimary: {
    backgroundColor: palette.primary,
  },
  actionButtonSecondary: {
    backgroundColor: palette.primaryContainer,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionButtonText: {
    ...typography.labelLarge,
    color: palette.primary,
    fontFamily: 'Lexend-SemiBold',
    fontWeight: '600',
  },
  actionButtonTextPrimary: {
    ...typography.labelLarge,
    color: palette.onPrimary,
    fontFamily: 'Lexend-SemiBold',
    fontWeight: '600',
  },
});

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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: palette.surface,
    borderRadius: shape.medium,
    padding: 4,
    borderWidth: 1,
    borderColor: palette.outlineVariant,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: shape.small,
  },
  toggleButtonActive: {
    backgroundColor: palette.primaryContainer,
  },
  toggleText: {
    ...typography.labelMedium,
    color: palette.onSurfaceVariant,
    fontFamily: 'Lexend-Medium',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: palette.primary,
    fontFamily: 'Lexend-Bold',
    fontWeight: '700',
  },
  dayPickerStrip: {
    flexGrow: 0,
  },
  dayPickerContent: {
    alignItems: 'center',
    gap: spacing.md,
  },
  dayPickerNav: {
    width: 32,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPickerItem: {
    width: 56,
    paddingVertical: spacing.md,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.surfaceDim,
    gap: spacing.xs,
  },
  dayPickerItemSelected: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
    shadowColor: palette.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  dayPickerDayName: {
    ...typography.labelSmall,
    color: palette.onSurfaceMuted,
    textTransform: 'uppercase',
  },
  dayPickerDayNameSelected: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  dayPickerDate: {
    fontSize: 18,
    fontFamily: 'Lexend-Bold',
    fontWeight: '700',
    color: palette.onSurface,
  },
  dayPickerDateSelected: {
    color: palette.onPrimary,
  },
  dayPickerTodayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.primary,
  },
  todayPill: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 100,
    backgroundColor: palette.primaryContainer,
  },
  todayPillText: {
    ...typography.labelSmall,
    color: palette.primary,
    fontFamily: 'Lexend-Bold',
    fontWeight: '700',
  },
  timelineScroll: {
    flex: 1,
  },
  timelineContent: {
    paddingBottom: spacing.xxl,
  },
  timelineContainer: {
    paddingLeft: 23,
  },
  timelineLine: {
    position: 'absolute',
    left: 23,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: palette.surfaceDim,
  },
  timelineEntryWrapper: {
    marginBottom: spacing.lg,
  },
  monthlyListContainer: {
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: palette.onSurfaceVariant,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: palette.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 100,
  },
  primaryText: {
    ...typography.labelLarge,
    color: palette.onPrimary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...typography.titleLarge,
    color: palette.onSurface,
    textAlign: 'center',
  },
  loadingState: {
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
  reportStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: palette.primaryContainer,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 100,
  },
  reportStatusText: {
    ...typography.labelMedium,
    color: palette.primary,
    fontFamily: 'Lexend-Medium',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    ...typography.titleMedium,
    color: palette.onSurface,
  },
  emptySubtitle: {
    ...typography.bodyMedium,
    color: palette.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 280,
  },
});

export default AttendanceScreen;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

const getWeekStart = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const buildWeekDays = (weekStart: Date) => {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(weekStart, i));
  }
  return days;
};

const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateKey = (key: string) => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
};
