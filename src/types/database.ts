export type TaskStatus = 'planned' | 'in_progress' | 'done' | 'blocked';

export interface Member {
  id: string;
  name: string;
  role: string;
  avatar_color: string;
  is_active: boolean;
  has_custom_passcode?: boolean;
  passcode_hash?: string;
  joined_at: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

export interface DailySubmission {
  id: string;
  member_id: string;
  date: string; // YYYY-MM-DD
  is_locked: boolean;
  is_on_leave: boolean;
  leave_reason?: string | null;
  submitted_at?: string | null;
  created_at: string;
}

export interface DailyTask {
  id: string;
  member_id: string;
  date: string; // YYYY-MM-DD
  title: string;
  project_id?: string | null;
  status: TaskStatus;
  hours_spent?: number | null; // null during morning, 0.00 - 24.00 in evening
  blocker_note?: string | null;
  is_ad_hoc: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Holiday {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  created_at: string;
}

export interface StandupMemberSummary {
  member: Member;
  submission: DailySubmission | null;
  tasks: (DailyTask & { project?: Project | null })[];
  totalHours: number;
  isMissingHours: boolean;
}

export interface DailyStandupReport {
  date: string;
  isWeekend: boolean;
  holiday: Holiday | null;
  members: StandupMemberSummary[];
  totalTeamHours: number;
  totalMembersCount: number;
  submittedMembersCount: number;
  blockedTasksCount: number;
}

export interface AnalyticsSummary {
  startDate: string;
  endDate: string;
  totalHours: number;
  totalPlannedHours: number;
  totalAdHocHours: number;
  memberBreakdown: {
    memberId: string;
    memberName: string;
    totalHours: number;
    tasksCount: number;
    daysActiveCount: number;
    avgHoursPerDay: number;
  }[];
  projectBreakdown: {
    projectId: string;
    projectName: string;
    projectColor: string;
    totalHours: number;
    percentage: number;
  }[];
  dailyTrends: {
    date: string;
    totalHours: number;
    plannedHours: number;
    adHocHours: number;
  }[];
}
