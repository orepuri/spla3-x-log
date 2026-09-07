import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { NavLink } from "react-router-dom";
import { CalendarDays, Clipboard, Download, Flame, Goal, Maximize2, Pause, Play, RotateCcw, Sparkles, TrendingDown, TrendingUp, Trophy, Video, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getMonthlyReport, getSeasonReport } from "./api";
import { defaultSeasonId, rules, seasonName, seasons } from "./catalog";
import type { MonthlyReport, MonthlyRuleReport, MonthlyStageReport, RuleId, SeasonReport, SeasonXpFrame } from "./types";

export function MonthlyReportPage() {
  const latestReportMonth = latestClosedMonth();
  const [month, setMonth] = useState(latestReportMonth);
  const reportQuery = useQuery({
    queryFn: () => getMonthlyReport(month),
    queryKey: ["monthly-report", month],
  });
  const report = reportQuery.data;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p>月間振り返り</p>
          <h1>レポート</h1>
        </div>
        <label className="compact-select report-month-select">
          <span>対象月</span>
          <input aria-label="対象月" max={latestReportMonth} onChange={(event) => setMonth(event.target.value)} type="month" value={month} />
        </label>
      </header>

      <ReportTabs />

      {reportQuery.isLoading ? (
        <div className="surface loading-state">読み込んでいます</div>
      ) : reportQuery.isError ? (
        <div className="surface loading-state error">レポートを読み込めません</div>
      ) : report ? (
        <div className="report-layout">
          <section className="surface report-summary-surface">
            <SectionTitle icon={CalendarDays} title={`${formatMonth(report.month)} レポート`} />
            <div className="metric-row report-metrics">
              <Metric label="試合数" value={`${report.summary.total}戦`} />
              <Metric label="勝率" value={report.summary.winRate === null ? "-" : `${report.summary.winRate}%`} />
              <Metric label="記録日数" value={`${report.summary.activeDays}日`} />
              <Metric label="最大連勝" value={`${report.summary.maxWinStreak}連勝`} />
            </div>
          </section>

          <Highlights report={report} />
          <SharePanel report={report} />
          <RuleTable rules={report.rules} />
          <StageTable stages={report.stages} />
        </div>
      ) : null}
    </div>
  );
}

