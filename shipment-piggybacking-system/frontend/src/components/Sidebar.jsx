import React from 'react';
import { 
  LayoutDashboard, Package, ShieldAlert, Map as MapIcon, 
  BarChart3, FileText, HelpCircle, Zap, 
  Sliders, Search, ChevronRight, Plus, Truck
} from 'lucide-react';

export default function Sidebar({ 
  activeNav, 
  onSelectNav, 
  onSimulateDisrupt, 
  misplacedCount = 0,
  isDisrupted = false
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'shipments', label: 'Shipments', icon: Package, badge: '200' },
    { id: 'dispatcher', label: 'Control Tower', icon: ShieldAlert, alertBadge: (isDisrupted || misplacedCount > 0) ? String(misplacedCount || 1) : null },
    { id: 'disruption-engine', label: 'Disruption Engine', icon: Zap, badge: 'Sandbox' },
    { id: 'fleet', label: 'Fleet Status', icon: Truck, badge: '75' },
    { id: 'map', label: 'Interactive Map', icon: MapIcon },
    { id: 'analytics', label: 'Reports & Analytics', icon: BarChart3 }
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col justify-between shrink-0 select-none shadow-sm">
      
      {/* Top Section */}
      <div className="p-4 space-y-4">
        
        {/* Organization / Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black shadow-md shadow-purple-600/20 text-sm">
              CW
            </div>
            <div>
              <h1 className="text-xs font-black text-gray-900 leading-tight">Central Warehouse</h1>
              <p className="text-[11px] text-gray-400 font-medium">Logistics Manager</p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search Bar matching image_16bc07 */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search..."
            readOnly
            className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          <span className="absolute right-2.5 top-2 text-[10px] font-medium text-gray-400 bg-white border border-gray-200 px-1 rounded">
            ⌘K
          </span>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive 
                    ? 'bg-purple-50 text-purple-700 font-bold' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.alertBadge && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                    {item.alertBadge}
                  </span>
                )}
                {item.badge && !item.alertBadge && (
                  <span className="text-[10px] text-gray-400 font-medium">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Section: DISPATCH */}
        <div className="pt-2 border-t border-gray-100">
          <div className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Dispatch Operations
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => onSelectNav('dispatcher')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeNav === 'dispatcher' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-gray-400" />
                <span>Recovery Manifests</span>
              </div>
              <span className="text-[10px] text-gray-400 font-medium">{misplacedCount}</span>
            </button>
          </div>
        </div>

        {/* Section: PINNED CORRIDORS */}
        <div className="pt-2 border-t border-gray-100">
          <div className="px-3 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            <span>Pinned Corridors</span>
            <span className="text-[9px] text-purple-600 cursor-pointer">Unpin All</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 flex items-center justify-between text-[11px] font-medium">
              <span className="truncate">#COR-01 Hyd ➔ Nalgonda ➔ Warangal</span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0 ml-1"></span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 flex items-center justify-between text-[11px] font-medium">
              <span className="truncate">#COR-02 Hyd ➔ Karimnagar ➔ Adilabad</span>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0 ml-1"></span>
            </div>
            <div className="px-3 py-1 text-gray-400 hover:text-purple-600 cursor-pointer flex items-center gap-1 text-[11px]">
              <Plus className="w-3 h-3" />
              <span>Add new corridor</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Section with Big Prominent Simulate Disruption Button */}
      <div className="p-4 border-t border-gray-100 space-y-3">
        
        {/* Simulate Disruption Button (The Demo Trigger) */}
        <button
          onClick={onSimulateDisrupt}
          className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition-all"
        >
          <Zap className="w-4 h-4 animate-bounce" />
          <span>Simulate Disruption</span>
        </button>

        {/* Footer Meta */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 px-1 pt-1">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help Center</span>
          </div>
          <span className="text-[10px] font-semibold text-gray-400">v3.0.0</span>
        </div>
        <div className="text-[10px] text-gray-400 text-center">
          POWERED BY <span className="font-bold text-gray-600">LogisticsOS</span>
        </div>

      </div>

    </aside>
  );
}
