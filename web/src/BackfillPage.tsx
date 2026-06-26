import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Clock3, Save } from "lucide-react";
import { createMatch, createXpRecord, getSettings } from "./api";
import { defaultSettings, rules, seasons, stages, weapons } from "./catalog";
import type { AppSettings, MatchResult, RuleId } from "./types";

export function BackfillPage() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const [recordedAt, setRecordedAt] = useState(() => toDateTimeLocal(new Date()));
  const [matchForm, setMatchForm] = useState({
    result: "win" as MatchResult,
    rule: defaultSettings.rule,
    season: defaultSettings.season,
    stage: defaultSettings.stageA,
    weapon: defaultSettings.weapon,
  });
  const [xpForm, setXpForm] = useState({
    rule: defaultSettings.rule,
    season: defaultSettings.season,
    xp: "",
  });
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!settingsQuery.data) return;
    const next = { ...defaultSettings, ...settingsQuery.data };
    setMatchForm((current) => ({
      ...current,
      rule: next.rule,
      season: next.season,
      stage: next.stageA,
      weapon: next.weapon,
    }));
    setXpForm((current) => ({ ...current, rule: next.rule, season: next.season }));
  }, [settingsQuery.data]);

  const matchMutation = useMutation({
    mutationFn: () =>
      createMatch({
        ...matchForm,
        recordedAt: tokyoDateTimeToIso(recordedAt),
      }),
    onError: () => setError("過去の試合を保存できません"),
    onSuccess: async () => {
      setError("");
      setFeedback("過去の試合を保存しました");
      adjustTime(5);
      await invalidateData(queryClient);
    },
  });
  const xpMutation = useMutation({
    mutationFn: (xp: number) =>
      createXpRecord({
        recordType: "manual",
        rule: xpForm.rule,
        season: xpForm.season,
        xp,
        recordedAt: tokyoDateTimeToIso(recordedAt),
      }),
    onError: () => setError("過去のXPを保存できません"),
    onSuccess: async () => {
      setError("");
      setFeedback("過去のXPを保存しました");
      setXpForm((current) => ({ ...current, xp: "" }));
      await invalidateData(queryClient);
    },
  });

  const isBusy = matchMutation.isPending || xpMutation.isPending;

  function adjustTime(minutes: number) {
    const date = new Date(recordedAt);
    if (Number.isNaN(date.getTime())) return;
    date.setMinutes(date.getMinutes() + minutes);
    setRecordedAt(toDateTimeLocal(date));
  }

  function saveMatch(event: React.FormEvent) {
    event.preventDefault();
    if (!recordedAt || !matchForm.weapon.trim() || !matchForm.stage) {
      setError("日時、武器、ステージを入力してください");
      return;
    }
    matchMutation.mutate();
  }

  function saveXp(event: React.FormEvent) {
    event.preventDefault();
    const xp = Number(xpForm.xp);
    if (!recordedAt || !Number.isFinite(xp) || xp < 0) {
      setError("日時とXPを入力してください");
      return;
    }
    xpMutation.mutate(xp);
  }

  if (settingsQuery.isLoading) {
    return <BackfillStatus message="設定を読み込んでいます" />;
  }

  if (settingsQuery.isError) {
    return <BackfillStatus message="設定を読み込めません" tone="error" />;
  }

  return (
    <div className="page">
      <header className="page-header backfill-page-header">
        <div>
          <p>日時を指定して記録</p>
          <h1>過去データ入力</h1>
        </div>
        <div className={`record-feedback${error ? " error" : ""}`} aria-live="polite">
          {error || feedback}
        </div>
      </header>

      <section className="surface datetime-surface">
        <label className="preview-field datetime-field">
          <span>記録日時</span>
          <input
            disabled={isBusy}
            onChange={(event) => setRecordedAt(event.target.value)}
            type="datetime-local"
            value={recordedAt}
          />
        </label>
        <div className="time-stepper">
          <button disabled={isBusy} onClick={() => adjustTime(-5)} type="button">
            -5分
          </button>
          <button disabled={isBusy} onClick={() => adjustTime(5)} type="button">
            +5分
          </button>
        </div>
      </section>

      <div className="backfill-layout">
        <section className="surface">
          <SectionHeading icon={Clock3} title="過去の試合" />
          <form className="backfill-form match-backfill-form" onSubmit={saveMatch}>
            <SelectField
              disabled={isBusy}
              label="ルール"
              onChange={(rule) => setMatchForm((current) => ({ ...current, rule: rule as RuleId }))}
              options={rules.map((rule) => ({ label: rule.name, value: rule.id }))}
              value={matchForm.rule}
            />
            <WeaponInput
              disabled={isBusy}
              onChange={(weapon) => setMatchForm((current) => ({ ...current, weapon }))}
              value={matchForm.weapon}
            />
            <SelectField
              disabled={isBusy}
              label="シーズン"
              onChange={(season) => setMatchForm((current) => ({ ...current, season }))}
              options={seasons.map((season) => ({ label: season.name, value: season.id }))}
              value={matchForm.season}
            />
            <SelectField
              disabled={isBusy}
              label="ステージ"
              onChange={(stage) => setMatchForm((current) => ({ ...current, stage }))}
              options={stages.map((stage) => ({ label: stage, value: stage }))}
              value={matchForm.stage}
            />
            <SelectField
              disabled={isBusy}
              label="勝敗"
              onChange={(result) => setMatchForm((current) => ({ ...current, result: result as MatchResult }))}
              options={[
                { label: "WIN", value: "win" },
                { label: "LOSE", value: "lose" },
              ]}
              value={matchForm.result}
            />
            <button className="primary-button backfill-submit" disabled={isBusy} type="submit">
              <Save aria-hidden="true" size={16} />
              試合を保存
            </button>
          </form>
        </section>

        <section className="surface">
          <SectionHeading icon={BarChart3} title="過去のXP" />
          <form className="backfill-form xp-backfill-form" onSubmit={saveXp}>
            <SelectField
              disabled={isBusy}
              label="ルール"
              onChange={(rule) => setXpForm((current) => ({ ...current, rule: rule as RuleId }))}
              options={rules.map((rule) => ({ label: rule.name, value: rule.id }))}
              value={xpForm.rule}
            />
            <SelectField
              disabled={isBusy}
              label="シーズン"
              onChange={(season) => setXpForm((current) => ({ ...current, season }))}
              options={seasons.map((season) => ({ label: season.name, value: season.id }))}
              value={xpForm.season}
            />
            <label className="preview-field">
              <span>XP</span>
              <input
                disabled={isBusy}
                inputMode="decimal"
                min="0"
                onChange={(event) => setXpForm((current) => ({ ...current, xp: event.target.value }))}
                placeholder="2000.0"
                step="0.1"
                type="number"
                value={xpForm.xp}
              />
            </label>
            <button className="primary-button backfill-submit" disabled={isBusy || !xpForm.xp} type="submit">
              <Save aria-hidden="true" size={16} />
              XPを保存
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

function BackfillStatus({ message, tone = "normal" }: { message: string; tone?: "normal" | "error" }) {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p>日時を指定して記録</p>
          <h1>過去データ入力</h1>
        </div>
      </header>
      <div className={`surface loading-state${tone === "error" ? " error" : ""}`}>{message}</div>
    </div>
  );
}

function SectionHeading({ icon: Icon, title }: { icon: typeof Clock3; title: string }) {
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
      <select aria-label={label} disabled={disabled} onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function WeaponInput({ disabled, onChange, value }: { disabled: boolean; onChange: (value: string) => void; value: string }) {
  return (
    <label className="preview-field">
      <span>武器</span>
      <input
        aria-label="武器"
        autoComplete="off"
        disabled={disabled}
        list="backfill-weapon-list"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
      <datalist id="backfill-weapon-list">
        {weapons.map((weapon) => (
          <option key={weapon} value={weapon} />
        ))}
      </datalist>
    </label>
  );
}

function toDateTimeLocal(date: Date) {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Tokyo",
    year: "numeric",
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((result, part) => {
      result[part.type] = part.value;
      return result;
    }, {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function tokyoDateTimeToIso(value: string) {
  return new Date(`${value}:00+09:00`).toISOString();
}

async function invalidateData(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["current-analysis"] }),
    queryClient.invalidateQueries({ queryKey: ["matches"] }),
  ]);
}
