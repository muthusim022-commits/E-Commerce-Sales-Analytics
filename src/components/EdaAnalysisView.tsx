import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import { TrendingUp, Activity, BarChart2, AlertCircle, HelpCircle, Layers } from 'lucide-react';
import { CleanTransaction } from '../types';
import { calculateCorrelationMatrix } from '../utils/analytics';

interface EdaAnalysisViewProps {
  records: CleanTransaction[];
}

export default function EdaAnalysisView({ records }: EdaAnalysisViewProps) {
  const [activeTab, setActiveTab] = useState<'histogram' | 'correlation' | 'outliers'>('histogram');

  // 1. Distribution of Order Revenue (Histogram Bins)
  const binSize = 50;
  const maxBin = 600;
  const bins: Record<number, number> = {};
  for (let b = 0; b <= maxBin; b += binSize) {
    bins[b] = 0;
  }

  const revenues = records.map((r) => r.revenue).sort((a, b) => a - b);
  for (const rev of revenues) {
    const b = Math.min(maxBin, Math.floor(rev / binSize) * binSize);
    bins[b] = (bins[b] || 0) + 1;
  }

  const histogramData = Object.entries(bins).map(([b, count]) => {
    const start = Number(b);
    return {
      binLabel: start === maxBin ? `$${start}+` : `$${start}-$${start + binSize}`,
      count,
    };
  });

  // 2. Correlation Matrix
  const { tableData, keys, labels } = calculateCorrelationMatrix(records);

  // 3. Outlier Detection via IQR (Interquartile Range)
  const n = revenues.length;
  const q1 = n > 0 ? revenues[Math.floor(n * 0.25)] : 0;
  const median = n > 0 ? revenues[Math.floor(n * 0.5)] : 0;
  const q3 = n > 0 ? revenues[Math.floor(n * 0.75)] : 0;
  const iqr = q3 - q1;
  const outlierThreshold = q3 + 1.5 * iqr;
  const outliers = records.filter((r) => r.revenue > outlierThreshold);

  // Scatter plot data for Discount vs Revenue
  const scatterData = records.slice(0, 150).map((r) => ({
    discount: Number((r.discount * 100).toFixed(0)),
    revenue: Math.round(r.revenue),
    product: r.product_name,
    orderId: r.order_id,
  }));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Statistical & Exploratory Diagnostics</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Exploratory Data Analysis (EDA)
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
            Uncover distribution shapes, statistical skewness, Pearson correlation coefficients, 
            and IQR-based statistical outliers across core numerical attributes.
          </p>
        </div>

        {/* Tab Pills */}
        <div className="inline-flex p-1 rounded-lg bg-slate-100 border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('histogram')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              activeTab === 'histogram' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Histogram
          </button>
          <button
            onClick={() => setActiveTab('correlation')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              activeTab === 'correlation' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Correlation Matrix
          </button>
          <button
            onClick={() => setActiveTab('outliers')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              activeTab === 'outliers' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            IQR Outlier Detection
          </button>
        </div>
      </div>

      {/* 5-Number Summary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase">Min Revenue</div>
          <div className="text-lg font-bold text-slate-900 mt-1">
            ${revenues[0] ? revenues[0].toFixed(2) : '0.00'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Bottom floor</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase">Q1 (25th Pct)</div>
          <div className="text-lg font-bold text-slate-900 mt-1">${q1.toFixed(2)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Lower quartile</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase">Median (Q2)</div>
          <div className="text-lg font-bold text-blue-600 mt-1">${median.toFixed(2)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">50th percentile</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase">Q3 (75th Pct)</div>
          <div className="text-lg font-bold text-slate-900 mt-1">${q3.toFixed(2)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Upper quartile</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase">IQR Threshold</div>
          <div className="text-lg font-bold text-amber-600 mt-1">${outlierThreshold.toFixed(2)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Q3 + 1.5 * IQR</div>
        </div>
      </div>

      {/* Tab 1: Histogram View */}
      {activeTab === 'histogram' && (
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Order Revenue Frequency Distribution (Right-Skewed)
              </h2>
              <p className="text-[11px] text-slate-400">
                Bin width: $50 USD | Visualizes classic e-commerce Pareto right-tail distribution
              </p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded">
              N = {records.length} transactions
            </span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="binLabel" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`${val} orders`, 'Frequency']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700">
            <span className="font-bold text-slate-900">Statistical Finding:</span> The sales distribution exhibits a classic positive right-skew (Mean &gt; Median). 
            Most transactions cluster in the $30-$120 range, with high-ticket electronics creating a long positive tail.
          </div>
        </div>
      )}

      {/* Tab 2: Pearson Correlation Heatmap */}
      {activeTab === 'correlation' && (
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Pearson Correlation Matrix (Numerical Attributes)
              </h2>
              <p className="text-[11px] text-slate-400">
                Coefficient range: -1.00 (strong inverse) to +1.00 (strong collinearity)
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs text-slate-700 border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">Variable</th>
                  {keys.map((k) => (
                    <th key={k} className="px-4 py-3 font-mono">
                      {labels[k]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tableData.map((row) => (
                  <tr key={row.metric} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-left text-slate-900 bg-slate-50 font-mono">
                      {row.metric}
                    </td>
                    {keys.map((k) => {
                      const val = row[k] as number;
                      const isSelf = val === 1.0;
                      let bg = 'bg-white';
                      let textColor = 'text-slate-700';

                      if (isSelf) {
                        bg = 'bg-slate-100';
                        textColor = 'text-slate-400 font-normal';
                      } else if (val > 0.6) {
                        bg = 'bg-blue-100';
                        textColor = 'text-blue-900 font-bold';
                      } else if (val > 0.2) {
                        bg = 'bg-blue-50';
                        textColor = 'text-blue-800';
                      } else if (val < -0.2) {
                        bg = 'bg-rose-50';
                        textColor = 'text-rose-800 font-bold';
                      }

                      return (
                        <td key={k} className={`px-4 py-3 font-mono text-[11px] ${bg} ${textColor}`}>
                          {val.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700">
            <span className="font-bold text-slate-900">Analyst Insight:</span> Strong positive correlation exists between <span className="font-mono text-blue-700 font-bold">unit_price</span> and <span className="font-mono text-blue-700 font-bold">revenue</span>. 
            Discounts show neutral to slight negative elastic relationship with volume, indicating discount campaigns require careful basket-depth thresholding.
          </div>
        </div>
      )}

      {/* Tab 3: Outlier Detection View */}
      {activeTab === 'outliers' && (
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                IQR Outlier Inspection (&gt; ${outlierThreshold.toFixed(2)})
              </h2>
              <p className="text-[11px] text-slate-400">
                Flagged {outliers.length} high-ticket purchases exceeding standard 1.5×IQR boundary
              </p>
            </div>
            <span className="text-xs bg-amber-100 text-amber-900 font-semibold px-2.5 py-0.5 rounded">
              {((outliers.length / records.length) * 100).toFixed(1)}% of total orders
            </span>
          </div>

          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2">Order ID</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Unit Price</th>
                  <th className="px-3 py-2 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {outliers.slice(0, 15).map((o) => (
                  <tr key={o.order_id} className="hover:bg-amber-50/40">
                    <td className="px-3 py-2 text-blue-600 font-bold">{o.order_id}</td>
                    <td className="px-3 py-2 text-slate-800">{o.customer_name}</td>
                    <td className="px-3 py-2 text-slate-800">{o.product_name}</td>
                    <td className="px-3 py-2 text-slate-500">{o.category}</td>
                    <td className="px-3 py-2 text-right">{o.quantity}</td>
                    <td className="px-3 py-2 text-right">${o.unit_price.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-bold text-amber-700">${o.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
