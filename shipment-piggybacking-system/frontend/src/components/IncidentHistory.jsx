import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, 
  Download, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Search, 
  RefreshCw,
  FileSpreadsheet,
  ShieldCheck,
  ChevronRight,
  MapPin
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function IncidentHistory() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/incidents/history?limit=50`);
      if (res.data.success) {
        setIncidents(res.data.data.data || []);
        if (res.data.data.data?.length > 0 && !selectedIncident) {
          setSelectedIncident(res.data.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch incident audit history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleDownload = async (incidentId, format) => {
    setDownloadingId(`${incidentId}-${format}`);
    try {
      const downloadUrl = `${API_BASE}/api/incidents/${incidentId}/export?format=${format}`;
      const res = await axios.get(downloadUrl, { responseType: 'blob' });
      const blob = new Blob([res.data], { 
        type: format === 'pdf' ? 'application/pdf' : 'text/csv' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `incident-${incidentId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Download failed for ${format}:`, err);
      // Fallback direct link
      window.open(`${API_BASE}/api/incidents/${incidentId}/export?format=${format}`, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredIncidents = incidents.filter(inc => {
    const matchesFilter = filterStatus === 'ALL' || inc.status === filterStatus;
    const matchesSearch = 
      inc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.shipment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inc.selected_route && inc.selected_route.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-800/80 backdrop-blur border border-slate-700/60 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Audit Logs & Incident Reporting</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Immutable post-mortem event ledger, deviation analytics, and compliance audit exports
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search shipment or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={fetchIncidents}
            disabled={loading}
            className="p-2 bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-600/50 transition-colors"
            title="Refresh Audit Logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        {['ALL', 'RESOLVED', 'PENDING_REVIEW'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all ${
              filterStatus === status
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Main Grid: Incident Table & Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Incident List */}
        <div className="lg:col-span-7 bg-slate-800/80 backdrop-blur border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-700/60 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Audit Incidents ({filteredIncidents.length})
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-400" />
              Loading incident audit logs...
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No incident logs recorded matching this filter.
            </div>
          ) : (
            <div className="divide-y divide-slate-700/40 max-h-[600px] overflow-y-auto">
              {filteredIncidents.map((inc) => {
                const isSelected = selectedIncident?.id === inc.id;
                return (
                  <div
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className={`p-4 transition-all cursor-pointer hover:bg-slate-700/30 ${
                      isSelected ? 'bg-indigo-500/10 border-l-4 border-indigo-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-white font-mono">{inc.id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            inc.status === 'RESOLVED' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}>
                            {inc.status === 'RESOLVED' ? 'Resolved' : 'Pending Review'}
                          </span>
                          {inc.sla_status && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              inc.sla_met 
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' 
                                : 'bg-red-500/10 text-red-400 border border-red-500/30'
                            }`}>
                              {inc.sla_status}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-400 flex items-center gap-4">
                          <span>Target: <strong className="text-slate-300">{inc.shipment_id}</strong></span>
                          <span>Deviation: <strong className="text-amber-400">{inc.deviation_km} km</strong></span>
                          <span>Hub: <strong className="text-slate-300">{inc.nearest_hub}</strong></span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-400">
                          {new Date(inc.detection_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {inc.financial_impact?.cost_saved > 0 && (
                          <div className="text-xs font-semibold text-emerald-400 mt-1">
                            +₹{(inc.financial_impact.cost_saved_inr || (inc.financial_impact.cost_saved * 10)).toFixed(0)} saved
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Incident Detail Card & Export Actions */}
        <div className="lg:col-span-5 space-y-6">
          {selectedIncident ? (
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Selected Incident</span>
                  <h3 className="text-lg font-bold text-white font-mono mt-0.5">{selectedIncident.id}</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(selectedIncident.id, 'pdf')}
                    disabled={downloadingId === `${selectedIncident.id}-pdf`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-semibold transition-all shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{downloadingId === `${selectedIncident.id}-pdf` ? 'Generating...' : 'PDF Report'}</span>
                  </button>
                  <button
                    onClick={() => handleDownload(selectedIncident.id, 'csv')}
                    disabled={downloadingId === `${selectedIncident.id}-csv`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold transition-all shadow-sm"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>{downloadingId === `${selectedIncident.id}-csv` ? 'Exporting...' : 'CSV Export'}</span>
                  </button>
                </div>
              </div>

              {/* Status and Telemetry Block */}
              <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-700/40">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Shipment ID</span>
                  <span className="text-sm font-semibold text-white font-mono">{selectedIncident.shipment_id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Priority</span>
                  <span className="text-sm font-semibold text-amber-400">{selectedIncident.priority}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Cross-Track Deviation</span>
                  <span className="text-sm font-semibold text-red-400">{selectedIncident.deviation_km} km</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Nearest Regional Hub</span>
                  <span className="text-sm font-semibold text-slate-200">{selectedIncident.nearest_hub}</span>
                </div>
              </div>

              {/* Recovery Resolution Summary */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Assigned Piggyback Linehaul</span>
                  <span className="text-xs font-mono font-bold text-indigo-400">
                    {selectedIncident.selected_route || 'Unassigned (Pending)'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">SLA Adherence Status</span>
                  <span className={selectedIncident.sla_met ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                    {selectedIncident.sla_status || 'Under Review'}
                  </span>
                </div>

                {selectedIncident.financial_impact && (
                  <div className="pt-2 border-t border-slate-800 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-800/40 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">Dedicated</span>
                      <span className="text-xs font-bold text-red-400">
                        ₹{(selectedIncident.financial_impact.dedicated_recovery_cost_inr || (selectedIncident.financial_impact.dedicated_recovery_cost * 10) || 8500).toFixed(0)}
                      </span>
                    </div>
                    <div className="bg-slate-800/40 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">Piggyback</span>
                      <span className="text-xs font-bold text-indigo-400">
                        ₹{(selectedIncident.financial_impact.piggyback_cost_inr || (selectedIncident.financial_impact.piggyback_cost * 10) || 2000).toFixed(0)}
                      </span>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-lg">
                      <span className="text-[10px] text-emerald-400 block">Net Saved</span>
                      <span className="text-xs font-bold text-emerald-400">
                        +₹{(selectedIncident.financial_impact.cost_saved_inr || (selectedIncident.financial_impact.cost_saved * 10) || 6500).toFixed(0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Evaluated Candidates Summary */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Evaluated Options ({selectedIncident.candidate_routes?.length || 0})
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(selectedIncident.candidate_routes || []).map((cand) => (
                    <div 
                      key={cand.route_id}
                      className="flex items-center justify-between p-2.5 bg-slate-900/40 rounded-xl border border-slate-700/30 text-xs"
                    >
                      <div>
                        <span className="font-bold text-white font-mono">{cand.route_id}</span>
                        <div className="text-[10px] text-slate-400">{cand.transit_hours}h transit | ₹{cand.cost_inr || (cand.cost ? cand.cost * 10 : 2000)}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cand.status === 'VIABLE' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {cand.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700/60 rounded-2xl p-12 text-center text-slate-500">
              Select an incident from the log list to inspect recovery details and export audit reports.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
