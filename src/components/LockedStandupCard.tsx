'use client';

import React from 'react';
import { format, parseISO } from 'date-fns';
import { Lock, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { DailyTask, Project, DailySubmission } from '@/types/database';

interface LockedStandupCardProps {
  date: string;
  tasks: (DailyTask & { project?: Project | null })[];
  submission: DailySubmission | null;
  memberName: string;
}

export function LockedStandupCard({ date, tasks, submission, memberName }: LockedStandupCardProps) {
  const totalHours = tasks.reduce((sum, t) => sum + (Number(t.hours_spent) || 0), 0);

  if (submission?.is_on_leave) {
    return (
      <div className="max-w-2xl mx-auto my-6 p-6 sm:p-8 bg-white border border-emerald-200 rounded-3xl shadow-xs text-center">
        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">On Leave / PTO</h2>
        <p className="text-xs text-slate-500 mt-1">
          {memberName} was recorded as on leave on {format(parseISO(date), 'MMMM d, yyyy')}.
        </p>
        {submission.leave_reason && (
          <span className="inline-block mt-3 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-full border border-emerald-100">
            {submission.leave_reason}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto my-6 p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
      {/* Header Badge */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Standup Submitted & Locked</h2>
            <p className="text-xs text-slate-500">
              Submitted on {submission?.submitted_at ? format(parseISO(submission.submitted_at), 'MMM d, yyyy h:mm a') : format(parseISO(date), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 font-semibold block">Total Hours</span>
          <span className="text-lg font-black text-indigo-600">{totalHours.toFixed(1)} hrs</span>
        </div>
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-sm">
          No tasks were recorded for this day.
        </div>
      ) : (
        <div className="space-y-2.5">
          {tasks.map((task) => {
            let statusBadge = (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                In Progress
              </span>
            );
            if (task.status === 'done') {
              statusBadge = (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle className="w-2.5 h-2.5" /> Done
                </span>
              );
            } else if (task.status === 'blocked') {
              statusBadge = (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 flex items-center gap-1">
                  <AlertCircle className="w-2.5 h-2.5" /> Blocked
                </span>
              );
            }

            return (
              <div
                key={task.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {task.project && (
                      <span
                        className="text-[10px] font-bold uppercase px-2 py-0.5 rounded text-white"
                        style={{ backgroundColor: task.project.color || '#6366F1' }}
                      >
                        {task.project.name}
                      </span>
                    )}
                    {task.is_ad_hoc && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                        Ad-hoc
                      </span>
                    )}
                    {statusBadge}
                  </div>
                  <p className="text-sm font-medium text-slate-900">{task.title}</p>
                  {task.blocker_note && (
                    <p className="text-xs text-amber-700 mt-1 font-medium bg-amber-50 p-1.5 rounded-lg border border-amber-100">
                      Blocker: {task.blocker_note}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0 text-xs font-bold text-slate-800 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{task.hours_spent !== null && task.hours_spent !== undefined ? task.hours_spent : 0} hrs</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-6 text-center text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
        🔒 This entry is finalized. If you need to make a correction, please contact your team admin to unlock it.
      </div>
    </div>
  );
}
