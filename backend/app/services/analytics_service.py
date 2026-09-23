import io
import json
import re
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from app.ai.llm import llm_provider
from app.utils.logging import logger

ID_KEYWORDS = ["id", "uuid", "index", "sku", "serial", "zip", "postal", "code", "phone", "unnamed", "mrn", "patient_id", "emp_id", "order_id", "txn_id"]
TEMPORAL_NUM_KEYWORDS = ["year", "month", "day", "zip", "postal", "code", "id", "year_built", "phone"]

class AnalyticsService:
    @staticmethod
    def load_dataframe(filename: str, content_bytes: bytes) -> pd.DataFrame:
        """Parses CSV, XLSX, XLS, or JSON bytes into a pandas DataFrame with multi-encoding and delimiter fallback."""
        if not content_bytes:
            raise ValueError("File content is empty.")

        content_bytes = content_bytes.replace(b"\x00", b"")

        fn_lower = filename.lower()
        bio = io.BytesIO(content_bytes)

        if fn_lower.endswith(".csv") or not (fn_lower.endswith((".xlsx", ".xls", ".json"))):
            df = None
            encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252", "iso-8859-1"]
            delimiters = [",", ";", "\t", "|"]

            for enc in encodings:
                for sep in delimiters:
                    bio.seek(0)
                    try:
                        temp_df = pd.read_csv(bio, encoding=enc, sep=sep, on_bad_lines="skip")
                        if temp_df.shape[1] > 1 or sep == ",":
                            df = temp_df
                            break
                    except Exception:
                        continue
                if df is not None:
                    break

            if df is None:
                bio.seek(0)
                df = pd.read_csv(bio, encoding="latin-1", on_bad_lines="skip")
        elif fn_lower.endswith((".xlsx", ".xls")):
            df = pd.read_excel(bio)
        elif fn_lower.endswith(".json"):
            df = pd.read_json(bio)
        else:
            bio.seek(0)
            df = pd.read_csv(bio, on_bad_lines="skip")

        if df.empty:
            raise ValueError("Parsed dataset contains 0 rows.")

        clean_cols = []
        seen_cols = {}
        for col in df.columns:
            c_name = re.sub(r'[^\w\s\-\_]', '', str(col)).strip()
            if not c_name:
                c_name = "Unnamed"
            if c_name in seen_cols:
                seen_cols[c_name] += 1
                c_name = f"{c_name}_{seen_cols[c_name]}"
            else:
                seen_cols[c_name] = 1
            clean_cols.append(c_name)

        df.columns = clean_cols
        return df

    @staticmethod
    def is_id_column(col_name: str, unique_cnt: int, total_rows: int) -> bool:
        """Determines if a column is an ID, index, or high-cardinality non-dimensional key."""
        col_lower = col_name.lower()
        if any(k in col_lower for k in ID_KEYWORDS):
            return True
        if total_rows > 20 and unique_cnt > 50 and (unique_cnt / total_rows) > 0.6:
            return True
        return False

    @staticmethod
    def profile_dataset(df: pd.DataFrame) -> Dict[str, Any]:
        """Calculates automatic schema detection, statistical profiling, and preview rows."""
        row_count, col_count = df.shape

        columns_schema = []
        summary_stats = {"numerical": {}, "categorical": {}}

        for col in df.columns:
            dtype_str = str(df[col].dtype)
            null_cnt = int(df[col].isnull().sum())
            unique_cnt = int(df[col].nunique())
            is_id = AnalyticsService.is_id_column(col, unique_cnt, row_count)

            if pd.api.types.is_numeric_dtype(df[col]) and not is_id:
                col_type = "numeric"
                s = df[col].dropna()
                if len(s) > 0:
                    summary_stats["numerical"][col] = {
                        "min": float(s.min()) if not np.isnan(s.min()) else 0,
                        "max": float(s.max()) if not np.isnan(s.max()) else 0,
                        "mean": round(float(s.mean()), 2) if not np.isnan(s.mean()) else 0,
                        "std": round(float(s.std()), 2) if len(s) > 1 and not np.isnan(s.std()) else 0,
                        "sum": round(float(s.sum()), 2) if not np.isnan(s.sum()) else 0,
                    }
            elif pd.api.types.is_datetime64_any_dtype(df[col]) or any(k in col.lower() for k in ["date", "month", "year", "time", "admission", "discharge", "hire", "booking", "created"]):
                col_type = "datetime"
            elif is_id:
                col_type = "id"
            else:
                col_type = "categorical"
                top_val = df[col].mode().iloc[0] if not df[col].mode().empty else None
                summary_stats["categorical"][col] = {
                    "top": str(top_val) if top_val is not None else "N/A",
                    "unique_count": unique_cnt
                }

            samples = [str(x) for x in df[col].dropna().head(3).tolist()]

            columns_schema.append({
                "name": col,
                "type": col_type,
                "raw_dtype": dtype_str,
                "null_count": null_cnt,
                "null_pct": round((null_cnt / max(1, row_count)) * 100, 1),
                "unique_count": unique_cnt,
                "samples": samples
            })

        preview_df = df.head(100).replace([np.inf, -np.inf, np.nan], None)
        preview_records = []
        for row in preview_df.to_dict(orient="records"):
            clean_row = {}
            for k, v in row.items():
                if isinstance(v, (pd.Timestamp, pd.Timedelta)):
                    clean_row[k] = str(v)
                elif isinstance(v, float) and (np.isnan(v) or np.isinf(v)):
                    clean_row[k] = None
                else:
                    clean_row[k] = v
            preview_records.append(clean_row)

        return {
            "row_count": row_count,
            "column_count": col_count,
            "columns": columns_schema,
            "summary_stats": summary_stats,
            "preview_records": preview_records
        }

    @staticmethod
    def generate_chart_payload(df: pd.DataFrame, x_col: str, y_col: Optional[str] = None, agg_func: str = "sum") -> List[Dict[str, Any]]:
        """Aggregates DataFrame into a clean JSON series array for Recharts components."""
        if x_col not in df.columns:
            return []

        if y_col and y_col in df.columns and pd.api.types.is_numeric_dtype(df[y_col]):
            if agg_func in ["avg", "mean"]:
                grouped = df.groupby(x_col)[y_col].mean().reset_index()
            elif agg_func == "count":
                grouped = df.groupby(x_col)[y_col].count().reset_index()
            elif agg_func == "min":
                grouped = df.groupby(x_col)[y_col].min().reset_index()
            elif agg_func == "max":
                grouped = df.groupby(x_col)[y_col].max().reset_index()
            else:
                grouped = df.groupby(x_col)[y_col].sum().reset_index()

            grouped[y_col] = grouped[y_col].round(2)
            grouped.columns = ["name", "value"]
        else:
            grouped = df[x_col].value_counts().reset_index()
            grouped.columns = ["name", "value"]

        grouped = grouped.sort_values(by="value", ascending=False).head(20)
        grouped = grouped.replace([np.inf, -np.inf, np.nan], 0)
        grouped["name"] = grouped["name"].astype(str)
        return grouped.to_dict(orient="records")

    @staticmethod
    def generate_multi_page_dashboard(df: pd.DataFrame) -> Dict[str, Any]:
        """Dynamically generates Power BI multi-page dashboard structure supporting Healthcare, Finance, HR, Real Estate, Education, SaaS, Logistics, Gaming, Agriculture, and Manufacturing domains."""
        profile = AnalyticsService.profile_dataset(df)
        cols = profile["columns"]

        num_cols = [c["name"] for c in cols if c["type"] == "numeric" and not any(k in c["name"].lower() for k in TEMPORAL_NUM_KEYWORDS)]
        if not num_cols:
            num_cols = [c["name"] for c in cols if c["type"] == "numeric"]

        cat_cols = [c["name"] for c in cols if c["type"] == "categorical" and c["unique_count"] <= 40]
        date_cols = [c["name"] for c in cols if c["type"] == "datetime"]

        NUMERICAL_KEYWORDS = [
            "bill", "amount", "cost", "charge", "fee", "sales", "revenue", "price", "stock", "profit",
            "stay", "age", "val", "total", "income", "salary", "wage", "bonus", "gpa", "score", "marks",
            "freight", "spend", "budget", "mrr", "arr", "rent", "sqft", "views", "clicks", "points",
            "mileage", "rating", "volume", "yield", "hours", "playtime", "harvest", "cost_usd"
        ]

        VOLUME_KEYWORDS = [
            "patient", "visit", "admission", "case", "bed", "count", "qty", "quantity", "unit", "volume",
            "stock", "headcount", "employee", "candidate", "student", "enrollment", "shipment", "parcel",
            "conversions", "orders", "bookings", "users", "active_users", "leads", "impressions"
        ]

        CATEGORY_KEYWORDS = [
            "department", "diagnosis", "condition", "treatment", "doctor", "specialty", "category", "type",
            "group", "product", "role", "major", "subject", "course", "property_type", "genre", "genre_title",
            "carrier", "platform", "campaign", "channel", "crop_type", "tier", "plan", "model", "make"
        ]

        STATUS_KEYWORDS = [
            "outcome", "admission_type", "discharge", "insurance", "provider", "status", "gender", "fulfil",
            "payment_method", "delivery_status", "tier", "subscription", "result"
        ]

        REGION_KEYWORDS = [
            "hospital", "branch", "ward", "room", "city", "state", "country", "region", "location",
            "locality", "destination", "origin", "plant", "site", "university", "college", "dealership"
        ]

        SIZE_KEYWORDS = [
            "severity", "stage", "blood", "room_type", "size", "class", "color", "level", "bedrooms",
            "bathrooms", "rating", "rank", "priority", "grade", "trim", "season"
        ]

        best_num = next((c for c in num_cols if any(k in c.lower() for k in NUMERICAL_KEYWORDS)), None) or (num_cols[0] if num_cols else None)
        qty_num = next((c for c in num_cols if any(k in c.lower() for k in VOLUME_KEYWORDS)), None)
        cat_primary = next((c for c in cat_cols if any(k in c.lower() for k in CATEGORY_KEYWORDS)), None) or (cat_cols[0] if cat_cols else None)
        status_col = next((c for c in cat_cols if any(k in c.lower() for k in STATUS_KEYWORDS)), None)
        region_col = next((c for c in cat_cols if any(k in c.lower() for k in REGION_KEYWORDS)), None)
        size_col = next((c for c in cat_cols if any(k in c.lower() for k in SIZE_KEYWORDS)), None)

        pages = []

        # --- PAGE 1: Executive Overview ---
        page1_title = f"{best_num or 'Executive'} Overview"
        exec_kpis = []
        if best_num:
            exec_kpis.append({
                "id": "kpi_exec_1", "chartType": "kpi", "title": f"Total {best_num}",
                "xAxisColumn": "", "yAxisColumn": best_num, "aggregate": "sum",
                "insight": f"Gross total {best_num} across dataset records.",
                "data": [{"name": f"Total {best_num}", "value": round(float(df[best_num].sum()), 2)}]
            })
        if qty_num and qty_num != best_num:
            exec_kpis.append({
                "id": "kpi_exec_2", "chartType": "kpi", "title": f"Total {qty_num}",
                "xAxisColumn": "", "yAxisColumn": qty_num, "aggregate": "sum",
                "insight": f"Cumulative count of {qty_num}.",
                "data": [{"name": f"Total {qty_num}", "value": round(float(df[qty_num].sum()), 2)}]
            })
        if best_num:
            exec_kpis.append({
                "id": "kpi_exec_3", "chartType": "kpi", "title": f"Average {best_num}",
                "xAxisColumn": "", "yAxisColumn": best_num, "aggregate": "avg",
                "insight": f"Mean value for {best_num}.",
                "data": [{"name": f"Avg {best_num}", "value": round(float(df[best_num].mean()), 2)}]
            })

        exec_charts = []
        if cat_primary:
            exec_charts.append({
                "id": "chart_exec_1", "chartType": "bar", "title": f"{best_num or 'Distribution'} by {cat_primary}",
                "xAxisColumn": cat_primary, "yAxisColumn": best_num or "Count", "aggregate": "sum" if best_num else "count",
                "insight": f"Primary distribution across {cat_primary}.",
                "data": AnalyticsService.generate_chart_payload(df, cat_primary, best_num, "sum" if best_num else "count")
            })
        if size_col or (len(cat_cols) > 1 and cat_cols[1] != cat_primary):
            sec_cat = size_col or cat_cols[1]
            exec_charts.append({
                "id": "chart_exec_2", "chartType": "pie", "title": f"Share Distribution by {sec_cat}",
                "xAxisColumn": sec_cat, "yAxisColumn": best_num or "Count", "aggregate": "sum" if best_num else "count",
                "insight": f"Percentage breakdown across {sec_cat}.",
                "data": AnalyticsService.generate_chart_payload(df, sec_cat, best_num, "sum" if best_num else "count")
            })

        pages.append({
            "id": "overview",
            "title": page1_title,
            "icon": "BarChart3",
            "description": f"High-level metrics and summary for {best_num or 'dataset'}.",
            "kpis": exec_kpis,
            "charts": exec_charts
        })

        # --- PAGE 2: Performance & Metrics ---
        perf_dim = region_col or (date_cols[0] if date_cols else (cat_cols[1] if len(cat_cols) > 1 else cat_primary))
        if perf_dim:
            page2_title = f"{perf_dim} Performance"
            perf_charts = []
            perf_charts.append({
                "id": "chart_perf_1",
                "chartType": "horizontal_bar" if region_col else "bar",
                "title": f"Top Performance by {perf_dim}",
                "xAxisColumn": perf_dim,
                "yAxisColumn": best_num or "Count",
                "aggregate": "sum" if best_num else "count",
                "insight": f"Ranked breakdown across {perf_dim}.",
                "data": AnalyticsService.generate_chart_payload(df, perf_dim, best_num, "sum" if best_num else "count")
            })
            if len(num_cols) > 1 and cat_primary:
                sec_num = num_cols[1]
                perf_charts.append({
                    "id": "chart_perf_2", "chartType": "line", "title": f"Average {sec_num} by {cat_primary}",
                    "xAxisColumn": cat_primary, "yAxisColumn": sec_num, "aggregate": "avg",
                    "insight": f"Average {sec_num} comparison grouped by {cat_primary}.",
                    "data": AnalyticsService.generate_chart_payload(df, cat_primary, sec_num, "avg")
                })
            elif cat_primary and best_num:
                perf_charts.append({
                    "id": "chart_perf_2", "chartType": "area", "title": f"Cumulative {best_num} by {cat_primary}",
                    "xAxisColumn": cat_primary, "yAxisColumn": best_num, "aggregate": "sum",
                    "insight": f"Cumulative concentration across {cat_primary}.",
                    "data": AnalyticsService.generate_chart_payload(df, cat_primary, best_num, "sum")
                })

            pages.append({
                "id": "performance",
                "title": page2_title,
                "icon": "TrendingUp",
                "description": f"Detailed performance metrics across {perf_dim}.",
                "kpis": [],
                "charts": perf_charts
            })

        # --- PAGE 3: Segmentation & Outcomes ---
        seg_dim = status_col or size_col or (cat_cols[2] if len(cat_cols) > 2 else cat_cols[0] if cat_cols else None)
        if seg_dim and seg_dim != perf_dim:
            page3_title = f"{seg_dim} Segmentation"
            seg_charts = []
            seg_charts.append({
                "id": "chart_seg_1", "chartType": "pie", "title": f"Proportional Share by {seg_dim}",
                "xAxisColumn": seg_dim, "yAxisColumn": best_num or "Count", "aggregate": "sum" if best_num else "count",
                "insight": f"Share breakdown across {seg_dim}.",
                "data": AnalyticsService.generate_chart_payload(df, seg_dim, best_num, "sum" if best_num else "count")
            })
            pages.append({
                "id": "segmentation",
                "title": page3_title,
                "icon": "Users",
                "description": f"Segmentation analysis for {seg_dim}.",
                "kpis": [],
                "charts": seg_charts
            })

        # --- PAGE 4: Category & Variant Breakdown ---
        prod_dim = size_col or (cat_cols[-1] if cat_cols else None)
        if prod_dim and prod_dim not in [perf_dim, seg_dim]:
            page4_title = f"{cat_primary or 'Category'} & {prod_dim} Breakdown"
            prod_charts = []
            prod_charts.append({
                "id": "chart_prod_1", "chartType": "bar", "title": f"{best_num or 'Volume'} by {prod_dim}",
                "xAxisColumn": prod_dim, "yAxisColumn": best_num or "Count", "aggregate": "sum" if best_num else "count",
                "insight": f"Breakdown by {prod_dim}.",
                "data": AnalyticsService.generate_chart_payload(df, prod_dim, best_num, "sum" if best_num else "count")
            })
            pages.append({
                "id": "products",
                "title": page4_title,
                "icon": "Layers",
                "description": f"Detailed breakdown across {prod_dim}.",
                "kpis": [],
                "charts": prod_charts
            })

        # --- PAGE 5: Data Explorer ---
        page5_title = f"Data Explorer ({profile['row_count']:,} Rows)"
        pages.append({
            "id": "explorer",
            "title": page5_title,
            "icon": "Database",
            "description": f"Full interactive data grid for {profile['row_count']:,} records.",
            "kpis": [],
            "charts": []
        })

        return {
            "is_rich": True,
            "page_count": len(pages),
            "pages": pages
        }

    @staticmethod
    async def process_ai_query(df: pd.DataFrame, user_query: str) -> Dict[str, Any]:
        """Interprets natural language prompt with synonym mapping, preventing Year/ID selection on Y-axis."""
        profile = AnalyticsService.profile_dataset(df)
        cols = profile["columns"]

        valid_cols = [c for c in cols if c["type"] != "id"]
        num_cols = [c['name'] for c in valid_cols if c['type'] == "numeric" and not any(k in c['name'].lower() for k in TEMPORAL_NUM_KEYWORDS)]
        if not num_cols:
            num_cols = [c['name'] for c in valid_cols if c['type'] == "numeric"]

        cat_cols = [c['name'] for c in valid_cols if c['type'] in ["categorical", "datetime"]]

        q_lower = user_query.lower()

        matched_x = None
        matched_y = None
        agg_func = "sum"
        chart_type = "bar"

        if "pie" in q_lower or "share" in q_lower or "donut" in q_lower:
            chart_type = "pie"
        elif "line" in q_lower or "trend" in q_lower or "growth" in q_lower or "over time" in q_lower:
            chart_type = "line"
        elif "area" in q_lower:
            chart_type = "area"
        elif "horizontal" in q_lower:
            chart_type = "horizontal_bar"

        if "avg" in q_lower or "average" in q_lower or "mean" in q_lower:
            agg_func = "avg"
        elif "count" in q_lower or "number of" in q_lower or "frequency" in q_lower:
            agg_func = "count"

        if any(k in q_lower for k in ["city", "location", "region", "state", "country"]):
            matched_x = next((c['name'] for c in valid_cols if any(k in c['name'].lower() for k in ["city", "state", "region", "country", "location", "branch"])), None)
        elif any(k in q_lower for k in ["category", "type", "group", "item"]):
            matched_x = next((c['name'] for c in valid_cols if any(k in c['name'].lower() for k in ["category", "type", "group", "item", "department"])), None)

        if not matched_x:
            for c in valid_cols:
                if c['name'].lower() in q_lower and c['type'] in ["categorical", "datetime"]:
                    matched_x = c['name']
                    break

        if not matched_x and cat_cols:
            matched_x = cat_cols[0]

        if any(k in q_lower for k in ["sales", "revenue", "amount", "price", "profit", "cost", "total", "billing"]):
            matched_y = next((c['name'] for c in valid_cols if any(k in c['name'].lower() for k in ["sales", "amount", "revenue", "price", "profit", "cost", "bill", "val", "total"])), None)
        elif any(k in q_lower for k in ["qty", "quantity", "volume", "stock", "count", "units"]):
            matched_y = next((c['name'] for c in valid_cols if any(k in c['name'].lower() for k in ["qty", "quantity", "stock", "unit", "volume", "count"])), None)

        if not matched_y:
            for c in valid_cols:
                c_name = c['name']
                if c_name.lower() in q_lower and c['type'] == "numeric" and not any(k in c_name.lower() for k in TEMPORAL_NUM_KEYWORDS):
                    matched_y = c_name
                    break

        if not matched_y and num_cols:
            matched_y = num_cols[0]

        title = f"{matched_y or 'Record Count'} by {matched_x or 'Category'}"
        insight = f"Dynamic AI query response showing {title} based on {profile['row_count']} dataset records."

        chart_data = AnalyticsService.generate_chart_payload(df, matched_x or valid_cols[0]['name'], matched_y, agg_func)

        return {
            "chartType": chart_type,
            "title": title,
            "xAxisColumn": matched_x or valid_cols[0]['name'],
            "yAxisColumn": matched_y or "Record Count",
            "aggregate": agg_func,
            "insight": insight,
            "data": chart_data
        }
