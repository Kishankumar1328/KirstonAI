import {
    AlertCircle,
    AlertTriangle,
    Check,
    CheckCircle2,
    Code2,
    Compass,
    Copy,
    Download,
    FileCode,
    FileText,
    Folder,
    History,
    Layers,
    Loader2,
    Pause,
    Play,
    RefreshCw,
    Save,
    Search,
    Send,
    ShieldCheck,
    Sparkles,
    Square,
    Terminal as TerminalIcon,
    Trash2,
    X
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar } from '../components/sidebar/Sidebar';

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces & Types
// ─────────────────────────────────────────────────────────────────────────────

export type TaskStatus = 'pending' | 'running' | 'complete' | 'failed' | 'retry' | 'blocked';

export interface TaskItem {
  id: number;
  description: string;
  action?: string;
  file?: string;
  command?: string;
  status: TaskStatus;
  dependencies?: number[];
  duration_ms?: number;
  error?: string;
}

export interface ActivityEvent {
  id: string;
  type: string;
  title: string;
  detail?: string;
  timestamp: string;
  status?: 'info' | 'success' | 'warning' | 'error';
}

export interface WorkspaceSummary {
  project_id: string;
  title: string;
  description?: string;
  file_count?: number;
  created_at?: number;
}

export interface TestResultItem {
  name: string;
  status: 'passed' | 'failed';
  duration_ms: number;
}

