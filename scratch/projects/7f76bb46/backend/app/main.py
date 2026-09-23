from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid, datetime

app = FastAPI(title="Comments Management Platform API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

_comments: List[dict] = [
    {"id": "1", "name": "Example Comment A", "description": "First example entry", "status": "active", "created_at": datetime.datetime.utcnow().isoformat()},
    {"id": "2", "name": "Example Comment B", "description": "Second example entry", "status": "inactive", "created_at": datetime.datetime.utcnow().isoformat()},
]

class CommentCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    status: Optional[str] = "active"

@app.get("/health")
def health(): return {"status": "healthy", "service": "Comments Management Platform"}

@app.get("/api/v1/comments")
def list_comments(status: Optional[str] = None):
    result = [i for i in _comments if not status or i["status"] == status]
    return {"status": "success", "comments": result, "total": len(result)}

@app.post("/api/v1/comments", status_code=201)
def create_comment(payload: CommentCreate):
    item = {"id": str(uuid.uuid4())[:8], "name": payload.name, "description": payload.description, "status": payload.status, "created_at": datetime.datetime.utcnow().isoformat()}
    _comments.append(item)
    return {"status": "success", "comment": item}

@app.delete("/api/v1/comments/{item_id}")
def delete_comment(item_id: str):
    global _comments
    count = len(_comments)
    _comments = [i for i in _comments if i["id"] != item_id]
    if len(_comments) == count: raise HTTPException(status_code=404, detail="Comment not found")
    return {"status": "success", "message": "Comment deleted"}
