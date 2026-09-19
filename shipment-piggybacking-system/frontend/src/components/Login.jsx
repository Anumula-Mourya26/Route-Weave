import React, { useState } from 'react';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  LogIn, 
  Compass, 
  Truck, 
  UserCheck, 
  AlertCircle,
  KeyRound,
  Sparkles
} from 'lucide-react';

export default function Login() {
  const { login, demoLogin, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!email || !password) {
      setLocalError('Please provide both email/username and password.');
      return;
    }
    const res = await login(email, password);
    if (!res.success) {
      setLocalError(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 font-sans relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30 shadow-lg shadow-indigo-950">
            <Compass className="w-8 h-8 animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            SH-205 <span className="text-slate-500 font-light">|</span> Intelligent Piggybacking
          </h1>
          <p className="text-xs text-slate-400">
            Enterprise Role-Based Access Control (RBAC) & Real-Time Logistics Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-6 shadow-2xl shadow-slate-950 space-y-5">
          {(error || localError) && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-xs text-rose-300 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{localError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address or Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. admin@piggyback.internal"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-950 transition disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Authenticating...' : 'Sign In to Operations Console'}
            </button>
          </form>

          {/* Quick Demo Switcher Section */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Instant Demo Role Switcher:</span>
            </div>

            <div className="space-y-2">
              {/* Admin Button */}
              <button
                type="button"
                onClick={() => demoLogin('LOGISTICS_ADMIN')}
                disabled={loading}
                className="w-full text-left p-2.5 bg-purple-950/20 hover:bg-purple-900/30 border border-purple-500/30 rounded-xl flex items-center justify-between group transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-purple-500/20 text-purple-300 rounded-lg">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-purple-200">Logistics Admin (Sarah Chen)</div>
                    <div className="text-[10px] text-purple-400/80">Full permissions: SLA Analytics, Execution, Ledger</div>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-purple-300/60 group-hover:text-purple-300 transition">1-Click</span>
              </button>

              {/* Dispatcher Button */}
              <button
                type="button"
                onClick={() => demoLogin('DISPATCHER')}
                disabled={loading}
                className="w-full text-left p-2.5 bg-blue-950/20 hover:bg-blue-900/30 border border-blue-500/30 rounded-xl flex items-center justify-between group transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-blue-500/20 text-blue-300 rounded-lg">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-blue-200">Dispatcher (Alex Rivera)</div>
                    <div className="text-[10px] text-blue-400/80">Route approval, anomaly resolution (SLA hidden)</div>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-blue-300/60 group-hover:text-blue-300 transition">1-Click</span>
              </button>

              {/* Fleet Driver Button */}
              <button
                type="button"
                onClick={() => demoLogin('FLEET_DRIVER')}
                disabled={loading}
                className="w-full text-left p-2.5 bg-amber-950/20 hover:bg-amber-900/30 border border-amber-500/30 rounded-xl flex items-center justify-between group transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-amber-500/20 text-amber-300 rounded-lg">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-200">Fleet Driver (Marcus Vance)</div>
                    <div className="text-[10px] text-amber-400/80">Read-only map telemetry (Approve buttons hidden)</div>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-amber-300/60 group-hover:text-amber-300 transition">1-Click</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-slate-500">
          Protected by SHA-256 HMAC JWT verification & bcrypt salted credentials.
        </p>
      </div>
    </div>
  );
}