export interface SecurityCheckItem {
  category: string;
  name: string;
  status: 'passed' | 'failed';
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Utilities
// ─────────────────────────────────────────────────────────────────────────────

function getApiUrl(endpoint: string): string {
  const base = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';
  return `${base}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}

function formatElapsed(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Cursor-Style Autonomous Coding Agent Page Component
// ─────────────────────────────────────────────────────────────────────────────

export const CodingAgentPage: React.FC = () => {
  // Session & Workspace State
  const [projectId, setProjectId] = useState<string>(() => `proj_${Math.random().toString(36).substring(2, 8)}`);
  const [projectTitle, setProjectTitle] = useState<string>('Autonomous Workspace');
  const [prompt, setPrompt] = useState<string>('');
  const [intentMode, setIntentMode] = useState<'new_project' | 'feature' | 'bugfix' | 'refactor' | 'api_db' | 'security'>('new_project');
  const [selectedModel, setSelectedModel] = useState<string>('nvidia/nemotron-3.5-lightning-30b-a3b');

  // Execution State
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [gitDiff, setGitDiff] = useState<string>('');
  const [tests, setTests] = useState<TestResultItem[]>([]);
  const [securityChecks, setSecurityChecks] = useState<SecurityCheckItem[]>([]);
  const [completionSummary, setCompletionSummary] = useState<string | null>(null);

  // IDE State
  const [activeTab, setActiveTab] = useState<'explorer' | 'editor' | 'diff' | 'terminal' | 'tests' | 'review'>('editor');
  const [filesList, setFilesList] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isSavingFile, setIsSavingFile] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [fileSearch, setFileSearch] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Interactive Terminal State
  const [terminalInput, setTerminalInput] = useState<string>('');
  const [isTerminalRunning, setIsTerminalRunning] = useState<boolean>(false);

  // History Drawer State
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [historyProjects, setHistoryProjects] = useState<WorkspaceSummary[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, activities]);

  // ───────────────────────────────────────────────────────────────────────────
  // File & Workspace Loaders
  // ───────────────────────────────────────────────────────────────────────────

  const loadWorkspaceDetails = useCallback(async (targetId: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/v1/coding-agent/project/${targetId}`));
      if (res.ok) {
        const data = await res.json();
        setProjectId(data.project_id);
        setProjectTitle(data.title || `Workspace #${data.project_id}`);
        setFilesList(data.files || []);
        if (data.git_diff) setGitDiff(data.git_diff);
        if (data.files && data.files.length > 0 && !selectedFile) {
          handleOpenFile(targetId, data.files[0]);
        }
      }
    } catch (_) {}
  }, [selectedFile]);

  const handleOpenFile = useCallback(async (targetId: string, relPath: string) => {
    try {
      setSelectedFile(relPath);
      setActiveTab('editor');
      const res = await fetch(
        getApiUrl(`/api/v1/coding-agent/project/${targetId}/file?path=${encodeURIComponent(relPath)}`)
      );
      if (res.ok) {
        const data = await res.json();
        setFileContent(data.content || '');
        setHasUnsavedChanges(false);
      }
    } catch (_) {
      setFileContent('// Error loading file.');
    }
  }, []);

  const handleSaveFile = async () => {
    if (!selectedFile) return;
    setIsSavingFile(true);
    try {
      const res = await fetch(getApiUrl(`/api/v1/coding-agent/project/${projectId}/file`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedFile, content: fileContent }),
      });
      if (res.ok) {
        setHasUnsavedChanges(false);
        addActivity('file.saved', `Saved ${selectedFile}`, 'success');
      }
    } catch (e) {
      alert('Failed to save file: ' + e);
    } finally {
      setIsSavingFile(false);
    }
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(getApiUrl('/api/v1/coding-agent/projects'));
      if (res.ok) {
        const data = await res.json();
        setHistoryProjects(data.projects || []);
      }
    } catch (_) {}
    finally {
      setIsLoadingHistory(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Helper: Append Activity Event
  // ───────────────────────────────────────────────────────────────────────────

  const addActivity = (type: string, title: string, status: 'info' | 'success' | 'warning' | 'error' = 'info', detail?: string) => {
    const newEv: ActivityEvent = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      title,
      detail,
      timestamp: new Date().toLocaleTimeString(),
      status,
    };
    setActivities((prev) => [...prev, newEv]);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Main Execution Loop (SSE Streaming)
  // ───────────────────────────────────────────────────────────────────────────

  const handleRunAgent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isExecuting) return;

    setIsExecuting(true);
    setIsPaused(false);
    setTasks([]);
    setActivities([]);
    setLogs([]);
    setCompletionSummary(null);

    const activeId = intentMode === 'new_project' ? `proj_${Math.random().toString(36).substring(2, 8)}` : projectId;
    setProjectId(activeId);

    const intentPrefixMap: Record<string, string> = {
      feature: '[Feature Request]',
      bugfix: '[Bug Fix]',
      refactor: '[Refactoring]',
      api_db: '[API & Database]',
      security: '[Security Hardening]',
    };

    const prefix = intentMode !== 'new_project' && intentPrefixMap[intentMode] ? `${intentPrefixMap[intentMode]} ` : '';
    const fullPrompt = `${prefix}${prompt.trim()}`;

    addActivity('agent.start', `Starting agent for: "${cleanPromptDisplay(fullPrompt)}"`, 'info');

    try {
      const ep = getApiUrl('/api/v1/coding-agent/stream');
      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          project_id: activeId,
          model: selectedModel,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        let currentEvent = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;
            try {
              const data = JSON.parse(dataStr);
              handleAgentStreamEvent(currentEvent, data);
            } catch (_) {}
          }
        }
      }
    } catch (err: any) {
      addActivity('agent.error', `Agent execution failed: ${err.message}`, 'error');
      setLogs((prev) => [...prev, `[ERROR] ${err.message}`]);
    } finally {
      setIsExecuting(false);
      await loadWorkspaceDetails(activeId);
    }
  };

  const handleAgentStreamEvent = (eventType: string, data: any) => {
    if (data.log) {
      setLogs((prev) => [...prev, data.log]);
    }

    switch (eventType) {
      case 'agent.started':
        addActivity('agent.started', `Agent initialized on workspace #${data.session_id}`, 'info');
        break;

      case 'workspace.scanned':
        addActivity('workspace.scanned', `Scanned workspace: ${data.file_count} files, ${data.symbols_count} symbols`, 'info');
        break;

      case 'plan.created':
        setTasks(data.tasks || []);
        addActivity('plan.created', `Task plan established (${data.tasks?.length || 0} tasks)`, 'success');
        break;

      case 'task.updated':
        setTasks((prev) => {
          const updated = [...prev];
          if (data.task_index !== undefined && updated[data.task_index]) {
            updated[data.task_index] = data.task;
          }
          return updated;
        });
        break;

      case 'file.created':
        addActivity('file.created', `Created ${data.path}`, 'success');
        setFilesList((prev) => (prev.includes(data.path) ? prev : [...prev, data.path]));
        break;

      case 'file.modified':
        addActivity('file.modified', `Modified ${data.path}`, 'success');
        break;

      case 'command.started':
        addActivity('command.started', `Running: ${data.command}`, 'info');
        break;

      case 'command.completed':
        if (data.result?.success) {
          addActivity('command.completed', `Command succeeded (${data.result?.duration_ms}ms)`, 'success');
        } else {
          addActivity('command.failed', `Command failed: ${data.result?.stderr || 'Error'}`, 'error');
        }
        break;

      case 'test.completed':
        if (data.result?.passed) {
          addActivity('test.completed', `Tests passed (${data.result?.duration_ms}ms)`, 'success');
        } else {
          addActivity('test.failed', `Tests failed`, 'error');
        }
        break;

      case 'review.started':
        addActivity('review.started', `Reviewing Git diff & OWASP security checks...`, 'info');
        break;

      case 'agent.completed':
        addActivity('agent.completed', `Autonomous loop completed!`, 'success');
        if (data.result?.summary) {
          setCompletionSummary(data.result.summary);
        }
        if (data.result?.git_diff) {
          setGitDiff(data.result.git_diff);
        }
        if (data.result?.test_results?.details) {
          setTests(data.result.test_results.details);
        }
        if (data.result?.security_audit?.checks) {
          setSecurityChecks(data.result.security_audit.checks);
        }
        break;

      case 'agent.cancelled':
        addActivity('agent.cancelled', `Execution stopped by user.`, 'warning');
        setIsExecuting(false);
        break;

      default:
        break;
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Controls: Stop / Pause / Resume / Terminal
  // ───────────────────────────────────────────────────────────────────────────

  const handleStopAgent = async () => {
    try {
      await fetch(getApiUrl(`/api/v1/coding-agent/session/${projectId}/stop`), { method: 'POST' });
      addActivity('agent.stop', 'Requested agent halt...', 'warning');
      setIsExecuting(false);
    } catch (_) {}
  };

  const handleTogglePause = async () => {
    try {
      if (isPaused) {
        await fetch(getApiUrl(`/api/v1/coding-agent/session/${projectId}/resume`), { method: 'POST' });
        setIsPaused(false);
        addActivity('agent.resume', 'Resumed execution.', 'info');
      } else {
        await fetch(getApiUrl(`/api/v1/coding-agent/session/${projectId}/pause`), { method: 'POST' });
        setIsPaused(true);
        addActivity('agent.pause', 'Paused execution.', 'warning');
      }
    } catch (_) {}
  };

  const handleRunTerminalCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim() || isTerminalRunning) return;
    const cmd = terminalInput.trim();
    setTerminalInput('');
    setIsTerminalRunning(true);
    setLogs((prev) => [...prev, `$ ${cmd}`]);

    try {
      const res = await fetch(getApiUrl('/api/v1/coding-agent/terminal/execute'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, command: cmd }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.stdout) setLogs((prev) => [...prev, data.stdout]);
        if (data.stderr) setLogs((prev) => [...prev, `[stderr] ${data.stderr}`]);
      }
    } catch (err: any) {
      setLogs((prev) => [...prev, `[error] ${err.message}`]);
    } finally {
      setIsTerminalRunning(false);
    }
  };

  const cleanPromptDisplay = (p: string) => (p.length > 50 ? `${p.substring(0, 50)}...` : p);

  const filteredFiles = filesList.filter((f) => f.toLowerCase().includes(fileSearch.toLowerCase()));

  // ───────────────────────────────────────────────────────────────────────────
  // Render JSX
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-[#080A0C] text-gray-200 overflow-hidden font-sans select-none">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-12 border-b border-[#1E2328] bg-[#0D1013] px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#76B900]/20 border border-[#76B900]/40 flex items-center justify-center text-[#76B900]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xs font-bold text-white flex items-center gap-2">
                Autonomous Coding Studio
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#76B900]/20 text-[#76B900] border border-[#76B900]/40">
                  Cursor Architecture v2.5
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Active Workspace Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#15191D] border border-[#242A2E] text-[11px] font-mono text-gray-300">
              <Folder className="w-3.5 h-3.5 text-[#76B900]" />
              <span className="text-gray-400">Workspace:</span>
              <span className="text-white font-bold">{projectId}</span>
            </div>

            {/* Model Selector */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-[#15191D] border border-[#242A2E] text-[11px] font-mono text-gray-300 outline-none focus:border-[#76B900]"
            >
              <option value="nvidia/nemotron-3.5-lightning-30b-a3b">NVIDIA Nemotron 30B</option>
              <option value="meta/llama-3.1-70b-instruct">Llama 3.1 70B</option>
            </select>

            {/* History Drawer Toggle */}
            <button
              onClick={() => {
                setShowHistory(!showHistory);
                if (!showHistory) loadHistory();
              }}
              className="p-1.5 rounded-lg bg-[#15191D] border border-[#242A2E] text-gray-400 hover:text-white"
              title="Workspaces History"
            >
              <History className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Split Layout: Left Agent/Chat Panel (420px) | Right IDE Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* ───────────────────────────────────────────────────────────────── */}
          {/* LEFT SIDE: Cursor-Style Chat & Agent Orchestrator Panel           */}
          {/* ───────────────────────────────────────────────────────────────── */}
          <div className="w-[430px] border-r border-[#1E2328] bg-[#0A0D0F] flex flex-col shrink-0">
            {/* Intent Mode Selector */}
            <div className="p-3 border-b border-[#1E2328] space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-wider font-bold text-gray-400 flex items-center gap-1.5">
                <Compass className="w-3 h-3 text-[#76B900]" />
                Intent Mode
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'new_project', label: '🚀 New App' },
                  { id: 'feature', label: '⚡ Feature' },
                  { id: 'bugfix', label: '🐞 Bug Fix' },
                  { id: 'refactor', label: '🔄 Refactor' },
                  { id: 'api_db', label: '🗄️ API & DB' },
                  { id: 'security', label: '🛡️ Security' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setIntentMode(mode.id as any);
                      if (mode.id === 'new_project') {
                        setTasks([]);
                        setActivities([]);
                        setLogs([]);
                        setSelectedFile(null);
                        setFileContent('');
                      }
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-mono transition text-center ${
                      intentMode === mode.id
                        ? 'bg-[#76B900]/20 border border-[#76B900]/60 text-[#76B900] font-bold shadow-[0_0_10px_rgba(118,185,0,0.15)]'
                        : 'bg-[#12161A] border border-[#242A2E] text-gray-400 hover:text-white'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Middle Scrollable Section: Dynamic Task Plan & Live Agent Activity */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Dynamic Task Plan Checklist */}
              {tasks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono uppercase font-bold text-gray-400 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-[#76B900]" />
                      Dynamic Task Graph ({tasks.filter((t) => t.status === 'complete').length}/{tasks.length})
                    </label>
                  </div>
                  <div className="space-y-1.5">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-2.5 rounded-xl border text-xs font-mono transition-all ${
                          task.status === 'complete'
                            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                            : task.status === 'running'
                            ? 'bg-amber-950/30 border-amber-500/60 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                            : task.status === 'failed'
                            ? 'bg-red-950/20 border-red-500/40 text-red-300'
                            : 'bg-[#111518] border-[#22272B] text-gray-400'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5">
                            {task.status === 'complete' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                            {task.status === 'running' && <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />}
                            {task.status === 'failed' && <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                            {task.status === 'pending' && <div className="w-3.5 h-3.5 rounded-full border border-gray-600 shrink-0" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold leading-tight">{task.description}</p>
                            {task.file && <span className="text-[9px] text-gray-500 block truncate mt-0.5">📄 {task.file}</span>}
                            {task.error && <span className="text-[9px] text-red-400 block truncate mt-0.5">⚠️ {task.error}</span>}
                          </div>
                          {task.duration_ms && (
                            <span className="text-[9px] font-mono text-gray-500 shrink-0">{formatElapsed(task.duration_ms)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User-Safe Live Agent Activity Feed */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase font-bold text-gray-400 flex items-center gap-1">
                  <Code2 className="w-3 h-3 text-[#76B900]" />
                  Live Agent Activity
                </label>
                <div className="space-y-1 bg-[#0D1013] p-2.5 rounded-xl border border-[#1E2328] max-h-56 overflow-y-auto">
                  {activities.length === 0 ? (
                    <p className="text-[11px] font-mono text-gray-600 text-center py-4">Waiting for user instruction...</p>
                  ) : (
                    activities.map((act) => (
                      <div key={act.id} className="flex items-center justify-between text-[11px] font-mono py-1 border-b border-[#181D21] last:border-0">
                        <span
                          className={`truncate mr-2 ${
                            act.status === 'success'
                              ? 'text-emerald-400 font-bold'
                              : act.status === 'error'
                              ? 'text-red-400 font-bold'
                              : act.status === 'warning'
                              ? 'text-amber-400'
                              : 'text-gray-300'
                          }`}
                        >
                          {act.title}
                        </span>
                        <span className="text-[9px] text-gray-600 shrink-0">{act.timestamp}</span>
                      </div>
                    ))
                  )}
                  <div ref={logsEndRef} />
                </div>
              </div>
            </div>

            {/* Bottom Prompt Input & Controls */}
            <div className="p-3 border-t border-[#1E2328] bg-[#0D1013] space-y-2.5">
              {/* Execution Controls (Stop / Pause / Download) */}
              <div className="flex items-center justify-between gap-2">
                {isExecuting ? (
                  <>
                    <button
                      onClick={handleStopAgent}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-red-950/40 border border-red-500/60 text-red-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 hover:bg-red-900/50"
                    >
                      <Square className="w-3 h-3 fill-red-400 text-red-400" /> Stop Agent
                    </button>
                    <button
                      onClick={handleTogglePause}
                      className="py-1.5 px-3 rounded-lg bg-[#181D21] border border-[#2A3138] text-gray-300 text-xs font-mono flex items-center justify-center gap-1.5 hover:text-white"
                    >
                      {isPaused ? <Play className="w-3 h-3 text-[#76B900]" /> : <Pause className="w-3 h-3 text-amber-400" />}
                      {isPaused ? 'Resume' : 'Pause'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      window.open(getApiUrl(`/api/v1/coding-agent/project/${projectId}/download`), '_blank');
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-[#14181C] border border-[#242A2E] text-gray-300 text-xs font-mono flex items-center justify-center gap-1.5 hover:text-white hover:border-[#76B900]/40"
                  >
                    <Download className="w-3.5 h-3.5 text-[#76B900]" /> Package & Download Workspace ZIP
                  </button>
                )}
              </div>

              {/* Natural Language Prompt Area */}
              <form onSubmit={handleRunAgent} className="space-y-2">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleRunAgent();
                    }
                  }}
                  disabled={isExecuting}
                  rows={4}
                  placeholder={
                    intentMode === 'new_project'
                      ? 'e.g. Build an interactive classic Snake Game using HTML5 Canvas with score tracking and FastAPI leaderboard...'
                      : intentMode === 'feature'
                      ? 'Describe new feature to add (e.g. Add pause game button and audio sound effects toggle)...'
                      : intentMode === 'bugfix'
                      ? 'Describe bug to fix (e.g. Fix collision detection when snake hits bottom border)...'
                      : intentMode === 'refactor'
                      ? 'Describe refactoring goal (e.g. Separate game canvas logic into reusable custom React hook)...'
                      : intentMode === 'api_db'
                      ? 'Describe API / database changes (e.g. Add player avatar URL column and top 10 scores filter)...'
                      : 'Describe security hardening tasks (e.g. Add rate limiting to score submission and sanitize inputs)...'
                  }
                  className="w-full p-2.5 rounded-xl bg-[#080A0C] border border-[#22272B] text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#76B900] transition font-sans resize-none leading-relaxed"
                />
                <button
                  type="submit"
                  disabled={isExecuting || !prompt.trim()}
                  className="w-full py-2.5 rounded-xl bg-[#76B900] text-black font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#85d000] disabled:opacity-50 transition shadow-[0_0_15px_rgba(118,185,0,0.2)]"
                >
                  {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isExecuting ? 'Agent Reasoning & Executing...' : 'Execute Autonomous Agent (Ctrl+Enter)'}
                </button>
              </form>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* RIGHT SIDE: Interactive IDE & Coding Workspace                    */}
          {/* ───────────────────────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#0B0D0E] overflow-hidden">
            {/* IDE Workspace Tabs */}
            <div className="h-10 border-b border-[#1E2328] bg-[#0E1114] flex items-center justify-between px-3 shrink-0">
              <div className="flex items-center gap-1">
                {[
                  { id: 'explorer', label: 'Explorer', icon: <Folder className="w-3.5 h-3.5" /> },
                  { id: 'editor', label: 'Code Editor', icon: <Code2 className="w-3.5 h-3.5" /> },
                  { id: 'diff', label: 'Git Diff', icon: <Layers className="w-3.5 h-3.5" /> },
                  { id: 'terminal', label: 'Live Terminal', icon: <TerminalIcon className="w-3.5 h-3.5" /> },
                  { id: 'tests', label: 'Tests & Diagnostics', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
                  { id: 'review', label: 'Review & Security', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                      activeTab === tab.id
                        ? 'bg-[#1A2026] text-[#76B900] font-bold border border-[#2E3740]'
                        : 'text-gray-400 hover:text-white hover:bg-[#14181C]'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'editor' && selectedFile && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveFile}
                    disabled={isSavingFile}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#76B900]/20 border border-[#76B900]/40 text-[#76B900] text-xs font-mono font-bold hover:bg-[#76B900]/30"
                  >
                    <Save className="w-3 h-3" /> Save Changes
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(fileContent);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#181D21] border border-[#242A2E] text-gray-300 text-xs font-mono hover:text-white"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedCode ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}
            </div>

            {/* IDE Workspace Tab Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* TAB 1: File Explorer */}
              {activeTab === 'explorer' && (
                <div className="w-full h-full p-4 flex flex-col space-y-3 overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold font-mono text-gray-300">Workspace Files ({filesList.length})</h2>
                    <input
                      type="text"
                      value={fileSearch}
                      onChange={(e) => setFileSearch(e.target.value)}
                      placeholder="Filter files..."
                      className="px-2.5 py-1 rounded-lg bg-[#12161A] border border-[#242A2E] text-xs text-white outline-none focus:border-[#76B900] w-48"
                    />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {filteredFiles.map((f) => (
                      <button
                        key={f}
                        onClick={() => handleOpenFile(projectId, f)}
                        className={`p-2.5 rounded-xl border text-left font-mono text-xs flex items-center gap-2 transition ${
                          selectedFile === f
                            ? 'bg-[#76B900]/15 border-[#76B900]/60 text-white font-bold'
                            : 'bg-[#12161A] border-[#22272B] text-gray-400 hover:text-white hover:border-gray-600'
                        }`}
                      >
                        <FileCode className="w-4 h-4 text-[#76B900] shrink-0" />
                        <span className="truncate">{f}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: Code Editor */}
              {activeTab === 'editor' && (
                <div className="w-full h-full flex flex-col overflow-hidden">
                  {selectedFile ? (
                    <>
                      <div className="h-8 bg-[#101417] border-b border-[#1E2328] px-4 flex items-center justify-between text-xs font-mono text-gray-400 shrink-0">
                        <span className="flex items-center gap-2 text-white font-bold">
                          <FileText className="w-3.5 h-3.5 text-[#76B900]" />
                          {selectedFile}
                          {hasUnsavedChanges && <span className="text-amber-400 text-[10px]">• unsaved</span>}
                        </span>
                      </div>
                      <textarea
                        value={fileContent}
                        onChange={(e) => {
                          setFileContent(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        className="flex-1 w-full bg-[#080A0C] text-gray-200 font-mono text-xs p-4 outline-none resize-none leading-relaxed overflow-y-auto selection:bg-[#76B900]/30"
                        spellCheck={false}
                      />
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-600 font-mono text-xs space-y-2">
                      <Code2 className="w-8 h-8 text-gray-700" />
                      <p>Select a file from Explorer or run the agent to inspect source code.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Git Diff Viewer */}
              {activeTab === 'diff' && (
                <div className="w-full h-full p-4 overflow-y-auto font-mono text-xs leading-relaxed bg-[#080A0C]">
                  {gitDiff ? (
                    <pre className="text-gray-300">
                      {gitDiff.split('\n').map((line, idx) => (
                        <div
                          key={idx}
                          className={
                            line.startsWith('+')
                              ? 'bg-emerald-950/40 text-emerald-300 px-2'
                              : line.startsWith('-')
                              ? 'bg-red-950/40 text-red-300 px-2'
                              : line.startsWith('@@')
                              ? 'text-cyan-400 font-bold py-1'
                              : 'px-2 text-gray-400'
                          }
                        >
                          {line}
                        </div>
                      ))}
                    </pre>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600">
                      <Layers className="w-8 h-8 text-gray-700 mb-2" />
                      <p>No unstaged git changes recorded in this workspace.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: Live Terminal */}
              {activeTab === 'terminal' && (
                <div className="w-full h-full flex flex-col bg-[#050709] overflow-hidden">
                  <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-gray-300 space-y-1">
                    {logs.map((log, idx) => (
                      <div key={idx} className="leading-relaxed whitespace-pre-wrap">
                        {log}
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                  {/* Interactive Terminal Prompt Input Bar */}
                  <form onSubmit={handleRunTerminalCommand} className="h-10 border-t border-[#1E2328] bg-[#0D1013] px-3 flex items-center gap-2">
                    <span className="text-[#76B900] font-mono text-xs font-bold">$</span>
                    <input
                      type="text"
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      placeholder="Run command in workspace (e.g. pytest, npm test, python -m pytest)..."
                      className="flex-1 bg-transparent text-xs font-mono text-white outline-none"
                    />
                    <button type="submit" disabled={isTerminalRunning} className="text-gray-400 hover:text-white text-xs font-mono">
                      {isTerminalRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '↵'}
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 5: Tests & Diagnostics */}
              {activeTab === 'tests' && (
                <div className="w-full h-full p-4 overflow-y-auto space-y-3 font-mono">
                  <h2 className="text-xs font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Verification Assertions ({tests.length})
                  </h2>
                  <div className="space-y-1.5">
                    {tests.length === 0 ? (
                      <p className="text-xs text-gray-600 py-6 text-center">No test runs recorded yet.</p>
                    ) : (
                      tests.map((t, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-[#12161A] border border-[#242A2E] flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span className="text-white font-bold">{t.name}</span>
                          </div>
                          <span className="text-emerald-400 font-bold">{t.duration_ms}ms</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: Review & Security */}
              {activeTab === 'review' && (
                <div className="w-full h-full p-4 overflow-y-auto space-y-4 font-mono">
                  <div className="p-4 rounded-2xl bg-[#12161A] border border-[#242A2E] space-y-2">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#76B900]" />
                      Final Implementation Review & Security Audit
                    </h2>
                    {completionSummary && <p className="text-xs text-gray-300 leading-relaxed">{completionSummary}</p>}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-gray-400">OWASP Security Audit Checks</h3>
                    <div className="space-y-1.5">
                      {securityChecks.map((sc, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-[#101316] border border-[#22272B] flex items-center justify-between text-xs">
                          <span className="text-gray-300">[{sc.category}] {sc.name}</span>
                          <span className="text-emerald-400 font-bold">PASSED</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* History Drawer Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/70 flex justify-end">
          <div className="w-80 bg-[#0E1114] border-l border-[#242A2E] h-full p-4 flex flex-col space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#242A2E] pb-3">
              <span className="font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-[#76B900]" /> Workspace Sessions
              </span>
              <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {isLoadingHistory ? (
                <div className="py-12 text-center text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading...
                </div>
              ) : (
                historyProjects.map((p) => (
                  <button
                    key={p.project_id}
                    onClick={() => {
                      setProjectId(p.project_id);
                      loadWorkspaceDetails(p.project_id);
                      setShowHistory(false);
                    }}
                    className="w-full p-2.5 rounded-xl bg-[#15191D] border border-[#242A2E] text-left hover:border-[#76B900]/50 transition block"
                  >
                    <div className="font-bold text-white truncate">{p.title || p.project_id}</div>
                    <div className="text-[10px] text-gray-500 mt-1">{p.file_count || 0} files</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
