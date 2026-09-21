-- ==========================================================
-- 02_sales_analysis.sql
-- Shopify E-Commerce Sales Analytics: Sales Trends & Performance
-- ==========================================================

-- 1. Executive KPIs (Total Revenue, Orders, AOV, Avg Discount)
SELECT 
    COUNT(DISTINCT order_id) AS total_orders,
    COUNT(DISTINCT customer_id) AS total_unique_customers,
    ROUND(SUM(revenue), 2) AS total_net_revenue,
    ROUND(SUM(revenue) / COUNT(DISTINCT order_id), 2) AS average_order_value,
    ROUND(AVG(discount) * 100, 2) AS average_discount_pct,
    ROUND(SUM(CASE WHEN return_status = 'Returned' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS return_rate_pct
FROM fact_sales;

-- 2. Monthly Revenue Trend with Window Functions (MoM Growth & Running Total)
WITH monthly_metrics AS (
    SELECT 
        STRFTIME('%Y-%m', order_date) AS sales_month,
        COUNT(DISTINCT order_id) AS order_count,
        ROUND(SUM(revenue), 2) AS monthly_revenue
    FROM fact_sales
    WHERE return_status != 'Returned'
    GROUP BY STRFTIME('%Y-%m', order_date)
),
mom_lag AS (
    SELECT 
        sales_month,
        order_count,
        monthly_revenue,
        LAG(monthly_revenue, 1) OVER (ORDER BY sales_month) AS prev_month_revenue,
        SUM(monthly_revenue) OVER (ORDER BY sales_month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total_revenue
    FROM monthly_metrics
)
SELECT 
    sales_month,
    order_count,
    monthly_revenue,
    COALESCE(prev_month_revenue, 0) AS prev_month_revenue,
    ROUND(((monthly_revenue - prev_month_revenue) / NULLIF(prev_month_revenue, 0)) * 100.0, 2) AS mom_growth_pct,
    ROUND(running_total_revenue, 2) AS running_total_revenue
FROM mom_lag
ORDER BY sales_month;

-- 3. Revenue by Product Category with Category Ranking
SELECT 
    p.category,
    COUNT(DISTINCT f.order_id) AS total_orders,
    SUM(f.quantity) AS units_sold,
    ROUND(SUM(f.revenue), 2) AS total_category_revenue,
    ROUND(AVG(f.revenue), 2) AS avg_item_revenue,
    ROUND((SUM(f.revenue) / SUM(SUM(f.revenue)) OVER ()) * 100.0, 2) AS share_of_total_revenue_pct,
    RANK() OVER (ORDER BY SUM(f.revenue) DESC) AS category_rank
FROM fact_sales f
JOIN dim_product p ON f.product_id = p.product_id
WHERE f.return_status != 'Returned'
GROUP BY p.category
ORDER BY total_category_revenue DESC;

-- 4. Geographic Sales Performance (Country & Regional Breakdown)
SELECT 
    c.country,
    c.region,
    COUNT(DISTINCT f.order_id) AS orders,
    COUNT(DISTINCT f.customer_id) AS unique_buyers,
    ROUND(SUM(f.revenue), 2) AS total_revenue,
    ROUND(SUM(f.revenue) / COUNT(DISTINCT f.order_id), 2) AS regional_aov
FROM fact_sales f
JOIN dim_customer c ON f.customer_id = c.customer_id
WHERE f.return_status != 'Returned'
GROUP BY c.country, c.region
ORDER BY total_revenue DESC;
