-- ==========================================================
-- 01_data_quality.sql
-- Shopify E-Commerce Sales Analytics: Data Quality & Profiling
-- ==========================================================

-- 1. Check total record count & distinct orders
SELECT 
    COUNT(*) AS total_raw_rows,
    COUNT(DISTINCT order_id) AS distinct_orders,
    COUNT(DISTINCT customer_id) AS distinct_customers,
    COUNT(DISTINCT product_id) AS distinct_products
FROM raw_shopify_sales;

-- 2. Identify duplicate order records
SELECT 
    order_id, 
    customer_id, 
    order_date, 
    product_id, 
    COUNT(*) AS duplicate_count
FROM raw_shopify_sales
GROUP BY order_id, customer_id, order_date, product_id
HAVING COUNT(*) > 1;

-- 3. Check for missing or null values in critical dimensions
SELECT 
    SUM(CASE WHEN order_id IS NULL OR TRIM(order_id) = '' THEN 1 ELSE 0 END) AS missing_order_ids,
    SUM(CASE WHEN customer_id IS NULL OR TRIM(customer_id) = '' THEN 1 ELSE 0 END) AS missing_customer_ids,
    SUM(CASE WHEN revenue IS NULL THEN 1 ELSE 0 END) AS missing_revenue,
    SUM(CASE WHEN rating IS NULL OR rating = '' THEN 1 ELSE 0 END) AS missing_ratings,
    SUM(CASE WHEN return_status IS NULL THEN 1 ELSE 0 END) AS missing_returns
FROM raw_shopify_sales;

-- 4. Check for impossible numeric values (negative revenue or invalid discount bounds)
SELECT 
    order_id, 
    revenue, 
    quantity, 
    unit_price, 
    discount
FROM raw_shopify_sales
WHERE revenue < 0 
   OR quantity <= 0 
   OR unit_price < 0 
   OR discount < 0 
   OR discount > 1.0;

-- 5. Data Quality Score calculation summary CTE
WITH quality_metrics AS (
    SELECT
        COUNT(*) AS total_rows,
        SUM(CASE WHEN order_id IS NOT NULL AND revenue IS NOT NULL AND customer_id IS NOT NULL THEN 1 ELSE 0 END) AS valid_core_rows,
        SUM(CASE WHEN rating IS NOT NULL AND rating != '' THEN 1 ELSE 0 END) AS populated_ratings
    FROM raw_shopify_sales
)
SELECT 
    total_rows,
    valid_core_rows,
    ROUND((CAST(valid_core_rows AS FLOAT) / total_rows) * 100.0, 2) AS core_data_completeness_pct,
    ROUND((CAST(populated_ratings AS FLOAT) / total_rows) * 100.0, 2) AS rating_completeness_pct
FROM quality_metrics;
