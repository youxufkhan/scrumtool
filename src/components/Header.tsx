'use client';

import React from 'react';
import Link from 'next/link';
import { format, parseISO, subDays, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, User, Shield, Sparkles } from 'lucide-react';
import { Member } from '@/types/database';
import { isWeekend } from '@/lib/dateUtils';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  currentMember: Member | null;
  onSwitchMember: () => void;
  todayDate: string;
}

export function Header({
  currentDate,
  onDateChange,
  currentMember,
  onSwitchMember,
  todayDate,
}: HeaderProps) {
  const isCurrentToday = currentDate === todayDate;
  const isDateWeekend = isWeekend(currentDate);
  const isFutureDisabled = currentDate >= todayDate;

  const handlePrevDay = () => {
    const prev = format(subDays(parseISO(currentDate), 1), 'yyyy-MM-dd');
    onDateChange(prev);
  };

  const handleNextDay = () => {
    if (isFutureDisabled) return;
    const next = format(addDays(parseISO(currentDate), 1), 'yyyy-MM-dd');
    onDateChange(next);
  };

  const handleGoToday = () => {
    onDateChange(todayDate);
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:bg-indigo-700 transition-colors">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 tracking-tight text-lg">Scrum<span className="text-indigo-600 dark:text-indigo-400">Tool</span></span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60">Zero Friction</span>
            </div>
          </Link>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center gap-1 sm:gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-transparent dark:border-slate-700/50">
          <button
            type="button"
            onClick={handlePrevDay}
            title="Previous Day"
            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-slate-900 rounded-lg shadow-xs text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 border border-transparent dark:border-slate-700/50">
            <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{format(parseISO(currentDate), 'EEE, MMM d')}</span>
            {isDateWeekend && (
              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                Weekend
              </span>
            )}
            {isCurrentToday && (
              <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                Today
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleNextDay}
            disabled={isFutureDisabled}
            title={isFutureDisabled ? 'Cannot navigate to future dates' : 'Next Day'}
            className={`p-1.5 rounded-lg transition-colors ${
              isFutureDisabled
                ? 'opacity-30 cursor-not-allowed text-slate-400 dark:text-slate-600'
                : 'hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isCurrentToday && (
            <button
              type="button"
              onClick={handleGoToday}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-700 px-2 py-1 rounded-lg transition-colors ml-1"
            >
              Today
            </button>
          )}
        </div>

        {/* User Badge, Admin Link & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentMember ? (
            <button
              type="button"
              onClick={onSwitchMember}
              title="Click to switch member"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-slate-800 transition-all text-left"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: currentMember.avatar_color || '#3B82F6' }}
              >
                {currentMember.name.slice(0, 1).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 hidden sm:inline-block max-w-[100px] truncate">
                {currentMember.name}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onSwitchMember}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <User className="w-3.5 h-3.5" />
              <span>Select Profile</span>
            </button>
          )}

          <Link
            href="/admin"
            className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors"
            title="Admin Dashboard"
          >
            <Shield className="w-4 h-4" />
            <span className="hidden md:inline">Admin</span>
          </Link>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