export function SeasonReportPage() {
  const [season, setSeason] = useState(latestClosedSeason());
  const reportQuery = useQuery({
    queryFn: () => getSeasonReport(season),
    queryKey: ["season-report", season],
  });
  const report = reportQuery.data;

  return (
    <div className="page">
      <header className="page-header report-page-header">
        <div>
          <p>シーズン振り返り</p>
          <h1>レポート</h1>
        </div>
        <label className="compact-select report-season-select">
          <span>対象シーズン</span>
          <select aria-label="対象シーズン" onChange={(event) => setSeason(event.target.value)} value={season}>
            {seasons.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </header>

      <ReportTabs />

      {reportQuery.isLoading ? (
        <div className="surface loading-state">読み込んでいます</div>
      ) : reportQuery.isError ? (
        <div className="surface loading-state error">レポートを読み込めません</div>
      ) : report ? (
        <div className="report-layout">
          <section className="surface report-summary-surface">
            <div className="section-heading-row season-report-heading">
              <div>
                <SectionTitle icon={CalendarDays} title={`${seasonName(report.season)} レポート`} />
                <p className="report-period">{formatSeasonPeriod(report)}</p>
              </div>
              <span className={`season-status${report.range.closed ? " closed" : ""}`}>
                {report.range.closed ? "終了" : "開催中"}
              </span>
            </div>
            <div className="metric-row report-metrics season-report-metrics">
              <Metric label="試合数" value={`${report.summary.total}戦`} />
              <Metric label="勝率" value={report.summary.winRate === null ? "-" : `${report.summary.winRate}%`} />
              <Metric label="記録日数" value={`${report.summary.activeDays}日`} />
              <Metric label="最大連勝" value={`${report.summary.maxWinStreak}連勝`} />
              <Metric label="最大連敗" value={`${report.summary.maxLoseStreak}連敗`} />
            </div>
          </section>

          <Highlights report={report} />
          <SeasonXpAnimationPanel report={report} />
          <SeasonSharePanel report={report} />
          <RuleTable rules={report.rules} />
          <StageTable stages={report.stages} />
        </div>
      ) : null}
    </div>
  );
}

function ReportTabs() {
  return (
    <nav aria-label="レポート種別" className="report-tabs">
      <NavLink className={({ isActive }) => `report-tab${isActive ? " active" : ""}`} end to="/reports/monthly">
        月間
      </NavLink>
      <NavLink className={({ isActive }) => `report-tab${isActive ? " active" : ""}`} to="/reports/season">
        シーズン
      </NavLink>
    </nav>
  );
}

function SharePanel({ report }: { report: MonthlyReport }) {
  const [copied, setCopied] = useState(false);
  const shareText = useMemo(() => buildShareText(report), [report]);
  const thumbnailRules = orderedRuleRows(report);

  async function copyShareText() {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="surface">
      <div className="section-heading-row">
        <SectionTitle icon={Clipboard} title="投稿用" />
        <div className="report-share-actions">
          <button className="icon-text-button" onClick={() => downloadThumbnail(report)} type="button">
            <Download aria-hidden="true" size={16} />
            画像保存
          </button>
          <button className="icon-text-button" onClick={copyShareText} type="button">
            <Clipboard aria-hidden="true" size={16} />
            {copied ? "コピー済み" : "投稿文コピー"}
          </button>
        </div>
      </div>
      <div className="report-share-layout">
        <div className="report-share-card" aria-label="投稿用サムネイル">
          <div className="report-share-header">
            <div>
              <span>Xマッチレポート</span>
              <h2>{formatMonth(report.month)}</h2>
            </div>
            <b>月間</b>
          </div>
          <div className="report-share-rules">
            {thumbnailRules.map((row) => (
              <div className="report-share-rule" key={row.rule}>
                <span>{ruleName(row.rule)}</span>
                <strong>{formatXp(row.finalXp)}</strong>
                <em className={deltaClass(row.xpDelta)}>{formatDeltaWithArrow(row.xpDelta)}</em>
              </div>
            ))}
          </div>
          <div className="report-share-score" aria-label="月間サマリー">
            <strong>
              <span>試合数</span>
              {report.summary.total}戦
            </strong>
            <strong>
              <span>勝率</span>
              {report.summary.winRate ?? 0}%
            </strong>
            <strong>
              <span>最大連勝</span>
              {report.summary.maxWinStreak}
            </strong>
            <strong>
              <span>最大連敗</span>
              {report.summary.maxLoseStreak}
            </strong>
          </div>
        </div>
        <textarea aria-label="投稿文" readOnly value={shareText} />
      </div>
    </section>
  );
}

function SeasonSharePanel({ report }: { report: SeasonReport }) {
  const [copied, setCopied] = useState(false);
  const shareText = useMemo(() => buildSeasonShareText(report), [report]);
  const thumbnailRules = orderedRuleRows(report);

  async function copyShareText() {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="surface">
      <div className="section-heading-row">
        <SectionTitle icon={Clipboard} title="投稿用" />
        <div className="report-share-actions">
          <button className="icon-text-button" onClick={() => downloadThumbnail(report)} type="button">
            <Download aria-hidden="true" size={16} />
            画像保存
          </button>
          <button className="icon-text-button" onClick={copyShareText} type="button">
            <Clipboard aria-hidden="true" size={16} />
            {copied ? "コピー済み" : "投稿文コピー"}
          </button>
        </div>
      </div>
      <div className="report-share-layout">
        <div className="report-share-card" aria-label="投稿用サムネイル">
          <div className="report-share-header">
            <div>
              <span>Xマッチレポート</span>
              <h2>{seasonName(report.season)}</h2>
            </div>
            <b>シーズン</b>
          </div>
          <div className="report-share-rules">
            {thumbnailRules.map((row) => (
              <div className="report-share-rule" key={row.rule}>
                <span>{ruleName(row.rule)}</span>
                <strong>{formatXp(row.finalXp)}</strong>
                <em className={deltaClass(row.xpDelta)}>{formatDeltaWithArrow(row.xpDelta, "シーズン差")}</em>
              </div>
            ))}
          </div>
          <div className="report-share-score" aria-label="シーズンサマリー">
            <strong>
              <span>試合数</span>
              {report.summary.total}戦
            </strong>
            <strong>
              <span>勝率</span>
              {report.summary.winRate ?? 0}%
            </strong>
            <strong>
              <span>最大連勝</span>
              {report.summary.maxWinStreak}
            </strong>
            <strong>
              <span>最大連敗</span>
              {report.summary.maxLoseStreak}
            </strong>
          </div>
        </div>
        <textarea aria-label="投稿文" readOnly value={shareText} />
      </div>
    </section>
  );
}

function Highlights({ report }: { report: Pick<MonthlyReport, "highlights"> }) {
  const items = useMemo(
    () => [
      {
        icon: TrendingUp,
        label: "伸びたルール",
        value: report.highlights.mostImprovedRule
          ? `${ruleName(report.highlights.mostImprovedRule.rule)} ${formatDelta(report.highlights.mostImprovedRule.xpDelta)}`
          : "-",
      },
      {
        icon: Goal,
        label: "得意ステージ",
        value: report.highlights.bestStage
          ? `${report.highlights.bestStage.stage} ${report.highlights.bestStage.winRate ?? 0}%`
          : "-",
      },
      {
        icon: Flame,
        label: "最多プレイ日",
        value: report.highlights.mostPlayedDay
          ? `${formatDate(report.highlights.mostPlayedDay.date)} ${report.highlights.mostPlayedDay.total}戦`
          : "-",
      },
    ],
    [report],
  );

  return (
    <section className="surface">
      <SectionTitle icon={Flame} title="ハイライト" />
      <div className="report-highlight-grid">
        {items.map(({ icon: Icon, label, value }) => (
          <div className="report-highlight" key={label}>
            <Icon aria-hidden="true" size={18} />
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function SeasonXpAnimationPanel({ report }: { report: SeasonReport }) {
  const frames = report.xpTrend;
  const [position, setPosition] = useState<AnimationPosition>(() => initialAnimationPosition(frames));
  const positionRef = useRef(position);
  const [playing, setPlaying] = useState(frames.length > 1);
  const [speed, setSpeed] = useState(1);
  const [videoState, setVideoState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [animationNonce, setAnimationNonce] = useState(0);
  const ruleIds = rules.map((rule) => rule.id);
  const moments = useMemo(() => buildXpMoments(frames), [frames]);

  useEffect(() => {
    const initial = initialAnimationPosition(frames);
    positionRef.current = initial;
    setPosition(initial);
    setPlaying(frames.length > 1);
    setVideoState("idle");
  }, [frames]);

  useEffect(() => {
    if (!playing || frames.length < 2) return;
    let animationFrame = 0;
    const duration = Math.max(50, Math.min(900, 12_000 / Math.max(frames.length - 1, 1))) / speed;
    let from = Math.min(positionRef.current.from, frames.length - 2);
    let to = Math.min(Math.max(positionRef.current.to, from + 1), frames.length - 1);
    let startedAt = performance.now() - positionRef.current.progress * duration;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const next = { from, progress, to };
      positionRef.current = next;
      setPosition(next);
      if (progress >= 1) {
        if (to >= frames.length - 1) {
          setPlaying(false);
          return;
        }
        from = to;
        to += 1;
        startedAt = now;
      }
      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [animationNonce, frames, playing, speed]);

  const current = interpolateXpFrame(frames, position, ruleIds);
  const bounds = xpBounds(frames, position);
  const currentFrameIndex = Math.min(Math.round(position.from + position.progress), Math.max(frames.length - 1, 0));
  const currentFrame = frames[currentFrameIndex] || frames[0];
  const currentMoment = activeXpMoment(moments, position, frames.length);
  const rangeExpansion = currentMoment?.kind === "range" ? currentMoment : null;

  function reset() {
    const initial = initialAnimationPosition(frames);
    positionRef.current = initial;
    setPosition(initial);
    setPlaying(frames.length > 1);
    setAnimationNonce((value) => value + 1);
  }

  function togglePlaying() {
    if (!playing && position.to >= frames.length - 1 && position.progress >= 1) {
      reset();
      return;
    }
    setPlaying((value) => !value);
  }

  function seek(value: string) {
    const index = Math.min(Math.max(Number(value), 0), Math.max(frames.length - 1, 0));
    const next = index === frames.length - 1
      ? { from: Math.max(index - 1, 0), progress: frames.length > 1 ? 1 : 0, to: index }
      : { from: index, progress: 0, to: Math.min(index + 1, frames.length - 1) };
    positionRef.current = next;
    setPosition(next);
    setPlaying(false);
  }

  async function saveVideo() {
    setVideoState("saving");
    try {
      await downloadXpVideo(report);
      setVideoState("saved");
    } catch (_error) {
      setVideoState("error");
    }
  }

  return (
    <section className="surface season-xp-surface">
      <div className="section-heading-row">
        <div>
          <SectionTitle icon={TrendingUp} title="全ルールXPの推移" />
          <p className="section-description">シーズン開始時から、全ルールのXP変化を再生できます。範囲を超えると軸が自動で広がります。</p>
        </div>
        <span className="xp-period-label">XP記録ごとの推移</span>
      </div>
      <div className={`xp-chart-wrap${rangeExpansion ? " is-range-expanding" : ""}`}>
        {rangeExpansion ? (
          <div className="xp-range-callout" key={`${rangeExpansion.index}-${rangeExpansion.rule}`}>
            <Maximize2 aria-hidden="true" size={16} />
            <span>
              <strong>レンジ限界突破</strong>
              <small>{rangeExpansion.detail}</small>
            </span>
          </div>
        ) : null}
        <svg aria-label="全ルールXPの推移グラフ" role="img" viewBox="0 0 760 310">
          <rect className="xp-chart-background" height="310" rx="8" width="760" />
          {bounds.ticks.map((xp) => (
            <g key={xp}>
              <line className="xp-grid-line" x1="48" x2="742" y1={xpY(xp, bounds)} y2={xpY(xp, bounds)} />
              <text className="xp-axis-label" x="42" y={xpY(xp, bounds) + 4} textAnchor="end">
                {xp}
              </text>
            </g>
          ))}
          <line className="xp-playhead" x1={chartX(position.from + position.progress, frames.length)} x2={chartX(position.from + position.progress, frames.length)} y1="18" y2="268" />
          {ruleIds.map((rule, index) =>
            xpSegments(rule, frames, position, bounds).map((points, segmentIndex) => (
              <polyline
                className="xp-line"
                fill="none"
                key={`${rule}-${segmentIndex}`}
                points={points}
                stroke={xpColors[index]}
              />
            )),
          )}
          {ruleIds.map((rule, index) => {
            const xp = current.xps[rule];
            if (xp === null) return null;
            return (
              <g key={rule}>
                <circle className={`xp-current-marker-halo${playing ? " is-live" : ""}`} cx={chartX(position.from + position.progress, frames.length)} cy={xpY(xp, bounds)} fill={xpColors[index]} r="10" stroke={xpColors[index]} />
                <circle className={`xp-current-marker${playing ? " is-live" : ""}`} cx={chartX(position.from + position.progress, frames.length)} cy={xpY(xp, bounds)} fill={xpColors[index]} r="5" />
              </g>
            );
          })}
          <text className="xp-date-label" x="48" y="292">
            {formatShortDate(frames[0]?.recordedAt)}
          </text>
          <text className="xp-date-label" textAnchor="end" x="742" y="292">
            {formatShortDate(frames[frames.length - 1]?.recordedAt)}
          </text>
        </svg>
      </div>
      <div className={`xp-live-banner${currentMoment ? ` is-${currentMoment.kind}` : ""}`} aria-live="polite">
        <div className="xp-live-kicker">
          <Sparkles aria-hidden="true" size={16} />
          <span>{currentMoment ? xpMomentLabel(currentMoment.kind) : "LIVE XP DIGEST"}</span>
        </div>
        <div className="xp-live-copy">
          <strong>{currentMoment?.title || "シーズンのXPを追跡中"}</strong>
          <span>{currentMoment?.detail || "グラフを再生すると、転機がポップアップします"}</span>
        </div>
        <time>{formatDateTime(currentFrame?.recordedAt)}</time>
      </div>
      <div className="xp-digest">
        <div className="xp-digest-heading">
          <strong>実況ダイジェスト</strong>
          <span>{moments.length ? `${moments.length} MOMENTS` : "MOMENTSを記録中"}</span>
        </div>
        <div aria-label="XP実況ダイジェスト" className="xp-moment-list">
          {moments.length ? moments.map((moment) => (
            <div className={`xp-moment-card${currentMoment === moment ? " active" : ""} is-${moment.kind}`} key={`${moment.kind}-${moment.index}-${moment.rule}`}>
              <XpMomentIcon kind={moment.kind} />
              <span>
                <strong>{moment.title}</strong>
                <small>{moment.detail}</small>
              </span>
            </div>
          )) : <div className="xp-moment-empty">XPの変化がまとまると、ここにハイライトが並びます。</div>}
        </div>
      </div>
      <div className="xp-current-heading">
        <strong>{currentFrame ? `${formatDateTime(currentFrame.recordedAt)} 時点` : ""}</strong>
        <span>XP未記録のルールは表示されません</span>
      </div>
      <div className="xp-current-list">
        {ruleIds.map((rule, index) => {
          const currentXp = current.xps[rule];
          const delta = currentSeasonXpDelta(report, frames, rule, currentXp);
          return (
            <div className={`xp-current-item${playing && currentXp !== null ? " updating" : ""}`} key={rule}>
              <i aria-hidden="true" style={{ backgroundColor: xpColors[index] }} />
              <span>{ruleName(rule)}</span>
              <strong>{formatXp(currentXp)} XP</strong>
              <em className={deltaClass(delta)}>
                {currentXp === null ? "未記録" : delta === null ? "現在値" : `${formatDelta(delta)} シーズン差`}
              </em>
            </div>
          );
        })}
      </div>
      <div className="xp-controls">
        <button className="icon-text-button" onClick={togglePlaying} type="button">
          {playing ? <Pause aria-hidden="true" size={16} /> : <Play aria-hidden="true" size={16} />}
          {playing ? "一時停止" : "再生"}
        </button>
        <button className="icon-text-button" onClick={reset} type="button">
          <RotateCcw aria-hidden="true" size={16} />
          最初から
        </button>
        <label className="xp-speed-control">
          <span>速度</span>
          <select aria-label="再生速度" onChange={(event) => setSpeed(Number(event.target.value))} value={speed}>
            <option value="0.5">0.5x</option>
            <option value="1">1x</option>
            <option value="2">2x</option>
          </select>
        </label>
        <input
          aria-label="再生位置"
          className="xp-seek"
          max={Math.max(frames.length - 1, 0)}
          min="0"
          onChange={(event) => seek(event.target.value)}
          type="range"
          value={currentFrameIndex}
        />
        <button className="icon-text-button" disabled={videoState === "saving"} onClick={saveVideo} type="button">
          <Video aria-hidden="true" size={16} />
          {videoState === "saving" ? "動画作成中…" : "動画保存"}
        </button>
      </div>
      <p className={`xp-video-note${videoState === "error" ? " error" : ""}`}>
        {videoState === "saved" ? "動画を保存しました。ブラウザによってMP4またはWEBM形式になります。" : videoState === "error" ? "このブラウザでは動画を保存できません。" : "X投稿用の動画をブラウザで作成します。"}
      </p>
    </section>
  );
}

const xpColors = ["#138e9d", "#f04b91", "#d97706", "#7357d8"];

interface AnimationPosition {
  from: number;
  progress: number;
  to: number;
}

function initialAnimationPosition(frames: SeasonXpFrame[]): AnimationPosition {
  if (frames.length < 2) return { from: 0, progress: 0, to: 0 };
  return { from: 0, progress: 0, to: 1 };
}

function chartX(index: number, frameCount: number) {
  const width = 694;
  return 48 + (frameCount > 1 ? (Math.min(Math.max(index, 0), frameCount - 1) / (frameCount - 1)) * width : width / 2);
}

function xpBounds(frames: SeasonXpFrame[], position: AnimationPosition) {
  const visibleFrames = frames.slice(0, Math.min(position.from + 1, frames.length));
  const current = interpolateXpFrame(frames, position, rules.map((rule) => rule.id));
  const currentValues = Object.values(current.xps).filter((xp): xp is number => xp !== null);
  const observedValues = [
    ...visibleFrames.flatMap((frame) => Object.values(frame.xps).filter((xp): xp is number => xp !== null)),
    ...currentValues,
  ];
  if (!observedValues.length) return xpBoundsForRange(1800, 2200);

  const firstObservedFrame = visibleFrames.find((frame) => Object.values(frame.xps).some((xp) => xp !== null));
  const firstValues = firstObservedFrame
    ? Object.values(firstObservedFrame.xps).filter((xp): xp is number => xp !== null)
    : currentValues;
  const initialMin = niceXpMin(Math.min(...firstValues));
  const initialMax = niceXpMax(Math.max(...firstValues));
  const observedMin = niceXpMin(Math.min(...observedValues));
  const observedMax = niceXpMax(Math.max(...observedValues));
  return xpBoundsForRange(Math.min(initialMin, observedMin), Math.max(initialMax, observedMax));
}

function xpBoundsForRange(min: number, max: number) {
  const step = Math.max(50, Math.ceil((max - min) / 3 / 50) * 50);
  const upper = min + step * 3;
  return { max: upper, min, ticks: [upper, upper - step, upper - step * 2, min] };
}

function niceXpMin(value: number) {
  return Math.max(0, Math.floor((value - 50) / 50) * 50);
}

function niceXpMax(value: number) {
  return Math.ceil((value + 50) / 50) * 50;
}

function xpY(xp: number, bounds: ReturnType<typeof xpBounds>) {
  return 18 + ((bounds.max - xp) / Math.max(bounds.max - bounds.min, 1)) * 250;
}

function interpolateXp(from: number | null, to: number | null, progress: number) {
  if (from === null) return to;
  if (to === null) return from;
  return from + (to - from) * progress;
}

function interpolateXpFrame(frames: SeasonXpFrame[], position: AnimationPosition, ruleIds: RuleId[]) {
  const from = frames[position.from] || frames[0];
  const to = frames[position.to] || from;
  const xps = Object.fromEntries(ruleIds.map((rule) => [rule, interpolateXp(from?.xps[rule] ?? null, to?.xps[rule] ?? null, position.progress)])) as Record<RuleId, number | null>;
  return { xps };
}

function xpSegments(rule: RuleId, frames: SeasonXpFrame[], position: AnimationPosition, bounds: ReturnType<typeof xpBounds>) {
  if (!frames.length) return [];
  const visibleFrames = frames.slice(0, Math.min(position.from + 1, frames.length));
  const indexes = visibleFrames.map((_frame, index) => index as number);
  const values = visibleFrames.map((frame) => frame.xps[rule]);
  if (position.to > position.from) {
    indexes.push(position.from + position.progress);
    values.push(interpolateXp(frames[position.from]?.xps[rule] ?? null, frames[position.to]?.xps[rule] ?? null, position.progress));
  }
  const segments: string[] = [];
  let current: string[] = [];
  values.forEach((xp, index) => {
    if (xp === null) {
      if (current.length > 1) segments.push(current.join(" "));
      current = [];
      return;
    }
    current.push(`${chartX(indexes[index], frames.length)},${xpY(xp, bounds)}`);
  });
  if (current.length > 1) segments.push(current.join(" "));
  return segments;
}

type XpMomentKind = "drop" | "milestone" | "range" | "record" | "surge";

interface XpMoment {
  detail: string;
  index: number;
  kind: XpMomentKind;
  rule: RuleId;
  title: string;
  value: number;
}

function buildXpMoments(frames: SeasonXpFrame[]) {
  if (frames.length < 2) return [];

  const ruleIds = rules.map((rule) => rule.id);
  const seasonHighs = new Map<RuleId, { index: number; value: number }>();
  const recordMoments = new Map<RuleId, XpMoment>();
  const milestoneMoments = new Map<RuleId, XpMoment>();
  const rangeMoments: XpMoment[] = [];
  let biggestGain: XpMoment | null = null;
  let biggestDrop: XpMoment | null = null;

  ruleIds.forEach((rule) => {
    const value = frames[0]?.xps[rule];
    if (value !== null && value !== undefined) seasonHighs.set(rule, { index: 0, value });
  });

  for (let index = 1; index < frames.length; index += 1) {
    const frame = frames[index];
    const previousFrame = frames[index - 1];
    const previousBounds = xpBounds(frames, animationPositionAtFrame(index - 1, frames.length));
    const nextBounds = xpBounds(frames, animationPositionAtFrame(index, frames.length));
    const expandedValues = ruleIds
      .map((rule) => ({ rule, value: frame.xps[rule] }))
      .filter(({ value }) => value !== null && (value < previousBounds.min || value > previousBounds.max)) as Array<{ rule: RuleId; value: number }>;

    if (nextBounds.min < previousBounds.min || nextBounds.max > previousBounds.max) {
      const expanded = expandedValues.sort((left, right) => {
        const leftDistance = left.value < previousBounds.min ? previousBounds.min - left.value : left.value - previousBounds.max;
        const rightDistance = right.value < previousBounds.min ? previousBounds.min - right.value : right.value - previousBounds.max;
        return rightDistance - leftDistance;
      })[0];
      if (expanded) {
        const side = expanded.value > previousBounds.max ? "上限" : "下限";
        rangeMoments.push({
          detail: `${ruleName(expanded.rule)} ${formatXp(expanded.value)} XPで${side}を更新`,
          index,
          kind: "range",
          rule: expanded.rule,
          title: "レンジ限界突破",
          value: expanded.value,
        });
      }
    }

    ruleIds.forEach((rule) => {
      const value = frame.xps[rule];
      if (value === null) return;
      const previous = previousFrame?.xps[rule] ?? null;
      const delta = previous === null ? null : value - previous;
      const seasonHigh = seasonHighs.get(rule);

      if (seasonHigh && value > seasonHigh.value) {
        recordMoments.set(rule, {
          detail: `${ruleName(rule)} ${formatXp(value)} XP`,
          index,
          kind: "record",
          rule,
          title: "自己ベスト更新",
          value,
        });
        seasonHighs.set(rule, { index, value });
      } else if (!seasonHigh) {
        seasonHighs.set(rule, { index, value });
      }

      if (previous !== null && previous < 2000 && value >= 2000) {
        milestoneMoments.set(rule, {
          detail: `${ruleName(rule)} ${formatXp(value)} XP`,
          index,
          kind: "milestone",
          rule,
          title: "2,000 XP突破",
          value,
        });
      }

      if (delta !== null && delta >= 20 && (!biggestGain || delta > biggestGain.value)) {
        biggestGain = {
          detail: `${ruleName(rule)} ${formatDelta(delta)} XP`,
          index,
          kind: "surge",
          rule,
          title: "XP急上昇",
          value: delta,
        };
      }
      if (delta !== null && delta <= -20 && (!biggestDrop || delta < biggestDrop.value)) {
        biggestDrop = {
          detail: `${ruleName(rule)} ${formatDelta(delta)} XP`,
          index,
          kind: "drop",
          rule,
          title: "XP急降下",
          value: delta,
        };
      }
    });
  }

  const moments = [
    ...rangeMoments,
    ...milestoneMoments.values(),
    ...recordMoments.values(),
    ...(biggestGain ? [biggestGain] : []),
    ...(biggestDrop ? [biggestDrop] : []),
  ];
  const unique = new Map<string, XpMoment>();
  moments.forEach((moment) => unique.set(`${moment.kind}-${moment.index}-${moment.rule}`, moment));
  return [...unique.values()].sort((left, right) => left.index - right.index || xpMomentPriority(right.kind) - xpMomentPriority(left.kind));
}

function animationPositionAtFrame(index: number, frameCount: number): AnimationPosition {
  if (frameCount < 2) return { from: 0, progress: 0, to: 0 };
  if (index >= frameCount - 1) return { from: frameCount - 2, progress: 1, to: frameCount - 1 };
  return { from: Math.max(index, 0), progress: 0, to: index + 1 };
}

function activeXpMoment(moments: XpMoment[], position: AnimationPosition, frameCount: number) {
  const cursor = position.from + position.progress;
  const holdFrames = Math.max(4, Math.round(frameCount / 20));
  const reached = moments.filter((moment) => moment.index <= cursor && cursor - moment.index <= holdFrames);
  const latestIndex = Math.max(...reached.map((moment) => moment.index), -1);
  return reached.filter((moment) => moment.index === latestIndex).sort((left, right) => xpMomentPriority(right.kind) - xpMomentPriority(left.kind))[0] || null;
}

function xpMomentPriority(kind: XpMomentKind) {
  return { range: 5, milestone: 4, record: 3, surge: 2, drop: 1 }[kind];
}

function xpMomentLabel(kind: XpMomentKind) {
  return {
    drop: "DANGER",
    milestone: "MILESTONE",
    range: "LIMIT BREAK",
    record: "NEW RECORD",
    surge: "SURGE",
  }[kind];
}

function XpMomentIcon({ kind }: { kind: XpMomentKind }) {
  const Icon = {
    drop: TrendingDown,
    milestone: Trophy,
    range: Maximize2,
    record: Trophy,
    surge: Zap,
  }[kind];
  return <Icon aria-hidden="true" size={16} />;
}

function currentSeasonXpDelta(report: SeasonReport, frames: SeasonXpFrame[], rule: RuleId, currentXp: number | null) {
  const startXp = report.rules.find((row) => row.rule === rule)?.startXp ?? frames.find((frame) => frame.xps[rule] !== null)?.xps[rule] ?? null;
  return currentXp === null || startXp === null ? null : currentXp - startXp;
}

function RuleTable({ rules }: { rules: MonthlyRuleReport[] }) {
  return (
    <section className="surface">
      <SectionTitle icon={TrendingUp} title="ルール別" />
      <div className="report-table-wrap">
        <table className="report-table">
          <thead>
            <tr>
              <th>ルール</th>
              <th>試合</th>
              <th>勝率</th>
              <th>月初XP</th>
              <th>月末XP</th>
              <th>増減</th>
              <th>最高</th>
              <th>最低</th>
              <th>連勝</th>
              <th>連敗</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((row) => (
              <tr key={row.rule}>
                <td>{ruleName(row.rule)}</td>
                <td>{row.total}</td>
                <td>{formatRate(row.winRate)}</td>
                <td>{formatXp(row.startXp)}</td>
                <td>{formatXp(row.finalXp)}</td>
                <td className={row.xpDelta && row.xpDelta > 0 ? "positive" : row.xpDelta && row.xpDelta < 0 ? "negative" : ""}>
                  {formatDelta(row.xpDelta)}
                </td>
                <td>{formatXp(row.highestXp)}</td>
                <td>{formatXp(row.lowestXp)}</td>
                <td>{row.maxWinStreak}</td>
                <td>{row.maxLoseStreak}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StageTable({ stages }: { stages: MonthlyStageReport[] }) {
  return (
    <section className="surface">
      <SectionTitle icon={Goal} title="ステージ別" />
      <div className="report-table-wrap">
        <table className="report-table">
          <thead>
            <tr>
              <th>ステージ</th>
              <th>試合</th>
              <th>勝敗</th>
              <th>勝率</th>
              <th>連勝</th>
              <th>連敗</th>
              <th>主なルール</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((row) => (
              <tr key={row.stage}>
                <td>{row.stage}</td>
                <td>{row.total}</td>
                <td>
                  {row.wins}-{row.losses}
                </td>
                <td>{formatRate(row.winRate)}</td>
                <td>{row.maxWinStreak}</td>
                <td>{row.maxLoseStreak}</td>
                <td>{row.mainRules.map(ruleName).join(" / ") || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
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

function latestClosedMonth() {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    timeZone: "Asia/Tokyo",
    year: "numeric",
  })
    .formatToParts(new Date())
    .reduce((result, part) => {
      if (part.type === "year") result.year = part.value;
      if (part.type === "month") result.month = part.value;
      return result;
    }, {} as { month?: string; year?: string });
  const previousMonth = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 2, 1));
  return `${previousMonth.getUTCFullYear()}-${String(previousMonth.getUTCMonth() + 1).padStart(2, "0")}`;
}

function latestClosedSeason() {
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date());
  return seasons
    .filter((season) => season.endDate && season.endDate < today)
    .sort((left, right) => right.startDate.localeCompare(left.startDate))[0]?.id || defaultSeasonId;
}

function formatMonth(month: string) {
  const [year, value] = month.split("-");
  return `${year}年${Number(value)}月`;
}

function formatDate(value: string) {
  const [, month, day] = value.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function formatDateTime(value: string | undefined) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "numeric",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}

function formatShortDate(value: string | undefined) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    day: "numeric",
    month: "numeric",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}

function formatSeasonPeriod(report: SeasonReport) {
  const start = formatShortDate(report.range.start);
  if (!report.range.closed) return `${start} 〜 現在`;
  const end = formatShortDate(new Date(new Date(report.range.end).getTime() - 1).toISOString());
  return `${start} 〜 ${end}`;
}

function formatRate(value: number | null) {
  return value === null ? "-" : `${value}%`;
}

function formatXp(value: number | null) {
  return value === null ? "-" : value.toFixed(1);
}

function formatDelta(value: number | null) {
  if (value === null) return "-";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
}

function formatDeltaWithArrow(value: number | null, label = "前月差") {
  if (value === null) return `${label} -`;
  if (value > 0) return `▲ ${value.toFixed(1)}`;
  if (value < 0) return `▼ ${Math.abs(value).toFixed(1)}`;
  return "±0.0";
}

function deltaClass(value: number | null) {
  if (value === null || value === 0) return "";
  return value > 0 ? "positive" : "negative";
}

function ruleName(id: string) {
  return rules.find((rule) => rule.id === id)?.name || id;
}

function orderedRuleRows(report: Pick<MonthlyReport, "rules">) {
  return rules.map((rule) => {
    const row = report.rules.find((item) => item.rule === rule.id);
    return {
      finalXp: row?.finalXp ?? null,
      rule: rule.id,
      xpDelta: row?.xpDelta ?? null,
    };
  });
}

function buildShareText(report: MonthlyReport) {
  const lines = [
    `${formatMonth(report.month)} Xマッチレポート`,
    "",
    `${report.summary.total}戦 ${report.summary.wins}勝${report.summary.losses}敗 勝率${report.summary.winRate ?? 0}%`,
    `最大連勝: ${report.summary.maxWinStreak}`,
  ];
  if (report.highlights.highestXp) {
    lines.push(`最高XP: ${ruleName(report.highlights.highestXp.rule)} ${formatXp(report.highlights.highestXp.xp)}`);
  }
  if (report.highlights.mostImprovedRule) {
    lines.push(`一番伸びたルール: ${ruleName(report.highlights.mostImprovedRule.rule)} ${formatDelta(report.highlights.mostImprovedRule.xpDelta)}`);
  }
  if (report.highlights.bestStage) {
    lines.push(`得意ステージ: ${report.highlights.bestStage.stage} ${report.highlights.bestStage.winRate ?? 0}%`);
  }
  lines.push("", "#スプラトゥーン3 #Xマッチ");
  return lines.join("\n");
}

function buildSeasonShareText(report: SeasonReport) {
  const lines = [
    `${seasonName(report.season)} Xマッチレポート`,
    "",
    `${report.summary.total}戦 ${report.summary.wins}勝${report.summary.losses}敗 勝率${report.summary.winRate ?? 0}%`,
    `最大連勝: ${report.summary.maxWinStreak}`,
  ];
  if (report.highlights.highestXp) {
    lines.push(`最高XP: ${ruleName(report.highlights.highestXp.rule)} ${formatXp(report.highlights.highestXp.xp)}`);
  }
  if (report.highlights.mostImprovedRule) {
    lines.push(`シーズンで一番伸びたルール: ${ruleName(report.highlights.mostImprovedRule.rule)} ${formatDelta(report.highlights.mostImprovedRule.xpDelta)}`);
  }
  if (report.highlights.bestStage) {
    lines.push(`得意ステージ: ${report.highlights.bestStage.stage} ${report.highlights.bestStage.winRate ?? 0}%`);
  }
  lines.push("", "#スプラトゥーン3 #Xマッチ");
  return lines.join("\n");
}

async function downloadXpVideo(report: SeasonReport): Promise<"mp4" | "webm"> {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  if (typeof MediaRecorder === "undefined" || typeof canvas.captureStream !== "function") {
    throw new Error("Video recording is not supported");
  }

  const mimeType = ["video/mp4", "video/webm;codecs=vp9", "video/webm"]
    .find((candidate) => MediaRecorder.isTypeSupported(candidate)) || "video/webm";
  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: Blob[] = [];
  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size) chunks.push(event.data);
  });
  const stopped = new Promise<void>((resolve, reject) => {
    recorder.addEventListener("stop", () => resolve(), { once: true });
    recorder.addEventListener("error", () => reject(new Error("Video recording failed")), { once: true });
  });
  const frames = report.xpTrend;
  const moments = buildXpMoments(frames);
  const duration = 12_000;
  const introEnd = 0.1;
  const outroStart = 0.9;
  const startedAt = performance.now();
  recorder.start();

  await new Promise<void>((resolve) => {
    const render = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const chartProgress = progress <= introEnd
        ? 0
        : progress >= outroStart
          ? 1
          : (progress - introEnd) / (outroStart - introEnd);
      const segment = chartProgress * Math.max(frames.length - 1, 0);
      const from = Math.min(Math.floor(segment), Math.max(frames.length - 1, 0));
      const to = Math.min(from + 1, Math.max(frames.length - 1, 0));
      drawXpVideoFrame(canvas.getContext("2d")!, report, {
        from,
        progress: segment - from,
        to,
      }, moments, progress, now);
      if (progress >= 1) resolve();
      else requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  });

  recorder.stop();
  await stopped;
  stream.getTracks().forEach((track) => track.stop());
  const extension = mimeType.includes("mp4") ? "mp4" : "webm";
  const blob = new Blob(chunks, { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `spla-season-${report.season}-xp.${extension}`;
  link.click();
  URL.revokeObjectURL(url);
  return extension;
}

function drawXpVideoFrame(
  context: CanvasRenderingContext2D,
  report: SeasonReport,
  position: AnimationPosition,
  moments: XpMoment[] = [],
  videoProgress = 1,
  now = performance.now(),
) {
  const width = context.canvas.width;
  const height = context.canvas.height;
  const left = 112;
  const top = 164;
  const chartWidth = 1080;
  const chartHeight = 400;
  const frames = report.xpTrend;
  const bounds = xpBounds(frames, position);
  const ruleIds = rules.map((rule) => rule.id);
  const current = interpolateXpFrame(frames, position, ruleIds);

  context.fillStyle = "#101815";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#b7e229";
  drawText(context, "Xマッチ シーズンレポート", 76, 70, 28, 650);
  context.fillStyle = "#ffffff";
  drawText(context, seasonName(report.season), 76, 120, 52, 850);
  context.fillStyle = "#b7e229";
  roundedRect(context, 1040, 54, 164, 58, 29);
  context.fill();
  context.fillStyle = "#101815";
  drawText(context, "XP推移", 1122, 83, 24, 132, "center");

  context.fillStyle = "#17231e";
  roundedRect(context, left - 38, top - 26, chartWidth + 76, chartHeight + 70, 18);
  context.fill();
  bounds.ticks.forEach((xp) => {
    const y = canvasXpY(xp, bounds, top, chartHeight);
    context.strokeStyle = "rgba(255,255,255,0.16)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(left, y);
    context.lineTo(left + chartWidth, y);
    context.stroke();
    context.fillStyle = "rgba(255,255,255,0.7)";
    drawText(context, `${xp}`, left - 20, y, 20, 70, "right");
  });

  ruleIds.forEach((rule, ruleIndex) => {
    const points = canvasXpPoints(rule, frames, position, bounds, left, top, chartWidth, chartHeight);
    context.strokeStyle = xpColors[ruleIndex];
    context.lineWidth = 7;
    context.lineJoin = "round";
    context.lineCap = "round";
    points.forEach((segment) => {
      context.beginPath();
      segment.forEach(([x, y], index) => {
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.stroke();
    });
    const xp = current.xps[rule];
    if (xp !== null) {
      const markerX = canvasXpX(position.from + position.progress, frames.length, left, chartWidth);
      const markerY = canvasXpY(xp, bounds, top, chartHeight);
      const pulse = 11 + (Math.sin(now / 130) + 1) * 2;
      context.save();
      context.globalAlpha = 0.2;
      context.fillStyle = xpColors[ruleIndex];
      context.shadowColor = xpColors[ruleIndex];
      context.shadowBlur = 26;
      context.beginPath();
      context.arc(markerX, markerY, pulse, 0, Math.PI * 2);
      context.fill();
      context.restore();

      context.save();
      context.fillStyle = xpColors[ruleIndex];
      context.shadowColor = xpColors[ruleIndex];
      context.shadowBlur = 14;
      context.beginPath();
      context.arc(markerX, markerY, 10, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }
  });

  context.fillStyle = "#ffffff";
  drawText(context, formatDateTime(frames[Math.min(Math.round(position.from + position.progress), Math.max(frames.length - 1, 0))]?.recordedAt), 76, 646, 24, 400);
  context.fillStyle = "rgba(255,255,255,0.64)";
  drawText(context, "全ルールXPの推移", 1204, 646, 20, 440, "right");

  const currentMoment = activeXpMoment(moments, position, frames.length);
  if (currentMoment) drawXpVideoMoment(context, currentMoment);

  if (videoProgress < 0.1) {
    const alpha = 0.94 * (1 - videoProgress / 0.1);
    context.save();
    context.globalAlpha = alpha;
    context.fillStyle = "#101815";
    context.fillRect(0, 0, width, height);
    context.fillStyle = "#b7e229";
    drawText(context, "SEASON XP DIGEST", 76, 270, 26, 900);
    context.fillStyle = "#ffffff";
    drawText(context, seasonName(report.season), 76, 348, 58, 1080);
    context.fillStyle = "rgba(255,255,255,0.72)";
    drawText(context, "シーズンのXP、その瞬間を追体験", 76, 410, 25, 800);
    context.restore();
  }

  if (videoProgress > 0.9) {
    const alpha = Math.min((videoProgress - 0.9) / 0.1, 1) * 0.92;
    context.save();
    context.globalAlpha = alpha;
    context.fillStyle = "#101815";
    context.fillRect(0, 0, width, height);
    context.fillStyle = "#b7e229";
    drawText(context, "SEASON COMPLETE", 76, 270, 26, 900);
    context.fillStyle = "#ffffff";
    drawText(context, "シーズン最終XP", 76, 342, 38, 650);
    const highest = report.highlights.highestXp;
    drawText(context, highest ? `${ruleName(highest.rule)}  ${formatXp(highest.xp)} XP` : "記録なし", 76, 405, 50, 1080);
    context.fillStyle = "rgba(255,255,255,0.72)";
    drawText(context, `${report.summary.total}戦  勝率${report.summary.winRate ?? 0}%`, 76, 470, 27, 800);
    context.restore();
  }
}

function drawXpVideoMoment(context: CanvasRenderingContext2D, moment: XpMoment) {
  const color = moment.kind === "drop" ? "#f04b91" : moment.kind === "surge" ? "#138e9d" : "#b7e229";
  context.save();
  context.fillStyle = "rgba(16,24,21,0.94)";
  roundedRect(context, 78, 184, 430, 112, 18);
  context.fill();
  context.fillStyle = color;
  roundedRect(context, 78, 184, 8, 112, 4);
  context.fill();
  context.fillStyle = color;
  drawText(context, xpMomentLabel(moment.kind), 112, 211, 17, 330);
  context.fillStyle = "#ffffff";
  drawText(context, moment.title, 112, 246, 28, 350);
  context.fillStyle = "rgba(255,255,255,0.74)";
  drawText(context, moment.detail, 112, 276, 17, 350);
  context.restore();
}

function canvasXpPoints(
  rule: RuleId,
  frames: SeasonXpFrame[],
  position: AnimationPosition,
  bounds: ReturnType<typeof xpBounds>,
  left: number,
  top: number,
  width: number,
  height: number,
) {
  const indexes = frames.slice(0, Math.min(position.from + 1, frames.length)).map((_frame, index) => index as number);
  const values = frames.slice(0, Math.min(position.from + 1, frames.length)).map((frame) => frame.xps[rule]);
  if (position.to > position.from) {
    indexes.push(position.from + position.progress);
    values.push(interpolateXp(frames[position.from]?.xps[rule] ?? null, frames[position.to]?.xps[rule] ?? null, position.progress));
  }
  const segments: Array<Array<[number, number]>> = [];
  let current: Array<[number, number]> = [];
  values.forEach((xp, index) => {
    if (xp === null) {
      if (current.length > 1) segments.push(current);
      current = [];
      return;
    }
    current.push([canvasXpX(indexes[index], frames.length, left, width), canvasXpY(xp, bounds, top, height)]);
  });
  if (current.length > 1) segments.push(current);
  return segments;
}

function canvasXpY(xp: number, bounds: ReturnType<typeof xpBounds>, top: number, height: number) {
  return top + ((bounds.max - xp) / Math.max(bounds.max - bounds.min, 1)) * height;
}

function canvasXpX(index: number, frameCount: number, left: number, width: number) {
  return left + (frameCount > 1 ? (Math.min(Math.max(index, 0), frameCount - 1) / (frameCount - 1)) * width : width / 2);
}

async function downloadThumbnail(report: MonthlyReport | SeasonReport) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 675;
  const context = canvas.getContext("2d");
  if (!context) return;

  const isMonthly = "month" in report;
  drawThumbnail(context, report, isMonthly ? formatMonth(report.month) : seasonName(report.season), isMonthly ? "月間" : "シーズン");
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = isMonthly ? `spla-report-${report.month}.png` : `spla-season-${report.season}.png`;
  link.click();
  URL.revokeObjectURL(url);
}

function drawThumbnail(
  context: CanvasRenderingContext2D,
  report: Pick<MonthlyReport, "rules" | "summary">,
  title: string,
  badge: string,
) {
  const width = context.canvas.width;
  const height = context.canvas.height;
  const thumbnailRules = orderedRuleRows(report);

  context.fillStyle = "#f4f7f1";
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#b7e229";
  roundedRect(context, 896, 54, 224, 64, 32);
  context.fill();
  context.fillStyle = "#101815";
  drawText(context, badge, 1008, 88, 28, 170, "center");

  context.fillStyle = "#66736c";
  drawText(context, "Xマッチレポート", 84, 86, 28, 520);
  context.fillStyle = "#101815";
  drawText(context, title, 84, 144, 56, 760);

  thumbnailRules.forEach((row, index) => {
    const x = 84 + (index % 2) * 520;
    const y = 230 + Math.floor(index / 2) * 150;
    context.fillStyle = "#ffffff";
    roundedRect(context, x, y, 470, 118, 22);
    context.fill();
    context.strokeStyle = "rgba(16,24,21,0.14)";
    context.lineWidth = 3;
    context.stroke();

    context.fillStyle = "#101815";
    drawText(context, ruleName(row.rule), x + 28, y + 38, 27, 210);
    drawText(context, formatXp(row.finalXp), x + 318, y + 68, 48, 190, "right");

    const isPositive = row.xpDelta !== null && row.xpDelta > 0;
    const isNegative = row.xpDelta !== null && row.xpDelta < 0;
    context.fillStyle = isPositive ? "#087f5b" : isNegative ? "#c92a2a" : "#66736c";
    drawText(context, formatDeltaWithArrow(row.xpDelta), x + 344, y + 70, 25, 110);
  });

  const metrics = [
    ["試合数", `${report.summary.total}戦`],
    ["勝率", `${report.summary.winRate ?? 0}%`],
    ["最大連勝", `${report.summary.maxWinStreak}`],
    ["最大連敗", `${report.summary.maxLoseStreak}`],
  ];
  metrics.forEach(([label, value], index) => {
    const x = 84 + index * 258;
    context.fillStyle = "#101815";
    roundedRect(context, x, 548, 222, 82, 18);
    context.fill();
    context.fillStyle = "#ffffff";
    drawText(context, label, x + 111, 572, 20, 180, "center");
    context.fillStyle = "#b7e229";
    drawText(context, value, x + 111, 606, 30, 182, "center");
  });
}

function drawText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  maxWidth: number,
  align: CanvasTextAlign = "left",
) {
  context.font = `800 ${size}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  context.textAlign = align;
  context.textBaseline = "middle";
  let value = text;
  while (context.measureText(value).width > maxWidth && value.length > 1) {
    value = `${value.slice(0, -2)}…`;
  }
  context.fillText(value, x, y);
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}
