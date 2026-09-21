-- ==========================================================
-- 05_marketing_analysis.sql
-- Shopify E-Commerce Sales Analytics: Acquisition Channel & CAC Efficiency
-- ==========================================================

-- 1. Acquisition Channel Performance (Revenue, Orders, AOV, Conversion Quality)
SELECT 
    m.acquisition_channel,
    COUNT(DISTINCT f.order_id) AS total_orders,
    COUNT(DISTINCT f.customer_id) AS total_acquired_customers,
    ROUND(SUM(f.revenue), 2) AS total_revenue_generated,
    ROUND(SUM(f.revenue) / COUNT(DISTINCT f.order_id), 2) AS average_order_value,
    ROUND(AVG(f.discount) * 100, 2) AS average_discount_offered,
    ROUND(SUM(CASE WHEN f.return_status = 'Returned' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS return_rate_pct,
    DENSE_RANK() OVER (ORDER BY SUM(f.revenue) DESC) AS channel_rank
FROM fact_sales f
JOIN dim_marketing m ON f.order_id = m.order_id
WHERE f.return_status != 'Returned'
GROUP BY m.acquisition_channel
ORDER BY total_revenue_generated DESC;

-- 2. Organic vs. Paid Traffic Comparative Evaluation
WITH channel_types AS (
    SELECT 
        order_id,
        acquisition_channel,
        CASE 
            WHEN acquisition_channel IN ('Organic Search', 'Direct') THEN 'Organic / Earned'
            ELSE 'Paid / Performance Marketing'
        END AS traffic_type
    FROM dim_marketing
)
SELECT 
    ct.traffic_type,
    COUNT(DISTINCT f.order_id) AS orders,
    ROUND(SUM(f.revenue), 2) AS total_revenue,
    ROUND(SUM(f.revenue) * 100.0 / SUM(SUM(f.revenue)) OVER (), 2) AS revenue_share_pct,
    ROUND(AVG(f.revenue), 2) AS average_order_value,
    ROUND(AVG(f.rating), 2) AS avg_customer_satisfaction
FROM fact_sales f
JOIN channel_types ct ON f.order_id = ct.order_id
WHERE f.return_status != 'Returned'
GROUP BY ct.traffic_type;

-- 3. Payment Method Popularity & Basket Size
SELECT 
    payment_method,
    COUNT(DISTINCT order_id) AS transaction_count,
    ROUND(SUM(revenue), 2) AS total_processed_volume,
    ROUND(AVG(revenue), 2) AS avg_basket_size,
    ROUND(COUNT(DISTINCT order_id) * 100.0 / (SELECT COUNT(DISTINCT order_id) FROM fact_sales), 1) AS share_of_transactions_pct
FROM fact_sales
WHERE return_status != 'Returned'
GROUP BY payment_method
ORDER BY total_processed_volume DESC;
