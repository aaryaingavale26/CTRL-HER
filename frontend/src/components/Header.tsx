import React from 'react';
import { Shield, Sparkles, Server } from 'lucide-react';
import { HealthResponse } from '../types';

interface HeaderProps {
  health: HealthResponse | null;
  isLoadingHealth: boolean;
}

export const Header: React.FC<HeaderProps> = ({ health, isLoadingHealth }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Left Side Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gov-blue text-white flex items-center justify-center font-bold text-xl shadow-inner">
              <span className="tracking-tight">सा</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">StatSaksham AI</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                  <Sparkles className="w-3 h-3 mr-1 text-blue-600" />
                  Module P3
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Official Statistical System Capacity Building & Learning Engine
              </p>
            </div>
          </div>

          {/* Center Badge - Government Trust Anchor */}
          <div className="hidden md:flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 text-xs text-slate-600">
            <Shield className="w-4 h-4 text-gov-blue" />
            <span className="font-semibold text-slate-700">MoSPI Capacity Building Portal</span>
            <span className="text-slate-300">•</span>
            <span>Indian Official Statistics</span>
          </div>

          {/* Right Side System Status Indicator */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Server className="w-3.5 h-3.5 text-slate-500" />
              <div className="flex items-center space-x-1.5">
                {isLoadingHealth ? (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                ) : health?.status === 'healthy' ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                )}
                <span className="font-medium text-slate-700">
                  Backend: {isLoadingHealth ? 'Checking...' : health?.status === 'healthy' ? 'Active' : 'Offline'}
                </span>
                {health?.llm_provider && (
                  <span className="text-slate-500 text-[11px] bg-slate-200 px-1.5 py-0.5 rounded font-mono">
                    {health.llm_provider.toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Profile Avatar / User Context */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center border border-slate-300">
                SO
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">Statistical Officer</p>
                <p className="text-[10px] text-slate-500">NSSO / Central Cadre</p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
