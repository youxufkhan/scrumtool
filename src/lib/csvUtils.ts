export interface CsvTaskRow {
  date: string;
  memberName: string;
  project: string;
  taskTitle: string;
  status: string;
  hoursSpent: number | null | undefined;
  isAdHoc: boolean;
  blockerNote?: string | null;
}

/**
 * Escapes a field for CSV export and sanitizes against CSV Formula Injection.
 * Prefixes formula triggers (=, +, -, @, \t, \r) with a single quote.
 */
export function escapeCsvField(val: string | number | null | undefined): string {
  if (val === null || val === undefined) {
    return '';
  }
  let str = String(val);

  // Security: Check if string begins with unsafe formula trigger characters
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // If string contains quotes, commas, or newlines, enclose in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Generates a full CSV string with headers and escaped rows.
 */
export function generateStandupCsv(rows: CsvTaskRow[]): string {
  const headers = ['Date', 'Member', 'Project', 'Task Title', 'Status', 'Hours', 'Ad-Hoc', 'Blocker Note'];
  
  const headerLine = headers.join(',');
  const dataLines = rows.map((r) => [
    escapeCsvField(r.date),
    escapeCsvField(r.memberName),
    escapeCsvField(r.project),
    escapeCsvField(r.taskTitle),
    escapeCsvField(r.status),
    escapeCsvField(r.hoursSpent ?? ''),
    escapeCsvField(r.isAdHoc ? 'Yes' : 'No'),
    escapeCsvField(r.blockerNote ?? ''),
  ].join(','));

  return [headerLine, ...dataLines].join('\n');
}
