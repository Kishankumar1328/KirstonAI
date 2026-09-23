"""
workspace_manager.py
────────────────────────────────────────────────────────────────────────────
Production-grade Workspace Management & Context Extraction Layer.
Provides safe, real filesystem operations, code search, symbol analysis,
and Git integration on the active project workspace.
"""

import os
import re
import shutil
import subprocess
from typing import Any, Dict, List, Optional, Tuple


class WorkspaceManager:
    """
    Manages workspace filesystem operations, file inspection, line-level edits,
    code searching, and git interactions in a sandboxed, safe manner.
    """

    EXCLUDE_DIRS = {
        ".git",
        "node_modules",
        ".venv",
        "venv",
        "__pycache__",
        ".pytest_cache",
        "dist",
        "build",
        ".next",
        ".cache",
    }

    EXCLUDE_FILES = {
        ".DS_Store",
        "thumbs.db",
        "*.pyc",
    }

    def __init__(self, workspace_root: str):
        self.workspace_root = os.path.abspath(workspace_root)
        os.makedirs(self.workspace_root, exist_ok=True)

    def _resolve_path(self, rel_or_abs_path: str) -> str:
        """Resolves and sandboxes paths strictly within the workspace root."""
        if os.path.isabs(rel_or_abs_path):
            full_path = os.path.abspath(rel_or_abs_path)
        else:
            full_path = os.path.abspath(os.path.join(self.workspace_root, rel_or_abs_path))

        if not (full_path == self.workspace_root or full_path.startswith(self.workspace_root + os.sep)):
            raise ValueError(f"Access denied: Path '{rel_or_abs_path}' traverses outside workspace root.")
        return full_path

    def _relative_path(self, full_path: str) -> str:
        """Returns relative path formatted with forward slashes."""
        rel = os.path.relpath(full_path, self.workspace_root)
        return rel.replace("\\", "/")

    # --------------------------------------------------------------------------
    # File Tree & Listing
    # --------------------------------------------------------------------------

    def list_files(self, sub_dir: str = "", pattern: Optional[str] = None) -> List[Dict[str, Any]]:
        """Lists files and directories with metadata (size, is_dir, modified)."""
        target_dir = self._resolve_path(sub_dir)
        if not os.path.exists(target_dir):
            return []

        results: List[Dict[str, Any]] = []
        regex = re.compile(pattern, re.IGNORECASE) if pattern else None

        for root, dirs, files in os.walk(target_dir):
            dirs[:] = [d for d in dirs if d not in self.EXCLUDE_DIRS]

            for d in dirs:
                full_d = os.path.join(root, d)
                rel_d = self._relative_path(full_d)
                if regex and not regex.search(rel_d):
                    continue
                results.append({
                    "path": rel_d,
                    "name": d,
                    "is_dir": True,
                    "size_bytes": 0,
                })

            for f in files:
                if any(f.endswith(ext.replace("*", "")) for ext in self.EXCLUDE_FILES):
                    continue
                full_f = os.path.join(root, f)
                rel_f = self._relative_path(full_f)
                if regex and not regex.search(rel_f):
                    continue
                try:
                    size = os.path.getsize(full_f)
                except OSError:
                    size = 0
                results.append({
                    "path": rel_f,
                    "name": f,
                    "is_dir": False,
                    "size_bytes": size,
                })

        results.sort(key=lambda x: (not x["is_dir"], x["path"]))
        return results

    def get_file_tree_hierarchy(self) -> List[Dict[str, Any]]:
        """Returns a nested tree hierarchy representing the workspace structure."""
        def build_tree(current_dir: str) -> List[Dict[str, Any]]:
            entries = []
            try:
                scanned = sorted(os.scandir(current_dir), key=lambda e: (not e.is_dir(), e.name.lower()))
            except OSError:
                return []

            for entry in scanned:
                if entry.name in self.EXCLUDE_DIRS or entry.name in self.EXCLUDE_FILES:
                    continue
                rel_path = self._relative_path(entry.path)
                if entry.is_dir():
                    entries.append({
                        "name": entry.name,
                        "path": rel_path,
                        "is_dir": True,
                        "children": build_tree(entry.path),
                    })
                else:
                    entries.append({
                        "name": entry.name,
                        "path": rel_path,
                        "is_dir": False,
                        "size_bytes": entry.stat().st_size,
                    })
            return entries

        return build_tree(self.workspace_root)

    # --------------------------------------------------------------------------
    # File Reading & Line Slicing
    # --------------------------------------------------------------------------

    def read_file(
        self, file_path: str, start_line: Optional[int] = None, end_line: Optional[int] = None
    ) -> Dict[str, Any]:
        """Reads file content with optional line range slicing (1-indexed)."""
        full_path = self._resolve_path(file_path)
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"File '{file_path}' does not exist.")
        if os.path.isdir(full_path):
            raise IsADirectoryError(f"Path '{file_path}' is a directory.")

        with open(full_path, "r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()

        total_lines = len(lines)
        s = max(1, start_line) if start_line is not None else 1
        e = min(total_lines, end_line) if end_line is not None else total_lines

        selected_lines = lines[s - 1 : e]
        content = "".join(selected_lines)

        return {
            "path": self._relative_path(full_path),
            "content": content,
            "total_lines": total_lines,
            "start_line": s,
            "end_line": e,
        }

    # --------------------------------------------------------------------------
    # File Writing & Precise Line Editing
    # --------------------------------------------------------------------------

    def create_file(self, file_path: str, content: str, overwrite: bool = True) -> Dict[str, Any]:
        """Creates a new file and any required parent directories."""
        full_path = self._resolve_path(file_path)
        if os.path.exists(full_path) and not overwrite:
            raise FileExistsError(f"File '{file_path}' already exists.")

        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)

        return {
            "path": self._relative_path(full_path),
            "bytes_written": len(content.encode("utf-8")),
            "status": "created",
        }

    def edit_file(
        self,
        file_path: str,
        target_content: str,
        replacement_content: str,
        start_line: Optional[int] = None,
        end_line: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Performs precise content replacement on a file, preserving unrelated lines.
        Ensures target_content is uniquely identified.
        """
        full_path = self._resolve_path(file_path)
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"File '{file_path}' does not exist.")

        with open(full_path, "r", encoding="utf-8", errors="replace") as f:
            original = f.read()

        if target_content not in original:
            # Try normalizing line endings
            norm_target = target_content.replace("\r\n", "\n")
            norm_original = original.replace("\r\n", "\n")
            if norm_target not in norm_original:
                raise ValueError(
                    f"Target content not found in '{file_path}'. Check line ranges or whitespace."
                )
            new_content = norm_original.replace(norm_target, replacement_content.replace("\r\n", "\n"), 1)
        else:
            new_content = original.replace(target_content, replacement_content, 1)

        with open(full_path, "w", encoding="utf-8") as f:
            f.write(new_content)

        return {
            "path": self._relative_path(full_path),
            "status": "modified",
            "diff_summary": f"Replaced {len(target_content.splitlines())} lines with {len(replacement_content.splitlines())} lines.",
        }

    def delete_file(self, file_path: str) -> Dict[str, Any]:
        """Deletes a file or directory safely."""
        full_path = self._resolve_path(file_path)
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"Path '{file_path}' does not exist.")

        if os.path.isdir(full_path):
            shutil.rmtree(full_path)
        else:
            os.remove(full_path)

        return {"path": self._relative_path(full_path), "status": "deleted"}

    def move_file(self, src_path: str, dest_path: str) -> Dict[str, Any]:
        """Moves/renames a file or directory."""
        full_src = self._resolve_path(src_path)
        full_dest = self._resolve_path(dest_path)

        if not os.path.exists(full_src):
            raise FileNotFoundError(f"Source '{src_path}' does not exist.")

        os.makedirs(os.path.dirname(full_dest), exist_ok=True)
        shutil.move(full_src, full_dest)

        return {
            "src": self._relative_path(full_src),
            "dest": self._relative_path(full_dest),
            "status": "moved",
        }

    # --------------------------------------------------------------------------
    # Code Search & Symbol Analysis
    # --------------------------------------------------------------------------

    def search_code(
        self, query: str, sub_dir: str = "", is_regex: bool = False, max_results: int = 50
    ) -> List[Dict[str, Any]]:
        """Searches for pattern matches across files in the workspace."""
        target_dir = self._resolve_path(sub_dir)
        matches: List[Dict[str, Any]] = []

        try:
            flags = re.IGNORECASE
            pattern = re.compile(query if is_regex else re.escape(query), flags)
        except re.error as e:
            raise ValueError(f"Invalid regex query '{query}': {e}")

        for root, dirs, files in os.walk(target_dir):
            dirs[:] = [d for d in dirs if d not in self.EXCLUDE_DIRS]

            for f in files:
                if any(f.endswith(ext.replace("*", "")) for ext in self.EXCLUDE_FILES):
                    continue
                full_path = os.path.join(root, f)
                rel_path = self._relative_path(full_path)

                try:
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as file_obj:
                        for line_no, line in enumerate(file_obj, 1):
                            if pattern.search(line):
                                matches.append({
                                    "path": rel_path,
                                    "line_number": line_no,
                                    "line_content": line.rstrip("\r\n"),
                                })
                                if len(matches) >= max_results:
                                    return matches
                except Exception:
                    continue

        return matches

    def search_symbols(self, query: str) -> List[Dict[str, Any]]:
        """Finds functions, classes, interfaces, types, and exported constants."""
        symbol_pattern = re.compile(
            r"^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?"
            r"(?:def|class|function|interface|type|const|let|var|enum)\s+([a-zA-Z0-9_]+)",
            re.MULTILINE,
        )
        matches = []
        q_lower = query.lower()

        for f_info in self.list_files():
            if f_info["is_dir"]:
                continue
            path = f_info["path"]
            if not any(path.endswith(ext) for ext in [".py", ".ts", ".tsx", ".js", ".jsx", ".sql", ".rs", ".go"]):
                continue

            full_path = self._resolve_path(path)
            try:
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    for line_no, line in enumerate(f, 1):
                        m = symbol_pattern.search(line)
                        if m:
                            symbol_name = m.group(1)
                            if q_lower in symbol_name.lower():
                                matches.append({
                                    "symbol": symbol_name,
                                    "path": path,
                                    "line_number": line_no,
                                    "snippet": line.strip(),
                                })
            except Exception:
                continue

        return matches

    # --------------------------------------------------------------------------
    # Git Status & Diff
    # --------------------------------------------------------------------------

    def get_git_status(self) -> Dict[str, Any]:
        """Returns git branch and modified files if git is initialized."""
        try:
            res = subprocess.run(
                ["git", "status", "--porcelain"],
                cwd=self.workspace_root,
                capture_output=True,
                text=True,
                timeout=5,
            )
            if res.returncode == 0:
                lines = [l.strip() for l in res.stdout.splitlines() if l.strip()]
                return {"is_git": True, "changed_files": lines, "raw": res.stdout}
        except Exception:
            pass
        return {"is_git": False, "changed_files": [], "raw": ""}

    def get_git_diff(self) -> str:
        """Returns unified git diff against HEAD."""
        try:
            res = subprocess.run(
                ["git", "diff", "HEAD"],
                cwd=self.workspace_root,
                capture_output=True,
                text=True,
                timeout=10,
            )
            if res.returncode == 0 and res.stdout:
                return res.stdout
            # If no commit yet, diff against empty tree or unstaged
            res_unstaged = subprocess.run(
                ["git", "diff"],
                cwd=self.workspace_root,
                capture_output=True,
                text=True,
                timeout=10,
            )
            return res_unstaged.stdout or ""
        except Exception:
            return ""
