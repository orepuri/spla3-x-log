import type {
  AnalysisFilters,
  AnalysisOptions,
  AnalysisPreferences,
  AppArchive,
  AppSettings,
  CurrentAnalysis,
  Match,
  MatchResult,
  PageResult,
  SummaryAnalysis,
  XpRecord,
  XpState,
} from "./types";

export async function getSettings(): Promise<AppSettings | null> {
  return request<AppSettings | null>("/api/settings");
}

export async function updateSettings(settings: AppSettings): Promise<AppSettings> {
  return request<AppSettings>("/api/settings", {
    body: JSON.stringify(settings),
    headers: { "content-type": "application/json" },
    method: "PUT",
  });
}

export async function patchSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  return request<AppSettings>("/api/settings", {
    body: JSON.stringify(patch),
    headers: { "content-type": "application/json" },
    method: "PATCH",
  });
}

export async function getArchive(): Promise<AppArchive> {
  return request<AppArchive>("/api/archive");
}

export async function importArchive(archive: AppArchive): Promise<AppArchive> {
  return request<AppArchive>("/api/archive", {
    body: JSON.stringify(archive),
    headers: { "content-type": "application/json" },
    method: "PUT",
  });
}

export async function getPreferences(): Promise<Partial<AnalysisPreferences>> {
  return request<Partial<AnalysisPreferences>>("/api/preferences");
}

export async function updatePreferences(preferences: AnalysisPreferences): Promise<AnalysisPreferences> {
  return request<AnalysisPreferences>("/api/preferences", {
    body: JSON.stringify(preferences),
    headers: { "content-type": "application/json" },
    method: "PUT",
  });
}

export async function getCurrentAnalysis(settings: AppSettings): Promise<CurrentAnalysis> {
  const params = new URLSearchParams({
    season: settings.season,
    rule: settings.rule,
    weapon: settings.weapon,
  });
  params.append("stage", settings.stageA);
  params.append("stage", settings.stageB);
  return request<CurrentAnalysis>(`/api/analysis/current?${params}`);
}

export async function getLatestMatches(limit = 1): Promise<PageResult<Match>> {
  return request<PageResult<Match>>(`/api/matches?limit=${limit}`);
}

export async function getMatches(options: {
  filters: AnalysisFilters;
  cursor?: string;
  limit: number;
}): Promise<PageResult<Match>> {
  const params = filterParams(options.filters);
  params.set("limit", String(options.limit));
  if (options.cursor) params.set("cursor", options.cursor);
  return request<PageResult<Match>>(`/api/matches?${params}`);
}

export async function createMatch(input: {
  season: string;
  rule: string;
  stage: string;
  weapon: string;
  result: MatchResult;
  recordedAt?: string;
}): Promise<Match> {
  return request<Match>("/api/matches", {
    body: JSON.stringify(input),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

export async function deleteMatch(id: string): Promise<void> {
  await request<void>(`/api/matches/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function updateMatch(id: string, input: Partial<Match>): Promise<Match> {
  return request<Match>(`/api/matches/${encodeURIComponent(id)}`, {
    body: JSON.stringify(input),
    headers: { "content-type": "application/json" },
    method: "PATCH",
  });
}

export async function createXpRecord(input: {
  season: string;
  rule: string;
  xp: number;
  completedMatchId?: string | null;
  recordType?: "completed" | "manual";
  recordedAt?: string;
}): Promise<XpRecord> {
  return request<XpRecord>("/api/xp-records", {
    body: JSON.stringify(input),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

export async function getXpState(season: string, rule: string): Promise<XpState> {
  const params = new URLSearchParams({ rule, season });
  return request<XpState>(`/api/xp-state?${params}`);
}

export async function getXpRecords(options: {
  season: string;
  rule: string;
  start?: string;
  end?: string;
  limit?: number;
  cursor?: string;
}): Promise<PageResult<XpRecord>> {
  const params = new URLSearchParams();
  if (options.season !== "all") params.set("season", options.season);
  if (options.rule !== "all") params.set("rule", options.rule);
  if (options.start) params.set("start", options.start);
  if (options.end) params.set("end", options.end);
  if (options.cursor) params.set("cursor", options.cursor);
  params.set("limit", String(options.limit || 100));
  return request<PageResult<XpRecord>>(`/api/xp-records?${params}`);
}

export async function getSummaryAnalysis(filters: AnalysisFilters): Promise<SummaryAnalysis> {
  return request<SummaryAnalysis>(`/api/analysis/summary?${filterParams(filters)}`);
}

export async function getAnalysisOptions(): Promise<AnalysisOptions> {
  return request<AnalysisOptions>("/api/analysis/options");
}

function filterParams(filters: AnalysisFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "all") params.set(key, value);
  });
  return params;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || `Request failed: ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
