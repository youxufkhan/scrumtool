import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockStore } from '@/lib/db';
import * as serverDb from '@/lib/serverDb';
import { clearTestCookies } from '@/lib/authUtils';
import {
  getAdminDailyStandup,
  getAdminWeeklyStandup,
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
  exportAdminCsvData,
  exportDatabaseBackup,
} from '@/app/actions/adminActions';
import { verifyMemberPasscode, changeMemberPasscode, checkMemberGate, memberLogout } from '@/app/actions/standupActions';

describe('adminActions', () => {
  beforeEach(() => {
    mockStore.clear();
    clearTestCookies();
    mockStore.members.forEach((m) => {
      m.has_custom_passcode = false;
      m.passcode_hash = '93369f4b5512e84a0d5b1cbd8c54e0aaec37b40a8753fd03c156dd712ce45d50';
    });
  });

  it('grants admin access to members with is_admin flag', async () => {
    // No login performed
    await expect(getAdminDailyStandup('2026-08-24')).rejects.toThrow('UNAUTHORIZED');

    // Login as admin member (Alex Rivera, m-1)
    const loginRes = await verifyMemberPasscode('m-1', '1234');
    expect(loginRes.success).toBe(true);

    // Should now succeed
    const addMemRes = await addMember('New Admin Member', 'Engineer');
    expect(addMemRes.success).toBe(true);
  });

  it('aggregates daily standup report for all members after login', async () => {
    await verifyMemberPasscode('m-1', '1234');

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

  it('aggregates one report per working day for a weekly export', async () => {
    await verifyMemberPasscode('m-1', '1234');

    mockStore.tasks.push(
      {
        id: 't-mon',
        member_id: 'm-1',
        date: '2026-08-17',
        title: 'Plan sprint work',
        status: 'done',
        hours_spent: 2,
        is_ad_hoc: false,
        order_index: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 't-tue',
        member_id: 'm-2',
        date: '2026-08-18',
        title: 'Review pull requests',
        status: 'done',
        hours_spent: 3,
        is_ad_hoc: false,
        order_index: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    );

    const reports = await getAdminWeeklyStandup('2026-08-17', '2026-08-23');

    expect(reports.map((report) => report.date)).toEqual([
      '2026-08-17',
      '2026-08-18',
      '2026-08-19',
      '2026-08-20',
      '2026-08-21',
    ]);
    expect(reports[0].totalTeamHours).toBe(2);
    expect(reports[1].totalTeamHours).toBe(3);
  });

  it('allows admin to unlock a member locked submission for corrections', async () => {
    await verifyMemberPasscode('m-1', '1234');

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
    await changeMemberPasscode('m-2', '1234', '8888');
    const auth8888 = await verifyMemberPasscode('m-2', '8888');
    expect(auth8888.success).toBe(true);
    expect(auth8888.data?.requiresSetup).toBe(false);

    // 2. Admin resets PIN (must be logged in as admin)
    await verifyMemberPasscode('m-1', '1234');
    const resetRes = await adminResetMemberPasscode('m-2');
    expect(resetRes.success).toBe(true);

    // 3. 1234 works again and requires setup
    const auth1234 = await verifyMemberPasscode('m-2', '1234');
    expect(auth1234.success).toBe(true);
    expect(auth1234.data?.requiresSetup).toBe(true);

    // 4. Old 8888 no longer works
    const oldAuth = await verifyMemberPasscode('m-2', '8888');
    expect(oldAuth.success).toBe(false);
  });

  it('allows admin to mark a member on leave across a date range excluding weekends', async () => {
    await verifyMemberPasscode('m-1', '1234');

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
    await verifyMemberPasscode('m-1', '1234');

    await adminMarkMemberLeaveRange('m-1', '2026-08-24', '2026-08-24', 'Sick Leave');
    const leaves = await adminGetMemberLeaves();
    expect(leaves.length).toBe(1);

    const cancelRes = await adminCancelMemberLeave(leaves[0].id);
    expect(cancelRes.success).toBe(true);

    const leavesAfter = await adminGetMemberLeaves();
    expect(leavesAfter.length).toBe(0);
  });

  it('clears admin session on logout', async () => {
    await verifyMemberPasscode('m-1', '1234');
    const reportBefore = await getAdminDailyStandup('2026-08-24');
    expect(reportBefore).toBeDefined();

    await memberLogout();
    await expect(getAdminDailyStandup('2026-08-24')).rejects.toThrow('UNAUTHORIZED');
  });

  it('allows an admin to export a full database backup and rejects unauthenticated users', async () => {
    // 1. Unauthenticated user is rejected
    const unauthRes = await exportDatabaseBackup();
    expect(unauthRes.success).toBe(false);
    expect(unauthRes.error).toBe('UNAUTHORIZED');

    // 2. Non-admin user is rejected
    await verifyMemberPasscode('m-2', '1234');
    const nonAdminRes = await exportDatabaseBackup();
    expect(nonAdminRes.success).toBe(false);
    expect(nonAdminRes.error).toBe('UNAUTHORIZED');

    // 3. Admin user succeeds and receives complete database dump
    await verifyMemberPasscode('m-1', '1234');
    mockStore.tasks.push({
      id: 't-backup-1',
      member_id: 'm-1',
      date: '2026-08-24',
      title: 'Database backup test task',
      status: 'done',
      hours_spent: 2.5,
      is_ad_hoc: false,
      order_index: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const res = await exportDatabaseBackup();
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.data.timestamp).toBeDefined();
    expect(res.data.data).toBeDefined();
    expect(res.data.data.members).toEqual(mockStore.members);
    expect(res.data.data.projects).toEqual(mockStore.projects);
    expect(res.data.data.daily_submissions).toEqual(mockStore.submissions);
    expect(res.data.data.daily_tasks).toEqual(mockStore.tasks);
    expect(res.data.data.holidays).toEqual(mockStore.holidays);
  });

  it('returns an error if any table query fails during database backup', async () => {
    await verifyMemberPasscode('m-1', '1234');

    const mockSupabase = {
      from: (table: string) => ({
        select: (fields?: string) => {
          if (fields === 'is_admin') {
            return {
              eq: () => ({
                single: async () => ({ data: { is_admin: true }, error: null }),
              }),
            };
          }
          if (fields === 'passcode_hash, has_custom_passcode') {
            return {
              eq: () => ({
                single: async () => ({
                  data: {
                    passcode_hash: '93369f4b5512e84a0d5b1cbd8c54e0aaec37b40a8753fd03c156dd712ce45d50',
                    has_custom_passcode: false,
                  },
                  error: null,
                }),
              }),
            };
          }
          if (table === 'daily_tasks') {
            return Promise.resolve({ data: null, error: { message: 'Database connection timeout on tasks table' } });
          }
          return Promise.resolve({ data: [], error: null });
        },
      }),
    };

    const spy = vi.spyOn(serverDb, 'getServerSupabaseClient').mockReturnValue(mockSupabase as any);

    const res = await exportDatabaseBackup();
    expect(res.success).toBe(false);
    expect(res.error).toBe('Database connection timeout on tasks table');

    spy.mockRestore();
  });
});

