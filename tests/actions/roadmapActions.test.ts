import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveMemberRoadmap, getMemberRoadmapHistory, getActiveRoadmap } from '@/app/actions/roadmapActions';
import { mockStore, resetMockStore } from '@/lib/db';
import { clearTestCookies } from '@/lib/authUtils';
import { verifyMemberPasscode } from '@/app/actions/standupActions';
import * as serverDb from '@/lib/serverDb';

describe('Roadmap Actions', () => {
  beforeEach(() => {
    resetMockStore();
    clearTestCookies();
    mockStore.members.push(
      {
        id: 'admin-1',
        name: 'Admin',
        is_admin: true,
        is_active: true,
        passcode_hash: '93369f4b5512e84a0d5b1cbd8c54e0aaec37b40a8753fd03c156dd712ce45d50',
        has_custom_passcode: false,
        role: 'Admin',
        avatar_color: '#000',
        joined_at: '2025-01-01',
        created_at: '2025-01-01',
      },
      {
        id: 'member-1',
        name: 'Member 1',
        is_admin: false,
        is_active: true,
        passcode_hash: '93369f4b5512e84a0d5b1cbd8c54e0aaec37b40a8753fd03c156dd712ce45d50',
        has_custom_passcode: false,
        role: 'Eng',
        avatar_color: '#000',
        joined_at: '2025-01-01',
        created_at: '2025-01-01',
      },
      {
        id: 'member-2',
        name: 'Member 2',
        is_admin: false,
        is_active: true,
        passcode_hash: '93369f4b5512e84a0d5b1cbd8c54e0aaec37b40a8753fd03c156dd712ce45d50',
        has_custom_passcode: false,
        role: 'Designer',
        avatar_color: '#111',
        joined_at: '2025-01-01',
        created_at: '2025-01-01',
      }
    );
  });

  it('allows admin to save a roadmap and the newest one becomes active', async () => {
    await verifyMemberPasscode('admin-1', '1234');

    const res1 = await saveMemberRoadmap({
      member_id: 'member-1',
      title: 'V1',
      tech_skills_score: 5,
      soft_skills_score: 4,
      learning_score: 3,
      admin_notes: 'Notes',
      goals_30_days: '30',
      goals_60_days: '60',
      goals_90_days: '90',
    });
    expect(res1.success).toBe(true);

    const active1 = await getActiveRoadmap('member-1');
    expect(active1?.title).toBe('V1');

    const res2 = await saveMemberRoadmap({
      member_id: 'member-1',
      title: 'V2',
      tech_skills_score: 5,
      soft_skills_score: 4,
      learning_score: 3,
      admin_notes: 'Notes 2',
      goals_30_days: '30',
      goals_60_days: '60',
      goals_90_days: '90',
    });
    expect(res2.success).toBe(true);

    const history = await getMemberRoadmapHistory('member-1');
    expect(history.length).toBe(2);
    const active2 = await getActiveRoadmap('member-1');
    expect(active2?.title).toBe('V2');
    expect(history[0].title).toBe('V2');
  });

  it('rejects saving roadmap when user is unauthenticated or not an admin', async () => {
    // Unauthenticated
    clearTestCookies();
    const resUnauth = await saveMemberRoadmap({
      member_id: 'member-1',
      title: 'Unauthorized Roadmap',
      tech_skills_score: 5,
      soft_skills_score: 4,
      learning_score: 3,
      admin_notes: 'Should fail',
      goals_30_days: '30',
      goals_60_days: '60',
      goals_90_days: '90',
    });
    expect(resUnauth.success).toBe(false);
    expect(resUnauth.error).toBe('Unauthorized: admin access required');

    // Authenticated as non-admin member
    await verifyMemberPasscode('member-1', '1234');
    const resMember = await saveMemberRoadmap({
      member_id: 'member-1',
      title: 'Unauthorized Member Roadmap',
      tech_skills_score: 5,
      soft_skills_score: 4,
      learning_score: 3,
      admin_notes: 'Should fail',
      goals_30_days: '30',
      goals_60_days: '60',
      goals_90_days: '90',
    });
    expect(resMember.success).toBe(false);
    expect(resMember.error).toBe('Unauthorized: admin access required');
  });

  it('rejects fetching roadmap history when user is unauthenticated or not an admin', async () => {
    // Setup a roadmap first as admin
    await verifyMemberPasscode('admin-1', '1234');
    await saveMemberRoadmap({
      member_id: 'member-1',
      title: 'Roadmap History Test',
      tech_skills_score: 4,
      soft_skills_score: 4,
      learning_score: 4,
      admin_notes: 'Notes',
      goals_30_days: '30',
      goals_60_days: '60',
      goals_90_days: '90',
    });

    // Unauthenticated
    clearTestCookies();
    const historyUnauth = await getMemberRoadmapHistory('member-1');
    expect(historyUnauth).toEqual([]);

    // Authenticated as non-admin member
    await verifyMemberPasscode('member-1', '1234');
    const historyMember = await getMemberRoadmapHistory('member-1');
    expect(historyMember).toEqual([]);

    // Authenticated as admin
    await verifyMemberPasscode('admin-1', '1234');
    const historyAdmin = await getMemberRoadmapHistory('member-1');
    expect(historyAdmin.length).toBe(1);
    expect(historyAdmin[0].title).toBe('Roadmap History Test');
  });

  it('enforces access control on getActiveRoadmap', async () => {
    // Save roadmap as admin
    await verifyMemberPasscode('admin-1', '1234');
    await saveMemberRoadmap({
      member_id: 'member-1',
      title: 'Active Roadmap Test',
      tech_skills_score: 5,
      soft_skills_score: 5,
      learning_score: 5,
      admin_notes: 'Secret admin notes',
      goals_30_days: '30',
      goals_60_days: '60',
      goals_90_days: '90',
    });

    // Unauthenticated -> null
    clearTestCookies();
    const unauth = await getActiveRoadmap('member-1');
    expect(unauth).toBeNull();

    // Another non-admin member -> null
    await verifyMemberPasscode('member-2', '1234');
    const otherMember = await getActiveRoadmap('member-1');
    expect(otherMember).toBeNull();

    // The member themselves -> can view their active roadmap
    await verifyMemberPasscode('member-1', '1234');
    const memberSelf = await getActiveRoadmap('member-1');
    expect(memberSelf?.title).toBe('Active Roadmap Test');

    // Admin -> can view any member active roadmap
    await verifyMemberPasscode('admin-1', '1234');
    const adminView = await getActiveRoadmap('member-1');
    expect(adminView?.title).toBe('Active Roadmap Test');
  });

  // Supabase query builder stub: awaiting the chain gives the list result, maybeSingle() the single-row result.
  const mockSupabase = (list: { data: any; error: any }, single: { data: any; error: any }) => {
    const chain: any = {
      eq: () => chain,
      order: () => chain,
      limit: () => chain,
      maybeSingle: () => Promise.resolve(single),
      then: (resolve: any, reject: any) => Promise.resolve(list).then(resolve, reject),
    };
    const members = {
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: {
                passcode_hash: '93369f4b5512e84a0d5b1cbd8c54e0aaec37b40a8753fd03c156dd712ce45d50',
                has_custom_passcode: false,
                is_admin: true,
              },
              error: null,
            }),
        }),
      }),
    };
    return {
      from: vi.fn((table: string) =>
        table === 'members'
          ? members
          : { insert: vi.fn(() => Promise.resolve({ error: null })), select: () => chain }
      ),
    };
  };

  it('handles Supabase client branch correctly when Supabase is configured', async () => {
    await verifyMemberPasscode('admin-1', '1234');

    const fakeRow = {
      id: 'roadmap-db-1',
      member_id: 'member-1',
      title: 'DB Roadmap',
      tech_skills_score: 5,
      soft_skills_score: 4,
      learning_score: 3,
      admin_notes: 'DB notes',
      goals_30_days: '30',
      goals_60_days: '60',
      goals_90_days: '90',
      created_at: new Date().toISOString(),
    };

    const spy = vi
      .spyOn(serverDb, 'getServerSupabaseClient')
      .mockReturnValue(mockSupabase({ data: [fakeRow], error: null }, { data: fakeRow, error: null }) as any);

    const { id, created_at, ...input } = fakeRow;
    const saveRes = await saveMemberRoadmap(input);
    expect(saveRes.success).toBe(true);

    expect(await getMemberRoadmapHistory('member-1')).toEqual([fakeRow]);
    expect(await getActiveRoadmap('member-1')).toEqual(fakeRow);

    spy.mockRestore();
  });

  it('surfaces Supabase read errors instead of returning empty results', async () => {
    await verifyMemberPasscode('admin-1', '1234');
    const dbError = { data: null, error: { message: 'relation "member_roadmaps" does not exist' } };
    const spy = vi.spyOn(serverDb, 'getServerSupabaseClient').mockReturnValue(mockSupabase(dbError, dbError) as any);

    await expect(getMemberRoadmapHistory('member-1')).rejects.toThrow('does not exist');
    await expect(getActiveRoadmap('member-1')).rejects.toThrow('does not exist');

    spy.mockRestore();
  });
});
