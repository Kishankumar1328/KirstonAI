import os
import pytest
import shutil
import tempfile
from app.services.workspace_manager import WorkspaceManager
from app.services.terminal_executor import TerminalExecutor
from app.services.tools_engine import ToolsEngine
from app.services.autonomous_agent_engine import AutonomousAgentEngine


@pytest.fixture
def temp_workspace():
    temp_dir = tempfile.mkdtemp(prefix="kirstonai_test_ws_")
    yield temp_dir
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir, ignore_errors=True)


def test_workspace_manager_crud(temp_workspace):
    wm = WorkspaceManager(temp_workspace)
    # Create file
    res = wm.create_file("src/test.txt", "Hello World\nLine 2\nLine 3\n")
    assert res["status"] == "created"
    assert os.path.exists(os.path.join(temp_workspace, "src", "test.txt"))

    # Read file
    read_res = wm.read_file("src/test.txt", start_line=1, end_line=2)
    assert read_res["total_lines"] == 3
    assert read_res["content"] == "Hello World\nLine 2\n"

    # Edit file
    edit_res = wm.edit_file("src/test.txt", "Line 2", "Modified Line 2")
    assert edit_res["status"] == "modified"

    read_updated = wm.read_file("src/test.txt")
    assert "Modified Line 2" in read_updated["content"]

    # Search code
    matches = wm.search_code("Modified")
    assert len(matches) == 1
    assert matches[0]["path"] == "src/test.txt"


@pytest.mark.asyncio
async def test_terminal_executor(temp_workspace):
    te = TerminalExecutor(temp_workspace)
    res = await te.execute_command("echo 'Agent Terminal Verified'")
    assert res["success"] is True
    assert "Agent Terminal Verified" in res["stdout"]


@pytest.mark.asyncio
async def test_tools_engine(temp_workspace):
    engine = ToolsEngine(temp_workspace)
    create_res = await engine.execute_tool(
        "create_file",
        {"file_path": "app.py", "content": "print('hello')"},
    )
    assert create_res["success"] is True

    list_res = await engine.execute_tool("list_files", {})
    assert list_res["success"] is True
    file_paths = [f["path"] for f in list_res["files"]]
    assert "app.py" in file_paths


@pytest.mark.asyncio
async def test_autonomous_agent_plan_and_stream(temp_workspace):
    agent = AutonomousAgentEngine(temp_workspace, session_id="test_sess_01")
    events = []

    async for ev in agent.stream_execute(prompt="Build a snake game with canvas and leaderboard"):
        events.append(ev)

    assert len(events) > 0
    event_text = "".join(events)
    assert "agent.started" in event_text
    assert "plan.created" in event_text
    assert "agent.completed" in event_text
