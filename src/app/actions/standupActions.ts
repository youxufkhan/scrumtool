'use server';

import { getSupabaseClient, mockStore, isSupabaseConfigured } from '@/lib/db';
import { Member, Project, DailyTask, DailySubmission, Holiday, TaskStatus } from '@/types/database';
import { isWeekend, getPastWorkingDays, getPriorWorkingDay, isValidDateString } from '@/lib/dateUtils';
import { subDays, parseISO, format } from 'date-fns';

export interface GateCheckResult {
  isBlocked: boolean;
  pendingDates: string[];
}

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Fetch all active team members
 */
export async function getMembers(): Promise<Member[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (!error && data) return data as Member[];
  }
  return mockStore.members.filter((m) => m.is_active);
}

/**
 * Fetch all active projects
 */
export async function getProjects(): Promise<Project[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (!error && data) return data as Project[];
  }
  return mockStore.projects.filter((p) => p.is_active);
}

/**
 * Fetch all holidays
 */
export async function getHolidaysList(): Promise<Holiday[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.from('holidays').select('*').order('date');
    if (!error && data) return data as Holiday[];
  }
  return mockStore.holidays;
}

/**
 * Checks whether a member is blocked from today's standup due to unsubmitted past working days.
 */
export async function checkMemberGate(memberId: string, clientToday: string): Promise<GateCheckResult> {
  if (!isValidDateString(clientToday)) {
    return { isBlocked: false, pendingDates: [] };
  }

  // 1. Fetch holidays
  const holidays = await getHolidaysList();
  const holidayDates = holidays.map((h) => h.date);

  // 2. Fetch member's joined date (do not check dates before they joined!)
  let joinedAt = '2026-01-01';
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data } = await supabase.from('members').select('joined_at').eq('id', memberId).single();
    if (data?.joined_at) joinedAt = data.joined_at;
  } else {
    const m = mockStore.members.find((mem) => mem.id === memberId);
    if (m?.joined_at) joinedAt = m.joined_at;
  }

  // 3. Scan the past 30 days up to yesterday
  const thirtyDaysAgo = format(subDays(parseISO(clientToday), 30), 'yyyy-MM-dd');
  const scanStartDate = joinedAt > thirtyDaysAgo ? joinedAt : thirtyDaysAgo;
  const yesterday = format(subDays(parseISO(clientToday), 1), 'yyyy-MM-dd');

  if (yesterday < scanStartDate) {
    return { isBlocked: false, pendingDates: [] };
  }

  const pastWorkingDays = getPastWorkingDays(scanStartDate, yesterday, holidayDates);
  if (pastWorkingDays.length === 0) {
    return { isBlocked: false, pendingDates: [] };
  }

  const pendingDates: string[] = [];

  // Check each working day
  if (supabase) {
    // Query submissions and tasks
    const { data: submissions } = await supabase
      .from('daily_submissions')
      .select('date, is_locked, is_on_leave')
      .eq('member_id', memberId)
      .in('date', pastWorkingDays);

    const submissionMap = new Map((submissions || []).map((s) => [s.date, s]));

    const { data: tasks } = await supabase
      .from('daily_tasks')
      .select('date, hours_spent')
      .eq('member_id', memberId)
      .in('date', pastWorkingDays);

    const tasksByDate = new Map<string, { hours_spent: number | null }[]>();
    (tasks || []).forEach((t) => {
      const arr = tasksByDate.get(t.date) || [];
      arr.push(t);
      tasksByDate.set(t.date, arr);
    });

    for (const d of pastWorkingDays) {
      const sub = submissionMap.get(d);
      if (sub?.is_locked || sub?.is_on_leave) {
        continue; // Satisfied
      }

      const dayTasks = tasksByDate.get(d);
      // If tasks exist for that day and either sub is not locked or tasks have null hours -> blocked!
      if (dayTasks && dayTasks.length > 0) {
        const hasMissingHours = dayTasks.some((t) => t.hours_spent === null || t.hours_spent === undefined);
        if (!sub?.is_locked || hasMissingHours) {
          pendingDates.push(d);
        }
      }
    }
  } else {
    // Mock store
    const submissionMap = new Map(
      mockStore.submissions.filter((s) => s.member_id === memberId && pastWorkingDays.includes(s.date)).map((s) => [s.date, s])
    );

    const tasksByDate = new Map<string, DailyTask[]>();
    mockStore.tasks
      .filter((t) => t.member_id === memberId && pastWorkingDays.includes(t.date))
      .forEach((t) => {
        const arr = tasksByDate.get(t.date) || [];
        arr.push(t);
        tasksByDate.set(t.date, arr);
      });

    for (const d of pastWorkingDays) {
      const sub = submissionMap.get(d);
      if (sub?.is_locked || sub?.is_on_leave) continue;

      const dayTasks = tasksByDate.get(d);
      if (dayTasks && dayTasks.length > 0) {
        const hasMissingHours = dayTasks.some((t) => t.hours_spent === null || t.hours_spent === undefined);
        if (!sub?.is_locked || hasMissingHours) {
          pendingDates.push(d);
        }
      }
    }
  }

  return {
    isBlocked: pendingDates.length > 0,
    pendingDates: pendingDates.sort().reverse(),
  };
}

