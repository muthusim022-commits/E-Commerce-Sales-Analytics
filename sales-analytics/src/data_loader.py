import pandas as pd
import io

def load_csv_data(file_or_path):
    """
    Loads CSV dataset and performs initial column type profiling.
    Supports both file path string and uploaded file buffer (Streamlit).
    """
    if isinstance(file_or_path, str):
        df = pd.read_csv(file_or_path)
    else:
        df = pd.read_csv(file_or_path)
    return df

def profile_dataset(df: pd.DataFrame):
    """
    Inspects dataset to determine column data types, missing percentages,
    unique value counts, duplicate rows, and statistical ranges.
    """
    total_rows = len(df)
    total_cols = len(df.columns)
    duplicate_count = int(df.duplicated().sum())
    
    col_profiles = []
    for col in df.columns:
        null_count = int(df[col].isnull().sum())
        null_pct = round((null_count / total_rows) * 100.0, 2) if total_rows > 0 else 0
        unique_cnt = int(df[col].nunique())
        dtype_str = str(df[col].dtype)
        
        # Detect inferred semantic type
        inferred = "categorical"
        if pd.api.types.is_numeric_dtype(df[col]):
            inferred = "numeric"
        elif pd.api.types.is_datetime64_any_dtype(df[col]) or "date" in col.lower():
            inferred = "date"
        elif "id" in col.lower() or "code" in col.lower():
            inferred = "identifier"
            
        col_profiles.append({
            "column": col,
            "data_type": dtype_str,
            "inferred_type": inferred,
            "missing_count": null_count,
            "missing_pct": null_pct,
            "unique_values": unique_cnt
        })
        
    profile_df = pd.DataFrame(col_profiles)
    return {
        "total_rows": total_rows,
        "total_columns": total_cols,
        "duplicate_rows": duplicate_count,
        "column_profiles": profile_df
    }
