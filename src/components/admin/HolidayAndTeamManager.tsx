'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Users,
  Briefcase,
  Palmtree,
  Sparkles,
  Check,
  AlertCircle,
  KeyRound,
  Calendar,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { Member, Project, Holiday, DailySubmission } from '@/types/database';
import { getMembers, getProjects, getHolidaysList } from '@/app/actions/standupActions';
import {
  addMember,
  addProject,
  addHoliday,
  deleteHoliday,
  adminResetMemberPasscode,
  adminMarkMemberLeaveRange,
  adminGetMemberLeaves,
  adminCancelMemberLeave,
} from '@/app/actions/adminActions';

export function HolidayAndTeamManager() {
  const [activeTab, setActiveTab] = useState<'holidays' | 'leaves' | 'members' | 'projects'>('holidays');

  // Lists
  const [members, setMembers] = useState<Member[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [scheduledLeaves, setScheduledLeaves] = useState<(DailySubmission & { member?: Member })[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Forms: Member
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberColor, setNewMemberColor] = useState('#3B82F6');

  // Forms: Project
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#6366F1');

  // Forms: Holiday
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');

  // Forms: Leave / PTO
  const [leaveMemberId, setLeaveMemberId] = useState('');
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, p, h, l] = await Promise.all([
        getMembers(),
        getProjects(),
        getHolidaysList(),
        adminGetMemberLeaves(),
      ]);
      setMembers(m);
      setProjects(p);
      setHolidays(h);
      setScheduledLeaves(l);
      if (m.length > 0 && !leaveMemberId) {
        setLeaveMemberId(m[0].id);
      }
    } catch (err) {
      console.error('Failed to load settings data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    try {
      const res = await addMember(newMemberName, newMemberRole, newMemberColor);
      if (res.success) {
        setNewMemberName('');
        setNewMemberRole('');
        setMessage({ text: 'Added team member successfully! (Initial PIN: 1234)', type: 'success' });
        loadData();
      } else {
        setMessage({ text: res.error || 'Failed to add member.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Error adding member.', type: 'error' });
    }
  };

  const handleResetPasscode = async (memberId: string, memberName: string) => {
    if (!confirm(`Reset passcode for ${memberName} back to default (1234)?`)) {
      return;
    }

    try {
      const res = await adminResetMemberPasscode(memberId);
      if (res.success) {
        setMessage({ text: `Passcode for ${memberName} has been reset to 1234.`, type: 'success' });
        loadData();
      } else {
        setMessage({ text: res.error || 'Failed to reset passcode.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Error resetting passcode.', type: 'error' });
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const res = await addProject(newProjectName, newProjectColor);
      if (res.success) {
        setNewProjectName('');
        setMessage({ text: 'Added project successfully!', type: 'success' });
        loadData();
      }
    } catch {
      setMessage({ text: 'Error adding project.', type: 'error' });
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate || !newHolidayName.trim()) return;

    try {
      const res = await addHoliday(newHolidayDate, newHolidayName);
      if (res.success) {
        setNewHolidayDate('');
        setNewHolidayName('');
        setMessage({ text: 'Added official holiday successfully!', type: 'success' });
        loadData();
      }
    } catch {
      setMessage({ text: 'Error adding holiday.', type: 'error' });
    }
  };

  const handleDeleteHoliday = async (id: string, name: string) => {
    if (!confirm(`Delete holiday "${name}"?`)) return;
    try {
      const res = await deleteHoliday(id);
      if (res.success) {
        setMessage({ text: 'Deleted holiday successfully.', type: 'success' });
        loadData();
      }
    } catch {
      setMessage({ text: 'Error deleting holiday.', type: 'error' });
    }
  };

  const handleScheduleLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveMemberId || !leaveStartDate || !leaveEndDate) {
      setMessage({ text: 'Please select member, start date, and end date.', type: 'error' });
      return;
    }

    setLeaveSubmitting(true);
    setMessage(null);

    try {
      const res = await adminMarkMemberLeaveRange(leaveMemberId, leaveStartDate, leaveEndDate, leaveReason);
      if (res.success && res.data) {
        setMessage({
          text: `Scheduled leave for ${res.data.daysCount} working day(s) successfully!`,
          type: 'success',
        });
        setLeaveStartDate('');
        setLeaveEndDate('');
        setLeaveReason('');
        loadData();
      } else {
        setMessage({ text: res.error || 'Failed to schedule leave.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Error scheduling member leave.', type: 'error' });
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const handleCancelLeave = async (submissionId: string, memberName?: string, date?: string) => {
    if (!confirm(`Cancel leave for ${memberName || 'member'} on ${date || 'selected date'}?`)) {
      return;
    }

    try {
      const res = await adminCancelMemberLeave(submissionId);
      if (res.success) {
        setMessage({ text: 'Canceled scheduled leave successfully.', type: 'success' });
        loadData();
      } else {
        setMessage({ text: res.error || 'Failed to cancel leave.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Error canceling leave.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('holidays')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'holidays' ? 'bg-indigo-600 dark:bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Palmtree className="w-3.5 h-3.5" />
          <span>Holidays Calendar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('leaves')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'leaves' ? 'bg-indigo-600 dark:bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Leave / PTO Manager</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'members' ? 'bg-indigo-600 dark:bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Team Members</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'projects' ? 'bg-indigo-600 dark:bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Projects</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between border animate-in fade-in duration-200 ${
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

      {/* HOLIDAYS TAB */}
      {activeTab === 'holidays' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add Holiday Form */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs h-fit">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <Palmtree className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Add Official Holiday</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Holidays automatically exempt all team members from standup requirements.
            </p>

            <form onSubmit={handleAddHoliday} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Holiday Date</label>
                <input
                  type="date"
                  required
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Holiday Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Labor Day, Company Retreat"
                  value={newHolidayName}
                  onChange={(e) => setNewHolidayName(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Save Holiday</span>
              </button>
            </form>
          </div>

          {/* Holiday List */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 sm:p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Configured Holidays</h3>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">Loading...</div>
            ) : holidays.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No custom holidays added yet. Weekends are automatically recognized as days off.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {holidays.map((h) => (
                  <div key={h.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{h.name}</h4>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{h.date}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteHoliday(h.id, h.name)}
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Delete holiday"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* LEAVE / PTO MANAGER TAB */}
      {activeTab === 'leaves' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Schedule Leave Form */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs h-fit">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Schedule Member Leave</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Marks member on leave for a date or range, exempting them from standup compliance.
            </p>

            <form onSubmit={handleScheduleLeave} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Team Member</label>
                <select
                  value={leaveMemberId}
                  onChange={(e) => setLeaveMemberId(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role || 'Member'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={leaveStartDate}
                  onChange={(e) => {
                    setLeaveStartDate(e.target.value);
                    if (!leaveEndDate) setLeaveEndDate(e.target.value);
                  }}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={leaveEndDate}
                  onChange={(e) => setLeaveEndDate(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Leave Reason (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Annual Vacation, Medical Leave"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={leaveSubmitting}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50 mt-2"
              >
                <Check className="w-4 h-4" />
                <span>{leaveSubmitting ? 'Scheduling...' : 'Confirm Member Leave'}</span>
              </button>
            </form>
          </div>

          {/* Scheduled Leaves List */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 sm:p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Active & Scheduled Leaves</h3>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">Loading...</div>
            ) : scheduledLeaves.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No member leaves recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto pr-1">
                {scheduledLeaves.map((l) => (
                  <div key={l.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: l.member?.avatar_color || '#10B981' }}
                      >
                        {l.member?.name ? l.member.name.slice(0, 1).toUpperCase() : 'M'}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {l.member?.name || 'Unknown Member'}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{l.date}</span>
                          {l.leave_reason && <span>• {l.leave_reason}</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCancelLeave(l.id, l.member?.name, l.date)}
                      className="text-[11px] font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 px-2.5 py-1 rounded-lg border border-red-100 dark:border-red-900/60 transition-colors cursor-pointer"
                    >
                      Cancel Leave
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MEMBERS TAB */}
      {activeTab === 'members' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add Member Form */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs h-fit">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Add Team Member</span>
            </h3>

            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Taylor Morgan"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Role / Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Frontend Engineer"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Avatar Color</label>
                <div className="flex items-center gap-2">
                  {['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewMemberColor(color)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        newMemberColor === color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Member</span>
              </button>
            </form>
          </div>

          {/* Member List */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 sm:p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Team Directory ({members.length})</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0"
                      style={{ backgroundColor: m.avatar_color || '#3B82F6' }}
                    >
                      {m.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{m.name}</h4>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{m.role}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleResetPasscode(m.id, m.name)}
                    className="flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    title="Reset member passcode back to 1234"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset PIN</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PROJECTS TAB */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add Project Form */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs h-fit">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Add Project Tag</span>
            </h3>

            <form onSubmit={handleAddProject} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Infrastructure"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Tag Color</label>
                <div className="flex items-center gap-2">
                  {['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewProjectColor(color)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        newProjectColor === color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Project</span>
              </button>
            </form>
          </div>

          {/* Project List */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 sm:p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Active Projects ({projects.length})</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-800/40"
                >
                  <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: p.color || '#6366F1' }} />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
