'use client';

import { useEffect, useState } from 'react';
import { Archive, ChevronRight, FileText, LoaderCircle } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import NoteActions from './NoteActions';

interface ArchivedFile {
  name: string;
  relativePath: string;
  folder: string;
  size: number;
  mtime: number;
}

/**
 * Archive maps to the Vault's own `archive/YYYY-MM-DD/...` folders. The MCP
 * server moves notes there, so this view only lists and restores them.
 */
export default function ArchiveView({ refreshKey = 0, onChanged }: { refreshKey?: number; onChanged?: () => void }) {
  const [files, setFiles] = useState<ArchivedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ArchivedFile | null>(null);
  const [content, setContent] = useState<any>(null);
  const [contentLoading, setContentLoading] = useState(false);

  const loadArchive = async () => {
    setLoading(true);
    setError(null);
    try {
      // Archive keeps the note's original path under archive/<date>/, so one
      // recursive read lists every archived note regardless of nesting depth.
      const data = await fetch('/api/files?path=archive&recursive=1').then(r => r.json());
      // A Vault that has never archived anything simply has no archive folder yet.
      const missingArchive = data.error && /ENOENT|no such file|inside the Vault/i.test(String(data.error));
      if (data.error && !missingArchive) { setError(data.error); return; }
      setFiles((data.files || []).map((file: any) => ({
        name: file.name,
        relativePath: file.relativePath,
        folder: file.relativePath.split('/').slice(0, 2).join('/'),
        size: file.size,
        mtime: file.mtime,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read the archive.');
    } finally { setLoading(false); }
  };

  useEffect(() => { void loadArchive(); }, [refreshKey]);

  const open = async (file: ArchivedFile) => {
    setSelected(file);
    setContent(null);
    setContentLoading(true);
    try {
      const response = await fetch(`/api/files/${encodeURIComponent(file.relativePath)}`);
      const data = await response.json();
      if (!response.ok || data.error) setError(data.error || 'This note could not be opened.');
      else setContent(data);
    } finally { setContentLoading(false); }
  };

  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex h-full">
      <div className="flex-1 min-w-0">
        <div className="px-4 py-2 border-b border-border bg-surface-variant/50 flex items-center gap-2">
          <Archive className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-medium text-on-surface">Archive</h2>
          <span className="text-xs text-on-surface-variant">Notes you archived, kept inside your Vault</span>
        </div>

        <div className="overflow-auto" style={{ height: 'calc(100vh - 300px)' }}>
          {loading ? (
            <div className="p-8 text-center">
              <LoaderCircle className="w-8 h-8 text-primary mx-auto animate-spin" />
              <p className="mt-2 text-sm text-on-surface-variant">Reading archive…</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center"><p className="text-red-500">{error}</p></div>
          ) : files.length === 0 ? (
            <div className="p-8 text-center">
              <Archive className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-on-surface-variant">Nothing archived yet</p>
              <p className="mt-1 text-xs text-on-surface-variant">Archiving a note moves it to an <span className="font-mono">archive/&lt;date&gt;</span> folder. Nothing is deleted.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {files.map((file) => (
                <button
                  key={file.relativePath}
                  onClick={() => void open(file)}
                  className={`w-full px-4 py-3 text-left hover:bg-hover transition-colors flex items-center ${selected?.relativePath === file.relativePath ? 'bg-active' : ''}`}
                >
                  <FileText className="w-4 h-4 text-blue-500 mr-3 flex-shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium text-on-surface truncate">{file.name}</span>
                    <span className="block text-xs text-on-surface-variant font-mono truncate mt-0.5">{file.relativePath}</span>
                  </span>
                  <span className="text-xs text-on-surface-variant ml-3">{formatDate(file.mtime)}</span>
                  <ChevronRight className="w-4 h-4 text-on-surface-variant ml-2" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="w-[26rem] max-w-[45%] border-l border-border bg-surface flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-border flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-on-surface truncate">{selected.name}</h2>
              <p className="text-[11px] text-on-surface-variant font-mono truncate">{selected.relativePath}</p>
            </div>
            <button onClick={() => { setSelected(null); setContent(null); }} className="text-xs text-on-surface-variant hover:text-on-surface px-2 py-1 rounded hover:bg-hover">Close</button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {contentLoading
              ? <div className="flex items-center gap-2 text-sm text-on-surface-variant"><LoaderCircle className="w-4 h-4 animate-spin" /> Loading note…</div>
              : content ? <MarkdownRenderer content={content.content || ''} /> : null}
          </div>
          <NoteActions
            path={selected.relativePath}
            rawContent={content?.rawContent || ''}
            onChanged={() => { setSelected(null); setContent(null); onChanged?.(); void loadArchive(); }}
          />
        </div>
      )}
    </div>
  );
}
