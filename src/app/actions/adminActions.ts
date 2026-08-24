'use server';

import crypto from 'crypto';
import { getSupabaseClient, mockStore } from '@/lib/db';
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

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || '1234';

/**
 * Constant-time passcode verification to protect against timing attacks.
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

  // Generate simple token for client state
  const token = crypto.createHash('sha256').update(`${ADMIN_PASSCODE}-${new Date().toDateString()}`).digest('hex');
  return { success: true, data: { token } };
}

/**
 * Aggregates daily standup report for all team members for the specified date.
 */
export async function getAdminDailyStandup(date: string): Promise<DailyStandupReport> {
  const holidays = await getHolidaysList();
  const holiday = holidays.find((h) => h.date === date) || null;
  const weekend = isWeekend(date);

  const supabase = getSupabaseClient();
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
  const supabase = getSupabaseClient();
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
  const supabase = getSupabaseClient();

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

  const memberBreakdown = members.map((m) => {
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
  }).sort((a, b) => b.totalHours - a.totalHours);

  const projectBreakdown = projects.map((p) => {
    const hours = projectMap.get(p.id) || 0;
    const pct = totalHours > 0 ? Number(((hours / totalHours) * 100).toFixed(1)) : 0;
    return {
      projectId: p.id,
      projectName: p.name,
      projectColor: p.color,
      totalHours: Number(hours.toFixed(2)),
      percentage: pct,
    };
  }).sort((a, b) => b.totalHours - a.totalHours);

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
  if (!name || name.trim().length === 0) return { success: false, error: 'Name is required' };

  const color = avatarColor || '#3B82F6';
  const supabase = getSupabaseClient();

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
  if (!name || name.trim().length === 0) return { success: false, error: 'Project name is required' };

  const projColor = color || '#6366F1';
  const supabase = getSupabaseClient();

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
  if (!date || !name) return { success: false, error: 'Date and Holiday Name are required' };

  const supabase = getSupabaseClient();
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
  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from('holidays').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  mockStore.holidays = mockStore.holidays.filter((h) => h.id !== id);
  return { success: true };
}
