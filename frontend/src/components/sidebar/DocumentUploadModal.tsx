import React, { useState, useEffect } from 'react';
import { X, UploadCloud, Database, CheckCircle2, AlertCircle, Loader2, FileText } from 'lucide-react';
import { uploadBatchDocuments, listDocuments } from '../../services/conversations';
import { useChatStore } from '../../store/chatStore';

interface BatchFileStatus {
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
  chunkCount?: number;
}

export const DocumentUploadModal: React.FC = () => {
  const { isDocumentModalOpen, setDocumentModalOpen, documents, setDocuments, addDocument } = useChatStore();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileStatuses, setFileStatuses] = useState<BatchFileStatus[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isDocumentModalOpen) {
      listDocuments()
        .then(setDocuments)
        .catch((err) => console.error('Failed to load documents:', err));
    }
  }, [isDocumentModalOpen]);

  if (!isDocumentModalOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 10);
    setSelectedFiles(files);
    setFileStatuses(
      files.map((f) => ({
        file: f,
        status: 'pending',
      }))
    );
    setMessage(null);
  };

  const handleUploadBatch = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setMessage(null);

    setFileStatuses((prev) =>
      prev.map((s) => ({ ...s, status: 'processing' }))
    );

    try {
      const res = await uploadBatchDocuments(selectedFiles);
      
      const updatedStatuses: BatchFileStatus[] = selectedFiles.map((f) => {
        const match = res.results.find((r) => r.filename === f.name);
        if (match && match.status === 'completed' && match.document) {
          addDocument(match.document);
          return {
            file: f,
            status: 'completed',
            chunkCount: match.document.chunk_count,
          };
        }
        return {
          file: f,
          status: 'failed',
          error: match?.error || 'Ingestion error',
        };
      });

      setFileStatuses(updatedStatuses);
      setMessage({ type: 'success', text: res.message });
      setSelectedFiles([]);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Batch upload failed.' });
      setFileStatuses((prev) =>
        prev.map((s) => ({ ...s, status: 'failed', error: e.message }))
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0B0D0E] dark:bg-[#0B0D0E] light:bg-[#FFFFFF] border border-[#76B900]/50 dark:border-[#76B900]/50 light:border-[#CBD5E1] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#242A2E] dark:border-[#242A2E] light:border-[#E2E8F0] flex items-center justify-between bg-[#15191C] dark:bg-[#15191C] light:bg-[#F8FAFC]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#76B900]/15 border border-[#76B900]/40 flex items-center justify-center text-[#76B900]">
              <Database className="w-4 h-4 text-[#76B900]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white dark:text-white light:text-[#0F172A] tracking-wide">PostgreSQL RAG Knowledge Documents</h3>
              <p className="text-[10px] text-[#76B900] dark:text-[#76B900] light:text-[#3f6212] font-mono font-bold">Parallel Async Batch Ingestion (Up to 10 Files)</p>
            </div>
          </div>
          <button
            onClick={() => setDocumentModalOpen(false)}
            className="p-1.5 rounded-lg hover:bg-[#242A2E] light:hover:bg-[#E2E8F0] text-gray-400 dark:text-gray-400 light:text-gray-600 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
          <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 leading-relaxed">
            Select up to <strong className="text-white dark:text-white light:text-[#0F172A] font-mono">10 files</strong> to upload and process in parallel. Embeddings, metadata, and vectors are saved directly to PostgreSQL.
          </p>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-[#242A2E] dark:border-[#242A2E] light:border-[#CBD5E1] hover:border-[#76B900]/70 rounded-xl p-6 text-center bg-[#15191C]/50 dark:bg-[#15191C]/50 light:bg-[#F1F5F9] transition group">
            <UploadCloud className="w-8 h-8 text-[#76B900] mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <input
              type="file"
              multiple
              accept=".txt,.md,.json,.csv,.py,.js,.ts,.pdf,.docx"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload-input"
            />
            <label
              htmlFor="file-upload-input"
              className="cursor-pointer text-xs font-bold text-[#76B900] dark:text-[#76B900] light:text-[#3f6212] hover:underline"
            >
              {selectedFiles.length > 0
                ? `${selectedFiles.length} file(s) selected (Click to change)`
                : 'Choose up to 10 files to upload'}
            </label>
            <p className="text-[10px] text-gray-500 dark:text-gray-500 light:text-gray-600 mt-1">Supports PDF, DOCX, TXT, MD, Code, JSON, CSV files</p>
          </div>

          {/* Selected Files Progress Tracker */}
          {fileStatuses.length > 0 && (
            <div className="space-y-1.5 bg-[#15191C] dark:bg-[#15191C] light:bg-[#F8FAFC] border border-[#242A2E] dark:border-[#242A2E] light:border-[#E2E8F0] p-3 rounded-xl max-h-36 overflow-y-auto font-mono text-xs">
              <p className="text-[10px] text-gray-400 dark:text-gray-400 light:text-gray-600 font-bold uppercase tracking-wider mb-1">Batch Progress ({fileStatuses.length} Files)</p>
              {fileStatuses.map((fs, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] py-1 border-b border-[#242A2E]/50 dark:border-[#242A2E]/50 light:border-[#E2E8F0] last:border-0">
                  <div className="flex items-center gap-1.5 truncate max-w-[220px]">
                    <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-gray-200 dark:text-gray-200 light:text-gray-800 truncate">{fs.file.name}</span>
                  </div>

                  <div className="shrink-0">
                    {fs.status === 'pending' && <span className="text-gray-400">Ready</span>}
                    {fs.status === 'processing' && (
                      <span className="flex items-center gap-1 text-[#76B900] animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Ingesting...
                      </span>
                    )}
                    {fs.status === 'completed' && (
                      <span className="flex items-center gap-1 text-emerald-500 font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Ingested ({fs.chunkCount} chunks)
                      </span>
                    )}
                    {fs.status === 'failed' && (
                      <span className="flex items-center gap-1 text-red-500 font-bold">
                        <AlertCircle className="w-3 h-3 text-red-500" />
                        Failed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {message && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-[#76B900]/15 border border-[#76B900]/40 text-[#76B900] dark:text-[#76B900] light:text-[#3f6212]'
                  : 'bg-red-500/10 border border-red-500/30 text-red-500'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-[#76B900] shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Action Upload Button */}
          <button
            onClick={handleUploadBatch}
            disabled={selectedFiles.length === 0 || uploading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#76B900] to-emerald-500 hover:from-[#84cc16] hover:to-emerald-400 disabled:opacity-40 disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500 text-black font-extrabold text-xs shadow-lg transition flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Processing Parallel Async Batch...</span>
              </>
            ) : (
              <span>Upload & Ingest {selectedFiles.length ? `(${selectedFiles.length} Files)` : 'Batch'}</span>
            )}
          </button>

          {/* Ingested PostgreSQL Documents List */}
          <div className="pt-3 border-t border-[#242A2E] dark:border-[#242A2E] light:border-[#E2E8F0]">
            <h4 className="text-xs font-bold text-gray-300 dark:text-gray-300 light:text-gray-700 mb-2 flex items-center justify-between font-mono">
              <span>PostgreSQL Ingested Knowledge Base</span>
              <span className="text-[#76B900] dark:text-[#76B900] light:text-[#3f6212]">({documents.length})</span>
            </h4>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 font-mono">
              {documents.length === 0 ? (
                <p className="text-[11px] text-gray-500 italic py-1">No PostgreSQL documents ingested yet.</p>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#15191C] dark:bg-[#15191C] light:bg-[#F8FAFC] border border-[#242A2E] dark:border-[#242A2E] light:border-[#E2E8F0] text-xs text-gray-300"
                  >
                    <span className="text-[11px] truncate max-w-[220px] text-[#76B900] dark:text-[#76B900] light:text-[#3f6212] font-bold">{doc.filename}</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-400 light:text-gray-600 font-sans">{doc.chunk_count} chunks</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
