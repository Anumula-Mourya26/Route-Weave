import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from '../router/Router';
import { ArrowRight, ArrowUpRight, Compass, ShieldAlert, Cpu, Truck, Activity, Radio, Layers } from 'lucide-react';

/**
 * Scroll-triggered animation wrapper for understated, smooth, slow reveals
 */
function RevealOnScroll({ children, className = '', delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
      }
    }, { threshold: 0.12 });

    const currentRef = domRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  return (
    <div
      ref={domRef}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const { navigate } = useRouter();

  return (
    <div className="bg-white text-black font-sans selection:bg-black selection:text-white antialiased">
      
      {/* =========================================================================
          1. HERO SECTION (White Canvas, Massive Typography, High-Contrast Image)
         ========================================================================= */}
      <section className="min-h-screen flex flex-col justify-between px-6 sm:px-12 lg:px-20 py-8 border-b border-black">
        
        {/* Top Minimalist Navigation Bar */}
        <header className="w-full flex items-center justify-between pb-8 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <span className="text-base font-bold tracking-tight text-black">
              Route Weave
            </span>
            <span className="text-xs text-neutral-500 border border-neutral-200 px-2 py-0.5 rounded-full">
              System v3.0
            </span>
          </div>

          <div>
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition cursor-pointer"
            >
              Sign In &rarr;
            </button>
          </div>
        </header>

        {/* Hero Headline & Image Grid */}
        <div className="py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left: Clean Minimalist Typography */}
          <div className="lg:col-span-7 space-y-6 animate-fade-in-up">
            
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-black leading-[1.05]">
              Route Weave
            </h1>

            <p className="text-lg sm:text-xl text-neutral-600 font-normal leading-relaxed max-w-xl">
              Intelligent Shipment Piggybacking
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-black text-white text-sm font-semibold rounded-xl hover:bg-neutral-800 transition cursor-pointer group"
              >
                <span>Sign In to Control Tower</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <span className="text-xs text-neutral-500 font-medium">
                Authorized Dispatcher Portal · Route Weave Auth Required
              </span>
            </div>

          </div>

          {/* Right: Fine Art Architectural Logistics Photo */}
          <div className="lg:col-span-5 animate-fade-in animation-delay-200">
            <div className="relative border border-neutral-200 rounded-2xl p-3 bg-neutral-50 shadow-sm group overflow-hidden">
              <div className="overflow-hidden aspect-[4/3] bg-neutral-900 rounded-xl relative">
                <img 
                  src="/images/bw_hero.jpg" 
                  alt="Telangana Linehaul Highway Viaduct"
                  className="w-full h-full object-cover grayscale contrast-125 filter group-hover:scale-105 transition-transform duration-1000 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                
                {/* Modern Clean Overlay */}
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white text-xs">
                  <div>
                    <div className="font-semibold text-neutral-200">Elevated Viaduct Corridor</div>
                    <div className="text-[11px] text-neutral-400">Hyderabad Corridor · NH-65 Axis</div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Active Network
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 flex items-center justify-between text-xs text-neutral-500 border-t border-neutral-200 mt-2">
                <span>Lat 17.3850° N / Lon 78.4867° E</span>
                <span className="font-semibold text-neutral-900">Velocity 62 km/h</span>
              </div>
            </div>
          </div>

        </div>

        {/* Hero KPI Strip */}
        <div className="pt-8 pb-4 border-t border-neutral-200 grid grid-cols-2 md:grid-cols-4 gap-6 text-xs text-neutral-600">
          <div>
            <div className="text-black font-bold text-base">32 Hubs</div>
            <div className="text-[12px] text-neutral-500 mt-0.5">Telangana Highway Grid</div>
          </div>
          <div>
            <div className="text-black font-bold text-base">75 Trucks</div>
            <div className="text-[12px] text-neutral-500 mt-0.5">Live Linehaul Fleet</div>
          </div>
          <div>
            <div className="text-black font-bold text-base">&lt; 2000 ms</div>
            <div className="text-[12px] text-neutral-500 mt-0.5">OR-Tools CVRPTW Solver</div>
          </div>
          <div>
            <div className="text-black font-bold text-base">₹ 15.29L</div>
            <div className="text-[12px] text-neutral-500 mt-0.5">Verified Freight Savings</div>
          </div>
        </div>

      </section>

      {/* =========================================================================
          2. THE PROBLEM SECTION (Stark Black Canvas, White Text, 100vh+)
         ========================================================================= */}
      <section id="problem" className="bg-black text-white px-6 sm:px-12 lg:px-20 py-36 sm:py-48 border-b border-neutral-800">
        <div className="max-w-6xl mx-auto space-y-24">
          
          <RevealOnScroll className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              The Transit Deviation Problem
            </span>
            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-tight max-w-5xl">
              Every day, thousands of tons of high-priority freight are stranded off-route.
            </h2>
          </RevealOnScroll>

          {/* Editorial Context & Problem Imagery */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center border-t border-neutral-800 pt-16">
            
            {/* Left Narrative */}
            <RevealOnScroll className="lg:col-span-6 space-y-6 text-neutral-300 text-lg leading-relaxed font-normal" delay={100}>
              <p>
                Off-route logistics deviations between regional hubs cause catastrophic SLA breaches. Traditional recovery relies on dedicated spot-hire trucks—generating empty deadhead miles, astronomical spot rates (₹35+/km), and unnecessary carbon waste.
              </p>
              <p>
                When a high-value consignment intended for Warangal is misrouted to Nalgonda or Khammam, manual dispatchers have no automated visibility into existing linehaul trucks already traveling that corridor with available payload.
              </p>
              <div className="pt-4 flex items-center gap-3 text-xs text-neutral-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span>Critical Challenge: Unassigned Freight Isolation</span>
              </div>
            </RevealOnScroll>

            {/* Right: Stranded Container Photo */}
            <RevealOnScroll className="lg:col-span-6" delay={200}>
              <div className="border border-neutral-800 rounded-2xl p-3 bg-neutral-950 group">
                <div className="aspect-[16/10] overflow-hidden bg-neutral-900 rounded-xl relative">
                  <img 
                    src="/images/bw_stranded.jpg" 
                    alt="Stranded Freight Container at Night"
                    className="w-full h-full object-cover grayscale contrast-150 filter group-hover:scale-105 transition-transform duration-1000 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none" />
                  
                  {/* Incident Telemetry Watermark */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/80 rounded-md border border-neutral-700 text-white text-[11px] font-semibold">
                    Incident INC002 · Stranded Consignment
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <div>
                      <div className="text-neutral-400">Actual Location: H05 Khammam</div>
                      <div className="font-bold text-rose-400">Deviation: 203.7 km Off-Route</div>
                    </div>
                    <div className="text-right text-neutral-300 font-medium">
                      SLA Deadline: -02:15:00
                    </div>
                  </div>
                </div>
                
                <div className="p-3 text-xs text-neutral-400 border-t border-neutral-900 mt-2 flex items-center justify-between">
                  <span>Dedicated Truck Penalty</span>
                  <span className="text-white font-bold">&gt; ₹ 12,500 Spot Rate</span>
                </div>
              </div>
            </RevealOnScroll>

          </div>

          {/* Metric Pillars */}
          <RevealOnScroll className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6" delay={300}>
            
            <div className="p-8 border border-neutral-800 rounded-2xl space-y-3 hover:border-neutral-700 transition bg-neutral-950/40">
              <div className="text-4xl sm:text-5xl font-bold text-white">203.7 km</div>
              <div className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
                Peak Off-Route Deviation
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-normal">
                Observed in authentic Telangana corridor incidents (e.g. Hyderabad to Khammam/Adilabad off-route shifts).
              </p>
            </div>

            <div className="p-8 border border-neutral-800 rounded-2xl space-y-3 hover:border-neutral-700 transition bg-neutral-950/40">
              <div className="text-4xl sm:text-5xl font-bold text-white">₹ 12,500+</div>
              <div className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
                Spot-Hire Surcharge per Incident
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-normal">
                Exorbitant ad-hoc carrier fees and deadhead return fuel costs for isolated recovery runs.
              </p>
            </div>

            <div className="p-8 border border-neutral-800 rounded-2xl space-y-3 hover:border-neutral-700 transition bg-neutral-950/40">
              <div className="text-4xl sm:text-5xl font-bold text-white">100%</div>
              <div className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
                Avoidable Deadhead Miles
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-normal">
                Surplus capacity in existing linehaul vehicles can accommodate 100% of stranded freight with zero new trucks.
              </p>
            </div>

          </RevealOnScroll>

        </div>
      </section>

      {/* =========================================================================
          3. THE SOLUTION / FEATURES SECTION (Pure White Canvas, 3-Column Grid)
         ========================================================================= */}
      <section id="solution" className="bg-white text-black px-6 sm:px-12 lg:px-20 py-36 sm:py-48 border-b border-black">
        <div className="max-w-6xl mx-auto space-y-20">
          
          <RevealOnScroll className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              The Optimization Engine
            </span>
            <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-black leading-tight">
              Dynamic Piggybacking Engine.
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl font-normal">
              A single unified computational pipeline connecting PostGIS spatial intelligence with Google OR-Tools combinatorial optimization.
            </p>
          </RevealOnScroll>

          {/* Solution Docking Hub Image */}
          <RevealOnScroll delay={100}>
            <div className="border border-neutral-200 rounded-2xl p-4 bg-neutral-50 group">
              <div className="aspect-[21/9] overflow-hidden bg-neutral-900 rounded-xl relative">
                <img 
                  src="/images/bw_hub.jpg" 
                  alt="Modern High-Tech Logistics Docking Hub"
                  className="w-full h-full object-cover grayscale contrast-125 filter group-hover:scale-105 transition-transform duration-1000 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white text-xs">
                  <div>
                    <div className="font-semibold text-neutral-200">Automated Docking Hub Matrix</div>
                    <div className="text-neutral-400">Warangal Hub 14 · 8,000 kg Reserve Capacity Pooled</div>
                  </div>
                  <div className="hidden sm:block text-right text-xs text-neutral-300">
                    <div className="text-emerald-400 font-semibold">Piggyback Feasibility: 100% Verified</div>
                    <div className="text-neutral-400">Deterministic Mathematical Solution</div>
                  </div>
                </div>
              </div>
              
              <div className="p-3 text-xs text-neutral-500 border-t border-neutral-200 mt-2 flex items-center justify-between">
                <span>Linehaul Corridor Intersect</span>
                <span className="text-neutral-900 font-semibold">Detour: 0.0 km (On-Route)</span>
              </div>
            </div>
          </RevealOnScroll>

          {/* 3-Column Editorial Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14 pt-8">
            
            {/* Column 1 */}
            <RevealOnScroll className="border-t-2 border-black pt-8 space-y-5" delay={150}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Feature 01
                </span>
                <Radio className="w-4 h-4 text-black animate-pulse" />
              </div>
              
              <h3 className="text-xl font-bold tracking-tight text-neutral-900">
                Real-Time Telemetry
              </h3>

              {/* Minimal Radar Graphic */}
              <div className="p-4 border border-neutral-200 bg-neutral-50 rounded-xl relative overflow-hidden h-28 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border border-neutral-300 flex items-center justify-center relative">
                  <div className="w-12 h-12 rounded-full border border-neutral-400 flex items-center justify-center" />
                  <div className="absolute top-0 left-0 w-full h-full rounded-full border-t-2 border-black animate-radar" />
                  <span className="w-2 h-2 rounded-full bg-black"></span>
                </div>
                <div className="absolute bottom-2 left-3 text-[10px] text-neutral-500 font-medium">
                  ST_DWithin 100m Precision
                </div>
              </div>

              <p className="text-sm text-neutral-600 leading-relaxed font-normal">
                Continuous PostGIS geospatial tracking across 32 regional Telangana hubs. Off-route consignments are isolated within 100 meters of route corridor boundary and broadcast instantly over WebSockets.
              </p>
              <div className="pt-3 text-xs text-neutral-500 border-t border-neutral-100 font-medium">
                PostgreSQL · PostGIS · ST_DWithin
              </div>
            </RevealOnScroll>

            {/* Column 2 */}
            <RevealOnScroll className="border-t-2 border-black pt-8 space-y-5" delay={250}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Feature 02
                </span>
                <Cpu className="w-4 h-4 text-black" />
              </div>

              <h3 className="text-xl font-bold tracking-tight text-neutral-900">
                Multi-Objective AI
              </h3>

              {/* Minimal Capacity Graphic */}
              <div className="p-4 border border-neutral-200 bg-neutral-50 rounded-xl relative space-y-2.5 h-28 flex flex-col justify-center">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Load Utilization</span>
                  <span className="font-semibold text-neutral-900">6,000 / 14,000 kg</span>
                </div>
                <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div className="w-[43%] h-full bg-black rounded-full" />
                </div>
                <div className="flex justify-between text-[11px] text-neutral-500 font-medium">
                  <span>+4,500 kg Cargo</span>
                  <span className="text-emerald-700 font-bold">Feasible (75% Max)</span>
                </div>
              </div>

              <p className="text-sm text-neutral-600 leading-relaxed font-normal">
                Google OR-Tools CVRPTW solver balancing financial cost, delivery speed, and carbon avoidance. Resolves capacity constraints and delivery deadlines in under 2.0 seconds with deterministic mathematical proof.
              </p>
              <div className="pt-3 text-xs text-neutral-500 border-t border-neutral-100 font-medium">
                Google OR-Tools · CVRPTW · &lt; 2000ms
              </div>
            </RevealOnScroll>

            {/* Column 3 */}
            <RevealOnScroll className="border-t-2 border-black pt-8 space-y-5" delay={350}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Feature 03
                </span>
                <Truck className="w-4 h-4 text-black" />
              </div>

              <h3 className="text-xl font-bold tracking-tight text-neutral-900">
                Dynamic Piggybacking
              </h3>

              {/* Minimal Route Relay Box */}
              <div className="p-4 border border-neutral-200 bg-neutral-50 rounded-xl relative h-28 flex flex-col justify-center text-xs">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5">
                  <span className="text-neutral-500">TRK-004 Corridor</span>
                  <span className="font-semibold text-black">H01 ➔ H07 ➔ H02</span>
                </div>
                <div className="flex items-center justify-between pt-1.5">
                  <span className="text-neutral-500">Cost Saved</span>
                  <span className="font-bold text-emerald-700">₹ 6,500.00</span>
                </div>
                <div className="text-[11px] text-neutral-500 pt-1">
                  250 kg CO₂ Avoided
                </div>
              </div>

              <p className="text-sm text-neutral-600 leading-relaxed font-normal">
                Zero empty spot vehicles deployed. Misplaced freight is automatically allocated to passing linehaul trucks with surplus capacity, slashing costs by up to 76.5% and abating 250 kg CO₂ per trip.
              </p>
              <div className="pt-3 text-xs text-neutral-500 border-t border-neutral-100 font-medium">
                Zero Deadheads · ₹6,500 Saved
              </div>
            </RevealOnScroll>

          </div>

          {/* Architecture Strip */}
          <RevealOnScroll delay={150}>
            <div id="architecture" className="p-8 sm:p-10 border border-neutral-200 rounded-2xl bg-neutral-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
              <div className="space-y-1.5">
                <div className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">Corridor Geometry Validation</div>
                <div className="text-xl font-bold tracking-tight text-black">
                  Telangana Network: NH-44, NH-65, &amp; Regional State Arteries
                </div>
                <div className="text-xs text-neutral-500">
                  Hyderabad (H01) · Warangal (H02) · Nizamabad (H03) · Karimnagar (H04) · Khammam (H05) · Nalgonda (H07) · Adilabad (H08)
                </div>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3.5 bg-black text-white text-xs font-semibold rounded-xl hover:bg-neutral-800 transition shrink-0 cursor-pointer"
              >
                Launch System &rarr;
              </button>
            </div>
          </RevealOnScroll>

        </div>
      </section>

      {/* =========================================================================
          4. BOTTOM CTA FOOTER
         ========================================================================= */}
      <footer className="bg-black text-white px-6 sm:px-12 lg:px-20 py-24 sm:py-32">
        <RevealOnScroll className="max-w-6xl mx-auto space-y-12">
          
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Access Gateway
            </span>
            <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-tight">
              Autonomous Recovery. <br />Zero Deadhead Waste.
            </h2>
            <p className="text-base sm:text-lg text-neutral-400 max-w-2xl font-normal">
              The SH-205 Intelligent Shipment Piggybacking System is restricted to authorized operators. Access the live Telangana Logistics Corridor dispatcher console.
            </p>
          </div>

          <div>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-white text-black text-sm font-semibold rounded-xl hover:bg-neutral-200 transition cursor-pointer"
            >
              <span>Access Control Tower</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-12 border-t border-neutral-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-neutral-500">
            <div>
              SH-205 Intelligent Shipment Piggybacking · Route Weave
            </div>
            <div>
              Telangana Logistics Network · Production Edition
            </div>
          </div>

        </RevealOnScroll>
      </footer>

    </div>
  );
}
