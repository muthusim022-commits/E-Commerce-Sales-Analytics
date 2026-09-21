import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Megaphone, CreditCard, DollarSign, Target } from 'lucide-react';
import { CleanTransaction } from '../types';

interface MarketingAnalysisViewProps {
  records: CleanTransaction[];
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function MarketingAnalysisView({ records }: MarketingAnalysisViewProps) {
  // Channel aggregates
  const channelMap: Record<
    string,
    { channel: string; revenue: number; orders: number; returns: number; discountSum: number }
  > = {};

  // Payment aggregates
  const paymentMap: Record<string, { method: string; count: number; revenue: number }> = {};

  for (const r of records) {
    if (!channelMap[r.acquisition_channel]) {
      channelMap[r.acquisition_channel] = {
        channel: r.acquisition_channel,
        revenue: 0,
        orders: 0,
        returns: 0,
        discountSum: 0,
      };
    }
    if (r.return_status !== 'Returned') {
      channelMap[r.acquisition_channel].revenue += r.revenue;
    } else {
      channelMap[r.acquisition_channel].returns += 1;
    }
    channelMap[r.acquisition_channel].orders += 1;
    channelMap[r.acquisition_channel].discountSum += r.discount;

    if (!paymentMap[r.payment_method]) {
      paymentMap[r.payment_method] = { method: r.payment_method, count: 0, revenue: 0 };
    }
    paymentMap[r.payment_method].count += 1;
    if (r.return_status !== 'Returned') {
      paymentMap[r.payment_method].revenue += r.revenue;
    }
  }

  const channelData = Object.values(channelMap).map((c) => ({
    channel: c.channel,
    revenue: Math.round(c.revenue),
    orders: c.orders,
    aov: c.orders > 0 ? Number((c.revenue / c.orders).toFixed(2)) : 0,
    returnRate: c.orders > 0 ? Number(((c.returns / c.orders) * 100).toFixed(1)) : 0,
    avgDiscount: c.orders > 0 ? Number(((c.discountSum / c.orders) * 100).toFixed(1)) : 0,
  }));

  const paymentData = Object.values(paymentMap).map((p) => ({
    name: p.method,
    value: p.count,
    revenue: Math.round(p.revenue),
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
          <Megaphone className="w-3.5 h-3.5" />
          <span>Attribution & Acquisition Funnels</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Marketing Channel & Payment Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
          Evaluate customer acquisition channels on AOV, return propensity, and checkout payment gateway preference.
        </p>
      </div>

      {/* Channel Comparison Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Acquisition Channel Efficiency Scorecard
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Channel Name</th>
                <th className="px-4 py-3 text-right">Orders Generated</th>
                <th className="px-4 py-3 text-right">Net Revenue</th>
                <th className="px-4 py-3 text-right">AOV</th>
                <th className="px-4 py-3 text-right">Avg Discount</th>
                <th className="px-4 py-3 text-right">Return Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {channelData.map((c) => (
                <tr key={c.channel} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">{c.channel}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">{c.orders.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                    ${c.revenue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-blue-600">${c.aov.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">{c.avgDiscount}%</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">{c.returnRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: AOV by Channel + Payment Methods Share */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AOV by Channel Bar Chart */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col h-80">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">
            Average Order Value by Channel ($)
          </h2>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="channel" tick={{ fontSize: 10, fill: '#64748b' }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`$${val}`, 'AOV']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="aov" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Method Distribution */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col h-80">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">
            Payment Method Share (Transaction Volume)
          </h2>
          <div className="flex-1 w-full min-h-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val} orders`, 'Volume']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs mt-2">
            {paymentData.map((p, idx) => (
              <div key={p.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-slate-600 font-medium">{p.name}: {p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
