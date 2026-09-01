import { describe, it, expect, beforeEach } from 'vitest';
import { mockStore } from '@/lib/db';
import {
  verifyAdminPasscode,
  getAdminDailyStandup,
  getAdminAnalytics,
  unlockSubmission,
  addMember,
  addProject,
  addHoliday,
  deleteHoliday,
  adminResetMemberPasscode,
  adminMarkMemberLeaveRange,
  adminGetMemberLeaves,
  adminCancelMemberLeave,
} from '@/app/actions/adminActions';
import { verifyMemberPasscode, changeMemberPasscode, checkMemberGate } from '@/app/actions/standupActions';

describe('adminActions', () => {
  beforeEach(() => {
    mockStore.clear();
    mockStore.members.forEach((m) => {
      m.has_custom_passcode = false;
      m.passcode_hash = '93369f4b5512e84a0d5b1cbd8c54e0aaec37b40a8753fd03c156dd712ce45d50';
    });
  });

  it('validates admin passcode correctly', async () => {
    const valid = await verifyAdminPasscode('1234');
    expect(valid.success).toBe(true);

    const invalid = await verifyAdminPasscode('wrong-pass');
    expect(invalid.success).toBe(false);
  });

  it('aggregates daily standup report for all members', async () => {
    mockStore.tasks.push({
      id: 't-1',
      member_id: 'm-1',
      date: '2026-08-24',
      title: 'Setup infrastructure',
      status: 'done',
      hours_spent: 4.0,
      is_ad_hoc: false,
      order_index: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    mockStore.submissions.push({
      id: 'sub-1',
      member_id: 'm-1',
      date: '2026-08-24',
      is_locked: true,
      is_on_leave: false,
      created_at: new Date().toISOString(),
    });

    const report = await getAdminDailyStandup('2026-08-24');
    expect(report.totalTeamHours).toBe(4.0);
    expect(report.submittedMembersCount).toBe(1);
    expect(report.totalMembersCount).toBe(mockStore.members.length);
  });

  it('allows admin to unlock a member locked submission for corrections', async () => {
    mockStore.submissions.push({
      id: 'sub-1',
      member_id: 'm-1',
      date: '2026-08-24',
      is_locked: true,
      is_on_leave: false,
      created_at: new Date().toISOString(),
    });

    const res = await unlockSubmission('m-1', '2026-08-24');
    expect(res.success).toBe(true);

    const sub = mockStore.submissions.find((s) => s.member_id === 'm-1' && s.date === '2026-08-24');
    expect(sub?.is_locked).toBe(false);
  });

  it('allows admin to reset a member passcode back to 1234', async () => {
    // 1. User changes PIN to 8888
    await changeMemberPasscode('m-1', '1234', '8888');
    const auth8888 = await verifyMemberPasscode('m-1', '8888');
    expect(auth8888.success).toBe(true);
    expect(auth8888.data?.requiresSetup).toBe(false);

    // 2. Admin resets PIN
    const resetRes = await adminResetMemberPasscode('m-1');
    expect(resetRes.success).toBe(true);

    // 3. 1234 works again and requires setup
    const auth1234 = await verifyMemberPasscode('m-1', '1234');
    expect(auth1234.success).toBe(true);
    expect(auth1234.data?.requiresSetup).toBe(true);

    // 4. Old 8888 no longer works
    const oldAuth = await verifyMemberPasscode('m-1', '8888');
    expect(oldAuth.success).toBe(false);
  });

  it('allows admin to mark a member on leave across a date range excluding weekends', async () => {
    // Friday Aug 21, 2026 to Tuesday Aug 25, 2026
    // Working days: Friday Aug 21, Monday Aug 24, Tuesday Aug 25 (3 working days, Sat/Sun skipped)
    const leaveRes = await adminMarkMemberLeaveRange('m-1', '2026-08-21', '2026-08-25', 'Annual Vacation');
    expect(leaveRes.success).toBe(true);
    expect(leaveRes.data?.daysCount).toBe(3);
    expect(leaveRes.data?.dates).toEqual(['2026-08-21', '2026-08-24', '2026-08-25']);

    // Check that submissions are locked and marked as leave
    const leaves = await adminGetMemberLeaves();
    expect(leaves.length).toBe(3);
    expect(leaves[0].is_on_leave).toBe(true);

    // Member gate check should be exempt
    const gate = await checkMemberGate('m-1', '2026-08-26');
    expect(gate.isBlocked).toBe(false);
  });

  it('allows admin to cancel a scheduled leave', async () => {
    await adminMarkMemberLeaveRange('m-1', '2026-08-24', '2026-08-24', 'Sick Leave');
    const leaves = await adminGetMemberLeaves();
    expect(leaves.length).toBe(1);

    const cancelRes = await adminCancelMemberLeave(leaves[0].id);
    expect(cancelRes.success).toBe(true);

    const leavesAfter = await adminGetMemberLeaves();
    expect(leavesAfter.length).toBe(0);
  });
});
