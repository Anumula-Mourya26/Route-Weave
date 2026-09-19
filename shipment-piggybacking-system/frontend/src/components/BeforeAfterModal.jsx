import React from 'react';
import { CheckCircle, AlertTriangle, ArrowRight, ShieldCheck, X, IndianRupee, Leaf, Clock, TrendingUp } from 'lucide-react';

export default function BeforeAfterModal({ isOpen, onClose, shipment, recoveryData }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-gray-900">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Before vs After Recovery Comparison</h3>
              <p className="text-xs text-gray-500">Jury Impact Analysis: Dedicated Rescue vs Autonomous Piggybacking</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          
          {/* Target Consignment Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-xs gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-500">Target Consignment:</span>
              <span className="font-bold text-purple-700">SHP-1004 (Tata Motors)</span>
              <span className="text-gray-300 hidden sm:inline">|</span>
              <span className="text-gray-600 font-medium">4.5 Tons · Electronics</span>
              <span className="text-gray-300 hidden sm:inline">|</span>
              <span className="text-gray-600 font-medium">Route: Hyderabad ➔ Warangal</span>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200 text-[11px] w-fit">
              Misplaced Hub: Nalgonda (H7)
            </div>
          </div>

          {/* Side-by-side Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Card 1: Traditional Dedicated Rescue */}
            <div className="p-5 rounded-2xl bg-rose-50/40 border border-rose-200 relative">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  Baseline: Dedicated Recovery
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                  Manual Dispatch
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-rose-100">
                  <span className="text-xs text-gray-600 flex items-center gap-1.5">
                    <IndianRupee className="w-4 h-4 text-rose-600" /> Total Recovery Cost
                  </span>
                  <span className="text-base font-black text-rose-700">₹8,500 INR</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-rose-100">
                  <span className="text-xs text-gray-600 flex items-center gap-1.5">
                    <Leaf className="w-4 h-4 text-rose-600" /> Carbon Emissions
                  </span>
                  <span className="text-base font-black text-rose-700">270 kg CO₂</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-rose-100">
                  <span className="text-xs text-gray-600 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-rose-600" /> Delivery Arrival
                  </span>
                  <span className="text-base font-bold text-rose-700">18:00 (On Deadline Brink)</span>
                </div>

                <div className="flex justify-between items-center py-1.5 text-xs text-gray-500">
                  <span>Empty Backhaul Penalty</span>
                  <span className="font-semibold text-rose-600">135 km Deadhead Miles</span>
                </div>
              </div>

              <div className="mt-4 p-2.5 rounded-xl bg-white border border-rose-200 text-[11px] text-rose-700">
                ⚠️ Mobilizes an empty spot-hire truck from depot. Highest operational cost and carbon footprint.
              </div>
            </div>

            {/* Card 2: SH-205 Piggyback Optimization */}
            <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-200 relative">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Proposed: SH-205 Piggyback
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  OR-Tools Matched
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-emerald-100">
                  <span className="text-xs text-gray-600 flex items-center gap-1.5">
                    <IndianRupee className="w-4 h-4 text-emerald-600" /> Total Recovery Cost
                  </span>
                  <span className="text-base font-black text-emerald-700">₹2,000 INR</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-emerald-100">
                  <span className="text-xs text-gray-600 flex items-center gap-1.5">
                    <Leaf className="w-4 h-4 text-emerald-600" /> Carbon Emissions
                  </span>
                  <span className="text-base font-black text-emerald-700">20 kg CO₂</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-emerald-100">
                  <span className="text-xs text-gray-600 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" /> Delivery Arrival
                  </span>
                  <span className="text-base font-bold text-emerald-700">16:00 (2 Hours Early)</span>
                </div>

                <div className="flex justify-between items-center py-1.5 text-xs text-gray-500">
                  <span>Carrier Detour</span>
                  <span className="font-semibold text-emerald-700">0.0 km (Direct On-Route)</span>
                </div>
              </div>

              <div className="mt-4 p-2.5 rounded-xl bg-white border border-emerald-200 text-[11px] text-emerald-800">
                ✅ Utilizes TRK-004's 8 Tons spare capacity traveling on corridor H1 ➔ H7 ➔ H2.
              </div>
            </div>

          </div>

          {/* Bottom Callout Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-purple-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-around gap-4 text-center">
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Net Cost Saved</div>
              <div className="text-2xl font-black text-emerald-700">₹6,500 INR</div>
            </div>
            <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Carbon Avoided</div>
              <div className="text-2xl font-black text-teal-700">250 kg CO₂</div>
            </div>
            <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Delivery Acceleration</div>
              <div className="text-2xl font-black text-purple-700">2 Hours Early</div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs transition-colors"
          >
            Close Analysis
          </button>
        </div>

      </div>
    </div>
  );
}
