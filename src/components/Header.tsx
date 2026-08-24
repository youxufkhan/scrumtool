'use client';

import React from 'react';
import Link from 'next/link';
import { format, parseISO, subDays, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, User, Shield, Sparkles } from 'lucide-react';
import { Member } from '@/types/database';
import { isWeekend } from '@/lib/dateUtils';

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

  const handlePrevDay = () => {
    const prev = format(subDays(parseISO(currentDate), 1), 'yyyy-MM-dd');
    onDateChange(prev);
  };

  const handleNextDay = () => {
    const next = format(addDays(parseISO(currentDate), 1), 'yyyy-MM-dd');
    onDateChange(next);
  };

  const handleGoToday = () => {
    onDateChange(todayDate);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:bg-indigo-700 transition-colors">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-lg">Scrum<span className="text-indigo-600">Tool</span></span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">Zero Friction</span>
            </div>
          </Link>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center gap-1 sm:gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={handlePrevDay}
            title="Previous Day"
            className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg shadow-xs text-xs sm:text-sm font-semibold text-slate-800">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>{format(parseISO(currentDate), 'EEE, MMM d')}</span>
            {isDateWeekend && (
              <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                Weekend
              </span>
            )}
          </div>

          <button
            onClick={handleNextDay}
            title="Next Day"
            className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isCurrentToday && (
            <button
              onClick={handleGoToday}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors ml-1"
            >
              Today
            </button>
          )}
        </div>

        {/* User Badge & Admin Link */}
        <div className="flex items-center gap-3">
          {currentMember ? (
            <button
              onClick={onSwitchMember}
              title="Click to switch member"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: currentMember.avatar_color || '#3B82F6' }}
              >
                {currentMember.name.slice(0, 1).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-slate-700 hidden sm:inline-block max-w-[100px] truncate">
                {currentMember.name}
              </span>
            </button>
          ) : (
            <button
              onClick={onSwitchMember}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-200"
            >
              <User className="w-3.5 h-3.5" />
              <span>Select Profile</span>
            </button>
          )}

          <Link
            href="/admin"
            className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-100 p-2 rounded-lg transition-colors"
            title="Admin Dashboard"
          >
            <Shield className="w-4 h-4" />
            <span className="hidden md:inline">Admin</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
