'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Search, Loader2, AlertCircle } from 'lucide-react';
import MarkdownModal from './MarkdownModal';

interface SearchResult {
  path: string;
  relativePath: string;
  name: string;
  size: number;
  mtime: number;
  frontmatter: Record<string, unknown>;
  content: string;
  score: number;
  matches: string[];
  /** Set when the note's metadata block is not valid YAML. */
  metadataError?: string | null;
}

interface SearchViewProps {
  query: string;
  scope: 'recent' | 'memory' | 'all' | 'archive' | 'deleted';
}

export default function SearchView({ query, scope }: SearchViewProps) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<SearchResult | null>(null);
  const [fileContent, setFileContent] = useState<any>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const contentRequest = useRef<AbortController | null>(null);
  const section = { recent: 'Recent', memory: 'Memory', all: 'Files', archive: 'Archive', deleted: 'Recently Deleted' }[scope];

  const trimmedQuery = query.trim();

  useEffect(() => {
    contentRequest.current?.abort();
    setSelectedFile(null);
    setFileContent(null);
    setResults([]);
    setWarning(null);
    setError(null);
    if (!trimmedQuery) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const timeout = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: trimmedQuery, scope });
        const response = await fetch(`/api/search?${params}`, { signal: controller.signal });
        const data = await response.json();
        if (controller.signal.aborted) return;
        if (!response.ok || data.error) {
          setError(data.error || `Could not search ${section}.`);
          setResults([]);
        } else {
          setResults(data.results || []);
          setWarning([data.listingWarning, data.searchWarning].filter(Boolean).join(' ') || null);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(`Could not search ${section}. Please try again.`);
          setResults([]);
          console.error(err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 200);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
      contentRequest.current?.abort();
    };
  }, [trimmedQuery, scope, section]);

  const summary = useMemo(() => {
    if (!trimmedQuery) return `Type to search ${section}.`;
    if (loading) return `Searching for "${trimmedQuery}"...`;
    return `${results.length} result${results.length === 1 ? '' : 's'} for "${trimmedQuery}"`;
  }, [loading, results.length, trimmedQuery, section]);

  const fetchFileContent = async (file: SearchResult) => {
    contentRequest.current?.abort();
    if (!/\.(md|txt|json|jsonl|csv|ya?ml)$/i.test(file.relativePath)) {
      window.dispatchEvent(new CustomEvent('vault:open-note', { detail: file.relativePath }));
      return;
    }
    setSelectedFile(file);
    setFileContent(null);
    setContentLoading(true);
    const controller = new AbortController();
    contentRequest.current = controller;
    try {
      const response = await fetch(`/api/content/${encodeURIComponent(file.relativePath)}`, { signal: controller.signal });
      const data = await response.json();
      if (controller.signal.aborted) return;
      if (data.error) {
        setFileContent({
          path: file.relativePath,
          frontmatter: file.frontmatter || {},
          content: file.content || 'Content preview not available',
        });
      } else {
        setFileContent(data);
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error('Failed to fetch search result content:', err);
      setFileContent({
        path: file.relativePath,
        frontmatter: file.frontmatter || {},
        content: file.content || 'Failed to load content',
      });
    } finally {
      if (!controller.signal.aborted) setContentLoading(false);
    }
  };

  const closeModal = () => {
    contentRequest.current?.abort();
    setSelectedFile(null);
    setFileContent(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-border bg-surface-variant/50 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-medium text-on-surface">Search in {section}</h2>
        </div>
        <span className="text-xs text-on-surface-variant">{summary}</span>
      </div>

      <div className="overflow-auto flex-1 min-h-0">
        {scope === 'all' && <p className="px-4 pt-3 text-xs text-on-surface-variant">Across all folders in your Vault, not just the current folder.</p>}
        {warning && <p role="status" className="m-4 rounded-lg border border-amber-500 p-3 text-sm">{warning}</p>}
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 text-primary mx-auto animate-spin" />
            <p className="mt-2 text-sm text-on-surface-variant">Searching {section}…</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-red-500">{error}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="p-8 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-on-surface-variant">No matches in {section}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {results.map((file) => (
              <button
                key={file.relativePath}
                data-search-path={file.relativePath}
                type="button"
                className="w-full px-4 py-3 hover:bg-hover transition-colors flex items-start text-left"
                onClick={() => fetchFileContent(file)}
              >
                <FileText className="w-4 h-4 text-blue-500 mt-1 mr-3 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-on-surface truncate">
                      {typeof file.frontmatter?.title === 'string' && file.frontmatter.title.trim()
                        ? file.frontmatter.title : file.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-variant text-on-surface-variant">
                      {file.matches.join(', ')}
                    </span>
                    {file.metadataError && (
                      <span
                        title={file.metadataError}
                        className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200"
                      >
                        Needs attention
                      </span>
                    )}
                  </div>
                  {scope === 'all' && <p className="mt-1 break-all text-xs text-on-surface-variant">{file.relativePath}</p>}
                  <div className="text-xs text-on-surface-variant mt-0.5">{file.size ? `${Math.max(1, Math.round(file.size / 1024))} KB` : 'Saved memory'}</div>
                  <p className="text-xs text-on-surface-variant mt-1 line-clamp-2 leading-relaxed">
                    {file.content}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <MarkdownModal
        file={selectedFile ? {
          name: selectedFile.name,
          path: selectedFile.path,
          relativePath: selectedFile.relativePath,
          size: selectedFile.size,
          mtime: selectedFile.mtime,
        } : null}
        content={fileContent}
        loading={contentLoading}
        onClose={closeModal}
      />
    </div>
  );
}
