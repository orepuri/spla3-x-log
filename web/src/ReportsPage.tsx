import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Flame, Goal, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getMonthlyReport } from "./api";
import { rules } from "./catalog";
import type { MonthlyReport, MonthlyRuleReport, MonthlyStageReport } from "./types";

export function MonthlyReportPage() {
  const [month, setMonth] = useState(() => currentMonth());
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
          <input aria-label="対象月" onChange={(event) => setMonth(event.target.value)} type="month" value={month} />
        </label>
      </header>

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
          <RuleTable rules={report.rules} />
          <StageTable stages={report.stages} />
        </div>
      ) : null}
    </div>
  );
}

function Highlights({ report }: { report: MonthlyReport }) {
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

function currentMonth() {
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
  return `${parts.year}-${parts.month}`;
}

function formatMonth(month: string) {
  const [year, value] = month.split("-");
  return `${year}年${Number(value)}月`;
}

function formatDate(value: string) {
  const [, month, day] = value.split("-");
  return `${Number(month)}/${Number(day)}`;
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

function ruleName(id: string) {
  return rules.find((rule) => rule.id === id)?.name || id;
}
