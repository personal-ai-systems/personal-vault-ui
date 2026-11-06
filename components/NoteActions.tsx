'use client';

import { useEffect, useState } from 'react';
import { Archive, ArchiveRestore, FileText, LoaderCircle, Paperclip, Save, Trash2, X } from 'lucide-react';
import { noteEditingParts } from '@/lib/editor-text.mjs';

async function callVault(operation: string, args: object) {
  const response = await fetch('/api/vault', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation, args }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'The Vault operation failed.');
  return result;
}

function notePath(folder: string, name: string) {
  const cleaned = name.trim().replace(/^\/+/, '');
  const file = cleaned.toLowerCase().endsWith('.md') ? cleaned : `${cleaned}.md`;
  return folder ? `${folder}/${file}` : file;
}

interface NewNoteDialogProps {
  /** Folder the note is created in, relative to the Vault root. */
  folder: string;
  onClose: () => void;
  onCreated: (path: string) => void;
}

/** Visible, discoverable "New note" flow. Notes are written by the MCP server. */
export function NewNoteDialog({ folder, onClose, onCreated }: NewNoteDialogProps) {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const create = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Give this memory a title.'); return; }
    setBusy(true);
    setError(null);
    try {
      const path = notePath(folder, trimmed);
      const result = await callVault('create', { path, content: content || `# ${trimmed.replace(/\.md$/i, '')}\n` });
      onCreated(result.path || path);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div role="dialog" aria-label="Add to memory" className="relative bg-surface rounded-lg shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden border border-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-medium text-on-surface">Add to memory</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-hover text-on-surface-variant" title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-xs text-on-surface-variant">
            Saved in your folder as a plain Markdown file. You can open it without this app.
          </p>
          <label className="block text-xs font-medium text-on-surface-variant">
            Title
            <input
              autoFocus
              className="mt-1 block w-full rounded border border-border bg-surface px-2 py-1.5 text-sm text-on-surface"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Weekend ideas"
            />
          </label>
          <label className="block text-xs font-medium text-on-surface-variant">
            What do you want to remember?
            <textarea
              aria-label="Memory content"
              className="mt-1 block w-full rounded border border-border bg-surface px-2 py-1.5 text-sm text-on-surface font-mono"
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write anything you want to remember…"
            />
          </label>
          {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <button onClick={onClose} className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-hover">Cancel</button>
          <button
            onClick={() => void create()}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark disabled:opacity-60"
          >
            {busy ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

interface NoteActionsProps {
  /** Path of the selected note, relative to the Vault root. */
  path: string;
  rawContent: string;
  onChanged: (message: string, nextPath?: string) => void;
  onDeleted?: () => void;
  simple?: boolean;
}

/**
 * Actions for the note that is currently open. Attach/archive/restore live here
 * so they are contextual: they always apply to the visible note, never to a
 * free-text path the user typed somewhere else.
 */
export default function NoteActions({ path, rawContent, onChanged, onDeleted, simple = false }: NoteActionsProps) {
  const parts = simple ? noteEditingParts(rawContent) : { header: '', body: rawContent };
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(parts.body);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const archived = path.startsWith('archive/');

  useEffect(() => { setDraft(simple ? noteEditingParts(rawContent).body : rawContent); setEditing(false); setError(null); }, [path, rawContent, simple]);

  const run = async (operation: string, args: object, message: string, nextPath?: string) => {
    setBusy(true);
    setError(null);
    try {
      const result = await callVault(operation, args);
      onChanged(message, nextPath ?? result.to ?? result.path ?? path);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally { setBusy(false); }
  };

  return (
    <section className="border-t border-border bg-surface p-3">
      <div className="flex flex-wrap items-center gap-2">
        {!archived && (
          <>
            {editing ? (
              <>
                <button
                  disabled={busy}
                  onClick={() => void run('update', { path, content: parts.header + draft }, 'Memory updated')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-dark disabled:opacity-60"
                >
                  <Save className="w-3.5 h-3.5" /> Save changes
                </button>
                <button disabled={busy} onClick={() => { setEditing(false); setDraft(parts.body); }} className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-hover disabled:opacity-60">
                  Cancel
                </button>
              </>
            ) : (
              <button disabled={busy} onClick={() => setEditing(true)} className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-hover disabled:opacity-60">
                Edit
              </button>
            )}
            <button
              disabled={busy || editing}
              onClick={() => void run('archive', { path }, 'Memory archived')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-hover disabled:opacity-60"
            >
              <Archive className="w-3.5 h-3.5" /> Archive
            </button>
          </>
        )}
        {archived && (
          <button
            disabled={busy}
            onClick={() => void run('restore', { path }, 'Memory restored')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-dark disabled:opacity-60"
          >
            <ArchiveRestore className="w-3.5 h-3.5" /> Restore
          </button>
        )}
        <label aria-disabled={archived || editing || busy} title={editing ? 'Save or cancel your changes before attaching a file.' : undefined} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs cursor-pointer hover:bg-hover ${archived || editing || busy ? 'opacity-50 pointer-events-none' : ''}`}>
          <Paperclip className="w-3.5 h-3.5" /> Attach file
          <input
            type="file"
            disabled={archived || editing || busy}
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (!file || archived || editing || busy) return;
              setBusy(true); setError(null);
              try {
                const dataBase64 = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(String(reader.result).split(',')[1]);
                  reader.onerror = () => reject(new Error('The file could not be read.'));
                  reader.readAsDataURL(file);
                });
                const asset = await callVault('attach', { markdownPath: path, name: file.name, dataBase64 });
                const name = String(asset.assetPath).split('/').pop() || file.name;
                const folder = String(asset.assetPath).split('/').slice(-2, -1)[0];
                const relative = `./${encodeURIComponent(folder)}/${encodeURIComponent(name)}`;
                const label = file.name.replace(/[\[\]\r\n]/g, ' ');
                await callVault('update', { path, content: `${rawContent}\n${file.type.startsWith('image/') ? '!' : ''}[${label}](${relative})\n` });
                onChanged(`Attached ${file.name}`, path);
              } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
              finally { setBusy(false); }
            }}
          />
        </label>
        {busy && <LoaderCircle className="w-4 h-4 animate-spin text-on-surface-variant" />}
        {onDeleted && <button disabled={busy || editing} onClick={async () => {
          if (!confirm('Move this memory and its attachments to Recently Deleted? You can restore them later.')) return;
          setBusy(true); setError(null);
          try { await callVault('trash', { path }); onDeleted(); }
          catch (err) { setError(err instanceof Error ? err.message : 'This memory could not be deleted.'); }
          finally { setBusy(false); }
        }} className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-red-600 hover:bg-hover disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /> Delete</button>}
        {error && <span role="alert" className="text-xs text-red-500">{error}</span>}
      </div>

      {editing && (
        <textarea
          aria-label="Memory content"
          className="mt-3 block w-full rounded border border-border bg-surface p-2 text-sm font-mono text-on-surface"
          rows={14}
          disabled={busy}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      )}
    </section>
  );
}
