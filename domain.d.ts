export type RuleId = "area" | "tower" | "rainmaker" | "clam";
export type MatchResult = "win" | "lose";
export type MatchFilterValue = string | "all";

export interface AppSettings {
  season: string;
  rule: RuleId;
  weapon: string;
  stageA: string;
  stageB: string;
}

export interface Match {
  id: string;
  season: string;
  rule: RuleId;
  stage: string;
  weapon: string;
  result: MatchResult;
  recordedAt: string;
}

export interface XpRecord {
  id: string;
  season: string;
  rule: RuleId;
  xp: number;
  recordedAt: string;
}

export interface AppState {
  settings: AppSettings;
  matches: Match[];
  xpRecords: XpRecord[];
}

export interface MatchFilters {
  season: MatchFilterValue;
  rule: MatchFilterValue;
  weapon: MatchFilterValue;
  stage: MatchFilterValue;
  time: "all" | "0-6" | "6-12" | "12-18" | "18-24";
}

export interface MatchSummary {
  wins: number;
  losses: number;
  total: number;
  winRate: number | null;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export function filterMatches(matches: Match[], filters: MatchFilters): Match[];
export function summarizeMatches(matches: Match[]): MatchSummary;
export function breakdownRows(matches: Match[], getKey: (match: Match) => string): Array<{ name: string; count: number; rate: number }>;
export function latestXpRecord(records: XpRecord[], season: string, rule: RuleId): XpRecord | null;
export function inDateRange(iso: string, range: DateRange): boolean;
export function xpDateRange(options: {
  records: XpRecord[];
  season: MatchFilterValue;
  rule: MatchFilterValue;
  period: string;
  customStart?: string;
  customEnd?: string;
  now: Date | string | number;
}): DateRange;
