import streamlit as st
import pandas as pd
import numpy as np
import os
import io

from src.python_pkg.data_loader import load_csv_data, profile_dataset
from src.python_pkg.data_cleaning import clean_shopify_dataset
from src.python_pkg.database import AnalyticsDatabase
from src.python_pkg.analytics import calculate_kpis, generate_dynamic_insights, get_dax_measures_definitions
from src.python_pkg.visualizations import (
    plot_monthly_revenue,
    plot_category_revenue,
    plot_top_products,
    plot_channel_performance,
    plot_customer_distribution,
    plot_discount_vs_revenue
)

# This wrapper allows running streamlit run app.py from root
with open("sales-analytics/app.py") as f:
    code = f.read()
    exec(code)
