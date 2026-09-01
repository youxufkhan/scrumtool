'use server';

import crypto from 'crypto';
import { mockStore } from '@/lib/db';
import { getServerSupabaseClient } from '@/lib/serverDb';
import {
  Member,
  Project,
  Holiday,
  DailyStandupReport,
  StandupMemberSummary,
  AnalyticsSummary,
  DailyTask,
  DailySubmission,
} from '@/types/database';
import { isWeekend, getPastWorkingDays } from '@/lib/dateUtils';
import { ActionResult, getHolidaysList } from './standupActions';
import { hashPasscode, setAdminCookie, clearAdminCookie, getAdminAuthFromCookies } from '@/lib/authUtils';

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || '1234';

/**
 * Checks if the incoming request has valid admin authorization
 */
export async function requireAdminAuth(): Promise<boolean> {
  const token = await getAdminAuthFromCookies();
  if (!token) return false;

  const expectedToken = crypto
    .createHash('sha256')
    .update(`${ADMIN_PASSCODE}-${new Date().toDateString()}`)
    .digest('hex');

  const tokenBuf = Buffer.from(token);
  const expectedBuf = Buffer.from(expectedToken);

  if (tokenBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(tokenBuf, expectedBuf);
}

/**
 * Constant-time passcode verification to protect against timing attacks.
 * Sets a secure HTTP-only cookie on success.
 */
export async function verifyAdminPasscode(passcode: string): Promise<ActionResult<{ token: string }>> {
  if (!passcode || typeof passcode !== 'string') {
    return { success: false, error: 'Invalid passcode format.' };
  }

  const expectedBuffer = Buffer.from(ADMIN_PASSCODE);
  const inputBuffer = Buffer.from(passcode);

  if (expectedBuffer.length !== inputBuffer.length) {
    return { success: false, error: 'Incorrect admin passcode.' };
  }

  const isMatch = crypto.timingSafeEqual(expectedBuffer, inputBuffer);
  if (!isMatch) {
    return { success: false, error: 'Incorrect admin passcode.' };
  }

  // Generate simple token for client state & cookie
  const token = crypto.createHash('sha256').update(`${ADMIN_PASSCODE}-${new Date().toDateString()}`).digest('hex');
  await setAdminCookie(token);

  return { success: true, data: { token } };
}

/**
 * Admin logout action clearing session cookie
 */
export async function adminLogout(): Promise<ActionResult> {
  await clearAdminCookie();
  return { success: true };
}

/**
 * Aggregates daily standup report for all team members for the specified date.
 */
export async function getAdminDailyStandup(date: string): Promise<DailyStandupReport> {
  if (!(await requireAdminAuth())) {
    throw new Error('UNAUTHORIZED: Admin authentication required.');
  }

  const holidays = await getHolidaysList();
  const holiday = holidays.find((h) => h.date === date) || null;
  const weekend = isWeekend(date);

  const supabase = getServerSupabaseClient();
  if (supabase) {
    const { data: membersData } = await supabase.from('members').select('*').eq('is_active', true).order('name');
    const members = (membersData || []) as Member[];

    const { data: subsData } = await supabase.from('daily_submissions').select('*').eq('date', date);
    const submissions = (subsData || []) as DailySubmission[];
    const subMap = new Map(submissions.map((s) => [s.member_id, s]));

    const { data: tasksData } = await supabase
      .from('daily_tasks')
      .select('*, project:projects(*)')
      .eq('date', date)
      .order('order_index', { ascending: true });

    const tasks = (tasksData || []) as (DailyTask & { project?: Project | null })[];
    const tasksByMember = new Map<string, (DailyTask & { project?: Project | null })[]>();
    tasks.forEach((t) => {
      const arr = tasksByMember.get(t.member_id) || [];
      arr.push(t);
      tasksByMember.set(t.member_id, arr);
    });

    let totalTeamHours = 0;
    let submittedMembersCount = 0;
    let blockedTasksCount = 0;

    const memberSummaries: StandupMemberSummary[] = members.map((m) => {
      const sub = subMap.get(m.id) || null;
      const memTasks = tasksByMember.get(m.id) || [];

      let memberHours = 0;
      let hasMissing = false;

      memTasks.forEach((t) => {
        if (t.hours_spent !== null && t.hours_spent !== undefined) {
          memberHours += Number(t.hours_spent);
        } else {
          hasMissing = true;
        }
        if (t.status === 'blocked') {
          blockedTasksCount++;
        }
      });

      if (sub?.is_locked || sub?.is_on_leave) {
        submittedMembersCount++;
      }

      totalTeamHours += memberHours;

      return {
        member: m,
        submission: sub,
        tasks: memTasks,
        totalHours: memberHours,
        isMissingHours: Boolean(memTasks.length > 0 && (!sub?.is_locked || hasMissing)),
      };
    });

    return {
      date,
      isWeekend: weekend,
      holiday,
      members: memberSummaries,
      totalTeamHours,
      totalMembersCount: members.length,
      submittedMembersCount,
      blockedTasksCount,
    };
  }

  // Mock Store
  const members = mockStore.members.filter((m) => m.is_active);
  const subMap = new Map(mockStore.submissions.filter((s) => s.date === date).map((s) => [s.member_id, s]));

  let totalTeamHours = 0;
  let submittedMembersCount = 0;
  let blockedTasksCount = 0;

  const memberSummaries: StandupMemberSummary[] = members.map((m) => {
    const sub = subMap.get(m.id) || null;
    const memTasks = mockStore.tasks
      .filter((t) => t.member_id === m.id && t.date === date)
      .sort((a, b) => a.order_index - b.order_index)
      .map((t) => {
        const p = mockStore.projects.find((proj) => proj.id === t.project_id) || null;
        return { ...t, project: p };
      });

    let memberHours = 0;
    let hasMissing = false;

    memTasks.forEach((t) => {
      if (t.hours_spent !== null && t.hours_spent !== undefined) {
        memberHours += Number(t.hours_spent);
      } else {
        hasMissing = true;
      }
      if (t.status === 'blocked') {
        blockedTasksCount++;
      }
    });

    if (sub?.is_locked || sub?.is_on_leave) {
      submittedMembersCount++;
    }

    totalTeamHours += memberHours;

    return {
      member: m,
      submission: sub,
      tasks: memTasks,
      totalHours: memberHours,
      isMissingHours: Boolean(memTasks.length > 0 && (!sub?.is_locked || hasMissing)),
    };
  });

  return {
    date,
    isWeekend: weekend,
    holiday,
    members: memberSummaries,
    totalTeamHours,
    totalMembersCount: members.length,
    submittedMembersCount,
    blockedTasksCount,
  };
}

/**
 * Admin action: Unlocks a submission for a member on a given date to allow corrections.
 */
export async function unlockSubmission(memberId: string, date: string): Promise<ActionResult> {
  if (!(await requireAdminAuth())) {
    return { success: false, error: 'UNAUTHORIZED: Admin authentication required.' };
  }

  const supabase = getServerSupabaseClient();
  if (supabase) {
    const { error } = await supabase
      .from('daily_submissions')
      .update({ is_locked: false })
      .eq('member_id', memberId)
      .eq('date', date);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  const sub = mockStore.submissions.find((s) => s.member_id === memberId && s.date === date);
  if (sub) {
    sub.is_locked = false;
  }
  return { success: true };
}

/**
 * Analytics: Aggregates total hours, member breakdowns, project distribution, and daily trends.
 */
export async function getAdminAnalytics(startDate: string, endDate: string): Promise<AnalyticsSummary> {
  if (!(await requireAdminAuth())) {
    throw new Error('UNAUTHORIZED: Admin authentication required.');
  }

  const supabase = getServerSupabaseClient();

  let members: Member[] = [];
  let projects: Project[] = [];
  let tasks: (DailyTask & { project?: Project | null })[] = [];

  if (supabase) {
    const [mRes, pRes, tRes] = await Promise.all([
      supabase.from('members').select('*'),
      supabase.from('projects').select('*'),
      supabase
        .from('daily_tasks')
        .select('*, project:projects(*)')
        .gte('date', startDate)
        .lte('date', endDate)
        .not('hours_spent', 'is', null),
    ]);

    members = (mRes.data || []) as Member[];
    projects = (pRes.data || []) as Project[];
    tasks = (tRes.data || []) as (DailyTask & { project?: Project | null })[];
  } else {
    members = mockStore.members;
    projects = mockStore.projects;
    tasks = mockStore.tasks
      .filter((t) => t.date >= startDate && t.date <= endDate && t.hours_spent !== null && t.hours_spent !== undefined)
      .map((t) => {
        const p = mockStore.projects.find((proj) => proj.id === t.project_id) || null;
        return { ...t, project: p };
      });
  }

  let totalHours = 0;
  let totalPlannedHours = 0;
  let totalAdHocHours = 0;

  const memberMap = new Map<string, { totalHours: number; tasksCount: number; activeDays: Set<string> }>();
  const projectMap = new Map<string, number>();
  const dailyMap = new Map<string, { totalHours: number; plannedHours: number; adHocHours: number }>();

  tasks.forEach((t) => {
    const hours = Number(t.hours_spent || 0);
    totalHours += hours;

    if (t.is_ad_hoc) {
      totalAdHocHours += hours;
    } else {
      totalPlannedHours += hours;
    }

    // Member aggregation
    const memData = memberMap.get(t.member_id) || { totalHours: 0, tasksCount: 0, activeDays: new Set() };
    memData.totalHours += hours;
    memData.tasksCount += 1;
    memData.activeDays.add(t.date);
    memberMap.set(t.member_id, memData);

    // Project aggregation
    const projId = t.project_id || 'unassigned';
    projectMap.set(projId, (projectMap.get(projId) || 0) + hours);

    // Daily trends
    const dayData = dailyMap.get(t.date) || { totalHours: 0, plannedHours: 0, adHocHours: 0 };
    dayData.totalHours += hours;
    if (t.is_ad_hoc) {
      dayData.adHocHours += hours;
    } else {
      dayData.plannedHours += hours;
    }
    dailyMap.set(t.date, dayData);
  });

  const memberBreakdown = members
    .map((m) => {
      const data = memberMap.get(m.id) || { totalHours: 0, tasksCount: 0, activeDays: new Set() };
      const daysCount = data.activeDays.size;
      const avg = daysCount > 0 ? Number((data.totalHours / daysCount).toFixed(1)) : 0;

      return {
        memberId: m.id,
        memberName: m.name,
        totalHours: Number(data.totalHours.toFixed(2)),
        tasksCount: data.tasksCount,
        daysActiveCount: daysCount,
        avgHoursPerDay: avg,
      };
    })
    .sort((a, b) => b.totalHours - a.totalHours);

  const projectBreakdown = projects
    .map((p) => {
      const hours = projectMap.get(p.id) || 0;
      const pct = totalHours > 0 ? Number(((hours / totalHours) * 100).toFixed(1)) : 0;
      return {
        projectId: p.id,
        projectName: p.name,
        projectColor: p.color,
        totalHours: Number(hours.toFixed(2)),
        percentage: pct,
      };
    })
    .sort((a, b) => b.totalHours - a.totalHours);

  const dailyTrends = Array.from(dailyMap.entries())
    .map(([date, d]) => ({
      date,
      totalHours: Number(d.totalHours.toFixed(2)),
      plannedHours: Number(d.plannedHours.toFixed(2)),
      adHocHours: Number(d.adHocHours.toFixed(2)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    startDate,
    endDate,
    totalHours: Number(totalHours.toFixed(2)),
    totalPlannedHours: Number(totalPlannedHours.toFixed(2)),
    totalAdHocHours: Number(totalAdHocHours.toFixed(2)),
    memberBreakdown,
    projectBreakdown,
    dailyTrends,
  };
}

/**
 * Manage Members: Add new team member
 */
export async function addMember(name: string, role: string, avatarColor?: string): Promise<ActionResult<Member>> {
  if (!(await requireAdminAuth())) {
    return { success: false, error: 'UNAUTHORIZED: Admin authentication required.' };
  }

  if (!name || name.trim().length === 0) return { success: false, error: 'Name is required' };

  const color = avatarColor || '#3B82F6';
  const supabase = getServerSupabaseClient();

  if (supabase) {
    const { data, error } = await supabase
      .from('members')
      .insert({ name: name.trim(), role: role.trim() || 'Engineer', avatar_color: color, is_active: true })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as Member };
  }

  const newMember: Member = {
    id: `m-${Date.now()}`,
    name: name.trim(),
    role: role.trim() || 'Engineer',
    avatar_color: color,
    is_active: true,
    joined_at: new Date().toISOString().slice(0, 10),
    created_at: new Date().toISOString(),
  };
  mockStore.members.push(newMember);
  return { success: true, data: newMember };
}

/**
 * Manage Projects: Add new project
 */
export async function addProject(name: string, color?: string): Promise<ActionResult<Project>> {
  if (!(await requireAdminAuth())) {
    return { success: false, error: 'UNAUTHORIZED: Admin authentication required.' };
  }

  if (!name || name.trim().length === 0) return { success: false, error: 'Project name is required' };

  const projColor = color || '#6366F1';
  const supabase = getServerSupabaseClient();

  if (supabase) {
    const { data, error } = await supabase
      .from('projects')
      .insert({ name: name.trim(), color: projColor, is_active: true })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as Project };
  }

  const newProject: Project = {
    id: `p-${Date.now()}`,
    name: name.trim(),
    color: projColor,
    is_active: true,
    created_at: new Date().toISOString(),
  };
  mockStore.projects.push(newProject);
  return { success: true, data: newProject };
}

/**
 * Manage Holidays: Add a new custom holiday
 */
export async function addHoliday(date: string, name: string): Promise<ActionResult<Holiday>> {
  if (!(await requireAdminAuth())) {
    return { success: false, error: 'UNAUTHORIZED: Admin authentication required.' };
  }

  if (!date || !name) return { success: false, error: 'Date and Holiday Name are required' };

  const supabase = getServerSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('holidays')
      .upsert({ date, name: name.trim() }, { onConflict: 'date' })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as Holiday };
  }

  const existingIdx = mockStore.holidays.findIndex((h) => h.date === date);
  const newHoliday: Holiday = {
    id: `h-${Date.now()}`,
    date,
    name: name.trim(),
    created_at: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    mockStore.holidays[existingIdx] = newHoliday;
  } else {
    mockStore.holidays.push(newHoliday);
  }

  return { success: true, data: newHoliday };
}

/**
 * Manage Holidays: Remove a holiday
 */
export async function deleteHoliday(id: string): Promise<ActionResult> {
  if (!(await requireAdminAuth())) {
    return { success: false, error: 'UNAUTHORIZED: Admin authentication required.' };
  }

  const supabase = getServerSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from('holidays').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  mockStore.holidays = mockStore.holidays.filter((h) => h.id !== id);
  return { success: true };
}

/**
 * Admin Action: Reset a member's 4-digit passcode back to default '1234'
 */
export async function adminResetMemberPasscode(memberId: string): Promise<ActionResult> {
  if (!(await requireAdminAuth())) {
    return { success: false, error: 'UNAUTHORIZED: Admin authentication required.' };
  }

  const defaultHash = hashPasscode('1234');
  const supabase = getServerSupabaseClient();

  if (supabase) {
    const { error } = await supabase
      .from('members')
      .update({ passcode_hash: defaultHash, has_custom_passcode: false })
      .eq('id', memberId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  const m = mockStore.members.find((mem) => mem.id === memberId);
  if (m) {
    m.passcode_hash = defaultHash;
    m.has_custom_passcode = false;
  }
  return { success: true };
}

/**
 * Admin Action: Mark a member on leave for a date or date range.
 * Automatically computes working days (excluding weekends & holidays) and creates locked leave submissions.
 */
export async function adminMarkMemberLeaveRange(
  memberId: string,
  startDate: string,
  endDate: string,
  reason?: string
): Promise<ActionResult<{ daysCount: number; dates: string[] }>> {
  if (!(await requireAdminAuth())) {
    return { success: false, error: 'UNAUTHORIZED: Admin authentication required.' };
  }

  if (!memberId || !startDate || !endDate) {
    return { success: false, error: 'Member, Start Date, and End Date are required.' };
  }
  if (startDate > endDate) {
    return { success: false, error: 'Start Date must be before or equal to End Date.' };
  }

  const holidays = await getHolidaysList();
  const holidayDates = holidays.map((h) => h.date);
  const workingDays = getPastWorkingDays(startDate, endDate, holidayDates);

  if (workingDays.length === 0) {
    return {
      success: false,
      error: 'The selected range does not contain any working days (dates fall on weekends or existing holidays).',
    };
  }

  const leaveReason = reason?.trim() || 'Approved Leave / PTO';
  const supabase = getServerSupabaseClient();

  if (supabase) {
    const submissionsToUpsert = workingDays.map((date) => ({
      member_id: memberId,
      date,
      is_locked: true,
      is_on_leave: true,
      leave_reason: leaveReason,
      submitted_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('daily_submissions')
      .upsert(submissionsToUpsert, { onConflict: 'member_id,date' });

    if (error) return { success: false, error: error.message };
    return { success: true, data: { daysCount: workingDays.length, dates: workingDays } };
  }

  // Mock Store
  workingDays.forEach((date) => {
    const existingIdx = mockStore.submissions.findIndex((s) => s.member_id === memberId && s.date === date);
    if (existingIdx >= 0) {
      mockStore.submissions[existingIdx].is_locked = true;
      mockStore.submissions[existingIdx].is_on_leave = true;
      mockStore.submissions[existingIdx].leave_reason = leaveReason;
      mockStore.submissions[existingIdx].submitted_at = new Date().toISOString();
    } else {
      mockStore.submissions.push({
        id: `leave-${Date.now()}-${date}`,
        member_id: memberId,
        date,
        is_locked: true,
        is_on_leave: true,
        leave_reason: leaveReason,
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    }
  });

  return { success: true, data: { daysCount: workingDays.length, dates: workingDays } };
}

/**
 * Admin Action: Fetch list of scheduled member leaves
 */
export async function adminGetMemberLeaves(): Promise<
  (DailySubmission & { member?: Member })[]
> {
  if (!(await requireAdminAuth())) {
    return [];
  }

  const supabase = getServerSupabaseClient();

  if (supabase) {
    const { data } = await supabase
      .from('daily_submissions')
      .select('*, member:members(id, name, role, avatar_color)')
      .eq('is_on_leave', true)
      .order('date', { ascending: false })
      .limit(100);

    return (data || []) as (DailySubmission & { member?: Member })[];
  }

  return mockStore.submissions
    .filter((s) => s.is_on_leave)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((s) => {
      const mem = mockStore.members.find((m) => m.id === s.member_id);
      return { ...s, member: mem };
    });
}

/**
 * Admin Action: Cancel/Delete a scheduled leave submission
 */
export async function adminCancelMemberLeave(submissionId: string): Promise<ActionResult> {
  if (!(await requireAdminAuth())) {
    return { success: false, error: 'UNAUTHORIZED: Admin authentication required.' };
  }

  if (!submissionId) return { success: false, error: 'Submission ID is required.' };

  const supabase = getServerSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from('daily_submissions').delete().eq('id', submissionId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  mockStore.submissions = mockStore.submissions.filter((s) => s.id !== submissionId);
  return { success: true };
}

/**
 * Admin Action: Securely fetch tasks for CSV export
 */
export async function exportAdminCsvData(
  startDate: string,
  endDate: string
): Promise<ActionResult<(DailyTask & { member?: Member; project?: Project | null })[]>> {
  if (!(await requireAdminAuth())) {
    return { success: false, error: 'UNAUTHORIZED: Admin authentication required.' };
  }

  const supabase = getServerSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('daily_tasks')
      .select('*, member:members(*), project:projects(*)')
      .gte('date', startDate)
      .lte('date', endDate)
      .not('hours_spent', 'is', null)
      .order('date', { ascending: true });

    if (error) return { success: false, error: error.message };
    return { success: true, data: (data || []) as (DailyTask & { member?: Member; project?: Project | null })[] };
  }

  const allTasks = mockStore.tasks
    .filter((t) => t.date >= startDate && t.date <= endDate && t.hours_spent !== null && t.hours_spent !== undefined)
    .map((t) => {
      const mem = mockStore.members.find((m) => m.id === t.member_id);
      const proj = mockStore.projects.find((p) => p.id === t.project_id) || null;
      return { ...t, member: mem, project: proj };
    });

  return { success: true, data: allTasks };
}
