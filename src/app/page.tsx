'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { MemberSelector } from '@/components/MemberSelector';
import { MissingHoursGateCard } from '@/components/MissingHoursGateCard';
import { DailyStandupLogger } from '@/components/DailyStandupLogger';
import { LockedStandupCard } from '@/components/LockedStandupCard';
import { Member, Project, DailyTask, DailySubmission, Holiday } from '@/types/database';
import { getLocalTodayIso } from '@/lib/dateUtils';
import { getMembers, getProjects, checkMemberGate, getDailyTasks, memberLogout } from '@/app/actions/standupActions';
import { checkInitialMemberAuth } from '@/app/actions/authActions';
import { Palmtree, Sun } from 'lucide-react';

export default function MemberHomePage() {
  const [todayDate] = useState<string>(getLocalTodayIso());
  const [currentDate, setCurrentDate] = useState<string>(getLocalTodayIso());

  // Members & Projects state
  const [members, setMembers] = useState<Member[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [showMemberPicker, setShowMemberPicker] = useState<boolean>(false);

  // Gate & Daily State
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [pendingDates, setPendingDates] = useState<string[]>([]);
  const [tasks, setTasks] = useState<(DailyTask & { project?: Project | null })[]>([]);
  const [submission, setSubmission] = useState<DailySubmission | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [holiday, setHoliday] = useState<Holiday | null>(null);
  const [isWeekend, setIsWeekend] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Initial Load: Fetch members, projects and check cookie session
  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      try {
        const [memList, projList, authState] = await Promise.all([
          getMembers(),
          getProjects(),
          checkInitialMemberAuth(),
        ]);
        setMembers(memList);
        setProjects(projList);

        if (authState.isAuthenticated && authState.memberId) {
          const found = memList.find((m) => m.id === authState.memberId);
          if (found) {
            setCurrentMember(found);
          } else {
            await memberLogout();
            setShowMemberPicker(true);
          }
        } else {
          setShowMemberPicker(true);
        }
      } catch (err) {
        console.error('Failed to initialize app', err);
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, []);

  // 2. Load Gate & Daily Data when member or date changes
  const loadMemberDayData = useCallback(async () => {
    if (!currentMember) return;
    setLoading(true);

    try {
      // Check gate
      const gate = await checkMemberGate(currentMember.id, todayDate);
      setIsBlocked(gate.isBlocked);
      setPendingDates(gate.pendingDates);

      // Load tasks for currentDate
      const dayData = await getDailyTasks(currentMember.id, currentDate);
      setTasks(dayData.tasks);
      setSubmission(dayData.submission);
      setIsLocked(dayData.isLocked);
      setHoliday(dayData.holiday);
      setIsWeekend(dayData.isWeekend);
    } catch (err) {
      console.error('Failed to load member standup data', err);
    } finally {
      setLoading(false);
    }
  }, [currentMember, currentDate, todayDate]);

  useEffect(() => {
    if (currentMember) {
      loadMemberDayData();
    }
  }, [currentMember, loadMemberDayData]);

  const handleSelectMember = (member: Member) => {
    setCurrentMember(member);
    setShowMemberPicker(false);
  };

  const handleSwitchMember = async () => {
    await memberLogout();
    setCurrentMember(null);
    setShowMemberPicker(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <Header
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        currentMember={currentMember}
        onSwitchMember={handleSwitchMember}
        todayDate={todayDate}
      />

      {/* Member Picker Modal */}
      {showMemberPicker && (
        <MemberSelector
          members={members}
          selectedMemberId={currentMember?.id || null}
          onSelectMember={handleSelectMember}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-500">Loading your standup...</span>
          </div>
        ) : !currentMember ? (
          <div className="text-center py-20">
            <button
              onClick={() => setShowMemberPicker(true)}
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-md hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              Select Your Name to Begin
            </button>
          </div>
        ) : isBlocked && currentDate === todayDate ? (
          /* Missing Hours Gate Blocker */
          <MissingHoursGateCard
            memberId={currentMember.id}
            memberName={currentMember.name}
            pendingDates={pendingDates}
            onResolved={() => {
              setIsBlocked(false);
              loadMemberDayData();
            }}
          />
        ) : (
          /* Normal Standup Flow */
          <div className="space-y-4">
            {/* Holiday or Weekend Banner */}
            {holiday && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3">
                <Palmtree className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="text-xs font-medium">
                  <strong>🌴 Official Holiday: {holiday.name}</strong> — Standup is not required today, but you can still record tasks.
                </div>
              </div>
            )}

            {isWeekend && !holiday && (
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 flex items-center gap-3">
                <Sun className="w-5 h-5 text-indigo-600 shrink-0" />
                <div className="text-xs font-medium">
                  <strong>🎉 Weekend</strong> — Standup is not mandatory, but feel free to record any weekend tasks.
                </div>
              </div>
            )}

            {/* Standup Card: Locked vs. Logger */}
            {isLocked ? (
              <LockedStandupCard
                date={currentDate}
                tasks={tasks}
                submission={submission}
                memberName={currentMember.name}
              />
            ) : (
              <DailyStandupLogger
                memberId={currentMember.id}
                memberName={currentMember.name}
                date={currentDate}
                initialTasks={tasks}
                projects={projects}
                onSaved={loadMemberDayData}
                onLocked={loadMemberDayData}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ScrumTool — Zero-friction daily standups & timesheets</span>
          <span className="font-mono text-[11px] text-slate-400">Powered by Next.js & Supabase</span>
        </div>
      </footer>
    </div>
  );
}
