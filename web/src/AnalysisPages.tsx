import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  History,
  LayoutDashboard,
  Pencil,
  Save,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NavLink, Outlet, useOutletContext, useSearchParams } from "react-router-dom";
import {
  getMatches,
  getPreferences,
  getSummaryAnalysis,
  getXpRecords,
  updateMatch,
  updatePreferences,
} from "./api";
import { rules, seasonName, seasons, stages, weapons } from "./catalog";
import type {
  AnalysisFilters,
  AnalysisPreferences,
  BreakdownItem,
  Match,
  MatchResult,
  RuleId,
  XpRecord,
} from "./types";

const defaultFilters: AnalysisFilters = {
  season: "all",
  rule: "all",
  weapon: "all",
  stage: "all",
  time: "all",
};

const defaultPreferences: AnalysisPreferences = {
  xpPeriod: "30",
  xpStart: "",
  xpEnd: "",
  historyPageSize: 25,
};

const analysisNavigation = [
  { to: "/analysis/summary", label: "集計", icon: LayoutDashboard },
  { to: "/analysis/history", label: "履歴", icon: History },
  { to: "/analysis/xp", label: "XP", icon: BarChart3 },
];

type AnalysisContext = {
  filters: AnalysisFilters;
  preferences: AnalysisPreferences;
  preferencesLoading: boolean;
  setFilter: (key: keyof AnalysisFilters, value: string) => void;
  savePreferences: (preferences: AnalysisPreferences) => void;
};

