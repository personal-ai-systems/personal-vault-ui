'use client';

import { useEffect, useState } from 'react';
import { ChevronRight, FileText, Folder, FolderOpen, File, FileCode, FileImage, FileArchive, FileVideo, FileAudio, LoaderCircle, Plus, ExternalLink, Upload } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import NoteActions from './NoteActions';
import { useVaultActions, useVaultInfo } from '@/lib/vault-info-client';

interface FileItem {
  name: string;
  path: string;
  relativePath: string;
  size: number;
  mtime: number;
}

interface DirectoryItem {
  name: string;
  path: string;
  relativePath: string;
}

interface FileBrowserProps {
  /** Folder to display, relative to the Vault root ('' is the root). */
  path: string;
  onPathChange: (path: string) => void;
  onNewNote: () => void;
  onImportOpenAI: () => Promise<boolean>;
  importBusy?: boolean;
  importMessage?: string | null;
  /** Bumped by the page after any write so the listing re-reads the disk. */
  refreshKey?: number;
  onChanged?: () => void;
  /** A note the sidebar opened, relative to the Vault root. */
  openFile?: string | null;
  /** Called once the note above has been opened. */
  onOpenedFile?: () => void;
}

export default function FileBrowser({ path, onPathChange, onNewNote, onImportOpenAI, importBusy = false, importMessage, refreshKey = 0, onChanged, openFile, onOpenedFile }: FileBrowserProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [directories, setDirectories] = useState<DirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileContent, setFileContent] = useState<any>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [noteMessage, setNoteMessage] = useState<string | null>(null);
  const { info } = useVaultInfo();
  const { run: runDesktopAction, message: desktopMessage } = useVaultActions();

  const fetchDirectory = async (target: string = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (target) params.set('path', target);

      const response = await fetch(`/api/files?${params}`);
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setFiles(data.files || []);
        setDirectories(data.directories || []);
      }
    } catch (err) {
      setError('Failed to fetch directory contents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFileContent = async (filePath: string) => {
    setContentLoading(true);
    setContentError(null);
    try {
      if (!/\.(md|txt|json|jsonl|csv|ya?ml)$/i.test(filePath)) {
        setFileContent({ assetURL: '/api/assets/' + filePath.split('/').map(encodeURIComponent).join('/'), image: /\.(png|jpe?g|gif|webp)$/i.test(filePath) });
        return;
      }
      const encodedPath = encodeURIComponent(filePath);
      const response = await fetch(`/api/files/${encodedPath}`);
      const data = await response.json();

      if (!response.ok || data.error) {
        setContentError(data.error || 'This file could not be opened.');
      } else {
        setFileContent(data);
      }
    } catch (err) {
      setContentError('Failed to fetch file content');
      console.error(err);
    } finally {
      setContentLoading(false);
    }
  };

  useEffect(() => {
    void fetchDirectory(path);
  }, [path, refreshKey]);

  // The sidebar can ask for a specific note; open it once the file is known.
  useEffect(() => {
    if (!openFile) return;
    const match = files.find((file) => file.relativePath === openFile);
    if (match) handleFileClick(match);
    else handleFileClick({ name: openFile.split('/').pop() || openFile, path: openFile, relativePath: openFile, size: 0, mtime: Date.now() });
    onOpenedFile?.();
  }, [openFile, files]);

  const openDirectory = (dir: DirectoryItem) => {
    onPathChange(dir.relativePath);
    setSelectedFile(null);
    setFileContent(null);
  };

  const handleFileClick = (file: FileItem) => {
    setNoteMessage(null);
    setSelectedFile(file);
    setFileContent(null);
    void fetchFileContent(file.relativePath);
  };

  const handleBreadcrumbClick = (index: number) => {
    handleClosePanel();
    if (index < 0) { onPathChange(''); return; }
    const parts = path.split('/').filter(p => p);
    onPathChange(parts.slice(0, index + 1).join('/'));
  };

  const handleClosePanel = () => {
    setSelectedFile(null);
    setFileContent(null);
    setContentError(null);
  };

  const handleNoteChanged = (message: string, nextPath?: string) => {
    setNoteMessage(message);
    onChanged?.();
    if (nextPath && nextPath !== selectedFile?.relativePath) {
      // Archive/restore moved the file: follow it instead of showing a stale path.
      const parts = nextPath.split('/');
      const folder = parts.slice(0, -1).join('/');
      const name = parts[parts.length - 1];
      onPathChange(folder);
      setSelectedFile({ name, path: nextPath, relativePath: nextPath, size: 0, mtime: Date.now() });
      void fetchFileContent(nextPath);
    } else if (selectedFile) {
      void fetchFileContent(selectedFile.relativePath);
    }
    void fetchDirectory(path);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'md':
      case 'markdown':
      case 'txt':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'py':
      case 'java':
      case 'cpp':
      case 'c':
      case 'go':
      case 'rs':
      case 'php':
      case 'rb':
        return <FileCode className="w-4 h-4 text-yellow-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
      case 'webp':
        return <FileImage className="w-4 h-4 text-green-500" />;
      case 'pdf':
        return <File className="w-4 h-4 text-red-500" />;
      case 'zip':
      case 'tar':
      case 'gz':
      case 'rar':
      case '7z':
        return <FileArchive className="w-4 h-4 text-orange-500" />;
      case 'mp4':
      case 'mov':
      case 'avi':
      case 'mkv':
      case 'webm':
        return <FileVideo className="w-4 h-4 text-purple-500" />;
      case 'mp3':
      case 'wav':
      case 'flac':
      case 'aac':
        return <FileAudio className="w-4 h-4 text-pink-500" />;
      default:
        return <File className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const vaultName = info?.name || 'Vault';
  const breadcrumbs = path ? [vaultName, ...path.split('/').filter(p => p)] : [vaultName];
  const isEmpty = !loading && !error && directories.length === 0 && files.length === 0 && path === '';

  return (
    <div className="flex h-full">
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Breadcrumbs */}
        <div className="px-4 py-2 border-b border-border bg-surface-variant/50">
          <div className="flex items-center text-sm">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && <ChevronRight className="w-3 h-3 mx-1 text-on-surface-variant" />}
                <button
                  onClick={() => handleBreadcrumbClick(index - 1)}
                  className={`px-2 py-1 rounded hover:bg-hover transition-colors ${
                    index === breadcrumbs.length - 1
                      ? 'font-medium text-on-surface'
                      : 'text-on-surface-variant'
                  }`}
                >
                  {crumb}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* File list */}
        <div className="overflow-auto flex-1 min-h-0">
          {loading ? (
            <div className="p-8 text-center">
              <LoaderCircle className="w-8 h-8 text-primary mx-auto animate-spin" />
              <p className="mt-2 text-sm text-on-surface-variant">Loading directory...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {/* Directories first */}
              {directories.map((dir) => (
                <div
                  key={dir.relativePath}
                  data-vault-folder={dir.relativePath}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openDirectory(dir); } }}
                  className="px-4 py-3 hover:bg-hover cursor-pointer transition-colors flex items-center"
                  onClick={() => openDirectory(dir)}
                >
                  <Folder className="w-5 h-5 text-blue-500 mr-3" />
                  <div className="flex-1">
                    <div className="font-medium text-on-surface">{dir.name}</div>
                    <div className="text-xs text-on-surface-variant mt-0.5">
                      Folder
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                </div>
              ))}

              {/* Files */}
              {files.map((file) => (
                <div
                  key={file.relativePath}
                  data-vault-file={file.relativePath}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleFileClick(file); } }}
                  className={`px-4 py-3 hover:bg-hover cursor-pointer transition-colors flex items-center ${
                    selectedFile?.relativePath === file.relativePath ? 'bg-active' : ''
                  }`}
                  onClick={() => handleFileClick(file)}
                >
                  <div className="mr-3">
                    {getFileIcon(file.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-on-surface truncate">{file.name}</div>
                    <div className="text-xs text-on-surface-variant mt-0.5 flex items-center space-x-3">
                      <span>{formatDate(file.mtime)}</span>
                      <span>•</span>
                      <span>{formatSize(file.size)}</span>
                    </div>
                  </div>
                </div>
              ))}

              {directories.length === 0 && files.length === 0 && !isEmpty && (
                <div className="p-8 text-center">
                  <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-on-surface-variant">This folder is empty</p>
                  <button
                    onClick={onNewNote}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark"
                  >
                    <Plus className="w-4 h-4" /> Create a note here
                  </button>
                </div>
              )}
            </div>
          )}

          {/* First-run empty state: bring existing memory first, then start fresh. */}
          {isEmpty && (
            <div className="p-8 text-center max-w-md mx-auto">
              <EmptyVaultIllustration />
              <h2 className="mt-4 text-lg font-medium text-on-surface">Your Vault is ready</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Bring your existing AI conversations with you, or start with a new note. Everything is saved as readable Markdown.</p>
              <div className="mt-5 grid gap-2 text-left">
                <button
                  onClick={() => void onImportOpenAI()}
                  disabled={importBusy}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark disabled:opacity-50"
                >
                  {importBusy ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  <span><span className="block">1. Import OpenAI data</span><span className="block text-xs font-normal opacity-80">Choose the ZIP from ChatGPT and turn conversations into .md files</span></span>
                </button>
                <button
                  onClick={onNewNote}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border text-sm font-medium hover:bg-hover"
                >
                  <Plus className="w-5 h-5 text-primary" /> <span>2. Create your first note</span>
                </button>
                <button
                  onClick={() => void runDesktopAction('reveal')}
                  disabled={!info?.root}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border text-sm font-medium hover:bg-hover disabled:opacity-50"
                >
                  <ExternalLink className="w-5 h-5 text-primary" /> <span>3. Add files in Finder…</span>
                </button>
              </div>
              <p className="mt-3 text-xs text-on-surface-variant">Saved in <span className="font-mono">{info?.root || 'your folder'}</span>. The import copies conversations into your Vault; it does not change the OpenAI export.</p>
              {importMessage && <p role="status" className="mt-2 text-xs text-primary">{importMessage}</p>}
              {desktopMessage && <p role="status" className="mt-2 text-xs text-on-surface-variant">{desktopMessage}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel: the selected note, with its own contextual actions. */}
      {selectedFile && (
        <div className="w-[26rem] max-w-[45%] border-l border-border bg-surface flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-border flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-on-surface truncate">{selectedFile.name}</h2>
              <p className="text-[11px] text-on-surface-variant font-mono truncate">{selectedFile.relativePath}</p>
              {noteMessage && <p role="status" className="text-[11px] text-primary mt-0.5">{noteMessage}</p>}
            </div>
            <button onClick={handleClosePanel} className="text-xs text-on-surface-variant hover:text-on-surface px-2 py-1 rounded hover:bg-hover" title="Close note">
              Close
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {contentLoading ? (
              <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                <LoaderCircle className="w-4 h-4 animate-spin" /> Loading note…
              </div>
            ) : contentError ? (
              <p role="alert" className="text-sm text-red-500">{contentError}</p>
            ) : fileContent ? (
              fileContent.assetURL ? (
                fileContent.image ? <img src={fileContent.assetURL} alt={selectedFile.name} className="max-w-full h-auto" /> :
                <div className="text-sm"><p>Open this file from your Vault folder.</p><button onClick={() => void runDesktopAction('reveal')} className="mt-2 text-primary underline">Show in Finder</button></div>
              ) : fileContent.metadataError ? (
                <>
                  <p role="status" className="mb-4 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
                    {fileContent.metadataError}
                  </p>
                  <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-on-surface">
                    {fileContent.rawContent ?? fileContent.content}
                  </pre>
                </>
              ) : <MarkdownRenderer content={fileContent.content || ''} sourcePath={selectedFile.relativePath} />
            ) : null}
          </div>

          {fileContent && typeof fileContent.rawContent === 'string' && !contentLoading && !contentError && (
            <NoteActions
              path={selectedFile.relativePath}
              rawContent={fileContent?.rawContent || ''}
              onChanged={handleNoteChanged}
            />
          )}
        </div>
      )}
    </div>
  );
}

function EmptyVaultIllustration() {
  return (
    <div className="mx-auto w-14 h-14 rounded-lg bg-surface-variant flex items-center justify-center">
      <FileText className="w-7 h-7 text-primary" />
    </div>
  );
}
