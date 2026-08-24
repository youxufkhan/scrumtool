'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, CheckCircle2, Clock, Copy, AlertCircle, Sparkles, Lock, Save, ChevronDown } from 'lucide-react';
import { DailyTask, Project, TaskStatus } from '@/types/database';
import { saveDailyTasks, submitAndLockDay, carryForwardYesterdayTasks } from '@/app/actions/standupActions';

interface DailyStandupLoggerProps {
  memberId: string;
  memberName: string;
  date: string;
  initialTasks: (DailyTask & { project?: Project | null })[];
  projects: Project[];
  onSaved: () => void;
  onLocked: () => void;
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
  const [tasks, setTasks] = useState<Partial<DailyTask>[]>(initialTasks);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isAdHoc, setIsAdHoc] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copyingYesterday, setCopyingYesterday] = useState(false);
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

    const newTask: Partial<DailyTask> = {
      id: crypto.randomUUID(),
      member_id: memberId,
      date,
      title: trimmed,
      project_id: selectedProjectId || null,
      status: 'in_progress',
      hours_spent: null,
      is_ad_hoc: isAdHoc,
      order_index: tasks.length,
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
      if (res.success) {
        onSaved();
      } else {
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
          onSaved();
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

    // Validate hours for all tasks
    for (const t of tasks) {
      if (t.hours_spent === null || t.hours_spent === undefined || isNaN(Number(t.hours_spent))) {
        setMessage({
          text: `Please enter hours for "${t.title}" (enter 0 if you did not work on it today).`,
          type: 'error',
        });
        return;
      }
      const h = Number(t.hours_spent);
      if (h < 0 || h > 24) {
        setMessage({ text: 'Hours must be between 0 and 24.', type: 'error' });
        return;
      }
    }

    if (!confirm('Are you ready to finalize & lock today\'s standup? You will not be able to edit it after submission.')) {
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const res = await submitAndLockDay(memberId, date, tasks);
      if (res.success) {
        onLocked();
      } else {
        setMessage({ text: res.error || 'Failed to finalize standup.', type: 'error' });
      }
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : 'Error finalizing standup.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const totalHours = tasks.reduce((sum, t) => sum + (Number(t.hours_spent) || 0), 0);

  return (
    <div className="max-w-3xl mx-auto my-6 space-y-6">
      {/* Action Notification Alert */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border animate-in fade-in duration-200 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-700 ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Quick Carry Forward Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Today&apos;s Standup Tasks</h2>
          <p className="text-xs text-slate-500">Plan tasks in the morning; log hours in the evening.</p>
        </div>

        <button
          onClick={handleCopyYesterday}
          disabled={copyingYesterday}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-colors disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>{copyingYesterday ? 'Copying...' : 'Copy Unfinished Tasks from Yesterday'}</span>
        </button>
      </div>

      {/* Rapid Task Input Bar */}
      <form
        onSubmit={handleAddTask}
        className="bg-white p-3 sm:p-4 rounded-2xl border-2 border-indigo-200 focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-500/10 shadow-sm transition-all"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a task and press Enter... (e.g. Implement payment webhook)"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="flex-1 px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
          />

          <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            {/* Project Picker */}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-xs font-medium border border-slate-200 rounded-xl px-2.5 py-2 bg-slate-50 text-slate-700 focus:outline-hidden"
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
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
          const currentProject = projects.find((p) => p.id === task.project_id);

          return (
            <div
              key={task.id || idx}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-slate-300"
            >
              {/* Task Title & Project Tag */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  {/* Project Selector */}
                  <select
                    value={task.project_id || ''}
                    onChange={(e) => handleUpdateTaskField(idx, 'project_id', e.target.value || null)}
                    className="text-[11px] font-bold uppercase rounded-lg px-2 py-0.5 border border-slate-200 bg-slate-50 text-slate-700 focus:outline-hidden"
                  >
                    <option value="">No Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  {task.is_ad_hoc && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-700">
                      Ad-hoc
                    </span>
                  )}
                </div>

                <input
                  type="text"
                  value={task.title || ''}
                  onChange={(e) => handleUpdateTaskField(idx, 'title', e.target.value)}
                  className="w-full text-sm font-semibold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-hidden py-0.5"
                  placeholder="Task title..."
                />

                {/* Blocker input if status is blocked */}
                {task.status === 'blocked' && (
                  <input
                    type="text"
                    placeholder="Describe impediment / blocker..."
                    value={task.blocker_note || ''}
                    onChange={(e) => handleUpdateTaskField(idx, 'blocker_note', e.target.value)}
                    className="mt-2 w-full text-xs font-medium text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 placeholder:text-amber-400 focus:outline-hidden"
                  />
                )}
              </div>

              {/* Status and Evening Hours Controls */}
              <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                {/* Status Toggle */}
                <select
                  value={task.status || 'in_progress'}
                  onChange={(e) => handleUpdateTaskField(idx, 'status', e.target.value as TaskStatus)}
                  className="text-xs font-semibold border border-slate-200 rounded-xl px-2.5 py-2 bg-slate-50 text-slate-800 focus:outline-hidden"
                >
                  <option value="in_progress">🔄 In Progress</option>
                  <option value="done">✅ Done</option>
                  <option value="blocked">⚠️ Blocked</option>
                  <option value="planned">📋 Planned</option>
                </select>

                {/* Hours Input (Optional in morning, logged at end of day) */}
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
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
                    className="w-14 text-center text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg py-1 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    title="Hours worked on task (0 if not worked on)"
                  />
                  <span className="text-xs text-slate-400 font-medium pr-1">hrs</span>
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDeleteTask(idx)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  title="Remove task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {tasks.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
            <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-50" />
            <h3 className="font-bold text-slate-700 text-sm">No tasks planned for today yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Type your planned tasks in the box above to start your morning standup in under 30 seconds!
            </p>
          </div>
        )}
      </div>

      {/* Footer Bar: Total Hours & Submit Controls */}
      {tasks.length > 0 && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase text-slate-500">Day Total:</span>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-xl font-black text-sm">
              <Clock className="w-4 h-4" />
              <span>{totalHours.toFixed(1)} hrs</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => saveDraft(tasks)}
              disabled={saving}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Draft'}</span>
            </button>

            <button
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
