import { describe, it, expect } from 'vitest';
import { mockStore, isSupabaseConfigured, getSupabaseClient } from '@/lib/db';

describe('Database Client & Mock Store', () => {
  it('initializes mock store with default members and projects', () => {
    expect(mockStore.members.length).toBeGreaterThan(0);
    expect(mockStore.projects.length).toBeGreaterThan(0);
    expect(mockStore.members[0].name).toBe('Alex Rivera');
    expect(mockStore.projects[0].name).toBe('Core App');
  });

  it('can store and clear in-memory tasks', () => {
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

    expect(mockStore.tasks.length).toBe(1);
    mockStore.clear();
    expect(mockStore.tasks.length).toBe(0);
  });
});
