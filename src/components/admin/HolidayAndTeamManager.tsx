'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Users, Briefcase, Palmtree, Sparkles, Check, AlertCircle } from 'lucide-react';
import { Member, Project, Holiday } from '@/types/database';
import { getMembers, getProjects, getHolidaysList } from '@/app/actions/standupActions';
import { addMember, addProject, addHoliday, deleteHoliday } from '@/app/actions/adminActions';

export function HolidayAndTeamManager() {
  const [activeTab, setActiveTab] = useState<'members' | 'projects' | 'holidays'>('holidays');

  // Lists
  const [members, setMembers] = useState<Member[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Forms
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberColor, setNewMemberColor] = useState('#3B82F6');

  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#6366F1');

  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');

  const [message, setMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, p, h] = await Promise.all([getMembers(), getProjects(), getHolidaysList()]);
      setMembers(m);
      setProjects(p);
      setHolidays(h);
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
        setMessage('Added team member successfully!');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const res = await addProject(newProjectName, newProjectColor);
      if (res.success) {
        setNewProjectName('');
        setMessage('Added project successfully!');
        loadData();
      }
    } catch (err) {
      console.error(err);
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
        setMessage('Added official holiday successfully!');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteHoliday = async (id: string, name: string) => {
    if (!confirm(`Delete holiday "${name}"?`)) return;
    try {
      const res = await deleteHoliday(id);
      if (res.success) {
        setMessage('Deleted holiday successfully.');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('holidays')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'holidays' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Palmtree className="w-3.5 h-3.5" />
          <span>Holidays Calendar</span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'members' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Team Members</span>
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'projects' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Projects</span>
        </button>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>
      )}

      {/* HOLIDAYS TAB */}
      {activeTab === 'holidays' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add Holiday Form */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs h-fit">
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Palmtree className="w-4 h-4 text-emerald-600" />
              <span>Add Official Holiday</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Holidays automatically exempt all team members from standup requirements.
            </p>

            <form onSubmit={handleAddHoliday} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Holiday Date</label>
                <input
                  type="date"
                  required
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Holiday Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Labor Day, Company Retreat"
                  value={newHolidayName}
                  onChange={(e) => setNewHolidayName(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Save Holiday</span>
              </button>
            </form>
          </div>

          {/* Holiday List */}
          <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Configured Holidays</h3>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading...</div>
            ) : holidays.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No custom holidays added yet. Weekends are automatically recognized as days off.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {holidays.map((h) => (
                  <div key={h.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{h.name}</h4>
                      <span className="text-[11px] font-medium text-slate-500">{h.date}</span>
                    </div>

                    <button
                      onClick={() => handleDeleteHoliday(h.id, h.name)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* MEMBERS TAB */}
      {activeTab === 'members' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add Member Form */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs h-fit">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Add Team Member</span>
            </h3>

            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Taylor Morgan"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Role / Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Frontend Engineer"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Avatar Color</label>
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
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Member</span>
              </button>
            </form>
          </div>

          {/* Member List */}
          <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Team Directory ({members.length})</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-2xl border border-slate-200 flex items-center gap-3 bg-slate-50/50"
                >
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0"
                    style={{ backgroundColor: m.avatar_color || '#3B82F6' }}
                  >
                    {m.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{m.name}</h4>
                    <span className="text-[11px] text-slate-500">{m.role}</span>
                  </div>
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
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs h-fit">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              <span>Add Project Tag</span>
            </h3>

            <form onSubmit={handleAddProject} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Infrastructure"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Tag Color</label>
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
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Project</span>
              </button>
            </form>
          </div>

          {/* Project List */}
          <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Active Projects ({projects.length})</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl border border-slate-200 flex items-center gap-3 bg-slate-50/50"
                >
                  <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: p.color || '#6366F1' }} />
                  <span className="text-xs font-bold text-slate-900">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
