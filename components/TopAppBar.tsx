'use client';
import { Search, Settings, Plus, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useVaultInfo } from '@/lib/vault-info-client';

interface TopAppBarProps {
  currentView?: string;
  onViewChange?: (view: any) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onNewNote?: () => void;
  onImportOpenAI?: () => Promise<boolean>;
  importBusy?: boolean;
  importMessage?: string | null;
}

export default function TopAppBar({ searchQuery, onSearchQueryChange, onNewNote, onImportOpenAI, importBusy = false, importMessage }: TopAppBarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const { info } = useVaultInfo();

  useEffect(() => {
    if (!settingsOpen) return;
    const close = (event: MouseEvent) => { if (!settingsRef.current?.contains(event.target as Node)) setSettingsOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [settingsOpen]);

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          {/* App logo/name */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PV</span>
            </div>
            <div>
              <h1 className="text-lg font-medium text-on-surface">Personal Vault</h1>
              <p className="text-xs text-on-surface-variant">Your notes and files</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex items-center bg-surface-variant rounded-lg px-3 py-2 w-64 lg:w-80">
            <Search className="w-4 h-4 text-on-surface-variant mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search in vault..."
              className="bg-transparent border-none outline-none w-full text-sm text-on-surface placeholder-on-surface-variant"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchQueryChange('')}
                className="ml-2 p-0.5 rounded hover:bg-hover"
                title="Clear search"
              >
                <span className="text-xs text-on-surface-variant">✕</span>
              </button>
            )}
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-2">
          {/* Mobile search button */}
          <button
            className="p-2 rounded-lg hover:bg-surface-variant md:hidden"
            title="Search"
          >
            <Search className="w-4 h-4 text-on-surface-variant" />
          </button>

          {/* Primary action: the one thing a note app should always offer. */}
          {onNewNote && (
            <button
              onClick={onNewNote}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark"
              title="New note"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New note</span>
            </button>
          )}

          {/* Settings also keeps import available after the first-run screen. */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="p-2 rounded-lg hover:bg-surface-variant"
              title="Settings"
              aria-haspopup="menu"
              aria-expanded={settingsOpen}
            >
              <Settings className="w-4 h-4 text-on-surface-variant" />
            </button>
            {settingsOpen && (
              <div role="menu" className="absolute right-0 top-11 z-30 w-64 rounded-lg border border-border bg-surface shadow-lg p-3 text-sm">
                <p className="font-medium text-on-surface">Settings</p>
                {info?.appVersion && <p className="mt-1 text-xs text-on-surface-variant">Version {info.appVersion}</p>}
                {onImportOpenAI && (
                  <button
                    role="menuitem"
                    onClick={() => void onImportOpenAI()}
                    disabled={importBusy}
                    className="mt-2 w-full flex items-center gap-2 rounded-md border border-border px-3 py-2 text-left hover:bg-hover disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4 text-primary" />
                    <span>{importBusy ? 'Importing…' : 'Import OpenAI data…'}</span>
                  </button>
                )}
                {importMessage && <p role="status" className="mt-2 text-xs text-on-surface-variant">{importMessage}</p>}
                {info?.mcpEndpoint && <div className="mt-3 border-t border-border pt-2 text-xs">
                  <p className="font-medium">Local MCP connection</p>
                  <code className="mt-1 block break-all select-text">{info.mcpEndpoint}</code>
                  <p className="mt-1 text-on-surface-variant">This Mac only, while the app is open. The port changes after a restart.</p>
                </div>}
                <p className="mt-2 text-xs text-on-surface-variant">Your notes stay in your own folder, with no account and no cloud.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="md:hidden px-4 pb-3">
        <div className="flex items-center bg-surface-variant rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-on-surface-variant mr-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search in vault..."
            className="bg-transparent border-none outline-none w-full text-sm text-on-surface placeholder-on-surface-variant"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchQueryChange('')}
              className="ml-2 p-0.5 rounded hover:bg-hover"
              title="Clear search"
            >
              <span className="text-xs text-on-surface-variant">✕</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
