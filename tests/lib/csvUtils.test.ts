import { describe, it, expect } from 'vitest';
import { escapeCsvField, generateStandupCsv, CsvTaskRow } from '@/lib/csvUtils';

describe('csvUtils', () => {
  it('escapes standard CSV values with quotes and commas', () => {
    expect(escapeCsvField('Simple task')).toBe('Simple task');
    expect(escapeCsvField('Task with, comma')).toBe('"Task with, comma"');
    expect(escapeCsvField('Task with "quotes"')).toBe('"Task with ""quotes"""');
  });

  it('protects against CSV formula injection exploits by prefixing dangerous characters with single quote', () => {
    // Attack payloads starting with =, +, -, @, \t, \r
    expect(escapeCsvField('=CMD|\' /C calc\'!A0')).toBe("'\t=CMD|' /C calc'!A0".replace('\t', ''));
    expect(escapeCsvField('+12345')).toBe("'+12345");
    expect(escapeCsvField('-500')).toBe("'-500");
    expect(escapeCsvField('@SUM(A1:A10)')).toBe("'@SUM(A1:A10)");
  });

  it('generates a well-formatted CSV string from task rows', () => {
    const rows: CsvTaskRow[] = [
      {
        date: '2026-08-24',
        memberName: 'Alex Rivera',
        project: 'Core App',
        taskTitle: 'Build dashboard',
        status: 'done',
        hoursSpent: 4.5,
        isAdHoc: false,
        blockerNote: '',
      },
      {
        date: '2026-08-24',
        memberName: 'Sam Chen',
        project: 'Mobile MVP',
        taskTitle: 'Fix memory leak',
        status: 'blocked',
        hoursSpent: 2.0,
        isAdHoc: true,
        blockerNote: 'Waiting for device logs',
      },
    ];

    const csv = generateStandupCsv(rows);
    const lines = csv.trim().split('\n');

    expect(lines[0]).toBe('Date,Member,Project,Task Title,Status,Hours,Ad-Hoc,Blocker Note');
    expect(lines[1]).toBe('2026-08-24,Alex Rivera,Core App,Build dashboard,done,4.5,No,');
    expect(lines[2]).toBe('2026-08-24,Sam Chen,Mobile MVP,Fix memory leak,blocked,2,Yes,Waiting for device logs');
  });
});
