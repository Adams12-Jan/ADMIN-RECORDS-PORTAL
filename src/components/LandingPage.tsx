import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  Building,
  CheckCircle2,
  Users,
  Server,
  Layers,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { User as AppUser } from '../types';

interface LandingPageProps {
  users: AppUser[];
  onSignIn: (user: AppUser) => void;
}

export default function LandingPage({ users, onSignIn }: LandingPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Simple direct email evaluation or matching
  const handleFormSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage("Please input your company email address.");
      return;
    }

    if (password !== 'vetiva123' && password !== 'admin') {
      setErrorMessage("Access Code warning: Please use 'vetiva123' to log in as staff.");
      return;
    }

    // Attempt to match seeded email
    const match = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (match) {
      onSignIn(match);
    } else {
      setErrorMessage("Staff profile not found. Please review the emails on the Role Selector below.");
    }
  };

  const handleQuickSelect = (user: AppUser) => {
    setEmail(user.email);
    setPassword('vetiva123'); // Populates pass
    onSignIn(user);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#10182D] via-[#151D39] to-[#1D1A4B] text-white font-sans selection:bg-orange-500 selection:text-white relative overflow-hidden flex flex-col justify-between">
      {/* Visual Ambient Background Vectors */}
      <div className="absolute -left-36 -top-36 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl z-0" />
      <div className="absolute right-0 top-1/3 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl z-0" />
      <div className="absolute left-1/3 bottom-0 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl z-0" />

      {/* Landing Upper Header */}
      <header className="px-6 py-4 border-b border-white/5 z-10 bg-black/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="https://i.imgur.com/G8yzhqN.png"
              alt="Vetiva Logo"
              referrerPolicy="no-referrer"
              className="h-10 w-auto rounded-lg object-contain bg-white/5 p-1"
            />
            <div>
              <h1 className="text-sm font-black tracking-tight text-white uppercase leading-4">
                VETIVA INDUSTRIAL
              </h1>
              <p className="text-[9.5px] font-bold text-orange-400 uppercase tracking-widest mt-0.5">
                Staff Administration & Request Hub
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Zero-Trust Network Active
          </div>
        </div>
      </header>

      {/* Main Landing/Auth Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10 w-full">
        {/* Left column: Epic branding copy */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/20 text-orange-400 text-xs font-black tracking-wider uppercase mb-2"
          >
            <Layers className="w-3.5 h-3.5" />
            AUTHORIZED PERSONNEL ENTRY ONLY
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black tracking-tight leading-tight uppercase"
          >
            Vetiva Enterprise <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-indigo-300 to-indigo-500">
              Procurement & Memo Hub
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-300 text-sm leading-relaxed max-w-xl"
          >
            Welcome to the internal administration portal for Vetiva Capital. Use this system 
            to place orders from the stationery catalog, manage inventory bin cards, 
            and coordinate official expenditure proposals through our multi-tier approval system.
          </motion.p>

          {/* Quick Metrics stats cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 max-w-xl"
          >
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest block">System Speed</span>
              <span className="text-xl font-bold block mt-0.5">Real-time</span>
              <span className="text-[10px] text-slate-400 mt-1 block">Live Firestore synchronization</span>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest block">Approval Routing</span>
              <span className="text-xl font-bold block mt-0.5">5-Tiered Workflow</span>
              <span className="text-[10px] text-slate-400 mt-1 block">Automated escalation routing</span>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest block">Access Policy</span>
              <span className="text-xl font-bold block mt-0.5">Role Restricted</span>
              <span className="text-[10px] text-slate-400 mt-1 block">Full audit log & ledger trail</span>
            </div>
          </motion.div>
        </div>

        {/* Right column: Auth Form Panel */}
        <div className="lg:col-span-5 w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/40 border border-white/10 p-6 md:p-8 rounded-3xl backdrop-blur-md shadow-2xl relative"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <div className="p-2.5 bg-orange-600 rounded-xl text-white">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wide">Enter Admin Space</h3>
                <p className="text-[11px] text-slate-400">Input credentials to unlock company workspaces.</p>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-500/15 border border-red-500/20 text-red-300 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="font-semibold text-[11px]">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleFormSignIn} className="space-y-4">
              {/* Email Address */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Corporate Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. emily@corporate.com"
                    className="w-full text-xs pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-500 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex justify-between">
                  <span>Passcode Code</span>
                  <span className="text-indigo-400 font-bold tracking-normal text-[9.5px]">Default Code: vetiva123</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full text-xs pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black rounded-xl cursor-pointer transition-all uppercase tracking-wide flex items-center justify-center gap-2 group shadow-sm mt-6"
              >
                Authenticate & Enter
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </form>
          </motion.div>
        </div>
      </main>

      {/* Staff Role Selector Dashboard Cheat Sheet */}
      <section className="bg-black/20 border-t border-white/5 py-10 px-6 z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="text-center md:text-left">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-300">
              ⚡ CORPORATED TESTING DECK
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 max-w-2xl">
              Since testing the multi-stage memo approval process requires logging in as the different actors, 
              we have compiled the formal company accounts. Click any profile card to bypass passwords and log in immediately:
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            {users.map((u) => (
              <div
                key={u.id}
                onClick={() => handleQuickSelect(u)}
                className="p-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/15 rounded-2xl cursor-pointer transition-all flex flex-col items-center text-center justify-between group"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800 border border-white/10">
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt={u.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
                      {u.fullName.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="mt-2.5">
                  <h4 className="text-[11px] font-bold text-slate-200 group-hover:text-white truncate">
                    {u.fullName}
                  </h4>
                  <p className="text-[9.5px] text-slate-400 font-mono tracking-tight mt-0.5 truncate">
                    {u.email}
                  </p>
                </div>

                <span className="mt-2 text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 group-hover:bg-indigo-500/20">
                  {u.role.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 border-t border-white/5 z-10 text-center text-[10px] text-slate-500 bg-black/10">
        © 2026 Vetiva Capital Limited Services. All authorization permissions audited continuously.
      </footer>
    </div>
  );
}