/**
 * Fetch daily tasks and submission status for a member on a given date.
 */
export async function getDailyTasks(memberId: string, date: string): Promise<{
  tasks: (DailyTask & { project?: Project | null })[];
  submission: DailySubmission | null;
  isLocked: boolean;
  holiday: Holiday | null;
  isWeekend: boolean;
}> {
  const holidays = await getHolidaysList();
  const holiday = holidays.find((h) => h.date === date) || null;
  const weekend = isWeekend(date);

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data: subData } = await supabase
      .from('daily_submissions')
      .select('*')
      .eq('member_id', memberId)
      .eq('date', date)
      .maybeSingle();

    const { data: tasksData } = await supabase
      .from('daily_tasks')
      .select('*, project:projects(*)')
      .eq('member_id', memberId)
      .eq('date', date)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });

    const submission = (subData as DailySubmission) || null;
    const isLocked = Boolean(submission?.is_locked || submission?.is_on_leave);

    return {
      tasks: (tasksData || []) as (DailyTask & { project?: Project | null })[],
      submission,
      isLocked,
      holiday,
      isWeekend: weekend,
    };
  }

  // Mock store
  const submission = mockStore.submissions.find((s) => s.member_id === memberId && s.date === date) || null;
  const isLocked = Boolean(submission?.is_locked || submission?.is_on_leave);
  const tasks = mockStore.tasks
    .filter((t) => t.member_id === memberId && t.date === date)
    .sort((a, b) => a.order_index - b.order_index)
    .map((t) => {
      const p = mockStore.projects.find((proj) => proj.id === t.project_id) || null;
      return { ...t, project: p };
    });

  return {
    tasks,
    submission,
    isLocked,
    holiday,
    isWeekend: weekend,
  };
}

/**
 * Saves tasks for a day.
 * Enforces server-side gate check and immutability lock.
 */
