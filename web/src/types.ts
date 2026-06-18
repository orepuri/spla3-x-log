export type RuleId = "area" | "tower" | "rainmaker" | "clam";
export type MatchResult = "win" | "lose";

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

export interface MatchSummary {
  wins: number;
  losses: number;
  total: number;
  winRate: number | null;
}

export interface CurrentAnalysis {
  latestXp: XpRecord | null;
  weapon: MatchSummary;
  stages: Array<MatchSummary & { stage: string }>;
}

export interface PageResult<T> {
  items: T[];
  nextCursor: string | null;
}

export interface AnalysisFilters {
  season: string;
  rule: string;
  weapon: string;
  stage: string;
  time: string;
}

export interface BreakdownItem extends MatchSummary {
  name: string;
}

export interface SummaryAnalysis extends MatchSummary {
  breakdown: {
    season: BreakdownItem[];
    rule: BreakdownItem[];
    stage: BreakdownItem[];
    weapon: BreakdownItem[];
    time: BreakdownItem[];
  };
}

export interface AnalysisPreferences {
  xpPeriod: string;
  xpStart: string;
  xpEnd: string;
  historyPageSize: number;
}

export interface AppArchive {
  settings: AppSettings | null;
  matches: Match[];
  xpRecords: XpRecord[];
}

export interface AnalysisOptions {
  seasons: string[];
  rules: string[];
  weapons: string[];
  stages: string[];
}
