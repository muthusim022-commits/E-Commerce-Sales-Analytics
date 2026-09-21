import pandas as pd
import numpy as np

def calculate_kpis(df: pd.DataFrame):
    """Dynamically computes core executive e-commerce metrics."""
    kpis = {}
    
    # 1. Total Revenue
    if "revenue" in df.columns:
        kpis["total_revenue"] = float(df["revenue"].sum())
    else:
        kpis["total_revenue"] = None
        
    # 2. Total Orders
    if "order_id" in df.columns:
        kpis["total_orders"] = int(df["order_id"].nunique())
    else:
        kpis["total_orders"] = len(df)
        
    # 3. Unique Customers
    if "customer_id" in df.columns:
        kpis["unique_customers"] = int(df["customer_id"].nunique())
    else:
        kpis["unique_customers"] = None
        
    # 4. Average Order Value (AOV)
    if kpis["total_revenue"] is not None and kpis["total_orders"] and kpis["total_orders"] > 0:
        kpis["aov"] = round(kpis["total_revenue"] / kpis["total_orders"], 2)
    else:
        kpis["aov"] = None
        
    # 5. Average Discount
    if "discount" in df.columns:
        kpis["avg_discount_pct"] = round(float(df["discount"].mean()) * 100, 2)
    else:
        kpis["avg_discount_pct"] = None
        
    # 6. Return Rate
    if "return_status" in df.columns:
        total = len(df)
        returned = (df["return_status"] == "Returned").sum()
        kpis["return_rate_pct"] = round((returned / total) * 100, 2) if total > 0 else 0.0
        kpis["returned_count"] = int(returned)
    else:
        kpis["return_rate_pct"] = None
        kpis["returned_count"] = None
        
    return kpis

def generate_dynamic_insights(df: pd.DataFrame):
    """
    Synthesizes data patterns into dynamic business insights.
    Never relies on hardcoded numbers or fixed names.
    """
    insights = []
    
    # Revenue & Category insight
    if "revenue" in df.columns and "category" in df.columns:
        cat_rev = df.groupby("category")["revenue"].sum().sort_values(ascending=False)
        total_rev = df["revenue"].sum()
        if len(cat_rev) > 0 and total_rev > 0:
            top_cat = cat_rev.index[0]
            top_cat_share = round((cat_rev.iloc[0] / total_rev) * 100, 1)
            insights.append({
                "pillar": "Revenue & Product Mix",
                "headline": f"{top_cat} Drives {top_cat_share}% of Total Revenue",
                "observation": f"Total revenue across all categories reached ${total_rev:,.2f}. The leading category is '{top_cat}' with ${cat_rev.iloc[0]:,.2f}.",
                "interpretation": f"High portfolio concentration in {top_cat} makes total topline revenue sensitive to shifts in this category's demand or supply chain.",
                "recommendation": f"Protect margins in {top_cat} while testing cross-sell bundles with complementary lines to reduce single-category dependency."
            })

    # Customer Pareto insight
    if "customer_id" in df.columns and "revenue" in df.columns:
        cust_spend = df.groupby("customer_id")["revenue"].sum().sort_values(ascending=False)
        total_cust = len(cust_spend)
        total_rev = cust_spend.sum()
        if total_cust >= 10 and total_rev > 0:
            top_10_pct_count = max(1, int(total_cust * 0.10))
            top_10_spend = cust_spend.iloc[:top_10_pct_count].sum()
            pareto_pct = round((top_10_spend / total_rev) * 100, 1)
            insights.append({
                "pillar": "Customer Concentration (LTV)",
                "headline": f"Top 10% of Customers Contribute {pareto_pct}% of Net Spend",
                "observation": f"Out of {total_cust:,} unique buyers, the top {top_10_pct_count} account for ${top_10_spend:,.2f} ({pareto_pct}%) of sales.",
                "interpretation": "A significant portion of your customer equity resides in high-frequency/high-ticket repeat buyers.",
                "recommendation": "Implement an automated VIP loyalty tier and early-access drop notifications to prevent churn among top decile patrons."
            })

    # Marketing Channel insight
    if "acquisition_channel" in df.columns and "revenue" in df.columns:
        chan_rev = df.groupby("acquisition_channel")["revenue"].agg(["sum", "count", "mean"]).sort_values(by="sum", ascending=False)
        if len(chan_rev) > 0:
            top_chan = chan_rev.index[0]
            top_chan_rev = chan_rev.iloc[0]["sum"]
            top_aov_chan = chan_rev["mean"].idxmax()
            insights.append({
                "pillar": "Marketing & Acquisition Efficiency",
                "headline": f"{top_chan} Leads Topline Volume; {top_aov_chan} Yields Highest Basket Size",
                "observation": f"The top revenue generator is '{top_chan}' (${top_chan_rev:,.2f} from {int(chan_rev.iloc[0]['count']):,} orders). Meanwhile, '{top_aov_chan}' achieves the highest average order value (${chan_rev.loc[top_aov_chan, 'mean']:,.2f}).",
                "interpretation": "Top-of-funnel reach and high-ticket customer qualification are coming from distinct acquisition channels.",
                "recommendation": "Review blended CAC across both channels. Allocate budget toward channels with superior ROAS and basket density."
            })

    # Returns & Operations insight
    if "return_status" in df.columns and "category" in df.columns:
        cat_ret = df.groupby("category").apply(lambda g: (g["return_status"] == "Returned").sum() / len(g) * 100).sort_values(ascending=False)
        if len(cat_ret) > 0:
            high_ret_cat = cat_ret.index[0]
            ret_pct = round(cat_ret.iloc[0], 1)
            insights.append({
                "pillar": "Operations & Reverse Logistics",
                "headline": f"Category '{high_ret_cat}' Experiences {ret_pct}% Return Rate",
                "observation": f"Returns are not uniformly distributed; '{high_ret_cat}' shows a return rate of {ret_pct}%, notably above standard e-commerce benchmarks.",
                "interpretation": "Disproportionate returns often point to size fit inaccuracies, sensory expectation mismatch, or inadequate pre-purchase product descriptions.",
                "recommendation": "Audit customer review verbatims on '{high_ret_cat}', enhance size charts or unboxing media, and review supplier QA."
            })

    return insights

