import streamlit as st
import pandas as pd
import numpy as np
import os
import io

from src.data_loader import load_csv_data, profile_dataset
from src.data_cleaning import clean_shopify_dataset
from src.database import AnalyticsDatabase
from src.analytics import calculate_kpis, generate_dynamic_insights, get_dax_measures_definitions
from src.visualizations import (
    plot_monthly_revenue,
    plot_category_revenue,
    plot_top_products,
    plot_channel_performance,
    plot_customer_distribution,
    plot_discount_vs_revenue
)

st.set_page_config(
    page_title="Shopify E-Commerce Sales Analytics",
    page_icon="🛍️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for Power BI / Executive aesthetic
st.markdown("""
<style>
    .kpi-card {
        background-color: #f8fafc;
        border-radius: 8px;
        padding: 16px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .kpi-title {
        font-size: 0.85rem;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .kpi-value {
        font-size: 1.8rem;
        font-weight: 700;
        color: #0f172a;
        margin-top: 4px;
    }
</style>
""", unsafe_allow_html=True)

# ----------------- SESSION STATE & DATA LOADING -----------------
if "db" not in st.session_state:
    st.session_state.db = AnalyticsDatabase()

if "raw_df" not in st.session_state:
    default_csv_path = "data/sample_shopify_sales.csv"
    if os.path.exists(default_csv_path):
        st.session_state.raw_df = load_csv_data(default_csv_path)
    else:
        st.session_state.raw_df = None

# Sidebar Navigation
st.sidebar.title("🛍️ Shopify Analytics")
st.sidebar.markdown("**Portfolio BI & SQL Workspace**")

menu = st.sidebar.radio(
    "Navigation Menu",
    [
        "📂 Data Upload",
        "🧹 Data Quality",
        "🗄️ Data Model",
        "💻 SQL Explorer",
        "📊 Executive Dashboard",
        "📈 Exploratory Analysis",
        "🎯 Customer Analysis",
        "🛍️ Product Analysis",
        "📣 Marketing Analysis",
        "📐 Measures & Logic",
        "💡 Business Insights",
        "🧠 SQL Interview Mode",
        "📘 Documentation"
    ]
)

# Ensure clean data is populated
if st.session_state.raw_df is not None:
    cleaning_res = clean_shopify_dataset(st.session_state.raw_df)
    clean_df = cleaning_res["clean_df"]
    st.session_state.db.load_data_model(clean_df)
else:
    clean_df = None

# ----------------- 1. DATA UPLOAD -----------------
if menu == "📂 Data Upload":
    st.title("Shopify E-Commerce Sales Analytics")
    st.subheader("SQL + Business Intelligence Portfolio Project")
    st.markdown("Upload any Shopify or E-Commerce CSV dataset to dynamically profile, clean, normalize, and analyze sales performance.")
    
    col1, col2 = st.columns([2, 1])
    with col1:
        uploaded_file = st.file_uploader("Upload Shopify Transactions CSV", type=["csv"])
        if uploaded_file is not None:
            st.session_state.raw_df = pd.read_csv(uploaded_file)
            st.success("Custom CSV uploaded and loaded successfully!")
            
    with col2:
        st.info("💡 **Sample Dataset Available**")
        if st.button("Reload Realistic Synthetic Dataset"):
            st.session_state.raw_df = load_csv_data("data/sample_shopify_sales.csv")
            st.rerun()

    if st.session_state.raw_df is not None:
        prof = profile_dataset(st.session_state.raw_df)
        st.markdown("---")
        st.markdown("### Dataset Summary & Health Overview")
        
        m1, m2, m3, m4 = st.columns(4)
        m1.metric("Total Rows", f"{prof['total_rows']:,}")
        m2.metric("Total Columns", f"{prof['total_columns']}")
        m3.metric("Duplicate Rows", f"{prof['duplicate_rows']:,}")
        m4.metric("Clean Data Quality Score", f"{cleaning_res['quality_score']}%")
        
        st.markdown("#### Column Profiling & Detected Data Types")
        st.dataframe(prof["column_profiles"], use_container_width=True)
        
        st.markdown("#### First 50 Rows Preview")
        st.dataframe(st.session_state.raw_df.head(50), use_container_width=True)

# ----------------- 2. DATA QUALITY -----------------
elif menu == "🧹 Data Quality":
    st.title("Data Quality & Preparation")
    st.markdown("Automated validation, structural cleansing, and Power Query-style transformation tracking.")
    
    if clean_df is None:
        st.warning("Please upload a dataset first.")
    else:
        q1, q2, q3 = st.columns(3)
        q1.metric("Raw Rows", f"{cleaning_res['raw_rows']:,}")
        q2.metric("Clean Rows", f"{cleaning_res['clean_rows']:,}")
        q3.metric("Calculated Quality Score", f"{cleaning_res['quality_score']}%")
        
        st.markdown("### Transformation Log (Power Query Workflow)")
        log_df = pd.DataFrame(cleaning_res["cleaning_log"])
        st.table(log_df)
        
        st.markdown("### Field Health Diagnostics")
        diagnostics = []
        for col in clean_df.columns:
            null_pct = round((clean_df[col].isnull().sum() / len(clean_df)) * 100, 2)
            issues = []
            if null_pct > 0:
                issues.append(f"{null_pct}% missing")
            if col == "revenue" and (clean_df[col] < 0).any():
                issues.append("Negative revenue")
            issue_str = ", ".join(issues) if issues else "Passed validation"
            diagnostics.append({
                "Column": col,
                "Data Type": str(clean_df[col].dtype),
                "Missing %": f"{null_pct}%",
                "Unique Values": clean_df[col].nunique(),
                "Validation Status": issue_str
            })
        st.dataframe(pd.DataFrame(diagnostics), use_container_width=True)

# ----------------- 3. DATA MODEL -----------------
elif menu == "🗄️ Data Model":
    st.title("Relational Star Schema Data Model")
    st.markdown("Demonstration of data warehousing principles: normalizing flat Shopify transaction logs into an analytical dimensional model.")
    
    st.code("""
                   ┌──────────────────┐
                   │   DIM_CUSTOMER   │
                   │ (customer_id PK) │
                   └─────────┬────────┘
                             │ 1
                             │
                             │ *
 ┌──────────────────┐        │        ┌──────────────────┐
 │   DIM_PRODUCT    │ *    ┌─┴─────┐ *│     DIM_DATE     │
 │  (product_id PK) ├──────┤ FACT_ ├──┤  (date_key PK)   │
 └──────────────────┘      │ SALES │  └──────────────────┘
                           └─┬─────┘
                             │ *
                             │ 1
                   ┌─────────┴────────┐
                   │  DIM_MARKETING   │
                   │  (order_id PK)   │
                   └──────────────────┘
    """, language="text")
    
    st.markdown("""
    ### Dimensional Architecture Rationale
    1. **Fact Table (`fact_sales`)**: Stores quantitative business events (revenue, quantity sold, discount applied, shipping costs, return outcomes).
    2. **Dimension Tables**:
       - `dim_customer`: Customer attributes, country, and regional grouping.
       - `dim_product`: Product catalog, naming, master category taxonomy, base price.
       - `dim_date`: Calendar rollups (Quarter, Month Name, Weekend flags).
       - `dim_marketing`: Attribution channel and transaction payment method.
    3. **Key Benefits**: Eliminates data redundancy, accelerates OLAP query speeds, and enables Star Schema filtering.
    """)

# ----------------- 4. SQL QUERY EXPLORER -----------------
elif menu == "💻 SQL Explorer":
    st.title("SQL Query Explorer & Schema Navigator")
    st.markdown("Write and execute analytical SQL queries against the live in-memory database.")
    
    col_schema, col_editor = st.columns([1, 2])
    
    with col_schema:
        st.markdown("### Database Schema")
        schema = st.session_state.db.get_schema()
        for tbl, cols in schema.items():
            with st.expander(f"📁 {tbl} ({len(cols)} cols)", expanded=(tbl == "fact_sales")):
                for c in cols:
                    st.text(f"  • {c}")
                    
    with col_editor:
        st.markdown("### SQL Editor")
        prebuilt = st.selectbox(
            "Select Prebuilt Analytical Query Template:",
            [
                "Custom Query",
                "1. Executive KPIs (Aggregations)",
                "2. Category Ranking & Revenue Share (Window Functions)",
                "3. Month-over-Month Revenue Growth (LAG)",
                "4. Customer Purchase Sequence (ROW_NUMBER)",
                "5. Star Schema JOIN (Sales + Products + Customers)"
            ]
        )
        
        default_query = "SELECT * FROM fact_sales LIMIT 10;"
        if prebuilt == "1. Executive KPIs (Aggregations)":
            default_query = "SELECT COUNT(DISTINCT order_id) AS orders, ROUND(SUM(revenue), 2) AS revenue, ROUND(AVG(revenue), 2) AS aov FROM fact_sales WHERE return_status != 'Returned';"
        elif prebuilt == "2. Category Ranking & Revenue Share (Window Functions)":
            default_query = """SELECT p.category, ROUND(SUM(f.revenue), 2) AS category_revenue,
RANK() OVER (ORDER BY SUM(f.revenue) DESC) as category_rank,
ROUND(100.0 * SUM(f.revenue) / SUM(SUM(f.revenue)) OVER(), 2) as revenue_share_pct
FROM fact_sales f
JOIN dim_product p ON f.product_id = p.product_id
WHERE f.return_status != 'Returned'
GROUP BY p.category ORDER BY category_revenue DESC;"""
        elif prebuilt == "3. Month-over-Month Revenue Growth (LAG)":
            default_query = """WITH monthly AS (
    SELECT STRFTIME('%Y-%m', order_date) as month, ROUND(SUM(revenue), 2) as revenue
    FROM fact_sales WHERE return_status != 'Returned'
    GROUP BY STRFTIME('%Y-%m', order_date)
)
SELECT month, revenue, LAG(revenue, 1) OVER (ORDER BY month) as prev_month_rev,
ROUND(100.0 * (revenue - LAG(revenue, 1) OVER (ORDER BY month)) / LAG(revenue, 1) OVER (ORDER BY month), 2) as mom_growth_pct
FROM monthly;"""
        elif prebuilt == "4. Customer Purchase Sequence (ROW_NUMBER)":
            default_query = """SELECT order_id, customer_id, order_date, revenue,
ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) as purchase_number
FROM fact_sales ORDER BY customer_id, purchase_number LIMIT 25;"""
        elif prebuilt == "5. Star Schema JOIN (Sales + Products + Customers)":
            default_query = """SELECT f.order_id, c.customer_name, c.country, p.product_name, p.category, f.revenue
FROM fact_sales f
JOIN dim_customer c ON f.customer_id = c.customer_id
JOIN dim_product p ON f.product_id = p.product_id
LIMIT 20;"""
            
        sql_input = st.text_area("SQL Statement", value=default_query, height=180)
        
        if st.button("▶ Run SQL Query"):
            res = st.session_state.db.execute_query(sql_input)
            if res["success"]:
                st.success(f"Execution completed in {res['execution_time_ms']} ms | Returned {res['rows_count']} rows")
                st.dataframe(res["df"], use_container_width=True)
                csv_bytes = res["df"].to_csv(index=False).encode("utf-8")
                st.download_button("📥 Download Results CSV", data=csv_bytes, file_name="query_results.csv", mime="text/csv")
            else:
                st.error(f"SQL Execution Error: {res['error']}")

# ----------------- 5. EXECUTIVE DASHBOARD -----------------
elif menu == "📊 Executive Dashboard":
    st.title("Executive Sales Dashboard")
    st.markdown("Interactive Power BI-inspired analytics dashboard with dynamic slicing.")
    
    if clean_df is None:
        st.warning("Please upload a dataset first.")
    else:
        # Dynamic Filter Bar
        st.sidebar.markdown("### 🎛️ Dashboard Slicers")
        
        # Category Filter
        categories = ["All Categories"] + sorted(clean_df["category"].dropna().unique().tolist()) if "category" in clean_df.columns else ["All"]
        selected_cat = st.sidebar.selectbox("Product Category", categories)
        
        # Country Filter
        countries = ["All Countries"] + sorted(clean_df["country"].dropna().unique().tolist()) if "country" in clean_df.columns else ["All"]
        selected_country = st.sidebar.selectbox("Country / Region", countries)
        
        # Channel Filter
        channels = ["All Channels"] + sorted(clean_df["acquisition_channel"].dropna().unique().tolist()) if "acquisition_channel" in clean_df.columns else ["All"]
        selected_channel = st.sidebar.selectbox("Acquisition Channel", channels)
        
        # Apply filters
        filtered_df = clean_df.copy()
        if selected_cat != "All Categories" and "category" in filtered_df.columns:
            filtered_df = filtered_df[filtered_df["category"] == selected_cat]
        if selected_country != "All Countries" and "country" in filtered_df.columns:
            filtered_df = filtered_df[filtered_df["country"] == selected_country]
        if selected_channel != "All Channels" and "acquisition_channel" in filtered_df.columns:
            filtered_df = filtered_df[filtered_df["acquisition_channel"] == selected_channel]
            
        kpis = calculate_kpis(filtered_df)
        
        # Top KPI Cards
        k1, k2, k3, k4, k5, k6 = st.columns(6)
        k1.metric("Total Revenue", f"${kpis['total_revenue']:,.2f}" if kpis['total_revenue'] else "N/A")
        k2.metric("Total Orders", f"{kpis['total_orders']:,}" if kpis['total_orders'] else "N/A")
        k3.metric("Unique Customers", f"{kpis['unique_customers']:,}" if kpis['unique_customers'] else "N/A")
        k4.metric("Average Order Value", f"${kpis['aov']:,.2f}" if kpis['aov'] else "N/A")
        k5.metric("Avg Discount Rate", f"{kpis['avg_discount_pct']}%" if kpis['avg_discount_pct'] else "N/A")
        k6.metric("Return Rate", f"{kpis['return_rate_pct']}%" if kpis['return_rate_pct'] else "N/A")
        
        st.markdown("---")
        
        c1, c2 = st.columns(2)
        with c1:
            fig_trend = plot_monthly_revenue(filtered_df)
            if fig_trend:
                st.plotly_chart(fig_trend, use_container_width=True)
            else:
                st.info("Monthly trend unavailable without date & revenue columns.")
                
        with c2:
            fig_cat = plot_category_revenue(filtered_df)
            if fig_cat:
                st.plotly_chart(fig_cat, use_container_width=True)
                
        c3, c4 = st.columns(2)
        with c3:
            fig_prod = plot_top_products(filtered_df, n=8)
            if fig_prod:
                st.plotly_chart(fig_prod, use_container_width=True)
                
        with c4:
            fig_chan = plot_channel_performance(filtered_df)
            if fig_chan:
                st.plotly_chart(fig_chan, use_container_width=True)

# ----------------- 6. EXPLORATORY ANALYSIS -----------------
elif menu == "📈 Exploratory Analysis":
    st.title("Exploratory Data Analysis (EDA)")
    if clean_df is None:
        st.warning("Please upload a dataset first.")
    else:
        st.markdown("### Univariate & Bivariate Distributions")
        col_eda1, col_eda2 = st.columns(2)
        with col_eda1:
            st.plotly_chart(plot_customer_distribution(clean_df), use_container_width=True)
        with col_eda2:
            st.plotly_chart(plot_discount_vs_revenue(clean_df), use_container_width=True)
            
        st.markdown("### Correlation Matrix (Numerical Attributes)")
        num_df = clean_df.select_dtypes(include=[np.number])
        if not num_df.empty and num_df.shape[1] > 1:
            corr = num_df.corr().round(2)
            st.dataframe(corr, use_container_width=True)
            st.caption("Note: Correlation measures linear co-movement; it does not establish causal dependency.")

# ----------------- 7. CUSTOMER ANALYSIS -----------------
elif menu == "🎯 Customer Analysis":
    st.title("Customer Analytics & Cohorts")
    if clean_df is None:
        st.warning("Please upload a dataset.")
    else:
        if "customer_id" in clean_df.columns and "revenue" in clean_df.columns:
            cust_summary = clean_df.groupby(["customer_id", "customer_name", "country"]).agg(
                orders=("order_id", "nunique"),
                total_spend=("revenue", "sum"),
                avg_basket=("revenue", "mean")
            ).reset_index().sort_values("total_spend", ascending=False)
            
            st.markdown("### Top 20 High-Value Customers (LTV)")
            st.dataframe(cust_summary.head(20), use_container_width=True)
        else:
            st.info("Customer analysis requires customer_id and revenue fields.")

# ----------------- 8. PRODUCT ANALYSIS -----------------
elif menu == "🛍️ Product Analysis":
    st.title("Product Performance & Returns")
    if clean_df is None:
        st.warning("Please upload a dataset.")
    else:
        if "product_name" in clean_df.columns and "revenue" in clean_df.columns:
            prod_summary = clean_df.groupby(["product_id", "product_name", "category"]).agg(
                units_sold=("quantity", "sum") if "quantity" in clean_df.columns else ("revenue", "count"),
                total_revenue=("revenue", "sum"),
                avg_rating=("rating", "mean") if "rating" in clean_df.columns else ("revenue", "count")
            ).reset_index().sort_values("total_revenue", ascending=False)
            
            st.markdown("### Product Catalog Performance")
            st.dataframe(prod_summary, use_container_width=True)

# ----------------- 9. MARKETING ANALYSIS -----------------
elif menu == "📣 Marketing Analysis":
    st.title("Marketing Acquisition & Channel Efficiency")
    if clean_df is None:
        st.warning("Please upload a dataset.")
    else:
        if "acquisition_channel" in clean_df.columns and "revenue" in clean_df.columns:
            chan_df = clean_df.groupby("acquisition_channel").agg(
                orders=("order_id", "nunique"),
                total_revenue=("revenue", "sum"),
                avg_order_value=("revenue", "mean")
            ).reset_index().sort_values("total_revenue", ascending=False)
            
            st.markdown("### Acquisition Channel Benchmarks")
            st.dataframe(chan_df, use_container_width=True)

# ----------------- 10. MEASURES & LOGIC -----------------
elif menu == "📐 Measures & Logic":
    st.title("Measures & Business Logic (SQL vs DAX)")
    st.markdown("Demonstrates translation between business stakeholder definitions, relational SQL implementations, and Power BI DAX formulas.")
    
    kpis = calculate_kpis(clean_df) if clean_df is not None else {}
    measures = get_dax_measures_definitions(kpis)
    
    for m in measures:
        with st.expander(f"📏 {m['name']} — Value: {m['calculated_value']}", expanded=True):
            st.markdown(f"**Business Definition:** {m['business_definition']}")
            c_sql, c_dax = st.columns(2)
            with c_sql:
                st.markdown("**SQL Equivalent:**")
                st.code(m["sql"], language="sql")
            with c_dax:
                st.markdown("**DAX Equivalent:**")
                st.code(m["dax"], language="sql")

# ----------------- 11. BUSINESS INSIGHTS -----------------
elif menu == "💡 Business Insights":
    st.title("Automated Dynamic Business Insights")
    st.markdown("Data-driven diagnostic observations, strategic interpretations, and suggested business investigations.")
    
    if clean_df is None:
        st.warning("Please upload a dataset first.")
    else:
        insights = generate_dynamic_insights(clean_df)
        for ins in insights:
            st.markdown(f"### 🔍 {ins['headline']}")
            st.caption(f"Pillar: {ins['pillar']}")
            b1, b2, b3 = st.columns(3)
            with b1:
                st.info(f"**Observed Data**\n\n{ins['observation']}")
            with b2:
                st.warning(f"**Interpretation**\n\n{ins['interpretation']}")
            with b3:
                st.success(f"**Suggested Investigation**\n\n{ins['recommendation']}")
            st.markdown("---")

# ----------------- 12. SQL INTERVIEW PRACTICE -----------------
elif menu == "🧠 SQL Interview Mode":
    st.title("SQL Technical Interview Practice")
    st.markdown("Interactive SQL challenge workspace built on the live Shopify database.")
    
    challenge = st.selectbox(
        "Choose Practice Question:",
        [
            "Q1 [Beginner]: Find all orders from United States with revenue > $100",
            "Q2 [Intermediate]: Calculate total revenue and order count per product category",
            "Q3 [Advanced]: Month-over-month revenue growth using window function LAG()"
        ]
    )
    
    if "Q1" in challenge:
        st.markdown("**Business Goal**: Retrieve `order_id`, `customer_name`, `revenue` from `fact_sales` where `country = 'United States'` and `revenue > 100`.")
        default_val = "SELECT order_id, customer_name, revenue FROM fact_sales WHERE country = 'United States' AND revenue > 100 LIMIT 10;"
    elif "Q2" in challenge:
        st.markdown("**Business Goal**: Group by `category`, calculating `COUNT(DISTINCT order_id)` as `orders` and `ROUND(SUM(revenue), 2)` as `total_revenue`, sorted descending.")
        default_val = "SELECT category, COUNT(DISTINCT order_id) AS orders, ROUND(SUM(revenue), 2) AS total_revenue FROM fact_sales GROUP BY category ORDER BY total_revenue DESC;"
    else:
        st.markdown("**Business Goal**: Use a CTE with `STRFTIME('%Y-%m', order_date)` and `LAG()` to calculate `prev_month_rev` and `growth_pct`.")
        default_val = """WITH monthly AS (
    SELECT STRFTIME('%Y-%m', order_date) AS month, ROUND(SUM(revenue), 2) AS revenue 
    FROM fact_sales GROUP BY STRFTIME('%Y-%m', order_date)
)
SELECT month, revenue, LAG(revenue, 1) OVER (ORDER BY month) AS prev_month_rev 
FROM monthly;"""
        
    user_query = st.text_area("Your SQL Solution:", value=default_val, height=140)
    if st.button("Submit & Test Query"):
        res = st.session_state.db.execute_query(user_query)
        if res["success"]:
            st.success(f"Query succeeded! Returned {res['rows_count']} rows in {res['execution_time_ms']} ms.")
            st.dataframe(res["df"].head(15), use_container_width=True)
        else:
            st.error(f"Syntax/Execution Error: {res['error']}")

# ----------------- 13. DOCUMENTATION -----------------
elif menu == "📘 Documentation":
    st.title("Project Architecture & Documentation")
    st.markdown("""
    ### Data Analyst Portfolio: End-to-End Methodology
    ```text
    Business Problem Definition 
           ↓
    Raw Data Ingestion & Profiling (Pandas)
           ↓
    Automated Data Quality & Cleansing (Power Query Pattern)
           ↓
    Relational Star-Schema Normalization (SQLite / DuckDB)
           ↓
    Exploratory Data Analysis (Plotly)
           ↓
    KPI & DAX Business Logic Formulation
           ↓
    Interactive Executive Dashboard (Power BI Styling)
           ↓
    Automated Diagnostic Insights & Strategic Recommendations
    ```
    """)
