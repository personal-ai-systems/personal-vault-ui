'use client';

import { useState } from 'react';
import { 
  Menu, 
  Search, 
  HelpCircle, 
  Settings, 
  Bell, 
  User,
  Grid,
  Filter,
  RefreshCw,
  MoreVertical
} from 'lucide-react';

export default function TopAppBar() {
  const [searchQuery, setSearchQuery] = useState('');

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
              <p className="text-xs text-on-surface-variant">Local-first AI memory system</p>
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
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="ml-2 p-0.5 rounded hover:bg-hover"
              >
                <span className="text-xs text-on-surface-variant">✕</span>
              </button>
            )}
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-2">
          {/* Action buttons */}
          <button 
            className="p-2 rounded-lg hover:bg-surface-variant hidden md:flex items-center justify-center"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-on-surface-variant" />
          </button>
          
          <button 
            className="p-2 rounded-lg hover:bg-surface-variant hidden md:flex items-center justify-center"
            title="Filters"
          >
            <Filter className="w-4 h-4 text-on-surface-variant" />
          </button>
          
          <button 
            className="p-2 rounded-lg hover:bg-surface-variant hidden md:flex items-center justify-center"
            title="View options"
          >
            <Grid className="w-4 h-4 text-on-surface-variant" />
          </button>

          {/* Mobile search button */}
          <button 
            className="p-2 rounded-lg hover:bg-surface-variant md:hidden"
            title="Search"
          >
            <Search className="w-4 h-4 text-on-surface-variant" />
          </button>

          {/* Notifications */}
          <button 
            className="p-2 rounded-lg hover:bg-surface-variant relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-on-surface-variant" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
          </button>

          {/* Help */}
          <button 
            className="p-2 rounded-lg hover:bg-surface-variant hidden md:flex"
            title="Help"
          >
            <HelpCircle className="w-4 h-4 text-on-surface-variant" />
          </button>

          {/* Settings */}
          <button 
            className="p-2 rounded-lg hover:bg-surface-variant"
            title="Settings"
          >
            <Settings className="w-4 h-4 text-on-surface-variant" />
          </button>

          {/* User menu */}
          <div className="relative">
            <button 
              className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-surface-variant"
              title="Account"
            >
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-on-surface hidden lg:inline">Kirill</span>
              <MoreVertical className="w-4 h-4 text-on-surface-variant hidden lg:inline" />
            </button>
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
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="ml-2 p-0.5 rounded hover:bg-hover"
            >
              <span className="text-xs text-on-surface-variant">✕</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
