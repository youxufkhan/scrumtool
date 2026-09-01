'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Lock, ArrowLeft, KeyRound, ShieldCheck, Sparkles, Check, AlertCircle } from 'lucide-react';
import { Member } from '@/types/database';
import { verifyMemberPasscode, changeMemberPasscode } from '@/app/actions/standupActions';

interface MemberPasscodeModalProps {
  member: Member;
  onSuccess: (token: string) => void;
  onBack: () => void;
}

export function MemberPasscodeModal({ member, onSuccess, onBack }: MemberPasscodeModalProps) {
  // Step: 'verify' (enter PIN) or 'setup' (first-time change from 1234)
  const [step, setStep] = useState<'verify' | 'setup'>('verify');
  
  // Verification PIN digits (4 boxes)
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  
  // Setup PIN inputs
  const [newPin, setNewPin] = useState<string[]>(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState<string[]>(['', '', '', '']);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  // Input refs for auto-focusing next box
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const newPinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const confirmPinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleDigitChange = (index: number, val: string) => {
    const char = val.slice(-1);
    if (char && !/^\d$/.test(char)) return;

    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setError(null);

    // Auto-advance to next box
    if (char && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // If 4 digits entered, automatically submit
    if (char && index === 3 && newDigits.every((d) => d !== '')) {
      handleVerify(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerify = async (enteredPin: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await verifyMemberPasscode(member.id, enteredPin);
      if (res.success && res.data) {
        if (res.data.requiresSetup) {
          // Member entered default 1234 for the first time -> transition to setup
          setStep('setup');
          setTimeout(() => newPinRefs[0].current?.focus(), 100);
        } else {
          // Standard login success
          onSuccess(res.data.token);
        }
      } else {
        setError(res.error || 'Incorrect passcode.');
        triggerShake();
        setDigits(['', '', '', '']);
        inputRefs[0].current?.focus();
      }
    } catch {
      setError('An error occurred during verification.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const pinA = newPin.join('');
    const pinB = confirmPin.join('');

    if (pinA.length !== 4) {
      setError('Please enter a 4-digit passcode.');
      return;
    }
    if (pinA !== pinB) {
      setError('Passcodes do not match. Please re-enter.');
      setConfirmPin(['', '', '', '']);
      confirmPinRefs[0].current?.focus();
      triggerShake();
      return;
    }
    if (pinA === '1234') {
      setError('Please choose a new personal passcode other than 1234.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await changeMemberPasscode(member.id, '1234', pinA);
      if (res.success && res.data) {
        onSuccess(res.data.token);
      } else {
        setError(res.error || 'Failed to update passcode.');
      }
    } catch {
      setError('Error setting up passcode.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 sm:p-8 border border-slate-100 transition-transform duration-200 ${
          isShaking ? 'animate-shake' : 'animate-in fade-in zoom-in-95'
        }`}
      >
        {/* Header Profile Badge */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-slate-50 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Switch</span>
          </button>

          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: member.avatar_color || '#3B82F6' }}
            >
              {member.name.slice(0, 1).toUpperCase()}
            </div>
            <span className="text-xs font-bold text-slate-800">{member.name}</span>
          </div>
        </div>

        {step === 'verify' ? (
          <div>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Enter Your Passcode</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your 4-digit PIN to authenticate.
                <br />
                <span className="text-[11px] text-indigo-600 font-medium">
                  (Default for first-time login: <strong>1234</strong>)
                </span>
              </p>
            </div>

            {/* 4-Box PIN Input */}
            <div className="flex justify-center gap-3 mb-6">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  disabled={loading}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-14 h-16 text-center text-2xl font-mono font-black border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:bg-indigo-50/20 focus:outline-hidden transition-all bg-slate-50 text-slate-900 shadow-xs"
                />
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-semibold text-center flex items-center justify-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={() => handleVerify(digits.join(''))}
              disabled={loading || digits.some((d) => d === '')}
              className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying...</span>
                </span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Unlock Standup</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* First-time PIN setup view */
          <form onSubmit={handleSetupPin} className="space-y-4">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-inner">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Set Personal Passcode</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Please set a personal 4-digit PIN for future logins.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">New 4-Digit Passcode</label>
              <div className="flex justify-center gap-2">
                {newPin.map((d, i) => (
                  <input
                    key={i}
                    ref={newPinRefs[i]}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => {
                      const c = e.target.value.slice(-1);
                      if (c && !/^\d$/.test(c)) return;
                      const arr = [...newPin];
                      arr[i] = c;
                      setNewPin(arr);
                      if (c && i < 3) newPinRefs[i + 1].current?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !newPin[i] && i > 0) newPinRefs[i - 1].current?.focus();
                    }}
                    className="w-12 h-12 text-center text-xl font-mono font-bold border border-slate-300 rounded-xl focus:border-indigo-600 focus:outline-hidden bg-slate-50"
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Confirm New Passcode</label>
              <div className="flex justify-center gap-2">
                {confirmPin.map((d, i) => (
                  <input
                    key={i}
                    ref={confirmPinRefs[i]}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => {
                      const c = e.target.value.slice(-1);
                      if (c && !/^\d$/.test(c)) return;
                      const arr = [...confirmPin];
                      arr[i] = c;
                      setConfirmPin(arr);
                      if (c && i < 3) confirmPinRefs[i + 1].current?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !confirmPin[i] && i > 0) confirmPinRefs[i - 1].current?.focus();
                    }}
                    className="w-12 h-12 text-center text-xl font-mono font-bold border border-slate-300 rounded-xl focus:border-indigo-600 focus:outline-hidden bg-slate-50"
                  />
                ))}
              </div>
            </div>

            {error && (
              <p className="text-xs font-semibold text-red-600 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || newPin.some((d) => !d) || confirmPin.some((d) => !d)}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Passcode & Continue'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
