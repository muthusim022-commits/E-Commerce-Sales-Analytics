import { CleanTransaction, ExecutiveKpis, DynamicInsight, DashboardFilters } from '../types';

export function calculateExecutiveKpis(records: CleanTransaction[]): ExecutiveKpis {
  if (!records || records.length === 0) {
    return {
      totalRevenue: null,
      totalOrders: null,
      uniqueCustomers: null,
      aov: null,
      avgDiscountPct: null,
      returnRatePct: null,
      returnedCount: null,
    };
  }

  let sumRev = 0;
  let sumDiscount = 0;
  let returnCount = 0;
  const orderIds = new Set<string>();
  const customerIds = new Set<string>();

  for (const r of records) {
    sumRev += r.revenue;
    sumDiscount += r.discount;
    if (r.return_status === 'Returned') {
      returnCount++;
    }
    orderIds.add(r.order_id);
    customerIds.add(r.customer_id);
  }

  const totalOrders = orderIds.size;
  const uniqueCustomers = customerIds.size;
  const aov = totalOrders > 0 ? Number((sumRev / totalOrders).toFixed(2)) : 0;
  const avgDiscountPct = Number(((sumDiscount / records.length) * 100).toFixed(2));
  const returnRatePct = Number(((returnCount / records.length) * 100).toFixed(2));

  return {
    totalRevenue: Number(sumRev.toFixed(2)),
    totalOrders,
    uniqueCustomers,
    aov,
    avgDiscountPct,
    returnRatePct,
    returnedCount: returnCount,
  };
}

