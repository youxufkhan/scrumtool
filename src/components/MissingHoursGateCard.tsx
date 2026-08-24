'use client';

import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, Clock, CheckCircle2, Palmtree, ArrowRight, Save } from 'lucide-react';
import { DailyTask, Project } from '@/types/database';
import { getDailyTasks, submitAndLockDay, markDayOnLeave } from '@/app/actions/standupActions';

interface MissingHoursGateCardProps {
  memberId: string;
  memberName: string;
  pendingDates: string[];
  onResolved: () => void;
}

export function MissingHoursGateCard({
  memberId,
  memberName,
  pendingDates,
  onResolved,
}: MissingHoursGateCardProps) {
  const [activeDateIndex, setActiveDateIndex] = useState(0);
  const [tasks, setTasks] = useState<(DailyTask & { project?: Project | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentDate = pendingDates[activeDateIndex];

  const loadDateTasks = async (date: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await getDailyTasks(memberId, date);
      setTasks(res.tasks);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load past tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentDate) {
      loadDateTasks(currentDate);
    }
  }, [currentDate, memberId]);

  const handleHourChange = (taskId: string, val: string) => {
    const num = val === '' ? null : parseFloat(val);
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, hours_spent: num } : t))
    );
  };

  const handleStatusChange = (taskId: string, status: DailyTask['status']) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );
  };

  const handleSubmitPastDay = async () => {
    // Validate that all tasks have hours (0 is allowed)
    for (const t of tasks) {
      if (t.hours_spent === null || t.hours_spent === undefined || isNaN(t.hours_spent)) {
        setErrorMessage(`Please enter hours for "${t.title}" (enter 0 if you did not work on it).`);
        return;
      }
      if (t.hours_spent < 0 || t.hours_spent > 24) {
        setErrorMessage(`Hours must be between 0 and 24.`);
        return;
      }
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await submitAndLockDay(memberId, currentDate, tasks);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to submit hours.');
        setSubmitting(false);
        return;
      }

      // Check if there are more pending dates
      if (activeDateIndex < pendingDates.length - 1) {
        setActiveDateIndex((prev) => prev + 1);
      } else {
        onResolved();
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error submitting hours.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkLeave = async () => {
    if (!confirm(`Mark ${format(parseISO(currentDate), 'MMMM d, yyyy')} as On Leave / PTO?`)) {
      return;
    }
    setSubmitting(true);
    try {
      const res = await markDayOnLeave(memberId, currentDate, 'On Leave / PTO');
      if (res.success) {
        if (activeDateIndex < pendingDates.length - 1) {
          setActiveDateIndex((prev) => prev + 1);
        } else {
          onResolved();
        }
      } else {
        setErrorMessage(res.error || 'Failed to mark leave.');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to mark leave.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalHours = tasks.reduce((sum, t) => sum + (Number(t.hours_spent) || 0), 0);

  return (
    <div className="max-w-2xl mx-auto my-8 p-6 sm:p-8 bg-white border-2 border-amber-300 rounded-3xl shadow-lg animate-in fade-in slide-in-from-bottom-3 duration-200">
      {/* Banner */}
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Missing Hours Required</h2>
          <p className="text-sm text-slate-600 mt-1">
            Hi <strong>{memberName}</strong>, you have unsubmitted hours from{' '}
            <strong className="text-amber-800">
              {pendingDates.length} previous working day{pendingDates.length > 1 ? 's' : ''}
            </strong>
            . Please log your hours below to unlock today&apos;s standup.
          </p>
        </div>
      </div>

      {/* Date Progress Pills */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {pendingDates.map((date, idx) => {
          const isSelected = idx === activeDateIndex;
          const isCompleted = idx < activeDateIndex;

          return (
            <button
              key={date}
              onClick={() => setActiveDateIndex(idx)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isSelected
                  ? 'bg-amber-500 text-white shadow-xs'
                  : isCompleted
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              <span>{format(parseISO(date), 'EEE, MMM d')}</span>
            </button>
          );
        })}
      </div>

      {/* Task List for Current Pending Date */}
      <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 mb-6">
        <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
          <div>
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Logging Hours For</span>
            <h3 className="font-bold text-slate-900 text-base">
              {currentDate && format(parseISO(currentDate), 'EEEE, MMMM d, yyyy')}
            </h3>
          </div>

          <button
            onClick={handleMarkLeave}
            className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-white hover:bg-indigo-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Palmtree className="w-3.5 h-3.5 text-emerald-600" />
            <span>I Was On Leave</span>
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-slate-400 text-sm">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            No tasks recorded for this day. Click submit below to confirm 0 hours or mark as leave.
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
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
                  </div>
                  <p className="font-semibold text-slate-900 text-sm">{task.title}</p>
                </div>

                {/* Status Toggle & Hours Input */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value as DailyTask['status'])}
                    className="text-xs font-semibold border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="done">✅ Done</option>
                    <option value="in_progress">🔄 In Progress</option>
                    <option value="blocked">⚠️ Blocked</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      max="24"
                      placeholder="0.0"
                      value={task.hours_spent !== null && task.hours_spent !== undefined ? task.hours_spent : ''}
                      onChange={(e) => handleHourChange(task.id, e.target.value)}
                      className="w-16 text-center text-xs font-bold border border-slate-200 rounded-lg py-1.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                    <span className="text-xs text-slate-400 font-medium">hrs</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total for day */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-semibold">
          <span>Day Total:</span>
          <span className="text-sm font-bold text-slate-900">{totalHours.toFixed(1)} hrs</span>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleSubmitPastDay}
        disabled={submitting || loading}
        className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
      >
        {submitting ? (
          <span>Saving & Locking...</span>
        ) : activeDateIndex < pendingDates.length - 1 ? (
          <>
            <Save className="w-4 h-4" />
            <span>Save & Proceed to Next Day</span>
            <ArrowRight className="w-4 h-4" />
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Submit & Unlock Today&apos;s Standup</span>
          </>
        )}
      </button>
    </div>
  );
}
