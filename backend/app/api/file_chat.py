import json
import base64
import io
import re
import asyncio
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pypdf import PdfReader

from app.database.session import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.file_chat import FileChatSession, FileChatAttachment
from app.ai.llm import llm_provider
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/v1/file-chat", tags=["AI File Chat"])

TEMPORAL_AND_ID_EXCLUDES = ["year", "month", "day", "date", "quarter", "zip", "postal", "code", "id", "year_built", "phone", "mrn", "sku", "unnamed", "index", "row"]
METRIC_PRIORITY_KEYWORDS = ["sales", "amount", "revenue", "price", "cost", "total", "bill", "qty", "quantity", "profit", "units", "volume", "stay", "score", "val"]

def _extract_text_from_file(filename: str, mime_type: str, content_bytes: bytes) -> str:
    """Extracts clean text or tabular Pandas summary from PDF, DOCX, TXT, CSV, or Excel files."""
    filename_lower = filename.lower()
    
    if filename_lower.endswith((".csv", ".xlsx", ".xls", ".json")):
        try:
            df = AnalyticsService.load_dataframe(filename, content_bytes)
            row_cnt, col_cnt = df.shape
            
            summary_parts = [
                f"=== DATASET PROFILE: {filename} ===",
                f"Total Rows: {row_cnt:,} | Total Columns: {col_cnt}",
                f"Columns & Types: {', '.join([f'{c} ({df[c].dtype})' for c in df.columns])}\n"
            ]

            # Exclude temporal/date/ID columns from Y-axis sum aggregations
            cat_cols = [c for c in df.columns if not pd.api.types.is_numeric_dtype(df[c]) and df[c].nunique() <= 50]
            valid_num_cols = [
                c for c in df.columns 
                if pd.api.types.is_numeric_dtype(df[c]) and not any(k in c.lower() for k in TEMPORAL_AND_ID_EXCLUDES)
            ]

            # Priority ordering: place sales/revenue/amount columns first
            num_cols = sorted(
                valid_num_cols, 
                key=lambda c: 0 if any(k in c.lower() for k in METRIC_PRIORITY_KEYWORDS) else 1
            )

            if cat_cols and num_cols:
                summary_parts.append("--- PRE-CALCULATED FINANCIAL & OPERATIONAL SUMMARIES ---")
                for c_col in cat_cols[:3]:
                    for n_col in num_cols[:2]:
                        try:
                            agg = df.groupby(c_col)[n_col].sum().sort_values(ascending=False).head(15)
                            agg_lines = [f"  * {k}: {v:,.2f}" for k, v in agg.items()]
                            summary_parts.append(f"\n[Total '{n_col}' by '{c_col}']:\n" + "\n".join(agg_lines))
                        except Exception:
                            continue

            # Preview Table
            preview_md = df.head(15).to_markdown(index=False)
            summary_parts.append(f"\n--- DATASET SAMPLE (FIRST 15 ROWS) ---\n{preview_md}")
            
            return "\n".join(summary_parts)
        except Exception as e:
            return f"Tabular parsing fallback for {filename}: {str(e)}"

    elif filename_lower.endswith(".pdf") or "pdf" in mime_type:
        try:
            reader = PdfReader(io.BytesIO(content_bytes))
            pages_text = []
            for i, page in enumerate(reader.pages):
                txt = page.extract_text()
                if txt:
                    pages_text.append(f"--- PAGE {i+1} ---\n{txt}")
            extracted = "\n\n".join(pages_text) if pages_text else "No text extracted from PDF pages."
        except Exception as e:
            extracted = f"PDF text extraction note: {str(e)}"
    else:
        try:
            extracted = content_bytes.decode("utf-8")
        except Exception:
            extracted = content_bytes.decode("latin-1", errors="ignore")

    clean_text = extracted.replace("\x00", "").strip()
    return clean_text if clean_text else "Empty document content."

