'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, LayoutDashboard, BarChart2, Settings, ArrowLeft, LogOut } from 'lucide-react';
import { AdminAuthModal } from '@/components/admin/AdminAuthModal';
import { AdminDailyBoard } from '@/components/admin/AdminDailyBoard';
import { AdminAnalyticsView } from '@/components/admin/AdminAnalyticsView';
import { HolidayAndTeamManager } from '@/components/admin/HolidayAndTeamManager';
import { getLocalTodayIso } from '@/lib/dateUtils';
import { checkInitialAdminAuth } from '@/app/actions/authActions';
import { adminLogout } from '@/app/actions/adminActions';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'board' | 'analytics' | 'settings'>('board');
  const [todayDate] = useState<string>(getLocalTodayIso());

  useEffect(() => {
    checkInitialAdminAuth()
      .then((isValid) => {
        setIsAuthenticated(isValid);
      })
      .finally(() => {
        setCheckingAuth(false);
      });
  }, []);

  const handleLogout = async () => {
    await adminLogout();
    setIsAuthenticated(false);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminAuthModal onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Admin Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Standup App</span>
            </Link>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <h1 className="text-sm font-black text-slate-900 tracking-tight">Admin Console</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-200/70 p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('board')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'board'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-indigo-600" />
            <span>Daily Standup Board</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-indigo-600" />
            <span>Analytics & Timesheets</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4 text-indigo-600" />
            <span>Holidays & Team Settings</span>
          </button>
        </div>

        {/* Tab Content Views */}
        {activeTab === 'board' && <AdminDailyBoard initialDate={todayDate} />}
        {activeTab === 'analytics' && <AdminAnalyticsView />}
        {activeTab === 'settings' && <HolidayAndTeamManager />}
      </main>
    </div>
  );
}