export function filterTransactions(records: CleanTransaction[], filters: DashboardFilters): CleanTransaction[] {
  return records.filter((r) => {
    if (filters.category && filters.category !== 'All' && r.category !== filters.category) {
      return false;
    }
    if (filters.country && filters.country !== 'All' && r.country !== filters.country) {
      return false;
    }
    if (filters.channel && filters.channel !== 'All' && r.acquisition_channel !== filters.channel) {
      return false;
    }
    if (filters.paymentMethod && filters.paymentMethod !== 'All' && r.payment_method !== filters.paymentMethod) {
      return false;
    }
    if (filters.dateStart && r.order_date < filters.dateStart) {
      return false;
    }
    if (filters.dateEnd && r.order_date > filters.dateEnd) {
      return false;
    }
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const match =
        r.product_name.toLowerCase().includes(q) ||
        r.customer_name.toLowerCase().includes(q) ||
        r.order_id.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}

export function generateDynamicInsights(records: CleanTransaction[]): DynamicInsight[] {
  if (!records || records.length === 0) return [];
  const insights: DynamicInsight[] = [];

  // 1. Revenue & Category Concentration
  const catRev: Record<string, number> = {};
  let totalRev = 0;
  for (const r of records) {
    catRev[r.category] = (catRev[r.category] || 0) + r.revenue;
    totalRev += r.revenue;
  }
  const sortedCats = Object.entries(catRev).sort((a, b) => b[1] - a[1]);
  if (sortedCats.length > 0 && totalRev > 0) {
    const [topCat, topCatRev] = sortedCats[0];
    const share = Number(((topCatRev / totalRev) * 100).toFixed(1));
    insights.push({
      pillar: 'Product Mix & Concentration',
      headline: `${topCat} Commands ${share}% of Gross Realized Revenue`,
      observation: `Across all product categories, '${topCat}' generated $${topCatRev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} out of $${totalRev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total revenue.`,
      interpretation: `Topline performance is closely tied to the sales velocity and margin structure of ${topCat}. While healthy, high category concentration introduces single-vertical supply chain and seasonality risk.`,
      recommendation: `Preserve premium inventory in ${topCat} while executing cross-merchandising campaigns with secondary categories like ${sortedCats[1] ? sortedCats[1][0] : 'adjacent lines'} to diversify the revenue base.`,
    });
  }

  // 2. Customer Pareto (LTV)
  const custSpend: Record<string, number> = {};
  for (const r of records) {
    custSpend[r.customer_id] = (custSpend[r.customer_id] || 0) + r.revenue;
  }
  const sortedSpenders = Object.values(custSpend).sort((a, b) => b - a);
  const totalCusts = sortedSpenders.length;
  if (totalCusts >= 10 && totalRev > 0) {
    const top10Count = Math.max(1, Math.floor(totalCusts * 0.1));
    const top10Revenue = sortedSpenders.slice(0, top10Count).reduce((a, b) => a + b, 0);
    const paretoShare = Number(((top10Revenue / totalRev) * 100).toFixed(1));
    insights.push({
      pillar: 'Customer Lifetime Value (LTV)',
      headline: `Top 10% of Customers Account for ${paretoShare}% of Overall Spend`,
      observation: `The top decile (${top10Count} out of ${totalCusts} unique patrons) generated $${top10Revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in transaction volume.`,
      interpretation: `Customer distribution demonstrates classic Power-Law dynamics: a small cohort of loyal, high-basket shoppers disproportionately drives revenue sustainability.`,
      recommendation: `Deploy an exclusive VIP retention tier offering expedited fulfillment, personalized unboxing perks, and early-access drops to insulate high-LTV accounts from platform churn.`,
    });
  }

  // 3. Marketing Attribution & AOV Divergence
  const chanStats: Record<string, { revenue: number; orders: number }> = {};
  for (const r of records) {
    if (!chanStats[r.acquisition_channel]) {
      chanStats[r.acquisition_channel] = { revenue: 0, orders: 0 };
    }
    chanStats[r.acquisition_channel].revenue += r.revenue;
    chanStats[r.acquisition_channel].orders += 1;
  }
  const sortedChans = Object.entries(chanStats).sort((a, b) => b[1].revenue - a[1].revenue);
  if (sortedChans.length > 0) {
    const [topChan, topStats] = sortedChans[0];
    let maxAovChan = '';
    let maxAovVal = -1;
    for (const [c, s] of sortedChans) {
      const aov = s.orders > 0 ? s.revenue / s.orders : 0;
      if (aov > maxAovVal) {
        maxAovVal = aov;
        maxAovChan = c;
      }
    }
    insights.push({
      pillar: 'Acquisition & ROAS Attribution',
      headline: `${topChan} Delivers Volume; ${maxAovChan} Unlocks Highest Ticket Sizes`,
      observation: `'${topChan}' is the primary scale engine producing $${topStats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${topStats.orders} orders). Concurrently, '${maxAovChan}' captures the highest average order value at $${maxAovVal.toFixed(2)}.`,
      interpretation: `Different channels attract distinct purchase intents: high-funnel paid channels capture customer volume, whereas referral or search intent captures committed buyers with higher basket density.`,
      recommendation: `Rebalance paid media budget: benchmark CAC against the superior basket value of ${maxAovChan} rather than evaluating all channels strictly on nominal conversion volume.`,
    });
  }

  // 4. Reverse Logistics & Returns
  const catReturns: Record<string, { total: number; returned: number }> = {};
  for (const r of records) {
    if (!catReturns[r.category]) {
      catReturns[r.category] = { total: 0, returned: 0 };
    }
    catReturns[r.category].total += 1;
    if (r.return_status === 'Returned') {
      catReturns[r.category].returned += 1;
    }
  }
  let highestRetCat = '';
  let highestRetRate = -1;
  for (const [c, stats] of Object.entries(catReturns)) {
    const rate = stats.total > 0 ? (stats.returned / stats.total) * 100 : 0;
    if (rate > highestRetRate) {
      highestRetRate = rate;
      highestRetCat = c;
    }
  }
  if (highestRetCat && highestRetRate > 0) {
    insights.push({
      pillar: 'Returns & Operational Quality',
      headline: `'${highestRetCat}' Shows Elevated Return Rate of ${highestRetRate.toFixed(1)}%`,
      observation: `Return requests are concentrated in '${highestRetCat}', where ${highestRetRate.toFixed(1)}% of all orders ended in a return status.`,
      interpretation: `Elevated returns incur double shipping expenses, inventory restock overhead, and customer friction, commonly stemming from fit issues or product page representation.`,
      recommendation: `Audit product reviews on ${highestRetCat} for sizing or specification complaints, introduce interactive fit guidance, and evaluate supplier quality control.`,
    });
  }

  return insights;
}

export function calculateCorrelationMatrix(records: CleanTransaction[]) {
  const numericKeys = ['quantity', 'unit_price', 'discount', 'revenue', 'shipping_cost', 'rating'] as const;
  const labels: Record<string, string> = {
    quantity: 'Quantity',
    unit_price: 'Unit Price',
    discount: 'Discount',
    revenue: 'Revenue',
    shipping_cost: 'Shipping',
    rating: 'Rating',
  };

  // Extract arrays
  const vectors: Record<string, number[]> = {};
  for (const k of numericKeys) {
    vectors[k] = [];
  }

  for (const r of records) {
    for (const k of numericKeys) {
      const val = r[k];
      vectors[k].push(typeof val === 'number' && !isNaN(val) ? val : 0);
    }
  }

  // Pearson correlation calculation helper
  function pearson(x: number[], y: number[]): number {
    const n = x.length;
    if (n === 0) return 0;
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }

    const denominator = Math.sqrt(denomX * denomY);
    if (denominator === 0) return 0;
    return Number((numerator / denominator).toFixed(2));
  }

  const matrix: { var1: string; var2: string; corr: number }[] = [];
  const tableData: Record<string, any>[] = [];

  for (const k1 of numericKeys) {
    const row: Record<string, any> = { metric: labels[k1] };
    for (const k2 of numericKeys) {
      const c = pearson(vectors[k1], vectors[k2]);
      row[k2] = c;
      matrix.push({ var1: labels[k1], var2: labels[k2], corr: c });
    }
    tableData.push(row);
  }

  return { matrix, tableData, keys: numericKeys, labels };
}
