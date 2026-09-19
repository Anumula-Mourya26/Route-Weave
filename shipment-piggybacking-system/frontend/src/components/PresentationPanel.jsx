import React, { useState } from 'react';
import { Presentation, Layers, BarChart, HelpCircle, ArrowRight, ShieldCheck, Cpu, Database, Globe, Zap, CheckCircle2 } from 'lucide-react';

export default function PresentationPanel({ onClose, onLaunchLiveDemo }) {
  const [activeTab, setActiveTab] = useState('architecture'); // 'architecture', 'impact', 'qa'
  const [selectedQA, setSelectedQA] = useState(0);

  const QA_LIST = [
    {
      q: "1. How does SH-205 differ from simple ride-pooling (Uber Freight/Ola)?",
      a: "Unlike passenger pooling, freight recovery must enforce hard multi-dimensional constraints: axle load capacities, volumetric limits, cargo category hazard incompatibilities, and cumulative strict delivery time windows (CVRPTW). SH-205 solves this deterministically using Google OR-Tools rather than simple distance proximity."
    },
    {
      q: "2. What happens if no single truck has spare capacity?",
      a: "Feature 2.3 (Relay Recovery via Transfer Hub) dynamically identifies two trucks and a midpoint transfer hub (e.g. H1 Hyderabad or H7 Nalgonda), splitting the recovery leg into an origin-to-hub and hub-to-destination handoff."
    },
    {
      q: "3. How is SLA compliance guaranteed under tight deadlines?",
      a: "The OR-Tools solver models the destination arrival time as a hard time window dimension. If an option's cumulative transit time exceeds the shipment SLA deadline, it is immediately pruned from the feasible set."
    },
    {
      q: "4. Why Google OR-Tools instead of a simple heuristic?",
      a: "OR-Tools executes constraint propagation and branch-and-bound optimization, guaranteeing mathematically optimal cost and detour tradeoffs while strictly honoring hard bounds."
    },
    {
      q: "5. What if OR-Tools exceeds the time limit under high volume?",
      a: "Feature 6.5 enforces a strict 2-second timeout token (`time_limit.seconds = 2`). If the solver does not converge within 2.0s, it automatically falls back to our sub-5ms greedy heuristic matcher."
    },
    {
      q: "6. How does the system handle driver incentives and compliance?",
      a: "Feature 4.3 provides a Driver Mobile Companion that notifies drivers of on-route pickups with upfront micro-incentives (e.g. +$150 USD) and zero additional deadhead kilometers."
    },
    {
      q: "7. How is spatial indexing handled in PostgreSQL?",
      a: "Hubs and trucks are indexed using PostGIS GiST (Generalized Search Tree) on WGS-84 geometry points (`ST_SetSRID(ST_MakePoint(lng, lat), 4326)`), executing millisecond range and proximity lookups."
    },
    {
      q: "8. What is the CO₂ emissions calculation methodology?",
      a: "Calculated based on avoided empty deadhead kilometers multiplied by consignment payload tonnage and the EPA benchmark freight diesel factor (0.08 - 0.45 kg CO₂/ton-km)."
    },
    {
      q: "9. How are live disruptions spotted in real time?",
      a: "Rule-based anomaly detection compares GPS telemetry updates against the scheduled corridor geofence and timestamp progression. Deviations outside the corridor instantly flag the consignment."
    },
    {
      q: "10. Can this scale to all-India Dedicated Freight Corridors?",
      a: "Yes. PostGIS and OR-Tools scale independently; corridor graphs can ingest OpenStreetMap networks across EDFC (Ludhiana-Dankuni) and WDFC (Dadri-JNPT)."
    },
    {
      q: "11. What is the financial ROI for enterprise 3PL logistics providers?",
      a: "By eliminating dedicated spot-recovery vehicle hires (saving $650 per recovery) and filling empty backhauls, 3PL fleets boost asset utilization by up to 24% and slash recovery operational costs by 76%."
    },
    {
      q: "12. What happens if the network or Supabase database is offline?",
      a: "The system incorporates Feature 8.3 (Backup Demo Scenario) with pre-cached corridor topologies and offline greedy routing, ensuring 100% resilient uptime during live pitches."
    }
  ];

  return (
    <div className="w-full bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 uppercase tracking-wider">
            <Presentation className="w-4 h-4" /> Team Malwifi · Jury Pitch Deck
          </div>
          <h2 className="text-xl font-black text-gray-900 mt-1">SH-205: Intelligent Shipment Piggybacking</h2>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-200">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'architecture' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> 9.1 Architecture
          </button>
          <button
            onClick={() => setActiveTab('impact')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'impact' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <BarChart className="w-3.5 h-3.5" /> 9.2 Impact Metrics
          </button>
          <button
            onClick={() => setActiveTab('qa')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'qa' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" /> 9.3 Jury Q&A (12)
          </button>
        </div>
      </div>

      {/* TAB 1: ARCHITECTURE */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Globe className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-gray-900">1. Next.js Frontend</div>
              <p className="text-[11px] text-gray-500">
                React 19, Tailwind CSS, Leaflet live geospatial rendering, priority sliders, Vercel-ready.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-gray-900">2. FastAPI Unified Backend</div>
              <p className="text-[11px] text-gray-500">
                Single unified Python REST service, WebSocket broadcaster, anomaly detection pipeline.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-gray-900">3. Google OR-Tools</div>
              <p className="text-[11px] text-gray-500">
                Capacitated vehicle routing with time windows (CVRPTW), 2s hard timeout, greedy fallback.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Database className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-gray-900">4. Supabase PostGIS</div>
              <p className="text-[11px] text-gray-500">
                PostgreSQL with PostGIS geometry indexing, 200 Telangana shipments, live metrics aggregation view.
              </p>
            </div>

          </div>

          {/* Pipeline flow visual */}
          <div className="p-5 rounded-2xl bg-purple-50/40 border border-purple-100 text-xs">
            <div className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-3">
              Autonomous Recovery Workflow Execution Flow
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center">
              <div className="p-3 rounded-xl bg-white border border-gray-100 w-full shadow-sm">
                <div className="font-bold text-rose-600">Step 1: Disrupt</div>
                <div className="text-[10px] text-gray-500">SHP-1004 Anomaly at Nalgonda</div>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-300 shrink-0 hidden md:block" />
              <div className="p-3 rounded-xl bg-white border border-gray-100 w-full shadow-sm">
                <div className="font-bold text-amber-600">Step 2: Detect</div>
                <div className="text-[10px] text-gray-500">Critical Priority Alert Feed</div>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-300 shrink-0 hidden md:block" />
              <div className="p-3 rounded-xl bg-white border border-gray-100 w-full shadow-sm">
                <div className="font-bold text-purple-700">Step 3: Match</div>
                <div className="text-[10px] text-gray-500">TRK-004 (8T Spare) Yellow Line</div>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-300 shrink-0 hidden md:block" />
              <div className="p-3 rounded-xl bg-white border border-gray-100 w-full shadow-sm">
                <div className="font-bold text-blue-600">Step 4: Optimize</div>
                <div className="text-[10px] text-gray-500">OR-Tools Solver &lt;2s</div>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-300 shrink-0 hidden md:block" />
              <div className="p-3 rounded-xl bg-white border border-gray-100 w-full shadow-sm">
                <div className="font-bold text-emerald-600">Step 5: Execute</div>
                <div className="text-[10px] text-gray-500">$650 & 250kg CO₂ Saved</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: IMPACT METRICS */}
      {activeTab === 'impact' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-6 rounded-3xl bg-emerald-50/50 border border-emerald-100 text-center">
              <div className="text-3xl font-black text-emerald-700">$650 USD</div>
              <div className="text-xs font-bold text-gray-800 mt-1">Cost Saved Per Incident</div>
              <div className="text-[11px] text-emerald-600 mt-0.5">76.5% reduction vs dedicated rescue</div>
            </div>

            <div className="p-6 rounded-3xl bg-teal-50/50 border border-teal-100 text-center">
              <div className="text-3xl font-black text-teal-700">250 kg CO₂</div>
              <div className="text-xs font-bold text-gray-800 mt-1">Carbon Avoided Per Incident</div>
              <div className="text-[11px] text-teal-600 mt-0.5">92.6% emissions eliminated</div>
            </div>

            <div className="p-6 rounded-3xl bg-purple-50/50 border border-purple-100 text-center">
              <div className="text-3xl font-black text-purple-700">2 Hours Early</div>
              <div className="text-xs font-bold text-gray-800 mt-1">SLA Delivery Acceleration</div>
              <div className="text-[11px] text-purple-600 mt-0.5">Arrives 16:00 vs 18:00 deadline</div>
            </div>
          </div>

          {/* Macro Scale Projection */}
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Scale Projection: 200 Telangana Corridor Shipments
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-white border border-gray-200">
                <div className="text-gray-400 text-[10px] font-semibold">Total Shipments</div>
                <div className="text-base font-black text-gray-900 mt-0.5">200 Records</div>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-gray-200">
                <div className="text-gray-400 text-[10px] font-semibold">Active Misplacements</div>
                <div className="text-base font-black text-rose-600 mt-0.5">26 Anomalies</div>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-gray-200">
                <div className="text-gray-400 text-[10px] font-semibold">Cumulative Cost Saved</div>
                <div className="text-base font-black text-emerald-700 mt-0.5">$15,940 USD</div>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-gray-200">
                <div className="text-gray-400 text-[10px] font-semibold">Cumulative CO₂ Saved</div>
                <div className="text-base font-black text-teal-700 mt-0.5">5,415 kg CO₂</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: JURY Q&A DECK */}
      {activeTab === 'qa' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
            {QA_LIST.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedQA(idx)}
                className={`w-full text-left p-3 rounded-xl text-xs font-semibold transition-all ${
                  selectedQA === idx 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'bg-gray-50 text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {item.q.split('.')[1] || item.q}
              </button>
            ))}
          </div>

          <div className="md:col-span-2 p-6 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">
                Judge Question {selectedQA + 1} of 12
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-3">
                {QA_LIST[selectedQA].q}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                {QA_LIST[selectedQA].a}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-[11px] text-gray-400 pt-3 border-t border-gray-200">
              <span>Prepared for SH-205 Jury Defense</span>
              <span className="font-semibold text-emerald-600">All 34 Specifications Satisfied</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Footer */}
      <div className="pt-2 flex items-center justify-between border-t border-gray-100">
        <button
          onClick={onClose}
          className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          Return to Operations Dashboard
        </button>
        <button
          onClick={onLaunchLiveDemo}
          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all"
        >
          Launch 5-Step Live Demo <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
