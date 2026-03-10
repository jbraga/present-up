import { CLASS_SCHEDULE_DAYS, ClassScheduleEntry } from '@features/classes/types/class';

export type ScheduleFormEntry = {
  dayOfWeek: (typeof CLASS_SCHEDULE_DAYS)[number];
  startTime: string;
  endTime: string;
};

export type ActiveTimePicker = {
  index: number;
  field: 'startTime' | 'endTime';
};

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const TIME_OPTIONS = generateTimeOptions();

export function createEmptyScheduleEntry(): ScheduleFormEntry {
  return {
    dayOfWeek: CLASS_SCHEDULE_DAYS[0],
    startTime: '',
    endTime: '',
  };
}

export function createInitialSchedule(): ScheduleFormEntry[] {
  return [createEmptyScheduleEntry()];
}

export function getInitialThreshold(value?: number): string {
  return Math.round((value ?? 0.5) * 100).toString();
}

export function normalizeTime(value: string): string {
  return value.trim();
}

export function isValidTime(value: string): boolean {
  return timeRegex.test(value);
}

export function getTimeInMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map((segment) => Number.parseInt(segment, 10));
  return hours * 60 + minutes;
}

export function generateTimeOptions(): string[] {
  const options: string[] = [];

  for (let hour = 0; hour <= 23; hour += 1) {
    for (let minute = 0; minute <= 45; minute += 15) {
      const formattedHour = `${hour}`.padStart(2, '0');
      const formattedMinute = `${minute}`.padStart(2, '0');
      options.push(`${formattedHour}:${formattedMinute}`);
    }
  }

  return options;
}

export function hasInvalidSchedule(entries: ScheduleFormEntry[]): boolean {
  return entries.some((entry) => {
    const start = normalizeTime(entry.startTime);
    const end = normalizeTime(entry.endTime);

    if (!start || !end) {
      return true;
    }

    if (!isValidTime(start) || !isValidTime(end)) {
      return true;
    }

    return getTimeInMinutes(start) >= getTimeInMinutes(end);
  });
}

export function sanitizeSchedule(entries: ScheduleFormEntry[]): ClassScheduleEntry[] {
  return entries.map((entry) => {
    const start = normalizeTime(entry.startTime);
    const end = normalizeTime(entry.endTime);

    if (!start || !end) {
      throw new Error('Please select start and end times for every schedule entry.');
    }

    if (!isValidTime(start) || !isValidTime(end)) {
      throw new Error('Use valid times in HH:MM format.');
    }

    if (getTimeInMinutes(start) >= getTimeInMinutes(end)) {
      throw new Error('Start time must be earlier than end time.');
    }

    return {
      dayOfWeek: entry.dayOfWeek,
      startTime: start,
      endTime: end,
    };
  });
}
