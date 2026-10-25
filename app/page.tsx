'use client';

import { useCallback, useEffect, useState } from 'react';
import ArchiveView from "@/components/ArchiveView";
import FileBrowser from "@/components/FileBrowser";
import RecentView from "@/components/RecentView";
import SearchView from "@/components/SearchView";
import Sidebar from "@/components/Sidebar";
import TopAppBar from "@/components/TopAppBar";
import { NewNoteDialog } from "@/components/NoteActions";
import { useOpenAIImport } from '@/lib/vault-info-client';

type View = 'browse' | 'recent' | 'archive';

export default function Home() {
  const [currentView, setCurrentView] = useState<View>('browse');
  const [currentPath, setCurrentPath] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newNoteOpen, setNewNoteOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  // A note the sidebar asked to open; FileBrowser consumes it and clears it.
  const [openFile, setOpenFile] = useState<string | null>(null);
  const openAIImport = useOpenAIImport();
  const isSearching = searchQuery.trim().length > 0;

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  // The folder tree and the file list both derive from this: it opens the note
  // that was just written, whether it was created or restored.
  const handlePathChange = useCallback((path: string) => setCurrentPath(path), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setNewNoteOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const closeNewNote = useCallback(() => setNewNoteOpen(false), []);
  const importOpenAI = useCallback(async () => {
    const imported = await openAIImport.run();
    if (imported) refresh();
    return imported;
  }, [openAIImport.run, refresh]);

  return (
    <>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          currentPath={currentPath}
          onSelectPath={handlePathChange}
          onSelectFile={setOpenFile}
          refreshKey={refreshKey}
          onRefresh={refresh}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopAppBar
            currentView={currentView}
            onViewChange={setCurrentView}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onNewNote={() => setNewNoteOpen(true)}
            onImportOpenAI={importOpenAI}
            importBusy={openAIImport.busy}
            importMessage={openAIImport.message}
          />
          <main className="flex-1 overflow-hidden">
            {isSearching ? (
              <SearchView query={searchQuery} />
            ) : currentView === 'browse' ? (
              <FileBrowser
                path={currentPath}
                onPathChange={handlePathChange}
                onNewNote={() => setNewNoteOpen(true)}
                onImportOpenAI={importOpenAI}
                importBusy={openAIImport.busy}
                importMessage={openAIImport.message}
                refreshKey={refreshKey}
                onChanged={refresh}
                openFile={openFile}
                onOpenedFile={() => setOpenFile(null)}
              />
            ) : currentView === 'recent' ? (
              <RecentView />
            ) : (
              <ArchiveView refreshKey={refreshKey} onChanged={refresh} />
            )}
          </main>
        </div>
      </div>

      {newNoteOpen && (
        <NewNoteDialog
          folder={currentPath}
          onClose={closeNewNote}
          onCreated={(path) => {
            closeNewNote();
            const parts = path.split('/');
            setCurrentPath(parts.slice(0, -1).join('/'));
            setCurrentView('browse');
            refresh();
          }}
        />
      )}
    </>
  );
}
