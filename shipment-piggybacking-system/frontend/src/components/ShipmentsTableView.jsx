import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, ChevronDown, ChevronLeft, ChevronRight, 
  Sparkles, AlertCircle, ArrowUpRight, ArrowDownRight, 
  CheckCircle2, Clock, AlertTriangle, Truck, ExternalLink
} from 'lucide-react';

export default function ShipmentsTableView({ 
  shipments = [], 
  metrics = {}, 
  onSelectShipment, 
  onRunAISolver,
  activeMisplacedCount = 0,
  isDisrupted = false
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Filter shipments
  const filtered = useMemo(() => {
    return shipments.filter(s => {
      const matchesSearch = 
        s.shipment_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.shipper?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.cargo_category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.current_hub?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPriority = priorityFilter === 'All' || s.priority === priorityFilter;
      const matchesStatus = statusFilter === 'All' || s.shipment_status === statusFilter;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [shipments, searchTerm, priorityFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, currentPage]);

  // Priority Badge Helper
  const renderPriorityBadge = (priority) => {
    const p = (priority || 'Medium').toLowerCase();
    if (p === 'critical') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Critical
        </span>
      );
    }
    if (p === 'high') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200 inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
          High
        </span>
      );
    }
    if (p === 'medium') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Medium
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        Low
      </span>
    );
  };

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    const s = (status || 'In Transit').toLowerCase();
    if (s === 'misplaced') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-700 border border-rose-300 inline-flex items-center gap-1 animate-pulse">
          <AlertCircle className="w-3 h-3" /> Misplaced
        </span>
      );
    }
    if (s === 'recovered' || s.includes('recovered')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Recovered
        </span>
      );
    }
    if (s === 'delivered') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Delivered
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
        <Clock className="w-3 h-3" /> In Transit
      </span>
    );
  };

  return (
    <div className="space-y-5">
      
      {/* ========================================================================= */}
      {/* 5 KPI STAT CARDS (Matches top row of image_16bc07)                        */}
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
          <div className="text-2xl font-black text-gray-900 mt-2">{metrics.active_trucks || 5}</div>
          <div className="text-[10px] text-gray-400 font-medium">Fleet TRK-001 - 005</div>
        </div>

        {/* KPI 2: Total Shipments */}
        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Shipments</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center">
              <ArrowUpRight className="w-3 h-3" /> 18%
            </span>
          </div>
          <div className="text-2xl font-black text-gray-900 mt-2">{metrics.total_shipments || 200}</div>
          <div className="text-[10px] text-gray-400 font-medium">Telangana Network</div>
        </div>

        {/* KPI 3: Misplaced Shipments (Critical Alert in Red) */}
        <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-sm flex flex-col justify-between bg-rose-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700">Misplaced Shipments</span>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded flex items-center">
              <AlertTriangle className="w-3 h-3 mr-0.5" /> {(metrics.active_misplaced ?? activeMisplacedCount ?? 0) > 0 ? 'Alert' : 'Nominal'}
            </span>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {metrics.active_misplaced ?? activeMisplacedCount ?? 0}
          </div>
          <div className="text-[10px] text-rose-600/80 font-bold">Critical SLA Alerts</div>
        </div>

        {/* KPI 4: Total Cost Saved */}
        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Cost Saved</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center">
              <ArrowUpRight className="w-3 h-3" /> 22%
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            ₹{Number(metrics.total_cost_saved_inr || (metrics.total_cost_saved_usd ? metrics.total_cost_saved_usd * 10 : 152900)).toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium">76.5% Piggyback Delta</div>
        </div>

        {/* KPI 5: Carbon Saved */}
        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Carbon Saved</span>
            <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded flex items-center">
              <ArrowUpRight className="w-3 h-3" /> 15%
            </span>
          </div>
          <div className="text-2xl font-black text-teal-700 mt-2">
            {Number(metrics.total_carbon_saved_kg || 5165).toLocaleString()} kg
          </div>
          <div className="text-[10px] text-teal-600 font-medium">Avoided Diesel CO₂</div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* AI ACTION BANNER (Matching prominent purple banner from image_16bc07)     */}
      {/* ========================================================================= */}
      <div className="p-3.5 px-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <p className="text-xs sm:text-sm font-semibold text-white">
            {(metrics.active_misplaced ?? activeMisplacedCount ?? 0) > 0 
              ? `AI Optimization Engine Active: Monitoring ${metrics.active_misplaced ?? activeMisplacedCount ?? 0} Misplaced Shipments for Piggyback Routing.`
              : 'AI Optimization Engine Active: Monitoring 0 Misplaced Shipments. Network is operating optimally.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onRunAISolver}
            className="px-3.5 py-1.5 rounded-xl bg-white text-purple-700 hover:bg-purple-50 font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>Run OR-Tools Solver</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SHIPMENTS TABLE CARD (Matching clean table design from image_16bc07)      */}
      {/* ========================================================================= */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Table Filters Header */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter by ID, Shipper, Hub..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Misplaced">Misplaced</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
            </select>
            <span className="text-xs text-gray-400 font-medium">
              Showing {filtered.length} shipments
            </span>
          </div>

        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 text-gray-400 uppercase tracking-wider text-[10px] font-bold border-b border-gray-100">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input type="checkbox" className="rounded text-purple-600 focus:ring-0 cursor-pointer" readOnly />
                </th>
                <th className="py-3 px-4">Shipment ID</th>
                <th className="py-3 px-4">Cargo Category</th>
                <th className="py-3 px-4">Current Hub</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Truck</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {paginated.map((item) => {
                const isMisplaced = item.shipment_status === 'Misplaced';
                return (
                  <tr
                    key={item.shipment_id}
                    onClick={() => onSelectShipment(item)}
                    className={`transition-colors cursor-pointer ${
                      isMisplaced 
                        ? 'bg-rose-50/60 hover:bg-rose-100/50 border-l-4 border-rose-500' 
                        : 'hover:bg-gray-50/80'
                    }`}
                  >
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="rounded text-purple-600 focus:ring-0 cursor-pointer" />
                    </td>

                    {/* Shipment ID */}
                    <td className="py-3 px-4 font-bold text-gray-900">
                      <div className="flex items-center gap-1.5">
                        {isMisplaced && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>}
                        <span>#{item.shipment_id}</span>
                      </div>
                      <div className="text-[10px] font-normal text-gray-400">{item.shipper}</div>
                    </td>

                    {/* Description / Category */}
                    <td className="py-3 px-4 font-medium text-gray-800">
                      <div>{item.cargo_category}</div>
                      <div className="text-[10px] text-gray-400">{item.weight_tons} Tons</div>
                    </td>

                    {/* Location / Current Hub */}
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${isMisplaced ? 'text-rose-700 font-bold' : 'text-gray-700'}`}>
                        {item.current_hub}
                      </span>
                      <div className="text-[10px] text-gray-400">
                        {item.origin_hub} ➔ {item.destination_hub}
                      </div>
                    </td>

                    {/* Priority Badge */}
                    <td className="py-3 px-4">
                      {renderPriorityBadge(item.priority)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      {renderStatusBadge(item.shipment_status)}
                    </td>

                    {/* Carrier / Assigned Truck (with avatar circle) */}
                    <td className="py-3 px-4">
                      {item.truck_id ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {item.truck_id.slice(-2)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 text-[11px]">{item.truck_id}</div>
                            <div className="text-[10px] text-gray-400">Capacity: {item.truck_capacity_tons}T</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] font-medium text-gray-400 italic">
                          Awaiting Match
                        </span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-3 px-4 text-right">
                      {isMisplaced ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectShipment(item);
                          }}
                          className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] shadow-sm shadow-purple-600/20 transition-colors"
                        >
                          Resolve
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectShipment(item);
                          }}
                          className="text-gray-400 hover:text-purple-600 p-1"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 px-5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-500">
          <div>
            Page <span className="font-bold text-gray-900">{currentPage}</span> of{' '}
            <span className="font-bold text-gray-900">{totalPages}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
