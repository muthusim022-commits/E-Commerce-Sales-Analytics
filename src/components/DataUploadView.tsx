import React, { useState } from 'react';
import { UploadCloud, RefreshCw, FileText, CheckCircle2, AlertTriangle, ArrowRight, Table } from 'lucide-react';
import { DatasetProfile, RawRow } from '../types';

interface DataUploadViewProps {
  rawRows: Record<string, string>[];
  profile: DatasetProfile;
  onUploadCsv: (csvText: string, filename?: string) => void;
  onReloadSample: () => void;
  onProceedToDashboard: () => void;
}

export default function DataUploadView({
  rawRows,
  profile,
  onUploadCsv,
  onReloadSample,
  onProceedToDashboard,
}: DataUploadViewProps) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string>('sample_shopify_sales.csv');

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        onUploadCsv(text, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Preview first 50 rows
  const previewRows = rawRows.slice(0, 50);
  const headers = profile.columns.map((c) => c.column);

  // Critical field checks
  const criticalFields = ['order_id', 'revenue', 'order_date', 'customer_id', 'product_name', 'category'];
  const missingCritical = criticalFields.filter(
    (cf) => !profile.columns.some((c) => c.column.toLowerCase() === cf || c.column.toLowerCase().includes(cf))
  );

  return (
    <div className="space-y-6">
      {/* Title & Subtitle Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>End-to-End Analytics Workflow</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            E-Commerce Analytics
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Data Analytics for Business Intelligence
          </p>
          <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">
            Upload your Shopify transaction log or explore the embedded multi-category synthetic dataset. 
            The system executes automatic data profiling, Power Query-style cleansing, dimensional modeling, 
            and analytical SQL queries—without hardcoded values.
          </p>
        </div>
      </div>

      {/* Upload Zone & Quick Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drag and Drop Zone */}
        <div
          id="csv-drop-zone"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`lg:col-span-2 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all bg-white ${
            dragOver ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-slate-400'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-slate-800">
            Upload Shopify CSV Dataset
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            Drag & drop any transaction CSV or choose a file from your computer. Headers will be dynamically mapped.
          </p>
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors">
            <span>Browse Computer Files</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />
          </label>
          <p className="text-[11px] text-slate-400 mt-3">
            Active file: <span className="font-mono text-slate-600 font-semibold">{fileName}</span>
          </p>
        </div>

        {/* Quick Sample Dataset Info Card */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Benchmark Dataset
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                Ready
              </span>
            </div>
            <h2 className="text-sm font-semibold text-slate-900 mb-1">
              Realistic Shopify Sales (722 Records)
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Preloaded with multi-category transactions across 20 products, 6 global regions, 6 acquisition channels, 
              calculated discounts, return tracking, and customer reviews.
            </p>
            <div className="space-y-1.5 text-xs text-slate-600 mb-4 font-mono bg-white p-2.5 rounded-lg border border-slate-200">
              <div>• Date Span: 2023-01 to 2024-03</div>
              <div>• Categories: Apparel, Tech, Home, Beauty</div>
              <div>• Channels: Search, Social, Direct, Email</div>
            </div>
          </div>
          <button
            id="reload-sample-btn"
            onClick={onReloadSample}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Benchmark Dataset</span>
          </button>
        </div>
      </div>

      {/* Dataset Health Overview KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Rows</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{profile.totalRows.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">Raw ingested records</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Columns</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{profile.totalColumns}</div>
          <div className="text-[11px] text-slate-400 mt-1">Detected schema headers</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Duplicate Rows</div>
          <div className={`text-2xl font-bold mt-1 ${profile.duplicateRows > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {profile.duplicateRows}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Exact line duplicates</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Date Coverage</div>
          <div className="text-sm font-bold text-slate-800 mt-2 truncate">
            {profile.dateRange ? `${profile.dateRange.start} → ${profile.dateRange.end}` : 'No date detected'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Temporal observation window</div>
        </div>
      </div>

      {/* Missing Column Warning if needed */}
      {missingCritical.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 flex items-start gap-3 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-950">Field Mapping Notice</div>
            <p className="mt-0.5 leading-relaxed">
              The uploaded file does not include standard columns for: <span className="font-mono font-semibold">{missingCritical.join(', ')}</span>.
              Downstream views will gracefully adapt and notify you of any uncalculable KPIs.
            </p>
          </div>
        </div>
      )}

      {/* Column Profiling & Detected Data Types Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Column Profiling & Schema Inference
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated evaluation of data types, missing ratios, and unique value cardinality.
            </p>
          </div>
          <button
            id="proceed-to-dashboard-btn"
            onClick={onProceedToDashboard}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            <span>Proceed to Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Column Name</th>
                <th className="px-4 py-3">Physical Type</th>
                <th className="px-4 py-3">Inferred Semantic Role</th>
                <th className="px-4 py-3 text-right">Missing %</th>
                <th className="px-4 py-3 text-right">Unique Values</th>
                <th className="px-4 py-3">Sample Values</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {profile.columns.map((c) => (
                <tr key={c.column} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-2.5 font-mono font-medium text-slate-900">{c.column}</td>
                  <td className="px-4 py-2.5 text-slate-600">{c.dataType}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        c.inferredType === 'numeric'
                          ? 'bg-blue-100 text-blue-800'
                          : c.inferredType === 'date'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.inferredType === 'identifier'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {c.inferredType}
                    </span>
                  </td>
                  <td className={`px-4 py-2.5 text-right font-mono ${c.missingPct > 0 ? 'text-amber-600 font-semibold' : 'text-slate-600'}`}>
                    {c.missingPct}%
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-600">
                    {c.uniqueValues.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 truncate max-w-xs font-mono text-[11px]">
                    {c.sampleValues.join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* First 50 Rows Preview */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-slate-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Raw Data Preview (First 50 Ingested Records)
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing {previewRows.length} of {profile.totalRows} rows
          </span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 text-[11px] text-slate-400">#</th>
                {headers.map((h) => (
                  <th key={h} className="px-3 py-2 font-mono whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {previewRows.map((r, idx) => (
                <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-3 py-1.5 text-[11px] text-slate-400 font-mono">{idx + 1}</td>
                  {headers.map((h) => (
                    <td key={h} className="px-3 py-1.5 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                      {r[h] ?? ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
