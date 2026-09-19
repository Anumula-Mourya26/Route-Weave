import React, { useState } from 'react';
import { Truck, MapPin, DollarSign, Clock, ShieldCheck, Check, X, AlertCircle, Phone, ArrowRight } from 'lucide-react';

export default function DriverMobileView({ isOpen, onClose, onAccept, onDecline, matchedTruck, anomalyData }) {
  const [accepted, setAccepted] = useState(false);

  if (!isOpen) return null;

  const handleAccept = () => {
    setAccepted(true);
    setTimeout(() => {
      onAccept && onAccept();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      {/* Smartphone Frame */}
      <div className="relative w-full max-w-sm bg-slate-900 border-4 border-slate-700 rounded-[38px] shadow-2xl overflow-hidden text-slate-100 font-sans">
        
        {/* Phone Notch */}
        <div className="w-full flex justify-center pt-2 pb-1 bg-slate-950">
          <div className="w-24 h-4 bg-slate-800 rounded-full flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 mr-2"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
          </div>
        </div>

        {/* Mobile App Header */}
        <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center justify-center text-xs font-black">
              TRK
            </div>
            <div>
              <div className="text-xs font-bold leading-tight">Vikram Singh</div>
              <div className="text-[10px] text-slate-400">TRK-004 · 14T Eicher Pro</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Body */}
        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
          
          {/* Urgent Dispatch Notification Card */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> PIGGYBACK OPPORTUNITY
              </span>
              <span className="text-xs font-black text-emerald-400">+₹1,500 Incentive</span>
            </div>
            <h4 className="text-sm font-bold text-white mt-2">Corridor Pickup Request</h4>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Pickup misplaced cargo along your existing route to Warangal.
            </p>
          </div>

          {/* Shipment Details */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>Consignment:</span>
              <span className="font-bold text-white">SHP-1004 (Tata Motors)</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Cargo Weight:</span>
              <span className="font-semibold text-white">4.5 Tons</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Your Spare Capacity:</span>
              <span className="font-bold text-emerald-400">8.0 Tons Available</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Detour Required:</span>
              <span className="font-bold text-emerald-400">0 km (On-Route)</span>
            </div>
          </div>

          {/* Route Stepper */}
          <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 text-xs space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center text-[10px] font-bold mt-0.5">
                A
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Pickup Hub</div>
                <div className="font-bold text-white">Nalgonda Hub (H7)</div>
                <div className="text-[10px] text-slate-400">Gate 3 Loading Bay · Bay Supervisor on standby</div>
              </div>
            </div>

            <div className="ml-2.5 border-l-2 border-dashed border-slate-700 h-4"></div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold mt-0.5">
                B
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Dropoff Hub</div>
                <div className="font-bold text-white">Warangal Hub (H2)</div>
                <div className="text-[10px] text-emerald-400">Est. Arrival: 16:00 (2 hrs early)</div>
              </div>
            </div>
          </div>

          {/* Driver Actions */}
          {accepted ? (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500 text-center text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 animate-pulse">
              <Check className="w-4 h-4" /> Waybill Confirmed · Route Updated!
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => { onDecline && onDecline(); onClose(); }}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-1"
              >
                Accept (+₹1,500)
              </button>
            </div>
          )}

        </div>

        {/* Bottom Home Indicator */}
        <div className="py-2 bg-slate-950 flex justify-center">
          <div className="w-32 h-1 bg-slate-700 rounded-full"></div>
        </div>

      </div>
    </div>
  );
}
