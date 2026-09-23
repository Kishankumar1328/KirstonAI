from typing import List, Dict, Any
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services.document_service import DocumentService
from app.schemas.document import DocumentResponse, DocumentUploadResponse

router = APIRouter(prefix="/api/v1/documents", tags=["Documents (RAG)"])

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    filename = file.filename or "uploaded_doc.txt"
    content_bytes = await file.read()
    try:
        content = content_bytes.decode("utf-8")
    except Exception:
        content = content_bytes.decode("latin-1", errors="ignore")

    if not content.strip():
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    service = DocumentService(db)
    doc_res = service.upload_and_index_document(
        user_id=current_user.id,
        filename=filename,
        file_type=file.content_type or "text/plain",
        content=content
    )

    return DocumentUploadResponse(
        document=doc_res,
        message=f"Document '{filename}' successfully ingested into RAG index with {doc_res.chunk_count} chunks."
    )

@router.post("/batch")
async def upload_batch_documents(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Parallel upload & async processing for up to 10 files."""
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 files can be uploaded simultaneously in one batch.")

    files_data: List[Dict[str, Any]] = []
    for f in files:
        filename = f.filename or "uploaded_file.txt"
        content_bytes = await f.read()
        try:
            content = content_bytes.decode("utf-8")
        except Exception:
            content = content_bytes.decode("latin-1", errors="ignore")

        files_data.append({
            "filename": filename,
            "file_type": f.content_type or "text/plain",
            "content": content
        })

    service = DocumentService(db)
    batch_results = await service.upload_batch_documents_parallel(
        user_id=current_user.id,
        files_data=files_data
    )

    successful_count = sum(1 for r in batch_results if r["status"] == "completed")

    return {
        "total_submitted": len(files),
        "successful_count": successful_count,
        "results": batch_results,
        "message": f"Successfully processed {successful_count} of {len(files)} files into PostgreSQL RAG Store."
    }

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = DocumentService(db)
    return service.list_user_documents(user_id=current_user.id)
