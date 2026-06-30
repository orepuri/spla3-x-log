import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clipboard, Download, Flame, Goal, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getMonthlyReport } from "./api";
import { rules } from "./catalog";
import type { MonthlyReport, MonthlyRuleReport, MonthlyStageReport } from "./types";

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

function formatDeltaWithArrow(value: number | null) {
  if (value === null) return "前月差 -";
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

function orderedRuleRows(report: MonthlyReport) {
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

async function downloadThumbnail(report: MonthlyReport) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 675;
  const context = canvas.getContext("2d");
  if (!context) return;

  drawThumbnail(context, report);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `spla-report-${report.month}.png`;
  link.click();
  URL.revokeObjectURL(url);
}

function drawThumbnail(context: CanvasRenderingContext2D, report: MonthlyReport) {
  const width = context.canvas.width;
  const height = context.canvas.height;
  const thumbnailRules = orderedRuleRows(report);

  context.fillStyle = "#f4f7f1";
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#b7e229";
  roundedRect(context, 896, 54, 224, 64, 32);
  context.fill();
  context.fillStyle = "#101815";
  drawText(context, "月間", 1008, 88, 28, 170, "center");

  context.fillStyle = "#66736c";
  drawText(context, "Xマッチレポート", 84, 86, 28, 520);
  context.fillStyle = "#101815";
  drawText(context, `${formatMonth(report.month)}`, 84, 144, 56, 560);

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
