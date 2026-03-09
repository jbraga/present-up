import { ATTENDANCE_STATUS } from '@core/constants/attendance';
import { MonthlyClassSummary } from '@features/attendance/hooks/useMonthlyAttendance';
import { StudentEntity } from '@features/students/types/student';
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

const formatMonthLabel = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const formatDayLabel = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
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
    return 'Unknown student';
  }

  const firstName = student.preferredName?.trim() || student.firstName;
  return `${firstName} ${student.lastName}`.trim();
};

const statusLabel = (status: string) => {
  if (status === ATTENDANCE_STATUS.present) return 'Present';
  if (status === ATTENDANCE_STATUS.absent) return 'Absent';
  if (status === ATTENDANCE_STATUS.excused) return 'Excused';
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
          <p class="muted">Instructor: ${escapeHtml(entry.instructorName || '-')} | Sessions: ${entry.totalSessionsRecorded} | Attendance: ${formatPercentage(entry.attendanceRate)}</p>
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Excused</th>
                <th>Sessions</th>
                <th>Attendance</th>
              </tr>
            </thead>
            <tbody>
              ${studentRows || '<tr><td colspan="6">No student data for this class in this month.</td></tr>'}
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
                    <th>Student</th>
                    <th>Status</th>
                    <th>Notes</th>
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
          <p class="muted">Instructor: ${escapeHtml(entry.instructorName || '-')} | Attendance: ${formatPercentage(entry.attendanceRate)} | Sessions: ${entry.totalSessionsRecorded}</p>
          ${dailyLogs || '<p class="muted">No attendance logs for this class in this month.</p>'}
        </section>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Attendance Report - ${escapeHtml(monthLabel)}</title>
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
              <h1>Monthly Attendance Report</h1>
              <p class="muted">${escapeHtml(monthLabel)}</p>
            </div>
            <div class="logo-placeholder">APP LOGO</div>
          </header>

          <section class="summary-stats">
            <article class="stat-card">
              <p class="stat-label">Classes</p>
              <p class="stat-value">${totalClasses}</p>
            </article>
            <article class="stat-card">
              <p class="stat-label">Sessions Recorded</p>
              <p class="stat-value">${totalSessions}</p>
            </article>
            <article class="stat-card">
              <p class="stat-label">Overall Attendance</p>
              <p class="stat-value">${formatPercentage(overallAttendanceRate)}</p>
            </article>
          </section>

          <section>
            <h2>Student Attendance Summary</h2>
            ${summarySections || '<p class="muted">No data available for this month.</p>'}
          </section>
        </section>

        <section class="details-page">
          <h2>Daily Attendance Logs</h2>
          ${detailSections || '<p class="muted">No detailed logs available for this month.</p>'}
        </section>
      </body>
    </html>
  `;
};
