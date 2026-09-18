'use client';

import { useState } from 'react';
import FileBrowser from "@/components/FileBrowser";
import RecentView from "@/components/RecentView";
import SearchView from "@/components/SearchView";
import Sidebar from "@/components/Sidebar";
import TopAppBar from "@/components/TopAppBar";
import NoteActions from "@/components/NoteActions";

export default function Home() {
  const [currentView, setCurrentView] = useState<'resume' | 'browse' | 'recent'>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const isSearching = searchQuery.trim().length > 0;

  return (
    <>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopAppBar
            currentView={currentView}
            onViewChange={setCurrentView}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
          />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <NoteActions />
            {isSearching ? (
              <SearchView query={searchQuery} />
            ) : currentView === 'resume' ? (
              <FileBrowser />
            ) : currentView === 'browse' ? (
              <FileBrowser />
            ) : (
              <RecentView />
            )}
          </main>
        </div>
      </div>

    </>
  );
}