export function AnalysisLayout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const preferencesQuery = useQuery({ queryKey: ["preferences"], queryFn: getPreferences });
  const queryClient = useQueryClient();
  const preferences = { ...defaultPreferences, ...preferencesQuery.data };
  const filters = {
    season: searchParams.get("season") || defaultFilters.season,
    rule: searchParams.get("rule") || defaultFilters.rule,
    weapon: searchParams.get("weapon") || defaultFilters.weapon,
    stage: searchParams.get("stage") || defaultFilters.stage,
    time: searchParams.get("time") || defaultFilters.time,
  };
  const preferencesMutation = useMutation({
    mutationFn: updatePreferences,
    onSuccess: (saved) => queryClient.setQueryData(["preferences"], saved),
  });

  function setFilter(key: keyof AnalysisFilters, value: string) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value === "all") next.delete(key);
      else next.set(key, value);
      return next;
    });
  }

  function savePreferences(next: AnalysisPreferences) {
    queryClient.setQueryData(["preferences"], next);
    preferencesMutation.mutate(next);
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p>シーズン・条件別</p>
          <h1>分析</h1>
        </div>
      </header>
      <nav className="analysis-tabs" aria-label="分析メニュー">
        {analysisNavigation.map(({ to, label, icon: Icon }) => (
          <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} key={to} to={`${to}?${searchParams}`}>
            <Icon aria-hidden="true" size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <Outlet
        context={{
          filters,
          preferences,
          preferencesLoading: preferencesQuery.isLoading,
          savePreferences,
          setFilter,
        } satisfies AnalysisContext}
      />
    </div>
  );
}

export function SummaryPage() {
  const { filters, setFilter } = useAnalysisContext();
  const summaryQuery = useQuery({
    queryFn: () => getSummaryAnalysis(filters),
    queryKey: ["analysis-summary", filters],
  });
  const summary = summaryQuery.data;

  return (
    <section className="surface analysis-surface">
      <SectionHeading icon={LayoutDashboard} title="集計" />
      <AnalysisFilters filters={filters} setFilter={setFilter} showTime />
      {summaryQuery.isLoading ? (
        <Loading />
      ) : summaryQuery.isError ? (
        <ErrorState />
      ) : summary ? (
        <>
          <div className="metric-row analysis-metrics">
            <Metric label="勝率" value={summary.winRate === null ? "-" : `${summary.winRate}%`} />
            <Metric label="勝ち" value={String(summary.wins)} />
            <Metric label="負け" value={String(summary.losses)} />
            <Metric label="試合数" value={String(summary.total)} />
          </div>
          <div className="analysis-breakdown-grid">
            <Breakdown title="シーズン別" items={summary.breakdown.season} formatName={seasonName} />
            <Breakdown title="ルール別" items={summary.breakdown.rule} formatName={ruleName} />
            <Breakdown title="ステージ別" items={summary.breakdown.stage} />
            <Breakdown title="武器別" items={summary.breakdown.weapon} />
            <Breakdown title="時間帯別" items={summary.breakdown.time} formatName={(value) => `${value}時`} />
          </div>
        </>
      ) : null}
    </section>
  );
}

export function HistoryPage() {
  const { filters, preferences, preferencesLoading, savePreferences, setFilter } = useAnalysisContext();
  const queryClient = useQueryClient();
  const [cursors, setCursors] = useState<Array<string | undefined>>([undefined]);
  const [pageIndex, setPageIndex] = useState(0);
  const [editing, setEditing] = useState<Match | null>(null);
  const cursor = cursors[pageIndex];

  useEffect(() => {
    setCursors([undefined]);
    setPageIndex(0);
  }, [filters.season, filters.rule, filters.weapon, filters.stage, filters.time, preferences.historyPageSize]);

  const matchesQuery = useQuery({
    enabled: !preferencesLoading,
    queryFn: () => getMatches({ cursor, filters, limit: preferences.historyPageSize }),
    queryKey: ["analysis-history", filters, cursor, preferences.historyPageSize],
  });
  const matchesPage = matchesQuery.data;
  const editMutation = useMutation({
    mutationFn: (match: Match) => updateMatch(match.id, match),
    onSuccess: async () => {
      setEditing(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["analysis-history"] }),
        queryClient.invalidateQueries({ queryKey: ["analysis-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["current-analysis"] }),
      ]);
    },
  });

  function nextPage() {
    if (!matchesQuery.data?.nextCursor) return;
    setCursors((current) => {
      const next = current.slice(0, pageIndex + 1);
      next.push(matchesQuery.data.nextCursor || undefined);
      return next;
    });
    setPageIndex((current) => current + 1);
  }

  return (
    <section className="surface analysis-surface">
      <div className="section-heading-row">
        <SectionHeading icon={History} title="履歴" />
        <label className="compact-select">
          <span>表示件数</span>
          <select
            aria-label="表示件数"
            onChange={(event) => savePreferences({ ...preferences, historyPageSize: Number(event.target.value) })}
            value={preferences.historyPageSize}
          >
            {[15, 25, 50].map((value) => (
              <option key={value} value={value}>
                {value}件
              </option>
            ))}
          </select>
        </label>
      </div>
      <AnalysisFilters filters={filters} setFilter={setFilter} showTime />
      {matchesQuery.isLoading || preferencesLoading ? (
        <Loading />
      ) : matchesQuery.isError ? (
        <ErrorState />
      ) : !matchesPage || matchesPage.items.length === 0 ? (
        <Empty />
      ) : (
        <>
          <div className="react-history-list">
            {matchesPage.items.map((match) =>
              editing?.id === match.id ? (
                <HistoryEdit
                  busy={editMutation.isPending}
                  key={match.id}
                  match={editing}
                  onCancel={() => setEditing(null)}
                  onChange={setEditing}
                  onSave={() => editMutation.mutate(editing)}
                />
              ) : (
                <HistoryRow key={match.id} match={match} onEdit={() => setEditing(match)} />
              ),
            )}
          </div>
          <div className="pagination">
            <button disabled={pageIndex === 0} onClick={() => setPageIndex((current) => current - 1)} type="button">
              <ChevronLeft aria-hidden="true" size={16} />
              前へ
            </button>
            <span>{pageIndex + 1}ページ</span>
            <button disabled={!matchesPage.nextCursor} onClick={nextPage} type="button">
              次へ
              <ChevronRight aria-hidden="true" size={16} />
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export function XpPage() {
  const { filters, preferences, preferencesLoading, savePreferences, setFilter } = useAnalysisContext();
  const dateRange = xpDateRange(preferences);
  const xpQuery = useQuery({
    enabled: !preferencesLoading,
    queryFn: async () => {
      const items: XpRecord[] = [];
      let cursor: string | undefined;
      do {
        const page = await getXpRecords({
          cursor,
          end: dateRange.end,
          limit: 100,
          rule: filters.rule,
          season: filters.season,
          start: dateRange.start,
        });
        items.push(...page.items);
        cursor = page.nextCursor || undefined;
      } while (cursor && items.length < 1000);
      return items;
    },
    queryKey: ["analysis-xp", filters.season, filters.rule, preferences],
  });
  const xpRecords = xpQuery.data;

  function updatePeriod(key: keyof AnalysisPreferences, value: string) {
    if (key === "xpPeriod" && value === "custom" && (!preferences.xpStart || !preferences.xpEnd)) {
      const end = new Date();
      const start = new Date(end);
      start.setDate(start.getDate() - 30);
      savePreferences({
        ...preferences,
        xpEnd: dateInputValue(end),
        xpPeriod: value,
        xpStart: dateInputValue(start),
      });
      return;
    }
    savePreferences({ ...preferences, [key]: value });
  }

  return (
    <section className="surface analysis-surface">
      <SectionHeading icon={BarChart3} title="XP推移" />
      <AnalysisFilters filters={filters} setFilter={setFilter} xpOnly />
      <div className="xp-period-controls">
        <label className="preview-field">
          <span>期間</span>
          <select aria-label="期間" onChange={(event) => updatePeriod("xpPeriod", event.target.value)} value={preferences.xpPeriod}>
            <option value="1">直近1日</option>
            <option value="3">直近3日</option>
            <option value="7">直近7日</option>
            <option value="30">直近30日</option>
            <option value="90">直近90日</option>
            <option value="all">全期間</option>
            <option value="custom">期間指定</option>
          </select>
        </label>
        {preferences.xpPeriod === "custom" ? (
          <>
            <label className="preview-field">
              <span>開始</span>
              <input aria-label="開始" onChange={(event) => updatePeriod("xpStart", event.target.value)} type="date" value={preferences.xpStart} />
            </label>
            <label className="preview-field">
              <span>終了</span>
              <input aria-label="終了" onChange={(event) => updatePeriod("xpEnd", event.target.value)} type="date" value={preferences.xpEnd} />
            </label>
          </>
        ) : null}
      </div>
      {xpQuery.isLoading || preferencesLoading ? (
        <Loading />
      ) : xpQuery.isError ? (
        <ErrorState />
      ) : !xpRecords || xpRecords.length === 0 ? (
        <Empty />
      ) : (
        <>
          <XpChart records={xpRecords} />
          <div className="xp-record-list">
            {xpRecords.map((record) => (
              <div className="xp-record-row" key={record.id}>
                <strong>{record.xp.toFixed(1)}</strong>
                <span>{ruleName(record.rule)}</span>
                <time>{formatDateTime(record.recordedAt)}</time>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function AnalysisFilters({
  filters,
  setFilter,
  showTime = false,
  xpOnly = false,
}: {
  filters: AnalysisFilters;
  setFilter: (key: keyof AnalysisFilters, value: string) => void;
  showTime?: boolean;
  xpOnly?: boolean;
}) {
  return (
    <div className={`filter-row${xpOnly ? " xp-filter-row" : ""}`}>
      <FilterSelect
        label="シーズン"
        onChange={(value) => setFilter("season", value)}
        options={[{ label: "すべて", value: "all" }, ...seasons.map((item) => ({ label: item.name, value: item.id }))]}
        value={filters.season}
      />
      <FilterSelect
        label="ルール"
        onChange={(value) => setFilter("rule", value)}
        options={[{ label: "すべて", value: "all" }, ...rules.map((item) => ({ label: item.name, value: item.id }))]}
        value={filters.rule}
      />
      {!xpOnly ? (
        <>
          <FilterSelect
            label="武器"
            onChange={(value) => setFilter("weapon", value)}
            options={[{ label: "すべて", value: "all" }, ...weapons.map((item) => ({ label: item, value: item }))]}
            value={filters.weapon}
          />
          <FilterSelect
            label="ステージ"
            onChange={(value) => setFilter("stage", value)}
            options={[{ label: "すべて", value: "all" }, ...stages.map((item) => ({ label: item, value: item }))]}
            value={filters.stage}
          />
          {showTime ? (
            <FilterSelect
              label="時間帯"
              onChange={(value) => setFilter("time", value)}
              options={[
                { label: "すべて", value: "all" },
                { label: "0-6時", value: "0-6" },
                { label: "6-12時", value: "6-12" },
                { label: "12-18時", value: "12-18" },
                { label: "18-24時", value: "18-24" },
              ]}
              value={filters.time}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function FilterSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="preview-field">
      <span>{label}</span>
      <select aria-label={label} onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
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

function Breakdown({
  formatName = (value) => value,
  items,
  title,
}: {
  formatName?: (value: string) => string;
  items: BreakdownItem[];
  title: string;
}) {
  return (
    <section className="breakdown-section">
      <h3>{title}</h3>
      {items.length ? (
        <div className="analysis-breakdown-list">
          {items.map((item) => (
            <div className="analysis-breakdown-row" key={item.name}>
              <div>
                <strong>{formatName(item.name)}</strong>
                <span>
                  {item.winRate ?? 0}% / {item.total}戦
                </span>
              </div>
              <div className="analysis-bar">
                <span style={{ width: `${item.winRate || 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty compact />
      )}
    </section>
  );
}

function HistoryRow({ match, onEdit }: { match: Match; onEdit: () => void }) {
  return (
    <div className="react-history-row">
      <div>
        <strong>
          {match.stage} / {ruleName(match.rule)}
        </strong>
        <span>
          {match.weapon} · {seasonName(match.season)} · {formatDateTime(match.recordedAt)}
        </span>
      </div>
      <div className="history-row-actions">
        <b className={match.result}>{match.result === "win" ? "WIN" : "LOSE"}</b>
        <button aria-label="編集" onClick={onEdit} type="button">
          <Pencil aria-hidden="true" size={15} />
        </button>
      </div>
    </div>
  );
}

function HistoryEdit({
  busy,
  match,
  onCancel,
  onChange,
  onSave,
}: {
  busy: boolean;
  match: Match;
  onCancel: () => void;
  onChange: (match: Match) => void;
  onSave: () => void;
}) {
  return (
    <div className="history-edit">
      <div className="history-edit-fields">
        <FilterSelect label="ルール" onChange={(rule) => onChange({ ...match, rule: rule as RuleId })} options={rules.map((item) => ({ label: item.name, value: item.id }))} value={match.rule} />
        <label className="preview-field">
          <span>武器</span>
          <input onChange={(event) => onChange({ ...match, weapon: event.target.value })} value={match.weapon} />
        </label>
        <FilterSelect label="ステージ" onChange={(stage) => onChange({ ...match, stage })} options={stages.map((item) => ({ label: item, value: item }))} value={match.stage} />
        <FilterSelect
          label="勝敗"
          onChange={(result) => onChange({ ...match, result: result as MatchResult })}
          options={[
            { label: "WIN", value: "win" },
            { label: "LOSE", value: "lose" },
          ]}
          value={match.result}
        />
      </div>
      <div className="history-edit-actions">
        <button disabled={busy} onClick={onCancel} type="button">
          <X aria-hidden="true" size={15} />
          キャンセル
        </button>
        <button className="save" disabled={busy || !match.weapon.trim()} onClick={onSave} type="button">
          <Save aria-hidden="true" size={15} />
          保存
        </button>
      </div>
    </div>
  );
}

function XpChart({ records }: { records: XpRecord[] }) {
  const ordered = records.slice().reverse();
  const values = ordered.map((record) => record.xp);
  const min = Math.floor(Math.min(...values) - 20);
  const max = Math.ceil(Math.max(...values) + 20);
  const span = Math.max(1, max - min);
  const width = 720;
  const height = 260;
  const pad = 36;
  const points = ordered.map((record, index) => ({
    record,
    x: pad + (index / Math.max(1, ordered.length - 1)) * (width - pad * 2),
    y: height - pad - ((record.xp - min) / span) * (height - pad * 2),
  }));
  const path = points.map((point, index) => `${index ? "L" : "M"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");

  return (
    <div className="react-xp-chart">
      <svg aria-label="XP推移" role="img" viewBox={`0 0 ${width} ${height}`}>
        <line stroke="#d8ded7" x1={pad} x2={width - pad} y1={height - pad} y2={height - pad} />
        <line stroke="#d8ded7" x1={pad} x2={pad} y1={pad} y2={height - pad} />
        <text fill="#68716b" fontSize="12" x={pad} y="22">
          {max}
        </text>
        <text fill="#68716b" fontSize="12" x={pad} y={height - 8}>
          {min}
        </text>
        <path d={path} fill="none" stroke="#138e9d" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        {points.map((point) => (
          <circle cx={point.x} cy={point.y} fill="#138e9d" key={point.record.id} r="5">
            <title>
              {point.record.xp.toFixed(1)} {formatDateTime(point.record.recordedAt)}
            </title>
          </circle>
        ))}
      </svg>
    </div>
  );
}

function xpDateRange(preferences: AnalysisPreferences) {
  if (preferences.xpPeriod === "all") return { start: undefined, end: undefined };
  if (preferences.xpPeriod === "custom" && preferences.xpStart && preferences.xpEnd) {
    const start = new Date(`${preferences.xpStart}T00:00:00`);
    const end = new Date(`${preferences.xpEnd}T23:59:59.999`);
    return start <= end
      ? { start: start.toISOString(), end: end.toISOString() }
      : { start: new Date(`${preferences.xpEnd}T00:00:00`).toISOString(), end: new Date(`${preferences.xpStart}T23:59:59.999`).toISOString() };
  }
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - Number(preferences.xpPeriod || 30));
  return { start: start.toISOString(), end: end.toISOString() };
}

function useAnalysisContext() {
  return useOutletContext<AnalysisContext>();
}

function ruleName(id: string) {
  return rules.find((rule) => rule.id === id)?.name || id;
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function dateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function Loading() {
  return <div className="loading-state">読み込んでいます</div>;
}

function ErrorState() {
  return <div className="loading-state error">データを読み込めません</div>;
}

function Empty({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? "compact-empty" : "empty-state"}>データなし</div>;
}
