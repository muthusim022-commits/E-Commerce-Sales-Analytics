import pandas as pd
import numpy as np

def clean_shopify_dataset(df: pd.DataFrame):
    """
    Executes a structured data cleaning and transformation pipeline.
    Returns:
        clean_df: pd.DataFrame
        cleaning_log: list of dicts detailing steps and results
        quality_score: dynamic calculation between 0 and 100
    """
    raw_row_count = len(df)
    clean_df = df.copy()
    cleaning_log = []
    
    # 1. Standardize column names (lowercase, stripped, underscore)
    original_cols = list(clean_df.columns)
    clean_df.columns = [c.strip().lower().replace(" ", "_").replace("-", "_") for c in clean_df.columns]
    cleaning_log.append({
        "step": "Standardize Column Names",
        "details": f"Standardized {len(clean_df.columns)} columns to snake_case format",
        "status": "Applied"
    })
    
    # 2. Trim string whitespace
    str_cols = clean_df.select_dtypes(include=["object"]).columns
    for c in str_cols:
        clean_df[c] = clean_df[c].astype(str).str.strip()
        # replace 'nan' string back to real NaN
        clean_df.loc[clean_df[c].isin(["nan", "None", "NULL", ""]), c] = np.nan
    cleaning_log.append({
        "step": "Trim String Whitespace",
        "details": f"Trimmed whitespace across {len(str_cols)} text fields and standardized empty values",
        "status": "Applied"
    })
    
    # 3. Handle exact duplicate rows
    dups = clean_df.duplicated().sum()
    if dups > 0:
        clean_df = clean_df.drop_duplicates().reset_index(drop=True)
        cleaning_log.append({
            "step": "Remove Exact Duplicate Rows",
            "details": f"Identified and removed {dups} duplicate records",
            "status": "Applied"
        })
    else:
        cleaning_log.append({
            "step": "Remove Exact Duplicate Rows",
            "details": "No exact duplicate rows detected",
            "status": "Skipped (clean)"
        })
        
    # 4. Convert date columns
    date_col = next((c for c in clean_df.columns if "date" in c or "time" in c), None)
    if date_col:
        try:
            clean_df[date_col] = pd.to_datetime(clean_df[date_col], errors="coerce")
            valid_dates = clean_df[date_col].notnull().sum()
            cleaning_log.append({
                "step": "Convert Date Fields",
                "details": f"Parsed '{date_col}' to datetime64 ({valid_dates}/{len(clean_df)} valid dates)",
                "status": "Applied"
            })
        except Exception as e:
            cleaning_log.append({
                "step": "Convert Date Fields",
                "details": f"Failed date conversion on {date_col}: {str(e)}",
                "status": "Warning"
            })
            
    # 5. Convert numeric fields & sanitize
    numeric_targets = ["revenue", "quantity", "unit_price", "discount", "shipping_cost", "rating"]
    for num_col in numeric_targets:
        if num_col in clean_df.columns:
            clean_df[num_col] = pd.to_numeric(clean_df[num_col], errors="coerce")
            
    # 6. Validate impossible numbers
    invalid_revenue = 0
    if "revenue" in clean_df.columns:
        invalid_revenue = (clean_df["revenue"] < 0).sum()
        clean_df.loc[clean_df["revenue"] < 0, "revenue"] = 0
        
    cleaning_log.append({
        "step": "Numeric Sanity Checks",
        "details": f"Sanitized numerical columns. Flagged {invalid_revenue} negative revenue entries.",
        "status": "Applied"
    })
    
    # 7. Calculate Dynamic Data Quality Score
    total_cells = clean_df.shape[0] * clean_df.shape[1]
    missing_cells = clean_df.isnull().sum().sum()
    completeness_ratio = (total_cells - missing_cells) / total_cells if total_cells > 0 else 1.0
    dedup_ratio = 1.0 - (dups / raw_row_count) if raw_row_count > 0 else 1.0
    
    # Weighted composite score
    quality_score = round((completeness_ratio * 0.70 + dedup_ratio * 0.30) * 100, 1)
    
    return {
        "raw_rows": raw_row_count,
        "clean_rows": len(clean_df),
        "clean_df": clean_df,
        "cleaning_log": cleaning_log,
        "quality_score": quality_score
    }
