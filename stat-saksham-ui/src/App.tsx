import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import "./i18n/config";
import { useTranslation } from "react-i18next";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";
import { Login } from "./features/auth/Login";
import { Signup } from "./features/auth/Signup";
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from "./components/common/Card";
import { Button } from "./components/common/Button";
import {
  Award,
  BookOpen,
  FileCheck2,
  TrendingUp,
  Target,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  BarChart3,
  Bot,
  AlertTriangle,
} from "lucide-react";
import IGOTLearning from "./features/igot/IGOTLearning";

// Official Government Learner Dashboard View
const DashboardView = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const officerName =
    user?.fullName && user.fullName.toLowerCase().includes("keiyona")
      ? (i18n.language === "hi" ? "केयोना रोड्रिग्स" : i18n.language === "mr" ? "केयोना रॉड्रिग्ज" : user.fullName)
      : user?.fullName || "Keiyona Rodrigues";

  const officerDesignation = user?.designation || "Senior Statistical Officer (ISS)";

  return (
    <div className="space-y-6">
      {/* Officer Welcome & Authority Hero Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t("dashboard.hero_tag")}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {t("dashboard.welcome_title", { name: officerName })}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {t("dashboard.welcome_subtitle", {
                designation: officerDesignation,
                cadreId: user?.cadreId || "8921",
              })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/assessment">
              <Button variant="saffron" size="md" leftIcon={<Target className="w-4 h-4" />}>
                {t("dashboard.gap_diagnostic_btn")}
              </Button>
            </Link>
            <Link to="/ai-assistant">
              <Button variant="secondary" size="md" leftIcon={<Bot className="w-4 h-4" />}>
                {t("dashboard.consult_bot_btn")}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Competency Score */}
        <Card variant="accent">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {t("dashboard.kpi_competency_score")}
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {t("dashboard.kpi_competency_val")}
                </h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-900 rounded-xl">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-green-700 font-medium">
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span>{t("dashboard.kpi_competency_sub")}</span>
            </div>
          </CardBody>
        </Card>

        {/* KPI 2: Active Pathways */}
        <Card variant="default">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {t("dashboard.kpi_active_pathways")}
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {t("dashboard.kpi_active_pathways_val")}
                </h3>
              </div>
              <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{t("dashboard.kpi_active_pathways_sub")}</span>
            </div>
          </CardBody>
        </Card>

        {/* KPI 3: Assessments Completed */}
        <Card variant="default">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {t("dashboard.kpi_assessments")}
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {t("dashboard.kpi_assessments_val")}
                </h3>
              </div>
              <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
                <FileCheck2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-teal-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{t("dashboard.kpi_assessments_sub")}</span>
            </div>
          </CardBody>
        </Card>

        {/* KPI 4: Cadre Rank Percentile */}
        <Card variant="default">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {t("dashboard.kpi_cadre_rank")}
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {t("dashboard.kpi_cadre_rank_val")}
                </h3>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-900 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>{t("dashboard.kpi_cadre_rank_sub")}</span>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Main Grid: Assigned Pathways & Pending Assessments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Assigned FRAC Pathways */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="text-sm">{t("dashboard.assigned_pathways_title")}</CardTitle>
                <CardDescription>
                  {t("dashboard.assigned_pathways_subtitle")}
                </CardDescription>
              </div>
              <Link to="/learning" className="text-xs text-blue-900 font-semibold hover:underline flex items-center gap-1">
                {t("dashboard.view_all")} <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardBody className="space-y-4">
              {/* Pathway 1 */}
              <div className="p-4 border border-slate-200 rounded-xl hover:border-blue-900/40 transition-colors bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-900">
                        {t("dashboard.pathway1_badge")}
                      </span>
                      <span className="text-xs text-slate-500">
                        {t("dashboard.pathway1_meta")}
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-900 text-sm">
                      {t("dashboard.pathway1_title")}
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-blue-900 shrink-0">
                    {t("dashboard.pathway1_progress")}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                  <div className="bg-blue-900 h-2 rounded-full" style={{ width: "75%" }} />
                </div>
              </div>

              {/* Pathway 2 */}
              <div className="p-4 border border-slate-200 rounded-xl hover:border-blue-900/40 transition-colors bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-teal-100 text-teal-900">
                        {t("dashboard.pathway2_badge")}
                      </span>
                      <span className="text-xs text-slate-500">
                        {t("dashboard.pathway2_meta")}
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-900 text-sm">
                      {t("dashboard.pathway2_title")}
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-teal-700 shrink-0">
                    {t("dashboard.pathway2_progress")}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                  <div className="bg-teal-700 h-2 rounded-full" style={{ width: "40%" }} />
                </div>
              </div>

              {/* Pathway 3 */}
              <div className="p-4 border border-slate-200 rounded-xl hover:border-blue-900/40 transition-colors bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-900">
                        {t("dashboard.pathway3_badge")}
                      </span>
                      <span className="text-xs text-slate-500">
                        {t("dashboard.pathway3_meta")}
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-900 text-sm">
                      {t("dashboard.pathway3_title")}
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-amber-700 shrink-0">
                    {t("dashboard.pathway3_progress")}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                  <div className="bg-amber-600 h-2 rounded-full" style={{ width: "15%" }} />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right 1 Col: Pending Assessments Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="text-sm">{t("dashboard.pending_assessments_title")}</CardTitle>
                <CardDescription>{t("dashboard.pending_assessments_subtitle")}</CardDescription>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              {/* Test 1 */}
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-red-800 bg-red-100 px-1.5 py-0.5 rounded">
                    {t("dashboard.test1_due")}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {t("dashboard.test1_duration")}
                  </span>
                </div>
                <h5 className="text-xs font-bold text-slate-900 mt-1.5 leading-snug">
                  {t("dashboard.test1_title")}
                </h5>
                <Link to="/assessment" className="inline-block mt-2">
                  <Button variant="danger" size="sm">
                    {t("dashboard.start_test")}
                  </Button>
                </Link>
              </div>

              {/* Test 2 */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded">
                    {t("dashboard.test2_due")}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {t("dashboard.test2_duration")}
                  </span>
                </div>
                <h5 className="text-xs font-bold text-slate-900 mt-1.5 leading-snug">
                  {t("dashboard.test2_title")}
                </h5>
                <Link to="/assessment" className="inline-block mt-2">
                  <Button variant="outline" size="sm">
                    {t("dashboard.review_syllabus")}
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>

          {/* Institutional Compliance Card */}
          <div className="p-4 rounded-xl bg-blue-900 text-white space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
              <h4 className="text-xs font-bold">{t("dashboard.apar_title")}</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t("dashboard.apar_desc")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Generic Module Placeholder View with Full i18n Translation
const ModulePlaceholder = ({
  titleKey,
  descKey,
}: {
  titleKey: string;
  descKey: string;
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-xs">
        <h2 className="text-xl font-bold text-slate-900">{t(titleKey)}</h2>
        <p className="text-xs text-slate-500 mt-1">{t(descKey)}</p>
      </div>
      <div className="p-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">
          {t(titleKey)} {t("modules.active_badge")}
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
          {t("modules.active_desc")}
        </p>
      </div>
    </div>
  );
};

// Portal Notices View with Full i18n Translation
const NoticesView = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-xs">
        <h2 className="text-xl font-bold text-slate-900">{t("modules.notices.title")}</h2>
        <p className="text-xs text-slate-500 mt-1">{t("modules.notices.desc")}</p>
      </div>
      <div className="space-y-3">
        <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              {t("modules.notices.item1_title")}
            </h4>
            <p className="text-xs text-slate-600 mt-1">
              {t("modules.notices.item1_desc")}
            </p>
            <span className="text-[11px] text-slate-400 mt-2 block">
              {t("modules.notices.item1_issued")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* MANDATE: Root route MUST automatically redirect to /login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Government Portal Application Shell */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardView />} />
            <Route
              path="/competency"
              element={
                <ModulePlaceholder
                  titleKey="modules.competency.title"
                  descKey="modules.competency.desc"
                />
              }
            />
            <Route
              path="/learning"
              element={
                <ModulePlaceholder
                  titleKey="modules.learning.title"
                  descKey="modules.learning.desc"
                />
              }
            />
            <Route
  path="/igot-learning"
  element={<IGOTLearning />}
/>
            <Route
              path="/assessment"
              element={
                <ModulePlaceholder
                  titleKey="modules.assessment.title"
                  descKey="modules.assessment.desc"
                />
              }
            />
            <Route
              path="/ai-assistant"
              element={
                <ModulePlaceholder
                  titleKey="modules.ai_assistant.title"
                  descKey="modules.ai_assistant.desc"
                />
              }
            />
            <Route
              path="/quest"
              element={
                <ModulePlaceholder
                  titleKey="modules.quest.title"
                  descKey="modules.quest.desc"
                />
              }
            />
            <Route
              path="/analytics"
              element={
                <ModulePlaceholder
                  titleKey="modules.analytics.title"
                  descKey="modules.analytics.desc"
                />
              }
            />
            <Route path="/notices" element={<NoticesView />} />
            <Route
              path="/settings"
              element={
                <ModulePlaceholder
                  titleKey="modules.settings.title"
                  descKey="modules.settings.desc"
                />
              }
            />
          </Route>

          {/* Catch-all fallback route redirects to /login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
