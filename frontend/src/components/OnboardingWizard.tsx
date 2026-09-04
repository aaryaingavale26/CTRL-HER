import React, { useState, useEffect } from 'react';
import {
  User,
  Award,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Star,
  Plus,
  X,
  Zap,
} from 'lucide-react';
import api from '../services/api';
import type {
  CompetenciesGroupedResponse,
  OfficialProfileCreatePayload,
  SelfAssessmentInput,
} from '../types/competency';

interface OnboardingWizardProps {
  onProfileCreated: (officialId: string) => void;
}

const PRESET_ROLES = [
  'Junior Statistical Officer',
  'Senior Statistical Officer',
  'Data Analyst',
  'Director (National Accounts)',
  'Director (Price Statistics)',
  'Statistical Consultant',
];

const PRESET_DEPARTMENTS = [
  'National Sample Survey Office (NSSO)',
  'Central Statistics Office (CSO)',
  'National Accounts Division (NAD)',
  'Field Operations Division (FOD)',
  'Survey Design & Research Division (SDRD)',
  'Economic Statistics Division (ESD)',
  'Data Quality Assurance Division (DQAD)',
];

const SUGGESTED_TRAININGS = [
  'National Statistical Systems & SDMX Standards Workshop',
  'Python for Statistical Analysis & Large-Scale Data Scrutiny',
  'PLFS & Periodic Labour Force Survey Fieldwork Protocols',
  'State GDP (GSDP) & Macroeconomic Compilation Techniques',
  'Cybersecurity & DPDP Act Compliance for Government Portals',
  'GIS & Spatial Analytics in Agricultural Census',
  'Advanced SQL & PostgreSQL for Administrative Datasets',
  'Leadership & Agile Project Governance in Public Administration',
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onProfileCreated }) => {
  const [step, setStep] = useState<number>(1);
  const [loadingCompetencies, setLoadingCompetencies] = useState<boolean>(true);
  const [competenciesData, setCompetenciesData] = useState<CompetenciesGroupedResponse | null>(null);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('Statistical');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState<string>('');
  const [designation, setDesignation] = useState<string>('Junior Statistical Officer');
  const [department, setDepartment] = useState<string>('National Sample Survey Office (NSSO)');
  const [jobRole, setJobRole] = useState<string>('Junior Statistical Officer');
  const [currentAssignment, setCurrentAssignment] = useState<string>('Field Operations Division - Annual Survey of Industries');
  const [education, setEducation] = useState<string>('M.Sc. in Applied Statistics');
  const [experienceYears, setExperienceYears] = useState<number>(4);
  const [careerObjective, setCareerObjective] = useState<string>(
    'Advance into Senior Statistical Officer role specializing in National Accounts macro-aggregation and automated scrutiny.'
  );

  // Trainings
  const [trainings, setTrainings] = useState<string[]>([
    'National Statistical Systems & SDMX Standards Workshop',
    'Python for Statistical Analysis & Large-Scale Data Scrutiny',
  ]);
  const [newTrainingInput, setNewTrainingInput] = useState<string>('');

  // Self Assessments: map competency_id -> rating (1.0 to 5.0)
  const [ratings, setRatings] = useState<Record<number, number>>({});

  // Fetch 33 master competencies on mount
  useEffect(() => {
    async function fetchCatalog() {
      try {
        setLoadingCompetencies(true);
        const data = await api.getCompetencies();
        setCompetenciesData(data);

        // Initialize default ratings with 3.0
        const initialRatings: Record<number, number> = {};
        Object.values(data.categories).forEach((items) => {
          items.forEach((comp) => {
            initialRatings[comp.id] = 3.0;
          });
        });
        setRatings(initialRatings);
      } catch (err: any) {
        console.error('Failed to load master competencies:', err);
        setError('Failed to connect to the competency database. Please ensure backend server is active.');
      } finally {
        setLoadingCompetencies(false);
      }
    }
    fetchCatalog();
  }, []);

  // Quick Demo Profiles for instant 1-click test
  const loadDemoProfile = (type: 'JSO' | 'SSO' | 'Analyst') => {
    if (type === 'JSO') {
      setFullName('Ramesh Chandra Sharma');
      setDesignation('Junior Statistical Officer');
      setDepartment('National Sample Survey Office (NSSO)');
      setJobRole('Junior Statistical Officer');
      setCurrentAssignment('Field Operations Division - PLFS Scrutiny');
      setEducation('M.Sc. in Statistics, Delhi University');
      setExperienceYears(3);
      setCareerObjective('Transition into macro data modeling and data quality assurance pipelines.');
      setTrainings([
        'National Statistical Systems & SDMX Standards Workshop',
        'Python for Statistical Analysis & Large-Scale Data Scrutiny',
      ]);
      setRatings({
        1: 4.2, 2: 4.0, 3: 2.5, 4: 3.0, 5: 3.5, 6: 2.8, 7: 3.0, 8: 3.2, 9: 3.0, 10: 3.8,
        11: 3.5, 12: 2.8, 13: 3.2, 14: 2.5, 15: 3.0, 16: 2.0, 17: 2.5, 18: 3.2, 19: 2.5, 20: 2.0, 21: 2.5, 22: 3.0,
        23: 3.0, 24: 3.2, 25: 3.0, 26: 2.5, 27: 3.0,
        28: 2.8, 29: 3.5, 30: 3.0, 31: 4.2, 32: 3.0, 33: 2.8
      });
    } else if (type === 'SSO') {
      setFullName('Sunita Deshmukh');
      setDesignation('Senior Statistical Officer');
      setDepartment('National Accounts Division (NAD)');
      setJobRole('Senior Statistical Officer');
      setCurrentAssignment('State GDP (GSDP) & Gross Value Added Estimation');
      setEducation('M.Phil. in Quantitative Economics');
      setExperienceYears(7);
      setCareerObjective('Lead national Price Statistics reform and high-frequency macroeconomic dashboard integration.');
      setTrainings([
        'National Accounts & GSDP Estimation',
        'Advanced SQL & PostgreSQL for Administrative Datasets',
        'Cybersecurity & DPDP Act Compliance for Government Portals',
      ]);
      setRatings({
        1: 4.5, 2: 4.5, 3: 4.8, 4: 4.2, 5: 4.0, 6: 3.8, 7: 4.0, 8: 3.8, 9: 4.2, 10: 4.5,
        11: 2.5, 12: 3.0, 13: 3.5, 14: 3.5, 15: 3.5, 16: 3.0, 17: 2.8, 18: 3.5, 19: 2.0, 20: 2.5, 21: 2.5, 22: 3.5,
        23: 3.5, 24: 3.8, 25: 3.8, 26: 3.0, 27: 3.2,
        28: 4.0, 29: 4.2, 30: 3.8, 31: 4.5, 32: 4.0, 33: 3.5
      });
    } else {
      setFullName('Vikramaditya Iyer');
      setDesignation('Data Analyst');
      setDepartment('Data Quality Assurance Division (DQAD)');
      setJobRole('Data Analyst');
      setCurrentAssignment('Automated Anomaly Detection & AI Data Pipelines');
      setEducation('B.Tech in Computer Science & AI');
      setExperienceYears(4);
      setCareerObjective('Deploy automated AI validation systems across all national surveys.');
      setTrainings([
        'Python for Statistical Analysis & Large-Scale Data Scrutiny',
        'Advanced SQL & PostgreSQL for Administrative Datasets',
      ]);
      setRatings({
        1: 3.2, 2: 3.0, 3: 2.0, 4: 2.5, 5: 2.5, 6: 2.0, 7: 2.2, 8: 3.0, 9: 3.5, 10: 4.5,
        11: 4.8, 12: 3.8, 13: 4.5, 14: 2.5, 15: 2.0, 16: 2.0, 17: 3.5, 18: 4.8, 19: 4.5, 20: 4.0, 21: 4.2, 22: 4.2,
        23: 4.0, 24: 4.0, 25: 3.5, 26: 3.8, 27: 4.0,
        28: 3.0, 29: 3.5, 30: 3.5, 31: 4.0, 32: 3.5, 33: 3.2
      });
    }
  };

  const handleAddTraining = () => {
    if (newTrainingInput.trim() && !trainings.includes(newTrainingInput.trim())) {
      setTrainings([...trainings, newTrainingInput.trim()]);
      setNewTrainingInput('');
    }
  };

  const handleRemoveTraining = (index: number) => {
    setTrainings(trainings.filter((_, i) => i !== index));
  };

  const handleRatingChange = (competencyId: number, value: number) => {
    setRatings((prev) => ({
      ...prev,
      [competencyId]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Official Full Name is required.');
      setStep(1);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Convert ratings map to self-assessment list
      const selfAssessmentList: SelfAssessmentInput[] = Object.entries(ratings).map(([id, rating]) => ({
        competency_id: Number(id),
        rating: Number(rating),
      }));

      const payload: OfficialProfileCreatePayload = {
        full_name: fullName.trim(),
        designation: designation.trim(),
        department: department.trim(),
        job_role: jobRole.trim(),
        current_assignment: currentAssignment.trim() || undefined,
        education: education.trim() || undefined,
        experience_years: Number(experienceYears) || 0,
        previous_training: trainings,
        career_objective: careerObjective.trim() || undefined,
        self_assessments: selfAssessmentList,
      };

      const response = await api.createProfile(payload);
      // Persist created ID in localStorage for session convenience
      localStorage.setItem('statsaksham_official_id', response.official_id);
      onProfileCreated(response.official_id);
    } catch (err: any) {
      console.error('Failed to create profile:', err);
      setError(err.response?.data?.detail || 'An error occurred during profile creation and AI calibration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold tracking-wide uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              MoSPI Competency Onboarding
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Official Profile & Baseline Ingestion
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Enter official credentials and self-evaluation. Our AI engine will calibrate scores against verified
              tenure, training credentials, and MoSPI role benchmarks.
            </p>
          </div>

          {/* 1-Click Demo Profiles */}
          <div className="flex flex-col items-start sm:items-end gap-2">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Quick Fill Demo Profile:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => loadDemoProfile('JSO')}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                JSO (Field)
              </button>
              <button
                type="button"
                onClick={() => loadDemoProfile('SSO')}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                SSO (Accounts)
              </button>
              <button
                type="button"
                onClick={() => loadDemoProfile('Analyst')}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                Data Analyst
              </button>
            </div>
          </div>
        </div>

        {/* Wizard Progress Tabs */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center gap-3 p-3 rounded-xl transition text-left ${
              step === 1
                ? 'bg-orange-600/15 border border-orange-500/40 text-orange-400'
                : 'bg-slate-900/50 border border-slate-800 text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                step === 1 ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              1
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider">Step 1</div>
              <div className="text-sm font-medium text-slate-200 hidden sm:block">Official Details</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStep(2)}
            className={`flex items-center gap-3 p-3 rounded-xl transition text-left ${
              step === 2
                ? 'bg-orange-600/15 border border-orange-500/40 text-orange-400'
                : 'bg-slate-900/50 border border-slate-800 text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                step === 2 ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              2
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider">Step 2</div>
              <div className="text-sm font-medium text-slate-200 hidden sm:block">Training & Career</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStep(3)}
            className={`flex items-center gap-3 p-3 rounded-xl transition text-left ${
              step === 3
                ? 'bg-orange-600/15 border border-orange-500/40 text-orange-400'
                : 'bg-slate-900/50 border border-slate-800 text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                step === 3 ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              3
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider">Step 3</div>
              <div className="text-sm font-medium text-slate-200 hidden sm:block">33 Competencies</div>
            </div>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Wizard Form Content */}
      <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800">
        {/* ============================================================ */}
        {/* STEP 1: Official Profile */}
        {/* ============================================================ */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-orange-500" />
                Personal & Administrative Profile
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter core administrative metadata for official role matching and benchmark lookup.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., Ramesh Chandra Sharma"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                />
              </div>

              {/* Designation */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Designation <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g., Junior Statistical Officer"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                />
              </div>

              {/* Job Role (Matches Benchmarks) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Job Role (Benchmark Matching) <span className="text-red-400">*</span>
                </label>
                <div className="space-y-2">
                  <select
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                  >
                    {PRESET_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                    <option value="Custom">Custom Role (Falls back to 3.5 benchmark)</option>
                  </select>
                  {jobRole === 'Custom' && (
                    <input
                      type="text"
                      placeholder="Type custom role title..."
                      onChange={(e) => setJobRole(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                    />
                  )}
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Department / Division <span className="text-red-400">*</span>
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                >
                  {PRESET_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                  <option value="Other Division">Other MoSPI Division</option>
                </select>
              </div>

              {/* Education */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Highest Qualification / Education
                </label>
                <input
                  type="text"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="e.g., M.Sc. in Applied Statistics / Economics"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                />
              </div>

              {/* Experience Years */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Total Experience (Years): <span className="text-orange-400 font-bold">{experienceYears} Years</span>
                </label>
                <div className="flex items-center gap-4 pt-1">
                  <input
                    type="range"
                    min="0"
                    max="35"
                    step="1"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <span className="w-12 text-center text-sm font-semibold text-white bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                    {experienceYears}y
                  </span>
                </div>
              </div>

              {/* Current Assignment */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Current Assignment & Field Responsibility
                </label>
                <input
                  type="text"
                  value={currentAssignment}
                  onChange={(e) => setCurrentAssignment(e.target.value)}
                  placeholder="e.g., Field Operations Division - PLFS Scrutiny & ASI Data Cleaning"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm flex items-center gap-2 transition shadow-lg shadow-orange-600/20"
              >
                Next: Training & Objectives
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 2: Training & Objectives */}
        {/* ============================================================ */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-orange-500" />
                Previous Trainings & Career Progression
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Attended MoSPI workshops confirm proficiency and guide the AI evaluator during baseline score calibration.
              </p>
            </div>

            {/* Training Tags Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Attended Training Programs & Certifications
              </label>

              {/* Active Tags */}
              <div className="flex flex-wrap gap-2 mb-3 min-h-[42px] p-2 rounded-xl bg-slate-900/50 border border-slate-800">
                {trainings.length === 0 ? (
                  <span className="text-xs text-slate-500 italic p-1">No trainings added yet. Select from suggestions below or type custom.</span>
                ) : (
                  trainings.map((t, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs font-medium"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTraining(index)}
                        className="hover:text-red-400 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Custom Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTrainingInput}
                  onChange={(e) => setNewTrainingInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTraining();
                    }
                  }}
                  placeholder="Type specialized workshop or course and press enter..."
                  className="flex-1 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={handleAddTraining}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold flex items-center gap-1 transition"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              {/* Suggestions */}
              <div className="mt-3">
                <span className="text-xs text-slate-400 block mb-2">MoSPI Standard Course Suggestions (Click to add):</span>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_TRAININGS.map((sug) => {
                    const isAdded = trainings.includes(sug);
                    return (
                      <button
                        key={sug}
                        type="button"
                        disabled={isAdded}
                        onClick={() => setTrainings([...trainings, sug])}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                          isAdded
                            ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                            : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                      >
                        + {sug}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Career Objective */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Career Progression Objective
              </label>
              <textarea
                rows={3}
                value={careerObjective}
                onChange={(e) => setCareerObjective(e.target.value)}
                placeholder="Outline targeted roles, interest areas (e.g., National Accounts, Price Indices, AI modeling)..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm flex items-center gap-2 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous: Details
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm flex items-center gap-2 transition shadow-lg shadow-orange-600/20"
              >
                Next: 33 Competency Ratings
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 3: Self-Assessment Grid across 33 Competencies */}
        {/* ============================================================ */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-orange-500" />
                  Self-Assessment across 33 Competencies
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Rate current proficiency from 1.0 (Novice) to 5.0 (Mastery). The AI model calibrates these inputs against tenure and attended trainings.
                </p>
              </div>

              {/* Quick Preset Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const filled: Record<number, number> = {};
                    if (competenciesData) {
                      Object.values(competenciesData.categories).forEach((list) => {
                        list.forEach((c) => (filled[c.id] = 3.5));
                      });
                    }
                    setRatings(filled);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition"
                >
                  Set All to 3.5
                </button>
              </div>
            </div>

            {loadingCompetencies ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                <span className="text-sm">Fetching 33 seeded MoSPI competencies from PostgreSQL...</span>
              </div>
            ) : competenciesData ? (
              <div>
                {/* Category Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3 mb-5">
                  {Object.entries(competenciesData.categories).map(([catName, items]) => {
                    const isActive = activeCategoryTab === catName;
                    return (
                      <button
                        key={catName}
                        type="button"
                        onClick={() => setActiveCategoryTab(catName)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition flex items-center gap-2 ${
                          isActive
                            ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                            : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                        }`}
                      >
                        <span>{catName}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                            isActive ? 'bg-orange-700 text-white' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {items.length}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Competency Slider Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(competenciesData.categories[activeCategoryTab] || []).map((comp) => {
                    const currentRating = ratings[comp.id] ?? 3.0;
                    return (
                      <div
                        key={comp.id}
                        className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                              ID #{comp.id} • {comp.category}
                            </span>
                            <h3 className="text-sm font-semibold text-white mt-0.5">{comp.name}</h3>
                          </div>
                          <div className="text-right">
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400 font-bold text-sm">
                              {currentRating.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Slider & Rating Labels */}
                        <div className="space-y-1">
                          <input
                            type="range"
                            min="1.0"
                            max="5.0"
                            step="0.1"
                            value={currentRating}
                            onChange={(e) => handleRatingChange(comp.id, parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                          />
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>1.0 Novice</span>
                            <span>3.0 Competent</span>
                            <span>5.0 Mastery</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Navigation & Submit */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous: Training
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-xl shadow-orange-600/30 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running AI Calibration (33 Competencies)...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Submit Profile & Ingest Baseline
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
