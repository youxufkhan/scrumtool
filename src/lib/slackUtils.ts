import { StandupMemberSummary } from '@/types/database';

/**
 * Formats daily standup submissions into a clean Slack / MS Teams markdown summary.
 */
export function formatSlackStandup(date: string, membersData: StandupMemberSummary[]): string {
  const header = `📢 *Daily Standup Summary — ${date}*\n`;
  
  if (!membersData || membersData.length === 0) {
    return `${header}\n_No standup entries submitted for this date._`;
  }

  const memberBlocks = membersData.map(({ member, submission, tasks, totalHours }) => {
    if (submission?.is_on_leave) {
      return `👤 *${member.name}*\n  🌴 _On Leave / PTO_ ${submission.leave_reason ? `(${submission.leave_reason})` : ''}`;
    }

    if (!tasks || tasks.length === 0) {
      return `👤 *${member.name}*\n  _No tasks recorded today._`;
    }

    const taskLines = tasks.map((t) => {
      let icon = '🔄';
      let statusLabel = 'In Progress';

      if (t.status === 'done') {
        icon = '✅';
        statusLabel = 'Done';
      } else if (t.status === 'blocked') {
        icon = '⚠️';
        statusLabel = 'Blocked';
      } else if (t.status === 'planned') {
        icon = '📋';
        statusLabel = 'Planned';
      }

      const adHocTag = t.is_ad_hoc ? '[Ad-hoc] ' : '';
      const projectTag = t.project?.name ? ` [${t.project.name}]` : '';
      const hoursText = t.hours_spent !== null && t.hours_spent !== undefined ? ` (${t.hours_spent} hrs)` : '';
      const blockerText = t.blocker_note ? ` — *Blocker: ${t.blocker_note}*` : '';

      return `  - ${icon} [${statusLabel}] ${adHocTag}${t.title}${hoursText}${projectTag}${blockerText}`;
    }).join('\n');

    return `👤 *${member.name}* (${totalHours.toFixed(1)} hrs)\n${taskLines}`;
  });

  return `${header}\n${memberBlocks.join('\n\n')}`;
}
