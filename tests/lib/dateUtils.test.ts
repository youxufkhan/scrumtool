import { describe, it, expect } from 'vitest';
import { isWeekend, formatDateIso, getPastWorkingDays, getPriorWorkingDay, isValidDateString } from '@/lib/dateUtils';

describe('dateUtils', () => {
  it('correctly identifies weekend days', () => {
    // 2026-08-22 is Saturday, 2026-08-23 is Sunday, 2026-08-24 is Monday
    expect(isWeekend('2026-08-22')).toBe(true);
    expect(isWeekend('2026-08-23')).toBe(true);
    expect(isWeekend('2026-08-24')).toBe(false);
    expect(isWeekend('2026-08-25')).toBe(false);
  });

  it('formats dates to ISO YYYY-MM-DD format', () => {
    const date = new Date(2026, 7, 24); // Aug 24, 2026
    expect(formatDateIso(date)).toBe('2026-08-24');
  });

  it('validates date strings', () => {
    expect(isValidDateString('2026-08-24')).toBe(true);
    expect(isValidDateString('invalid-date')).toBe(false);
    expect(isValidDateString('2026-13-45')).toBe(false);
  });

  it('finds the prior working day skipping weekends and holidays', () => {
    // Monday Aug 24 -> prior working day is Friday Aug 21
    expect(getPriorWorkingDay('2026-08-24', [])).toBe('2026-08-21');

    // If Friday Aug 21 was a holiday, prior working day is Thursday Aug 20
    expect(getPriorWorkingDay('2026-08-24', ['2026-08-21'])).toBe('2026-08-20');
  });

  it('computes past working days between two dates excluding weekends and holidays', () => {
    // From Aug 17 (Mon) to Aug 21 (Fri) = 5 working days
    const workingDays = getPastWorkingDays('2026-08-17', '2026-08-21', ['2026-08-19']);
    expect(workingDays).toEqual(['2026-08-17', '2026-08-18', '2026-08-20', '2026-08-21']);
  });
});
