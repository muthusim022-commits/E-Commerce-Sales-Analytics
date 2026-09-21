-- ==========================================================
-- 03_customer_analysis.sql
-- Shopify E-Commerce Sales Analytics: Customer Segmentation & LTV
-- ==========================================================

-- 1. Customer Ranking by Lifetime Revenue (Top 10 Customers)
SELECT 
    c.customer_id,
    c.customer_name,
    c.country,
    COUNT(DISTINCT f.order_id) AS total_orders_placed,
    SUM(f.quantity) AS total_items_purchased,
    ROUND(SUM(f.revenue), 2) AS customer_ltv_revenue,
    ROUND(AVG(f.revenue), 2) AS average_order_revenue,
    DENSE_RANK() OVER (ORDER BY SUM(f.revenue) DESC) AS customer_revenue_rank
FROM fact_sales f
JOIN dim_customer c ON f.customer_id = c.customer_id
WHERE f.return_status != 'Returned'
GROUP BY c.customer_id, c.customer_name, c.country
ORDER BY customer_ltv_revenue DESC
LIMIT 10;

-- 2. Repeat Customer Analysis: Single vs Multi-Purchase Customers
WITH customer_order_counts AS (
    SELECT 
        customer_id,
        COUNT(DISTINCT order_id) AS order_count,
        SUM(revenue) AS total_spend
    FROM fact_sales
    WHERE return_status != 'Returned'
    GROUP BY customer_id
),
customer_segments AS (
    SELECT 
        customer_id,
        order_count,
        total_spend,
        CASE 
            WHEN order_count > 1 THEN 'Repeat Customer' 
            ELSE 'One-Time Customer' 
        END AS buyer_type
    FROM customer_order_counts
)
SELECT 
    buyer_type,
    COUNT(*) AS total_customers,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM customer_segments), 1) AS customer_share_pct,
    ROUND(SUM(total_spend), 2) AS aggregate_revenue,
    ROUND(SUM(total_spend) * 100.0 / (SELECT SUM(total_spend) FROM customer_segments), 1) AS revenue_share_pct,
    ROUND(AVG(total_spend), 2) AS avg_spend_per_customer
FROM customer_segments
GROUP BY buyer_type;

-- 3. Customer Purchase Sequence using Window Functions
SELECT 
    f.order_id,
    c.customer_name,
    f.order_date,
    f.revenue,
    ROW_NUMBER() OVER (PARTITION BY f.customer_id ORDER BY f.order_date, f.order_id) AS purchase_sequence_num,
    LAG(f.order_date, 1) OVER (PARTITION BY f.customer_id ORDER BY f.order_date, f.order_id) AS previous_purchase_date
FROM fact_sales f
JOIN dim_customer c ON f.customer_id = c.customer_id
ORDER BY f.customer_id, purchase_sequence_num;
