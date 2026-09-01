import { describe, it, expect, beforeEach } from 'vitest';
import { mockStore } from '@/lib/db';
import {
  checkMemberGate,
  getDailyTasks,
  saveDailyTasks,
  submitAndLockDay,
  carryForwardYesterdayTasks,
  markDayOnLeave,
  verifyMemberPasscode,
  changeMemberPasscode,
  verifyMemberSession,
} from '@/app/actions/standupActions';

describe('standupActions', () => {
  const testMemberId = 'm-1';

  beforeEach(() => {
    mockStore.clear();
    // Reset mock members to default
    const m1 = mockStore.members.find((m) => m.id === testMemberId);
    if (m1) {
      m1.has_custom_passcode = false;
      m1.passcode_hash = '93369f4b5512e84a0d5b1cbd8c54e0aaec37b40a8753fd03c156dd712ce45d50'; // hash('1234')
    }
  });

  it('allows standup when member has no past unsubmitted tasks', async () => {
    const gate = await checkMemberGate(testMemberId, '2026-08-24');
    expect(gate.isBlocked).toBe(false);
    expect(gate.pendingDates).toEqual([]);
  });

  it('blocks today standup when previous working day has unsubmitted tasks', async () => {
    mockStore.tasks.push({
      id: 'task-friday-1',
      member_id: testMemberId,
      date: '2026-08-21',
      title: 'Friday task',
      status: 'in_progress',
      hours_spent: null,
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
    const result = await submitAndLockDay(testMemberId, '2026-08-21', [
      {
        id: 'task-friday-1',
        title: 'Friday task',
        status: 'done',
        hours_spent: 0,
        is_ad_hoc: false,
        order_index: 0,
      },
    ]);

    expect(result.success).toBe(true);

    const gate = await checkMemberGate(testMemberId, '2026-08-24');
    expect(gate.isBlocked).toBe(false);
  });

  it('prevents saving tasks to a locked submission', async () => {
    mockStore.submissions.push({
      id: 'sub-1',
      member_id: testMemberId,
      date: '2026-08-20',
      is_locked: true,
      is_on_leave: false,
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });

    const saveRes = await saveDailyTasks(testMemberId, '2026-08-20', [
      { title: 'Attempted edit after lock' },
    ]);

    expect(saveRes.success).toBe(false);
    expect(saveRes.error).toContain('SUBMISSION_LOCKED');
  });

  it('rejects saving tasks for future dates', async () => {
    const futureDate = '2099-12-31';
    const saveRes = await saveDailyTasks(testMemberId, futureDate, [
      { title: 'Future task' },
    ]);

    expect(saveRes.success).toBe(false);
    expect(saveRes.error).toContain('FUTURE_DATE_NOT_ALLOWED');
  });

  it('copies unfinished tasks from prior working day correctly', async () => {
    mockStore.tasks.push(
      {
        id: 'task-1',
        member_id: testMemberId,
        date: '2026-08-21',
        title: 'Complete OAuth flow',
        status: 'in_progress',
        hours_spent: 4,
        is_ad_hoc: false,
        order_index: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'task-2',
        member_id: testMemberId,
        date: '2026-08-21',
        title: 'Update schema doc',
        status: 'done',
        hours_spent: 2,
        is_ad_hoc: false,
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    );

    const carryRes = await carryForwardYesterdayTasks(testMemberId, '2026-08-24');
    expect(carryRes.success).toBe(true);
    expect(carryRes.copiedCount).toBe(1);

    const todayData = await getDailyTasks(testMemberId, '2026-08-24');
    expect(todayData.tasks.length).toBe(1);
    expect(todayData.tasks[0].title).toBe('Complete OAuth flow');
    expect(todayData.tasks[0].hours_spent).toBeNull();
  });

  describe('member passcode authentication', () => {
    it('authenticates with default passcode 1234 and signals setup is required', async () => {
      const res = await verifyMemberPasscode(testMemberId, '1234');
      expect(res.success).toBe(true);
      expect(res.data?.requiresSetup).toBe(true);
      expect(res.data?.token).toBeDefined();
    });

    it('rejects incorrect 4-digit passcode', async () => {
      const res = await verifyMemberPasscode(testMemberId, '9999');
      expect(res.success).toBe(false);
      expect(res.error).toContain('Incorrect passcode');
    });

    it('rejects malformed passcode strings', async () => {
      const res = await verifyMemberPasscode(testMemberId, '12a');
      expect(res.success).toBe(false);
    });

    it('allows changing passcode and updates custom flag', async () => {
      const changeRes = await changeMemberPasscode(testMemberId, '1234', '5678');
      expect(changeRes.success).toBe(true);
      expect(changeRes.data?.token).toBeDefined();

      // Now 5678 should work and requiresSetup should be false
      const loginRes = await verifyMemberPasscode(testMemberId, '5678');
      expect(loginRes.success).toBe(true);
      expect(loginRes.data?.requiresSetup).toBe(false);

      // Old 1234 should no longer work
      const oldRes = await verifyMemberPasscode(testMemberId, '1234');
      expect(oldRes.success).toBe(false);
    });

    it('validates cached session token and rejects tampered token', async () => {
      const authRes = await verifyMemberPasscode(testMemberId, '1234');
      const validToken = authRes.data!.token;

      const isValid = await verifyMemberSession(testMemberId, validToken);
      expect(isValid).toBe(true);

      const isInvalid = await verifyMemberSession(testMemberId, 'tampered-token-12345');
      expect(isInvalid).toBe(false);
    });
  });
});
