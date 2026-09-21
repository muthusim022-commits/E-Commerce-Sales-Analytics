-- ==========================================================
-- 04_product_analysis.sql
-- Shopify E-Commerce Sales Analytics: Product Performance & Returns
-- ==========================================================

-- 1. Top Products by Total Revenue with Running Revenue Contribution
WITH product_sales AS (
    SELECT 
        p.product_id,
        p.product_name,
        p.category,
        SUM(f.quantity) AS units_sold,
        ROUND(SUM(f.revenue), 2) AS total_revenue,
        ROUND(AVG(f.rating), 2) AS avg_customer_rating
    FROM fact_sales f
    JOIN dim_product p ON f.product_id = p.product_id
    WHERE f.return_status != 'Returned'
    GROUP BY p.product_id, p.product_name, p.category
)
SELECT 
    product_id,
    product_name,
    category,
    units_sold,
    total_revenue,
    avg_customer_rating,
    RANK() OVER (ORDER BY total_revenue DESC) AS sales_rank,
    ROUND(SUM(total_revenue) OVER (ORDER BY total_revenue DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 2) AS cumulative_revenue
FROM product_sales
ORDER BY total_revenue DESC
LIMIT 15;

-- 2. Return Rate by Product Category & Impact Analysis
SELECT 
    p.category,
    COUNT(*) AS total_transactions,
    SUM(CASE WHEN f.return_status = 'Returned' THEN 1 ELSE 0 END) AS returned_transactions,
    ROUND(SUM(CASE WHEN f.return_status = 'Returned' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS return_rate_pct,
    ROUND(SUM(CASE WHEN f.return_status = 'Returned' THEN f.revenue ELSE 0 END), 2) AS refunded_revenue_loss,
    ROUND(AVG(f.rating), 2) AS category_avg_rating
FROM fact_sales f
JOIN dim_product p ON f.product_id = p.product_id
GROUP BY p.category
ORDER BY return_rate_pct DESC;

-- 3. Discount Sensitivity: Does Higher Discount Correlate with Higher Volume?
SELECT 
    CASE 
        WHEN discount = 0 THEN '0% No Discount'
        WHEN discount <= 0.10 THEN '1% - 10% Low Discount'
        WHEN discount <= 0.20 THEN '11% - 20% Moderate'
        ELSE '> 20% Steep Discount'
    END AS discount_tier,
    COUNT(DISTINCT order_id) AS total_orders,
    SUM(quantity) AS total_units_sold,
    ROUND(SUM(revenue), 2) AS total_revenue,
    ROUND(AVG(revenue), 2) AS avg_order_revenue
FROM fact_sales
GROUP BY discount_tier
ORDER BY total_revenue DESC;
