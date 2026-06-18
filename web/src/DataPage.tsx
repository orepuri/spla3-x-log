import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Download, FileJson, Upload, X } from "lucide-react";
import { getArchive, importArchive } from "./api";
import type { AppArchive } from "./types";

export function DataPage() {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pendingArchive, setPendingArchive] = useState<AppArchive | null>(null);
  const [pendingFileName, setPendingFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  async function exportData() {
    setBusy(true);
    setError("");
    try {
      const archive = await getArchive();
      const blob = new Blob([JSON.stringify(archive, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `spla-x-match-${dateStamp()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setFeedback("Exportしました");
    } catch (_error) {
      setError("Exportに失敗しました");
    } finally {
      setBusy(false);
    }
  }

  async function selectImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    try {
      const parsed = JSON.parse(await file.text());
      if (!isArchive(parsed)) throw new Error("Invalid archive");
      setPendingArchive(parsed);
      setPendingFileName(file.name);
    } catch (_error) {
      setError("JSONファイルを読み込めません");
    }
  }

  async function confirmImport() {
    if (!pendingArchive) return;
    setBusy(true);
    setError("");
    try {
      const imported = await importArchive(pendingArchive);
      setPendingArchive(null);
      setPendingFileName("");
      setFeedback(`${imported.matches.length}試合と${imported.xpRecords.length}件のXPをImportしました`);
      await queryClient.invalidateQueries();
    } catch (_error) {
      setError("Importに失敗しました");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header data-page-header">
        <div>
          <p>バックアップと復元</p>
          <h1>データ管理</h1>
        </div>
        <div className={`record-feedback${error ? " error" : ""}`} aria-live="polite">
          {error || feedback}
        </div>
      </header>

      <div className="data-layout">
        <section className="surface data-action">
          <span className="data-action-icon">
            <Download aria-hidden="true" size={22} />
          </span>
          <div>
            <h2>Export</h2>
          </div>
          <button className="primary-button" disabled={busy} onClick={exportData} type="button">
            <Download aria-hidden="true" size={16} />
            Export
          </button>
        </section>

        <section className="surface data-action">
          <span className="data-action-icon">
            <Upload aria-hidden="true" size={22} />
          </span>
          <div>
            <h2>Import</h2>
          </div>
          <button className="secondary-action-button" disabled={busy} onClick={() => fileInput.current?.click()} type="button">
            <FileJson aria-hidden="true" size={16} />
            ファイル選択
          </button>
          <input accept="application/json,.json" hidden onChange={selectImportFile} ref={fileInput} type="file" />
        </section>
      </div>

      {pendingArchive ? (
        <div className="modal-backdrop" role="presentation">
          <section aria-labelledby="import-title" aria-modal="true" className="confirm-dialog" role="dialog">
            <div className="confirm-dialog-header">
              <div>
                <p>{pendingFileName}</p>
                <h2 id="import-title">Importしますか？</h2>
              </div>
              <button aria-label="閉じる" disabled={busy} onClick={() => setPendingArchive(null)} type="button">
                <X aria-hidden="true" size={18} />
              </button>
            </div>
            <div className="import-counts">
              <div>
                <span>試合履歴</span>
                <strong>{pendingArchive.matches.length}件</strong>
              </div>
              <div>
                <span>XP履歴</span>
                <strong>{pendingArchive.xpRecords.length}件</strong>
              </div>
            </div>
            <p className="confirm-warning">現在のデータはこのファイルの内容で置き換わります。</p>
            <div className="confirm-actions">
              <button className="secondary-action-button" disabled={busy} onClick={() => setPendingArchive(null)} type="button">
                キャンセル
              </button>
              <button className="primary-button" disabled={busy} onClick={confirmImport} type="button">
                <Upload aria-hidden="true" size={16} />
                Import
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function isArchive(value: unknown): value is AppArchive {
  if (!value || typeof value !== "object") return false;
  const archive = value as Partial<AppArchive>;
  return Boolean(
    (archive.settings === null || (typeof archive.settings === "object" && !Array.isArray(archive.settings))) &&
      Array.isArray(archive.matches) &&
      Array.isArray(archive.xpRecords),
  );
}

function dateStamp() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
}
