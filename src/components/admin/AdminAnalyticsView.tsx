'use client';

import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, parseISO } from 'date-fns';
import {
  Download,
  Calendar,
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Clock,
  Briefcase,
  Users,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { AnalyticsSummary, DailyTask, Member, Project } from '@/types/database';
import { getAdminAnalytics, exportAdminCsvData } from '@/app/actions/adminActions';
import { getDailyTasks } from '@/app/actions/standupActions';
import { generateStandupCsv, CsvTaskRow } from '@/lib/csvUtils';

export function AdminAnalyticsView() {
  const today = new Date();
  const [rangePreset, setRangePreset] = useState<'week' | 'month' | 'custom'>('week');
  const [startDate, setStartDate] = useState<string>(format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadingCsv, setDownloadingCsv] = useState<boolean>(false);

  const handlePresetChange = (preset: 'week' | 'month' | 'custom') => {
    setRangePreset(preset);
    if (preset === 'week') {
      setStartDate(format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
      setEndDate(format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    } else if (preset === 'month') {
      setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
      setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await getAdminAnalytics(startDate, endDate);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [startDate, endDate]);

  const handleExportCsv = async () => {
    setDownloadingCsv(true);
    try {
      const res = await exportAdminCsvData(startDate, endDate);
      if (!res.success || !res.data) {
        console.error('CSV export failed:', res.error);
        return;
      }

      const allTasks = res.data;

      const rows: CsvTaskRow[] = allTasks.map((t) => ({
        date: t.date,
        memberName: t.member?.name || 'Unknown',
        project: t.project?.name || 'Unassigned',
        taskTitle: t.title,
        status: t.status,
        hoursSpent: t.hours_spent,
        isAdHoc: t.is_ad_hoc,
        blockerNote: t.blocker_note,
      }));

      const csvContent = generateStandupCsv(rows);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `timesheet-report-${startDate}-to-${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export CSV', err);
    } finally {
      setDownloadingCsv(false);
    }
  };

  const adHocPercentage =
    analytics && analytics.totalHours > 0
      ? Number(((analytics.totalAdHocHours / analytics.totalHours) * 100).toFixed(1))
      : 0;

  return (
    <div className="space-y-6">
      {/* Date Range & Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Presets */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl self-start">
          <button
            type="button"
            onClick={() => handlePresetChange('week')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              rangePreset === 'week' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => handlePresetChange('month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              rangePreset === 'month' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            This Month
          </button>
          <button
            type="button"
            onClick={() => handlePresetChange('custom')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              rangePreset === 'custom' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Custom Range
          </button>
        </div>

        {/* Custom Range Inputs */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setRangePreset('custom');
              }}
              className="bg-transparent focus:outline-hidden text-slate-800 dark:text-slate-200 font-semibold"
            />
          </div>
          <span className="text-slate-400 dark:text-slate-500">to</span>
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setRangePreset('custom');
              }}
              className="bg-transparent focus:outline-hidden text-slate-800 dark:text-slate-200 font-semibold"
            />
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={downloadingCsv || !analytics}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloadingCsv ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 dark:text-slate-500 text-sm">Computing analytics metrics...</div>
      ) : !analytics ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-sm">
          No analytics data available for this range.
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Team Hours</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{analytics.totalHours.toFixed(1)}</span>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">hrs</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Planned Work Ratio</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{analytics.totalPlannedHours.toFixed(1)}</span>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">hrs</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Ad-hoc / Scope Creep</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black text-purple-600 dark:text-purple-400">{analytics.totalAdHocHours.toFixed(1)}</span>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">hrs ({adHocPercentage}%)</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Member Hours Bar Chart */}
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Hours Logged by Team Member</span>
              </h3>

              <div className="h-64 w-full">
                {analytics.memberBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.memberBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                      <XAxis dataKey="memberName" tick={{ fontSize: 11, fill: '#94a3b8' }} interval={0} angle={-15} textAnchor="end" />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                        formatter={(value: number) => [`${value} hrs`, 'Total Hours']}
                      />
                      <Bar dataKey="totalHours" fill="#6366F1" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">No member data</div>
                )}
              </div>
            </div>

            {/* Project Allocation Pie Chart */}
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Hours Allocation by Project</span>
              </h3>

              <div className="h-64 w-full">
                {analytics.projectBreakdown.length > 0 && analytics.totalHours > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.projectBreakdown}
                        dataKey="totalHours"
                        nameKey="projectName"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                      >
                        {analytics.projectBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.projectColor || '#6366F1'} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                        formatter={(value: number) => [`${value} hrs`, 'Hours']}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">No project data</div>
                )}
              </div>
            </div>
          </div>

          {/* Daily Trend Line Chart */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Daily Team Hours Trend (Planned vs. Ad-hoc)</span>
            </h3>

            <div className="h-64 w-full">
              {analytics.dailyTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                    <Bar dataKey="plannedHours" name="Planned Hours" fill="#10B981" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="adHocHours" name="Ad-hoc Hours" fill="#8B5CF6" stackId="a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">No daily data</div>
              )}
            </div>
          </div>

          {/* Member Breakdown Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Member Timesheet Breakdown</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Team Member</th>
                    <th className="px-5 py-3.5">Total Hours</th>
                    <th className="px-5 py-3.5">Tasks Completed</th>
                    <th className="px-5 py-3.5">Active Days</th>
                    <th className="px-5 py-3.5">Avg Hours / Day</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                  {analytics.memberBreakdown.map((m) => (
                    <tr key={m.memberId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-slate-100">{m.memberName}</td>
                      <td className="px-5 py-3.5 text-indigo-600 dark:text-indigo-400 font-black">{m.totalHours.toFixed(1)} hrs</td>
                      <td className="px-5 py-3.5">{m.tasksCount}</td>
                      <td className="px-5 py-3.5">{m.daysActiveCount}</td>
                      <td className="px-5 py-3.5">{m.avgHoursPerDay.toFixed(1)} hrs/day</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
