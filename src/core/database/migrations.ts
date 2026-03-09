import { type SQLiteDatabase } from 'expo-sqlite';

import { logger } from '@core/utils/logger';

type Migration = {
  version: number;
  name: string;
  up: (db: SQLiteDatabase) => Promise<void>;
};

const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS classes (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          instructor_email TEXT NOT NULL,
          instructor_name TEXT NOT NULL DEFAULT '',
          min_attendance_percentage REAL NOT NULL DEFAULT 0.5,
          schedule TEXT NOT NULL DEFAULT '[]',
          capacity INTEGER,
          location TEXT NOT NULL DEFAULT '',
          icon_name TEXT NOT NULL DEFAULT '',
          image_uri TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL,
          updated_at TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_classes_instructor ON classes(instructor_email);

        CREATE TABLE IF NOT EXISTS students (
          id TEXT PRIMARY KEY NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          preferred_name TEXT,
          email TEXT,
          guardian_email TEXT,
          phone_number TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_students_name ON students(first_name, last_name);

        CREATE TABLE IF NOT EXISTS class_roster (
          class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
          student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
          assigned_at TEXT,
          PRIMARY KEY (class_id, student_id)
        );

        CREATE INDEX IF NOT EXISTS idx_roster_class ON class_roster(class_id);
        CREATE INDEX IF NOT EXISTS idx_roster_student ON class_roster(student_id);

        CREATE TABLE IF NOT EXISTS attendance_logs (
          id TEXT PRIMARY KEY NOT NULL,
          class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
          student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
          date TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'EXCUSED')),
          notes TEXT,
          recorded_by TEXT NOT NULL,
          UNIQUE(class_id, student_id, date)
        );

        CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance_logs(class_id);
        CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance_logs(class_id, date);
        CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_logs(student_id);
      `);
    },
  },
  {
    version: 2,
    name: 'normalize_attendance_status_constraint',
    up: async (db) => {
      await db.execAsync(`
        ALTER TABLE attendance_logs RENAME TO attendance_logs_legacy;

        DROP INDEX IF EXISTS idx_attendance_class;
        DROP INDEX IF EXISTS idx_attendance_class_date;
        DROP INDEX IF EXISTS idx_attendance_student;

        CREATE TABLE attendance_logs (
          id TEXT PRIMARY KEY NOT NULL,
          class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
          student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
          date TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'EXCUSED')),
          notes TEXT,
          recorded_by TEXT NOT NULL,
          UNIQUE(class_id, student_id, date)
        );

        INSERT INTO attendance_logs (id, class_id, student_id, date, status, notes, recorded_by)
        SELECT
          id,
          class_id,
          student_id,
          date,
          CASE
            WHEN UPPER(status) = 'PRESENT' THEN 'PRESENT'
            WHEN UPPER(status) = 'ABSENT' THEN 'ABSENT'
            WHEN UPPER(status) = 'EXCUSED' THEN 'EXCUSED'
          END,
          notes,
          recorded_by
        FROM attendance_logs_legacy
        WHERE UPPER(status) IN ('PRESENT', 'ABSENT', 'EXCUSED');

        DROP TABLE attendance_logs_legacy;

        CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance_logs(class_id);
        CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance_logs(class_id, date);
        CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_logs(student_id);
      `);
    },
  },
];

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = await db.getAllAsync<{ version: number }>(
    'SELECT version FROM schema_migrations ORDER BY version',
  );
  const appliedVersions = new Set(applied.map((row) => row.version));

  const pending = migrations.filter((m) => !appliedVersions.has(m.version));

  if (pending.length === 0) {
    logger.info('[Database] Schema is up to date');
    return;
  }

  for (const migration of pending) {
    logger.info(`[Database] Running migration ${migration.version}: ${migration.name}`);

    await db.withTransactionAsync(async () => {
      await migration.up(db);
      await db.runAsync(
        'INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)',
        migration.version,
        migration.name,
        new Date().toISOString(),
      );
    });

    logger.info(`[Database] Migration ${migration.version} applied successfully`);
  }
}
