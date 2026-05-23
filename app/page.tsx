'use client';

import { useState } from 'react';
import FileBrowser from "@/components/FileBrowser";
import RecentView from "@/components/RecentView";
import ResumeMe from "@/components/ResumeMe";
import SearchView from "@/components/SearchView";
import Sidebar from "@/components/Sidebar";
import TopAppBar from "@/components/TopAppBar";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

export default function Home() {
  const [currentView, setCurrentView] = useState<'resume' | 'browse' | 'recent'>('resume');
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
            {isSearching ? (
              <SearchView query={searchQuery} />
            ) : currentView === 'resume' ? (
              <ResumeMe />
            ) : currentView === 'browse' ? (
              <FileBrowser />
            ) : (
              <RecentView />
            )}
          </main>
        </div>
      </div>
      <PWAInstallPrompt />
    </>
  );
}