export async function saveDailyTasks(
  memberId: string,
  date: string,
  tasks: Partial<DailyTask>[]
): Promise<ActionResult<DailyTask[]>> {
  if (!memberId || !date || !isValidDateString(date)) {
    return { success: false, error: 'Invalid member or date' };
  }

  // 1. Verify lock status
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data: sub } = await supabase
      .from('daily_submissions')
      .select('is_locked, is_on_leave')
      .eq('member_id', memberId)
      .eq('date', date)
      .maybeSingle();

    if (sub?.is_locked || sub?.is_on_leave) {
      return { success: false, error: 'SUBMISSION_LOCKED: This day has already been submitted and locked.' };
    }
  } else {
    const sub = mockStore.submissions.find((s) => s.member_id === memberId && s.date === date);
    if (sub?.is_locked || sub?.is_on_leave) {
      return { success: false, error: 'SUBMISSION_LOCKED: This day has already been submitted and locked.' };
    }
  }

  // 2. Validate tasks bounds
  for (const t of tasks) {
    if (!t.title || t.title.trim().length === 0) {
      return { success: false, error: 'Task title cannot be empty.' };
    }
    if (t.hours_spent !== null && t.hours_spent !== undefined) {
      const h = Number(t.hours_spent);
      if (isNaN(h) || h < 0 || h > 24) {
        return { success: false, error: 'Hours must be between 0 and 24.' };
      }
    }
  }

  // 3. Upsert / Sync tasks
  if (supabase) {
    // Delete removed tasks
    const clientTaskIds = tasks.map((t) => t.id).filter(Boolean) as string[];
    if (clientTaskIds.length > 0) {
      await supabase
        .from('daily_tasks')
        .delete()
        .eq('member_id', memberId)
        .eq('date', date)
        .not('id', 'in', `(${clientTaskIds.join(',')})`);
    } else {
      await supabase.from('daily_tasks').delete().eq('member_id', memberId).eq('date', date);
    }

    // Upsert tasks
    const tasksToUpsert = tasks.map((t, idx) => ({
      id: t.id || crypto.randomUUID(),
      member_id: memberId,
      date,
      title: t.title!.trim(),
      project_id: t.project_id || null,
      status: t.status || 'in_progress',
      hours_spent: t.hours_spent !== undefined ? t.hours_spent : null,
      blocker_note: t.blocker_note || null,
      is_ad_hoc: Boolean(t.is_ad_hoc),
      order_index: idx,
      updated_at: new Date().toISOString(),
    }));

    if (tasksToUpsert.length > 0) {
      const { data, error } = await supabase
        .from('daily_tasks')
        .upsert(tasksToUpsert, { onConflict: 'id' })
        .select();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data: data as DailyTask[] };
    }
    return { success: true, data: [] };
  }

  // Mock Store
  mockStore.tasks = mockStore.tasks.filter((t) => !(t.member_id === memberId && t.date === date));
  const savedTasks: DailyTask[] = tasks.map((t, idx) => ({
    id: t.id || `mock-${Date.now()}-${idx}`,
    member_id: memberId,
    date,
    title: t.title!.trim(),
    project_id: t.project_id || null,
    status: (t.status as TaskStatus) || 'in_progress',
    hours_spent: t.hours_spent !== undefined ? t.hours_spent : null,
    blocker_note: t.blocker_note || null,
    is_ad_hoc: Boolean(t.is_ad_hoc),
    order_index: idx,
    created_at: t.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  mockStore.tasks.push(...savedTasks);
  return { success: true, data: savedTasks };
}

/**
 * Submits hours for a day and locks it against future modification.
 */
export async function submitAndLockDay(
  memberId: string,
  date: string,
  tasks: Partial<DailyTask>[]
): Promise<ActionResult> {
  // First save the tasks
  const saveRes = await saveDailyTasks(memberId, date, tasks);
  if (!saveRes.success) {
    return saveRes;
  }

  // Validate that all tasks have hours entered (0 is valid)
  for (const t of tasks) {
    if (t.hours_spent === null || t.hours_spent === undefined) {
      return { success: false, error: `Please enter hours for "${t.title}" (enter 0 if not worked on).` };
    }
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase
      .from('daily_submissions')
      .upsert(
        {
          member_id: memberId,
          date,
          is_locked: true,
          is_on_leave: false,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: 'member_id,date' }
      );

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  // Mock Store
  const existingSubIdx = mockStore.submissions.findIndex((s) => s.member_id === memberId && s.date === date);
  if (existingSubIdx >= 0) {
    mockStore.submissions[existingSubIdx].is_locked = true;
    mockStore.submissions[existingSubIdx].submitted_at = new Date().toISOString();
  } else {
    mockStore.submissions.push({
      id: `sub-${Date.now()}`,
      member_id: memberId,
      date,
      is_locked: true,
      is_on_leave: false,
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });
  }

  return { success: true };
}

/**
 * Marks a date as On Leave / PTO for a member.
 */
export async function markDayOnLeave(memberId: string, date: string, reason?: string): Promise<ActionResult> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from('daily_submissions').upsert(
      {
        member_id: memberId,
        date,
        is_locked: true,
        is_on_leave: true,
        leave_reason: reason || 'On Leave',
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'member_id,date' }
    );
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  const subIdx = mockStore.submissions.findIndex((s) => s.member_id === memberId && s.date === date);
  if (subIdx >= 0) {
    mockStore.submissions[subIdx].is_locked = true;
    mockStore.submissions[subIdx].is_on_leave = true;
    mockStore.submissions[subIdx].leave_reason = reason || 'On Leave';
  } else {
    mockStore.submissions.push({
      id: `sub-${Date.now()}`,
      member_id: memberId,
      date,
      is_locked: true,
      is_on_leave: true,
      leave_reason: reason || 'On Leave',
      created_at: new Date().toISOString(),
    });
  }
  return { success: true };
}

/**
 * Copies unfinished tasks from previous working day to today.
 */
export async function carryForwardYesterdayTasks(
  memberId: string,
  todayDate: string
): Promise<{ success: boolean; copiedCount: number; error?: string }> {
  const holidays = await getHolidaysList();
  const priorDay = getPriorWorkingDay(todayDate, holidays.map((h) => h.date));

  const supabase = getSupabaseClient();
  if (supabase) {
    // Get prior day unfinished tasks
    const { data: priorTasks } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('member_id', memberId)
      .eq('date', priorDay)
      .neq('status', 'done');

    if (!priorTasks || priorTasks.length === 0) {
      return { success: true, copiedCount: 0 };
    }

    // Get today's existing tasks to avoid duplicates
    const { data: todayTasks } = await supabase
      .from('daily_tasks')
      .select('title')
      .eq('member_id', memberId)
      .eq('date', todayDate);

    const existingTitles = new Set((todayTasks || []).map((t) => t.title.toLowerCase().trim()));
    const tasksToCopy = priorTasks.filter((t) => !existingTitles.has(t.title.toLowerCase().trim()));

    if (tasksToCopy.length === 0) {
      return { success: true, copiedCount: 0 };
    }

    const newTasks = tasksToCopy.map((t, idx) => ({
      id: crypto.randomUUID(),
      member_id: memberId,
      date: todayDate,
      title: t.title,
      project_id: t.project_id,
      status: 'in_progress',
      hours_spent: null,
      blocker_note: t.blocker_note,
      is_ad_hoc: false,
      order_index: (todayTasks?.length || 0) + idx,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('daily_tasks').insert(newTasks);
    if (error) return { success: false, copiedCount: 0, error: error.message };

    return { success: true, copiedCount: newTasks.length };
  }

  // Mock Store
  const priorTasks = mockStore.tasks.filter((t) => t.member_id === memberId && t.date === priorDay && t.status !== 'done');
  const existingTodayTitles = new Set(
    mockStore.tasks.filter((t) => t.member_id === memberId && t.date === todayDate).map((t) => t.title.toLowerCase().trim())
  );

  const tasksToCopy = priorTasks.filter((t) => !existingTodayTitles.has(t.title.toLowerCase().trim()));
  const newTasks: DailyTask[] = tasksToCopy.map((t, idx) => ({
    id: `copy-${Date.now()}-${idx}`,
    member_id: memberId,
    date: todayDate,
    title: t.title,
    project_id: t.project_id,
    status: 'in_progress',
    hours_spent: null,
    blocker_note: t.blocker_note,
    is_ad_hoc: false,
    order_index: mockStore.tasks.filter((x) => x.member_id === memberId && x.date === todayDate).length + idx,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  mockStore.tasks.push(...newTasks);
  return { success: true, copiedCount: newTasks.length };
}
