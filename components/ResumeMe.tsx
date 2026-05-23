'use client';

import { useState, useEffect } from 'react';
import {
  FileText, ExternalLink, CheckCircle, Eye, Send, Clock,
  AlertCircle, Zap, ChevronRight, RefreshCw, BookOpen,
  GitBranch, Target, Sparkles
} from 'lucide-react';
import MarkdownModal from './MarkdownModal';

interface ResumeData {
  decision: string;
  frontmatter: Record<string, unknown> | null;
  activeProjects: Array<{ title: string; path: string; reason: string }>;
  updatedAt: string;
}

interface RecentFile {
  relativePath: string;
  name: string;
  mtime: number;
  title: string;
  category: string;
}

interface FileItem {
  name: string;
  path: string;
  relativePath: string;
  size: number;
  mtime: number;
}

function parseActionLines(decision: string): string[] {
  const lines = decision.split('\n');
  const actionLines: string[] = [];
  let inAction = false;
  for (const line of lines) {
    if (/recommended next action/i.test(line)) {
      inAction = true;
      continue;
    }
    if (inAction && line.trim() && !line.startsWith('#')) {
      actionLines.push(line.replace(/^- /, '').trim());
      if (actionLines.length >= 3) break;
    }
    if (inAction && (line.startsWith('##') || line.startsWith('---'))) break;
  }
  return actionLines.length > 0 ? actionLines : [
    'Review the cleaned Personal Vault UI, then approve Context Builder MVP.'
  ];
}

