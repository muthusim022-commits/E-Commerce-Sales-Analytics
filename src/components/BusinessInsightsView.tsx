import React from 'react';
import { Lightbulb, Target, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';
import { DynamicInsight } from '../types';

interface BusinessInsightsViewProps {
  insights: DynamicInsight[];
}

export default function BusinessInsightsView({ insights }: BusinessInsightsViewProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Executive Advisory & Decision Support</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Executive Business Insights & Action Plan
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Translating raw telemetry and descriptive metrics into high-impact commercial recommendations. 
          Every insight follows the <strong>Observation ➔ Interpretation ➔ Recommendation</strong> structured analytical framework.
        </p>
      </div>

      {/* Strategic Insights Cards */}
      <div className="grid grid-cols-1 gap-6">
        {insights.map((ins, index) => (
          <div key={index} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            {/* Header with Pillar */}
            <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {ins.pillar}
                </span>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">
                Actionable Strategy
              </span>
            </div>

            <div className="p-6 space-y-4">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {ins.headline}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* 1. Observation */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>1. Empirical Observation</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{ins.observation}</p>
                </div>

                {/* 2. Interpretation */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>2. Commercial Interpretation</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{ins.interpretation}</p>
                </div>

                {/* 3. Action Recommendation */}
                <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-950 mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>3. Strategic Recommendation</span>
                  </div>
                  <p className="text-emerald-900 leading-relaxed font-medium">{ins.recommendation}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
