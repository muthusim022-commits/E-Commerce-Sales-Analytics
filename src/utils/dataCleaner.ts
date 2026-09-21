import { CleanTransaction, ColumnProfile, DatasetProfile, DataQualityReport, CleaningStepLog } from '../types';

export function profileDataset(rawRows: Record<string, string>[]): DatasetProfile {
  const totalRows = rawRows.length;
  if (totalRows === 0) {
    return {
      totalRows: 0,
      totalColumns: 0,
      duplicateRows: 0,
      columns: [],
    };
  }

  const columns = Object.keys(rawRows[0]);
  const duplicateSet = new Set<string>();
  let duplicateRows = 0;

  for (const row of rawRows) {
    const serialized = JSON.stringify(row);
    if (duplicateSet.has(serialized)) {
      duplicateRows++;
    } else {
      duplicateSet.add(serialized);
    }
  }

  let minDate = '';
  let maxDate = '';

  const colProfiles: ColumnProfile[] = columns.map((col) => {
    let missingCount = 0;
    const uniqueVals = new Set<string>();
    let numericCount = 0;
    let dateCount = 0;
    let minNum = Infinity;
    let maxNum = -Infinity;

    for (const r of rawRows) {
      const val = r[col]?.trim() ?? '';
      if (!val || val.toLowerCase() === 'nan' || val.toLowerCase() === 'null') {
        missingCount++;
      } else {
        uniqueVals.add(val);
        const num = Number(val);
        if (!isNaN(num) && val !== '') {
          numericCount++;
          if (num < minNum) minNum = num;
          if (num > maxNum) maxNum = num;
        }

        if (col.toLowerCase().includes('date') || col.toLowerCase().includes('time')) {
          const parsed = Date.parse(val);
          if (!isNaN(parsed)) {
            dateCount++;
            if (!minDate || val < minDate) minDate = val;
            if (!maxDate || val > maxDate) maxDate = val;
          }
        }
      }
    }

    const validNonEmpty = totalRows - missingCount;
    let inferredType: 'numeric' | 'categorical' | 'date' | 'identifier' = 'categorical';

    if (col.toLowerCase().endsWith('_id') || col.toLowerCase() === 'id') {
      inferredType = 'identifier';
    } else if (dateCount > validNonEmpty * 0.7 && validNonEmpty > 0) {
      inferredType = 'date';
    } else if (numericCount > validNonEmpty * 0.7 && validNonEmpty > 0) {
      inferredType = 'numeric';
    }

    return {
      column: col,
      dataType: inferredType === 'numeric' ? 'float64 / int' : inferredType === 'date' ? 'datetime64' : 'object',
      inferredType,
      missingCount,
      missingPct: Number(((missingCount / totalRows) * 100).toFixed(1)),
      uniqueValues: uniqueVals.size,
      sampleValues: Array.from(uniqueVals).slice(0, 5),
      minVal: minNum !== Infinity ? minNum : undefined,
      maxVal: maxNum !== -Infinity ? maxNum : undefined,
    };
  });

  return {
    totalRows,
    totalColumns: columns.length,
    duplicateRows,
    dateRange: minDate && maxDate ? { start: minDate, end: maxDate } : undefined,
    columns: colProfiles,
  };
}

