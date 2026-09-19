import React, { useState, useMemo, useEffect } from 'react';
import { 
  Zap, Flame, AlertTriangle, ShieldAlert, Sparkles, 
  Search, ChevronDown, Check, ArrowRight, RotateCcw, 
  Package, MapPin, Gauge, Clock, ExternalLink, RefreshCw
} from 'lucide-react';

// 25+ Authentic Incident Scenarios from master incidents.csv dataset (Sanitized: Intermediate Transit Hubs)
const DATASET_INCIDENT_PRESETS = [
  { id: 'SH004', name: 'SH004 · Tata Motors (4.5T)', hub: 'H05', hubName: 'Khammam', dev: 203.7, type: 'Wrong_Hub', sev: 'Critical' },
  { id: 'SH085', name: 'SH085 · Zomato (3.5T)', hub: 'H04', hubName: 'Karimnagar', dev: 192.8, type: 'Capacity_Issue', sev: 'Critical' },
  { id: 'SH115', name: 'SH115 · Havells (5.5T)', hub: 'H11', hubName: 'Jagtial', dev: 57.1, type: 'Vehicle_Breakdown', sev: 'High' },
  { id: 'SH023', name: 'SH023 · Blinkit (3.5T)', hub: 'H16', hubName: 'Bhongir', dev: 81.2, type: 'Missed_Transfer', sev: 'Critical' },
  { id: 'SH065', name: 'SH065 · Cipla (2.5T)', hub: 'H10', hubName: 'Siddipet', dev: 155.3, type: 'Missed_Transfer', sev: 'Critical' },
  { id: 'SH132', name: 'SH132 · Sun Pharma (4.5T)', hub: 'H04', hubName: 'Karimnagar', dev: 195.0, type: 'Misrouting', sev: 'High' },
  { id: 'SH009', name: 'SH009 · Flipkart (3.0T)', hub: 'H18', hubName: 'Sangareddy', dev: 145.6, type: 'Misrouting', sev: 'Critical' },
  { id: 'SH003', name: 'SH003 · Reliance (2.0T)', hub: 'H07', hubName: 'Nalgonda', dev: 93.4, type: 'Wrong_Hub', sev: 'High' },
  { id: 'SH017', name: 'SH017 · Flipkart (4.0T)', hub: 'H11', hubName: 'Jagtial', dev: 109.0, type: 'Wrong_Vehicle', sev: 'High' },
  { id: 'SH035', name: 'SH035 · Reliance (2.5T)', hub: 'H16', hubName: 'Bhongir', dev: 171.7, type: 'Vehicle_Breakdown', sev: 'High' },
  { id: 'SH043', name: 'SH043 · Reliance (3.0T)', hub: 'H07', hubName: 'Nalgonda', dev: 93.4, type: 'Wrong_Hub', sev: 'Critical' },
  { id: 'SH050', name: 'SH050 · Flipkart (3.5T)', hub: 'H18', hubName: 'Sangareddy', dev: 145.6, type: 'Misrouting', sev: 'High' },
  { id: 'SH056', name: 'SH056 · Mahindra (4.0T)', hub: 'H10', hubName: 'Siddipet', dev: 99.8, type: 'Delayed_Shipment', sev: 'High' },
  { id: 'SH074', name: 'SH074 · Sun Pharma (3.0T)', hub: 'H10', hubName: 'Siddipet', dev: 155.3, type: 'Wrong_Hub', sev: 'High' },
  { id: 'SH080', name: 'SH080 · Tata Motors (5.0T)', hub: 'H07', hubName: 'Nalgonda', dev: 93.4, type: 'Wrong_Vehicle', sev: 'Critical' },
  { id: 'SH091', name: 'SH091 · Havells (2.5T)', hub: 'H16', hubName: 'Bhongir', dev: 171.7, type: 'Wrong_Hub', sev: 'Critical' },
  { id: 'SH098', name: 'SH098 · Delhivery (3.0T)', hub: 'H14', hubName: 'Suryapet', dev: 72.1, type: 'Missed_Transfer', sev: 'High' },
  { id: 'SH103', name: 'SH103 · Flipkart (4.0T)', hub: 'H02', hubName: 'Warangal', dev: 115.0, type: 'Wrong_Hub', sev: 'High' },
  { id: 'SH123', name: 'SH123 · Apollo (3.5T)', hub: 'H04', hubName: 'Karimnagar', dev: 192.8, type: 'Wrong_Hub', sev: 'High' },
  { id: 'SH136', name: 'SH136 · Cipla (3.0T)', hub: 'H14', hubName: 'Suryapet', dev: 48.1, type: 'Wrong_Vehicle', sev: 'Medium' },
  { id: 'SH139', name: 'SH139 · Tata Motors (4.5T)', hub: 'H18', hubName: 'Sangareddy', dev: 145.6, type: 'Missed_Transfer', sev: 'Critical' },
  { id: 'SH149', name: 'SH149 · Reliance (3.5T)', hub: 'H07', hubName: 'Nalgonda', dev: 93.4, type: 'Wrong_Hub', sev: 'Critical' },
  { id: 'SH155', name: 'SH155 · Havells (2.5T)', hub: 'H07', hubName: 'Nalgonda', dev: 95.8, type: 'Delayed_Shipment', sev: 'Medium' },
  { id: 'SH162', name: 'SH162 · Blinkit (3.0T)', hub: 'H10', hubName: 'Siddipet', dev: 155.3, type: 'Missed_Transfer', sev: 'Critical' },
  { id: 'SH166', name: 'SH166 · Mahindra (4.5T)', hub: 'H02', hubName: 'Warangal', dev: 273.9, type: 'Capacity_Issue', sev: 'High' }
];

