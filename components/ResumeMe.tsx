'use client';

import { useState, useEffect } from 'react';
import {
  FileText, Clock, ArrowRight, Target, RefreshCw,
  BookOpen, Sparkles, Zap, ChevronRight, Calendar,
  Activity, Sunrise, Sun
} from 'lucide-react';
import MarkdownModal from './MarkdownModal';

interface StateItem {
  label: string;
  status: string;
}

interface RecommendedAction {
  title: string;
  why: string;
  agent: string;
  action: string;
}

interface StillMattersItem {
  title: string;
  path: string;
  reason: string;
}

interface RecentFile {
  relativePath: string;
  name: string;
  mtime: number;
  title: string;
  category: string;
}

interface HorizonBlock {
  title: string;
  body: string;
  items: string[];
}

interface ActivityBlock {
  title: string;
  body: string;
  filesChanged: number;
  highlights: string[];
}

interface ResumeData {
  headline: string;
  currentState: StateItem[];
  recommendedAction: RecommendedAction;
  stillMatters: StillMattersItem[];
  recentChanges: RecentFile[];
  horizons: Record<string, HorizonBlock>;
  activitySummary: { today: ActivityBlock; week: ActivityBlock };
  updatedAt: string;
}

interface FileItem {
  name: string;
  path: string;
  relativePath: string;
  size: number;
  mtime: number;
}

const HORIZON_KEYS = ['today', 'week', 'month', 'year'] as const;
type HorizonKey = (typeof HORIZON_KEYS)[number];

const HORIZON_LABELS: Record<HorizonKey, string> = {
  today: 'Today',
  week: 'Week',
  month: 'Month',
  year: 'Year',
};

const HORIZON_ICONS: Record<HorizonKey, React.ReactNode> = {
  today: <Sun className="w-3.5 h-3.5" />,
  week: <Activity className="w-3.5 h-3.5" />,
  month: <Calendar className="w-3.5 h-3.5" />,
  year: <Calendar className="w-3.5 h-3.5" />,
};