export function cleanDataset(rawRows: Record<string, string>[]): {
  cleanRows: CleanTransaction[];
  report: DataQualityReport;
} {
  const rawCount = rawRows.length;
  const cleaningLog: CleaningStepLog[] = [];

  if (rawCount === 0) {
    return {
      cleanRows: [],
      report: {
        rawRows: 0,
        cleanRows: 0,
        qualityScore: 100,
        duplicateCount: 0,
        totalCells: 0,
        missingCells: 0,
        impossibleValuesCount: 0,
        cleaningLog: [],
      },
    };
  }

  // 1. Column standardization (lowercase, trimmed, snake_case)
  const originalCols = Object.keys(rawRows[0]);
  const colMap = new Map<string, string>();
  for (const c of originalCols) {
    const cleaned = c.trim().toLowerCase().replace(/[\s\-]+/g, '_');
    colMap.set(c, cleaned);
  }
  cleaningLog.push({
    step: 'Standardize Column Names',
    details: `Mapped ${originalCols.length} headers to snake_case format`,
    status: 'Applied',
  });

  // 2. String trimming and deduplication
  const seenRows = new Set<string>();
  let duplicateCount = 0;
  let impossibleValuesCount = 0;
  let missingCells = 0;

  const intermediateRows: Record<string, any>[] = [];

  for (const row of rawRows) {
    const normRow: Record<string, any> = {};
    for (const [origKey, cleanKey] of colMap.entries()) {
      let val: string | null = row[origKey];
      if (typeof val === 'string') {
        val = val.trim();
        if (val.toLowerCase() === 'nan' || val.toLowerCase() === 'null' || val === '') {
          val = null;
        }
      }
      normRow[cleanKey] = val;
    }

    // Duplicate check
    const hash = JSON.stringify(normRow);
    if (seenRows.has(hash)) {
      duplicateCount++;
      continue;
    }
    seenRows.add(hash);
    intermediateRows.push(normRow);
  }

  cleaningLog.push({
    step: 'Remove Exact Duplicate Rows',
    details: duplicateCount > 0 ? `Identified and dropped ${duplicateCount} duplicate records` : 'No exact duplicate records detected',
    status: duplicateCount > 0 ? 'Applied' : 'Skipped (clean)',
  });

  // 3. Type casting & sanity checks
  const cleanRows: CleanTransaction[] = [];

  for (let idx = 0; idx < intermediateRows.length; idx++) {
    const r = intermediateRows[idx];

    // Numbers
    const qty = Math.max(1, parseInt(r.quantity ?? '1', 10) || 1);
    const unitPrice = Math.max(0, parseFloat(r.unit_price ?? '0') || 0);
    let discount = parseFloat(r.discount ?? '0');
    if (isNaN(discount) || discount < 0) {
      discount = 0;
    } else if (discount > 1) {
      discount = discount / 100; // handle percentage format like 20 -> 0.20
    }

    let revenue = parseFloat(r.revenue ?? '');
    if (isNaN(revenue) || revenue < 0) {
      // derive if possible
      revenue = Number((qty * unitPrice * (1 - discount)).toFixed(2));
      impossibleValuesCount++;
    }

    const shipping = Math.max(0, parseFloat(r.shipping_cost ?? '0') || 0);
    const ratingRaw = parseFloat(r.rating ?? '');
    const rating = isNaN(ratingRaw) ? null : Math.min(5, Math.max(1, ratingRaw));

    // Dates
    let orderDate = r.order_date || r.date || '2023-01-01';
    if (orderDate.includes('/')) {
      const parts = orderDate.split('/');
      if (parts.length === 3) {
        orderDate = `${parts[2].padStart(4, '20')}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }
    }

    // Count missing cells
    for (const key of Object.keys(r)) {
      if (r[key] === null || r[key] === undefined || r[key] === '') {
        missingCells++;
      }
    }

    const cleanRecord: CleanTransaction = {
      order_id: r.order_id || `SHP-${5000 + idx}`,
      order_date: orderDate,
      customer_id: r.customer_id || `CUST-${1000 + (idx % 250)}`,
      customer_name: r.customer_name || 'Customer',
      country: r.country || 'United States',
      region: r.region || 'North America',
      product_id: r.product_id || `PROD-${100 + (idx % 20)}`,
      product_name: r.product_name || 'Standard Item',
      category: r.category || 'General Merchandise',
      quantity: qty,
      unit_price: unitPrice,
      discount,
      revenue,
      shipping_cost: shipping,
      payment_method: r.payment_method || 'Shopify Pay',
      acquisition_channel: r.acquisition_channel || 'Direct',
      rating,
      return_status: r.return_status === 'Returned' ? 'Returned' : 'Completed',
    };

    cleanRows.push(cleanRecord);
  }

  cleaningLog.push({
    step: 'Numeric & Date Normalization',
    details: `Sanitized financial figures, dates, and discounts across ${cleanRows.length} transactions`,
    status: 'Applied',
  });

  cleaningLog.push({
    step: 'Data Quality Range & Integrity Audit',
    details: `Flagged ${impossibleValuesCount} invalid/negative calculations and repaired them via deterministic logic`,
    status: 'Applied',
  });

  // Calculate dynamic Quality Score
  const totalCells = rawCount * originalCols.length;
  const completenessPct = totalCells > 0 ? (totalCells - missingCells) / totalCells : 1;
  const dedupPct = rawCount > 0 ? 1 - duplicateCount / rawCount : 1;
  const qualityScore = Math.min(100, Math.max(50, Number(((completenessPct * 0.7 + dedupPct * 0.3) * 100).toFixed(1))));

  return {
    cleanRows,
    report: {
      rawRows: rawCount,
      cleanRows: cleanRows.length,
      qualityScore,
      duplicateCount,
      totalCells,
      missingCells,
      impossibleValuesCount,
      cleaningLog,
    },
  };
}
