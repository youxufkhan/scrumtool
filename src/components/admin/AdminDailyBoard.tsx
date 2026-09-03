'use client';

import React, { useState, useEffect } from 'react';
import { format, parseISO, subDays, addDays } from 'date-fns';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Unlock,
  AlertTriangle,
  Clock,
  CheckCircle,
  Palmtree,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { DailyStandupReport } from '@/types/database';
import { getAdminDailyStandup, unlockSubmission } from '@/app/actions/adminActions';
import { formatSlackStandup } from '@/lib/slackUtils';

interface AdminDailyBoardProps {
  initialDate: string;
}

export function AdminDailyBoard({ initialDate }: AdminDailyBoardProps) {
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [report, setReport] = useState<DailyStandupReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedSlack, setCopiedSlack] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadReport = async (date: string) => {
    setLoading(true);
    setActionMessage(null);
    try {
      const data = await getAdminDailyStandup(date);
      setReport(data);
    } catch (err) {
      console.error('Failed to load standup report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(selectedDate);
  }, [selectedDate]);

  const handleCopySlack = () => {
    if (!report) return;
    const text = formatSlackStandup(selectedDate, report.members);
    navigator.clipboard.writeText(text);
    setCopiedSlack(true);
    setTimeout(() => setCopiedSlack(false), 2500);
  };

  const handleUnlock = async (memberId: string, memberName: string) => {
    if (!confirm(`Unlock standup submission for ${memberName} on ${selectedDate} to allow editing?`)) {
      return;
    }
    try {
      const res = await unlockSubmission(memberId, selectedDate);
      if (res.success) {
        setActionMessage(`Unlocked standup for ${memberName}.`);
        loadReport(selectedDate);
      }
    } catch (err) {
      console.error('Failed to unlock submission', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Date Navigator & Slack Export */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedDate(format(subDays(parseISO(selectedDate), 1), 'yyyy-MM-dd'))}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}</span>
            {report?.isWeekend && (
              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                Weekend
              </span>
            )}
            {report?.holiday && (
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                🌴 {report.holiday.name}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setSelectedDate(format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd'))}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Copy for Slack Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopySlack}
            disabled={!report || report.members.length === 0}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {copiedSlack ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy for Slack / Teams</span>
              </>
            )}
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-indigo-800 dark:text-indigo-300 text-xs font-semibold rounded-2xl">
          {actionMessage}
        </div>
      )}

      {/* KPI Metric Summary Cards */}
      {report && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Total Team Hours</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{report.totalTeamHours.toFixed(1)}</span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">hrs</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Standup Submitted</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {report.submittedMembersCount}/{report.totalMembersCount}
              </span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">members</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Blocked Impeding Tasks</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-2xl font-black ${report.blockedTasksCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                {report.blockedTasksCount}
              </span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">tasks</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Team Status</span>
            <div className="mt-1">
              {report.submittedMembersCount === report.totalMembersCount ? (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-lg inline-block">
                  ✓ 100% Complete
                </span>
              ) : (
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-1 rounded-lg inline-block">
                  ⏳ In Progress
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Member Standup Cards Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm">Loading team standup board...</div>
      ) : !report || report.members.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-sm">
          No team members registered yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.members.map(({ member, submission, tasks, totalHours, isMissingHours }) => {
            const isLocked = Boolean(submission?.is_locked);
            const isOnLeave = Boolean(submission?.is_on_leave);

            return (
              <div
                key={member.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                  isMissingHours
                    ? 'border-amber-300 dark:border-amber-700 ring-2 ring-amber-400/20'
                    : isLocked
                    ? 'border-slate-200 dark:border-slate-800'
                    : 'border-slate-200/80 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/40'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-xs"
                        style={{ backgroundColor: member.avatar_color || '#3B82F6' }}
                      >
                        {member.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{member.name}</h3>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{member.role}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOnLeave ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/60 flex items-center gap-1">
                          <Palmtree className="w-3 h-3" /> On Leave
                        </span>
                      ) : isLocked ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/60 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Locked ({totalHours.toFixed(1)}h)
                        </span>
                      ) : tasks.length > 0 ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pending Hours
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Not Started
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tasks List */}
                  {isOnLeave ? (
                    <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                      🌴 Member recorded as on leave {submission?.leave_reason ? `(${submission.leave_reason})` : ''}
                    </div>
                  ) : tasks.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                      No tasks logged yet for this date.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {task.project && (
                                <span
                                  className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded text-white"
                                  style={{ backgroundColor: task.project.color || '#6366F1' }}
                                >
                                  {task.project.name}
                                </span>
                              )}
                              {task.is_ad_hoc && (
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                                  Ad-hoc
                                </span>
                              )}
                              {task.status === 'done' ? (
                                <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400">✓ Done</span>
                              ) : task.status === 'blocked' ? (
                                <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400">⚠️ Blocked</span>
                              ) : (
                                <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400">🔄 In Progress</span>
                              )}
                            </div>

                            <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] shrink-0">
                              {task.hours_spent !== null && task.hours_spent !== undefined
                                ? `${task.hours_spent}h`
                                : '—'}
                            </span>
                          </div>

                          <p className="font-medium text-slate-900 dark:text-slate-100">{task.title}</p>
                          {task.blocker_note && (
                            <p className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold mt-1 bg-amber-50 dark:bg-amber-950/50 p-1.5 rounded border border-amber-200 dark:border-amber-900/50">
                              Blocker: {task.blocker_note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Admin Action (Unlock) */}
                {isLocked && !isOnLeave && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleUnlock(member.id, member.name)}
                      className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 p-1 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded transition-colors"
                      title="Unlock submission to allow member to make corrections"
                    >
                      <Unlock className="w-3 h-3" />
                      <span>Unlock for Corrections</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
