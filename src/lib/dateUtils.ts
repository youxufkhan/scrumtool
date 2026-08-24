import { format, parseISO, isWeekend as isDateFnsWeekend, subDays, addDays, isBefore, isEqual, isValid } from 'date-fns';

/**
 * Checks if a given date string or Date object falls on a weekend (Saturday or Sunday).
 */
export function isWeekend(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isDateFnsWeekend(d);
}

/**
 * Formats a Date object or ISO string to standard YYYY-MM-DD format.
 */
export function formatDateIso(date: Date | string): string {
  if (typeof date === 'string') {
    if (isValidDateString(date)) return date;
    const parsed = parseISO(date);
    return isValid(parsed) ? format(parsed, 'yyyy-MM-dd') : '';
  }
  return format(date, 'yyyy-MM-dd');
}

/**
 * Returns today's date in local calendar YYYY-MM-DD format.
 */
export function getLocalTodayIso(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Validates whether a string matches a strict YYYY-MM-DD ISO date format.
 */
export function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const parsed = parseISO(dateStr);
  return isValid(parsed) && format(parsed, 'yyyy-MM-dd') === dateStr;
}

/**
 * Finds the most recent prior working day before the given date, skipping weekends and holiday dates.
 */
export function getPriorWorkingDay(dateStr: string, holidayDates: string[] = []): string {
  let curr = subDays(parseISO(dateStr), 1);
  const holidaySet = new Set(holidayDates);

  while (isDateFnsWeekend(curr) || holidaySet.has(format(curr, 'yyyy-MM-dd'))) {
    curr = subDays(curr, 1);
  }
  return format(curr, 'yyyy-MM-dd');
}

/**
 * Computes all working days (inclusive) between startDate and endDate, excluding weekends and holidays.
 */
export function getPastWorkingDays(startDateStr: string, endDateStr: string, holidayDates: string[] = []): string[] {
  let curr = parseISO(startDateStr);
  const end = parseISO(endDateStr);
  const holidaySet = new Set(holidayDates);
  const workingDays: string[] = [];

  while (isBefore(curr, end) || isEqual(curr, end)) {
    const formatted = format(curr, 'yyyy-MM-dd');
    if (!isDateFnsWeekend(curr) && !holidaySet.has(formatted)) {
      workingDays.push(formatted);
    }
    curr = addDays(curr, 1);
  }

  return workingDays;
}
