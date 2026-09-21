import React, { useState } from 'react';
import { ShoppingBag, Star, RotateCcw, Search, ArrowUpDown } from 'lucide-react';
import { CleanTransaction } from '../types';

interface ProductAnalysisViewProps {
  records: CleanTransaction[];
}

export default function ProductAnalysisView({ records }: ProductAnalysisViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');

  // Aggregate by product
  const prodMap: Record<
    string,
    {
      id: string;
      name: string;
      category: string;
      unitPrice: number;
      revenue: number;
      units: number;
      orders: number;
      returns: number;
      ratings: number[];
    }
  > = {};

  for (const r of records) {
    if (!prodMap[r.product_id]) {
      prodMap[r.product_id] = {
        id: r.product_id,
        name: r.product_name,
        category: r.category,
        unitPrice: r.unit_price,
        revenue: 0,
        units: 0,
        orders: 0,
        returns: 0,
        ratings: [],
      };
    }
    if (r.return_status !== 'Returned') {
      prodMap[r.product_id].revenue += r.revenue;
    } else {
      prodMap[r.product_id].returns += 1;
    }
    prodMap[r.product_id].units += r.quantity;
    prodMap[r.product_id].orders += 1;
    if (r.rating !== null && r.rating !== undefined) {
      prodMap[r.product_id].ratings.push(r.rating);
    }
  }

  const products = Object.values(prodMap).map((p) => {
    const avgRating = p.ratings.length > 0 ? p.ratings.reduce((a, b) => a + b, 0) / p.ratings.length : 0;
    const returnRate = p.orders > 0 ? (p.returns / p.orders) * 100 : 0;
    return {
      ...p,
      avgRating: Number(avgRating.toFixed(1)),
      returnRate: Number(returnRate.toFixed(1)),
    };
  });

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products
    .filter((p) => selectedCat === 'All' || p.category === selectedCat)
    .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Catalog & Merchandise Performance</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Product & Inventory Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
          Comprehensive SKU-level profitability, unit velocity, return ratios, and customer review scores.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search product SKU or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md pl-8 pr-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold">Category:</span>
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing {filteredProducts.length} of {products.length} catalog items
        </span>
      </div>

      {/* Product Catalog Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Product Name & SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Standard Price</th>
                <th className="px-4 py-3 text-right">Units Sold</th>
                <th className="px-4 py-3 text-right">Net Revenue</th>
                <th className="px-4 py-3 text-right">Return Rate</th>
                <th className="px-4 py-3 text-right">Avg Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{p.name}</div>
                    <div className="text-[11px] font-mono text-slate-400">{p.id}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{p.category}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-800">${p.unitPrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">{p.units.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                    ${p.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        p.returnRate > 10 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'text-slate-600'
                      }`}
                    >
                      {p.returnRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1 text-amber-500 font-semibold font-mono">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{p.avgRating > 0 ? p.avgRating : 'N/A'}</span>
                    </div>
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
