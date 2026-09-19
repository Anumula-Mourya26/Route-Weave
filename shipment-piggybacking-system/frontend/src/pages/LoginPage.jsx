import React, { useState } from 'react';
import { useRouter } from '../router/Router';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { navigate } = useRouter();
  const { login, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    const res = await login(email, password);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setErrorMsg(res.error || 'Invalid credentials. Access restricted.');
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-gray-900 selection:text-white flex flex-col justify-between items-center px-6 py-10 antialiased">
      
      {/* Top Header Link */}
      <div className="w-full max-w-md flex items-center justify-between border-b border-gray-200 pb-5">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-900 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Index</span>
        </button>
        <span className="text-xs font-medium text-gray-400">
          Route Weave Gateway · SH-205
        </span>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md my-auto py-10 space-y-8 animate-fade-in">
        
        {/* Typographic Heading */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
            Authentication Required
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 leading-tight">
            Sign In to Control Tower
          </h1>
          <p className="text-sm text-gray-600 font-normal leading-relaxed pt-1">
            Access to the SH-205 Intelligent Shipment Piggybacking System is restricted to authorized operations personnel.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 border border-rose-200 bg-rose-50/50 rounded-xl flex items-start gap-3 text-xs text-rose-800 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div>
              <span className="font-semibold block">Access Denied</span>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">
              Authorized Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@routeweave.com"
              required
              disabled={loading}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-black transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Verifying Authorization...' : 'Sign In & Access'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </form>

        {/* Authorized Operator Note */}
        <div className="pt-4 border-t border-gray-100 text-center">
          <div className="text-xs text-gray-400">
            Operator Credentials Required · RFC-205 Protocol
          </div>
        </div>

      </div>

      {/* Minimal Footer */}
      <div className="w-full max-w-md pt-5 border-t border-gray-100 text-center text-xs text-gray-400">
        Route Weave Route Optimization · Telangana Corridor
      </div>

    </div>
  );
}
