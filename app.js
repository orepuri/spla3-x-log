(function () {
  const rules = [
    { id: "area", name: "ガチエリア" },
    { id: "tower", name: "ガチヤグラ" },
    { id: "rainmaker", name: "ガチホコ" },
    { id: "clam", name: "ガチアサリ" },
  ];

  const defaultStages = [
    "ユノハナ大渓谷",
    "ゴンズイ地区",
    "ヤガラ市場",
    "マテガイ放水路",
    "ナメロウ金属",
    "マサバ海峡大橋",
    "キンメダイ美術館",
    "マヒマヒリゾート＆スパ",
    "海女美術大学",
    "チョウザメ造船",
    "ザトウマーケット",
    "スメーシーワールド",
    "クサヤ温泉",
    "ヒラメが丘団地",
    "ナンプラー遺跡",
    "マンタマリア号",
    "タラポートショッピングパーク",
    "コンブトラック",
    "タカアシ経済特区",
    "オヒョウ海運",
    "バイガイ亭",
    "ネギトロ炭鉱",
    "カジキ空港",
    "リュウグウターミナル",
  ];

  const defaultWeapons = [
    "スプラシューター",
    "スプラシューターコラボ",
    "52ガロン",
    "N-ZAP85",
    "わかばシューター",
    "シャープマーカー",
    "ボールドマーカー",
    "プライムシューター",
    "ジェットスイーパー",
    "L3リールガン",
    "H3リールガン",
    "スプラローラー",
    "カーボンローラー",
    "ダイナモローラー",
    "ヴァリアブルローラー",
    "スプラチャージャー",
    "リッター4K",
    "スクイックリンα",
    "14式竹筒銃・甲",
    "バケットスロッシャー",
    "ヒッセン",
    "スクリュースロッシャー",
    "エクスプロッシャー",
    "バレルスピナー",
    "スプラスピナー",
    "ハイドラント",
    "クーゲルシュライバー",
    "スプラマニューバー",
    "デュアルスイーパー",
    "クアッドホッパーブラック",
    "パラシェルター",
    "キャンピングシェルター",
    "ホットブラスター",
    "ロングブラスター",
    "ノヴァブラスター",
    "クラッシュブラスター",
    "パブロ",
    "ホクサイ",
    "トライストリンガー",
    "LACT-450",
    "ドライブワイパー",
    "ジムワイパー",
    "スパッタリー",
    "モップリン",
    "イグザミナー",
    "フィンセント",
    "S-BLAST92",
  ];

  const initialState = {
    settings: {
      rule: "area",
      weapon: "スプラシューター",
      stageA: "ユノハナ大渓谷",
      stageB: "マサバ海峡大橋",
    },
    matches: [],
    xpRecords: [],
  };

  let state = structuredClone(initialState);
  let quickSavePending = false;
  let matchFeedbackTimer = null;
  let editingMatchId = null;

  const els = {
    ruleSelect: document.getElementById("ruleSelect"),
    weaponInput: document.getElementById("weaponInput"),
    stageAInput: document.getElementById("stageAInput"),
    stageBInput: document.getElementById("stageBInput"),
    weaponList: document.getElementById("weaponList"),
    quickButtons: document.getElementById("quickButtons"),
    undoButton: document.getElementById("undoButton"),
    xpForm: document.getElementById("xpForm"),
    xpToggleButton: document.getElementById("xpToggleButton"),
    xpInput: document.getElementById("xpInput"),
    pastRecordedAtInput: document.getElementById("pastRecordedAtInput"),
    pastMatchForm: document.getElementById("pastMatchForm"),
    pastXpForm: document.getElementById("pastXpForm"),
    pastRuleSelect: document.getElementById("pastRuleSelect"),
    pastWeaponInput: document.getElementById("pastWeaponInput"),
    pastStageInput: document.getElementById("pastStageInput"),
    pastResultSelect: document.getElementById("pastResultSelect"),
    pastXpRuleSelect: document.getElementById("pastXpRuleSelect"),
    pastXpInput: document.getElementById("pastXpInput"),
    latestXp: document.getElementById("latestXp"),
    lastSaved: document.getElementById("lastSaved"),
    matchCount: document.getElementById("matchCount"),
    filterRule: document.getElementById("filterRule"),
    filterWeapon: document.getElementById("filterWeapon"),
    filterStage: document.getElementById("filterStage"),
    filterTime: document.getElementById("filterTime"),
    winRate: document.getElementById("winRate"),
    wins: document.getElementById("wins"),
    losses: document.getElementById("losses"),
    totalMatches: document.getElementById("totalMatches"),
    ruleBreakdown: document.getElementById("ruleBreakdown"),
    stageBreakdown: document.getElementById("stageBreakdown"),
    weaponBreakdown: document.getElementById("weaponBreakdown"),
    timeBreakdown: document.getElementById("timeBreakdown"),
    historyList: document.getElementById("historyList"),
    xpList: document.getElementById("xpList"),
    xpCharts: document.getElementById("xpCharts"),
    xpPeriodSelect: document.getElementById("xpPeriodSelect"),
    xpStartInput: document.getElementById("xpStartInput"),
    xpEndInput: document.getElementById("xpEndInput"),
    exportButton: document.getElementById("exportButton"),
    importInput: document.getElementById("importInput"),
  };

  init();

  async function init() {
    fillRuleSelects();
    fillDatalists();
    bindEvents();
    let loadFailed = false;
    try {
      await loadRemoteState();
    } catch (_error) {
      loadFailed = true;
    }
    syncSettingsControls();
    render();
    if (loadFailed) {
      reportError("バックエンドに接続できません");
    }
  }

  function fillRuleSelects() {
    els.ruleSelect.innerHTML = rules.map(optionHtml).join("");
    els.pastRuleSelect.innerHTML = rules.map(optionHtml).join("");
    els.pastXpRuleSelect.innerHTML = rules.map(optionHtml).join("");
    els.filterRule.innerHTML = '<option value="all">すべて</option>' + rules.map(optionHtml).join("");
  }

  function optionHtml(rule, selectedValue = "") {
    return `<option value="${escapeHtml(rule.id)}"${rule.id === selectedValue ? " selected" : ""}>${escapeHtml(rule.name)}</option>`;
  }

  function stageOptionHtml(selectedValue = "") {
    return uniqueOrdered([...defaultStages, selectedValue].filter(Boolean))
      .map((name) => `<option value="${escapeHtml(name)}"${name === selectedValue ? " selected" : ""}>${escapeHtml(name)}</option>`)
      .join("");
  }

  function fillDatalists() {
    els.weaponList.innerHTML = defaultWeapons.map((name) => `<option value="${escapeHtml(name)}"></option>`).join("");
    fillStageSelects();
  }

  function fillStageSelects() {
    const selectedStages = [state.settings.stageA, state.settings.stageB].filter(Boolean);
    const stages = uniqueOrdered([...defaultStages, ...selectedStages]);
    const options = stages.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("");
    els.stageAInput.innerHTML = options;
    els.stageBInput.innerHTML = options;
    els.pastStageInput.innerHTML = options;
  }

  function bindEvents() {
    els.ruleSelect.addEventListener("change", updateSettings);
    els.weaponInput.addEventListener("change", updateSettings);
    els.stageAInput.addEventListener("change", updateSettings);
    els.stageBInput.addEventListener("change", updateSettings);
    els.undoButton.addEventListener("click", undoLastMatch);
    els.xpToggleButton.addEventListener("click", focusXpInput);
    els.xpForm.addEventListener("submit", saveXp);
    els.pastMatchForm.addEventListener("submit", savePastMatch);
    els.pastXpForm.addEventListener("submit", savePastXp);
    els.filterRule.addEventListener("change", render);
    els.filterWeapon.addEventListener("change", render);
    els.filterStage.addEventListener("change", render);
    els.filterTime.addEventListener("change", render);
    els.xpPeriodSelect.addEventListener("change", renderXp);
    els.xpStartInput.addEventListener("change", renderXp);
    els.xpEndInput.addEventListener("change", renderXp);
    els.exportButton.addEventListener("click", exportData);
    els.importInput.addEventListener("change", importData);

    document.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", () => setView(button.dataset.view));
    });

    document.querySelectorAll("[data-past-view]").forEach((button) => {
      button.addEventListener("click", () => setPastView(button.dataset.pastView));
    });

    document.querySelectorAll("[data-time-delta]").forEach((button) => {
      button.addEventListener("click", () => adjustPastTime(Number(button.dataset.timeDelta)));
    });
  }

  function syncSettingsControls() {
    fillStageSelects();
    els.ruleSelect.value = state.settings.rule;
    els.weaponInput.value = state.settings.weapon;
    els.stageAInput.value = state.settings.stageA;
    els.stageBInput.value = state.settings.stageB;
    els.pastRuleSelect.value = state.settings.rule;
    els.pastXpRuleSelect.value = state.settings.rule;
    els.pastWeaponInput.value = state.settings.weapon;
    els.pastStageInput.value = state.settings.stageA;
    if (!els.pastRecordedAtInput.value) {
      els.pastRecordedAtInput.value = toDateTimeLocalValue(new Date());
    }
  }

  async function updateSettings() {
    const nextState = {
      ...state,
      settings: {
        rule: els.ruleSelect.value,
        weapon: els.weaponInput.value.trim(),
        stageA: els.stageAInput.value.trim(),
        stageB: els.stageBInput.value.trim(),
      },
    };

    try {
      await saveRemoteState(nextState);
      syncSettingsControls();
      render();
    } catch (_error) {
      syncSettingsControls();
      render();
      reportError("設定を保存できません");
    }
  }

  function render() {
    renderQuickButtons();
    renderFilters();
    renderSummary();
    renderHistory();
    renderXp();
    renderStatus();
  }

  function renderQuickButtons() {
    const stages = [state.settings.stageA, state.settings.stageB].filter(Boolean);
    els.quickButtons.innerHTML = stages
      .flatMap((stage) => [
        resultButton(stage, "win", "WIN"),
        resultButton(stage, "lose", "LOSE"),
      ])
      .join("");

    els.quickButtons.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => handleQuickResultClick(button));
    });
  }

  function resultButton(stage, result, label) {
    return `
      <button class="result-button ${result}" type="button" data-stage="${escapeHtml(stage)}" data-result="${result}">
        <span>${escapeHtml(stage)}</span>
        <strong>${label}</strong>
      </button>
    `;
  }

  async function addMatch(stage, result) {
    if (!state.settings.weapon || !stage) return;

    const match = {
      id: createId(),
      rule: state.settings.rule,
      stage,
      weapon: state.settings.weapon,
      result,
      recordedAt: new Date().toISOString(),
    };

    const nextState = {
      ...state,
      matches: [match, ...state.matches],
    };
    sortRecords(nextState);

    try {
      await saveRemoteState(nextState);
      render();
      showMatchFeedback(match);
    } catch (_error) {
      render();
      reportError("試合結果を保存できません");
    }
  }

  function handleQuickResultClick(button) {
    const stage = button.dataset.stage;
    const result = button.dataset.result;
    if (quickSavePending || !state.settings.weapon || !stage) return;

    quickSavePending = true;
    els.quickButtons.querySelectorAll("button").forEach((quickButton) => {
      quickButton.disabled = true;
    });
    button.classList.add("is-pressed");

    window.setTimeout(() => {
      addMatch(stage, result).finally(() => {
        quickSavePending = false;
      });
    }, 140);
  }

  function showMatchFeedback(match) {
    window.clearTimeout(matchFeedbackTimer);
    els.lastSaved.classList.remove("saved-flash", "status-error", "win", "lose");
    void els.lastSaved.offsetWidth;
    els.lastSaved.textContent = `${match.result === "win" ? "WIN" : "LOSE"} 保存しました`;
    els.lastSaved.classList.add("saved-flash", match.result);

    matchFeedbackTimer = window.setTimeout(() => {
      els.lastSaved.classList.remove("saved-flash", "win", "lose");
      renderStatus();
    }, 1400);
  }

  async function undoLastMatch() {
    if (state.matches.length === 0) return;
    const nextState = {
      ...state,
      matches: state.matches.slice(1),
    };

    try {
      await saveRemoteState(nextState);
      render();
    } catch (_error) {
      render();
      reportError("取り消しを保存できません");
    }
  }

  function focusXpInput() {
    els.xpInput.focus();
    els.xpInput.select();
  }

  async function saveXp(event) {
    event.preventDefault();
    const xp = Number(els.xpInput.value);
    if (!Number.isFinite(xp) || xp < 0) return;

    const record = {
      id: createId(),
      rule: state.settings.rule,
      xp,
      recordedAt: new Date().toISOString(),
    };
    const nextState = {
      ...state,
      xpRecords: [record, ...state.xpRecords],
    };
    sortRecords(nextState);

    try {
      await saveRemoteState(nextState);
      els.xpInput.value = "";
      render();
    } catch (_error) {
      render();
      reportError("XPを保存できません");
    }
  }

  async function savePastMatch(event) {
    event.preventDefault();
    const recordedAt = readPastRecordedAt();
    const weapon = els.pastWeaponInput.value.trim();
    const stage = els.pastStageInput.value.trim();
    if (!recordedAt || !weapon || !stage) return;

    const match = {
      id: createId(),
      rule: els.pastRuleSelect.value,
      stage,
      weapon,
      result: els.pastResultSelect.value,
      recordedAt,
    };
    const nextState = {
      ...state,
      matches: [...state.matches, match],
    };
    sortRecords(nextState);

    try {
      await saveRemoteState(nextState);
      render();
      adjustPastTime(5);
    } catch (_error) {
      render();
      reportError("過去の試合を保存できません");
    }
  }

  async function savePastXp(event) {
    event.preventDefault();
    const recordedAt = readPastRecordedAt();
    const xp = Number(els.pastXpInput.value);
    if (!recordedAt || !Number.isFinite(xp) || xp < 0) return;

    const record = {
      id: createId(),
      rule: els.pastXpRuleSelect.value,
      xp,
      recordedAt,
    };
    const nextState = {
      ...state,
      xpRecords: [...state.xpRecords, record],
    };
    sortRecords(nextState);

    try {
      await saveRemoteState(nextState);
      els.pastXpInput.value = "";
      render();
    } catch (_error) {
      render();
      reportError("過去のXPを保存できません");
    }
  }

  function renderStatus() {
    els.lastSaved.classList.remove("status-error");
    els.matchCount.textContent = `${state.matches.length}戦`;
    const lastMatch = state.matches[0];
    els.lastSaved.textContent = lastMatch ? formatDateTime(lastMatch.recordedAt) : "未記録";
    const latestForRule = state.xpRecords.find((record) => record.rule === state.settings.rule);
    els.latestXp.textContent = latestForRule ? `${latestForRule.xp.toFixed(1)} / ${ruleName(latestForRule.rule)}` : "未記録";
  }

  function renderFilters() {
    const currentWeapon = els.filterWeapon.value || "all";
    const currentStage = els.filterStage.value || "all";
    const weapons = unique([...state.matches.map((m) => m.weapon), state.settings.weapon].filter(Boolean));
    const stages = unique([...state.matches.map((m) => m.stage), state.settings.stageA, state.settings.stageB].filter(Boolean));
    els.filterWeapon.innerHTML = makeSelectOptions(weapons);
    els.filterStage.innerHTML = makeSelectOptions(stages);
    els.filterWeapon.value = hasOption(els.filterWeapon, currentWeapon) ? currentWeapon : "all";
    els.filterStage.value = hasOption(els.filterStage, currentStage) ? currentStage : "all";
  }

  function makeSelectOptions(values) {
    return '<option value="all">すべて</option>' + values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
  }

  function hasOption(select, value) {
    return Array.from(select.options).some((option) => option.value === value);
  }

  function filteredMatches() {
    return state.matches.filter((match) => {
      if (els.filterRule.value !== "all" && match.rule !== els.filterRule.value) return false;
      if (els.filterWeapon.value !== "all" && match.weapon !== els.filterWeapon.value) return false;
      if (els.filterStage.value !== "all" && match.stage !== els.filterStage.value) return false;
      return inTimeRange(match.recordedAt, els.filterTime.value);
    });
  }

  function inTimeRange(iso, range) {
    if (range === "all") return true;
    const hour = new Date(iso).getHours();
    const parts = range.split("-").map(Number);
    return hour >= parts[0] && hour < parts[1];
  }

  function inDateRange(iso, range) {
    const time = new Date(iso).getTime();
    return time >= range.start.getTime() && time <= range.end.getTime();
  }

  function xpDateRange() {
    const selectedRule = els.filterRule.value;
    const visibleRecords = state.xpRecords.filter((record) => selectedRule === "all" || record.rule === selectedRule);
    const now = new Date();
    const period = els.xpPeriodSelect.value;

    toggleXpCustomRange(period === "custom");

    if (period === "all" && visibleRecords.length > 0) {
      const times = visibleRecords.map((record) => new Date(record.recordedAt).getTime());
      return {
        start: startOfDay(new Date(Math.min(...times))),
        end: endOfDay(new Date(Math.max(...times))),
      };
    }

    if (period === "custom" && els.xpStartInput.value && els.xpEndInput.value) {
      const start = startOfDay(parseDateInput(els.xpStartInput.value));
      const end = endOfDay(parseDateInput(els.xpEndInput.value));
      return start <= end ? { start, end } : { start: startOfDay(end), end: endOfDay(start) };
    }

    const days = Number(period);
    const start = new Date(now);
    start.setDate(start.getDate() - (Number.isFinite(days) ? days : 30));
    return {
      start,
      end: now,
    };
  }

  function toggleXpCustomRange(visible) {
    document.querySelectorAll(".xp-custom-range").forEach((label) => {
      label.classList.toggle("active", visible);
    });
  }

  function renderSummary() {
    const matches = filteredMatches();
    const wins = matches.filter((m) => m.result === "win").length;
    const losses = matches.length - wins;
    els.winRate.textContent = matches.length ? `${Math.round((wins / matches.length) * 100)}%` : "-";
    els.wins.textContent = String(wins);
    els.losses.textContent = String(losses);
    els.totalMatches.textContent = String(matches.length);

    renderBreakdown(els.ruleBreakdown, groupBy(matches, (m) => ruleName(m.rule)));
    renderBreakdown(els.stageBreakdown, groupBy(matches, (m) => m.stage));
    renderBreakdown(els.weaponBreakdown, groupBy(matches, (m) => m.weapon));
    renderBreakdown(els.timeBreakdown, groupBy(matches, (m) => timeBand(m.recordedAt)));
  }

  function renderBreakdown(container, groups) {
    const rows = Object.entries(groups)
      .map(([name, matches]) => {
        const wins = matches.filter((m) => m.result === "win").length;
        const rate = matches.length ? Math.round((wins / matches.length) * 100) : 0;
        return { name, count: matches.length, rate };
      })
      .sort((a, b) => b.count - a.count || b.rate - a.rate);

    container.innerHTML = rows.length
      ? rows
          .map(
            (row) => `
              <div class="breakdown-row">
                <div class="breakdown-head">
                  <span class="breakdown-name">${escapeHtml(row.name)}</span>
                  <span class="breakdown-value">${row.rate}% / ${row.count}戦</span>
                </div>
                <div class="bar"><span style="width:${row.rate}%"></span></div>
              </div>
            `,
          )
          .join("")
      : '<div class="empty">データなし</div>';
  }

  function renderHistory() {
    const matches = filteredMatches();
    els.historyList.innerHTML = matches.length
      ? matches
          .map((match) =>
            match.id === editingMatchId
              ? editMatchRow(match)
              : `
              <div class="history-row">
                <div>
                  <div class="history-main">${escapeHtml(match.stage)} / ${escapeHtml(ruleName(match.rule))}</div>
                  <div class="history-meta">${escapeHtml(match.weapon)} · ${formatDateTime(match.recordedAt)}</div>
                </div>
                <div class="history-actions">
                  <div class="history-result ${match.result}">${match.result === "win" ? "WIN" : "LOSE"}</div>
                  <button class="secondary-button compact-button" type="button" data-edit-match="${escapeHtml(match.id)}">編集</button>
                </div>
              </div>
            `,
          )
          .join("")
      : '<div class="empty">データなし</div>';

    els.historyList.querySelectorAll("[data-edit-match]").forEach((button) => {
      button.addEventListener("click", () => {
        editingMatchId = button.dataset.editMatch;
        renderHistory();
      });
    });
    els.historyList.querySelectorAll("[data-cancel-match-edit]").forEach((button) => {
      button.addEventListener("click", () => {
        editingMatchId = null;
        renderHistory();
      });
    });
    els.historyList.querySelectorAll("[data-edit-match-form]").forEach((form) => {
      form.addEventListener("submit", saveMatchEdit);
    });
  }

  function editMatchRow(match) {
    return `
      <form class="history-edit-row" data-edit-match-form="${escapeHtml(match.id)}">
        <div class="history-edit-grid">
          <label>
            ルール
            <select name="rule">${rules.map((rule) => optionHtml(rule, match.rule)).join("")}</select>
          </label>
          <label>
            武器
            <input name="weapon" list="weaponList" autocomplete="off" value="${escapeHtml(match.weapon)}" />
          </label>
          <label>
            ステージ
            <select name="stage">${stageOptionHtml(match.stage)}</select>
          </label>
          <label>
            勝敗
            <select name="result">
              <option value="win"${match.result === "win" ? " selected" : ""}>WIN</option>
              <option value="lose"${match.result === "lose" ? " selected" : ""}>LOSE</option>
            </select>
          </label>
        </div>
        <div class="history-edit-actions">
          <span class="history-meta">${formatDateTime(match.recordedAt)}</span>
          <div class="inline-actions tight-actions">
            <button class="secondary-button" type="button" data-cancel-match-edit>キャンセル</button>
            <button class="primary-button" type="submit">保存</button>
          </div>
        </div>
      </form>
    `;
  }

  async function saveMatchEdit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const matchId = form.dataset.editMatchForm;
    const formData = new FormData(form);
    const stage = String(formData.get("stage") || "").trim();
    const weapon = String(formData.get("weapon") || "").trim();
    const rule = String(formData.get("rule") || "");
    const result = String(formData.get("result") || "");
    if (!matchId || !stage || !weapon || !rules.some((item) => item.id === rule) || (result !== "win" && result !== "lose")) return;

    const nextState = {
      ...state,
      matches: state.matches.map((match) =>
        match.id === matchId
          ? {
              ...match,
              rule,
              stage,
              weapon,
              result,
            }
          : match,
      ),
    };
    sortRecords(nextState);

    try {
      await saveRemoteState(nextState);
      editingMatchId = null;
      syncSettingsControls();
      render();
    } catch (_error) {
      render();
      reportError("履歴を保存できません");
    }
  }

  function renderXp() {
    const selectedRule = els.filterRule.value;
    const visibleRules = selectedRule === "all" ? rules : rules.filter((rule) => rule.id === selectedRule);
    const range = xpDateRange();
    const records = state.xpRecords.filter((record) => {
      if (!visibleRules.some((rule) => rule.id === record.rule)) return false;
      return inDateRange(record.recordedAt, range);
    });
    els.xpList.innerHTML = records.length
      ? records
          .map(
            (record) => `
              <div class="history-row">
                <div>
                  <div class="history-main">${record.xp.toFixed(1)}</div>
                  <div class="history-meta">${escapeHtml(ruleName(record.rule))} · ${formatDateTime(record.recordedAt)}</div>
                </div>
              </div>
            `,
          )
          .join("")
      : '<div class="empty">データなし</div>';
    drawXpChart(visibleRules, records, range);
  }

  function drawXpChart(visibleRules, records, range) {
    els.xpCharts.innerHTML = `
      <div class="xp-chart-card">
        <div class="xp-chart-head">
          <strong>XP推移</strong>
          <span>${records.length ? `${records.length}件` : "データなし"}</span>
        </div>
        <div class="chart-wrap">
          <svg viewBox="0 0 720 260" role="img" aria-label="XP推移">
            ${xpChartSvg(visibleRules, records, range)}
          </svg>
        </div>
        <div class="xp-legend">
          ${visibleRules.map((rule) => xpLegendItem(rule, records)).join("")}
        </div>
      </div>
    `;
  }

  function xpChartSvg(visibleRules, records, range) {
    if (records.length === 0) {
      return '<text x="360" y="136" text-anchor="middle" fill="#68716b" font-size="16">データなし</text>';
    }

    const width = 720;
    const height = 260;
    const pad = 34;
    const values = records.map((record) => record.xp);
    const min = Math.floor(Math.min(...values) - 20);
    const max = Math.ceil(Math.max(...values) + 20);
    const span = Math.max(1, max - min);
    const timeSpan = Math.max(1, range.end.getTime() - range.start.getTime());
    const series = visibleRules.map((rule) => {
      const ruleRecords = records
        .filter((record) => record.rule === rule.id)
        .slice()
        .reverse();
      const points = ruleRecords.map((record) => {
        const x = pad + ((new Date(record.recordedAt).getTime() - range.start.getTime()) / timeSpan) * (width - pad * 2);
        const y = height - pad - ((record.xp - min) / span) * (height - pad * 2);
        return { x, y, record };
      });
      return {
        rule,
        points,
        path: points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" "),
      };
    });

    return `
      <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="#d9ded5" />
      <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${height - pad}" stroke="#d9ded5" />
      <text x="${pad}" y="22" fill="#68716b" font-size="12">${max.toFixed(0)}</text>
      <text x="${pad}" y="${height - 8}" fill="#68716b" font-size="12">${min.toFixed(0)}</text>
      <text x="${pad}" y="${height - 18}" fill="#68716b" font-size="11">${formatDateShort(range.start)}</text>
      <text x="${width - pad}" y="${height - 18}" text-anchor="end" fill="#68716b" font-size="11">${formatDateShort(range.end)}</text>
      ${series
        .map((item) =>
          item.path
            ? `<path d="${item.path}" fill="none" stroke="${ruleColor(item.rule.id)}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />`
            : "",
        )
        .join("")}
      ${series
        .flatMap((item) =>
          item.points.map(
            (p) => `
              <circle cx="${p.x}" cy="${p.y}" r="5" fill="${ruleColor(item.rule.id)}" stroke="#fff" stroke-width="2" />
              <title>${escapeHtml(ruleName(p.record.rule))} ${p.record.xp.toFixed(1)} ${formatDateTime(p.record.recordedAt)}</title>
            `,
          ),
        )
        .join("")}
    `;
  }

  function xpLegendItem(rule, records) {
    const ruleRecords = records.filter((record) => record.rule === rule.id);
    const latest = ruleRecords[0];
    const value = latest ? `${latest.xp.toFixed(1)} / ${ruleRecords.length}件` : "データなし";
    return `
      <div class="xp-legend-item">
        <span class="xp-legend-swatch" style="background:${ruleColor(rule.id)}"></span>
        <span>${escapeHtml(rule.name)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>
    `;
  }

  function setView(view) {
    document.querySelectorAll("[data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
    document.querySelectorAll(".view").forEach((panel) => panel.classList.remove("active"));
    document.getElementById(`${view}View`).classList.add("active");
  }

  function setPastView(view) {
    document.querySelectorAll("[data-past-view]").forEach((button) => {
      button.classList.toggle("active", button.dataset.pastView === view);
    });
    els.pastMatchForm.classList.toggle("active", view === "match");
    els.pastXpForm.classList.toggle("active", view === "xp");
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `spla-x-match-${dateStamp()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        await saveRemoteState(normalizeState(parsed));
        syncSettingsControls();
        render();
      } catch (_error) {
        reportError("読み込みに失敗しました");
      }
    });
    reader.readAsText(file);
    event.target.value = "";
  }

  function normalizeState(value) {
    const normalized = {
      settings: {
        ...initialState.settings,
        ...(value && value.settings ? value.settings : {}),
      },
      matches: Array.isArray(value && value.matches) ? value.matches : [],
      xpRecords: Array.isArray(value && value.xpRecords) ? value.xpRecords : [],
    };
    sortRecords(normalized);
    return normalized;
  }

  function readPastRecordedAt() {
    if (!els.pastRecordedAtInput.value) return null;
    const date = new Date(els.pastRecordedAtInput.value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  function adjustPastTime(minutes) {
    const current = els.pastRecordedAtInput.value ? new Date(els.pastRecordedAtInput.value) : new Date();
    if (Number.isNaN(current.getTime())) return;
    current.setMinutes(current.getMinutes() + minutes);
    els.pastRecordedAtInput.value = toDateTimeLocalValue(current);
  }

  function toDateTimeLocalValue(date) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
  }

  function sortRecords(target = state) {
    target.matches.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
    target.xpRecords.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  }

  async function loadRemoteState() {
    const response = await fetch("/api/state");
    if (!response.ok) throw new Error("Failed to load state");
    state = normalizeState(await response.json());
  }

  async function saveRemoteState(nextState) {
    const response = await fetch("/api/state", {
      method: "PUT",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(nextState),
    });
    if (!response.ok) throw new Error("Failed to save state");
    state = normalizeState(await response.json());
  }

  function reportError(message) {
    window.clearTimeout(matchFeedbackTimer);
    els.lastSaved.classList.remove("saved-flash", "win", "lose");
    els.lastSaved.classList.add("status-error");
    els.lastSaved.textContent = message;
  }

  function groupBy(items, getKey) {
    return items.reduce((acc, item) => {
      const key = getKey(item);
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});
  }

  function unique(values) {
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, "ja"));
  }

  function uniqueOrdered(values) {
    return Array.from(new Set(values));
  }

  function ruleName(id) {
    return rules.find((rule) => rule.id === id)?.name || id;
  }

  function ruleColor(id) {
    const colors = {
      area: "#1eb7c7",
      tower: "#ff4fa3",
      rainmaker: "#688d00",
      clam: "#7b5cff",
    };
    return colors[id] || "#17201c";
  }

  function timeBand(iso) {
    const hour = new Date(iso).getHours();
    if (hour < 6) return "0-6時";
    if (hour < 12) return "6-12時";
    if (hour < 18) return "12-18時";
    return "18-24時";
  }

  function formatDateTime(iso) {
    return new Intl.DateTimeFormat("ja-JP", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  }

  function formatDateShort(date) {
    return new Intl.DateTimeFormat("ja-JP", {
      month: "2-digit",
      day: "2-digit",
    }).format(date);
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

  function dateStamp() {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
})();
