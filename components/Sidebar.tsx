'use client';

import { 
  HardDrive, 
  Clock, 
  Star, 
  Share2, 
  Trash2, 
  Folder,
  FileText,
  Image as ImageIcon,
  FileCode,
  FileSpreadsheet,
  FileAudio,
  FileVideo,
  Archive,
  Settings,
  HelpCircle,
  ChevronRight,
  Plus,
  Upload
} from 'lucide-react';
import { useState } from 'react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
  active?: boolean;
  onClick?: () => void;
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  const mainItems: SidebarItem[] = [
    {
      id: 'my-vault',
      label: 'My Vault',
      icon: <HardDrive className="w-5 h-5" />,
      active: true,
    },
    {
      id: 'recent',
      label: 'Recent',
      icon: <Clock className="w-5 h-5" />,
      count: 12,
    },
    {
      id: 'starred',
      label: 'Starred',
      icon: <Star className="w-5 h-5" />,
      count: 3,
    },
    {
      id: 'shared',
      label: 'Shared',
      icon: <Share2 className="w-5 h-5" />,
    },
    {
      id: 'trash',
      label: 'Trash',
      icon: <Trash2 className="w-5 h-5" />,
    },
  ];

  const fileTypeItems: SidebarItem[] = [
    {
      id: 'documents',
      label: 'Documents',
      icon: <FileText className="w-5 h-5" />,
      count: 24,
    },
    {
      id: 'images',
      label: 'Images',
      icon: <ImageIcon className="w-5 h-5" />,
      count: 8,
    },
    {
      id: 'code',
      label: 'Code',
      icon: <FileCode className="w-5 h-5" />,
      count: 15,
    },
    {
      id: 'spreadsheets',
      label: 'Spreadsheets',
      icon: <FileSpreadsheet className="w-5 h-5" />,
    },
    {
      id: 'audio',
      label: 'Audio',
      icon: <FileAudio className="w-5 h-5" />,
    },
    {
      id: 'video',
      label: 'Video',
      icon: <FileVideo className="w-5 h-5" />,
    },
    {
      id: 'archives',
      label: 'Archives',
      icon: <Archive className="w-5 h-5" />,
    },
  ];

  const storageItems = [
    { label: 'Used', value: '4.2 GB', percentage: 42, color: 'bg-primary' },
    { label: 'Free', value: '5.8 GB', percentage: 58, color: 'bg-surface-variant' },
  ];

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} border-r border-border bg-surface flex flex-col transition-all duration-200 flex-shrink-0`}>
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 w-6 h-6 bg-surface border border-border rounded-full flex items-center justify-center z-10 hover:bg-surface-variant"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <ChevronRight className={`w-3 h-3 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
      </button>

      {/* Quick actions */}
      <div className="p-4 border-b border-border">
        <button className="w-full bg-primary hover:bg-primary-dark text-white rounded-lg py-2.5 px-3 flex items-center justify-center space-x-2 text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          {!collapsed && <span>New Note</span>}
        </button>
        
        {!collapsed && (
          <button className="w-full mt-2 border border-border hover:bg-surface-variant text-on-surface rounded-lg py-2.5 px-3 flex items-center justify-center space-x-2 text-sm font-medium transition-colors">
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {/* Main sections */}
        <div className="px-3">
          <h3 className={`text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-2 ${collapsed ? 'text-center' : 'px-3'}`}>
            {collapsed ? '···' : 'Navigation'}
          </h3>
          <ul className="space-y-1">
            {mainItems.map((item) => (
              <li key={item.id}>
                <button
                  className={`w-full flex items-center ${collapsed ? 'justify-center px-3' : 'px-3'} py-2 rounded-lg text-sm transition-colors ${
                    item.active
                      ? 'bg-active text-primary font-medium'
                      : 'hover:bg-surface-variant text-on-surface'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className={`${item.active ? 'text-primary' : 'text-on-surface-variant'}`}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="ml-3 flex-1 text-left">{item.label}</span>
                      {item.count !== undefined && (
                        <span className="text-xs bg-surface-variant text-on-surface-variant px-1.5 py-0.5 rounded">
                          {item.count}
                        </span>
                      )}
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* File types */}
        {!collapsed && (
          <div className="mt-6 px-3">
            <h3 className="text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-2 px-3">
              File Types
            </h3>
            <ul className="space-y-1">
              {fileTypeItems.map((item) => (
                <li key={item.id}>
                  <button
                    className="w-full flex items-center px-3 py-2 rounded-lg text-sm hover:bg-surface-variant text-on-surface transition-colors"
                  >
                    <span className="text-on-surface-variant">{item.icon}</span>
                    <span className="ml-3 flex-1 text-left">{item.label}</span>
                    {item.count !== undefined && (
                      <span className="text-xs bg-surface-variant text-on-surface-variant px-1.5 py-0.5 rounded">
                        {item.count}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Storage */}
        {!collapsed && (
          <div className="mt-6 px-3">
            <h3 className="text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-2 px-3">
              Storage
            </h3>
            <div className="px-3">
              <div className="text-sm font-medium text-on-surface mb-2">10 GB total</div>
              
              {/* Storage bar */}
              <div className="h-2 bg-surface-variant rounded-full overflow-hidden mb-3">
                <div className="h-full flex">
                  {storageItems.map((item, index) => (
                    <div
                      key={item.label}
                      className={`h-full ${item.color}`}
                      style={{ width: `${item.percentage}%` }}
                      title={`${item.label}: ${item.value}`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Storage labels */}
              <div className="flex justify-between text-xs text-on-surface-variant">
                {storageItems.map((item) => (
                  <div key={item.label} className="flex items-center">
                    <div className={`w-2 h-2 rounded-full ${item.color} mr-1.5`} />
                    <span>{item.label}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border p-4">
        {!collapsed ? (
          <div className="space-y-3">
            <button className="w-full flex items-center px-3 py-2 rounded-lg text-sm hover:bg-surface-variant text-on-surface transition-colors">
              <Settings className="w-5 h-5 text-on-surface-variant" />
              <span className="ml-3">Settings</span>
            </button>
            <button className="w-full flex items-center px-3 py-2 rounded-lg text-sm hover:bg-surface-variant text-on-surface transition-colors">
              <HelpCircle className="w-5 h-5 text-on-surface-variant" />
              <span className="ml-3">Help & feedback</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            <button className="p-2 rounded-lg hover:bg-surface-variant" title="Settings">
              <Settings className="w-5 h-5 text-on-surface-variant" />
            </button>
            <button className="p-2 rounded-lg hover:bg-surface-variant" title="Help">
              <HelpCircle className="w-5 h-5 text-on-surface-variant" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
