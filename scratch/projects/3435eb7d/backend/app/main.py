import datetime
import uuid
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Api Management Platform", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_apis_db = [
    {"id": "1", "name": "Initial Api Alpha", "description": "Primary verified record", "status": "active", "created_at": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")},
    {"id": "2", "name": "Secondary Api Beta", "description": "Secondary domain node", "status": "active", "created_at": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")},
]

class CreateItem(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = ""
    status: Optional[str] = "active"

@app.get("/health")
def health(): return {"status": "healthy", "service": "Api Management Platform"}

@app.get("/api/v1/apis")
def list_items():
    return {"status": "success", "items": _apis_db, "total": len(_apis_db)}

@app.post("/api/v1/apis", status_code=201)
def create_item(payload: CreateItem):
    item = {
        "id": str(uuid.uuid4())[:8],
        "name": payload.name,
        "description": payload.description,
        "status": payload.status,
        "created_at": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    }
    _apis_db.insert(0, item)
    return {"status": "success", "item": item}

@app.delete("/api/v1/apis/{item_id}")
def delete_item(item_id: str):
    global _apis_db
    prev_len = len(_apis_db)
    _apis_db = [i for i in _apis_db if i["id"] != item_id]
    if len(_apis_db) == prev_len:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"status": "success", "message": "Deleted"}
