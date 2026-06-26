import { Navigate, NavLink, Outlet, Route, Routes } from "react-router-dom";
import {
  BarChart3,
  Clock3,
  Database,
  Gamepad2,
  Swords,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BackfillPage } from "./BackfillPage";
import { RecordPage } from "./RecordPage";
import { AnalysisLayout, HistoryPage, SummaryPage, XpPage } from "./AnalysisPages";
import { DataPage } from "./DataPage";

const primaryNavigation = [
  { to: "/record", label: "試合記録", icon: Swords },
  { to: "/backfill", label: "過去入力", icon: Clock3 },
  { to: "/analysis/xp", label: "分析", icon: BarChart3 },
  { to: "/data", label: "データ", icon: Database },
];

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/record" element={<RecordPage />} />
        <Route path="/backfill" element={<BackfillPage />} />
        <Route path="/data" element={<DataPage />} />
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
