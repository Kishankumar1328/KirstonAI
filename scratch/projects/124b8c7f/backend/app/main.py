import datetime
import uuid
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Improve Management Platform", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_improves_db = [
    {"id": "1", "name": "Initial Improve Alpha", "description": "Primary verified record", "status": "active", "created_at": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")},
    {"id": "2", "name": "Secondary Improve Beta", "description": "Secondary domain node", "status": "active", "created_at": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")},
]

class CreateItem(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = ""
    status: Optional[str] = "active"

@app.get("/health")
def health(): return {"status": "healthy", "service": "Improve Management Platform"}

@app.get("/api/v1/improves")
def list_items():
    return {"status": "success", "items": _improves_db, "total": len(_improves_db)}

@app.post("/api/v1/improves", status_code=201)
def create_item(payload: CreateItem):
    item = {
        "id": str(uuid.uuid4())[:8],
        "name": payload.name,
        "description": payload.description,
        "status": payload.status,
        "created_at": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    }
    _improves_db.insert(0, item)
    return {"status": "success", "item": item}

@app.delete("/api/v1/improves/{item_id}")
def delete_item(item_id: str):
    global _improves_db
    prev_len = len(_improves_db)
    _improves_db = [i for i in _improves_db if i["id"] != item_id]
    if len(_improves_db) == prev_len:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"status": "success", "message": "Deleted"}
