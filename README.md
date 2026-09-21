# E-Commerce Sales Analytics
### SQL + Business Intelligence Portfolio Project

An interactive, portfolio-ready data analytics web application demonstrating practical competency across **SQL, automated data cleaning, star-schema relational modeling, exploratory data analysis (EDA), business intelligence, and Power BI-style dashboard development** using an e-commerce transaction dataset.

---

## 1. Project Overview & Business Objective

Modern e-commerce merchants require data-driven clarity into their revenue drivers, customer lifetime value (LTV), acquisition channel return-on-ad-spend (ROAS), and operations/returns metrics.

This project delivers an end-to-end analytical application that takes raw transaction logs through the complete enterprise data workflow:

```text
Upload Data → Data Validation → Data Cleaning → SQL Analysis → Data Modeling → KPI Analysis → Interactive Dashboard → Business Insights → Export Results
```

Every metric, visualization, and strategic insight is **dynamically calculated** from the dataset; nothing is hardcoded. If dataset columns vary, the application gracefully identifies available fields and flags missing dependencies.

---

## 2. Technical Stack

* **Application Layer**: React 19 + TypeScript / Streamlit
* **Data Processing**: Pandas, In-browser SQL (WebAssembly SQLite & Python SQLite3/DuckDB)
* **Visualizations**: Plotly / Recharts interactive charting engine
* **Database & SQL**: Relational normalization into Star Schema (`fact_sales`, `dim_customer`, `dim_product`, `dim_marketing`, `dim_date`)
* **Styling**: Power BI executive dashboard layout with Tailwind CSS
* **Calculations**: Dual SQL + Power BI DAX formula documentation

---

## 3. Repository Structure

```text
shopify-sales-analytics/
│
├── app.py                     # Streamlit web application entry point
├── requirements.txt           # Python dependency specifications
├── README.md                  # Project documentation & portfolio guide
├── data/
│   └── sample_shopify_sales.csv   # Synthetic multi-category transactions dataset
│
├── sql/
│   ├── 01_data_quality.sql     # Data profiling, duplicates & null checks
│   ├── 02_sales_analysis.sql   # MoM growth, running totals & KPIs
│   ├── 03_customer_analysis.sql# Top customers, repeat rates & sequence LAG
│   ├── 04_product_analysis.sql # Product ranking, return rates & discounts
│   └── 05_marketing_analysis.sql# Channel performance & CAC attribution
│
├── src/
│   ├── data_loader.py         # File ingestion & schema inference
│   ├── data_cleaning.py       # Power Query transformation pipeline
│   ├── database.py            # SQLite schema builder & SQL executor
│   ├── analytics.py           # KPIs, DAX definitions & automated insights
│   └── visualizations.py      # Plotly interactive chart generators
│
└── outputs/                   # Export directory for cleaned data & queries
```

---

## 4. Analytical Data Model (Star Schema)

The application models flat Shopify transaction records into an analytical Star Schema:

```text
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
```

* **`fact_sales`**: Granular transaction line items (revenue, quantity, discount, shipping, return status, rating).
* **`dim_customer`**: Customer master data (ID, name, country, geographic region).
* **`dim_product`**: Product catalog (ID, title, category, standard unit price).
* **`dim_marketing`**: Acquisition attribution (channel, payment processor).
* **`dim_date`**: Calendar date dimensional breakdown (year, quarter, month, day of week, weekend indicator).

---

## 5. SQL Capabilities Demonstrated

1. **Basic & Aggregations**: `SELECT`, `WHERE`, `DISTINCT`, `GROUP BY`, `HAVING`, `SUM`, `AVG`, `COUNT(DISTINCT ...)`.
2. **Relational Joins**: Multi-table `INNER JOIN` and `LEFT JOIN` operations across dimensional tables.
3. **Common Table Expressions (CTEs)**: Multi-stage pipeline analytics with `WITH ... AS (...)`.
4. **Window Functions**:
   * `ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date)` — purchase sequence.
   * `RANK()` and `DENSE_RANK()` — product and category revenue leaderboards.
   * `LAG()` and `LEAD()` — month-over-month (MoM) revenue shifts and repeat buy intervals.
   * `SUM() OVER (ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)` — running cumulative revenue.

---

## 6. Power BI & DAX Alignment

| Metric Name | Business Definition | SQL Implementation | DAX Equivalent |
|---|---|---|---|
| **Total Revenue** | Net recognized revenue | `SUM(revenue)` | `CALCULATE(SUM(fact_sales[revenue]), fact_sales[return_status] <> "Returned")` |
| **AOV** | Average order basket value | `SUM(revenue)/COUNT(DISTINCT order_id)` | `DIVIDE([Total Revenue], [Total Orders], 0)` |
| **Total Orders** | Count of unique checkouts | `COUNT(DISTINCT order_id)` | `DISTINCTCOUNT(fact_sales[order_id])` |
| **Return Rate %** | % orders returned | `100.0 * SUM(Returned) / COUNT(*)` | `DIVIDE(CALCULATE(COUNTROWS(), Return="Returned"), COUNTROWS())` |

---

## 7. How to Run Locally

### Option 1: Python Streamlit Application
```bash
git clone <repo-url>
cd shopify-sales-analytics
pip install -r requirements.txt
streamlit run app.py
```

### Option 2: Live Interactive Web Experience
Runs in any modern browser with WebAssembly SQLite, instant CSV upload/processing, and zero installation.

---

## 8. Portfolio Takeaways

This project demonstrates the core technical skills demanded of professional Data Analysts:
* Ingesting messy e-commerce logs and systematically cleansing data.
* Structuring raw records into scalable Star-Schema data warehouse entities.
* Formulating high-performance analytical SQL queries using window functions and CTEs.
* Translating executive business questions into clean Power BI-style dashboard layouts.
* Distinguishing between observed data, interpretation, and strategic recommendations.
