import React, { useState, useMemo } from 'react';
import { 
  Truck, Search, ArrowUpRight, Gauge, Shield, MapPin, Clock 
} from 'lucide-react';

export default function FleetStatusView({ 
  trucks = [], 
  onViewOnMap = () => {}
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const totalFleet = trucks.length;
  const inTransitCount = trucks.filter(t => (t.status || '').toLowerCase().includes('transit')).length;
  const totalSpareCapacity = trucks.reduce((sum, t) => sum + (parseFloat(t.spare_capacity_tons) || 0), 0);
  const totalCapacity = trucks.reduce((sum, t) => sum + (parseFloat(t.capacity_tons) || 0), 0);
  const avgCostPerKm = trucks.length > 0 
    ? (trucks.reduce((sum, t) => sum + (parseFloat(t.cost_per_km_inr || t.cost_per_km) || 45), 0) / trucks.length).toFixed(1)
    : '45.0';

  const filteredTrucks = useMemo(() => {
    return trucks.filter(t => {
      const matchQuery = 
        (t.truck_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.driver_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.current_hub || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.next_hub || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchQuery) return false;

      if (filterType === 'spare') {
        return (parseFloat(t.spare_capacity_tons) || 0) > 0;
      }
      if (filterType === 'transit') {
        return (t.status || '').toLowerCase().includes('transit');
      }
      if (filterType === 'available') {
        return (parseFloat(t.spare_capacity_tons) || 0) >= 4.0;
      }
      return true;
    });
  }, [trucks, searchTerm, filterType]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header & Metrics Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Truck className="w-5 h-5" />
            </span>
            Active Fleet & Spare Capacity Management
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Real-time tracking of linehaul vehicles, spare capacity, and corridor assignments across Telangana
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {inTransitCount} Linehauls Rolling
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
            {Math.round(totalSpareCapacity)}T Spare Loadable
          </span>
        </div>
      </div>

      {/* Bento Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>Total Fleet Vehicles</span>
            <Truck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-gray-900 mt-2">{totalFleet}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Heavy Trucks & Express Vans</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>Spare Capacity Pool</span>
            <Gauge className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {totalSpareCapacity.toFixed(1)} <span className="text-sm font-bold text-gray-500">Tons</span>
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5 font-medium">
            Available for piggyback rescue
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>Avg Corridor Rate</span>
            <span className="text-xs font-bold text-gray-400">INR</span>
          </div>
          <div className="text-2xl font-black text-gray-900 mt-2">
            ₹{avgCostPerKm} <span className="text-xs font-bold text-gray-500">/ km</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">Diesel ₹18 + Driver wages ₹5/km</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>Fleet Utilization</span>
            <Shield className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700 mt-2">
            {totalCapacity > 0 ? Math.round(((totalCapacity - totalSpareCapacity) / totalCapacity) * 100) : 65}%
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-purple-600 h-full rounded-full transition-all" 
              style={{ width: `${totalCapacity > 0 ? Math.round(((totalCapacity - totalSpareCapacity) / totalCapacity) * 100) : 65}%` }}
            ></div>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Vehicle ID, Driver, Current Hub, or Next Hub..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'all' 
                ? 'bg-purple-600 text-white shadow-sm' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            All ({trucks.length})
          </button>
          <button
            onClick={() => setFilterType('spare')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'spare' 
                ? 'bg-purple-600 text-white shadow-sm' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Has Spare Capacity
          </button>
          <button
            onClick={() => setFilterType('transit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'transit' 
                ? 'bg-purple-600 text-white shadow-sm' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            In Transit
          </button>
          <button
            onClick={() => setFilterType('available')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'available' 
                ? 'bg-purple-600 text-white shadow-sm' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Ready for Piggyback (&ge;4T)
          </button>
        </div>

      </div>

      {/* Fleet Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Vehicle / Driver</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Capacity Load</th>
                <th className="py-3 px-4">Spare Capacity</th>
                <th className="py-3 px-4">Current Location</th>
                <th className="py-3 px-4">Next Hub & ETA</th>
                <th className="py-3 px-4">Rate (₹/km)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTrucks.map((truck) => {
                const spareTons = parseFloat(truck.spare_capacity_tons) || 0;
                const totalTons = parseFloat(truck.capacity_tons) || 12;
                const currentLoad = parseFloat(truck.current_load_tons) || Math.max(0, totalTons - spareTons);
                const loadPercent = Math.min(100, Math.round((currentLoad / totalTons) * 100));
                const isMatched = truck.truck_id === 'TRK-004' || truck.truck_id === 'V004' || truck.truck_id === 'V001';

                return (
                  <tr 
                    key={truck.truck_id}
                    className={`hover:bg-purple-50/30 transition-colors ${isMatched ? 'bg-purple-50/20' : ''}`}
                  >
                    {/* ID & Driver */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isMatched ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700'
                        }`}>
                          🚚
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 flex items-center gap-1.5">
                            {truck.truck_id}
                            {isMatched && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200">
                                Matched
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-500 font-medium">
                            {truck.driver_name}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Vehicle Type */}
                    <td className="py-3 px-4 text-gray-600 font-medium">
                      {truck.vehicle_type || 'Heavy Truck'}
                    </td>

                    {/* Capacity Load Progress */}
                    <td className="py-3 px-4">
                      <div className="space-y-1 w-28">
                        <div className="flex justify-between text-[10px] text-gray-500 font-semibold">
                          <span>{currentLoad.toFixed(1)}T</span>
                          <span className="text-gray-400">of {totalTons}T</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              loadPercent > 90 ? 'bg-rose-500' : loadPercent > 70 ? 'bg-amber-500' : 'bg-purple-600'
                            }`}
                            style={{ width: `${loadPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Spare Capacity */}
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-block ${
                        spareTons >= 4 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : spareTons > 0 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                            : 'bg-gray-100 text-gray-500'
                      }`}>
                        {spareTons.toFixed(1)} Tons
                      </span>
                    </td>

                    {/* Current Hub */}
                    <td className="py-3 px-4 font-semibold text-gray-800">
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span>{truck.current_hub || 'En Route'}</span>
                      </div>
                    </td>

                    {/* Next Hub & ETA */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">
                        {truck.next_hub || 'In Transit'}
                      </div>
                      <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{truck.eta_next_hub ? truck.eta_next_hub.replace('T', ' ') : 'On Schedule'}</span>
                      </div>
                    </td>

                    {/* Cost per km in INR */}
                    <td className="py-3 px-4 font-bold text-gray-900">
                      ₹{truck.cost_per_km_inr || truck.cost_per_km || 45}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {(truck.status || 'in_transit').replace('_', ' ')}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onViewOnMap(truck)}
                        className="px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-purple-50 text-gray-700 hover:text-purple-700 font-semibold text-xs border border-gray-200 transition-colors inline-flex items-center gap-1"
                      >
                        <span>Map</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}