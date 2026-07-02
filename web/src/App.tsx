import { Navigate, NavLink, Outlet, Route, Routes } from "react-router-dom";
import {
  BarChart3,
  Database,
  FileText,
  Gamepad2,
  Swords,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BackfillPage } from "./BackfillPage";
import { RecordPage } from "./RecordPage";
import { AnalysisLayout, HistoryPage, SummaryPage, XpPage } from "./AnalysisPages";
import { DataManagementLayout, DataPage } from "./DataPage";
import { MonthlyReportPage } from "./ReportsPage";
import { StrategyDetailPage } from "./StrategyPage";

const primaryNavigation = [
  { to: "/record", label: "試合記録", icon: Swords },
  { to: "/analysis/xp", label: "分析", icon: BarChart3 },
  { to: "/reports/monthly", label: "レポート", icon: FileText },
  { to: "/data", label: "データ管理", icon: Database },
];

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/record" element={<RecordPage />} />
        <Route path="/strategy/:id" element={<StrategyDetailPage />} />
        <Route path="/backfill" element={<Navigate replace to="/data/backfill" />} />
        <Route path="/data" element={<DataManagementLayout />}>
          <Route index element={<Navigate replace to="archive" />} />
          <Route path="backfill" element={<BackfillPage embedded />} />
          <Route path="archive" element={<DataPage embedded />} />
        </Route>
        <Route path="/reports">
          <Route index element={<Navigate replace to="monthly" />} />
          <Route path="monthly" element={<MonthlyReportPage />} />
        </Route>
        <Route path="/analysis" element={<AnalysisLayout />}>
          <Route index element={<Navigate replace to="xp" />} />
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
