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
  completedMatchId: string | null;
  recordType: "completed" | "manual";
  recordedAt: string;
}

export interface XpCompletion {
  completedAt: string;
  completedMatchId: string;
  estimatedXp: number | null;
  losses: number;
  wins: number;
}

export interface XpState {
  current: {
    losses: number;
    wins: number;
  };
  latestXp: XpRecord | null;
  pending: XpCompletion[];
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

export interface MonthlyReport {
  highlights: {
    bestStage: { stage: string; total: number; winRate: number | null } | null;
    highestXp: { rule: RuleId; xp: number | null } | null;
    maxLoseStreak: number;
    maxWinStreak: number;
    mostImprovedRule: { rule: RuleId; xpDelta: number | null } | null;
    mostPlayedDay: { date: string; total: number } | null;
    toughStage: { stage: string; total: number; winRate: number | null } | null;
  };
  month: string;
  range: {
    end: string;
    start: string;
  };
  rules: MonthlyRuleReport[];
  stages: MonthlyStageReport[];
  summary: MatchSummary & {
    activeDays: number;
    averageMatchesPerActiveDay: number;
    maxLoseStreak: number;
    maxWinStreak: number;
    mostPlayedDay: { date: string; total: number } | null;
  };
}

export interface MonthlyRuleReport extends MatchSummary {
  finalXp: number | null;
  highestXp: number | null;
  lowestXp: number | null;
  maxLoseStreak: number;
  maxWinStreak: number;
  rule: RuleId;
  startXp: number | null;
  xpDelta: number | null;
}

export interface MonthlyStageReport extends MatchSummary {
  mainRules: RuleId[];
  maxLoseStreak: number;
  maxWinStreak: number;
  stage: string;
}
