import React from 'react';
import { useAuth } from '../context/AuthContext';
import Login from './Login';
import { ShieldX, AlertOctagon, ArrowLeft, KeyRound } from 'lucide-react';

/**
 * ProtectedRoute wrapper component
 * - If not authenticated: renders Login view
 * - If user lacks role from allowedRoles: renders 403 Forbidden component
 * - Otherwise: renders children
 */
export default function ProtectedRoute({ allowedRoles = [], children, onResetView }) {
  const { user, isAuthenticated, hasRole, logout } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return (
      <div className="min-h-[450px] flex items-center justify-center p-6 bg-slate-900/40 rounded-xl border border-rose-900/50">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <ShieldX className="w-8 h-8 animate-pulse" />
          </div>

          <div>
            <span className="px-2.5 py-1 text-[11px] font-mono font-bold uppercase rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
              HTTP 403 Forbidden
            </span>
            <h2 className="text-lg font-bold text-white mt-2">Access Restricted by RBAC Policy</h2>
            <p className="text-xs text-slate-400 mt-1">
              Your active role <strong className="text-amber-300 font-mono">[{user?.role}]</strong> does not have permission to view this resource.
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-left text-xs space-y-1.5 font-mono">
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Current User:</span>
              <span className="text-slate-200">{user?.name}</span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Your Role:</span>
              <span className="text-rose-400">{user?.role}</span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Required Role:</span>
              <span className="text-emerald-400">{allowedRoles.join(', ')}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            {onResetView && (
              <button
                onClick={onResetView}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Network Map
              </button>
            )}

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
