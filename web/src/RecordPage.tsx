import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, ListChecks, RotateCcw, Save, Swords } from "lucide-react";
import {
  createMatch,
  createXpRecord,
  deleteMatch,
  getCurrentAnalysis,
  getLatestMatches,
  getRecentMatches,
  getSettings,
  getXpState,
  patchSettings,
} from "./api";
import { defaultSettings, rules, seasonName, seasons, stages, weapons } from "./catalog";
import type { AppSettings, MatchResult, MatchSummary } from "./types";

export function RecordPage() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [xp, setXp] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (settingsQuery.data) setSettings({ ...defaultSettings, ...settingsQuery.data });
  }, [settingsQuery.data]);

  const analysisQuery = useQuery({
    enabled: Boolean(settings.weapon && settings.stageA && settings.stageB),
    queryFn: () => getCurrentAnalysis(settings),
    queryKey: ["current-analysis", settings],
  });
  const latestMatchesQuery = useQuery({
    queryFn: () => getLatestMatches(1),
    queryKey: ["matches", "latest"],
  });
  const recentMatchesQuery = useQuery({
    enabled: Boolean(settings.season && settings.rule && settings.stageA && settings.stageB),
    queryFn: () => getRecentMatches(settings),
    queryKey: ["matches", "recent", settings.season, settings.rule, settings.stageA, settings.stageB],
  });
  const xpStateQuery = useQuery({
    enabled: Boolean(settings.season && settings.rule),
    queryFn: () => getXpState(settings.season, settings.rule),
    queryKey: ["xp-state", settings.season, settings.rule],
  });
  const pendingCompletion = xpStateQuery.data?.pending[0] || null;

  useEffect(() => {
    if (!pendingCompletion?.estimatedXp) return;
    setXp(pendingCompletion.estimatedXp.toFixed(1));
  }, [pendingCompletion?.completedMatchId, pendingCompletion?.estimatedXp]);

  const refreshRecordData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["current-analysis"] }),
      queryClient.invalidateQueries({ queryKey: ["matches"] }),
      queryClient.invalidateQueries({ queryKey: ["xp-state"] }),
    ]);
  };

  const settingsMutation = useMutation({
    mutationFn: (input: { key: keyof AppSettings; value: AppSettings[keyof AppSettings] }) =>
      patchSettings({ [input.key]: input.value }),
    onError: () => {
      setError("設定を保存できません");
      if (settingsQuery.data) setSettings({ ...defaultSettings, ...settingsQuery.data });
    },
    onSuccess: (saved) => {
      setError("");
      queryClient.setQueryData(["settings"], saved);
      setSettings(saved);
    },
  });
  const matchMutation = useMutation({
    mutationFn: ({ stage, result }: { stage: string; result: MatchResult }) =>
      createMatch({
        result,
        rule: settings.rule,
        season: settings.season,
        stage,
        weapon: settings.weapon,
      }),
    onError: () => setError("試合結果を保存できません"),
    onSuccess: async (match) => {
      setError("");
      setFeedback(`${match.result === "win" ? "WIN" : "LOSE"}を保存しました`);
      await refreshRecordData();
    },
  });
  const xpMutation = useMutation({
    mutationFn: (input: { value: number; recordType: "completed" | "manual" }) =>
      createXpRecord({
        completedMatchId: input.recordType === "completed" ? pendingCompletion?.completedMatchId : null,
        recordedAt: input.recordType === "completed" ? pendingCompletion?.completedAt : undefined,
        recordType: input.recordType,
        rule: settings.rule,
        season: settings.season,
        xp: input.value,
      }),
    onError: () => setError("XPを保存できません"),
    onSuccess: async () => {
      setError("");
      setXp("");
      setFeedback("XPを保存しました");
      await refreshRecordData();
    },
  });
  const undoMutation = useMutation({
    mutationFn: deleteMatch,
    onError: () => setError("最後の試合を取り消せません"),
    onSuccess: async () => {
      setError("");
      setFeedback("最後の試合を取り消しました");
      await refreshRecordData();
    },
  });

  const isBusy = settingsMutation.isPending || matchMutation.isPending || xpMutation.isPending || undoMutation.isPending;
  const latestMatch = latestMatchesQuery.data?.items[0] || null;
  const stageSummaries = useMemo(
    () => new Map(analysisQuery.data?.stages.map((item) => [item.stage, item])),
    [analysisQuery.data],
  );

  function saveSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    setFeedback("");
    settingsMutation.mutate({ key, value });
  }

  function saveXp(event: React.FormEvent) {
    event.preventDefault();
    const value = Number(xp);
    if (!Number.isFinite(value) || value < 0) {
      setError("XPを入力してください");
      return;
    }
    if (pendingCompletion) {
      xpMutation.mutate({ recordType: "completed", value });
      return;
    }
    const current = xpStateQuery.data?.current;
    if (
      current &&
      current.wins + current.losses > 0 &&
      !window.confirm(
        `現在は${current.wins}勝${current.losses}敗です。\nこのXPを現在地点の手動記録として保存しますか？\n勝敗カウントはリセットされません。`,
      )
    ) {
      return;
    }
    xpMutation.mutate({ recordType: "manual", value });
  }

  if (settingsQuery.isLoading) {
    return <RecordStatus title="試合記録" message="設定を読み込んでいます" />;
  }

  if (settingsQuery.isError) {
    return <RecordStatus title="試合記録" message="設定を読み込めません" tone="error" />;
  }

  return (
    <div className="page">
      <header className="page-header record-page-header">
        <div>
          <p>{seasonName(settings.season)}</p>
          <h1>試合記録</h1>
        </div>
        <div className={`record-feedback${error ? " error" : ""}`} aria-live="polite">
          {error || feedback || (latestMatch ? `最終記録 ${formatDateTime(latestMatch.recordedAt)}` : "未記録")}
        </div>
      </header>

      <div className="record-layout">
        <section className="surface settings-surface">
          <SectionHeading icon={ListChecks} title="現在設定" />
          <div className="field-grid">
            <SelectField
              disabled={isBusy}
              label="ルール"
              onChange={(value) => saveSetting("rule", value as AppSettings["rule"])}
              options={rules.map((rule) => ({ label: rule.name, value: rule.id }))}
              value={settings.rule}
            />
            <WeaponField
              disabled={isBusy}
              onCommit={(value) => saveSetting("weapon", value)}
              value={settings.weapon}
            />
            <SelectField
              disabled={isBusy}
              label="ステージA"
              onChange={(value) => saveSetting("stageA", value)}
              options={stages.map((stage) => ({ label: stage, value: stage }))}
              value={settings.stageA}
            />
            <SelectField
              disabled={isBusy}
              label="ステージB"
              onChange={(value) => saveSetting("stageB", value)}
              options={stages.map((stage) => ({ label: stage, value: stage }))}
              value={settings.stageB}
            />
            <SelectField
              disabled={isBusy}
              label="シーズン"
              onChange={(value) => saveSetting("season", value)}
              options={seasons.map((season) => ({ label: season.name, value: season.id }))}
              value={settings.season}
            />
          </div>
        </section>

        <section className="surface performance-surface">
          <SectionHeading icon={BarChart3} title="現在設定の成績" />
          {analysisQuery.isError ? (
            <div className="inline-error">成績を読み込めません</div>
          ) : (
            <>
              <div className="metric-row">
                <Metric
                  label="最新XP"
                  loading={analysisQuery.isLoading}
                  value={analysisQuery.data?.latestXp ? analysisQuery.data.latestXp.xp.toFixed(1) : "-"}
                />
                <Metric
                  label="武器勝率"
                  loading={analysisQuery.isLoading}
                  value={formatRate(analysisQuery.data?.weapon)}
                />
                <Metric
                  label="試合数"
                  loading={analysisQuery.isLoading}
                  value={analysisQuery.data ? `${analysisQuery.data.weapon.total}戦` : "-"}
                />
              </div>
              <div className="stage-stat-list">
                <StageStat loading={analysisQuery.isLoading} name={settings.stageA} summary={stageSummaries.get(settings.stageA)} />
                <StageStat loading={analysisQuery.isLoading} name={settings.stageB} summary={stageSummaries.get(settings.stageB)} />
              </div>
            </>
          )}
        </section>

        <section className="surface result-surface">
          <div className="section-heading-row">
            <SectionHeading icon={Swords} title="試合結果" />
            <button
              className="icon-text-button"
              disabled={!latestMatch || isBusy}
              onClick={() => latestMatch && undoMutation.mutate(latestMatch.id)}
              type="button"
            >
              <RotateCcw aria-hidden="true" size={16} />
              最後を取り消す
            </button>
          </div>
          <div className="result-grid">
            <ResultButton disabled={isBusy} onClick={() => matchMutation.mutate({ stage: settings.stageA, result: "win" })} result="WIN" stage={settings.stageA} tone="win" />
            <ResultButton disabled={isBusy} onClick={() => matchMutation.mutate({ stage: settings.stageA, result: "lose" })} result="LOSE" stage={settings.stageA} tone="lose" />
            <ResultButton disabled={isBusy} onClick={() => matchMutation.mutate({ stage: settings.stageB, result: "win" })} result="WIN" stage={settings.stageB} tone="win" />
            <ResultButton disabled={isBusy} onClick={() => matchMutation.mutate({ stage: settings.stageB, result: "lose" })} result="LOSE" stage={settings.stageB} tone="lose" />
          </div>
          <XpProgress
            current={xpStateQuery.data?.current}
            loading={xpStateQuery.isLoading}
            pending={xpStateQuery.data?.pending || []}
          />
          <form className="xp-entry" onSubmit={saveXp}>
            <label>
              <span>{pendingCompletion ? "確定XP" : "現在XP"}</span>
              <input
                disabled={isBusy}
                inputMode="decimal"
                min="0"
                onChange={(event) => setXp(event.target.value)}
                placeholder="2000.0"
                step="0.1"
                type="number"
                value={xp}
              />
            </label>
            <button className="primary-button" disabled={isBusy || !xp} type="submit">
              <Save aria-hidden="true" size={16} />
              {pendingCompletion ? "確定XPを保存" : "XP保存"}
            </button>
          </form>
        </section>

        <section className="surface recent-matches-surface">
          <SectionHeading icon={ListChecks} title="現在設定の直近10試合" />
          {recentMatchesQuery.isLoading ? (
            <div className="inline-status">試合履歴を読み込んでいます</div>
          ) : recentMatchesQuery.isError ? (
            <div className="inline-error">試合履歴を読み込めません</div>
          ) : recentMatchesQuery.data?.items.length ? (
            <RecentMatches matches={recentMatchesQuery.data.items} />
          ) : (
            <div className="inline-status">該当する試合はありません</div>
          )}
        </section>
      </div>
    </div>
  );
}

