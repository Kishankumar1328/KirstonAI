"""
tools_engine.py
────────────────────────────────────────────────────────────────────────────
Autonomous Coding Agent Tools Engine & Execution Registry.
Exposes standard LLM-callable coding tools:
- list_files
- read_file
- search_code
- search_symbols
- create_file
- edit_file
- delete_file
- move_file
- execute_command
- run_test
- run_build
- run_lint
- run_typecheck
- git_diff
- git_status
- package_project
"""

import os
import zipfile
from typing import Any, Callable, Dict, List, Optional
from app.services.terminal_executor import TerminalExecutor
from app.services.workspace_manager import WorkspaceManager


class ToolsEngine:
    """
    Executes real workspace tools for the Autonomous Agent.
    """

    def __init__(self, workspace_root: str):
        self.workspace_root = os.path.abspath(workspace_root)
        self.workspace = WorkspaceManager(self.workspace_root)
        self.terminal = TerminalExecutor(self.workspace_root)

    # --------------------------------------------------------------------------
    # Tool Schemas for LLM Tool Calling
    # --------------------------------------------------------------------------

    @classmethod
    def get_tool_definitions(cls) -> List[Dict[str, Any]]:
        """Returns JSON schema definitions for all available coding tools."""
        return [
            {
                "type": "function",
                "function": {
                    "name": "list_files",
                    "description": "Lists files and directories in the workspace with metadata.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "sub_dir": {"type": "string", "description": "Optional subdirectory path to list."},
                            "pattern": {"type": "string", "description": "Optional regex pattern to filter files."},
                        },
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "read_file",
                    "description": "Reads contents of a file within the workspace, with optional line range slicing.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "file_path": {"type": "string", "description": "Relative path to file."},
                            "start_line": {"type": "integer", "description": "1-indexed starting line number."},
                            "end_line": {"type": "integer", "description": "1-indexed ending line number."},
                        },
                        "required": ["file_path"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "search_code",
                    "description": "Searches for text or regex pattern across workspace files.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string", "description": "Search string or regex."},
                            "sub_dir": {"type": "string", "description": "Optional subdirectory to restrict search."},
                            "is_regex": {"type": "boolean", "description": "Whether query is a regex."},
                        },
                        "required": ["query"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "search_symbols",
                    "description": "Finds function, class, type, and variable definitions across codebase.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string", "description": "Symbol name or substring to find."},
                        },
                        "required": ["query"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "create_file",
                    "description": "Creates a new file in the workspace with given content.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "file_path": {"type": "string", "description": "Relative file path."},
                            "content": {"type": "string", "description": "Full file content to write."},
                            "overwrite": {"type": "boolean", "description": "Overwrite if file already exists."},
                        },
                        "required": ["file_path", "content"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "edit_file",
                    "description": "Applies precise content replacement to an existing file in the workspace.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "file_path": {"type": "string", "description": "Relative file path."},
                            "target_content": {"type": "string", "description": "Exact text block to replace."},
                            "replacement_content": {"type": "string", "description": "New text to substitute in place."},
                        },
                        "required": ["file_path", "target_content", "replacement_content"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "delete_file",
                    "description": "Deletes a file or directory from the workspace.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "file_path": {"type": "string", "description": "Relative path to file or directory."},
                        },
                        "required": ["file_path"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "move_file",
                    "description": "Moves or renames a file or folder in the workspace.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "src_path": {"type": "string", "description": "Source path."},
                            "dest_path": {"type": "string", "description": "Destination path."},
                        },
                        "required": ["src_path", "dest_path"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "execute_command",
                    "description": "Runs a real command in the workspace terminal.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "command": {"type": "string", "description": "Shell command to run."},
                            "cwd_relative": {"type": "string", "description": "Subdirectory to execute command in."},
                            "timeout_seconds": {"type": "integer", "description": "Command timeout in seconds."},
                        },
                        "required": ["command"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "run_test",
                    "description": "Runs the test suite to verify code correctness.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "test_command": {"type": "string", "description": "Custom test command if needed."},
                            "cwd_relative": {"type": "string", "description": "Subdirectory to run tests in."},
                        },
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "run_build",
                    "description": "Runs project build / compilation check.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "build_command": {"type": "string", "description": "Custom build command if needed."},
                            "cwd_relative": {"type": "string", "description": "Subdirectory to build in."},
                        },
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "git_diff",
                    "description": "Retrieves the current git diff of changes made in the workspace.",
                    "parameters": {"type": "object", "properties": {}},
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "git_status",
                    "description": "Retrieves git status of modified and untracked files.",
                    "parameters": {"type": "object", "properties": {}},
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "package_project",
                    "description": "Bundles the verified workspace into a ZIP archive bundle.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "archive_name": {"type": "string", "description": "ZIP filename."},
                        },
                    },
                },
            },
        ]

    # --------------------------------------------------------------------------
    # Tool Execution Dispatcher
    # --------------------------------------------------------------------------

    async def execute_tool(
        self,
        tool_name: str,
        tool_args: Dict[str, Any],
        on_log: Optional[Callable[[str], Any]] = None,
    ) -> Dict[str, Any]:
        """Dispatches and executes a tool against the real workspace."""
        try:
            if tool_name == "list_files":
                return {
                    "success": True,
                    "files": self.workspace.list_files(
                        sub_dir=tool_args.get("sub_dir", ""),
                        pattern=tool_args.get("pattern"),
                    ),
                }

            elif tool_name == "read_file":
                return {
                    "success": True,
                    **self.workspace.read_file(
                        file_path=tool_args["file_path"],
                        start_line=tool_args.get("start_line"),
                        end_line=tool_args.get("end_line"),
                    ),
                }

            elif tool_name == "search_code":
                return {
                    "success": True,
                    "matches": self.workspace.search_code(
                        query=tool_args["query"],
                        sub_dir=tool_args.get("sub_dir", ""),
                        is_regex=tool_args.get("is_regex", False),
                    ),
                }

            elif tool_name == "search_symbols":
                return {
                    "success": True,
                    "symbols": self.workspace.search_symbols(query=tool_args["query"]),
                }

            elif tool_name == "create_file":
                res = self.workspace.create_file(
                    file_path=tool_args["file_path"],
                    content=tool_args["content"],
                    overwrite=tool_args.get("overwrite", True),
                )
                return {"success": True, **res}

            elif tool_name == "edit_file":
                res = self.workspace.edit_file(
                    file_path=tool_args["file_path"],
                    target_content=tool_args["target_content"],
                    replacement_content=tool_args["replacement_content"],
                )
                return {"success": True, **res}

            elif tool_name == "delete_file":
                res = self.workspace.delete_file(file_path=tool_args["file_path"])
                return {"success": True, **res}

            elif tool_name == "move_file":
                res = self.workspace.move_file(
                    src_path=tool_args["src_path"],
                    dest_path=tool_args["dest_path"],
                )
                return {"success": True, **res}

            elif tool_name == "execute_command":
                res = await self.terminal.execute_command(
                    command=tool_args["command"],
                    cwd_relative=tool_args.get("cwd_relative", ""),
                    timeout_seconds=tool_args.get("timeout_seconds", 60),
                    on_stdout=on_log,
                    on_stderr=on_log,
                )
                return {"success": res["success"], **res}

            elif tool_name == "run_test":
                res = await self.terminal.run_tests(
                    test_command=tool_args.get("test_command"),
                    cwd_relative=tool_args.get("cwd_relative", ""),
                    on_log=on_log,
                )
                return {"success": res["passed"], **res}

            elif tool_name == "run_build":
                res = await self.terminal.run_build(
                    build_command=tool_args.get("build_command"),
                    cwd_relative=tool_args.get("cwd_relative", ""),
                    on_log=on_log,
                )
                return {"success": res["passed"], **res}

            elif tool_name == "run_lint":
                res = await self.terminal.run_lint(
                    lint_command=tool_args.get("lint_command"),
                    cwd_relative=tool_args.get("cwd_relative", ""),
                    on_log=on_log,
                )
                return {"success": res["passed"], **res}

            elif tool_name == "run_typecheck":
                res = await self.terminal.run_typecheck(
                    typecheck_command=tool_args.get("typecheck_command"),
                    cwd_relative=tool_args.get("cwd_relative", ""),
                    on_log=on_log,
                )
                return {"success": res["passed"], **res}

            elif tool_name == "git_diff":
                diff = self.workspace.get_git_diff()
                return {"success": True, "diff": diff}

            elif tool_name == "git_status":
                status = self.workspace.get_git_status()
                return {"success": True, **status}

            elif tool_name == "package_project":
                name = tool_args.get("archive_name", "project.zip")
                zip_path = os.path.join(self.workspace_root, name)
                exclude_dirs = {"node_modules", ".venv", "venv", "__pycache__", ".git", "dist"}
                with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
                    for root, dirs, files in os.walk(self.workspace_root):
                        dirs[:] = [d for d in dirs if d not in exclude_dirs]
                        for f in files:
                            if f == name or f.endswith(".pyc"):
                                continue
                            fp = os.path.join(root, f)
                            zf.write(fp, os.path.relpath(fp, self.workspace_root))
                return {"success": True, "zip_path": zip_path, "size_bytes": os.path.getsize(zip_path)}

            else:
                return {"success": False, "error": f"Unknown tool '{tool_name}'"}

        except Exception as e:
            return {"success": False, "error": str(e)}
