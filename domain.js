(function (root, factory) {
  const domain = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = domain;
  } else {
    root.SplaDomain = domain;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function filterMatches(matches, filters) {
    return matches.filter((match) => {
      if (filters.season !== "all" && match.season !== filters.season) return false;
      if (filters.rule !== "all" && match.rule !== filters.rule) return false;
      if (filters.weapon !== "all" && match.weapon !== filters.weapon) return false;
      if (filters.stage !== "all" && match.stage !== filters.stage) return false;
      return inTimeRange(match.recordedAt, filters.time);
    });
  }

  function summarizeMatches(matches) {
    const wins = matches.filter((match) => match.result === "win").length;
    const losses = matches.length - wins;
    return {
      wins,
      losses,
      total: matches.length,
      winRate: matches.length ? Math.round((wins / matches.length) * 100) : null,
    };
  }

  function breakdownRows(matches, getKey) {
    const groups = matches.reduce((result, match) => {
      const key = getKey(match);
      result[key] = result[key] || [];
      result[key].push(match);
      return result;
    }, {});

    return Object.entries(groups)
      .map(([name, groupedMatches]) => {
        const summary = summarizeMatches(groupedMatches);
        return {
          name,
          count: summary.total,
          rate: summary.winRate || 0,
        };
      })
      .sort((a, b) => b.count - a.count || b.rate - a.rate);
  }

  function latestXpRecord(records, season, rule) {
    return records.find((record) => record.season === season && record.rule === rule) || null;
  }

  function xpDateRange(options) {
    const visibleRecords = options.records.filter((record) => {
      if (options.season !== "all" && record.season !== options.season) return false;
      return options.rule === "all" || record.rule === options.rule;
    });
    const now = new Date(options.now);

    if (options.period === "all" && visibleRecords.length > 0) {
      const times = visibleRecords.map((record) => new Date(record.recordedAt).getTime());
      return {
        start: startOfDay(new Date(Math.min(...times))),
        end: endOfDay(new Date(Math.max(...times))),
      };
    }

    if (options.period === "custom" && options.customStart && options.customEnd) {
      const start = startOfDay(parseDateInput(options.customStart));
      const end = endOfDay(parseDateInput(options.customEnd));
      return start <= end ? { start, end } : { start: startOfDay(end), end: endOfDay(start) };
    }

    const days = Number(options.period);
    const start = new Date(now);
    start.setDate(start.getDate() - (Number.isFinite(days) ? days : 30));
    return { start, end: now };
  }

  function inTimeRange(iso, range) {
    if (range === "all") return true;
    const hour = new Date(iso).getHours();
    const [start, end] = range.split("-").map(Number);
    return hour >= start && hour < end;
  }

  function inDateRange(iso, range) {
    const time = new Date(iso).getTime();
    return time >= range.start.getTime() && time <= range.end.getTime();
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  }

  function endOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  }

  function parseDateInput(value) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  return {
    breakdownRows,
    filterMatches,
    inDateRange,
    latestXpRecord,
    summarizeMatches,
    xpDateRange,
  };
});
