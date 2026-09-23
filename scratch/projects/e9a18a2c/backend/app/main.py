from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid

app = FastAPI(title="Task Management Platform API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

_tasks: List[dict] = [
    {"id": "task-1", "title": "Design system architecture", "status": "done", "priority": "high", "due_date": "2026-08-30", "assigned_to": "Alice"},
    {"id": "task-2", "title": "Implement user authentication", "status": "in_progress", "priority": "high", "due_date": "2026-09-10", "assigned_to": "Bob"},
    {"id": "task-3", "title": "Write unit tests", "status": "todo", "priority": "medium", "due_date": "2026-09-20", "assigned_to": "Carol"},
    {"id": "task-4", "title": "UI polish and responsive design", "status": "todo", "priority": "low", "due_date": "2026-09-25", "assigned_to": ""},
]

class TaskCreate(BaseModel):
    title: str
    priority: str = "medium"
    due_date: Optional[str] = None
    assigned_to: Optional[str] = None

class TaskPatch(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    title: Optional[str] = None

@app.get("/health")
def health(): return {"status": "healthy", "service": "Task Management Platform"}

@app.get("/api/v1/tasks")
def list_tasks(status: Optional[str] = None):
    result = [t for t in _tasks if not status or t["status"] == status]
    return {"status": "success", "tasks": result, "total": len(result)}

@app.post("/api/v1/tasks", status_code=201)
def create_task(payload: TaskCreate):
    task = {"id": f"task-{str(uuid.uuid4())[:6]}", "title": payload.title, "status": "todo", "priority": payload.priority, "due_date": payload.due_date, "assigned_to": payload.assigned_to or ""}
    _tasks.append(task)
    return {"status": "success", "task": task}

@app.patch("/api/v1/tasks/{task_id}")
def update_task(task_id: str, payload: TaskPatch):
    for t in _tasks:
        if t["id"] == task_id:
            if payload.status: t["status"] = payload.status
            if payload.priority: t["priority"] = payload.priority
            if payload.title: t["title"] = payload.title
            return {"status": "success", "task": t}
    raise HTTPException(status_code=404, detail="Task not found")

@app.delete("/api/v1/tasks/{task_id}")
def delete_task(task_id: str):
    global _tasks
    count = len(_tasks)
    _tasks = [t for t in _tasks if t["id"] != task_id]
    if len(_tasks) == count: raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "success", "message": "Task deleted"}
