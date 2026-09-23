from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import uuid

app = FastAPI(title="Classic Snake Game & Leaderboard API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

_scores: List[dict] = [
    {"id": "s1", "player": "Alice", "score": 250},
    {"id": "s2", "player": "Bob", "score": 180},
    {"id": "s3", "player": "Carol", "score": 140},
]

class ScoreCreate(BaseModel): player: str; score: int

@app.get("/health")
def health(): return {"status": "healthy"}

@app.get("/api/v1/scores")
def list_scores():
    sorted_scores = sorted(_scores, key=lambda s: s["score"], reverse=True)
    return {"status": "success", "scores": sorted_scores[:10]}

@app.post("/api/v1/scores", status_code=201)
def submit_score(payload: ScoreCreate):
    if payload.score <= 0: raise HTTPException(422, "Score must be positive")
    entry = {"id": str(uuid.uuid4())[:8], "player": payload.player, "score": payload.score}
    _scores.append(entry)
    return {"status": "success", "entry": entry}
