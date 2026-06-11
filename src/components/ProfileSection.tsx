/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User } from '../types';
import { ShieldCheck, Mail, Building, Key, CheckSquare, BellRing } from 'lucide-react';

interface ProfileSectionProps {
  currentUser: User;
  onUpdateUserDetails: (user: User) => void;
}

export default function ProfileSection({
  currentUser,
  onUpdateUserDetails
}: ProfileSectionProps) {
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [email, setEmail] = useState(currentUser.email);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUserDetails({
      ...currentUser,
      fullName: fullName.trim(),
      email: email.trim()
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div id="profile-pane-container" className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {/* Profile Header Card */}
        <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row items-center gap-5 border-b border-slate-850">
          <img
            src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120'}
            alt=""
            className="w-20 h-20 rounded-full border-2 border-indigo-400 object-cover shadow-sm"
            referrerPolicy="no-referrer"
          />
          <div className="text-center sm:text-left space-y-1">
            <h3 className="text-lg font-extrabold tracking-tight">{currentUser.fullName}</h3>
            <p className="text-xs text-slate-350">{currentUser.email}</p>
            <div className="flex flex-wrap gap-2 pt-1.5 justify-center sm:justify-start">
              <span className="text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider bg-indigo-900 border border-indigo-750 text-indigo-200 rounded-md">
                Role: {currentUser.role.replace('_', ' ')}
              </span>
              <span className="text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider bg-slate-800 border border-slate-750 text-slate-300 rounded-md">
                Dept: {currentUser.departmentId}
              </span>
            </div>
          </div>
        </div>

        {/* Update Profile Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs font-semibold text-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 mb-1.5 font-bold">Full Profile Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-slate-250 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1.5 font-bold">Company Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-250 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3.5">
            <div className="flex items-center gap-3 bg-slate-25 border border-slate-150 p-4 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <p className="text-slate-850 font-bold">MFA Protection (MFA)</p>
                <p className="text-[10px] text-slate-400 font-normal leading-4 mt-0.5">Protect stationery sign-offs with authenticator-backed dynamic OTP locks.</p>
              </div>
              <input
                type="checkbox"
                checked={mfaEnabled}
                onChange={(e) => setMfaEnabled(e.target.checked)}
                className="ml-auto w-4 h-4 text-indigo-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-3 bg-slate-25 border border-slate-150 p-4 rounded-xl">
              <BellRing className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-slate-850 font-bold">Email Digest Notifications</p>
                <p className="text-[10px] text-slate-400 font-normal leading-4 mt-0.5">Subscribe to weekly reports or immediate out-of-stock emergency alerts.</p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="ml-auto w-4 h-4 text-indigo-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center border-t border-slate-100 pt-5 gap-3">
            {isSaved && (
              <span className="text-[11px] font-bold text-emerald-600 animate-fade-in flex items-center gap-1">
                ✓ Changes updated securely!
              </span>
            )}
            <button
              type="submit"
              className="ml-auto px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
            >
              Update Account Profile
            </button>
          </div>
        </form>
      </div>

      {/* Simulated Login / Security policies list */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4 text-xs font-semibold text-slate-700">
        <h4 className="text-slate-800 font-extrabold flex items-center gap-1.5 pb-2.5 border-b border-slate-100">
          <Key className="w-4 h-4 text-indigo-600" />
          Security credentials & Session Audit
        </h4>
        <div className="space-y-3 font-normal text-slate-500">
          <div className="flex items-center justify-between text-[11px]">
            <span>Active token standard:</span>
            <span className="font-mono bg-slate-100 px-1.5 py-0.25 font-bold rounded text-slate-700">JWT-HS256 SHA-Secure</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span>Server signature validity:</span>
            <span className="font-mono font-bold text-slate-700">Expires in 12 hours (Automatic renew)</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span>Client IP detection:</span>
            <span className="font-mono font-bold text-slate-700">192.168.1.15 via Cloud Run ingress proxy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
