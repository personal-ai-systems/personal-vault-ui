'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronRight, FileText, Folder, FolderOpen, LoaderCircle } from 'lucide-react';

interface Entry {
  name: string;
  relativePath: string;
}

interface DirectoryListing {
  directories: Entry[];
  files: Entry[];
}

interface FolderTreeProps {
  /** Currently selected folder, relative to the Vault root ('' is the root). */
  selectedPath: string;
  onSelectFolder: (path: string) => void;
  onSelectFile: (path: string) => void;
  /** Changes whenever files on disk may have changed, to drop cached listings. */
  refreshKey?: number;
}

async function listDirectory(path: string): Promise<DirectoryListing> {
  const params = path ? `?path=${encodeURIComponent(path)}` : '';
  const response = await fetch(`/api/files${params}`);
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || 'Could not list this folder.');
  const sort = (a: Entry, b: Entry) => a.name.localeCompare(b.name, undefined, { numeric: true });
  return {
    directories: (data.directories || []).map((d: any) => ({ name: d.name, relativePath: d.relativePath })).sort(sort),
    files: (data.files || []).map((f: any) => ({ name: f.name, relativePath: f.relativePath })).sort(sort),
  };
}

interface SharedProps {
  selectedPath: string;
  onSelectFolder: (path: string) => void;
  onSelectFile: (path: string) => void;
  expanded: Set<string>;
  listings: Record<string, DirectoryListing | undefined>;
  onToggle: (path: string) => void;
  onLoad: (path: string) => Promise<void>;
}

interface NodeProps extends SharedProps {
  path: string;
  name: string;
  depth: number;
}

function TreeNode({ path, name, depth, selectedPath, onSelectFolder, onSelectFile, expanded, listings, onToggle, onLoad }: NodeProps) {
  const [loading, setLoading] = useState(false);
  const isSelected = selectedPath === path;
  const isExpanded = expanded.has(path);
  const children = listings[path];

  const toggle = async () => {
    onToggle(path);
    if (!children && !isExpanded) { setLoading(true); await onLoad(path); setLoading(false); }
  };

  return (
    <li>
      <div
        className={`flex items-center rounded-lg pr-1 ${isSelected ? 'bg-active text-primary font-medium' : 'hover:bg-surface-variant text-on-surface'}`}
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        <button
          onClick={() => void toggle()}
          className="p-0.5 rounded hover:bg-hover text-on-surface-variant flex-shrink-0"
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${name}`}
          aria-expanded={isExpanded}
        >
          {loading
            ? <LoaderCircle className="w-3 h-3 animate-spin" />
            : <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />}
        </button>
        <button
          onClick={() => onSelectFolder(path)}
          className="flex items-center gap-2 flex-1 min-w-0 py-1.5 text-sm text-left"
          title={path}
        >
          {isExpanded
            ? <FolderOpen className="w-4 h-4 flex-shrink-0 text-primary" />
            : <Folder className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`} />}
          <span className="truncate">{name}</span>
        </button>
      </div>

      {isExpanded && children && (
        <ul>
          {children.directories.map((child) => (
            <TreeNode
              key={child.relativePath}
              path={child.relativePath}
              name={child.name}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelectFolder={onSelectFolder}
              onSelectFile={onSelectFile}
              expanded={expanded}
              listings={listings}
              onToggle={onToggle}
              onLoad={onLoad}
            />
          ))}
          {children.files.map((file) => (
            <li key={file.relativePath}>
              <button
                onClick={() => onSelectFile(file.relativePath)}
                className="w-full flex items-center gap-2 py-1 pr-1 rounded-lg text-left text-sm hover:bg-surface-variant text-on-surface-variant"
                style={{ paddingLeft: `${(depth + 1) * 12 + 16}px` }}
                title={file.relativePath}
              >
                <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{file.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function FolderTree({ selectedPath, onSelectFolder, onSelectFile, refreshKey = 0 }: FolderTreeProps) {
  const [listings, setListings] = useState<Record<string, DirectoryListing>>({});
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (path: string) => {
    setError(null);
    try {
      const listing = await listDirectory(path);
      setListings((current) => ({ ...current, [path]: listing }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const toggle = useCallback((path: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
  }, []);

  // Listing the root is the tree's first, lazy read; nothing is pre-fetched deeper.
  useEffect(() => {
    setListings({});
    setExpanded(new Set());
    void load('');
  }, [load, refreshKey]);

  const root = listings[''];
  const shared = { selectedPath, onSelectFolder, onSelectFile, expanded, listings, onToggle: toggle, onLoad: load };

  return (
    <div className="text-sm">
      {error && <p className="px-3 py-2 text-xs text-red-500">{error}</p>}
      {!root && !error && (
        <p className="px-3 py-2 text-xs text-on-surface-variant flex items-center gap-2">
          <LoaderCircle className="w-3 h-3 animate-spin" /> Reading folders…
        </p>
      )}
      {root && root.directories.length === 0 && root.files.length === 0 && !error && (
        <p className="px-3 py-2 text-xs text-on-surface-variant">No folders yet</p>
      )}
      {root && (
        <ul className="space-y-0.5">
          {root.directories.map((dir) => (
            <TreeNode key={dir.relativePath} {...shared} path={dir.relativePath} name={dir.name} depth={0} />
          ))}
          {root.files.map((file) => (
            <li key={file.relativePath}>
              <button
                onClick={() => onSelectFile(file.relativePath)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-surface-variant text-on-surface-variant"
                title={file.relativePath}
              >
                <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{file.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
