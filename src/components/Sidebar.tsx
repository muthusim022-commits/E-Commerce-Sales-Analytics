import React from 'react';
import {
  Upload,
  LayoutDashboard,
  TrendingUp,
  Users,
  ShoppingBag,
  Megaphone,
  Lightbulb,
  BookOpen,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  recordCount: number;
  qualityScore: number;
}

export const NAV_ITEMS = [
  { id: 'upload', label: 'Data Upload', icon: Upload, category: 'Data' },
  { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard, category: 'Reporting' },
  { id: 'eda', label: 'Exploratory Analysis', icon: TrendingUp, category: 'Analysis' },
  { id: 'customers', label: 'Customer Analysis', icon: Users, category: 'Deep Dive' },
  { id: 'products', label: 'Product Analysis', icon: ShoppingBag, category: 'Deep Dive' },
  { id: 'marketing', label: 'Marketing Analysis', icon: Megaphone, category: 'Deep Dive' },
  { id: 'insights', label: 'Business Insights', icon: Lightbulb, category: 'Strategic' },
  { id: 'docs', label: 'Documentation', icon: BookOpen, category: 'Reference' },
];

export default function Sidebar({ currentTab, onSelectTab, recordCount, qualityScore }: SidebarProps) {
  return (
    <aside
      id="analytics-sidebar"
      className="w-72 bg-slate-900 text-slate-200 flex flex-col flex-shrink-0 border-r border-slate-800 select-none min-h-screen"
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-lg shadow-sm">
            🛍️
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-tight leading-none">
              E-Commerce Analytics
            </h1>
            <p className="text-[11px] text-slate-400 mt-1 font-medium tracking-wide">
              Data Analytics for Business Intelligence
            </p>
          </div>
        </div>

        {/* Live Data Badge */}
        <div className="mt-4 p-2.5 rounded-md bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">{recordCount.toLocaleString()} Rows</span>
          </div>
          <span className="text-emerald-400 font-semibold text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded">
            Health: {qualityScore}%
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
        {NAV_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const prevCategory = idx > 0 ? NAV_ITEMS[idx - 1].category : '';
          const showHeader = item.category !== prevCategory;

          return (
            <React.Fragment key={item.id}>
              {showHeader && (
                <div className="px-3 pt-3.5 pb-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                  {item.category}
                </div>
              )}
              <button
                id={`nav-btn-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Footer Callout */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-xs text-slate-400">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-200">E-Commerce Analytics</span>
          <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">
            v1.0.0
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
          Data Analytics for Business Intelligence
        </p>
      </div>
    </aside>
  );
}
