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
} from '@/app/actions/adminActions';

describe('adminActions', () => {
  beforeEach(() => {
    mockStore.clear();
  });

  it('validates admin passcode correctly', async () => {
    const valid = await verifyAdminPasscode('1234');
    expect(valid.success).toBe(true);

    const invalid = await verifyAdminPasscode('wrong-pass');
    expect(invalid.success).toBe(false);
  });

  it('aggregates daily standup report for all members', async () => {
    // Member 1 has submitted tasks
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

    const unlockRes = await unlockSubmission('m-1', '2026-08-24');
    expect(unlockRes.success).toBe(true);

    const sub = mockStore.submissions.find((s) => s.member_id === 'm-1' && s.date === '2026-08-24');
    expect(sub?.is_locked).toBe(false);
  });

  it('computes analytics summary with member and project breakdowns', async () => {
    mockStore.tasks.push({
      id: 't-1',
      member_id: 'm-1',
      project_id: 'p-1',
      date: '2026-08-24',
      title: 'Core task',
      status: 'done',
      hours_spent: 6.0,
      is_ad_hoc: false,
      order_index: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const analytics = await getAdminAnalytics('2026-08-01', '2026-08-31');
    expect(analytics.totalHours).toBe(6.0);
    expect(analytics.totalPlannedHours).toBe(6.0);
    expect(analytics.memberBreakdown.length).toBeGreaterThan(0);
    expect(analytics.projectBreakdown.length).toBeGreaterThan(0);
  });

  it('allows adding and removing holidays', async () => {
    const addRes = await addHoliday('2026-12-25', 'Christmas Day');
    expect(addRes.success).toBe(true);

    const holiday = mockStore.holidays.find((h) => h.date === '2026-12-25');
    expect(holiday?.name).toBe('Christmas Day');

    if (holiday) {
      const delRes = await deleteHoliday(holiday.id);
      expect(delRes.success).toBe(true);
      expect(mockStore.holidays.length).toBe(0);
    }
  });
});
