import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/sidebar/Sidebar';
import { listDocuments, uploadDocument } from '../services/conversations';
import { DocumentItem } from '../types/conversation';
import { Database, UploadCloud, Search, FileText, CheckCircle2, Layers } from 'lucide-react';

export const KnowledgePage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [search, setSearch] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchDocs = async () => {
    try {
      const data = await listDocuments();
      setDocuments(data);
    } catch (e) {
      console.error('Failed to load documents:', e);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setStatusMsg(null);
    try {
      const res = await uploadDocument(file);
      setStatusMsg(`Successfully ingested '${file.name}' with ${res.document.chunk_count} vector chunks.`);
      setFile(null);
      fetchDocs();
    } catch (e: any) {
      setStatusMsg(e.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const filteredDocs = documents.filter((d) =>
    d.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0D0E] font-sans selection:bg-[#76B900]/30 selection:text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-y-auto bg-[#0B0D0E] text-gray-100">
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 space-y-6">
          {/* Title Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#242A2E] pb-4">
            <div>
              <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-[#76B900]" />
                <span>Knowledge Sources & RAG Vector Base</span>
              </h1>
              <p className="text-xs text-gray-400">
                Upload documents, architecture guides, or code files to ingest into PostgreSQL pgvector for grounded RAG answers.
              </p>
            </div>
          </div>

          {/* File Upload Box */}
          <div className="bg-[#15191C] border border-[#242A2E] rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="border-2 border-dashed border-[#242A2E] hover:border-[#76B900]/60 rounded-xl p-8 text-center transition">
              <UploadCloud className="w-10 h-10 text-[#76B900] mx-auto mb-2" />
              <input
                type="file"
                accept=".txt,.md,.json,.csv,.py,.js,.ts,.pdf,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="knowledge-file-input"
              />
              <label
                htmlFor="knowledge-file-input"
                className="cursor-pointer text-xs font-semibold text-[#76B900] hover:underline"
              >
                {file ? file.name : 'Drag & drop knowledge files here or click to browse'}
              </label>
              <p className="text-[11px] text-gray-500 mt-1">
                Supports PDF, DOCX, TXT, MD, CSV, JSON, Python files up to 25MB
              </p>
            </div>

            {statusMsg && (
              <div className="p-3 rounded-xl bg-[#76B900]/10 border border-[#76B900]/30 text-[#76B900] text-xs flex items-center gap-2 font-mono">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{statusMsg}</span>
              </div>
            )}

            {file && (
              <div className="flex justify-end">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-tr from-[#76B900] to-emerald-400 hover:from-[#84cc16] hover:to-emerald-300 text-black font-extrabold text-xs transition shadow-lg shadow-[#76B900]/20"
                >
                  {uploading ? 'Ingesting Vector Chunks...' : 'Upload & Ingest to Vector Base'}
                </button>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2 bg-[#15191C] border border-[#242A2E] rounded-xl px-3 py-2 text-xs">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search knowledge files..."
              className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none font-sans"
            />
          </div>

          {/* Documents Grid */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 font-mono">
              Ingested Vector Sources ({filteredDocs.length})
            </h2>

            {filteredDocs.length === 0 ? (
              <div className="bg-[#15191C] border border-[#242A2E] rounded-2xl p-8 text-center text-xs text-gray-500 font-mono">
                No knowledge sources ingested yet. Upload files above to build your grounded RAG context.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-[#15191C] border border-[#242A2E] hover:border-[#76B900]/50 rounded-2xl p-4 transition group flex items-start justify-between gap-3 shadow-md"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#0B0D0E] border border-[#242A2E] flex items-center justify-center text-[#76B900] shrink-0 mt-0.5">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <h3 className="text-xs font-semibold text-white truncate group-hover:text-[#76B900] transition">
                          {doc.filename}
                        </h3>
                        <div className="flex items-center gap-3 text-[11px] text-gray-400 font-mono">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3 text-cyan-400" /> {doc.chunk_count} Chunks
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px]">
                            RAG Active
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