function parseCurrentStateSections(decision: string): { label: string; items: string[] }[] {
  const sections: { label: string; items: string[] }[] = [];
  let currentLabel = '';
  let currentItems: string[] = [];

  const lines = decision.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    const h3Match = trimmed.match(/^###\s+(.+)/);
    const h2Match = trimmed.match(/^##\s+(.+)/);
    const listItem = trimmed.match(/^\d+\.\s+(.+)/);
    const bullet = trimmed.match(/^-\s+(.+)/);

    if (h2Match || h3Match) {
      if (currentLabel && currentItems.length > 0) {
        sections.push({ label: currentLabel, items: [...currentItems] });
      }
      currentLabel = h2Match?.[1] || h3Match![1];
      // Skip "Recommended Next Action" — we render that separately
      if (/recommended next action/i.test(currentLabel)) {
        currentLabel = '';
      }
      currentItems = [];
    } else if (listItem && currentLabel) {
      currentItems.push(listItem[1]);
    } else if (bullet && currentLabel) {
      currentItems.push(bullet[1]);
    }
  }
  if (currentLabel && currentItems.length > 0) {
    sections.push({ label: currentLabel, items: currentItems });
  }
  return sections;
}

export default function ResumeMe() {
  const [data, setData] = useState<ResumeData | null>(null);
  const [recent, setRecent] = useState<RecentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileContent, setFileContent] = useState<any>(null);
  const [contentLoading, setContentLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resumeRes, recentRes] = await Promise.all([
        fetch('/api/resume'),
        fetch('/api/recent?limit=5')
      ]);
      const resumeData = await resumeRes.json();
      const recentData = await recentRes.json();
      setData(resumeData);
      setRecent(recentData.files || []);
    } catch (err) {
      setError('Failed to load resume data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleActionClick = (action: string) => {
    const messages: Record<string, string> = {
      continue: 'Continue — noted. (Agent execution not yet wired.)',
      review: 'Review — would open a diff/context overlay. (Not yet wired.)',
      delegate: 'Delegate — would route to an agent. (Not yet wired.)',
      'not-now': 'Dismissed. Resume Me will surface again on next visit.'
    };
    setActionFeedback(messages[action] || 'Action noted.');
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleFileClick = async (file: RecentFile) => {
    setContentLoading(true);
    setSelectedFile({
      name: file.name,
      path: file.relativePath,
      relativePath: file.relativePath,
      size: 0,
      mtime: file.mtime
    });
    try {
      const res = await fetch(`/api/content/${encodeURIComponent(file.relativePath)}`);
      const json = await res.json();
      setFileContent(json);
    } catch {
      setFileContent(null);
    } finally {
      setContentLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedFile(null);
    setFileContent(null);
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diffH = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
    if (diffH < 1) return `${Math.round(diffH * 60)}m ago`;
    if (diffH < 24) return `${Math.round(diffH)}h ago`;
    return d.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
  };

  const actionRecommendations = data ? parseActionLines(data.decision) : [];
  const stateSections = data ? parseCurrentStateSections(data.decision) : [];

  return (
    <div className="h-full overflow-auto" style={{ height: 'calc(100vh - 140px)' }}>
      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-on-surface-variant">Building your resume...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center">
          <p className="text-red-500">{error}</p>
          <button onClick={fetchData} className="mt-3 text-sm text-primary hover:underline">Retry</button>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-5 pb-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-on-surface flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Resume Me
              </h1>
              <p className="text-sm text-on-surface-variant mt-0.5">What are we doing next?</p>
            </div>
            <button onClick={fetchData} className="p-1.5 hover:bg-hover rounded transition-colors" title="Refresh">
              <RefreshCw className="w-3.5 h-3.5 text-on-surface-variant" />
            </button>
          </div>

          {/* Action buttons bar */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleActionClick('continue')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Continue
            </button>
            <button
              onClick={() => handleActionClick('review')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-on-surface text-xs font-medium rounded-lg hover:bg-surface-variant transition-colors"
            >
              <Eye className="w-3.5 h-3.5" /> Review
            </button>
            <button
              onClick={() => handleActionClick('delegate')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-on-surface text-xs font-medium rounded-lg hover:bg-surface-variant transition-colors"
            >
              <Send className="w-3.5 h-3.5" /> Delegate
            </button>
            <button
              onClick={() => handleActionClick('not-now')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-on-surface-variant text-xs font-medium rounded-lg hover:bg-surface-variant transition-colors"
            >
              <Clock className="w-3.5 h-3.5" /> Not now
            </button>
          </div>

          {actionFeedback && (
            <div className="px-3 py-2 bg-surface-variant border border-border rounded-lg text-xs text-on-surface animate-pulse">
              {actionFeedback}
            </div>
          )}

          {/* Current State */}
          {stateSections.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-on-surface mb-2 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-primary" /> Current State
              </h2>
              <div className="space-y-2">
                {stateSections.map((section, idx) => (
                  <div key={idx} className="bg-surface border border-border rounded-lg p-3">
                    {!section.label.toLowerCase().includes('current state') && (
                      <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">{section.label}</h3>
                    )}
                    <ul className="space-y-1">
                      {section.items.map((item, i) => (
                        <li key={i} className="text-sm text-on-surface leading-relaxed flex items-start gap-2">
                          <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Still Matters / Active Projects */}
          {data?.activeProjects && data.activeProjects.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-on-surface mb-2 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-500" /> Still Matters
              </h2>
              <div className="space-y-1.5">
                {data.activeProjects.map((proj, idx) => (
                  <div
                    key={idx}
                    className="bg-surface border border-border rounded-lg p-2.5 flex items-start gap-2.5 cursor-pointer hover:bg-hover transition-colors"
                    onClick={() => handleFileClick({
                      relativePath: proj.path,
                      name: proj.path.split('/').pop() || '',
                      mtime: Date.now(),
                      title: proj.title,
                      category: proj.path.split('/')[1] || 'other'
                    })}
                  >
                    <GitBranch className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-on-surface truncate">{proj.title}</div>
                      <div className="text-xs text-on-surface-variant truncate">{proj.reason}</div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-on-surface-variant flex-shrink-0 mt-0.5" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recent Changes */}
          {recent.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-on-surface mb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-500" /> Recent Changes
              </h2>
              <div className="space-y-1">
                {recent.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-hover cursor-pointer transition-colors"
                    onClick={() => handleFileClick(file)}
                  >
                    <FileText className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-on-surface truncate">{file.title}</div>
                      <div className="text-xs text-on-surface-variant truncate">{file.relativePath}</div>
                    </div>
                    <span className="text-xs text-on-surface-variant flex-shrink-0">{formatDate(file.mtime)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recommended Next Action */}
          {actionRecommendations.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-on-surface mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-green-500" /> Recommended Next Action
              </h2>
              <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-3">
                {actionRecommendations.map((rec, idx) => (
                  <p key={idx} className="text-sm text-green-800 dark:text-green-300 leading-relaxed">
                    {rec}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* Footer */}
          {data?.updatedAt && (
            <div className="text-xs text-on-surface-variant text-center pt-2">
              Updated {new Date(data.updatedAt).toLocaleString('en-AU')}
            </div>
          )}
        </div>
      )}

      {/* Modal for viewing file content */}
      <MarkdownModal
        file={selectedFile}
        content={fileContent}
        loading={contentLoading}
        onClose={handleCloseModal}
      />
    </div>
  );
}
