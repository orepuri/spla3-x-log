import type { AppSettings, CurrentAnalysis, Match, MatchResult, PageResult, XpRecord } from "./types";

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

export async function createMatch(input: {
  season: string;
  rule: string;
  stage: string;
  weapon: string;
  result: MatchResult;
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

export async function createXpRecord(input: {
  season: string;
  rule: string;
  xp: number;
}): Promise<XpRecord> {
  return request<XpRecord>("/api/xp-records", {
    body: JSON.stringify(input),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
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
