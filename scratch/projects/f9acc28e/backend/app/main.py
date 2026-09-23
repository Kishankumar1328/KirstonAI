from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid, datetime

app = FastAPI(title="Resumes Management Platform API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

_resumes: List[dict] = [
    {"id": "1", "name": "Example Resume A", "description": "First example entry", "status": "active", "created_at": datetime.datetime.utcnow().isoformat()},
    {"id": "2", "name": "Example Resume B", "description": "Second example entry", "status": "inactive", "created_at": datetime.datetime.utcnow().isoformat()},
]

class ResumeCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    status: Optional[str] = "active"

@app.get("/health")
def health(): return {"status": "healthy", "service": "Resumes Management Platform"}

@app.get("/api/v1/resumes")
def list_resumes(status: Optional[str] = None):
    result = [i for i in _resumes if not status or i["status"] == status]
    return {"status": "success", "resumes": result, "total": len(result)}

@app.post("/api/v1/resumes", status_code=201)
def create_resume(payload: ResumeCreate):
    item = {"id": str(uuid.uuid4())[:8], "name": payload.name, "description": payload.description, "status": payload.status, "created_at": datetime.datetime.utcnow().isoformat()}
    _resumes.append(item)
    return {"status": "success", "resume": item}

@app.delete("/api/v1/resumes/{item_id}")
def delete_resume(item_id: str):
    global _resumes
    count = len(_resumes)
    _resumes = [i for i in _resumes if i["id"] != item_id]
    if len(_resumes) == count: raise HTTPException(status_code=404, detail="Resume not found")
    return {"status": "success", "message": "Resume deleted"}
