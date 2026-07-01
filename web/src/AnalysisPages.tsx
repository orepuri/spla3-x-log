import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  History,
  LayoutDashboard,
  Minus,
  Pencil,
  Save,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NavLink, Outlet, useOutletContext, useSearchParams } from "react-router-dom";
import {
  getMatches,
  getAnalysisOptions,
  deleteMatch,
  getPreferences,
  getSummaryAnalysis,
  getXpRecords,
  updateMatch,
  updatePreferences,
  updateXpRecord,
} from "./api";
import { rules, seasonName, seasons, stages, weapons } from "./catalog";
import type {
  AnalysisFilters,
  AnalysisOptions,
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

const xpHistoryPageSize = 15;

const analysisNavigation = [
  { to: "/analysis/xp", label: "XP", icon: BarChart3 },
  { to: "/analysis/summary", label: "集計", icon: LayoutDashboard },
  { to: "/analysis/history", label: "履歴", icon: History },
];

type AnalysisContext = {
  filters: AnalysisFilters;
  options: AnalysisOptions;
  preferences: AnalysisPreferences;
  preferencesLoading: boolean;
  setFilter: (key: keyof AnalysisFilters, value: string) => void;
  savePreferences: (preferences: AnalysisPreferences) => void;
};

export function AnalysisLayout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const preferencesQuery = useQuery({ queryKey: ["preferences"], queryFn: getPreferences });
  const optionsQuery = useQuery({ queryKey: ["analysis-options"], queryFn: getAnalysisOptions });
  const queryClient = useQueryClient();
  const preferences = { ...defaultPreferences, ...preferencesQuery.data };
  const options = mergeOptions(optionsQuery.data);
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
          options,
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
  const { filters, options, setFilter } = useAnalysisContext();
  const summaryQuery = useQuery({
    queryFn: () => getSummaryAnalysis(filters),
    queryKey: ["analysis-summary", filters],
  });
  const summary = summaryQuery.data;

  return (
    <section className="surface analysis-surface">
      <SectionHeading icon={LayoutDashboard} title="集計" />
      <AnalysisFilters filters={filters} options={options} setFilter={setFilter} showTime />
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
  const { filters, options, preferences, preferencesLoading, savePreferences, setFilter } = useAnalysisContext();
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
  const deleteMutation = useMutation({
    mutationFn: deleteMatch,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["analysis-history"] }),
        queryClient.invalidateQueries({ queryKey: ["analysis-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["current-analysis"] }),
        queryClient.invalidateQueries({ queryKey: ["xp-state"] }),
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

  function deleteHistoryMatch(match: Match) {
    if (!window.confirm(`${formatDateTime(match.recordedAt)}の試合を削除しますか？`)) return;
    deleteMutation.mutate(match.id);
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
      <AnalysisFilters filters={filters} options={options} setFilter={setFilter} showTime />
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
                  options={options}
                  onCancel={() => setEditing(null)}
                  onChange={setEditing}
                  onSave={() => editMutation.mutate(editing)}
                />
              ) : (
                <HistoryRow
                  busy={deleteMutation.isPending}
                  key={match.id}
                  match={match}
                  onDelete={() => deleteHistoryMatch(match)}
                  onEdit={() => setEditing(match)}
                />
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
  const { filters, options, preferences, preferencesLoading, savePreferences, setFilter } = useAnalysisContext();
  const queryClient = useQueryClient();
  const [historyPageIndex, setHistoryPageIndex] = useState(0);
  const [editingRecord, setEditingRecord] = useState<XpRecord | null>(null);
  const dateRange = xpDateRange(preferences);
  const xpQuery = useQuery({
    enabled: !preferencesLoading,
    queryFn: async () => {
      const items = await loadXpRecords(filters.season, dateRange.start, dateRange.end);
      const baselines = dateRange.start
        ? await Promise.all(
            rules.map(async (rule) => {
              const page = await getXpRecords({
                end: new Date(new Date(dateRange.start as string).getTime() - 1).toISOString(),
                limit: 1,
                rule: rule.id,
                season: filters.season,
              });
              return page.items[0] || null;
            }),
          )
        : [];
      return {
        baselines: baselines.filter((record): record is XpRecord => Boolean(record)),
        items,
      };
    },
    queryKey: ["analysis-xp", filters.season, preferences],
  });
  const xpRecords = xpQuery.data?.items;
  const xpRecordsWithTrend = useMemo(
    () => xpRecordsWithPrevious(xpRecords || [], xpQuery.data?.baselines || []),
    [xpRecords, xpQuery.data?.baselines],
  );
  const xpHistoryPageCount = Math.max(1, Math.ceil(xpRecordsWithTrend.length / xpHistoryPageSize));
  const xpHistoryPage = xpRecordsWithTrend.slice(historyPageIndex * xpHistoryPageSize, (historyPageIndex + 1) * xpHistoryPageSize);

  useEffect(() => {
    setHistoryPageIndex(0);
    setEditingRecord(null);
  }, [filters.season, preferences.xpPeriod, preferences.xpStart, preferences.xpEnd]);

  useEffect(() => {
    setHistoryPageIndex((current) => Math.min(current, xpHistoryPageCount - 1));
  }, [xpHistoryPageCount]);

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

  function saveEditingRecord() {
    if (!editingRecord) return;
    xpUpdateMutation.mutate(editingRecord);
  }

  const xpUpdateMutation = useMutation({
    mutationFn: (record: XpRecord) => updateXpRecord(record.id, record),
    onSuccess: async () => {
      setEditingRecord(null);
      await invalidateXpData(queryClient);
    },
  });

  return (
    <section className="surface analysis-surface">
      <SectionHeading icon={BarChart3} title="XP推移" />
      <AnalysisFilters filters={filters} options={options} setFilter={setFilter} xpOnly />
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
      ) : !xpQuery.data || (xpQuery.data.items.length === 0 && xpQuery.data.baselines.length === 0) ? (
        <Empty />
      ) : (
        <>
          <XpChart
            baselines={xpQuery.data?.baselines || []}
            end={dateRange.end}
            records={xpRecords || []}
            start={dateRange.start}
          />
          {xpRecords?.length ? (
            <>
              <div className="xp-record-list">
                {xpHistoryPage.map(({ delta, previous, record }) => (
                  <div key={record.id}>
                    <XpRecordRow
                      busy={xpUpdateMutation.isPending}
                      delta={delta}
                      onEdit={() => setEditingRecord(record)}
                      previous={previous}
                      record={record}
                    />
                    {editingRecord?.id === record.id ? (
                      <XpRecordEdit
                        busy={xpUpdateMutation.isPending}
                        options={options}
                        record={editingRecord}
                        onCancel={() => setEditingRecord(null)}
                        onChange={setEditingRecord}
                        onSave={saveEditingRecord}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="pagination">
                <button disabled={historyPageIndex === 0} onClick={() => setHistoryPageIndex((current) => current - 1)} type="button">
                  <ChevronLeft aria-hidden="true" size={16} />
                  前へ
                </button>
                <span>
                  {historyPageIndex + 1} / {xpHistoryPageCount}ページ
                </span>
                <button disabled={historyPageIndex >= xpHistoryPageCount - 1} onClick={() => setHistoryPageIndex((current) => current + 1)} type="button">
                  次へ
                  <ChevronRight aria-hidden="true" size={16} />
                </button>
              </div>
            </>
          ) : null}
        </>
      )}
    </section>
  );
}

function XpRecordRow({
  busy,
  delta,
  onEdit,
  previous,
  record,
}: {
  busy: boolean;
  delta: number | null;
  onEdit: () => void;
  previous: XpRecord | null;
  record: XpRecord;
}) {
  const trend = delta === null || Math.abs(delta) < 0.05 ? "same" : delta > 0 ? "up" : "down";
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendLabel = delta === null ? "前回XPなし" : trend === "same" ? "前回から変化なし" : `前回から${trend === "up" ? "アップ" : "ダウン"}`;

  return (
    <div className="xp-record-row">
      <strong>{record.xp.toFixed(1)}</strong>
      <span>{ruleName(record.rule)}</span>
      <span className={`xp-record-trend ${trend}`} title={previous ? `前回 ${previous.xp.toFixed(1)}` : "前回なし"}>
        <TrendIcon aria-hidden="true" size={15} />
        <span className="sr-only">{trendLabel}</span>
        {delta === null ? "-" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)}`}
      </span>
      <time>{formatDateTime(record.recordedAt)}</time>
      <button aria-label="XPを編集" disabled={busy} onClick={onEdit} type="button">
        <Pencil aria-hidden="true" size={15} />
      </button>
    </div>
  );
}

function XpRecordEdit({
  busy,
  options,
  record,
  onCancel,
  onChange,
  onSave,
}: {
  busy: boolean;
  options: AnalysisOptions;
  record: XpRecord;
  onCancel: () => void;
  onChange: (record: XpRecord) => void;
  onSave: () => void;
}) {
  const xpValue = Number.isFinite(record.xp) ? String(record.xp) : "";
  return (
    <div className="history-edit xp-record-edit">
      <div className="history-edit-fields xp-record-edit-fields">
        <FilterSelect
          label="シーズン"
          onChange={(season) => onChange({ ...record, season })}
          options={options.seasons.map((item) => ({ label: seasonName(item), value: item }))}
          value={record.season}
        />
        <FilterSelect
          label="ルール"
          onChange={(rule) => onChange({ ...record, rule: rule as RuleId })}
          options={options.rules.map((item) => ({ label: ruleName(item), value: item }))}
          value={record.rule}
        />
        <label className="preview-field">
          <span>XP</span>
          <input
            aria-label="XP"
            inputMode="decimal"
            min="0"
            onChange={(event) => onChange({ ...record, xp: Number(event.target.value) })}
            step="0.1"
            type="number"
            value={xpValue}
          />
        </label>
        <label className="preview-field">
          <span>記録日時</span>
          <input
            aria-label="記録日時"
            onChange={(event) => onChange({ ...record, recordedAt: tokyoDateTimeToIso(event.target.value) })}
            type="datetime-local"
            value={toDateTimeLocal(record.recordedAt)}
          />
        </label>
      </div>
      <div className="history-edit-actions">
        <button disabled={busy} onClick={onCancel} type="button">
          <X aria-hidden="true" size={15} />
          キャンセル
        </button>
        <button className="save" disabled={busy || !Number.isFinite(record.xp) || record.xp < 0} onClick={onSave} type="button">
          <Save aria-hidden="true" size={15} />
          保存
        </button>
      </div>
    </div>
  );
}

function AnalysisFilters({
  filters,
  options,
  setFilter,
  showTime = false,
  xpOnly = false,
}: {
  filters: AnalysisFilters;
  options: AnalysisOptions;
  setFilter: (key: keyof AnalysisFilters, value: string) => void;
  showTime?: boolean;
  xpOnly?: boolean;
}) {
  return (
    <div className={`filter-row${xpOnly ? " xp-filter-row" : ""}`}>
      <FilterSelect
        label="シーズン"
        onChange={(value) => setFilter("season", value)}
        options={[{ label: "すべて", value: "all" }, ...options.seasons.map((item) => ({ label: seasonName(item), value: item }))]}
        value={filters.season}
      />
      {!xpOnly ? (
        <>
          <FilterSelect
            label="ルール"
            onChange={(value) => setFilter("rule", value)}
            options={[{ label: "すべて", value: "all" }, ...options.rules.map((item) => ({ label: ruleName(item), value: item }))]}
            value={filters.rule}
          />
          <FilterSelect
            label="武器"
            onChange={(value) => setFilter("weapon", value)}
            options={[{ label: "すべて", value: "all" }, ...options.weapons.map((item) => ({ label: item, value: item }))]}
            value={filters.weapon}
          />
          <FilterSelect
            label="ステージ"
            onChange={(value) => setFilter("stage", value)}
            options={[{ label: "すべて", value: "all" }, ...options.stages.map((item) => ({ label: item, value: item }))]}
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

function HistoryRow({
  busy,
  match,
  onDelete,
  onEdit,
}: {
  busy: boolean;
  match: Match;
  onDelete: () => void;
  onEdit: () => void;
}) {
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
        <button aria-label="編集" disabled={busy} onClick={onEdit} type="button">
          <Pencil aria-hidden="true" size={15} />
        </button>
        <button aria-label="削除" className="danger" disabled={busy} onClick={onDelete} type="button">
          <Trash2 aria-hidden="true" size={15} />
        </button>
      </div>
    </div>
  );
}

function HistoryEdit({
  busy,
  match,
  options,
  onCancel,
  onChange,
  onSave,
}: {
  busy: boolean;
  match: Match;
  options: AnalysisOptions;
  onCancel: () => void;
  onChange: (match: Match) => void;
  onSave: () => void;
}) {
  return (
    <div className="history-edit">
      <div className="history-edit-fields">
        <FilterSelect label="シーズン" onChange={(season) => onChange({ ...match, season })} options={options.seasons.map((item) => ({ label: seasonName(item), value: item }))} value={match.season} />
        <FilterSelect label="ルール" onChange={(rule) => onChange({ ...match, rule: rule as RuleId })} options={options.rules.map((item) => ({ label: ruleName(item), value: item }))} value={match.rule} />
        <label className="preview-field">
          <span>武器</span>
          <input onChange={(event) => onChange({ ...match, weapon: event.target.value })} value={match.weapon} />
        </label>
        <FilterSelect label="ステージ" onChange={(stage) => onChange({ ...match, stage })} options={options.stages.map((item) => ({ label: item, value: item }))} value={match.stage} />
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

const xpRuleColors: Record<RuleId, string> = {
  area: "#138e9d",
  tower: "#d45b85",
  rainmaker: "#a47700",
  clam: "#6d58b8",
};

function XpChart({
  baselines,
  end,
  records,
  start,
}: {
  baselines: XpRecord[];
  end?: string;
  records: XpRecord[];
  start?: string;
}) {
  const chart = buildDailyXpSeries(records, baselines, start, end);
  const values = chart.series.flatMap((series) => series.points.map((point) => point.xp));
  const dataMin = Math.floor(Math.min(...values) - 20);
  const dataMax = Math.ceil(Math.max(...values) + 20);
  const yTicks = chartTicks(dataMin, dataMax, 5);
  const min = yTicks[0];
  const max = yTicks.at(-1) as number;
  const span = Math.max(1, max - min);
  const xTicks = dayTicks(chart.days, 6);
  const width = 720;
  const height = 260;
  const pad = 44;

  return (
    <>
      <div className="xp-chart-legend">
        {chart.series.map((series) => (
          <span key={series.rule}>
            <i style={{ background: xpRuleColors[series.rule] }} />
            {ruleName(series.rule)}
          </span>
        ))}
      </div>
      <div className="react-xp-chart">
        <svg aria-label="XP推移" role="img" viewBox={`0 0 ${width} ${height}`}>
          {yTicks.map((tick) => {
            const y = height - pad - ((tick - min) / span) * (height - pad * 2);
            return (
              <g className="xp-y-tick" key={tick}>
                <line stroke="#e3e7e2" x1={pad} x2={width - pad} y1={y} y2={y} />
                <text fill="#68716b" fontSize="11" textAnchor="end" x={pad - 7} y={y + 4}>
                  {tick}
                </text>
              </g>
            );
          })}
          {xTicks.map((tick) => {
            const x = pad + (tick.index / Math.max(1, chart.days.length - 1)) * (width - pad * 2);
            return (
              <g className="xp-x-tick" key={tick.day}>
                <line stroke="#eef0ed" x1={x} x2={x} y1={pad} y2={height - pad} />
                <line stroke="#aeb7b0" x1={x} x2={x} y1={height - pad} y2={height - pad + 5} />
                <text fill="#68716b" fontSize="11" textAnchor="middle" x={x} y={height - pad + 19}>
                  {formatChartDate(tick.day)}
                </text>
              </g>
            );
          })}
          <line stroke="#aeb7b0" x1={pad} x2={width - pad} y1={height - pad} y2={height - pad} />
          <line stroke="#aeb7b0" x1={pad} x2={pad} y1={pad} y2={height - pad} />
          {chart.series.map((series) => {
            const points = series.points.map((point) => ({
              ...point,
              x: pad + (point.dayIndex / Math.max(1, chart.days.length - 1)) * (width - pad * 2),
              y: height - pad - ((point.xp - min) / span) * (height - pad * 2),
            }));
            const path = points
              .map((point, index) => `${index ? "L" : "M"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
              .join(" ");
            return (
              <g key={series.rule}>
                <path d={path} fill="none" stroke={xpRuleColors[series.rule]} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                {points
                  .filter((point) => point.measured)
                  .map((point) => (
                    <circle cx={point.x} cy={point.y} fill={xpRuleColors[series.rule]} key={point.recordedAt} r="4">
                      <title>
                        {ruleName(series.rule)} {point.xp.toFixed(1)} {formatDateTime(point.recordedAt as string)}
                      </title>
                    </circle>
                  ))}
              </g>
            );
          })}
        </svg>
      </div>
    </>
  );
}

async function loadXpRecords(season: string, start?: string, end?: string) {
  const items: XpRecord[] = [];
  let cursor: string | undefined;
  do {
    const page = await getXpRecords({
      cursor,
      end,
      limit: 100,
      rule: "all",
      season,
      start,
    });
    items.push(...page.items);
    cursor = page.nextCursor || undefined;
  } while (cursor && items.length < 1000);
  return items;
}

function xpRecordsWithPrevious(records: XpRecord[], baselines: XpRecord[]) {
  const previousByRule = new Map<RuleId, XpRecord>();
  baselines.forEach((record) => previousByRule.set(record.rule, record));
  return records
    .slice()
    .sort((left, right) => new Date(left.recordedAt).getTime() - new Date(right.recordedAt).getTime())
    .map((record) => {
      const previous = previousByRule.get(record.rule) || null;
      previousByRule.set(record.rule, record);
      return {
        delta: previous ? Math.round((record.xp - previous.xp) * 10) / 10 : null,
        previous,
        record,
      };
    })
    .reverse();
}

function buildDailyXpSeries(records: XpRecord[], baselines: XpRecord[], start?: string, end?: string) {
  const ordered = records.slice().sort((left, right) => new Date(left.recordedAt).getTime() - new Date(right.recordedAt).getTime());
  const firstDate = start || ordered[0]?.recordedAt;
  const lastDate = end || ordered.at(-1)?.recordedAt;
  const days = dateKeys(firstDate as string, lastDate as string);
  const series = rules.flatMap((rule) => {
    const daily = new Map<string, XpRecord>();
    ordered
      .filter((record) => record.rule === rule.id)
      .forEach((record) => daily.set(dateKey(record.recordedAt), record));
    let latest = baselines
      .filter((record) => record.rule === rule.id)
      .sort((left, right) => new Date(left.recordedAt).getTime() - new Date(right.recordedAt).getTime())
      .at(-1);
    const points = days.flatMap((day, dayIndex) => {
      const measured = daily.get(day);
      if (measured) latest = measured;
      if (!latest) return [];
      return [{
        dayIndex,
        measured: Boolean(measured),
        recordedAt: measured?.recordedAt || latest.recordedAt,
        xp: latest.xp,
      }];
    });
    return points.length ? [{ points, rule: rule.id }] : [];
  });
  return { days, series };
}

function dateKeys(start: string, end: string) {
  const first = new Date(start);
  const last = new Date(end);
  first.setHours(0, 0, 0, 0);
  last.setHours(0, 0, 0, 0);
  const result: string[] = [];
  for (const date = first; date <= last; date.setDate(date.getDate() + 1)) {
    result.push(dateKey(date.toISOString()));
  }
  return result;
}

function dateKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatChartDate(value: string) {
  const [, month, day] = value.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function chartTicks(min: number, max: number, targetCount: number) {
  const rawStep = Math.max(1, (max - min) / Math.max(1, targetCount - 1));
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const niceStep = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10) * magnitude;
  const first = Math.floor(min / niceStep) * niceStep;
  const last = Math.ceil(max / niceStep) * niceStep;
  const ticks: number[] = [];
  for (let value = first; value <= last; value += niceStep) ticks.push(Math.round(value * 10) / 10);
  if (ticks.length < 2) return [min, max];
  return ticks;
}

function dayTicks(days: string[], maxCount: number) {
  if (days.length <= maxCount) return days.map((day, index) => ({ day, index }));
  const indexes = new Set<number>();
  for (let position = 0; position < maxCount; position += 1) {
    indexes.add(Math.round((position / (maxCount - 1)) * (days.length - 1)));
  }
  return [...indexes].sort((left, right) => left - right).map((index) => ({ day: days[index], index }));
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

function mergeOptions(remote?: Partial<AnalysisOptions>): AnalysisOptions {
  return {
    seasons: unique([...seasons.map((item) => item.id), ...(remote?.seasons || [])]),
    rules: unique([...rules.map((item) => item.id), ...(remote?.rules || [])]),
    weapons: unique([...weapons, ...(remote?.weapons || [])]),
    stages: unique([...stages, ...(remote?.stages || [])]),
  };
}

function unique(values: string[]) {
  return Array.from(new Set(values));
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
    timeZone: "Asia/Tokyo",
  }).format(new Date(iso));
}

function toDateTimeLocal(iso: string) {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Tokyo",
    year: "numeric",
  })
    .formatToParts(new Date(iso))
    .reduce<Record<string, string>>((result, part) => {
      result[part.type] = part.value;
      return result;
    }, {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function tokyoDateTimeToIso(value: string) {
  return new Date(`${value}:00+09:00`).toISOString();
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

async function invalidateXpData(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["analysis-xp"] }),
    queryClient.invalidateQueries({ queryKey: ["current-analysis"] }),
    queryClient.invalidateQueries({ queryKey: ["xp-state"] }),
    queryClient.invalidateQueries({ queryKey: ["monthly-report"] }),
  ]);
}