def get_dax_measures_definitions(kpis: dict):
    """Returns Power BI DAX-style measures alongside SQL definitions."""
    return [
        {
            "name": "Total Revenue",
            "business_definition": "Sum of all realized sales revenue after applicable promotional discounts.",
            "sql": "SELECT ROUND(SUM(revenue), 2) FROM fact_sales WHERE return_status != 'Returned';",
            "dax": "Total Revenue = \nCALCULATE(\n    SUM(fact_sales[revenue]),\n    fact_sales[return_status] <> \"Returned\"\n)",
            "calculated_value": f"${kpis.get('total_revenue', 0):,.2f}" if kpis.get("total_revenue") is not None else "N/A"
        },
        {
            "name": "Average Order Value (AOV)",
            "business_definition": "Average net revenue realized per unique customer transaction.",
            "sql": "SELECT SUM(revenue) / COUNT(DISTINCT order_id) FROM fact_sales;",
            "dax": "Average Order Value = \nDIVIDE(\n    [Total Revenue],\n    DISTINCTCOUNT(fact_sales[order_id]),\n    0\n)",
            "calculated_value": f"${kpis.get('aov', 0):,.2f}" if kpis.get("aov") is not None else "N/A"
        },
        {
            "name": "Total Orders",
            "business_definition": "Total count of unique purchase orders placed across all channels.",
            "sql": "SELECT COUNT(DISTINCT order_id) FROM fact_sales;",
            "dax": "Total Orders = DISTINCTCOUNT(fact_sales[order_id])",
            "calculated_value": f"{kpis.get('total_orders', 0):,}" if kpis.get("total_orders") is not None else "N/A"
        },
        {
            "name": "Unique Customers",
            "business_definition": "Count of distinct paying customer identifiers.",
            "sql": "SELECT COUNT(DISTINCT customer_id) FROM fact_sales;",
            "dax": "Unique Customers = DISTINCTCOUNT(fact_sales[customer_id])",
            "calculated_value": f"{kpis.get('unique_customers', 0):,}" if kpis.get("unique_customers") is not None else "N/A"
        },
        {
            "name": "Return Rate %",
            "business_definition": "Percentage of transactions marked with return or refund status.",
            "sql": "SELECT 100.0 * SUM(CASE WHEN return_status = 'Returned' THEN 1 ELSE 0 END) / COUNT(*) FROM fact_sales;",
            "dax": "Return Rate % = \nDIVIDE(\n    CALCULATE(COUNTROWS(fact_sales), fact_sales[return_status] = \"Returned\"),\n    COUNTROWS(fact_sales),\n    0\n)",
            "calculated_value": f"{kpis.get('return_rate_pct', 0)}%" if kpis.get("return_rate_pct") is not None else "N/A"
        },
        {
            "name": "Average Discount Rate %",
            "business_definition": "Mean percentage discount applied across customer transactions.",
            "sql": "SELECT ROUND(AVG(discount) * 100, 2) FROM fact_sales;",
            "dax": "Avg Discount % = AVERAGE(fact_sales[discount])",
            "calculated_value": f"{kpis.get('avg_discount_pct', 0)}%" if kpis.get("avg_discount_pct") is not None else "N/A"
        }
    ]
