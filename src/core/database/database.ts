import { type SQLiteDatabase } from 'expo-sqlite';

import { logger } from '@core/utils/logger';

import { runMigrations } from './migrations';

export const DATABASE_NAME = 'presentup.db';

export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  logger.info('[Database] Initializing database...');

  await db.execAsync('PRAGMA journal_mode = WAL');
  await db.execAsync('PRAGMA foreign_keys = ON');

  await runMigrations(db);

  logger.info('[Database] Initialization complete');
}
