import plotly.express as px
import plotly.graph_objects as go
import pandas as pd

def plot_monthly_revenue(df: pd.DataFrame):
    """Monthly revenue line chart."""
    if "order_date" not in df.columns or "revenue" not in df.columns:
        return None
    
    temp = df.copy()
    temp["month"] = pd.to_datetime(temp["order_date"]).dt.strftime("%Y-%m")
    monthly = temp.groupby("month")["revenue"].sum().reset_index()
    
    fig = px.line(
        monthly,
        x="month",
        y="revenue",
        title="Revenue by Month ($ USD)",
        markers=True,
        labels={"revenue": "Revenue ($)", "month": "Billing Month"},
        color_discrete_sequence=["#2563eb"]
    )
    fig.update_layout(template="plotly_white", margin=dict(l=20, r=20, t=40, b=20))
    return fig

def plot_category_revenue(df: pd.DataFrame):
    """Category performance bar chart."""
    if "category" not in df.columns or "revenue" not in df.columns:
        return None
        
    cat_rev = df.groupby("category")["revenue"].sum().reset_index().sort_values("revenue", ascending=False)
    fig = px.bar(
        cat_rev,
        x="category",
        y="revenue",
        title="Revenue by Product Category ($)",
        labels={"revenue": "Total Revenue ($)", "category": "Product Line"},
        color="revenue",
        color_continuous_scale="Blues"
    )
    fig.update_layout(template="plotly_white", margin=dict(l=20, r=20, t=40, b=20))
    return fig

def plot_top_products(df: pd.DataFrame, n=10):
    """Horizontal bar chart for top N products."""
    if "product_name" not in df.columns or "revenue" not in df.columns:
        return None
        
    top_p = df.groupby("product_name")["revenue"].sum().reset_index().sort_values("revenue", ascending=True).tail(n)
    fig = px.bar(
        top_p,
        y="product_name",
        x="revenue",
        orientation="h",
        title=f"Top {n} Products by Net Revenue",
        labels={"revenue": "Revenue ($)", "product_name": "Product"},
        color_discrete_sequence=["#0d9488"]
    )
    fig.update_layout(template="plotly_white", margin=dict(l=20, r=20, t=40, b=20))
    return fig

def plot_channel_performance(df: pd.DataFrame):
    """Acquisition channel revenue bar chart."""
    if "acquisition_channel" not in df.columns or "revenue" not in df.columns:
        return None
        
    chan = df.groupby("acquisition_channel")["revenue"].sum().reset_index().sort_values("revenue", ascending=False)
    fig = px.bar(
        chan,
        x="acquisition_channel",
        y="revenue",
        title="Revenue by Acquisition Channel ($)",
        labels={"revenue": "Revenue ($)", "acquisition_channel": "Channel"},
        color_discrete_sequence=["#4f46e5"]
    )
    fig.update_layout(template="plotly_white", margin=dict(l=20, r=20, t=40, b=20))
    return fig

def plot_customer_distribution(df: pd.DataFrame):
    """Customer spend histogram."""
    if "customer_id" not in df.columns or "revenue" not in df.columns:
        return None
        
    cust_spend = df.groupby("customer_id")["revenue"].sum().reset_index()
    fig = px.histogram(
        cust_spend,
        x="revenue",
        nbins=25,
        title="Customer Lifetime Value Distribution",
        labels={"revenue": "Total Spend per Customer ($)"},
        color_discrete_sequence=["#3b82f6"]
    )
    fig.update_layout(template="plotly_white", margin=dict(l=20, r=20, t=40, b=20))
    return fig

def plot_discount_vs_revenue(df: pd.DataFrame):
    """Scatter or binned bar of discount vs revenue."""
    if "discount" not in df.columns or "revenue" not in df.columns:
        return None
        
    fig = px.scatter(
        df,
        x="discount",
        y="revenue",
        color="category" if "category" in df.columns else None,
        title="Discount Rate vs Order Revenue",
        labels={"discount": "Discount Rate (0.0 to 1.0)", "revenue": "Order Revenue ($)"},
        opacity=0.7
    )
    fig.update_layout(template="plotly_white", margin=dict(l=20, r=20, t=40, b=20))
    return fig
