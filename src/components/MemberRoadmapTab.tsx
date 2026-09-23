'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Compass,
  Target,
  Sparkles,
  Clock,
  Layers,
  Award,
  BookOpen,
  Code,
  Users,
  Calendar,
  Star,
  FileText,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { MemberRoadmap } from '@/types/database';
import { getActiveRoadmap } from '@/app/actions/roadmapActions';

interface MemberRoadmapTabProps {
  memberId: string;
}

export const scoreLabels: Record<number, string> = {
  1: 'Needs Improvement',
  2: 'Developing',
  3: 'Proficient',
  4: 'Advanced',
  5: 'Outstanding',
};

// Full class strings (not built from a color token) so Tailwind picks them up.
export const milestones = [
  { key: 'goals_30_days', label: '30 Days — Immediate Focus', Icon: Clock, head: 'text-indigo-600 dark:text-indigo-400', chip: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400' },
  { key: 'goals_60_days', label: '60 Days — Expanding Ownership', Icon: Layers, head: 'text-purple-600 dark:text-purple-400', chip: 'bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400' },
  { key: 'goals_90_days', label: '90 Days — Strategic Impact', Icon: Award, head: 'text-emerald-600 dark:text-emerald-400', chip: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400' },
] as const;

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

function ScoreCard({
  title,
  score,
  icon,
}: {
  title: string;
  score: number | null;
  icon: React.ReactNode;
}) {
  const val = score ?? 0;
  return (
    <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
          {icon}
          <span>{title}</span>
        </div>
        {score ? (
          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
            {scoreLabels[score] || ''}
          </span>
        ) : null}
      </div>
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((starIndex) => (
            <Star
              key={starIndex}
              className={`w-4 h-4 ${
                starIndex <= val
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-300 dark:text-slate-600'
              }`}
            />
          ))}
        </div>
        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
          {score ? `${score} / 5` : 'Not Rated'}
        </span>
      </div>
    </div>
  );
}

/** Read-only roadmap card, shared by the member tab and the admin history list. */
export function RoadmapView({ roadmap, active = true }: { roadmap: MemberRoadmap; active?: boolean }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {roadmap.title}
            </h2>
            {active ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Roadmap
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                Previous
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Created {formatDate(roadmap.created_at)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>Growth & Milestones Plan</span>
        </div>
      </div>

      {/* Evaluation Scores Section */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Evaluation Scores
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ScoreCard
            title="Technical Skills"
            score={roadmap.tech_skills_score}
            icon={<Code className="w-4 h-4 text-blue-500" />}
          />
          <ScoreCard
            title="Soft Skills"
            score={roadmap.soft_skills_score}
            icon={<Users className="w-4 h-4 text-amber-500" />}
          />
          <ScoreCard
            title="Learning & Growth"
            score={roadmap.learning_score}
            icon={<BookOpen className="w-4 h-4 text-emerald-500" />}
          />
        </div>
      </div>

      {/* Manager Notes Section */}
      {roadmap.admin_notes && (
        <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-300 mb-2">
            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Manager Feedback & Notes</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {roadmap.admin_notes}
          </p>
        </div>
      )}

      {/* Action Milestones Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Action Milestones</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {milestones.map(({ key, label, Icon, head, chip }) => (
            <div
              key={key}
              className="p-5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col"
            >
              <div className={`flex items-center gap-2 text-xs font-bold mb-3 ${head}`}>
                <div className={`p-1.5 rounded-lg ${chip}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span>{label}</span>
              </div>
              <div className="flex-1 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {roadmap[key] || (
                  <span className="text-slate-400 dark:text-slate-500 italic">
                    No specific goals set
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MemberRoadmapTab({ memberId }: MemberRoadmapTabProps) {
  const [roadmap, setRoadmap] = useState<MemberRoadmap | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchRoadmap = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await getActiveRoadmap(memberId);
      setRoadmap(data);
    } catch (err: any) {
      console.error('Failed to load active roadmap', err);
      setFetchError(err?.message || 'Failed to load your roadmap. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchRoadmap();
  }, [fetchRoadmap]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Loading your roadmap...
        </span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-red-200 dark:border-red-900/50 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1.5">
          Failed to Load Roadmap
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed mb-4">
          {fetchError}
        </p>
        <button
          type="button"
          onClick={() => fetchRoadmap()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
          <Compass className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1.5">
          No Active Roadmap
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
          Your manager hasn&apos;t set up a roadmap for you yet.
        </p>
      </div>
    );
  }

  return <RoadmapView roadmap={roadmap} />;
}
