import FileBrowser from '@/components/FileBrowser';
import Breadcrumbs from '@/components/Breadcrumbs';
import QuickFilters from '@/components/QuickFilters';
import StatsCards from '@/components/StatsCards';

export default function Home() {
  return (
    <div className="space-y-4">
      {/* Header section - More compact */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-on-surface">My Vault</h1>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Local-first AI memory system • Data stored at{' '}
              <code className="bg-surface-variant px-1 py-0.5 rounded text-xs font-mono">~/personal-vault/</code>
            </p>
          </div>
          <div className="flex items-center space-x-1.5">
            <button className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-medium rounded transition-colors shadow-sm flex items-center space-x-1.5">
              <span>+ New</span>
            </button>
            <button className="px-3 py-1.5 border border-border hover:bg-hover text-on-surface text-xs font-medium rounded transition-colors">
              Upload
            </button>
          </div>
        </div>
        
        <Breadcrumbs />
      </div>

      {/* Quick filters - More compact */}
      <div className="bg-surface rounded-lg border border-border p-3">
        <QuickFilters />
      </div>

      {/* Stats cards - More compact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-surface rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-on-surface">142</div>
              <div className="text-xs text-on-surface-variant mt-0.5">Total files</div>
            </div>
            <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
              <span className="text-primary text-sm">📄</span>
            </div>
          </div>
        </div>
        
        <div className="bg-surface rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-on-surface">4.2 GB</div>
              <div className="text-xs text-on-surface-variant mt-0.5">Storage used</div>
            </div>
            <div className="w-8 h-8 bg-success/10 rounded flex items-center justify-center">
              <span className="text-success text-sm">💾</span>
            </div>
          </div>
        </div>
        
        <div className="bg-surface rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-on-surface">24</div>
              <div className="text-xs text-on-surface-variant mt-0.5">Modified today</div>
            </div>
            <div className="w-8 h-8 bg-warning/10 rounded flex items-center justify-center">
              <span className="text-warning text-sm">🕒</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content - File browser */}
      <div className="bg-surface rounded-lg border border-border shadow overflow-hidden">
        <FileBrowser />
      </div>

      {/* Info footer - More compact */}
      <div className="bg-surface-variant rounded-lg border border-border p-3">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-bold text-sm">i</span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-on-surface mb-1">About Personal Vault</h3>
            <p className="text-xs text-on-surface-variant">
              Local-first web interface for AI memory vault. Files organized by year/month/day.
              Opens in new tabs. Built with Next.js 15 + Material Design.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-xs bg-surface px-1.5 py-0.5 rounded text-on-surface-variant">Local-first</span>
              <span className="text-xs bg-surface px-1.5 py-0.5 rounded text-on-surface-variant">AI memory</span>
              <span className="text-xs bg-surface px-1.5 py-0.5 rounded text-on-surface-variant">Markdown</span>
              <span className="text-xs bg-surface px-1.5 py-0.5 rounded text-on-surface-variant">Search</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
