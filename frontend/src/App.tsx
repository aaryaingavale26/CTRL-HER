import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Grid,
  Radar as RadarIcon,
  Cpu,
  Users,
} from 'lucide-react';
import { OnboardingWizard } from './components/OnboardingWizard';
import { SkillGapMatrix } from './components/SkillGapMatrix';
import { CompetencyRadar } from './components/CompetencyRadar';
import { DigitalTwinDashboard } from './components/DigitalTwinDashboard';

type TabType = 'onboarding' | 'gaps' | 'radar' | 'twin';

// Pre-seeded demo official profiles for instant evaluation
const DEMO_OFFICIALS = [
  {
    id: '2b574d66-f752-4348-ab00-17587012f291',
    name: 'Ramesh Chandra Sharma',
    role: 'Junior Statistical Officer',
    division: 'NSSO Field Operations',
  },
  {
    id: '0c60c2de-d20c-4694-b453-2ddc213b135f',
    name: 'Sunita Deshmukh',
    role: 'Senior Statistical Officer',
    division: 'National Accounts Division',
  },
  {
    id: '4a85cf96-3d3b-49b9-86bd-e29857e7126f',
    name: 'Ananya Sen',
    role: 'Emerging Tech Research Fellow',
    division: 'Policy Innovation Cell',
  },
];

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('onboarding');
  const [officialId, setOfficialId] = useState<string>('');
  const [customIdInput, setCustomIdInput] = useState<string>('');
  const [showIdSelector, setShowIdSelector] = useState<boolean>(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Load official ID from localStorage or default to first demo official
  useEffect(() => {
    const savedId = localStorage.getItem('statsaksham_official_id');
    if (savedId) {
      setOfficialId(savedId);
      setActiveTab('gaps'); // Go to gaps if returning official
    } else {
      setOfficialId(DEMO_OFFICIALS[0].id);
    }

    // Ping backend health
    async function checkHealth() {
      try {
        const res = await fetch('http://127.0.0.1:8000/health');
        if (res.ok) setBackendStatus('online');
        else setBackendStatus('offline');
      } catch {
        setBackendStatus('offline');
      }
    }
    checkHealth();
  }, []);

  const handleProfileCreated = (newId: string) => {
    setOfficialId(newId);
    setActiveTab('gaps'); // Automatically redirect to Skill Gap Matrix on creation
  };

  const handleSelectOfficial = (id: string) => {
    setOfficialId(id);
    localStorage.setItem('statsaksham_official_id', id);
    setShowIdSelector(false);
  };

  const currentOfficialName =
    DEMO_OFFICIALS.find((o) => o.id === officialId)?.name || `Official (${officialId.slice(0, 8)}...)`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-orange-600 selection:text-white">
      {/* Top MoSPI / Government Brand Bar */}
      <div className="bg-slate-900 border-b border-slate-800/80 px-4 sm:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Indian Emblem & Ministry Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-bold tracking-wider uppercase text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block shadow-sm shadow-orange-500/50" />
              <span className="w-2.5 h-2.5 rounded-full bg-white inline-block shadow-sm" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50" />
              <span className="ml-1 text-[11px] text-slate-400">Government of India</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-slate-400 hidden sm:inline">
              Ministry of Statistics and Programme Implementation (MoSPI)
            </span>
          </div>

          {/* SIH Tag & Backend Health */}
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-600/15 border border-orange-500/30 text-orange-400 font-semibold text-[10px] tracking-wide">
              SIH26101 • StatSaksham AI
            </span>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus === 'online'
                    ? 'bg-emerald-400 animate-pulse'
                    : backendStatus === 'checking'
                    ? 'bg-amber-400'
                    : 'bg-red-400'
                }`}
              />
              <span className="text-slate-400">
                API {backendStatus === 'online' ? 'Connected' : backendStatus === 'checking' ? 'Checking' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header className="glass-panel sticky top-0 z-40 border-b border-slate-800/80 px-4 sm:px-8 py-3.5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand Logo & Platform Title */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('onboarding')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-600 to-blue-600 flex items-center justify-center shadow-lg shadow-orange-600/20 text-white font-black text-xl">
                Σ
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg text-white tracking-tight">StatSaksham</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    P1
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 tracking-wide">Competency Intelligence & Skill Gap</div>
              </div>
            </div>

            {/* Mobile Official Switcher Trigger */}
            <div className="md:hidden">
              <button
                onClick={() => setShowIdSelector(!showIdSelector)}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1"
              >
                <Users className="w-3 h-3 text-orange-400" />
                <span>Profile</span>
              </button>
            </div>
          </div>

          {/* Center: Module Navigation Tabs */}
          <nav className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs overflow-x-auto w-full md:w-auto justify-center">
            <button
              onClick={() => setActiveTab('onboarding')}
              className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === 'onboarding'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              1. Onboarding
            </button>

            <button
              onClick={() => setActiveTab('gaps')}
              className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === 'gaps'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              2. Skill Gaps
            </button>

            <button
              onClick={() => setActiveTab('radar')}
              className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === 'radar'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <RadarIcon className="w-3.5 h-3.5" />
              3. Radar Chart
            </button>

            <button
              onClick={() => setActiveTab('twin')}
              className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === 'twin'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              4. Digital Twin
            </button>
          </nav>

          {/* Right: Official Selector Dropdown */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowIdSelector(!showIdSelector)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-2 transition"
            >
              <Users className="w-3.5 h-3.5 text-orange-400" />
              <div className="text-left">
                <span className="text-[10px] text-slate-400 block -mb-0.5">Active Profile:</span>
                <span className="font-bold text-white max-w-[150px] truncate block">{currentOfficialName}</span>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showIdSelector && (
              <div className="absolute right-0 mt-2 w-72 p-3 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl z-50 space-y-3">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-1 border-b border-slate-800">
                  Select Demo Profile
                </div>

                <div className="space-y-1.5">
                  {DEMO_OFFICIALS.map((off) => (
                    <button
                      key={off.id}
                      onClick={() => handleSelectOfficial(off.id)}
                      className={`w-full text-left p-2 rounded-xl transition text-xs flex flex-col ${
                        officialId === off.id
                          ? 'bg-orange-600/20 border border-orange-500/40 text-orange-300'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="font-bold text-white">{off.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {off.role} • {off.division}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Custom UUID Input */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-1">Or paste custom UUID:</div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Paste official_id..."
                      value={customIdInput}
                      onChange={(e) => setCustomIdInput(e.target.value)}
                      className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
                    />
                    <button
                      onClick={() => {
                        if (customIdInput.trim()) {
                          handleSelectOfficial(customIdInput.trim());
                          setCustomIdInput('');
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold"
                    >
                      Set
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8">
        {activeTab === 'onboarding' && <OnboardingWizard onProfileCreated={handleProfileCreated} />}
        {activeTab === 'gaps' && <SkillGapMatrix officialId={officialId} />}
        {activeTab === 'radar' && <CompetencyRadar officialId={officialId} />}
        {activeTab === 'twin' && <DigitalTwinDashboard officialId={officialId} />}
      </main>

      {/* Footer */}
      <footer className="glass-panel border-t border-slate-900 px-6 py-5 text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-semibold text-slate-300">StatSaksham AI Platform</span>
            <span>•</span>
            <span>Module P1: Competency Intelligence & Skill Gap</span>
            <span>•</span>
            <span className="text-orange-400 font-medium">SIH26101 MoSPI</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>
              Active ID: <strong className="font-mono text-slate-300">{officialId ? officialId.slice(0, 8) + '...' : 'None'}</strong>
            </span>
            <span>•</span>
            <span>PostgreSQL (Supabase) + Gemini LLM Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
