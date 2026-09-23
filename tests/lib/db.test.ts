import { describe, it, expect } from 'vitest';
import { mockStore, resetMockStore, isSupabaseConfigured, getSupabaseClient } from '@/lib/db';

describe('Database Client & Mock Store', () => {
  it('initializes mock store with default members and projects', () => {
    expect(mockStore.members.length).toBeGreaterThan(0);
    expect(mockStore.projects.length).toBeGreaterThan(0);
    expect(mockStore.members[0].name).toBe('Alex Rivera');
    expect(mockStore.projects[0].name).toBe('Core App');
    expect(mockStore.memberRoadmaps).toEqual([]);
  });

  it('can store and clear in-memory tasks and roadmaps', () => {
    mockStore.tasks.push({
      id: 'test-task-1',
      member_id: 'm-1',
      date: '2026-08-24',
      title: 'Build task tests',
      status: 'in_progress',
      is_ad_hoc: false,
      order_index: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    mockStore.memberRoadmaps.push({
      id: 'roadmap-1',
      member_id: 'm-1',
      title: 'Senior Frontend Roadmap',
      tech_skills_score: 4,
      soft_skills_score: 4,
      learning_score: 5,
      admin_notes: 'Focus on system design',
      goals_30_days: 'Goal 30',
      goals_60_days: 'Goal 60',
      goals_90_days: 'Goal 90',
      created_at: new Date().toISOString(),
    });

    expect(mockStore.tasks.length).toBe(1);
    expect(mockStore.memberRoadmaps.length).toBe(1);
    mockStore.clear();
    expect(mockStore.tasks.length).toBe(0);
    expect(mockStore.memberRoadmaps.length).toBe(0);
  });

  it('resetMockStore restores default members and clears roadmaps', () => {
    mockStore.members.push({
      id: 'temp-member',
      name: 'Temp Member',
      role: 'Dev',
      avatar_color: '#000',
      is_admin: false,
      is_active: true,
      joined_at: '2026-01-01',
      created_at: new Date().toISOString(),
    });
    mockStore.memberRoadmaps.push({
      id: 'roadmap-2',
      member_id: 'temp-member',
      title: 'Test',
      tech_skills_score: 3,
      soft_skills_score: 3,
      learning_score: 3,
      admin_notes: null,
      goals_30_days: null,
      goals_60_days: null,
      goals_90_days: null,
      created_at: new Date().toISOString(),
    });

    resetMockStore();
    expect(mockStore.members.length).toBe(4);
    expect(mockStore.memberRoadmaps.length).toBe(0);
  });

});
