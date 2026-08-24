import { describe, it, expect, beforeEach } from 'vitest';
import { mockStore } from '@/lib/db';
import {
  checkMemberGate,
  getDailyTasks,
  saveDailyTasks,
  submitAndLockDay,
  carryForwardYesterdayTasks,
  markDayOnLeave,
} from '@/app/actions/standupActions';

describe('standupActions', () => {
  const testMemberId = 'm-1';

  beforeEach(() => {
    mockStore.clear();
  });

  it('allows standup when member has no past unsubmitted tasks', async () => {
    const gate = await checkMemberGate(testMemberId, '2026-08-24');
    expect(gate.isBlocked).toBe(false);
    expect(gate.pendingDates).toEqual([]);
  });

  it('blocks today standup when previous working day has unsubmitted tasks', async () => {
    // Simulate Friday Aug 21 having a task created but not locked/submitted
    mockStore.tasks.push({
      id: 'task-friday-1',
      member_id: testMemberId,
      date: '2026-08-21',
      title: 'Friday task',
      status: 'in_progress',
      hours_spent: null, // missing hours
      is_ad_hoc: false,
      order_index: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const gate = await checkMemberGate(testMemberId, '2026-08-24');
    expect(gate.isBlocked).toBe(true);
    expect(gate.pendingDates).toContain('2026-08-21');
  });

  it('unblocks member after previous day hours are submitted and locked (including 0 hours)', async () => {
    // Submit hours for Friday
    const result = await submitAndLockDay(testMemberId, '2026-08-21', [
      {
        id: 'task-friday-1',
        title: 'Friday task',
        status: 'done',
        hours_spent: 0, // 0 hours is valid!
        is_ad_hoc: false,
        order_index: 0,
      },
    ]);

    expect(result.success).toBe(true);

    const gate = await checkMemberGate(testMemberId, '2026-08-24');
    expect(gate.isBlocked).toBe(false);
  });

  it('enforces immutability: rejects saving tasks on locked dates', async () => {
    // Lock the date
    await submitAndLockDay(testMemberId, '2026-08-24', [
      {
        id: 'task-today-1',
        title: 'Today task',
        status: 'done',
        hours_spent: 5.0,
        is_ad_hoc: false,
        order_index: 0,
      },
    ]);

    // Try to mutate locked date
    const mutateResult = await saveDailyTasks(testMemberId, '2026-08-24', [
      {
        id: 'task-today-1',
        title: 'Hacked task',
        status: 'done',
        hours_spent: 8.0,
      },
    ]);

    expect(mutateResult.success).toBe(false);
    expect(mutateResult.error).toContain('SUBMISSION_LOCKED');
  });

  it('carries forward unfinished tasks from previous working day idempotently', async () => {
    // Setup Friday unfinished task
    mockStore.tasks.push({
      id: 'task-fri-1',
      member_id: testMemberId,
      date: '2026-08-21',
      title: 'Unfinished Friday task',
      status: 'in_progress',
      hours_spent: 2.0,
      is_ad_hoc: false,
      order_index: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    mockStore.submissions.push({
      id: 'sub-fri',
      member_id: testMemberId,
      date: '2026-08-21',
      is_locked: true,
      is_on_leave: false,
      created_at: new Date().toISOString(),
    });

    // Carry forward to Monday Aug 24
    const res1 = await carryForwardYesterdayTasks(testMemberId, '2026-08-24');
    expect(res1.success).toBe(true);
    expect(res1.copiedCount).toBe(1);

    // Calling again should not duplicate
    const res2 = await carryForwardYesterdayTasks(testMemberId, '2026-08-24');
    expect(res2.copiedCount).toBe(0);
  });

  it('allows marking a date as On Leave / PTO to satisfy gate requirements', async () => {
    const leaveRes = await markDayOnLeave(testMemberId, '2026-08-21', 'Sick Leave');
    expect(leaveRes.success).toBe(true);

    const gate = await checkMemberGate(testMemberId, '2026-08-24');
    expect(gate.isBlocked).toBe(false);
  });
});
