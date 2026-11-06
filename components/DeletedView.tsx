'use client';
import { useEffect, useState } from 'react';
import { ArchiveRestore, LoaderCircle, Trash2 } from 'lucide-react';

interface DeletedFile { path: string; originalPath: string; deletedOn: string; canRestore: boolean; }
export default function DeletedView({ refreshKey, onChanged }: { refreshKey: number; onChanged: () => void }) {
  const [items, setItems] = useState<DeletedFile[]>([]);
  const [unsupported, setUnsupported] = useState<{ path: string; reason: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    const abort = new AbortController(); setLoading(true); setError(null);
    fetch('/api/deleted', { signal: abort.signal }).then(async response => {
      const data = await response.json(); if (!response.ok || data.error) throw Error(data.error || 'Recently Deleted could not be loaded.'); return data;
    }).then(data => { if (!abort.signal.aborted) { setItems(data.items || []); setUnsupported(data.unsupported || []); setTruncated(!!data.truncated); } })
      .catch(err => { if (!abort.signal.aborted) setError(err.message); }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [refreshKey]);
  const restore = async (file: DeletedFile) => {
    setBusy(file.path); setError(null); setMessage(null);
    try {
      const response = await fetch('/api/vault', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ operation: 'restore_deleted', args: { path: file.path } }) });
      const data = await response.json(); if (!response.ok || data.error) throw Error(data.error || 'This file could not be restored.');
      setMessage('Restored. Your file is back in its original folder.'); onChanged();
    } catch (err) { setError(err instanceof Error ? err.message : 'This file could not be restored.'); }
    finally { setBusy(null); }
  };
  return <div className="h-full overflow-auto"><header className="border-b border-border px-5 py-5"><h2 className="text-lg font-semibold">Recently Deleted</h2><p className="mt-1 text-sm text-on-surface-variant">Files you deleted can be restored here. Nothing is automatically erased.</p></header>
    {loading && <p role="status" className="p-8 text-center"><LoaderCircle className="mx-auto h-6 w-6 animate-spin" /></p>}
    {error && <p role="alert" className="m-4 rounded-lg border border-red-500 p-3 text-sm text-red-600">{error}</p>}
    {message && <p role="status" className="m-4 text-sm text-primary">{message}</p>}
    {!loading && !error && !items.length && !unsupported.length && <div className="p-12 text-center text-on-surface-variant"><Trash2 className="mx-auto mb-4 h-10 w-10" /><p>No recently deleted files</p><p className="mt-2 text-sm">Archived memories are kept separately in Archive.</p></div>}
    {truncated && <p role="status" className="m-4 text-sm">This is a partial list. More deleted files may be present.</p>}
    {items.map(file => <div key={file.path} data-deleted-path={file.path} className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4"><Trash2 className="h-5 w-5 text-on-surface-variant" /><div className="min-w-0 flex-1"><p className="truncate font-medium">{file.originalPath.split('/').pop()}</p><p className="mt-1 text-xs text-on-surface-variant">Deleted {file.deletedOn}</p><details className="mt-1 text-xs text-on-surface-variant"><summary className="cursor-pointer">Original folder</summary><p className="break-all">{file.originalPath}</p></details></div><button onClick={() => void restore(file)} disabled={busy !== null || !file.canRestore} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-hover disabled:opacity-50"><ArchiveRestore className="h-4 w-4" />{busy === file.path ? 'Restoring…' : 'Restore'}</button></div>)}
    {!!unsupported.length && <details className="m-5 rounded-lg border border-border p-4"><summary className="cursor-pointer text-sm">Older deleted files need manual recovery ({unsupported.length})</summary><p className="mt-2 text-sm text-on-surface-variant">These files are kept unchanged. Their original location cannot be safely restored automatically.</p>{unsupported.map(file => <p key={file.path} className="mt-2 break-all font-mono text-xs">{file.path}</p>)}</details>}
  </div>;
}