export default function DisruptionEngineView({
  shipments = [],
  hubs = [],
  onTriggerDisruption,
  onOpenInControlCenter,
  onResetSimulation
}) {
  const [selectedShipmentId, setSelectedShipmentId] = useState(
    shipments.find(s => s.shipment_status !== 'Misplaced')?.shipment_id || 'SH004'
  );
  const [selectedAnomalyHub, setSelectedAnomalyHub] = useState('H07');
  const [shipmentSearchQuery, setShipmentSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isInjecting, setIsInjecting] = useState(false);
  const [lastDisruptedInfo, setLastDisruptedInfo] = useState(null);

  // Active misplaced shipments in database
  const activeDisruptions = useMemo(() => {
    return shipments.filter(s => s.shipment_status === 'Misplaced' || s.is_misplaced === true);
  }, [shipments]);

  // Filtered shipments for custom selection
  const filteredShipments = useMemo(() => {
    const q = shipmentSearchQuery.trim().toLowerCase();
    if (!q) return shipments.slice(0, 50);
    return shipments.filter(s => 
      (s.shipment_id && s.shipment_id.toLowerCase().includes(q)) ||
      (s.shipper && s.shipper.toLowerCase().includes(q)) ||
      (s.origin_hub && s.origin_hub.toLowerCase().includes(q)) ||
      (s.destination_hub && s.destination_hub.toLowerCase().includes(q)) ||
      (s.cargo_category && s.cargo_category.toLowerCase().includes(q))
    ).slice(0, 50);
  }, [shipments, shipmentSearchQuery]);

  const currentTargetShipment = useMemo(() => {
    return shipments.find(s => s.shipment_id === selectedShipmentId) || shipments[0] || null;
  }, [shipments, selectedShipmentId]);

  // STRICT SPATIAL CONSTRAINT:
  // Anomaly Hub MUST NEVER equal Origin Hub or Destination Hub
  const availableAnomalyHubs = useMemo(() => {
    if (!currentTargetShipment) return hubs;
    const orig = currentTargetShipment.origin_hub;
    const dest = currentTargetShipment.destination_hub;
    return hubs.filter(h => h.hub_id !== orig && h.hub_id !== dest);
  }, [hubs, currentTargetShipment]);

  // Auto-reset if currently selected anomaly hub equals origin or destination
  useEffect(() => {
    if (!currentTargetShipment || availableAnomalyHubs.length === 0) return;
    const orig = currentTargetShipment.origin_hub;
    const dest = currentTargetShipment.destination_hub;
    if (selectedAnomalyHub === orig || selectedAnomalyHub === dest || !availableAnomalyHubs.some(h => h.hub_id === selectedAnomalyHub)) {
      const fallback = availableAnomalyHubs.find(h => h.type === 'transfer_hub' || h.type === 'transit') || availableAnomalyHubs[0];
      if (fallback) {
        setSelectedAnomalyHub(fallback.hub_id);
      }
    }
  }, [currentTargetShipment, selectedAnomalyHub, availableAnomalyHubs]);

  const handleTrigger = async (shipId = null, hubId = null) => {
    const targetShip = shipId || selectedShipmentId;
    const targetHub = hubId || selectedAnomalyHub;
    if (!targetShip || !targetHub) return;

    setIsInjecting(true);
    try {
      if (onTriggerDisruption) {
        await onTriggerDisruption(targetShip, targetHub);
      }
      const hubName = hubs.find(h => h.hub_id === targetHub)?.name || targetHub;
      setLastDisruptedInfo({
        shipment_id: targetShip,
        hub_id: targetHub,
        hub_name: hubName,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (err) {
      console.error("Disruption trigger error:", err);
    } finally {
      setIsInjecting(false);
    }
  };

  const handleSelectPreset = async (preset) => {
    setSelectedShipmentId(preset.id);
    setSelectedAnomalyHub(preset.hub);
    await handleTrigger(preset.id, preset.hub);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-gray-900 via-purple-950 to-gray-900 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-10 pointer-events-none">
          <Zap className="w-64 h-64 text-purple-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-600/90 text-white shadow-md shadow-rose-600/30">
                <Flame className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black tracking-tight">Disruption Engine & Chaos Injector</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                PostgreSQL DB Persistence Active
              </span>
            </div>
            <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
              Target any of the 200 Telangana linehaul consignments, inject off-route misplacements into regional hubs, and update the backend database persistently so the Control Center pulls live anomalous states.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {onResetSimulation && (
              <button
                onClick={onResetSimulation}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Reset simulation to zero anomalies"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Simulation (0 Anomalies)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Top Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500">Database Status</div>
            <div className="text-base font-black text-gray-900 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Synced
            </div>
          </div>
          <span className="text-[10px] text-gray-400 font-mono">FastAPI + Supabase</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500">Available Shipments</div>
            <div className="text-base font-black text-gray-900 mt-1">{shipments.length} Master Consignments</div>
          </div>
          <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-bold">200 Total</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500">Regional Network Hubs</div>
            <div className="text-base font-black text-gray-900 mt-1">{hubs.length} Telangana Hubs</div>
          </div>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">H01-H32</span>
        </div>

        <div className={`p-4 rounded-2xl bg-white shadow-sm flex items-center justify-between border ${
          activeDisruptions.length > 0 ? 'border-rose-200 bg-rose-50/30' : 'border-emerald-100 bg-emerald-50/20'
        }`}>
          <div>
            <div className={`text-xs font-bold ${activeDisruptions.length > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
              Active Misplaced in DB
            </div>
            <div className={`text-base font-black mt-1 ${activeDisruptions.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {activeDisruptions.length} Anomalous Consignments
            </div>
          </div>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
            activeDisruptions.length > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {activeDisruptions.length > 0 ? 'Action Required' : 'Pristine State'}
          </span>
        </div>
      </div>

      {/* 3. Authentic Dataset Incident Presets (~25 Scenarios from incidents.csv) */}
      <div className="p-6 rounded-3xl bg-white border border-purple-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                Multi-Case Authentic Incident Presets ({DATASET_INCIDENT_PRESETS.length} Dataset Cases)
              </h3>
              <p className="text-xs text-gray-500">
                Directly loads verified scenarios from master incidents.csv with authentic deviations and hub targets.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 self-start sm:self-auto">
            1-Click Inject
          </span>
        </div>

        {/* Incident Presets Scrollable / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
          {DATASET_INCIDENT_PRESETS.map((p) => {
            const isCurrentlyDisrupted = activeDisruptions.some(s => s.shipment_id === p.id);
            return (
              <div
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isCurrentlyDisrupted
                    ? 'bg-rose-50 border-rose-200 ring-1 ring-rose-200'
                    : 'bg-gray-50/70 hover:bg-purple-50/60 border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-purple-700 bg-white px-2 py-0.5 rounded border border-gray-200 shadow-xs">
                    {p.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    p.sev === 'Critical' ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {p.sev}
                  </span>
                </div>

                <div className="text-xs font-bold text-gray-900 mt-0.5 truncate">
                  {p.name}
                </div>

                <div className="text-[11px] text-gray-600 flex items-center justify-between pt-1 border-t border-gray-200/60">
                  <span>Target: <strong className="text-rose-700">{p.hubName} ({p.hub})</strong></span>
                  <span className="font-bold text-gray-700">{p.dev} km off-track</span>
                </div>

                <div className="flex items-center justify-between text-[10px] font-semibold text-gray-500 pt-1">
                  <span>{p.type.replace('_', ' ')}</span>
                  <span className="text-purple-600 font-bold flex items-center gap-0.5">
                    {isCurrentlyDisrupted ? 'Stranded in DB ➔' : 'Inject Anomaly ➔'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Manual Custom Anomaly Injector Sandbox */}
      <div className="p-6 rounded-3xl bg-white border border-rose-100 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-600 text-white shadow-sm shadow-rose-600/20">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                Manual Targeted Anomaly Injector
              </h3>
              <p className="text-xs text-gray-500">
                Select any shipment and assign an arbitrary stranded location to test edge-case piggybacking.
              </p>
            </div>
          </div>
          <span className="text-xs text-gray-400 font-medium">Custom Simulator</span>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          
          {/* Dropdown 1: Searchable Shipment_ID Selector (Span 5) */}
          <div className="md:col-span-5 space-y-1.5 relative">
            <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
              <span>Target Shipment (Active ID)</span>
              {currentTargetShipment && (
                <span className="text-[11px] font-normal text-purple-700">
                  {currentTargetShipment.weight_tons || 4.5}T · {currentTargetShipment.cargo_category || 'Freight'}
                </span>
              )}
            </label>

            {/* Custom Searchable Select Box */}
            <div className="relative">
              <div 
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className="w-full p-2.5 bg-gray-50 hover:bg-gray-100/80 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 flex items-center justify-between cursor-pointer transition-colors shadow-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {currentTargetShipment?.shipment_id || 'Select Shipment'}
                  </span>
                  <span className="truncate text-gray-700">
                    {currentTargetShipment ? `${currentTargetShipment.shipper} (${currentTargetShipment.origin_hub} ➔ ${currentTargetShipment.destination_hub})` : 'Choose consignment...'}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* Floating Dropdown List */}
              {isDropdownOpen && (
                <div className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 space-y-1 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="relative mb-2 px-1">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-2.5" />
                    <input
                      type="text"
                      value={shipmentSearchQuery}
                      onChange={(e) => setShipmentSearchQuery(e.target.value)}
                      placeholder="Search Shipment ID, Shipper, or Hub..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-purple-500"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-0.5">
                    {filteredShipments.map((shp) => {
                      const isSelected = shp.shipment_id === selectedShipmentId;
                      const isMisplaced = shp.shipment_status === 'Misplaced';
                      return (
                        <div
                          key={shp.shipment_id}
                          onClick={() => {
                            setSelectedShipmentId(shp.shipment_id);
                            setIsDropdownOpen(false);
                          }}
                          className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-purple-50 text-purple-900 font-bold border border-purple-200' 
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-bold text-[11px] text-purple-700 shrink-0">
                              {shp.shipment_id}
                            </span>
                            <span className="truncate">{shp.shipper}</span>
                            <span className="text-[10px] text-gray-400 shrink-0">
                              ({shp.origin_hub} ➔ {shp.destination_hub})
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className="text-[10px] text-gray-500">
                              {shp.weight_tons || 4.5}T
                            </span>
                            {isMisplaced ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-100 text-rose-700">
                                Stranded
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700">
                                Normal
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dropdown 2: Anomaly_Hub Selector (Span 4) */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
              <span>Stranded Location (Anomaly Hub)</span>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Intermediate Only (≠ {currentTargetShipment?.origin_hub || 'Orig'} / {currentTargetShipment?.destination_hub || 'Dest'})
              </span>
            </label>

            <select
              value={selectedAnomalyHub}
              onChange={(e) => setSelectedAnomalyHub(e.target.value)}
              className="w-full p-2.5 bg-gray-50 hover:bg-gray-100/80 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-purple-500 shadow-xs cursor-pointer"
            >
              {availableAnomalyHubs.map((hub) => (
                <option key={hub.hub_id} value={hub.hub_id}>
                  {hub.hub_id} · {hub.name || hub.city} ({hub.type ? hub.type.replace('_', ' ') : 'Hub'})
                </option>
              ))}
            </select>
          </div>

          {/* Action Button: Trigger Targeted Disruption (Span 3) */}
          <div className="md:col-span-3">
            <button
              onClick={() => handleTrigger()}
              disabled={isInjecting || !selectedShipmentId}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 disabled:opacity-50 text-white font-black text-xs shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Flame className={`w-4 h-4 ${isInjecting ? 'animate-spin' : ''}`} />
              <span>{isInjecting ? 'Mutating Database...' : 'Trigger Disruption'}</span>
            </button>
          </div>

        </div>

        {/* Real-time Confirmation Banner */}
        {lastDisruptedInfo && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
              <div>
                <span className="font-bold text-rose-900">
                  Database Record Mutated Successfully:
                </span>{' '}
                <span className="text-rose-700">
                  Shipment <strong className="font-bold">{lastDisruptedInfo.shipment_id}</strong> is now stranded at <strong className="font-semibold">{lastDisruptedInfo.hub_name} ({lastDisruptedInfo.hub_id})</strong>. Persisted to database at {lastDisruptedInfo.timestamp}.
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                const shp = shipments.find(s => s.shipment_id === lastDisruptedInfo.shipment_id);
                if (shp && onOpenInControlCenter) onOpenInControlCenter(shp);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <span>Open in Control Tower</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 5. Live Database Manifest of All Currently Disrupted Shipments */}
      <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                Live Disrupted Shipments Manifest (Database State)
              </h3>
              <p className="text-xs text-gray-500">
                All records currently carrying Misplaced status in the backend PostgreSQL table.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            {activeDisruptions.length} Active Records
          </span>
        </div>

        {activeDisruptions.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400 font-medium bg-gray-50 rounded-2xl">
            ✅ Zero anomalous shipments detected in database. Inject an incident preset above to test the recovery lifecycle.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-2.5 px-3">Shipment ID</th>
                  <th className="py-2.5 px-3">Shipper</th>
                  <th className="py-2.5 px-3">Original Route</th>
                  <th className="py-2.5 px-3">Stranded Location</th>
                  <th className="py-2.5 px-3">Deviation</th>
                  <th className="py-2.5 px-3">Weight</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeDisruptions.map((shp) => (
                  <tr key={shp.shipment_id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="py-3 px-3 font-bold text-purple-700">{shp.shipment_id}</td>
                    <td className="py-3 px-3 font-semibold text-gray-900">{shp.shipper}</td>
                    <td className="py-3 px-3 text-gray-600">{shp.origin_hub} ➔ {shp.destination_hub}</td>
                    <td className="py-3 px-3 font-bold text-rose-700">
                      {shp.current_hub}
                    </td>
                    <td className="py-3 px-3 text-rose-600 font-semibold">{shp.deviation_km || 93.4} km</td>
                    <td className="py-3 px-3 text-gray-700">{shp.weight_tons || 4.5}T</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                        {shp.priority || 'Critical'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onOpenInControlCenter && onOpenInControlCenter(shp)}
                        className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Resolve in Control Tower</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
