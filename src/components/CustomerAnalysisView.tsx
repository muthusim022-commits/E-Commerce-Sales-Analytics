import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Users, Award, Repeat, UserCheck, ArrowUpRight } from 'lucide-react';
import { CleanTransaction } from '../types';

interface CustomerAnalysisViewProps {
  records: CleanTransaction[];
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export default function CustomerAnalysisView({ records }: CustomerAnalysisViewProps) {
  // Customer aggregation
  const customerMap: Record<string, { id: string; name: string; country: string; totalRevenue: number; orders: number }> = {};

  for (const r of records) {
    if (!customerMap[r.customer_id]) {
      customerMap[r.customer_id] = {
        id: r.customer_id,
        name: r.customer_name,
        country: r.country,
        totalRevenue: 0,
        orders: 0,
      };
    }
    if (r.return_status !== 'Returned') {
      customerMap[r.customer_id].totalRevenue += r.revenue;
    }
    customerMap[r.customer_id].orders += 1;
  }

  const allCustomers = Object.values(customerMap);
  const totalCustomers = allCustomers.length;

  const repeatCustomers = allCustomers.filter((c) => c.orders > 1);
  const oneTimeCustomers = allCustomers.filter((c) => c.orders === 1);
  const repeatRate = totalCustomers > 0 ? ((repeatCustomers.length / totalCustomers) * 100).toFixed(1) : '0';

  const topVipCustomers = [...allCustomers].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10);

  // Frequency distribution (1 order, 2 orders, 3 orders, 4+ orders)
  const freqMap: Record<string, number> = { '1 Order': 0, '2 Orders': 0, '3 Orders': 0, '4+ Orders': 0 };
  for (const c of allCustomers) {
    if (c.orders === 1) freqMap['1 Order']++;
    else if (c.orders === 2) freqMap['2 Orders']++;
    else if (c.orders === 3) freqMap['3 Orders']++;
    else freqMap['4+ Orders']++;
  }

  const freqData = Object.entries(freqMap).map(([k, count]) => ({
    frequency: k,
    count,
  }));

  const cohortData = [
    { name: 'Repeat Buyers', value: repeatCustomers.length },
    { name: 'Single-Order Buyers', value: oneTimeCustomers.length },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
          <Users className="w-3.5 h-3.5" />
          <span>Cohort & Retention Analysis</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Customer Lifetime Value (LTV) & Behavior
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
          Examine purchaser repeat velocity, lifetime revenue concentration, and retention dynamics.
        </p>
      </div>

      {/* Customer KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Unique Patrons</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalCustomers.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Total distinct buyer IDs</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Repeat Customer Rate</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{repeatRate}%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{repeatCustomers.length} multiple-order buyers</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">One-Time Buyers</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{oneTimeCustomers.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Top-of-funnel conversion target</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">VIP Basket Threshold</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            ${topVipCustomers[0] ? topVipCustomers[0].totalRevenue.toFixed(0) : '0'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Top spender cumulative spend</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Frequency Histogram */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col h-80">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">
            Purchase Frequency Distribution (Orders per Customer)
          </h2>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={freqData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="frequency" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`${val} customers`, 'Count']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 10 Spenders Leaderboard */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col h-80 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Top 10 High-LTV VIP Accounts
            </h2>
            <Award className="w-4 h-4 text-amber-500" />
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {topVipCustomers.map((vip, idx) => (
              <div key={vip.id} className="py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-slate-900">{vip.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {vip.id} • {vip.country}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-600 font-mono">
                    ${vip.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-400">{vip.orders} orders placed</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
