import json
import pandas as pd
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.analytics import AnalyticsDataset, AnalyticsDashboard
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/v1/analytics", tags=["AI Data Analytics Studio"])

@router.post("/upload")
async def upload_analytics_dataset(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Uploads CSV, Excel (XLSX/XLS), or JSON dataset, performs automated profiling, and creates multi-page dashboard."""
    filename = file.filename or "dataset.csv"
    mime_type = (file.content_type or "text/csv").lower()
    content_bytes = await file.read()

    if not content_bytes:
        raise HTTPException(status_code=400, detail="Uploaded dataset file is empty.")

    try:
        df = AnalyticsService.load_dataframe(filename, content_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse dataset: {str(e)}")

    profile = AnalyticsService.profile_dataset(df)

    dataset_obj = AnalyticsDataset(
        user_id=current_user.id,
        filename=filename,
        file_type=mime_type,
        file_size=len(content_bytes),
        row_count=profile["row_count"],
        column_count=profile["column_count"],
        schema_info=profile["columns"],
        summary_stats=profile["summary_stats"],
        raw_data_preview=profile["preview_records"]
    )
    db.add(dataset_obj)
    db.commit()
    db.refresh(dataset_obj)

    # Automatically generate multi-page Power BI dashboard structure
    dashboard_struct = AnalyticsService.generate_multi_page_dashboard(df)

    dashboard_obj = AnalyticsDashboard(
        dataset_id=dataset_obj.id,
        user_id=current_user.id,
        title=f"Dashboard ({filename})",
        widgets=dashboard_struct["pages"]
    )
    db.add(dashboard_obj)
    db.commit()

    return {
        "dataset_id": dataset_obj.id,
        "filename": filename,
        "row_count": profile["row_count"],
        "column_count": profile["column_count"],
        "schema_info": profile["columns"],
        "summary_stats": profile["summary_stats"],
        "preview_records": profile["preview_records"],
        "multi_page_dashboard": dashboard_struct,
        "message": f"Successfully uploaded and generated {dashboard_struct['page_count']}-page Power BI dashboard for {filename}."
    }

@router.get("/datasets")
async def list_analytics_datasets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists all analytics datasets uploaded by current user."""
    datasets = db.query(AnalyticsDataset).filter(AnalyticsDataset.user_id == current_user.id).order_by(AnalyticsDataset.created_at.desc()).all()
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "file_type": d.file_type,
            "file_size": d.file_size,
            "row_count": d.row_count,
            "column_count": d.column_count,
            "created_at": d.created_at.isoformat()
        }
        for d in datasets
    ]

@router.get("/datasets/{dataset_id}")
async def get_analytics_dataset(
    dataset_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetches dataset schema, statistics, preview records, and multi-page dashboard configuration."""
    dataset = db.query(AnalyticsDataset).filter(AnalyticsDataset.id == dataset_id, AnalyticsDataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Analytics dataset not found.")

    dashboard = db.query(AnalyticsDashboard).filter(AnalyticsDashboard.dataset_id == dataset_id, AnalyticsDashboard.user_id == current_user.id).first()
    
    preview = dataset.raw_data_preview or []
    if preview:
        df = pd.DataFrame(preview)
        dashboard_struct = AnalyticsService.generate_multi_page_dashboard(df)
    else:
        dashboard_struct = {"is_rich": False, "page_count": 0, "pages": []}

    return {
        "id": dataset.id,
        "filename": dataset.filename,
        "row_count": dataset.row_count,
        "column_count": dataset.column_count,
        "schema_info": dataset.schema_info,
        "summary_stats": dataset.summary_stats,
        "preview_records": preview,
        "multi_page_dashboard": dashboard_struct
    }

@router.post("/query")
async def query_analytics_dataset(
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Interprets natural language query on dataset and returns dynamic chart payload + AI insights."""
    dataset_id = payload.get("dataset_id")
    user_prompt = payload.get("prompt", "").strip()

    if not dataset_id or not user_prompt:
        raise HTTPException(status_code=400, detail="dataset_id and prompt are required.")

    dataset = db.query(AnalyticsDataset).filter(AnalyticsDataset.id == dataset_id, AnalyticsDataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Analytics dataset not found.")

    preview = dataset.raw_data_preview or []
    if not preview:
        raise HTTPException(status_code=400, detail="Dataset has no preview records to analyze.")

    df = pd.DataFrame(preview)
    result_spec = await AnalyticsService.process_ai_query(df, user_prompt)

    return result_spec
