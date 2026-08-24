'use client';

import React from 'react';
import { Member } from '@/types/database';
import { UserCheck, Sparkles } from 'lucide-react';

interface MemberSelectorProps {
  members: Member[];
  selectedMemberId: string | null;
  onSelectMember: (member: Member) => void;
}

export function MemberSelector({ members, selectedMemberId, onSelectMember }: MemberSelectorProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Who is logging in today?</h2>
          <p className="text-xs text-slate-500 mt-1">
            Pick your name to start. Your selection is remembered on this device.
          </p>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {members.map((member) => {
            const isSelected = member.id === selectedMemberId;
            return (
              <button
                key={member.id}
                onClick={() => onSelectMember(member)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs"
                    style={{ backgroundColor: member.avatar_color || '#3B82F6' }}
                  >
                    {member.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900">{member.name}</h3>
                    <p className="text-xs text-slate-500">{member.role || 'Team Member'}</p>
                  </div>
                </div>

                {isSelected && <UserCheck className="w-5 h-5 text-indigo-600" />}
              </button>
            );
          })}

          {members.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-sm">
              No team members registered yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
