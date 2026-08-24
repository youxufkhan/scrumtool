'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, KeyRound, ArrowRight, Lock, Sparkles } from 'lucide-react';
import { verifyAdminPasscode } from '@/app/actions/adminActions';

interface AdminAuthModalProps {
  onAuthenticated: () => void;
}

export function AdminAuthModal({ onAuthenticated }: AdminAuthModalProps) {
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await verifyAdminPasscode(passcode.trim());
      if (res.success && res.data) {
        sessionStorage.setItem('scrumtool_admin_token', res.data.token);
        onAuthenticated();
      } else {
        setError(res.error || 'Incorrect admin passcode.');
      }
    } catch {
      setError('An error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 sm:p-8 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Admin Authentication</h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter your admin passcode to access analytics, reports, and team management.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <input
                type="password"
                placeholder="Enter admin passcode (default: 1234)"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoFocus
                className="w-full text-center text-lg tracking-widest font-mono font-bold px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-indigo-600 focus:outline-hidden bg-slate-50 focus:bg-white transition-all"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>

            {error && (
              <p className="text-xs font-semibold text-red-600 text-center mt-2 animate-shake">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !passcode}
            className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span>Verifying...</span>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Unlock Admin</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs font-medium text-slate-500 hover:text-indigo-600">
              ← Return to Daily Standup
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
