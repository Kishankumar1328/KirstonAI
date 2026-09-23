import datetime
import uuid
from typing import List, Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Interactive Snake Game API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_scores_db = [
    {"id": "1", "player_name": "AI Agent", "score": 150, "created_at": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")},
]

class CreateScore(BaseModel):
    player_name: str = Field(..., min_length=1)
    score: int = Field(..., ge=0)

@app.get("/health")
def health(): return {"status": "healthy"}

@app.get("/api/v1/scores")
def list_scores():
    sorted_scores = sorted(_scores_db, key=lambda x: x["score"], reverse=True)[:10]
    return {"status": "success", "items": sorted_scores, "total": len(_scores_db)}

@app.post("/api/v1/scores", status_code=201)
def create_score(payload: CreateScore):
    item = {
        "id": str(uuid.uuid4())[:8],
        "player_name": payload.player_name,
        "score": payload.score,
        "created_at": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    }
    _scores_db.append(item)
    return {"status": "success", "item": item}
