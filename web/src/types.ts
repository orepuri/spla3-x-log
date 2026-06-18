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