export default function ResumeMe() {
  const [data, setData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileContent, setFileContent] = useState<any>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [continueFeedback, setContinueFeedback] = useState(false);
  const [activeHorizon, setActiveHorizon] = useState<HorizonKey>('today');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/resume');
      const json = await res.json();
      setData(json);
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

  const handleFileClick = async (file: RecentFile) => {
    setContentLoading(true);
    setSelectedFile({
      name: file.name,
      path: file.relativePath,
      relativePath: file.relativePath,
      size: 0,
      mtime: file.mtime,
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

  const handleStillMattersClick = async (item: StillMattersItem) => {
    setContentLoading(true);
    setSelectedFile({
      name: item.path.split('/').pop() || '',
      path: item.path,
      relativePath: item.path,
      size: 0,
      mtime: Date.now(),
    });
    try {
      const res = await fetch(`/api/content/${encodeURIComponent(item.path)}`);
      const json = await res.json();
      setFileContent(json);
    } catch {
      setFileContent(null);
    } finally {
      setContentLoading(false);
    }
  };

  const horizon = data?.horizons?.[activeHorizon];

  return (
    <div className="h-full overflow-auto" style={{ height: 'calc(100vh - 140px)' }}>
      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-2 text-sm text-on-surface-variant">Building your resume...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center">
          <p className="text-red-500">{error}</p>
          <button onClick={fetchData} className="mt-3 text-sm text-primary hover:underline">
            Retry
          </button>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto pb-8 px-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-on-surface flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Resume Me
              </h1>
              <p className="text-sm text-on-surface-variant mt-0.5">{data?.headline}</p>
            </div>
            <button
              onClick={fetchData}
              className="p-1.5 hover:bg-hover rounded transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5 text-on-surface-variant" />
            </button>
          </div>

          {/* Horizon tabs */}
          <div className="flex items-center gap-1 mb-4 border-b border-border pb-0.5">
            {HORIZON_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => setActiveHorizon(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors ${
                  activeHorizon === key
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant'
                }`}
              >
                {HORIZON_ICONS[key]}
                {HORIZON_LABELS[key]}
              </button>
            ))}
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left column (2/3) */}
            <div className="lg:col-span-2 space-y-5">
              {/* Direction panel (active horizon) */}
              {horizon && (
                <section>
                  <h2 className="text-sm font-semibold text-on-surface mb-2 flex items-center gap-1.5">
                    <Sunrise className="w-4 h-4 text-violet-500" />
                    Direction — {HORIZON_LABELS[activeHorizon]}
                  </h2>
                  <div className="bg-surface border border-border rounded-lg p-3 space-y-2">
                    <p className="text-sm text-on-surface leading-relaxed">{horizon.body}</p>
                    {horizon.items.length > 0 && (
                      <ul className="space-y-1">
                        {horizon.items.map((item, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-on-surface-variant flex items-start gap-1.5"
                          >
                            <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              )}

              {/* Activity Summary */}
              <section>
                <h2 className="text-sm font-semibold text-on-surface mb-2 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-sky-500" />
                  Recent Summary
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Today */}
                  {data?.activitySummary?.today && (
                    <div className="bg-surface border border-border rounded-lg p-3">
                      <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                        Today
                      </p>
                      <p className="text-sm text-on-surface mb-1">{data.activitySummary.today.body}</p>
                      {data.activitySummary.today.highlights.length > 0 && (
                        <ul className="space-y-0.5">
                          {data.activitySummary.today.highlights.map((h, idx) => (
                            <li key={idx} className="text-xs text-on-surface-variant truncate">
                              • {h}
                            </li>
                          ))}
                        </ul>
                      )}
                      {data.activitySummary.today.filesChanged === 0 && (
                        <p className="text-xs text-on-surface-variant italic mt-1">No changes yet today.</p>
                      )}
                    </div>
                  )}

                  {/* This week */}
                  {data?.activitySummary?.week && (
                    <div className="bg-surface border border-border rounded-lg p-3">
                      <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                        This Week
                      </p>
                      <p className="text-sm text-on-surface mb-1">{data.activitySummary.week.body}</p>
                      {data.activitySummary.week.highlights.length > 0 && (
                        <ul className="space-y-0.5">
                          {data.activitySummary.week.highlights.slice(0, 4).map((h, idx) => (
                            <li key={idx} className="text-xs text-on-surface-variant truncate">
                              • {h}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* Recommended Next Action */}
              {data?.recommendedAction && (
                <section>
                  <h2 className="text-sm font-semibold text-on-surface mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-green-500" />
                    Recommended Next Action
                  </h2>
                  <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                          {data.recommendedAction.title}
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                          {data.recommendedAction.why}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                        Agent: {data.recommendedAction.agent}
                      </span>
                      <span className="text-[11px] text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                        {data.recommendedAction.action}
                      </span>
                    </div>
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          setContinueFeedback(true);
                          setTimeout(() => setContinueFeedback(false), 3000);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Continue
                      </button>
                      {continueFeedback && (
                        <span className="ml-3 text-xs text-green-600 dark:text-green-400 animate-pulse">
                          Continue noted — execution not yet wired.
                        </span>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Current State */}
              {data?.currentState && data.currentState.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-on-surface mb-2 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-primary" />
                    Current State
                  </h2>
                  <div className="space-y-2">
                    {data.currentState.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-surface border border-border rounded-lg p-3 flex items-start gap-3"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-on-surface">{item.label}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">{item.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right column (1/3) */}
            <div className="space-y-5">
              {/* Still Matters */}
              {data?.stillMatters && data.stillMatters.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-on-surface mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-amber-500" />
                    Still Matters
                  </h2>
                  <div className="space-y-1.5">
                    {data.stillMatters.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-surface border border-border rounded-lg p-2.5 cursor-pointer hover:bg-hover transition-colors"
                        onClick={() => handleStillMattersClick(item)}
                      >
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-on-surface truncate leading-snug">
                              {item.title}
                            </p>
                            <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">
                              {item.reason}
                            </p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant flex-shrink-0 mt-0.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Recent Changes */}
              {data?.recentChanges && data.recentChanges.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-on-surface mb-2 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-500" />
                    Recent Changes
                  </h2>
                  <div className="space-y-0.5">
                    {data.recentChanges.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-hover cursor-pointer transition-colors"
                        onClick={() => handleFileClick(file)}
                      >
                        <FileText className="w-3.5 h-3.5 text-on-surface-variant flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-on-surface truncate leading-snug">{file.title}</p>
                          <p className="text-xs text-on-surface-variant truncate">{file.relativePath}</p>
                        </div>
                        <span className="text-xs text-on-surface-variant flex-shrink-0">
                          {formatDate(file.mtime)}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>

          {/* Footer */}
          {data?.updatedAt && (
            <div className="text-xs text-on-surface-variant text-center mt-6 pt-4 border-t border-border">
              Updated {new Date(data.updatedAt).toLocaleString('en-AU')}
            </div>
          )}
        </div>
      )}

      <MarkdownModal
        file={selectedFile}
        content={fileContent}
        loading={contentLoading}
        onClose={handleCloseModal}
      />
    </div>
  );
}
