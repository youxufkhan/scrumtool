'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, CheckCircle2, Clock, Copy, AlertCircle, Sparkles, Lock, Save, ChevronDown } from 'lucide-react';
import { DailyTask, Project, TaskStatus } from '@/types/database';
import { saveDailyTasks, submitAndLockDay, carryForwardYesterdayTasks, getDailyTasks } from '@/app/actions/standupActions';

interface DailyStandupLoggerProps {
  memberId: string;
  memberName: string;
  date: string;
  initialTasks: (DailyTask & { project?: Project | null })[];
  projects: Project[];
  onSaved?: () => void;
  onLocked?: () => void;
}

export function DailyStandupLogger({
  memberId,
  memberName,
  date,
  initialTasks,
  projects,
  onSaved,
  onLocked,
}: DailyStandupLoggerProps) {
  const [tasks, setTasks] = useState<(DailyTask & { project?: Project | null })[]>(initialTasks);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isAdHoc, setIsAdHoc] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [copyingYesterday, setCopyingYesterday] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Quick Add Task
  const handleAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;

    const newTask: DailyTask & { project?: Project | null } = {
      id: crypto.randomUUID(),
      member_id: memberId,
      date,
      title: trimmed,
      project_id: selectedProjectId || null,
      status: 'in_progress',
      hours_spent: null,
      is_ad_hoc: isAdHoc,
      blocker_note: null,
      order_index: tasks.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [...tasks, newTask];
    setTasks(updated);
    setNewTaskTitle('');
    setIsAdHoc(false);

    // Auto-save draft
    saveDraft(updated);

    // Re-focus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleDeleteTask = (index: number) => {
    const updated = tasks.filter((_, i) => i !== index);
    setTasks(updated);
    saveDraft(updated);
  };

  const handleUpdateTaskField = (index: number, field: keyof DailyTask, val: unknown) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], [field]: val };
    setTasks(updated);
  };

  const saveDraft = async (tasksToSave: Partial<DailyTask>[]) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await saveDailyTasks(memberId, date, tasksToSave);
      if (!res.success) {
        setMessage({ text: res.error || 'Failed to save changes.', type: 'error' });
      }
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : 'Error saving draft.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyYesterday = async () => {
    setCopyingYesterday(true);
    setMessage(null);
    try {
      const res = await carryForwardYesterdayTasks(memberId, date);
      if (res.success) {
        if (res.copiedCount > 0) {
          setMessage({ text: `Copied ${res.copiedCount} unfinished task(s) from previous working day!`, type: 'success' });
          const dayData = await getDailyTasks(memberId, date);
          setTasks(dayData.tasks);
          onSaved?.();
        } else {
          setMessage({ text: 'No unfinished tasks to copy from previous working day.', type: 'success' });
        }
      } else {
        setMessage({ text: res.error || 'Failed to copy tasks.', type: 'error' });
      }
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : 'Error copying tasks.', type: 'error' });
    } finally {
      setCopyingYesterday(false);
    }
  };

  const handleSubmitAndLock = async () => {
    if (tasks.length === 0) {
      setMessage({ text: 'Please add at least one task before submitting standup.', type: 'error' });
      return;
    }

    // Validate that hours are specified (0 is fine)
    for (const t of tasks) {
      if (t.hours_spent === null || t.hours_spent === undefined || isNaN(t.hours_spent)) {
        setMessage({
          text: `Please enter hours spent for task "${t.title}". Enter 0 if you did not work on it today.`,
          type: 'error',
        });
        return;
      }
      if (t.hours_spent < 0 || t.hours_spent > 24) {
        setMessage({ text: 'Task hours must be between 0 and 24.', type: 'error' });
        return;
      }
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await submitAndLockDay(memberId, date, tasks);
      if (res.success) {
        onLocked?.();
      } else {
        setMessage({ text: res.error || 'Failed to submit and lock hours.', type: 'error' });
      }
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : 'Error submitting standup.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const totalHours = tasks.reduce((sum, t) => sum + (Number(t.hours_spent) || 0), 0);

  return (
    <div className="space-y-4">
      {/* Alert Banner */}
      {message && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-medium flex items-center justify-between shadow-2xs ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
              : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900/60'
          }`}
        >
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Quick Carry Forward Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Today&apos;s Standup Tasks</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Plan tasks in the morning; log hours in the evening.</p>
        </div>

        <button
          type="button"
          onClick={handleCopyYesterday}
          disabled={copyingYesterday}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-100 dark:border-indigo-800/60 transition-colors disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>{copyingYesterday ? 'Copying...' : 'Copy Unfinished Tasks from Yesterday'}</span>
        </button>
      </div>

      {/* Rapid Task Input Bar */}
      <form
        onSubmit={handleAddTask}
        className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900/80 focus-within:border-indigo-600 dark:focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 shadow-sm transition-all"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a task and press Enter... (e.g. Implement payment webhook)"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="flex-1 px-3 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent focus:outline-hidden"
          />

          <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
            {/* Project Picker */}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="">No Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Ad-hoc Toggle */}
            <button
              type="button"
              onClick={() => setIsAdHoc(!isAdHoc)}
              className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isAdHoc
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {isAdHoc ? '✓ Ad-hoc' : '+ Ad-hoc'}
            </button>

            {/* Add Button */}
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </form>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.map((task, idx) => {
          return (
            <div
              key={task.id || idx}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-slate-300 dark:hover:border-slate-700"
            >
              {/* Task Title & Project Tag */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  {/* Project Selector */}
                  <select
                    value={task.project_id || ''}
                    onChange={(e) => handleUpdateTaskField(idx, 'project_id', e.target.value || null)}
                    className="text-[11px] font-bold uppercase rounded-lg px-2 py-0.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden"
                  >
                    <option value="">No Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  {task.is_ad_hoc && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50">
                      Ad-hoc
                    </span>
                  )}
                </div>

                <input
                  type="text"
                  value={task.title || ''}
                  onChange={(e) => handleUpdateTaskField(idx, 'title', e.target.value)}
                  className="w-full text-sm font-semibold text-slate-900 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-indigo-500 focus:outline-hidden py-0.5"
                  placeholder="Task title..."
                />

                {/* Blocker input if status is blocked */}
                {task.status === 'blocked' && (
                  <input
                    type="text"
                    placeholder="Describe impediment / blocker..."
                    value={task.blocker_note || ''}
                    onChange={(e) => handleUpdateTaskField(idx, 'blocker_note', e.target.value)}
                    className="mt-2 w-full text-xs font-medium text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 rounded-lg px-2.5 py-1.5 placeholder:text-amber-400 dark:placeholder:text-amber-500 focus:outline-hidden"
                  />
                )}
              </div>

              {/* Status and Evening Hours Controls */}
              <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                {/* Status Toggle */}
                <select
                  value={task.status || 'in_progress'}
                  onChange={(e) => handleUpdateTaskField(idx, 'status', e.target.value as TaskStatus)}
                  className="text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                >
                  <option value="in_progress">🔄 In Progress</option>
                  <option value="done">✅ Done</option>
                  <option value="blocked">⚠️ Blocked</option>
                  <option value="planned">📋 Planned</option>
                </select>

                {/* Hours Input (Optional in morning, logged at end of day) */}
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="24"
                    placeholder="0.0"
                    value={task.hours_spent !== null && task.hours_spent !== undefined ? task.hours_spent : ''}
                    onChange={(e) =>
                      handleUpdateTaskField(idx, 'hours_spent', e.target.value === '' ? null : parseFloat(e.target.value))
                    }
                    className="w-14 text-center text-xs font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    title="Hours worked on task (0 if not worked on)"
                  />
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium pr-1">hrs</span>
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDeleteTask(idx)}
                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                  title="Remove task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {tasks.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-6">
            <Sparkles className="w-8 h-8 text-indigo-400 dark:text-indigo-500 mx-auto mb-2 opacity-50" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No tasks planned for today yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Type your planned tasks in the box above to start your morning standup in under 30 seconds!
            </p>
          </div>
        )}
      </div>

      {/* Footer Bar: Total Hours & Submit Controls */}
      {tasks.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Day Total:</span>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-xl font-black text-sm border border-transparent dark:border-indigo-800/50">
              <Clock className="w-4 h-4" />
              <span>{totalHours.toFixed(1)} hrs</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => saveDraft(tasks)}
              disabled={saving}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Draft'}</span>
            </button>

            <button
              type="button"
              onClick={handleSubmitAndLock}
              disabled={submitting}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting...' : 'Submit & Lock Hours'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
