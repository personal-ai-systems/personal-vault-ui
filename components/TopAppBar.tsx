'use client';
import { Search, Settings, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface TopAppBarProps {
  currentView?: string;
  onViewChange?: (view: any) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onNewNote?: () => void;
}

export default function TopAppBar({ searchQuery, onSearchQueryChange, onNewNote }: TopAppBarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

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

          {/* Settings: inert placeholder for the future AI/backup configuration screen. */}
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
                <p className="mt-1 text-xs text-on-surface-variant">Coming soon.</p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Nothing to configure yet — your notes stay in your own folder, with no account and no cloud.
                </p>
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