@router.post("/upload")
async def upload_file_chat_attachments(
    files: List[UploadFile] = File(...),
    session_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Uploads up to 10 documents/images for direct AI File Chat analysis, updating active attachments."""
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")

    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 files can be uploaded simultaneously for AI File Chat.")

    if session_id:
        session_obj = db.query(FileChatSession).filter(FileChatSession.id == session_id, FileChatSession.user_id == current_user.id).first()
        if not session_obj:
            session_obj = FileChatSession(user_id=current_user.id, title=f"File Chat ({files[0].filename})")
            db.add(session_obj)
            db.commit()
            db.refresh(session_obj)
        else:
            db.query(FileChatAttachment).filter(FileChatAttachment.session_id == session_obj.id).delete()
            db.commit()
    else:
        session_obj = FileChatSession(user_id=current_user.id, title=f"File Chat ({files[0].filename})")
        db.add(session_obj)
        db.commit()
        db.refresh(session_obj)

    attachments_created = []
    for f in files:
        filename = f.filename or "file.txt"
        mime_type = (f.content_type or "text/plain").lower()
        content_bytes = await f.read()

        is_img = "image" in mime_type or any(filename.lower().endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"])

        if is_img:
            b64_str = base64.b64encode(content_bytes).decode("utf-8")
            if mime_type.startswith("image/"):
                extracted_text = f"data:{mime_type};base64,{b64_str}"
            else:
                extracted_text = f"data:image/png;base64,{b64_str}"
            is_image_str = "true"
        else:
            extracted_text = _extract_text_from_file(filename, mime_type, content_bytes)
            is_image_str = "false"

        attachment = FileChatAttachment(
            session_id=session_obj.id,
            filename=filename,
            file_type=mime_type,
            extracted_text=extracted_text,
            is_image=is_image_str
        )
        db.add(attachment)
        attachments_created.append({
            "id": attachment.id,
            "filename": filename,
            "file_type": mime_type,
            "is_image": is_img
        })

    db.commit()

    return {
        "session_id": session_obj.id,
        "title": session_obj.title,
        "total_files": len(files),
        "attachments": attachments_created,
        "message": f"Successfully uploaded {len(files)} file(s) into AI File Chat session."
    }

@router.post("/stream")
async def stream_file_chat(
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Streams SSE AI File Chat response analyzing attached documents & images using Llama 3.2 Vision Model."""
    session_id = payload.get("session_id")
    user_message = payload.get("message", "").strip()

    if not session_id or not user_message:
        raise HTTPException(status_code=400, detail="session_id and message are required.")

    attachments = db.query(FileChatAttachment).filter(FileChatAttachment.session_id == session_id).all()
    if not attachments:
        raise HTTPException(status_code=404, detail="No attachments found for this File Chat session.")

    active_model = "meta/llama-3.2-11b-vision-instruct"
    has_image = any(att.is_image == "true" for att in attachments)

    if has_image:
        user_content_list: List[Dict[str, Any]] = [{"type": "text", "text": user_message}]
        doc_texts = []
        for att in attachments:
            if att.is_image == "true" and att.extracted_text.startswith("data:image"):
                user_content_list.append({
                    "type": "image_url",
                    "image_url": {
                        "url": att.extracted_text
                    }
                })
            elif att.is_image == "false":
                doc_texts.append(f"--- DOCUMENT: {att.filename} ---\n{att.extracted_text[:10000]}")

        sys_prompt = (
            "You are KirstonAI Multimodal Vision File Chat Assistant. "
            "Read and analyze the attached document or image files carefully and answer user questions accurately based strictly on the uploaded content.\n"
            "INSTRUCTIONS:\n"
            "1. NEVER print long raw addition strings (e.g. `10.0 + 20.0 + 30.0...`).\n"
            "2. DO NOT sum up temporal or calendar columns like 'month', 'year', 'day', 'zip'. Sum up actual financial metrics like 'Sales', 'Amount', or 'Revenue'.\n"
            "3. Always present answers using clean Markdown tables, bulleted lists, and formatted totals."
        )
        if doc_texts:
            sys_prompt += "\n\n" + "\n\n".join(doc_texts)

        formatted_messages = [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": user_content_list}
        ]
    else:
        doc_context_blocks = []
        for att in attachments:
            truncated_text = att.extracted_text[:25000]
            doc_context_blocks.append(f"--- ATTACHED FILE: {att.filename} ({att.file_type}) ---\n{truncated_text}\n")

        combined_files_str = "\n\n".join(doc_context_blocks)
        system_prompt = (
            f"You are KirstonAI File Chat Assistant. The user has uploaded {len(attachments)} file(s) for direct analysis:\n\n"
            f"{combined_files_str}\n\n"
            f"INSTRUCTIONS:\n"
            f"1. Answer the user's question accurately using ONLY the pre-calculated financial & operational aggregations and file data above.\n"
            f"2. ABSOLUTELY DO NOT print raw addition string formulas (e.g. `830.86 + 1226.1 + 996.3...`).\n"
            f"3. ABSOLUTELY DO NOT sum up calendar/temporal columns like 'month', 'year', 'day', 'zip', 'code'. Sum up actual metrics like 'Sales', 'Amount', 'Revenue', or 'Quantity'.\n"
            f"4. Format all numeric answers using clean Markdown tables, ranked bullet points, and currency/unit formatting.\n"
            f"5. Be concise, direct, and professional."
        )
        formatted_messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]

    async def event_generator():
        yield f"data: {json.dumps({'type': 'start', 'message_id': 'fc_' + session_id})}\n\n"

        async for chunk in llm_provider.stream_completion(messages=formatted_messages, model=active_model):
            if chunk["type"] == "content":
                token_data = json.dumps({"type": "token", "token": chunk["text"]})
                yield f"data: {token_data}\n\n"
            elif chunk["type"] == "reasoning":
                reasoning_data = json.dumps({"type": "reasoning", "reasoning": chunk["text"]})
                yield f"data: {reasoning_data}\n\n"

        complete_data = json.dumps({"type": "done", "content": ""})
        yield f"data: {complete_data}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
