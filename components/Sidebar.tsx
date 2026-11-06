'use client';

import { Archive, BookOpen, Clock, Files, PanelLeft, PanelLeftClose, Trash2 } from 'lucide-react';
import { useState } from 'react';
import FolderTree from './FolderTree';
import { useVaultInfo } from '@/lib/vault-info-client';
import type { VaultView } from '@/lib/view-types';

interface SidebarProps {
  currentView: VaultView;
  onViewChange: (view: VaultView) => void;
  currentPath?: string;
  onSelectPath?: (path: string) => void;
  onSelectFile?: (path: string) => void;
  refreshKey?: number;
  onRefresh?: () => void;
}

export default function Sidebar({ currentView, onViewChange, currentPath = '', onSelectPath, onSelectFile, refreshKey = 0 }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { info } = useVaultInfo();
  const isFiles = currentView === 'files' || currentView === 'browse';
  const primary = [
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'notes', label: 'Memory', icon: BookOpen },
    { id: 'files', label: 'Files', icon: Files },
  ] as const;
  const secondary = [
    { id: 'deleted', label: 'Recently Deleted', icon: Trash2 },
    { id: 'archive', label: 'Archive', icon: Archive },
  ] as const;
  const item = ({ id, label, icon: Icon }: { id: VaultView; label: string; icon: typeof Clock }) => (
    <button key={id} onClick={() => onViewChange(id)} aria-current={(currentView === id || id === 'files' && isFiles) ? 'page' : undefined}
      aria-label={label} title={label}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm ${(currentView === id || id === 'files' && isFiles) ? 'bg-active text-primary font-medium' : 'text-on-surface hover:bg-hover'}`}>
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span className="hidden sm:block text-left">{label}</span>}
    </button>
  );
  return (
    <aside aria-label="Vault navigation" className={`flex shrink-0 flex-col border-r border-border bg-surface ${collapsed ? 'w-16' : 'w-16 sm:w-56'}`}>
      <div className="flex items-center gap-2 border-b border-border p-3">
        {!collapsed && <div className="hidden min-w-0 flex-1 sm:block"><p className="truncate text-sm font-medium text-on-surface">{info?.name || 'My Vault'}</p><p className="text-xs text-on-surface-variant">Your personal space</p></div>}
        <button onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Expand navigation' : 'Collapse navigation'} aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} className="rounded-lg p-2 text-on-surface-variant hover:bg-hover">
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">{primary.map(item)}</div>
        {isFiles && !collapsed && <div className="hidden sm:block mt-4 max-h-[45vh] overflow-y-auto border-t border-border pt-3">
          <button onClick={() => onSelectPath?.('')} aria-label="Vault root" className="mb-2 w-full truncate rounded-lg px-3 py-2 text-left text-xs text-on-surface-variant hover:bg-hover">{info?.name || 'My Vault'}</button>
          <FolderTree selectedPath={currentPath} refreshKey={refreshKey}
            onSelectFolder={path => onSelectPath?.(path)}
            onSelectFile={path => { onSelectPath?.(path.split('/').slice(0, -1).join('/')); onSelectFile?.(path); }} />
        </div>}
        <div className="my-4 border-t border-border" role="separator" />
        <div className="space-y-1">{secondary.map(item)}</div>
      </nav>
      <p className="hidden sm:block border-t border-border px-4 py-3 text-xs text-on-surface-variant">Your files stay in your folder.</p>
    </aside>
  );
}
