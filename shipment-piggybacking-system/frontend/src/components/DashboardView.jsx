import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, ArrowUpRight, CheckCircle2, 
  Clock, ShieldAlert, Sparkles, Truck, ChevronRight, 
  MapPin, AlertCircle, ArrowRight, ExternalLink,
  Search, Zap, Check, Flame, Sliders, ChevronDown
} from 'lucide-react';
import NetworkMap from './NetworkMap';

export default function DashboardView({
  shipments = [],
  hubs = [],
  trucks = [],
  metrics = {},
  onSelectShipment,
  onRunAISolver,
  onSimulateDisrupt,
  onNavigateDisruptionEngine,
  anomalyActive = false,
  selectedShipment = null,
  matchedTruck = null,
  recoveryExecuted = false,
  optimizedPlan = null,
  aiSolved = false
}) {
  // Extract ONLY misplaced shipments for the executive alert feed
  const misplacedShipments = useMemo(() => {
    return shipments.filter(s => 
      s.shipment_status === 'Misplaced' || s.is_misplaced === true
    );
  }, [shipments]);

  // Priority badge renderer
  const renderPriorityBadge = (priority) => {
    const p = (priority || 'Medium').toLowerCase();
    if (p === 'critical') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
          CRITICAL
        </span>
      );
    }
    if (p === 'high') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200 inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
          HIGH
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
        MEDIUM
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* ========================================================================= */}
      {/* 1. TOP 5 EXECUTIVE KPI CARDS (Starting completely clean on launch)         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        
        {/* KPI 1: Active Linehauls */}
        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Active Linehauls</span>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1"></span> Live
            </span>
          </div>
          <div className="text-2xl font-black text-gray-900 mt-2">{metrics.active_trucks ?? 75}</div>
          <div className="text-[10px] text-gray-400 font-medium">75 Master Linehauls</div>
        </div>

        {/* KPI 2: Total Shipments */}
        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Network Volume</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center">
              <ArrowUpRight className="w-3 h-3" /> 18%
            </span>
          </div>
          <div className="text-2xl font-black text-gray-900 mt-2">{metrics.total_shipments ?? 200}</div>
          <div className="text-[10px] text-gray-400 font-medium">32 Telangana Hubs</div>
        </div>

        {/* KPI 3: Misplaced Shipments Alert */}
        <div className={`p-4 rounded-2xl bg-white shadow-sm flex flex-col justify-between transition-all ${
          misplacedShipments.length > 0 
            ? 'border border-rose-200 bg-rose-50/25 ring-1 ring-rose-100' 
            : 'border border-emerald-100 bg-emerald-50/15'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${misplacedShipments.length > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
              Misplaced Consignments
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center ${
              misplacedShipments.length > 0 ? 'text-rose-700 bg-rose-100' : 'text-emerald-700 bg-emerald-100'
            }`}>
              {misplacedShipments.length > 0 ? (
                <>
                  <AlertTriangle className="w-3 h-3 mr-0.5" /> Urgent
                </>
              ) : (
                <>
                  <Check className="w-3 h-3 mr-0.5" /> Pristine
                </>
              )}
            </span>
          </div>
          <div className={`text-2xl font-black mt-2 ${misplacedShipments.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {misplacedShipments.length}
          </div>
          <div className={`text-[10px] font-bold ${misplacedShipments.length > 0 ? 'text-rose-600/80' : 'text-emerald-600/80'}`}>
            {misplacedShipments.length > 0 ? 'Active SLA Breach Risks' : 'Zero Stranded Anomalies'}
          </div>
        </div>

        {/* KPI 4: Total Cost Saved */}
        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Cost Saved</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center">
              <ArrowUpRight className="w-3 h-3" /> 76.5%
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            ₹{Number(metrics.total_cost_saved_inr ?? 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium">Piggyback Cost Delta</div>
        </div>

        {/* KPI 5: Carbon Saved */}
        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Carbon Avoided</span>
            <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded flex items-center">
              <ArrowUpRight className="w-3 h-3" /> 15%
            </span>
          </div>
          <div className="text-2xl font-black text-teal-700 mt-2">
            {Number(metrics.total_carbon_saved_kg ?? 0).toLocaleString()} kg
          </div>
          <div className="text-[10px] text-teal-600 font-medium">Avoided Deadhead CO₂</div>
        </div>

      </div>

      {/* QUICK DISRUPTION SHORTCUT BANNER */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-gray-900 via-purple-950 to-gray-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-600 text-white shadow-sm">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
              <span>Dedicated Disruption Engine</span>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.2 rounded-full border border-rose-500/30">
                DB Persistence
              </span>
            </div>
            <div className="text-xs text-gray-300">
              Simulate 25+ authentic dataset incidents or inject targeted corridor misplacements with live database persistence.
            </div>
          </div>
        </div>
        <button
          onClick={() => onNavigateDisruptionEngine && onNavigateDisruptionEngine()}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shrink-0 flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
        >
          <span>Open Disruption Engine</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. LIVE INTERACTIVE LOGISTICS NETWORK MAP                                  */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Telangana Corridor Logistics Grid
            </h3>
            <p className="text-xs text-gray-500">
              32 Regional Hubs, 75 Master Linehauls, and PostGIS Road Snapping (NH 163, NH 65, NH 44, SH 24)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">
              {misplacedShipments.length > 0 ? (
                <span className="text-rose-600 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {misplacedShipments.length} Active Anomaly Feed
                </span>
              ) : (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Normal Grid State
                </span>
              )}
            </span>
          </div>
        </div>

        <NetworkMap
          hubs={hubs}
          trucks={trucks}
          anomalyActive={anomalyActive || misplacedShipments.length > 0}
          anomalyData={selectedShipment}
          matchedTruck={matchedTruck}
          recoveryExecuted={recoveryExecuted}
          aiSolved={Boolean(aiSolved || optimizedPlan || recoveryExecuted || selectedShipment?.is_recovery_accepted || selectedShipment?.shipment_status === 'Recovered')}
          height="420px"
        />
      </div>

      {/* ========================================================================= */}
      {/* 3. CONDENSED ALERT FEED OF ONLY MISPLACED SHIPMENTS                        */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700 border border-rose-200">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Active Stranded Consignments Feed
              </h3>
              <p className="text-xs text-gray-500">
                Monitoring only shipments requiring autonomous piggyback resolution
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              {misplacedShipments.length} Critical Alerts
            </span>
          </div>
        </div>

        {/* Condensed List */}
        <div className="space-y-2.5">
          {misplacedShipments.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 font-medium bg-gray-50 rounded-2xl">
              ✅ All consignments on-schedule. Zero stranded shipments currently detected.
            </div>
          ) : (
            misplacedShipments.slice(0, 8).map((item) => {
              const isTarget = selectedShipment?.shipment_id === item.shipment_id;
              return (
                <div
                  key={item.shipment_id}
                  onClick={() => onSelectShipment(item)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isTarget 
                      ? 'bg-purple-50/50 border-purple-300 shadow-sm ring-1 ring-purple-200' 
                      : 'bg-rose-50/20 border-rose-100 hover:border-rose-300 hover:bg-rose-50/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 font-black text-xs flex items-center justify-center shrink-0">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-xs">{item.shipment_id}</span>
                        <span className="text-gray-400 text-xs">·</span>
                        <span className="font-semibold text-purple-700 text-xs">{item.shipper}</span>
                        {renderPriorityBadge(item.priority)}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                        <span className="text-gray-700 font-medium">{item.origin_hub} ➔ {item.destination_hub}</span>
                        <span className="text-gray-300">|</span>
                        <span className="font-bold text-rose-700">Stranded at {item.current_hub}</span>
                        <span className="text-gray-300">|</span>
                        <span>{item.weight_tons} Tons ({item.cargo_category || 'Freight'})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="text-right text-[11px]">
                      <div className="font-bold text-rose-600">
                        {item.deviation_km ? `${item.deviation_km} km off-track` : 'Off-Route'}
                      </div>
                      <div className="text-[10px] text-gray-400">SLA Breach Risk</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectShipment(item);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm shadow-purple-600/20 transition-all flex items-center gap-1"
                    >
                      <span>Resolve in Control Tower</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
}
