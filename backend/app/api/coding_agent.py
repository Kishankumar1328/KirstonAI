import os
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field

from app.services.coding_agent_service import CodingAgentService
from app.utils.logging import logger

router = APIRouter(prefix="/api/v1/coding-agent", tags=["Autonomous Coding Agent"])
router_alt = APIRouter(prefix="/api/coding-agent", tags=["Autonomous Coding Agent Alt"])


class GenerateProjectRequest(BaseModel):
    prompt: str = Field(..., description="Natural language prompt describing workspace task")
    project_id: Optional[str] = Field(None, description="Active workspace/project ID")
    model: Optional[str] = Field(None, description="AI model override")


class SaveFileRequest(BaseModel):
    path: str = Field(..., description="Relative file path")
    content: str = Field(..., description="File content to save")


class TerminalCommandRequest(BaseModel):
    project_id: str = Field(..., description="Target workspace ID")
    command: str = Field(..., description="Shell command to run")
    cwd: Optional[str] = Field("", description="Subdirectory to run in")


# ── SSE Streaming Execution Pipeline ─────────────────────────────────────────

@router.post("/stream")
@router_alt.post("/stream")
async def stream_project_generation(payload: GenerateProjectRequest):
    """
    Streams real-time autonomous agent events via Server-Sent Events (SSE).
    Emits agent.started, planning.started, plan.created, task.updated,
    file.created, file.modified, command.output, test.completed, review.started,
    and agent.completed events.
    """
    try:
        generator = CodingAgentService.stream_generate_or_update_project(
            prompt=payload.prompt,
            project_id=payload.project_id,
            model=payload.model,
        )
        return StreamingResponse(
            generator,
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )
    except Exception as e:
        logger.error(f"[Coding Agent Stream API] Failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate")
@router_alt.post("/generate")
async def generate_project_sync(payload: GenerateProjectRequest):
    """
    Synchronously runs the autonomous coding agent and returns the final project payload.
    """
    if not payload.prompt or not payload.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt must not be empty.")
    try:
        res = await CodingAgentService.generate_project(
            prompt=payload.prompt,
            project_id=payload.project_id,
            model=payload.model,
        )
        return res
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"[Coding Agent Sync API] Failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Session Controls: Stop / Pause / Resume ──────────────────────────────────

@router.post("/session/{session_id}/stop")
@router_alt.post("/session/{session_id}/stop")
async def stop_session(session_id: str):
    """Signals active agent loop to immediately stop execution."""
    success = CodingAgentService.cancel_session(session_id)
    return {"status": "stopped" if success else "not_found", "session_id": session_id}


@router.post("/session/{session_id}/pause")
@router_alt.post("/session/{session_id}/pause")
async def pause_session(session_id: str):
    """Pauses active agent loop."""
    success = CodingAgentService.pause_session(session_id)
    return {"status": "paused" if success else "not_found", "session_id": session_id}


@router.post("/session/{session_id}/resume")
@router_alt.post("/session/{session_id}/resume")
async def resume_session(session_id: str):
    """Resumes active agent loop."""
    success = CodingAgentService.resume_session(session_id)
    return {"status": "resumed" if success else "not_found", "session_id": session_id}


# ── Interactive Terminal ─────────────────────────────────────────────────────

@router.post("/terminal/execute")
@router_alt.post("/terminal/execute")
async def execute_terminal_command(payload: TerminalCommandRequest):
    """Executes a real shell command within the workspace."""
    try:
        res = await CodingAgentService.execute_terminal_command(
            project_id=payload.project_id,
            command=payload.command,
            cwd_relative=payload.cwd or "",
        )
        return res
    except Exception as e:
        logger.error(f"[Coding Agent Terminal API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── Project & Workspace Listings ─────────────────────────────────────────────

@router.get("/projects", status_code=status.HTTP_200_OK)
@router_alt.get("/projects", status_code=status.HTTP_200_OK)
async def list_projects():
    """Returns all available workspace projects."""
    try:
        projects = CodingAgentService.list_projects()
        return {"projects": projects, "total": len(projects)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/project/{project_id}", status_code=status.HTTP_200_OK)
@router_alt.get("/project/{project_id}", status_code=status.HTTP_200_OK)
async def get_project_details(project_id: str):
    """Retrieves workspace metadata, file tree, and git status."""
    try:
        return CodingAgentService.get_project_info(project_id)
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=404, detail=str(fnf))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── File Operations ──────────────────────────────────────────────────────────

@router.get("/project/{project_id}/file", status_code=status.HTTP_200_OK)
@router_alt.get("/project/{project_id}/file", status_code=status.HTTP_200_OK)
async def get_project_file(
    project_id: str,
    path: str = Query(..., description="Relative file path inside workspace"),
):
    """Returns the full text content of a workspace file."""
    try:
        content = CodingAgentService.get_project_file_content(project_id, path)
        return {"project_id": project_id, "path": path, "content": content}
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=404, detail=str(fnf))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/project/{project_id}/file", status_code=status.HTTP_200_OK)
@router_alt.post("/project/{project_id}/file", status_code=status.HTTP_200_OK)
async def save_project_file(project_id: str, payload: SaveFileRequest):
    """Saves user manual edits to a workspace file."""
    try:
        res = CodingAgentService.save_project_file_content(project_id, payload.path, payload.content)
        return {"project_id": project_id, **res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Packaging & ZIP Download ─────────────────────────────────────────────────

@router.post("/project/{project_id}/package", status_code=status.HTTP_200_OK)
@router_alt.post("/project/{project_id}/package", status_code=status.HTTP_200_OK)
async def package_project(project_id: str):
    """Packages the verified workspace into a ZIP bundle."""
    try:
        zip_p = CodingAgentService.package_project(project_id)
        return {"status": "packaged", "project_id": project_id, "zip_path": zip_p}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/project/{project_id}/download", status_code=status.HTTP_200_OK)
@router_alt.get("/project/{project_id}/download", status_code=status.HTTP_200_OK)
async def download_project_zip(project_id: str):
    """Downloads the packaged project ZIP archive."""
    try:
        zip_path = CodingAgentService._get_zip_path(project_id)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    if not os.path.exists(zip_path):
        # Auto-package if not exists
        try:
            CodingAgentService.package_project(project_id)
        except Exception:
            raise HTTPException(
                status_code=404,
                detail=f"Project ZIP archive for '{project_id}' not found.",
            )

    return FileResponse(
        path=zip_path,
        media_type="application/zip",
        filename=f"KirstonAI_Project_{project_id}.zip",
        headers={"Content-Disposition": f'attachment; filename="KirstonAI_Project_{project_id}.zip"'},
    )


# ── Deletion ─────────────────────────────────────────────────────────────────

@router.delete("/project/{project_id}", status_code=status.HTTP_200_OK)
@router_alt.delete("/project/{project_id}", status_code=status.HTTP_200_OK)
async def delete_project(project_id: str):
    """Permanently deletes a workspace project."""
    try:
        CodingAgentService.delete_project(project_id)
        return {"status": "deleted", "project_id": project_id}
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=404, detail=str(fnf))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"[Coding Agent API] Delete failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
