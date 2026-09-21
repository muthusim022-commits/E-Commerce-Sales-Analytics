import React, { useState, useMemo } from 'react';
import { Menu, X, RefreshCw } from 'lucide-react';
import Sidebar from './components/Sidebar';
import DataUploadView from './components/DataUploadView';
import ExecutiveDashboardView from './components/ExecutiveDashboardView';
import EdaAnalysisView from './components/EdaAnalysisView';
import CustomerAnalysisView from './components/CustomerAnalysisView';
import ProductAnalysisView from './components/ProductAnalysisView';
import MarketingAnalysisView from './components/MarketingAnalysisView';
import BusinessInsightsView from './components/BusinessInsightsView';
import DocumentationView from './components/DocumentationView';

import { SAMPLE_SHOPIFY_SALES_CSV } from './data/sampleShopifyData';
import { parseCsvString } from './utils/csvParser';
import { profileDataset, cleanDataset } from './utils/dataCleaner';
import {
  calculateExecutiveKpis,
  filterTransactions,
  generateDynamicInsights,
} from './utils/analytics';
import { DashboardFilters } from './types';

const INITIAL_FILTERS: DashboardFilters = {
  category: 'All',
  country: 'All',
  channel: 'All',
  paymentMethod: 'All',
  searchQuery: '',
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>(INITIAL_FILTERS);

  // Raw dataset state
  const [rawRows, setRawRows] = useState<Record<string, string>[]>(() => {
    return parseCsvString(SAMPLE_SHOPIFY_SALES_CSV);
  });

  // Profile dataset
  const profile = useMemo(() => {
    return profileDataset(rawRows);
  }, [rawRows]);

  // Clean dataset
  const { cleanRows, report } = useMemo(() => {
    return cleanDataset(rawRows);
  }, [rawRows]);

  // Dynamic filter application
  const filteredRecords = useMemo(() => {
    return filterTransactions(cleanRows, filters);
  }, [cleanRows, filters]);

  // Executive KPIs
  const executiveKpis = useMemo(() => {
    return calculateExecutiveKpis(filteredRecords);
  }, [filteredRecords]);

  // Dynamic business insights
  const dynamicInsights = useMemo(() => {
    return generateDynamicInsights(cleanRows);
  }, [cleanRows]);

  const handleUploadCsv = (csvText: string) => {
    const parsed = parseCsvString(csvText);
    if (parsed.length > 0) {
      setRawRows(parsed);
      setFilters(INITIAL_FILTERS);
    }
  };

  const handleReloadSample = () => {
    const parsed = parseCsvString(SAMPLE_SHOPIFY_SALES_CSV);
    setRawRows(parsed);
    setFilters(INITIAL_FILTERS);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          recordCount={cleanRows.length}
          qualityScore={report.qualityScore}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/80 backdrop-blur-xs">
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900">
            <div className="p-4 flex items-center justify-between border-b border-slate-800">
              <span className="text-sm font-bold text-white">Menu Navigation</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar
              currentTab={currentTab}
              onSelectTab={(tab) => {
                setCurrentTab(tab);
                setMobileMenuOpen(false);
              }}
              recordCount={cleanRows.length}
              qualityScore={report.qualityScore}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 bg-white border-b border-slate-200 px-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-md text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                E-Commerce Analytics
              </span>
              <span className="hidden sm:inline-block text-[11px] text-slate-400 ml-2">
                / {currentTab.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick reload sample */}
            <button
              onClick={handleReloadSample}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
              title="Reset to benchmark dataset"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Benchmark</span>
            </button>
          </div>
        </header>

        {/* Dynamic Body Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'upload' && (
              <DataUploadView
                rawRows={rawRows}
                profile={profile}
                onUploadCsv={handleUploadCsv}
                onReloadSample={handleReloadSample}
                onProceedToDashboard={() => setCurrentTab('dashboard')}
              />
            )}

            {currentTab === 'dashboard' && (
              <ExecutiveDashboardView
                records={cleanRows}
                filteredRecords={filteredRecords}
                filters={filters}
                onFilterChange={setFilters}
                onResetFilters={() => setFilters(INITIAL_FILTERS)}
              />
            )}

            {currentTab === 'eda' && <EdaAnalysisView records={cleanRows} />}

            {currentTab === 'customers' && <CustomerAnalysisView records={cleanRows} />}

            {currentTab === 'products' && <ProductAnalysisView records={cleanRows} />}

            {currentTab === 'marketing' && <MarketingAnalysisView records={cleanRows} />}

            {currentTab === 'insights' && <BusinessInsightsView insights={dynamicInsights} />}

            {currentTab === 'docs' && <DocumentationView />}
          </div>
        </main>
      </div>
    </div>
  );
}
