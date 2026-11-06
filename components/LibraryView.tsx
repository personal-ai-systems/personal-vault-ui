'use client';

import { useEffect, useState } from 'react';
import { FileText, Files, LoaderCircle, RefreshCw, Upload } from 'lucide-react';
import FileBrowser from './FileBrowser';
import { emptyState } from '@/lib/content-view.mjs';

interface Material {
  path: string; relativePath: string; name: string; title?: string; mtime: number; size: number;
  type: string; groupYear: string | null; groupMonth: string | null;
}
interface Props {
  kind: 'notes' | 'files'; refreshKey: number; onChanged: () => void;
  onNewNote: () => void; onImportOpenAI: () => Promise<boolean>;
  importBusy?: boolean; importMessage?: string | null;
  initialOpen?: string | null; onOpened?: () => void;
}
export default function LibraryView({ kind, refreshKey, onChanged, onNewNote, onImportOpenAI, importBusy, importMessage, initialOpen, onOpened }: Props) {
  const [files, setFiles] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [filter, setFilter] = useState(kind === 'files' ? 'documents' : 'all');
  const [year, setYear] = useState('all');
  const [selected, setSelected] = useState<Material | null>(null);
  const [previewFolder, setPreviewFolder] = useState('');
  const [openRequest, setOpenRequest] = useState<string | null>(null);
  useEffect(() => {
    const abort = new AbortController(); setLoading(true); setError(null);
    const read = async (collection: string) => {
      const response = await fetch('/api/materials?kind=' + collection, { signal: abort.signal });
      const data = await response.json(); if (!response.ok || data.error) throw Error(data.error || 'Your files could not be loaded.'); return data;
    };
    Promise.all(kind === 'notes' ? [read('notes')] : [read('files'), read('exports')]).then(results => {
      if (abort.signal.aborted) return;
      const unique = new Map<string, Material>(); for (const result of results) for (const file of result.files || []) unique.set(file.relativePath, file);
      setFiles([...unique.values()]); setWarning(results.map(r => r.listingWarning).filter(Boolean).join(' ') || null);
    }).catch(err => { if (!abort.signal.aborted) setError(err.message); }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [kind, refreshKey]);
  useEffect(() => { setSelected(null); setOpenRequest(null); setFilter(kind === 'files' ? 'documents' : 'all'); setYear('all'); }, [kind]);
  useEffect(() => {
    if (!initialOpen) return;
    setSelected({ path: initialOpen, relativePath: initialOpen, name: initialOpen.split('/').pop() || initialOpen, size: 0, mtime: Date.now(), type: 'Note', groupYear: null, groupMonth: null });
    setPreviewFolder(initialOpen.split('/').slice(0, -1).join('/')); setOpenRequest(initialOpen); onOpened?.();
  }, [initialOpen, onOpened]);
  const years = [...new Set(files.map(file => file.groupYear).filter(Boolean))].sort().reverse();
  const matchesFilter = (file: Material) => filter === 'all' || (filter === 'documents'
    ? ['Note', 'PDF', 'Document', 'Image', 'Video', 'Audio', 'Spreadsheet', 'Presentation'].includes(file.type)
    : filter === 'exports' ? /^(exports|output)\//.test(file.relativePath) : file.type === filter);
  const visible = files.filter(file => (year === 'all' || file.groupYear === year) && matchesFilter(file));
  // An empty collection and an over-narrow filter need different next steps.
  const collectionState = emptyState({ total: files.length, visible: visible.length });
  // Clear to the widest view, not the default one: the default filter can be the
  // very thing hiding the rows this button is offered to reveal.
  const clearFilters = () => { setYear('all'); setFilter('all'); };
  const groups = new Map<string, Material[]>();
  for (const file of visible) { const key = file.groupYear && file.groupMonth ? `${file.groupYear}-${file.groupMonth}` : 'unknown'; groups.set(key, [...(groups.get(key) || []), file]); }
  const grouped = [...groups.entries()].sort(([a], [b]) => a === 'unknown' ? 1 : b === 'unknown' ? -1 : b.localeCompare(a));
  const title = kind === 'notes' ? 'Memory' : 'Files';
  const open = (file: Material) => { setSelected(file); setPreviewFolder(file.relativePath.split('/').slice(0, -1).join('/')); setOpenRequest(file.relativePath); };
  return <div className="flex h-full min-w-0">
    <div className={`${selected ? 'hidden md:flex' : 'flex'} min-w-0 flex-1 flex-col`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div><h2 className="text-lg font-semibold text-on-surface">{title}</h2><p className="text-sm text-on-surface-variant">{kind === 'notes' ? 'Your saved thoughts and conversations' : 'Your documents, images, videos and other saved files'}</p></div>
        <button onClick={onChanged} aria-label={`Refresh ${title}`} className="rounded-lg p-2 hover:bg-hover"><RefreshCw className="h-4 w-4" /></button>
        {years.length > 1 && <label className="flex items-center gap-2 text-sm text-on-surface-variant">Year<select aria-label="Year" value={year} onChange={e => setYear(e.target.value)} className="rounded-lg border border-border bg-surface p-2 text-on-surface"><option value="all">All years</option>{years.map(value => <option key={value!}>{value}</option>)}</select></label>}
        {kind === 'files' && <label className="flex items-center gap-2 text-sm text-on-surface-variant">Show<select aria-label="File type" value={filter} onChange={e => setFilter(e.target.value)} className="max-w-full rounded-lg border border-border bg-surface p-2 text-on-surface"><option value="documents">Documents & media</option><option value="all">All file types</option><option value="exports">Exports only</option>{['Image', 'Document', 'PDF', 'Video', 'Audio', 'Spreadsheet', 'Presentation', 'Other'].map(type => <option key={type}>{type}</option>)}</select></label>}
      </div>
      <div className="flex-1 overflow-auto">
        {loading ? <p role="status" className="p-8 text-center text-sm text-on-surface-variant"><LoaderCircle className="mx-auto mb-3 h-6 w-6 animate-spin" />Loading your {kind}…</p>
        : error ? <p role="alert" className="p-6 text-red-600">{error}</p>
        : <>{warning && <p role="status" className="m-4 rounded-lg border border-amber-500 p-3 text-sm">{warning}</p>}
          {kind === 'files' && filter === 'documents' && files.some(file => !matchesFilter(file)) && <p className="px-5 py-2 text-xs text-on-surface-variant">Other file types are available under “All file types”.</p>}
          {collectionState === 'no-matches' && <div className="mx-auto max-w-lg p-10 text-center"><Files className="mx-auto h-10 w-10 text-on-surface-variant" /><h3 className="mt-4 text-lg font-medium">Nothing matches these filters</h3><p className="mt-2 text-sm text-on-surface-variant">Nothing was lost: all {files.length} {kind === 'notes' ? (files.length === 1 ? 'memory' : 'memories') : (files.length === 1 ? 'file' : 'files')} {files.length === 1 ? 'is' : 'are'} still saved. The selected year or file type hides {files.length === 1 ? 'it' : 'them'}.</p><button onClick={clearFilters} className="mt-5 rounded-xl border border-border px-4 py-2 hover:bg-hover">Clear filters</button></div>}
          {collectionState === 'empty' && <div className="mx-auto max-w-lg p-10 text-center"><Files className="mx-auto h-10 w-10 text-on-surface-variant" /><h3 className="mt-4 text-lg font-medium">{kind === 'notes' ? 'A place for what you want to remember' : 'No files to show yet'}</h3><p className="mt-2 text-sm text-on-surface-variant">{kind === 'notes' ? 'Save what happened, a thought, or a conversation you want to keep.' : 'Documents and media you save or export appear here. Attachments stay with their memories.'}</p>{kind === 'notes' && <div className="mt-5 flex flex-wrap justify-center gap-3"><button onClick={onNewNote} className="rounded-xl bg-primary px-4 py-2 text-white">Add to memory</button><button onClick={() => void onImportOpenAI()} disabled={importBusy} className="flex items-center gap-2 rounded-xl border border-border px-4 py-2"><Upload className="h-4 w-4" />Import conversations</button></div>}</div>}
          {grouped.map(([group, items]) => <section key={group} aria-label={group === 'unknown' ? 'Date unknown' : group}>
            <h3 className="sticky top-0 border-b border-border bg-surface px-5 py-3 text-sm font-medium text-on-surface-variant">{group === 'unknown' ? 'Date unknown' : new Date(Number(group.slice(0, 4)), Number(group.slice(5)) - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h3>
            {items.sort((a, b) => b.mtime - a.mtime).map(file => (
              <button key={file.relativePath} data-material-path={file.relativePath} onClick={() => open(file)}
                className={`flex w-full items-center gap-3 border-b border-border px-5 py-4 text-left hover:bg-hover ${selected?.relativePath === file.relativePath ? 'bg-active' : ''}`}>
                <FileText className="h-5 w-5 shrink-0 text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-on-surface">{kind === 'notes' ? file.title || file.name.replace(/\.md$/i, '') : file.name}</span>
                  <span className="mt-1 block text-xs text-on-surface-variant">{file.type === 'Note' ? 'Memory' : file.type} · Updated {new Date(file.mtime).toLocaleDateString()} · {Math.max(1, Math.round(file.size / 1024))} KB</span>
                </span>
              </button>
            ))}
          </section>)}
        </>}
        {importMessage && <p role="status" className="p-4 text-sm text-on-surface-variant">{importMessage}</p>}
      </div>
    </div>
    {selected && <div className="w-full min-w-0 md:w-[48%] md:border-l border-border"><FileBrowser detailOnly path={previewFolder} onPathChange={setPreviewFolder} openFile={openRequest} onOpenedFile={() => setOpenRequest(null)} onClosePreview={() => setSelected(null)} onNewNote={onNewNote} onImportOpenAI={onImportOpenAI} refreshKey={refreshKey} onChanged={onChanged} /></div>}
  </div>;
}
