import sqlite3
import pandas as pd
import time

class AnalyticsDatabase:
    def __init__(self, db_path=":memory:"):
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        
    def load_data_model(self, df: pd.DataFrame):
        """
        Normalizes the cleaned flat dataframe into a Relational Star Schema:
        - fact_sales
        - dim_customer
        - dim_product
        - dim_marketing
        - dim_date
        """
        # Save raw cleaned table
        df.to_sql("fact_sales", self.conn, if_exists="replace", index=False)
        
        # 1. dim_customer
        cust_cols = [c for c in ["customer_id", "customer_name", "country", "region"] if c in df.columns]
        if cust_cols and "customer_id" in df.columns:
            dim_cust = df[cust_cols].drop_duplicates(subset=["customer_id"]).dropna(subset=["customer_id"])
            dim_cust.to_sql("dim_customer", self.conn, if_exists="replace", index=False)
            
        # 2. dim_product
        prod_cols = [c for c in ["product_id", "product_name", "category", "unit_price"] if c in df.columns]
        if prod_cols and "product_id" in df.columns:
            dim_prod = df[prod_cols].drop_duplicates(subset=["product_id"]).dropna(subset=["product_id"])
            dim_prod.to_sql("dim_product", self.conn, if_exists="replace", index=False)
            
        # 3. dim_marketing
        mkt_cols = [c for c in ["order_id", "acquisition_channel", "payment_method"] if c in df.columns]
        if mkt_cols and "order_id" in df.columns:
            dim_mkt = df[mkt_cols].drop_duplicates(subset=["order_id"]).dropna(subset=["order_id"])
            dim_mkt.to_sql("dim_marketing", self.conn, if_exists="replace", index=False)
            
        # 4. dim_date
        date_col = next((c for c in df.columns if "date" in c), None)
        if date_col and pd.api.types.is_datetime64_any_dtype(df[date_col]):
            dates = df[date_col].dropna().drop_duplicates()
            dim_date = pd.DataFrame({
                "date_key": dates.dt.strftime("%Y%m%d"),
                "full_date": dates.dt.strftime("%Y-%m-%d"),
                "year": dates.dt.year,
                "quarter": "Q" + dates.dt.quarter.astype(str),
                "month_num": dates.dt.month,
                "month_name": dates.dt.strftime("%B"),
                "day_of_week": dates.dt.strftime("%A"),
                "is_weekend": dates.dt.dayofweek.isin([5, 6]).astype(int)
            })
            dim_date.to_sql("dim_date", self.conn, if_exists="replace", index=False)

    def get_schema(self):
        """Returns tables and their columns in a nested dict."""
        cursor = self.conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
        tables = [row[0] for row in cursor.fetchall()]
        
        schema = {}
        for tbl in tables:
            cursor.execute(f"PRAGMA table_info({tbl});")
            schema[tbl] = [row[1] for row in cursor.fetchall()]
        return schema

    def execute_query(self, sql: str):
        """
        Executes SQL query, measuring time and handling errors gracefully.
        Returns dict with df, execution_time_ms, rows, and error (if any).
        """
        start = time.perf_counter()
        try:
            result_df = pd.read_sql_query(sql, self.conn)
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
            return {
                "success": True,
                "df": result_df,
                "execution_time_ms": elapsed_ms,
                "rows_count": len(result_df),
                "error": None
            }
        except Exception as e:
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
            return {
                "success": False,
                "df": pd.DataFrame(),
                "execution_time_ms": elapsed_ms,
                "rows_count": 0,
                "error": str(e)
            }
