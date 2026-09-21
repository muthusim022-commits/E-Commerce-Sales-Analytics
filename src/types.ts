export interface RawRow {
  [key: string]: string | number | undefined | null;
}

export interface CleanTransaction {
  order_id: string;
  order_date: string;
  customer_id: string;
  customer_name: string;
  country: string;
  region: string;
  product_id: string;
  product_name: string;
  category: string;
  quantity: number;
  unit_price: number;
  discount: number;
  revenue: number;
  shipping_cost: number;
  payment_method: string;
  acquisition_channel: string;
  rating: number | null;
  return_status: string;
  [key: string]: any;
}

export interface ColumnProfile {
  column: string;
  dataType: string;
  inferredType: 'numeric' | 'categorical' | 'date' | 'identifier';
  missingCount: number;
  missingPct: number;
  uniqueValues: number;
  sampleValues: string[];
  minVal?: number | string;
  maxVal?: number | string;
}

export interface DatasetProfile {
  totalRows: number;
  totalColumns: number;
  duplicateRows: number;
  dateRange?: { start: string; end: string };
  columns: ColumnProfile[];
}

export interface CleaningStepLog {
  step: string;
  details: string;
  status: 'Applied' | 'Skipped (clean)' | 'Warning';
}

export interface DataQualityReport {
  rawRows: number;
  cleanRows: number;
  qualityScore: number;
  duplicateCount: number;
  totalCells: number;
  missingCells: number;
  impossibleValuesCount: number;
  cleaningLog: CleaningStepLog[];
}

export interface ExecutiveKpis {
  totalRevenue: number | null;
  totalOrders: number | null;
  uniqueCustomers: number | null;
  aov: number | null;
  avgDiscountPct: number | null;
  returnRatePct: number | null;
  returnedCount: number | null;
}

export interface DynamicInsight {
  pillar: string;
  headline: string;
  observation: string;
  interpretation: string;
  recommendation: string;
}

export interface DashboardFilters {
  category: string;
  country: string;
  channel: string;
  paymentMethod: string;
  dateStart?: string;
  dateEnd?: string;
  searchQuery: string;
}
