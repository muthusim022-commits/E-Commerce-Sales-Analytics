import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Percent,
  RotateCcw,
  Tag,
  Filter,
  Search,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { CleanTransaction, DashboardFilters, ExecutiveKpis } from '../types';
import { calculateExecutiveKpis } from '../utils/analytics';

interface ExecutiveDashboardViewProps {
  records: CleanTransaction[];
  filteredRecords: CleanTransaction[];
  filters: DashboardFilters;
  onFilterChange: (filters: DashboardFilters) => void;
  onResetFilters: () => void;
}

const CATEGORY_COLORS = ['#2563eb', '#0d9488', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

export default function ExecutiveDashboardView({
  records,
  filteredRecords,
  filters,
  onFilterChange,
  onResetFilters,
}: ExecutiveDashboardViewProps) {
  const kpis = calculateExecutiveKpis(filteredRecords);

  // Extract unique options for slicers
  const categories = ['All', ...Array.from(new Set(records.map((r) => r.category))).sort()];
  const countries = ['All', ...Array.from(new Set(records.map((r) => r.country))).sort()];
  const channels = ['All', ...Array.from(new Set(records.map((r) => r.acquisition_channel))).sort()];
  const paymentMethods = ['All', ...Array.from(new Set(records.map((r) => r.payment_method))).sort()];

  // 1. Monthly Revenue Aggregation
  const monthlyMap: Record<string, { month: string; revenue: number; orders: number }> = {};
  for (const r of filteredRecords) {
    if (r.return_status === 'Returned') continue;
    const m = r.order_date.substring(0, 7);
    if (!monthlyMap[m]) {
      monthlyMap[m] = { month: m, revenue: 0, orders: 0 };
    }
    monthlyMap[m].revenue += r.revenue;
    monthlyMap[m].orders += 1;
  }
  const monthlyData = Object.values(monthlyMap)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((item) => ({
      ...item,
      revenue: Math.round(item.revenue),
    }));

  // 2. Category Performance Aggregation
  const catMap: Record<string, { category: string; revenue: number; units: number }> = {};
  for (const r of filteredRecords) {
    if (r.return_status === 'Returned') continue;
    if (!catMap[r.category]) {
      catMap[r.category] = { category: r.category, revenue: 0, units: 0 };
    }
    catMap[r.category].revenue += r.revenue;
    catMap[r.category].units += r.quantity;
  }
  const categoryData = Object.values(catMap)
    .sort((a, b) => b.revenue - a.revenue)
    .map((c) => ({
      ...c,
      revenue: Math.round(c.revenue),
    }));

  // 3. Top 8 Products by Revenue
  const prodMap: Record<string, { product: string; revenue: number; category: string }> = {};
  for (const r of filteredRecords) {
    if (r.return_status === 'Returned') continue;
    if (!prodMap[r.product_name]) {
      prodMap[r.product_name] = { product: r.product_name, revenue: 0, category: r.category };
    }
    prodMap[r.product_name].revenue += r.revenue;
  }
  const topProductsData = Object.values(prodMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
    .map((p) => ({
      ...p,
      revenue: Math.round(p.revenue),
    }));

  // 4. Acquisition Channel Aggregation
  const chanMap: Record<string, { channel: string; revenue: number; aov: number; count: number }> = {};
  for (const r of filteredRecords) {
    if (r.return_status === 'Returned') continue;
    if (!chanMap[r.acquisition_channel]) {
      chanMap[r.acquisition_channel] = { channel: r.acquisition_channel, revenue: 0, aov: 0, count: 0 };
    }
    chanMap[r.acquisition_channel].revenue += r.revenue;
    chanMap[r.acquisition_channel].count += 1;
  }
  const channelData = Object.values(chanMap)
    .sort((a, b) => b.revenue - a.revenue)
    .map((ch) => ({
      channel: ch.channel,
      revenue: Math.round(ch.revenue),
      aov: ch.count > 0 ? Math.round(ch.revenue / ch.count) : 0,
    }));

  // 5. Regional Sales Breakdown
  const countryMap: Record<string, { country: string; revenue: number }> = {};
  for (const r of filteredRecords) {
    if (r.return_status === 'Returned') continue;
    countryMap[r.country] = (countryMap[r.country] || { country: r.country, revenue: 0 });
    countryMap[r.country].revenue += r.revenue;
  }
  const countryData = Object.values(countryMap)
    .sort((a, b) => b.revenue - a.revenue)
    .map((c) => ({
      ...c,
      revenue: Math.round(c.revenue),
    }));

  // 6. Category Return Rate Analysis
  const returnMap: Record<string, { category: string; total: number; returned: number }> = {};
  for (const r of filteredRecords) {
    if (!returnMap[r.category]) {
      returnMap[r.category] = { category: r.category, total: 0, returned: 0 };
    }
    returnMap[r.category].total += 1;
    if (r.return_status === 'Returned') {
      returnMap[r.category].returned += 1;
    }
  }
  const returnRateData = Object.values(returnMap).map((item) => ({
    category: item.category,
    returnRate: Number(((item.returned / item.total) * 100).toFixed(1)),
    returnedOrders: item.returned,
  }));

  const isFiltered =
    filters.category !== 'All' ||
    filters.country !== 'All' ||
    filters.channel !== 'All' ||
    filters.paymentMethod !== 'All' ||
    filters.searchQuery !== '';

  return (
    <div className="space-y-6">
      {/* Slicer / Filter Ribbon (Power BI Style) */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Power BI Interactive Slicers
            </span>
            {isFiltered && (
              <span className="text-[11px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">
                Filtered: {filteredRecords.length} of {records.length} records
              </span>
            )}
          </div>

          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium underline cursor-pointer"
            >
              Clear All Slicers
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-3">
          {/* Category Slicer */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Country / Region Slicer */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Country
            </label>
            <select
              value={filters.country}
              onChange={(e) => onFilterChange({ ...filters, country: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Acquisition Channel Slicer */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Channel
            </label>
            <select
              value={filters.channel}
              onChange={(e) => onFilterChange({ ...filters, channel: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              {channels.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Slicer */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Payment Method
            </label>
            <select
              value={filters.paymentMethod}
              onChange={(e) => onFilterChange({ ...filters, paymentMethod: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              {paymentMethods.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Search Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Filter Product / Customer
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={filters.searchQuery}
                onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md pl-7 pr-2.5 py-1.5 text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Top 6 KPI Scorecard Cards (Power BI Card Visuals) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Revenue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {kpis.totalRevenue !== null
              ? `$${kpis.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : 'N/A'}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> Net realized
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Orders</span>
            <ShoppingCart className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {kpis.totalOrders !== null ? kpis.totalOrders.toLocaleString() : 'N/A'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Distinct transactions</div>
        </div>

        {/* Unique Customers */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Unique Customers</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {kpis.uniqueCustomers !== null ? kpis.uniqueCustomers.toLocaleString() : 'N/A'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Distinct patrons</div>
        </div>

        {/* Average Order Value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Order Value</span>
            <ArrowUpRight className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {kpis.aov !== null ? `$${kpis.aov.toFixed(2)}` : 'N/A'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Basket average</div>
        </div>

        {/* Average Discount */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Discount</span>
            <Tag className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {kpis.avgDiscountPct !== null ? `${kpis.avgDiscountPct.toFixed(2)}%` : 'N/A'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Promotional markdown</div>
        </div>

        {/* Return Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Return Rate</span>
            <RotateCcw className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-600 mt-1">
            {kpis.returnRatePct !== null ? `${kpis.returnRatePct.toFixed(2)}%` : 'N/A'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {kpis.returnedCount ?? 0} refunded orders
          </div>
        </div>
      </div>

      {/* Row 1 Charts: Revenue by Month (Line) & Revenue by Category (Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col h-84">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Revenue by Month ($ USD)
              </h2>
              <p className="text-[11px] text-slate-400">Temporal sales trajectory & seasonality</p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              Line Chart
            </span>
          </div>

          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Revenue']}
                  labelFormatter={(l) => `Month: ${l}`}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#2563eb' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col h-84">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Revenue by Product Category ($)
              </h2>
              <p className="text-[11px] text-slate-400">Merchandise line contribution breakdown</p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              Bar Chart
            </span>
          </div>

          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 9, fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2 Charts: Top 8 Products (Horizontal Bar) & Acquisition Channel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col h-92">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Top 8 Products by Realized Revenue
              </h2>
              <p className="text-[11px] text-slate-400">High-yield SKU ranking</p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              Horizontal Bar
            </span>
          </div>

          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={topProductsData}
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <YAxis
                  type="category"
                  dataKey="product"
                  tick={{ fontSize: 9, fill: '#475569' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  width={95}
                />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="revenue" fill="#0d9488" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Acquisition Channel Performance */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col h-92">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Revenue by Marketing Channel ($)
              </h2>
              <p className="text-[11px] text-slate-400">Customer acquisition stream comparison</p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              Channel Attrib
            </span>
          </div>

          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="channel"
                  tick={{ fontSize: 9, fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Regional Distribution & Category Return Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geography Ranking */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col h-80">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Geographic Revenue Distribution
              </h2>
              <p className="text-[11px] text-slate-400">Market volume by destination country</p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              Regional
            </span>
          </div>

          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countryData} margin={{ top: 10, right: 10, left: 10, bottom: 15 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="country" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="revenue" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Return Rate by Category */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col h-80">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Return Rate by Product Category (%)
              </h2>
              <p className="text-[11px] text-slate-400">Reverse logistics impact diagnostic</p>
            </div>
            <span className="text-[10px] font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
              Risk Metric
            </span>
          </div>

          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={returnRateData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 9, fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Return Rate']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="returnRate" fill="#e11d48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
