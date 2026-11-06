'use client';

import { useCallback, useEffect, useState } from 'react';
import ArchiveView from "@/components/ArchiveView";
import FileBrowser from "@/components/FileBrowser";
import RecentView from "@/components/RecentView";
import SearchView from "@/components/SearchView";
import Sidebar from "@/components/Sidebar";
import LibraryView from '@/components/LibraryView';
import DeletedView from '@/components/DeletedView';
import TopAppBar from "@/components/TopAppBar";
import { NewNoteDialog } from "@/components/NoteActions";
import { useOpenAIImport, useVaultActions } from '@/lib/vault-info-client';
import type { VaultView } from '@/lib/view-types';

export default function Home() {
  const [currentView, setCurrentView] = useState<VaultView>('recent');
  const [currentPath, setCurrentPath] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newNoteOpen, setNewNoteOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [browserSession, setBrowserSession] = useState(0);
  // A note the sidebar asked to open; FileBrowser consumes it and clears it.
  const [openFile, setOpenFile] = useState<string | null>(null);
  const openAIImport = useOpenAIImport();
  const folderActions = useVaultActions();
  const isSearching = searchQuery.trim().length > 0;
  const searchScope = currentView === 'files' || currentView === 'browse' ? 'all'
    : currentView === 'notes' ? 'memory' : currentView;

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  // The folder tree and the file list both derive from this: it opens the note
  // that was just written, whether it was created or restored.
  const handlePathChange = useCallback((path: string) => { setSearchQuery(''); setCurrentPath(path); }, []);
  const handleTreePathChange = useCallback((path: string) => {
    setSearchQuery('');
    setCurrentPath(path);
    setOpenFile(null);
    // A tree/root selection starts a fresh browser preview, even when the
    // selected path was already the current folder.
    setBrowserSession(value => value + 1);
  }, []);
  const handleViewChange = useCallback((view: VaultView) => {
    setSearchQuery('');
    setOpenFile(null);
    if (view === 'files' || view === 'browse') {
      setCurrentPath('');
      setCurrentView('files');
      setBrowserSession(value => value + 1);
    } else {
      setCurrentView(view);
    }
  }, []);

  useEffect(() => {
    const openLinkedNote = (event: Event) => {
      const note = (event as CustomEvent<string>).detail;
      if (!note) return;
      setSearchQuery(''); setCurrentView(current => current === 'browse' || current === 'files' ? 'files' : /\.md$/i.test(note) ? 'notes' : 'files');
      setCurrentPath(note.split('/').slice(0, -1).join('/')); setOpenFile(note);
    };
    window.addEventListener('vault:open-note', openLinkedNote);
    return () => window.removeEventListener('vault:open-note', openLinkedNote);
  }, []);

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
          onViewChange={handleViewChange}
          currentPath={currentPath}
          onSelectPath={handleTreePathChange}
          onSelectFile={setOpenFile}
          refreshKey={refreshKey}
          onRefresh={refresh}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopAppBar
            currentView={currentView}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onNewNote={() => setNewNoteOpen(true)}
            onImportOpenAI={importOpenAI}
            importBusy={openAIImport.busy}
            importMessage={openAIImport.message}
            onOpenFolder={() => { void folderActions.run('reveal'); }}
            onChooseFolder={() => { void folderActions.run('choose'); }}
            desktopMessage={folderActions.message}
          />
          <main className="flex-1 overflow-hidden">
            {isSearching ? (
              <SearchView key={searchScope} query={searchQuery} scope={searchScope} />
            ) : currentView === 'browse' || currentView === 'files' ? (
              <FileBrowser
                key={browserSession}
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
              <RecentView refreshKey={refreshKey} onNewNote={() => setNewNoteOpen(true)} onImportOpenAI={importOpenAI} importBusy={openAIImport.busy} importMessage={openAIImport.message} />
            ) : currentView === 'notes' ? (
              <LibraryView kind="notes" refreshKey={refreshKey} onChanged={refresh} onNewNote={() => setNewNoteOpen(true)} onImportOpenAI={importOpenAI} importBusy={openAIImport.busy} importMessage={openAIImport.message} initialOpen={openFile} onOpened={() => setOpenFile(null)} />
            ) : currentView === 'deleted' ? (
              <DeletedView refreshKey={refreshKey} onChanged={refresh} />
            ) : (
              <ArchiveView refreshKey={refreshKey} onChanged={refresh} />
            )}
          </main>
        </div>
      </div>

      {newNoteOpen && (
        <NewNoteDialog
          folder={currentView === 'browse' || currentView === 'files' ? currentPath : `raw/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}`}
          onClose={closeNewNote}
          onCreated={(path) => {
            closeNewNote();
            setSearchQuery('');
            setOpenFile(path);
            const parts = path.split('/');
            setCurrentPath(parts.slice(0, -1).join('/'));
            setCurrentView(current => current === 'browse' || current === 'files' ? 'files' : 'notes');
            refresh();
          }}
        />
      )}
    </>
  );
}