function RecentMatches({ matches }: { matches: Array<{ id: string; recordedAt: string; result: MatchResult; stage: string }> }) {
  const wins = matches.filter((match) => match.result === "win").length;

  return (
    <>
      <div className="recent-match-summary">
        <strong>
          {wins}勝{matches.length - wins}敗
        </strong>
        <span>直近{matches.length}試合</span>
      </div>
      <div className="recent-match-list">
        {matches.map((match) => (
          <div className="recent-match-row" key={match.id}>
            <b className={match.result}>{match.result === "win" ? "WIN" : "LOSE"}</b>
            <strong>{match.stage}</strong>
            <time dateTime={match.recordedAt}>{formatDateTime(match.recordedAt)}</time>
          </div>
        ))}
      </div>
    </>
  );
}

function XpProgress({
  current,
  loading,
  pending,
}: {
  current?: { wins: number; losses: number };
  loading: boolean;
  pending: Array<{
    completedAt: string;
    completedMatchId: string;
    estimatedXp: number | null;
    losses: number;
    wins: number;
  }>;
}) {
  if (loading) return <div className="xp-progress">XPセットを読み込んでいます</div>;
  const wins = current?.wins || 0;
  const losses = current?.losses || 0;
  const next = [
    wins === 2 ? "次のWINでXP確定" : "",
    losses === 2 ? "次のLOSEでXP確定" : "",
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <div className="xp-progress">
      {pending.length ? (
        <div className="xp-pending">
          <strong>未入力のXPがあります</strong>
          {pending.map((completion, index) => (
            <div className="xp-pending-row" key={completion.completedMatchId}>
              <span>
                {formatDateTime(completion.completedAt)}　{completion.wins}勝{completion.losses}敗
              </span>
              {index === 0 ? (
                <em>
                  {completion.estimatedXp === null
                    ? "推定データ不足"
                    : `推定XP ${completion.estimatedXp.toFixed(1)}`}
                </em>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      <div className="xp-current">
        <strong>
          現在 {wins}勝{losses}敗
        </strong>
        <span>{next || "3勝または3敗でXP確定"}</span>
      </div>
    </div>
  );
}

function RecordStatus({ title, message, tone = "normal" }: { title: string; message: string; tone?: "normal" | "error" }) {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p>2026夏 Sizzle Season</p>
          <h1>{title}</h1>
        </div>
      </header>
      <div className={`surface loading-state${tone === "error" ? " error" : ""}`}>{message}</div>
    </div>
  );
}

function SectionHeading({ icon: Icon, title }: { icon: typeof ListChecks; title: string }) {
  return (
    <div className="section-heading">
      <Icon aria-hidden="true" size={18} />
      <h2>{title}</h2>
    </div>
  );
}

function SelectField({
  disabled,
  label,
  onChange,
  options,
  value,
}: {
  disabled: boolean;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="preview-field">
      <span>{label}</span>
      <select disabled={disabled} onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function WeaponField({ disabled, onCommit, value }: { disabled: boolean; onCommit: (value: string) => void; value: string }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  function commit() {
    const next = draft.trim();
    if (next && next !== value) onCommit(next);
  }

  return (
    <label className="preview-field">
      <span>武器</span>
      <input
        autoComplete="off"
        disabled={disabled}
        list="record-weapon-list"
        onBlur={commit}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        value={draft}
      />
      <datalist id="record-weapon-list">
        {weapons.map((weapon) => (
          <option key={weapon} value={weapon} />
        ))}
      </datalist>
    </label>
  );
}

function Metric({ label, loading, value }: { label: string; loading: boolean; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{loading ? "..." : value}</strong>
    </div>
  );
}

function StageStat({ loading, name, summary }: { loading: boolean; name: string; summary?: MatchSummary }) {
  return (
    <div className="stage-stat">
      <span>{name}</span>
      <strong>{loading ? "..." : formatRate(summary)}</strong>
      <small>{loading ? "" : `${summary?.total || 0}戦`}</small>
      {!loading && summary && summary.total > 0 && summary.total < 5 ? <em>データ少</em> : null}
    </div>
  );
}

function ResultButton({
  disabled,
  onClick,
  result,
  stage,
  tone,
}: {
  disabled: boolean;
  onClick: () => void;
  result: string;
  stage: string;
  tone: "win" | "lose";
}) {
  return (
    <button className={`result-button ${tone}`} disabled={disabled} onClick={onClick} type="button">
      <span>{stage}</span>
      <strong>{result}</strong>
    </button>
  );
}

function formatRate(summary?: MatchSummary) {
  return summary?.winRate === null || summary?.winRate === undefined ? "-" : `${summary.winRate}%`;
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}
