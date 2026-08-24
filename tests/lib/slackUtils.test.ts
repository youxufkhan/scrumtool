import { describe, it, expect } from 'vitest';
import { formatSlackStandup } from '@/lib/slackUtils';
import { StandupMemberSummary } from '@/types/database';

describe('slackUtils', () => {
  it('formats daily standup report for Slack with total hours and blocker emojis', () => {
    const summary: StandupMemberSummary[] = [
      {
        member: {
          id: 'm-1',
          name: 'Alex Rivera',
          role: 'Frontend Lead',
          avatar_color: '#3B82F6',
          is_active: true,
          joined_at: '2026-01-01',
          created_at: '',
        },
        submission: {
          id: 's-1',
          member_id: 'm-1',
          date: '2026-08-24',
          is_locked: true,
          is_on_leave: false,
          created_at: '',
        },
        tasks: [
          {
            id: 't-1',
            member_id: 'm-1',
            date: '2026-08-24',
            title: 'Implement daily logger',
            status: 'done',
            hours_spent: 4.5,
            is_ad_hoc: false,
            order_index: 0,
            created_at: '',
            updated_at: '',
            project: { id: 'p-1', name: 'Core App', color: '#3B82F6', is_active: true, created_at: '' },
          },
          {
            id: 't-2',
            member_id: 'm-1',
            date: '2026-08-24',
            title: 'Deploy test branch',
            status: 'blocked',
            hours_spent: 1.5,
            blocker_note: 'Waiting on cloud credentials',
            is_ad_hoc: true,
            order_index: 1,
            created_at: '',
            updated_at: '',
            project: { id: 'p-1', name: 'Infrastructure', color: '#8B5CF6', is_active: true, created_at: '' },
          },
        ],
        totalHours: 6.0,
        isMissingHours: false,
      },
    ];

    const markdown = formatSlackStandup('2026-08-24', summary);

    expect(markdown).toContain('Daily Standup Summary — 2026-08-24');
    expect(markdown).toContain('*Alex Rivera* (6.0 hrs)');
    expect(markdown).toContain('✅ [Done] Implement daily logger (4.5 hrs) [Core App]');
    expect(markdown).toContain('⚠️ [Blocked] [Ad-hoc] Deploy test branch (1.5 hrs) [Infrastructure] — *Blocker: Waiting on cloud credentials*');
  });
});
