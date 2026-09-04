import React from 'react';
import { BookOpen, Bot, FileCheck, Award, BarChart3, Lock, FolderCheck } from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const navItems = [
    {
      id: 'studio',
      label: 'AI Learning Studio',
      icon: BookOpen,
      phase: 'Phase 1',
      active: true,
      description: 'Upload & manage statistical learning materials',
    },
    {
      id: 'rag',
      label: 'RAG Assistant',
      icon: Bot,
      phase: 'Phase 2',
      active: false,
      description: 'Context-grounded assistant for statistical methodology',
    },
    {
      id: 'quiz',
      label: 'Quiz Generator',
      icon: FileCheck,
      phase: 'Phase 2',
      active: false,
      description: 'AI MCQ generation & trainer review',
    },
    {
      id: 'assessment',
      label: 'Evaluation & Feedback',
      icon: Award,
      phase: 'Phase 3',
      active: false,
      description: 'Automatic grading & weakness diagnosis',
    },
    {
      id: 'analytics',
      label: 'Capacity Analytics',
      icon: BarChart3,
      phase: 'Phase 3',
      active: false,
      description: 'Official statistical competency metrics',
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Module P3 Navigation
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isSelected = currentTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => item.active && onTabChange(item.id)}
                  disabled={!item.active}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-blue-50 text-gov-blue font-semibold border border-blue-200/60 shadow-sm'
                      : item.active
                      ? 'text-slate-700 hover:bg-slate-100'
                      : 'text-slate-400 bg-slate-50/50 cursor-not-allowed border border-dashed border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-gov-blue' : item.active ? 'text-slate-500' : 'text-slate-300'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.active ? (
                    <span className="px-1.5 py-0.5 text-[10px] rounded font-semibold bg-emerald-100 text-emerald-800 shrink-0">
                      Live
                    </span>
                  ) : (
                    <div className="flex items-center space-x-1 shrink-0">
                      <Lock className="w-3 h-3 text-slate-300" />
                      <span className="text-[9px] text-slate-400 font-mono">{item.phase}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Statistical System Quick Guidelines */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-800 font-semibold mb-1">
            <FolderCheck className="w-4 h-4 text-gov-teal" />
            <span>Supported Standards</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
            Compatible with MoSPI manuals, NSS survey rounds, National Accounts guidelines & CSO reports.
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
        <p className="font-medium text-slate-500">SIH 2026 Prototype</p>
        <p>StatSaksham AI Platform • v1.0.0</p>
      </div>
    </aside>
  );
};
