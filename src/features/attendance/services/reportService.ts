import { ATTENDANCE_STATUS } from '@core/constants/attendance';
import { MonthlyClassSummary } from '@features/attendance/hooks/useMonthlyAttendance';
import { StudentEntity } from '@features/students/types/student';
import i18n from '@shared/localization/i18n';
import { formatPercentage } from '@shared/utils/formatPercentage';

type BuildMonthlyReportInput = {
  selectedMonth: Date;
  entries: MonthlyClassSummary[];
  studentLookup: Record<string, StudentEntity>;
};

const escapeHtml = (value: string) => {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
};

const getActiveLocale = () => i18n.language || 'en-US';

const formatMonthLabel = (date: Date) => {
  return new Intl.DateTimeFormat(getActiveLocale(), {
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const formatDayLabel = (date: Date) => {
  return new Intl.DateTimeFormat(getActiveLocale(), {
    weekday: 'long',
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  }).format(date);
};

const dayKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const studentDisplayName = (student: StudentEntity | undefined) => {
  if (!student) {
    return i18n.t('students.unknown') as string;
  }

  return `${student.firstName} ${student.lastName}`.trim();
};

const statusLabel = (status: string) => {
  if (status === ATTENDANCE_STATUS.present) return i18n.t('attendance.mark_present') as string;
  if (status === ATTENDANCE_STATUS.absent) return i18n.t('attendance.mark_absent') as string;
  if (status === ATTENDANCE_STATUS.excused) return i18n.t('attendance.mark_excused') as string;
  return status;
};

const statusClassName = (status: string) => {
  if (status === ATTENDANCE_STATUS.present) return 'status-present';
  if (status === ATTENDANCE_STATUS.absent) return 'status-absent';
  if (status === ATTENDANCE_STATUS.excused) return 'status-excused';
  return '';
};

export const buildMonthlyReportHtml = ({
  selectedMonth,
  entries,
  studentLookup,
}: BuildMonthlyReportInput) => {
  const sortedEntries = [...entries].sort((a, b) => a.className.localeCompare(b.className));
  const monthLabel = formatMonthLabel(selectedMonth);

  const totalClasses = sortedEntries.length;
  const totalSessions = sortedEntries.reduce((sum, entry) => sum + entry.totalSessionsRecorded, 0);
  const totalPresent = sortedEntries.reduce(
    (sum, entry) => sum + entry.monthRecords.filter((record) => record.status === ATTENDANCE_STATUS.present).length,
    0,
  );
  const totalAbsent = sortedEntries.reduce(
    (sum, entry) => sum + entry.monthRecords.filter((record) => record.status === ATTENDANCE_STATUS.absent).length,
    0,
  );
  const ratedRecords = totalPresent + totalAbsent;
  const overallAttendanceRate = ratedRecords > 0 ? totalPresent / ratedRecords : 1;

  const summarySections = sortedEntries
    .map((entry) => {
      const studentRows = Object.entries(entry.studentSummaries)
        .map(([studentId, summary]) => ({
          studentName: studentDisplayName(studentLookup[studentId]),
          sessionsAttended: summary.sessionsAttended,
          sessionsMissed: summary.sessionsMissed,
          sessionsExcused: summary.sessionsExcused,
          totalSessions: summary.totalSessions,
          attendanceRate: summary.attendanceRate,
        }))
        .sort((a, b) => {
          if (b.attendanceRate !== a.attendanceRate) {
            return b.attendanceRate - a.attendanceRate;
          }

          if (b.totalSessions !== a.totalSessions) {
            return b.totalSessions - a.totalSessions;
          }

          return a.studentName.localeCompare(b.studentName);
        })
        .map((student) => {
          return `
            <tr>
              <td>${escapeHtml(student.studentName)}</td>
              <td>${student.sessionsAttended}</td>
              <td>${student.sessionsMissed}</td>
              <td>${student.sessionsExcused}</td>
              <td>${student.totalSessions}</td>
              <td>${formatPercentage(student.attendanceRate)}</td>
            </tr>
          `;
        })
        .join('');

      return `
        <section class="class-section">
          <h3>${escapeHtml(entry.className)}</h3>
          <p class="muted">${escapeHtml(i18n.t('classes.instructor') as string)}: ${escapeHtml(entry.instructorName || '-')} | ${escapeHtml(i18n.t('report.enrolled') as string)}: ${entry.totalEnrolled} | ${escapeHtml(i18n.t('report.average_attendance') as string)}: ${formatPercentage(entry.attendanceRate)}</p>
          <h4>${escapeHtml(i18n.t('report.student_details') as string)}</h4>
          <table>
            <thead>
              <tr>
                <th>${escapeHtml(i18n.t('report.student') as string)}</th>
                <th>${escapeHtml(i18n.t('report.present') as string)}</th>
                <th>${escapeHtml(i18n.t('report.absent') as string)}</th>
                <th>${escapeHtml(i18n.t('attendance.mark_excused') as string)}</th>
                <th>${escapeHtml(i18n.t('report.sessions') as string)}</th>
                <th>${escapeHtml(i18n.t('report.attendance_rate') as string)}</th>
              </tr>
            </thead>
            <tbody>
              ${studentRows || `<tr><td colspan="6" class="muted">${escapeHtml(i18n.t('students.empty') as string)}</td></tr>`}
            </tbody>
          </table>
        </section>
      `;
    })
    .join('');

  const detailSections = sortedEntries
    .map((entry) => {
      const groupedRecords = new Map<string, typeof entry.monthRecords>();

      for (const record of entry.monthRecords) {
        const recordDate = new Date(record.date);
        const key = dayKey(recordDate);
        const current = groupedRecords.get(key) ?? [];
        current.push(record);
        groupedRecords.set(key, current);
      }

      const dailyLogs = Array.from(groupedRecords.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, records]) => {
          const date = new Date(`${key}T00:00:00`);
          const rows = [...records]
            .sort((a, b) => {
              const studentA = studentDisplayName(studentLookup[a.studentId]).toLowerCase();
              const studentB = studentDisplayName(studentLookup[b.studentId]).toLowerCase();
              return studentA.localeCompare(studentB);
            })
            .map((record) => {
              const studentName = studentDisplayName(studentLookup[record.studentId]);
              return `
                <tr>
                  <td>${escapeHtml(studentName)}</td>
                  <td class="${statusClassName(record.status)}">${escapeHtml(statusLabel(record.status))}</td>
                  <td>${escapeHtml(record.notes?.trim() || '-')}</td>
                </tr>
              `;
            })
            .join('');

          return `
            <section class="daily-log">
              <h4>${escapeHtml(formatDayLabel(date))}</h4>
              <table>
                <thead>
                  <tr>
                    <th>${escapeHtml(i18n.t('report.student') as string)}</th>
                    <th>${escapeHtml(i18n.t('report.status') as string)}</th>
                    <th>${escapeHtml(i18n.t('report.notes') as string)}</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
              </table>
            </section>
          `;
        })
        .join('');

      return `
        <section class="class-section">
          <h3>${escapeHtml(entry.className)}</h3>
          <p class="muted">${escapeHtml(i18n.t('classes.instructor') as string)}: ${escapeHtml(entry.instructorName || '-')} | ${escapeHtml(i18n.t('report.attendance') as string)}: ${formatPercentage(entry.attendanceRate)} | ${escapeHtml(i18n.t('report.sessions') as string)}: ${entry.totalSessionsRecorded}</p>
          ${dailyLogs || `<p class="muted">${escapeHtml(i18n.t('report.no_class_logs_month') as string)}</p>`}
        </section>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(i18n.t('report.attendance_report') as string)} - ${escapeHtml(monthLabel)}</title>
        <style>
          @page {
            size: A4;
            margin: 18mm 12mm 18mm 12mm;
            @bottom-right {
              content: counter(page) " / " counter(pages);
              font-size: 10px;
              color: #64748b;
            }
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: #0f172a;
            font-size: 12px;
            line-height: 1.45;
          }

          h1,
          h2,
          h3,
          h4,
          p {
            margin: 0;
          }

          h1 {
            font-size: 24px;
            margin-bottom: 4px;
          }

          h2 {
            font-size: 16px;
            margin-bottom: 8px;
          }

          h3 {
            font-size: 14px;
            margin-bottom: 4px;
          }

          h4 {
            font-size: 12px;
            margin-bottom: 8px;
          }

          .summary-page {
            min-height: 240mm;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .summary-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 10px;
          }

          .logo-placeholder {
            width: 52px;
            height: 52px;
            border: 1.5px dashed #64748b;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            font-size: 9px;
            color: #64748b;
            padding: 6px;
          }

          .summary-stats {
            display: flex;
            gap: 12px;
          }

          .stat-card {
            flex: 1;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px;
            background: #f8fafc;
          }

          .stat-label {
            color: #475569;
            margin-bottom: 4px;
          }

          .stat-value {
            font-size: 16px;
            font-weight: 600;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th,
          td {
            border: 1px solid #e2e8f0;
            padding: 8px;
            text-align: left;
            vertical-align: top;
          }

          th {
            background: #f1f5f9;
            font-weight: 600;
          }

          .text-danger {
            color: #b91c1c;
            font-weight: 600;
          }

          .status-present {
            color: #15803d;
            font-weight: 600;
          }

          .status-absent {
            color: #b91c1c;
            font-weight: 600;
          }

          .status-excused {
            color: #a16207;
            font-weight: 600;
          }

          .details-page {
            page-break-before: always;
          }

          .class-section {
            margin-bottom: 18px;
            page-break-inside: avoid;
          }

          .daily-log {
            margin-top: 10px;
          }

          .muted {
            color: #475569;
          }
        </style>
      </head>
      <body>
        <section class="summary-page">
          <header class="summary-header">
            <div>
              <h1>${escapeHtml(i18n.t('report.monthly_attendance_report') as string)}</h1>
              <p class="muted">${escapeHtml(monthLabel)}</p>
            </div>
            <div class="logo-placeholder">${escapeHtml(i18n.t('report.app_logo_placeholder') as string)}</div>
          </header>

          <section class="summary-stats">
            <article class="stat-card">
              <p class="stat-label">${escapeHtml(i18n.t('classes.stats.classes') as string)}</p>
              <p class="stat-value">${totalClasses}</p>
            </article>
            <article class="stat-card">
              <p class="stat-label">${escapeHtml(i18n.t('report.sessions_recorded') as string)}</p>
              <p class="stat-value">${totalSessions}</p>
            </article>
            <article class="stat-card">
              <p class="stat-label">${escapeHtml(i18n.t('report.overall_attendance') as string)}</p>
              <p class="stat-value">${formatPercentage(overallAttendanceRate)}</p>
            </article>
          </section>

          <section>
            <h2>${escapeHtml(i18n.t('report.student_attendance_summary') as string)}</h2>
            ${summarySections || `<p class="muted">${escapeHtml(i18n.t('report.no_data_month') as string)}</p>`}
          </section>
        </section>

        <section class="details-page">
          <h2>${escapeHtml(i18n.t('report.daily_attendance_logs') as string)}</h2>
          ${detailSections || `<p class="muted">${escapeHtml(i18n.t('report.no_detailed_logs_month') as string)}</p>`}
        </section>
      </body>
    </html>
  `;
};
