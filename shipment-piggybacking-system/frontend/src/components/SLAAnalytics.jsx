import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  IndianRupee, 
  ShieldCheck, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  Clock,
  Award
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const PIE_COLORS = ['#10b981', '#f43f5e'];

export default function SLAAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReport = async () => {
    setRefreshing(true);
    try {
      const res = await axios.get(`${API_BASE}/api/analytics/sla-report`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load SLA report:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReport();
    const interval = setInterval(fetchReport, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[520px] bg-slate-900/60 rounded-xl border border-slate-800 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-2 text-indigo-400" />
        <span>Loading SLA & Compliance Telemetry...</span>
      </div>
    );
  }

  const summary = data?.summary || {};
  const timeSeries = data?.cost_saved_over_time || [];
  const pieData = data?.sla_distribution || [];
  const recentAudits = data?.recent_audits || [];

  return (
    <div className="space-y-4 max-h-[540px] overflow-y-auto pr-1">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Total Cost Saved</p>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">
              ₹{(summary.total_cost_saved_inr || (summary.total_cost_saved ? summary.total_cost_saved * 10 : 152900)).toLocaleString()}
            </p>
            <span className="text-[10px] text-emerald-500/80">vs. Dedicated Couriers</span>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 font-medium">SLA Compliance Rate</p>
            <p className="text-xl font-bold text-indigo-400 mt-0.5">
              {summary.sla_compliance_percentage || 0}%
            </p>
            <span className="text-[10px] text-slate-500">Breach: {summary.sla_breach_percentage || 0}%</span>
          </div>
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Award className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Avg Savings / Run</p>
            <p className="text-xl font-bold text-cyan-400 mt-0.5">
              ₹{(summary.avg_cost_saved_per_recovery_inr || (summary.avg_cost_saved_per_recovery ? summary.avg_cost_saved_per_recovery * 10 : 3818)).toFixed(0)}
            </p>
            <span className="text-[10px] text-cyan-500/80">Per Recovered Parcel</span>
          </div>
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Recoveries Audited</p>
            <p className="text-xl font-bold text-white mt-0.5">
              {summary.total_recoveries || 0}
            </p>
            <span className="text-[10px] text-emerald-400 font-medium">
              {summary.sla_met_count || 0} Met / {summary.sla_breached_count || 0} Late
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Line Chart: Cost Saved Over Time */}
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Cost Optimization: Cumulative Savings Over Time
              </h3>
              <p className="text-[10px] text-slate-400">Piggyback marginal route rate vs. expedited courier baseline (₹2,200 + ₹28.5/km)</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Live Audit Stream
            </span>
          </div>

          <div className="h-[210px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timeLabel" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={v => `₹${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(value, name) => [`₹${value}`, name === 'cumulative_savings' ? 'Cumulative Saved' : 'Shipment Saved']}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Line 
                  type="monotone" 
                  dataKey="cumulative_savings" 
                  name="Cumulative Saved" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  dot={{ r: 3, fill: '#10b981' }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="cost_saved" 
                  name="Single Run Delta" 
                  stroke="#38bdf8" 
                  strokeWidth={1.5} 
                  strokeDasharray="4 4" 
                  dot={{ r: 2, fill: '#38bdf8' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: SLA Adherence Distribution */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col">
          <div className="border-b border-slate-800 pb-2 mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              SLA Adherence Ratio
            </h3>
            <p className="text-[10px] text-slate-400">Recovery deliveries within customer commitment</p>
          </div>

          <div className="h-[180px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-around text-xs pt-1 border-t border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-300 font-medium">Met: {summary.sla_met_count || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-slate-300 font-medium">Breached: {summary.sla_breached_count || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Recovery Execution Log */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Audit Ledger: Recent Autonomous Executions
          </h3>
          <span className="text-[10px] text-slate-400">Total Audits: {summary.total_recoveries}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                <th className="py-1.5 px-2">Shipment ID</th>
                <th className="py-1.5 px-2">Assigned Route</th>
                <th className="py-1.5 px-2">Transit / SLA</th>
                <th className="py-1.5 px-2">Dedicated Baseline</th>
                <th className="py-1.5 px-2">Piggyback Cost</th>
                <th className="py-1.5 px-2">Cost Saved</th>
                <th className="py-1.5 px-2 text-right">SLA Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentAudits.map((item, i) => (
                <tr key={item.id || i} className="hover:bg-slate-850">
                  <td className="py-2 px-2 font-mono font-semibold text-white">{item.shipment_id}</td>
                  <td className="py-2 px-2 font-mono text-indigo-300">{item.route_id}</td>
                  <td className="py-2 px-2 text-slate-300">{item.estimated_transit_hours}h / {item.sla_deadline_hours}h</td>
                  <td className="py-2 px-2 text-slate-400 line-through">${item.dedicated_cost}</td>
                  <td className="py-2 px-2 font-semibold text-white">${item.piggyback_cost}</td>
                  <td className="py-2 px-2 font-bold text-emerald-400">+${item.cost_saved}</td>
                  <td className="py-2 px-2 text-right">
                    {item.sla_met ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        MET
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                        BREACH
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
