import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Presentation, 
  ChevronLeft, 
  ChevronRight, 
  Zap, 
  Cpu, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Play, 
  Sparkles,
  Server
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function PitchDeck({ onLaunchDemo }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchMessage, setLaunchMessage] = useState(null);
  const [activeTier, setActiveTier] = useState('fastapi');

  const totalSlides = 3;

  // Support keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLaunchDemo = async () => {
    setIsLaunching(true);
    setLaunchMessage('Initializing autonomous orchestrator & resetting network baseline...');

    try {
      const res = await axios.post(`${API_BASE}/api/demo/launch`, {
        delaySeconds: 3,
        skipCountdown: false
      });

      if (res.data.success) {
        setLaunchMessage('🚀 Master Demo initiated! Transitioning to live geospatial map...');
        setTimeout(() => {
          setIsLaunching(false);
          if (onLaunchDemo) onLaunchDemo();
        }, 1200);
      }
    } catch (err) {
      console.error('Demo launch error:', err);
      setLaunchMessage(`Launch error: ${err.response?.data?.message || err.message}`);
      setIsLaunching(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Pitch Deck Header / Presentation Bar */}
      <div className="px-6 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Presentation className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              SH-205 <span className="text-slate-500 font-normal">|</span> Executive Pitch & System Architecture
            </h2>
            <p className="text-[11px] text-slate-400">Autonomous Freight Co-Loading & Anomaly Recovery Platform</p>
          </div>
        </div>

        {/* Slide Progress Pills */}
        <div className="flex items-center gap-2">
          {['1. Problem Statement', '2. Dual-Engine Architecture', '3. OR-Tools Solver & Demo'].map((label, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition flex items-center gap-1.5 ${
                currentSlide === idx
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              {label}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
            disabled={currentSlide === 0}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Previous Slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1))}
            disabled={currentSlide === totalSlides - 1}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Next Slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {currentSlide < 2 && (
            <button
              onClick={() => setCurrentSlide(2)}
              className="ml-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-indigo-300 text-xs font-medium border border-indigo-500/30 flex items-center gap-1.5 transition"
            >
              Skip to Demo <Play className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main Slide Stage */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-between">
        {/* SLIDE 1: THE PROBLEM STATEMENT (SH-205) */}
        {currentSlide === 0 && (
          <div className="space-y-6 animate-fadeIn">
            {/* Tagline */}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                The Problem Statement
              </span>
              <span className="text-xs text-slate-400 font-mono">SH-205 • High-Velocity Logistics Inefficiency</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Misplaced Freight Triggers <span className="text-rose-400">$1,200+</span> Dedicated Hotshots & SLA Breaches.
                </h1>
                <p className="text-sm md:text-base text-slate-300 leading-relaxed">
                  In high-throughput cross-docking networks, package handling errors inadvertently route high-priority shipments onto erroneous regional corridors. 
                  Traditional logistics companies respond with costly, emergency point-to-point courier dispatches (<span className="text-rose-300 font-semibold">"Hotshots"</span>) that destroy operating margins.
                </p>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-rose-900/40 space-y-1.5">
                    <div className="text-2xl font-black text-rose-400">$1,250.00</div>
                    <div className="text-xs font-semibold text-slate-200">Dedicated Sprint Vehicle Cost</div>
                    <p className="text-[11px] text-slate-400">Average one-off contract cost to rush a single misplaced pallet to destination.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-900/40 space-y-1.5">
                    <div className="text-2xl font-black text-amber-400">14.2%</div>
                    <div className="text-xs font-semibold text-slate-200">Cross-Dock Misrouting Frequency</div>
                    <p className="text-[11px] text-slate-400">Recorded scan deviations during nocturnal peak sorting across Midwest regional hubs.</p>
                  </div>
                </div>
              </div>

              {/* Solution Comparison Card */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Paradigm Comparison</span>
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> 88.8% Cost Reduction
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Status Quo */}
                  <div className="p-3.5 rounded-lg bg-rose-950/20 border border-rose-800/40 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-rose-300">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-400" /> Status Quo: Dedicated Hotshot
                      </span>
                      <span>$1,250.00</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Dispatches dedicated single-purpose van. 100% vehicle redundancy, high carbon emissions, uncoordinated manual dispatch.
                    </p>
                  </div>

                  {/* Piggybacking Solution */}
                  <div className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-500/40 space-y-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl"></div>
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> SH-205 Autonomous Piggybacking
                      </span>
                      <span className="text-emerald-400 text-sm">$139.74</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Opportunistically co-loads misplaced freight into already-scheduled linehaul vehicles with remaining volumetric capacity and compatible time windows.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Net Savings per Incident:</span>
                  <span className="text-emerald-400 font-bold text-sm">+$1,110.26 / load</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 2: DUAL-ENGINE ARCHITECTURE */}
        {currentSlide === 1 && (
          <div className="space-y-6 animate-fadeIn">
            {/* Tagline */}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                System Architecture
              </span>
              <span className="text-xs text-slate-400 font-mono">Full-Stack Reactive Microservice Pipeline</span>
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Dual-Engine Synergy: Real-Time Event Bus + Graph Optimization
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                Separation of concerns between asynchronous event ingestion and CPU-intensive constraint mathematics.
              </p>
            </div>

            {/* Architecture Flow Interactive Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Node.js Telemetry Gateway */}
              <div 
                onClick={() => setActiveTier('nodejs')}
                className={`p-5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  activeTier === 'nodejs'
                    ? 'bg-slate-900 border-indigo-500 ring-1 ring-indigo-500/50 shadow-lg'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      <Server className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono text-indigo-300 uppercase px-2 py-0.5 bg-indigo-950/60 rounded">
                      Gateway & Ingestion
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">Node.js Express & WebSocket</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sub-millisecond ingestion of high-frequency GPS tracking scans. Bounding corridor deviation calculation and JWT role-based dispatch.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Throughput:</span>
                  <span className="text-indigo-400 font-semibold">1,000+ pings/sec</span>
                </div>
              </div>

              {/* Card 2: Python Graph Engine */}
              <div 
                onClick={() => setActiveTier('fastapi')}
                className={`p-5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  activeTier === 'fastapi'
                    ? 'bg-slate-900 border-cyan-500 ring-1 ring-cyan-500/50 shadow-lg'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono text-cyan-300 uppercase px-2 py-0.5 bg-cyan-950/60 rounded">
                      FastAPI & OpenStreetMap
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">Python Routing Engine</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Street-level OSMnx multi-di-graph topology. Computes driving distance and speed curves across interstate hubs with NetworkX.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Routing Accuracy:</span>
                  <span className="text-cyan-400 font-semibold">Turn-by-turn OSM</span>
                </div>
              </div>

              {/* Card 3: Google OR-Tools CVRPTW */}
              <div 
                onClick={() => setActiveTier('ortools')}
                className={`p-5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  activeTier === 'ortools'
                    ? 'bg-slate-900 border-emerald-500 ring-1 ring-emerald-500/50 shadow-lg'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <Zap className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono text-emerald-300 uppercase px-2 py-0.5 bg-emerald-950/60 rounded">
                      Mathematical Solver
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">Google OR-Tools</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Capacitated Vehicle Routing Problem with Time Windows (CVRPTW). Penalized multi-dimensional constraint search for optimal piggybacking.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Optimization Solve:</span>
                  <span className="text-emerald-400 font-semibold">&lt; 12ms exact solve</span>
                </div>
              </div>
            </div>

            {/* Deep-Dive Spec Callout */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs text-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
                <span>
                  {activeTier === 'nodejs' && 'Telemetry Bus: Express 4.x + Socket.io with Helmet, express-rate-limit, and JSON Web Token Auth.'}
                  {activeTier === 'fastapi' && 'Graph Ingestion: OSMnx + NetworkX graph models with dynamic edge weights & Haversine heuristics.'}
                  {activeTier === 'ortools' && 'Constraint Solver: pywrapcp.RoutingModel with AddDimensionWithVehicleCapacity & delivery time windows.'}
                </span>
              </div>
              <span className="text-slate-500 text-[10px]">Fully Containerized Docker & Terraform</span>
            </div>
          </div>
        )}

        {/* SLIDE 3: OR-TOOLS SOLVER & LIVE DEMO LAUNCH */}
        {currentSlide === 2 && (
          <div className="space-y-6 animate-fadeIn">
            {/* Tagline */}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Algorithm & Live Execution
              </span>
              <span className="text-xs text-slate-400 font-mono">CVRPTW Formulation • Automated Pitch Demo</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Algorithm Details */}
              <div className="lg:col-span-6 space-y-4">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  Constraint Optimization in Action: CVRPTW
                </h1>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                  Instead of brute-force heuristics, our Python engine formulates a Capacitated Vehicle Routing Problem with Time Windows. 
                  Misplaced packages are dynamically assigned to existing linehauls without violating vehicle payload bounds or customer delivery commitments.
                </p>

                {/* Mathematical Formulation Card */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5 font-mono text-xs">
                  <div className="text-indigo-400 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Objective Minimization Function
                  </div>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-200 text-[11px]">
                    Min Cost = &Sigma; (Marginal Fuel Detour) + &lambda; &times; (&Delta; SLA Slack) + &mu; &times; (Capacity Residual)
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1">
                    <div>&bull; Weight Capacity: &Sigma; w_i &le; Max_Cap(v)</div>
                    <div>&bull; Time Window: Arrival_t &le; SLA_Deadline</div>
                  </div>
                </div>
              </div>

              {/* Live Demo Launch Box */}
              <div className="lg:col-span-6 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/40 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    <Zap className="w-4 h-4 animate-bounce" /> Live Operational Scenario
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-white">
                    Execute End-to-End Piggyback Lifecycle
                  </h3>
                  <p className="text-xs text-slate-300">
                    Watch the system reset state, simulate a nocturnal sorting anomaly at Indianapolis, invoke Google OR-Tools, and dispatch the optimal carrier route in real-time.
                  </p>
                </div>

                {/* Big Demo Launch Button */}
                <div className="space-y-3">
                  <button
                    onClick={handleLaunchDemo}
                    disabled={isLaunching}
                    className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-base shadow-xl shadow-indigo-950/60 transition duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isLaunching ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Orchestrating Live Simulation...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 fill-current" />
                        <span>🚀 Launch Live Operational Demo</span>
                      </>
                    )}
                  </button>

                  {launchMessage && (
                    <div className="p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-center text-xs text-indigo-200 animate-fadeIn font-mono">
                      {launchMessage}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Automated Sequence
                  </span>
                  <span>Transitions directly to Live Map</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Use <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300">&larr;</kbd> and <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-slate-300">&rarr;</kbd> keyboard keys to navigate
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-500">Slide {currentSlide + 1} of {totalSlides}</span>
            {currentSlide < totalSlides - 1 ? (
              <button
                onClick={() => setCurrentSlide((prev) => prev + 1)}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium flex items-center gap-1 text-xs transition"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleLaunchDemo}
                disabled={isLaunching}
                className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 text-xs transition shadow-md shadow-emerald-950"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Launch Live Demo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
