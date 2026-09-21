import React from 'react';
import { BookOpen, CheckCircle2, Layers, ShieldCheck, Database, Cpu, Award } from 'lucide-react';

export default function DocumentationView() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Technical Reference</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          System Reference & Methodology
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Comprehensive review of data pipeline transformations, relational dimensional modeling, 
          analytical SQL design, and Power BI business intelligence standards.
        </p>
      </div>

      {/* 4 Pillars of the Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>1. Data Cleaning & Validation Pipeline</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            In modern data analytics, raw data often contains defects that produce deceptive dashboards. Our Power Query-style engine guarantees:
          </p>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
            <li>Deterministic column header sanitization (snake_case conversion).</li>
            <li>Exact duplicate line removal via composite hashing.</li>
            <li>Robust type inference with ISO-8601 calendar date parsing.</li>
            <li>Business constraint audits (non-negative revenue, valid discount rates [0-100%]).</li>
          </ul>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>2. Kimball Star Schema Dimensional Modeling</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            Instead of running heavy analytical operations on wide, flat denormalized tables:
          </p>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
            <li>Measures are isolated in <span className="font-mono text-emerald-700 font-semibold">fact_sales</span>.</li>
            <li>Master records are separated into <span className="font-mono text-blue-700 font-semibold">dim_customer</span>, <span className="font-mono text-purple-700 font-semibold">dim_product</span>, <span className="font-mono text-slate-700 font-semibold">dim_marketing</span>, and <span className="font-mono text-emerald-700 font-semibold">dim_date</span>.</li>
            <li>Enforces 1 : * cardinality to prevent unintentional row multiplication during aggregation joins.</li>
          </ul>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            <Cpu className="w-4 h-4 text-purple-600" />
            <span>3. Analytical Computations & Metric Algorithms</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            Algorithmic data transforms power our multi-dimensional metric computations:
          </p>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
            <li><strong>Growth Dynamics:</strong> Compute MoM trends, period-over-period delta benchmarks, and trajectory shifts.</li>
            <li><strong>Cohort & Category Rankings:</strong> Rank segments via dense percentile distributions and running aggregates.</li>
            <li><strong>Cross-Dimensional Slicing:</strong> Multi-axis filtering evaluating customer geography, products, and acquisition channels in real time.</li>
          </ul>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            <Award className="w-4 h-4 text-amber-600" />
            <span>4. Power BI Dashboard & DAX Design</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            Visual analytics crafted around stakeholder decision velocity:
          </p>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
            <li>Top KPI Cards establishing immediate business context (Revenue, Orders, AOV, Returns).</li>
            <li>Dynamic Slicers evaluating multi-dimensional filter contexts in real time.</li>
            <li>Explicit DAX measure definitions honoring row context transition without synthetic hardcoding.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
