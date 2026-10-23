'use client';

import {
  Archive,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  FolderOpen,
  HardDrive,
  PanelLeftClose,
  PanelLeft,
  RefreshCw,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import FolderTree from './FolderTree';
import { useVaultActions, useVaultInfo } from '@/lib/vault-info-client';

interface SidebarProps {
  currentView: 'browse' | 'recent' | 'archive';
  onViewChange: (view: 'browse' | 'recent' | 'archive') => void;
  /** Folder shown in the file list, relative to the Vault root. */
  currentPath?: string;
  onSelectPath?: (path: string) => void;
  /** A note chosen in the tree, relative to the Vault root. */
  onSelectFile?: (path: string) => void;
  /** Bumped after a write so the tree re-reads the folder from disk. */
  refreshKey?: number;
  /** Asks the page to re-read the Vault from disk. */
  onRefresh?: () => void;
}

export default function Sidebar({ currentView, onViewChange, currentPath = '', onSelectPath, onSelectFile, refreshKey = 0, onRefresh }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [recentCount, setRecentCount] = useState<number | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { info } = useVaultInfo();
  const { run, message, clearMessage } = useVaultActions();

  useEffect(() => {
    fetch('/api/recent?limit=1')
      .then(res => res.json())
      .then(data => {
        if (data.totalFiles !== undefined) setRecentCount(data.totalFiles);
      })
      .catch(() => {}); // Silent fail
  }, [refreshKey]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: MouseEvent) => { if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const openFile = (path: string) => {
    if (!onSelectPath || !onSelectFile) return;
    onSelectPath(path.split('/').slice(0, -1).join('/'));
    onSelectFile(path);
    onViewChange('browse');
  };

  const selectFolder = (path: string) => {
    onSelectPath?.(path);
    onViewChange('browse');
  };
  const copyPath = async () => {
    if (!info?.root) return;
    try { await navigator.clipboard.writeText(info.root); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { /* Clipboard may be unavailable; the path stays visible as text. */ }
  };

  const secondary: { id: SidebarProps['currentView']; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'recent', label: 'Recent', icon: <Clock className="w-4 h-4" />, count: recentCount },
    { id: 'archive', label: 'Archive', icon: <Archive className="w-4 h-4" /> },
  ];

  return (
    <aside className={`relative ${collapsed ? 'w-16' : 'w-64'} border-r border-border bg-surface flex flex-col transition-all duration-200 flex-shrink-0`}>
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 w-6 h-6 bg-surface border border-border rounded-full flex items-center justify-center z-10 hover:bg-surface-variant"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <PanelLeft className="w-3 h-3" /> : <PanelLeftClose className="w-3 h-3" />}
      </button>

      {/* Vault location — always visible, so the folder is never a mystery. */}
      <div className="border-b border-border p-3">
        <div className="flex items-start gap-2">
          <HardDrive className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-on-surface truncate" title={info?.name ?? undefined}>
                {info?.name ?? 'Vault'}
              </p>
              <p className="text-[11px] text-on-surface-variant break-all leading-snug" title={info?.root ?? undefined}>
                {info?.root ?? 'Locating your folder…'}
              </p>
            </div>
          )}
          {!collapsed && (
            <div className="relative flex-shrink-0" ref={menuRef}>
              <button
                onClick={() => { setMenuOpen(!menuOpen); clearMessage(); }}
                className="p-1 rounded hover:bg-surface-variant text-on-surface-variant"
                title="Vault location actions"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <ChevronRight className={`w-4 h-4 transition-transform ${menuOpen ? 'rotate-90' : ''}`} />
              </button>
              {menuOpen && (
                <div role="menu" className="absolute right-0 top-7 z-30 w-56 rounded-lg border border-border bg-surface shadow-lg py-1 text-sm">
                  <button role="menuitem" disabled={!info?.root} onClick={() => void run('reveal')} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-hover disabled:opacity-50">
                    <FolderOpen className="w-4 h-4 text-on-surface-variant" /> Show in Finder
                  </button>
                  <button role="menuitem" disabled={!info?.desktop} onClick={() => void run('choose')} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-hover disabled:opacity-50">
                    <ExternalLink className="w-4 h-4 text-on-surface-variant" /> Open another Vault…
                  </button>
                  <button role="menuitem" disabled={!info?.root} onClick={() => void copyPath()} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-hover disabled:opacity-50">
                    <Copy className="w-4 h-4 text-on-surface-variant" /> {copied ? 'Path copied' : 'Copy folder path'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {!collapsed && message && <p role="status" className="mt-2 text-[11px] text-on-surface-variant">{message}</p>}
      </div>

      {/* Folder tree */}
      <nav className="flex-1 overflow-y-auto py-3">
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            className="w-full flex justify-center p-2 text-on-surface-variant hover:bg-surface-variant rounded-lg"
            title="Expand to browse folders"
          >
            <FolderOpen className="w-5 h-5" />
          </button>
        ) : (
          <>
            <div className="px-3 pb-1 flex items-center justify-between">
              <h3 className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Folders</h3>
              <button
                onClick={() => { onRefresh?.(); onSelectPath?.(''); onViewChange('browse'); }}
                className="p-1 rounded hover:bg-surface-variant text-on-surface-variant"
                title="Refresh folders"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
            <FolderTree
              selectedPath={currentPath}
              onSelectFolder={selectFolder}
              onSelectFile={openFile}
              refreshKey={refreshKey}
            />
          </>
        )}

        {/* Recent and Archive stay beside the tree, not mixed into it. */}
        <div className="px-3 mt-4">
          {!collapsed && (
            <h3 className="text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1 px-3">Views</h3>
          )}
          <ul className="space-y-1">
            {secondary.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center ${collapsed ? 'justify-center px-3' : 'px-3'} py-2 rounded-lg text-sm transition-colors ${
                    currentView === item.id ? 'bg-active text-primary font-medium' : 'hover:bg-surface-variant text-on-surface'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className={currentView === item.id ? 'text-primary' : 'text-on-surface-variant'}>{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="ml-3 flex-1 text-left">{item.label}</span>
                      {item.count !== undefined && (
                        <span className="text-xs bg-surface-variant text-on-surface-variant px-1.5 py-0.5 rounded">{item.count}</span>
                      )}
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </aside>
  );
}
