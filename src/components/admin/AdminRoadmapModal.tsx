'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Target,
  Sparkles,
  Clock,
  Check,
  AlertCircle,
  Award,
  BookOpen,
  Code,
  Users,
  History,
  Calendar,
  Layers,
} from 'lucide-react';
import { Member, MemberRoadmap } from '@/types/database';
import { saveMemberRoadmap, getMemberRoadmapHistory } from '@/app/actions/roadmapActions';

interface AdminRoadmapModalProps {
  member: Member;
  onClose: () => void;
}

const scoreLabels: Record<number, string> = {
  1: 'Needs Improvement',
  2: 'Developing',
  3: 'Proficient',
  4: 'Advanced',
  5: 'Outstanding',
};

export function AdminRoadmapModal({ member, onClose }: AdminRoadmapModalProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [history, setHistory] = useState<MemberRoadmap[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);

  // Form state
  const [title, setTitle] = useState<string>('');
  const [techScore, setTechScore] = useState<number>(3);
  const [softScore, setSoftScore] = useState<number>(3);
  const [learningScore, setLearningScore] = useState<number>(3);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [goals30, setGoals30] = useState<string>('');
  const [goals60, setGoals60] = useState<string>('');
  const [goals90, setGoals90] = useState<string>('');

  // Status feedback
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const data = await getMemberRoadmapHistory(member.id);
      setHistory(data);
    } catch (err) {
      console.error('Failed to load roadmap history', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [member.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a roadmap title.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await saveMemberRoadmap({
        member_id: member.id,
        title: title.trim(),
        tech_skills_score: techScore,
        soft_skills_score: softScore,
        learning_score: learningScore,
        admin_notes: adminNotes.trim() || null,
        goals_30_days: goals30.trim() || null,
        goals_60_days: goals60.trim() || null,
        goals_90_days: goals90.trim() || null,
      });

      if (res.success) {
        setSuccessMessage('Roadmap saved and activated successfully!');
        // Reset form inputs
        setTitle('');
        setTechScore(3);
        setSoftScore(3);
        setLearningScore(3);
        setAdminNotes('');
        setGoals30('');
        setGoals60('');
        setGoals90('');
        // Reload history and switch to history view
        await loadHistory();
        setActiveTab('history');
      } else {
        setError(res.error || 'Failed to save roadmap.');
      }
    } catch {
      setError('An error occurred while saving the roadmap.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime())
        ? dateStr
        : d.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
    } catch {
      return dateStr;
    }
  };

  const renderScoreSelector = (
    label: string,
    value: number,
    onChange: (val: number) => void,
    icon: React.ReactNode
  ) => (
    <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
          {value}/5 • {scoreLabels[value]}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5].map((num) => {
          const isSelected = value === num;
          return (
            <button
              key={num}
              type="button"
              onClick={() => onChange(num)}
              className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                isSelected
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm scale-[1.02]'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-slate-700'
              }`}
            >
              <span>{num}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm font-bold shadow-sm shrink-0"
              style={{ backgroundColor: member.avatar_color || '#3B82F6' }}
            >
              {member.name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {member.name}
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {member.role || 'Team Member'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Evaluation Scores & 30-60-90 Day Action Roadmaps
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 px-5 sm:px-6 pt-3 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create Roadmap</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History ({history.length})</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Notifications */}
          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs rounded-2xl font-semibold flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-300 text-xs font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs rounded-2xl font-semibold flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200 text-xs font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* CREATE TAB */}
          {activeTab === 'create' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title Input */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Roadmap Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 2026 Growth & Mastery Plan"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs font-semibold px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 transition-colors"
                />
              </div>

              {/* Evaluation Scores */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Performance & Skill Evaluations (1–5)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {renderScoreSelector(
                    'Technical Skills',
                    techScore,
                    setTechScore,
                    <Code className="w-3.5 h-3.5 text-blue-500" />
                  )}
                  {renderScoreSelector(
                    'Soft Skills',
                    softScore,
                    setSoftScore,
                    <Users className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  {renderScoreSelector(
                    'Learning & Growth',
                    learningScore,
                    setLearningScore,
                    <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Admin Feedback & Review Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Key observations, strengths, improvement areas, and career coaching notes..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 transition-colors resize-y leading-relaxed"
                />
              </div>

              {/* 30-60-90 Days Milestones */}
              <div className="space-y-3 pt-1">
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>30-60-90 Days Action Milestones</span>
                </div>

                {/* 30 Days */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                    <Clock className="w-3 h-3 text-indigo-500" />
                    <span>30 Days: Immediate Focus & Quick Wins</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Milestones for Month 1 (e.g. Ramp up on new repository, resolve 5 assigned backlog tickets...)"
                    value={goals30}
                    onChange={(e) => setGoals30(e.target.value)}
                    className="w-full text-xs font-medium px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 transition-colors resize-y leading-relaxed"
                  />
                </div>

                {/* 60 Days */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                    <Layers className="w-3 h-3 text-purple-500" />
                    <span>60 Days: Expanding Ownership & Autonomy</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Milestones for Month 2 (e.g. Lead end-to-end implementation of the analytics feature...)"
                    value={goals60}
                    onChange={(e) => setGoals60(e.target.value)}
                    className="w-full text-xs font-medium px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 transition-colors resize-y leading-relaxed"
                  />
                </div>

                {/* 90 Days */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                    <Award className="w-3 h-3 text-emerald-500" />
                    <span>90 Days: Strategic Impact & Growth Target</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Milestones for Month 3 (e.g. Propose and document architecture RFC, mentor junior team members...)"
                    value={goals90}
                    onChange={(e) => setGoals90(e.target.value)}
                    className="w-full text-xs font-medium px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-600 transition-colors resize-y leading-relaxed"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Roadmap...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Save & Activate Roadmap</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {loadingHistory ? (
                <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span>Loading roadmap history...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                    <Target className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                    No Roadmaps Found
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
                    There are no historical or active roadmaps recorded for {member.name} yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Create First Roadmap
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((roadmap) => (
                    <div
                      key={roadmap.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        roadmap.is_active
                          ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {roadmap.title}
                            </h3>
                            {roadmap.is_active ? (
                              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                Previous
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            <Calendar className="w-3 h-3" />
                            <span>Created {formatDate(roadmap.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Scores Breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-3">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
                          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Code className="w-3 h-3 text-blue-500" />
                            <span>Technical Skills</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {roadmap.tech_skills_score ?? '—'}/5
                            </span>
                            {roadmap.tech_skills_score && (
                              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                ({scoreLabels[roadmap.tech_skills_score]})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
                          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Users className="w-3 h-3 text-amber-500" />
                            <span>Soft Skills</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {roadmap.soft_skills_score ?? '—'}/5
                            </span>
                            {roadmap.soft_skills_score && (
                              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                ({scoreLabels[roadmap.soft_skills_score]})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
                          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-emerald-500" />
                            <span>Learning & Growth</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {roadmap.learning_score ?? '—'}/5
                            </span>
                            {roadmap.learning_score && (
                              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                ({scoreLabels[roadmap.learning_score]})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Admin Notes */}
                      {roadmap.admin_notes && (
                        <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
                          <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            Admin Notes & Feedback
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                            {roadmap.admin_notes}
                          </p>
                        </div>
                      )}

                      {/* 30-60-90 Days Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3">
                        <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                            <Clock className="w-3 h-3 text-indigo-500" />
                            <span>30 Days</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                            {roadmap.goals_30_days || (
                              <span className="text-slate-400 italic">No specific goals set</span>
                            )}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 mb-1">
                            <Layers className="w-3 h-3 text-purple-500" />
                            <span>60 Days</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                            {roadmap.goals_60_days || (
                              <span className="text-slate-400 italic">No specific goals set</span>
                            )}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                            <Award className="w-3 h-3 text-emerald-500" />
                            <span>90 Days</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                            {roadmap.goals_90_days || (
                              <span className="text-slate-400 italic">No specific goals set</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
