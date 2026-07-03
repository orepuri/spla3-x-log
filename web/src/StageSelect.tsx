import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { stageSearchMetadata, stages } from "./catalog";
import { hasAnyStrategyGuide, hasStrategyGuide } from "./stageGuides";
import type { RuleId } from "./types";

interface StageSelectOption {
  label: string;
  value: string;
}

export function StageSelect({
  allowAll = false,
  disabled = false,
  label,
  onChange,
  options,
  rule,
  value,
}: {
  allowAll?: boolean;
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  options?: StageSelectOption[];
  rule?: RuleId | "all";
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const stageOptions = useMemo(() => stageSelectOptions(options, allowAll), [allowAll, options]);
  const selected = stageOptions.find((option) => option.value === value);
  const visibleOptions = useMemo(() => filterStageOptions(stageOptions, query), [query, stageOptions]);
  const inputValue = open ? query : selected?.label || value;

  function choose(next: string) {
    onChange(next);
    setQuery("");
    setOpen(false);
  }

  return (
    <label className="preview-field stage-combobox">
      <span>{label}</span>
      <div className="stage-combobox-control">
        <Search aria-hidden="true" size={15} />
        <input
          aria-autocomplete="list"
          aria-controls={`${label}-stage-options`}
          aria-expanded={open}
          aria-label={label}
          disabled={disabled}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setQuery("");
            setOpen(true);
          }}
          placeholder="ステージ名 / romaji"
          role="combobox"
          value={inputValue}
        />
      </div>
      {open && !disabled ? (
        <div className="stage-combobox-list" id={`${label}-stage-options`} role="listbox">
          {visibleOptions.length ? (
            visibleOptions.map((option) => (
              <button
                aria-selected={option.value === value}
                key={option.value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option.value)}
                role="option"
                type="button"
              >
                <span>{option.label}</span>
                {strategyAvailable(rule, option.value) ? <b>攻略あり</b> : null}
              </button>
            ))
          ) : (
            <div className="stage-combobox-empty">該当するステージはありません</div>
          )}
        </div>
      ) : null}
    </label>
  );
}

function stageSelectOptions(options: StageSelectOption[] | undefined, allowAll: boolean) {
  const values = options?.length ? options : stages.map((stage) => ({ label: stage, value: stage }));
  const allOption = allowAll ? [{ label: "すべて", value: "all" }] : [];
  return [
    ...allOption,
    ...values
      .filter((option) => option.value !== "all")
      .slice()
      .sort((left, right) => stageSortKey(left.label).localeCompare(stageSortKey(right.label), "ja-JP")),
  ];
}

function filterStageOptions(options: StageSelectOption[], query: string) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return options.slice(0, 30);
  return options.filter((option) => {
    if (option.value === "all") return normalizeSearch(option.label).includes(normalizedQuery);
    const metadata = stageSearchMetadata[option.value] || stageSearchMetadata[option.label];
    const haystack = [
      option.label,
      option.value,
      metadata?.yomi,
      ...(metadata?.romaji || []),
      ...(metadata?.aliases || []),
    ]
      .filter(Boolean)
      .map((item) => normalizeSearch(String(item)));
    return haystack.some((item) => item.includes(normalizedQuery));
  });
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ぁ-ん]/g, (char) => String.fromCharCode(char.charCodeAt(0) + 0x60))
    .replace(/[\sー・＆&'’/().-]/g, "");
}

function stageSortKey(stage: string) {
  if (stage === "すべて") return "";
  return stageSearchMetadata[stage]?.yomi || stage;
}

function strategyAvailable(rule: RuleId | "all" | undefined, stage: string) {
  if (stage === "all") return false;
  if (!rule || rule === "all") return hasAnyStrategyGuide(stage);
  return hasStrategyGuide(rule, stage);
}
