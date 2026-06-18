import { Navigate, NavLink, Outlet, Route, Routes } from "react-router-dom";
import {
  BarChart3,
  ChevronRight,
  Clock3,
  Gamepad2,
  History,
  LayoutDashboard,
  Swords,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BackfillPage } from "./BackfillPage";
import { RecordPage } from "./RecordPage";

const primaryNavigation = [
  { to: "/record", label: "試合記録", icon: Swords },
  { to: "/backfill", label: "過去入力", icon: Clock3 },
  { to: "/analysis/summary", label: "分析", icon: BarChart3 },
];

const analysisNavigation = [
  { to: "/analysis/summary", label: "集計", icon: LayoutDashboard },
  { to: "/analysis/history", label: "履歴", icon: History },
  { to: "/analysis/xp", label: "XP", icon: BarChart3 },
];

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/record" element={<RecordPage />} />
        <Route path="/backfill" element={<BackfillPage />} />
        <Route path="/analysis" element={<AnalysisLayout />}>
          <Route index element={<Navigate replace to="summary" />} />
          <Route path="summary" element={<SummaryPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="xp" element={<XpPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate replace to="/record" />} />
    </Routes>
  );
}

function AppShell() {
  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Brand />
        <nav className="primary-nav" aria-label="メインナビゲーション">
          {primaryNavigation.map((item) => (
            <NavigationLink key={item.to} {...item} />
          ))}
        </nav>
        <a className="legacy-link" href="/">
          現行画面
          <ChevronRight aria-hidden="true" size={16} />
        </a>
      </aside>

      <main className="main-surface">
        <Outlet />
      </main>

      <nav className="mobile-nav" aria-label="メインナビゲーション">
        {primaryNavigation.map((item) => (
          <NavigationLink key={item.to} {...item} />
        ))}
      </nav>
    </div>
  );
}

function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <Gamepad2 aria-hidden="true" size={22} />
      </span>
      <span>
        <small>Splatoon 3</small>
        <strong>Xマッチログ</strong>
      </span>
    </div>
  );
}

function NavigationLink({ to, label, icon: Icon }: { to: string; label: string; icon: LucideIcon }) {
  return (
    <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to={to}>
      <Icon aria-hidden="true" size={20} />
      <span>{label}</span>
    </NavLink>
  );
}

function PageHeader({ title, meta }: { title: string; meta: string }) {
  return (
    <header className="page-header">
      <div>
        <p>{meta}</p>
        <h1>{title}</h1>
      </div>
    </header>
  );
}

function AnalysisLayout() {
  return (
    <div className="page">
      <PageHeader meta="シーズン・条件別" title="分析" />
      <nav className="analysis-tabs" aria-label="分析メニュー">
        {analysisNavigation.map((item) => (
          <NavigationLink key={item.to} {...item} />
        ))}
      </nav>
      <Outlet />
    </div>
  );
}

function SummaryPage() {
  return (
    <section className="surface analysis-surface">
      <SectionHeading icon={LayoutDashboard} title="集計" />
      <FilterRow />
      <div className="metric-row analysis-metrics">
        <Metric label="勝率" value="-" />
        <Metric label="勝ち" value="0" />
        <Metric label="負け" value="0" />
        <Metric label="試合数" value="0" />
      </div>
    </section>
  );
}

function HistoryPage() {
  return (
    <section className="surface analysis-surface">
      <SectionHeading icon={History} title="履歴" />
      <FilterRow />
      <div className="empty-state">データなし</div>
    </section>
  );
}

function XpPage() {
  return (
    <section className="surface analysis-surface">
      <SectionHeading icon={BarChart3} title="XP推移" />
      <FilterRow />
      <div className="chart-placeholder">
        <span>XP</span>
        <div />
      </div>
    </section>
  );
}

function SectionHeading({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="section-heading">
      <Icon aria-hidden="true" size={18} />
      <h2>{title}</h2>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FilterRow() {
  return (
    <div className="filter-row">
      {["シーズン", "ルール", "武器", "ステージ"].map((filter) => (
        <label className="preview-field" key={filter}>
          <span>{filter}</span>
          <select aria-label={filter} disabled>
            <option>すべて</option>
          </select>
        </label>
      ))}
    </div>
  );
}
