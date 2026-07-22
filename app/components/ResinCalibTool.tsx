"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  parseProfiles,
  sampleProfiles,
  serializeProfiles,
} from "../lib/storage.mjs";
import type { Profile, ProfileDraft } from "../lib/types";
import { ProfileList } from "./ProfileList";
import { RecordForm } from "./RecordForm";
import { RerfEstimator } from "./RerfEstimator";
import { IconDownload, IconGauge, IconPlus, IconUpload } from "./icons";

const STORAGE_KEY = "resin-calib:profiles:v1";
const MAX_COMPARE = 3;

type Toast = { kind: "ok" | "err"; text: string } | null;

function makeId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `p-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ResinCalibTool() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [prefill, setPrefill] = useState<{ exposureS: number } | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // 初回マウントで localStorage から読み込む（SSR/CSR ミスマッチを避けるため effect 内で）。
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = parseProfiles(raw);
        if (parsed.ok) setProfiles(parsed.profiles);
      }
    } catch {
      /* localStorage 不可（プライベートモード等）でもアプリは動作させる */
    }
    setLoaded(true);
  }, []);

  // 端末への永続化を試みる。書き込めたら true、失敗（容量超過/プライベートモード等）なら
  // false を返す。UI 状態（in-memory）は成否に関わらず更新する（当該セッションでは使える）。
  const persist = useCallback((next: Profile[]): boolean => {
    setProfiles(next);
    try {
      localStorage.setItem(STORAGE_KEY, serializeProfiles(next));
      return true;
    } catch {
      return false;
    }
  }, []);

  // トーストの自動消去。
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleSave = useCallback(
    (draft: ProfileDraft) => {
      const profile: Profile = {
        ...draft,
        id: makeId(),
        createdAt: Date.now(),
      };
      const saved = persist([profile, ...profiles]);
      setToast(
        saved
          ? { kind: "ok", text: "プロファイルを保存しました" }
          : {
              kind: "err",
              text: "端末に保存できませんでした（ブラウザの容量やプライベートモードをご確認ください）。今回の内容はこのセッションでは表示されます。",
            },
      );
    },
    [persist, profiles],
  );

  const handleDelete = useCallback(
    (id: string) => {
      const saved = persist(profiles.filter((p) => p.id !== id));
      setCompareIds((ids) => ids.filter((c) => c !== id));
      setToast(
        saved
          ? { kind: "ok", text: "プロファイルを削除しました" }
          : { kind: "err", text: "端末の保存内容を更新できませんでした。" },
      );
    },
    [persist, profiles],
  );

  const handleToggleCompare = useCallback((id: string) => {
    setCompareIds((ids) => {
      if (ids.includes(id)) return ids.filter((c) => c !== id);
      if (ids.length >= MAX_COMPARE) {
        setToast({ kind: "err", text: `比較は ${MAX_COMPARE} 件までです` });
        return ids;
      }
      return [...ids, id];
    });
  }, []);

  const handleUseValue = useCallback((exposureS: number) => {
    setPrefill({ exposureS });
    document
      .getElementById("record")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleExport = useCallback(() => {
    if (profiles.length === 0) return;
    const blob = new Blob([serializeProfiles(profiles)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resin-calib-profiles.json";
    document.body.appendChild(a);
    a.click();
    // 一部のブラウザ（Firefox/Safari）は click 直後の同期 revoke でダウンロードが
    // 中断され得るため、解放とノード除去を次のタスクに回す。
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 0);
    setToast({ kind: "ok", text: "プロファイルを書き出しました" });
  }, [profiles]);

  const handleImportFile = useCallback(
    async (file: File) => {
      let text = "";
      try {
        text = await file.text();
      } catch {
        setToast({ kind: "err", text: "ファイルを読み取れませんでした" });
        return;
      }
      const result = parseProfiles(text);
      if (!result.ok) {
        setToast({ kind: "err", text: result.error });
        return;
      }
      // id を補完しつつ既存と統合（同一 id は読み込んだ側で置き換え）。
      const byId = new Map(profiles.map((p) => [p.id, p]));
      for (const p of result.profiles) {
        const id = p.id || makeId();
        byId.set(id, { ...p, id });
      }
      const merged = [...byId.values()].sort(
        (a, b) => b.createdAt - a.createdAt,
      );
      const saved = persist(merged);
      const note =
        result.skipped > 0 ? `（${result.skipped} 件は項目不足で除外）` : "";
      setToast(
        saved
          ? {
              kind: "ok",
              text: `${result.profiles.length} 件を読み込みました${note}`,
            }
          : {
              kind: "err",
              text: `${result.profiles.length} 件を読み込みましたが、端末に保存できませんでした（容量/プライベートモードをご確認ください）。`,
            },
      );
    },
    [persist, profiles],
  );

  const handleLoadSample = useCallback(() => {
    const byId = new Map(profiles.map((p) => [p.id, p]));
    for (const p of sampleProfiles()) byId.set(p.id, p);
    const saved = persist(
      [...byId.values()].sort((a, b) => b.createdAt - a.createdAt),
    );
    setToast(
      saved
        ? { kind: "ok", text: "サンプルを読み込みました" }
        : {
            kind: "err",
            text: "サンプルを読み込みましたが、端末に保存できませんでした。",
          },
    );
  }, [persist, profiles]);

  const printerSuggestions = [...new Set(profiles.map((p) => p.printer))];
  const resinSuggestions = [...new Set(profiles.map((p) => p.resin))];

  return (
    <>
      <div className="tool-bar">
        <span className="badge badge-accent count-chip">
          保存済み <span className="tabular">{profiles.length}</span> 件
        </span>
        <div className="tool-bar-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExport}
            disabled={profiles.length === 0}
            aria-disabled={profiles.length === 0}
          >
            <IconDownload />
            データを書き出す
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fileRef.current?.click()}
          >
            <IconUpload />
            データを読み込む
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportFile(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <section
        id="record"
        className="section tool-section"
        aria-labelledby="record-h"
      >
        <span className="eyebrow">記録する</span>
        <h2 id="record-h">プロファイルを記録</h2>
        <p className="section-lead">
          機種・レジン・環境・露光パラメータをまとめて保存します。必須は機種・レジン・normal
          露光の 3 つだけ。
        </p>
        <RecordForm
          prefill={prefill}
          printerSuggestions={printerSuggestions}
          resinSuggestions={resinSuggestions}
          onSave={handleSave}
        />
      </section>

      <section
        id="rerf"
        className="section tool-section"
        aria-labelledby="rerf-h"
      >
        <span className="eyebrow">推定する</span>
        <h2 id="rerf-h">露光テストから推定（RERF）</h2>
        <p className="section-lead">
          段階的に露光を変えたテストの結果を入れると、確実に硬化した中で最も短い露光を推奨します。
        </p>
        <RerfEstimator onUseValue={handleUseValue} />
      </section>

      <section
        id="profiles"
        className="section tool-section"
        aria-labelledby="profiles-h"
      >
        <span className="eyebrow">見直す</span>
        <h2 id="profiles-h">保存したプロファイル</h2>
        <p className="section-lead">
          機種・レジン・温度で絞り込み、複数のプロファイルを並べて比較できます。
        </p>
        {!loaded ? (
          <div className="card-grid" aria-hidden="true">
            <div className="card skeleton-card">
              <div
                className="skeleton"
                style={{ height: "1.4rem", width: "60%" }}
              />
              <div
                className="skeleton"
                style={{ height: "1rem", width: "80%" }}
              />
              <div
                className="skeleton"
                style={{ height: "3rem", width: "100%" }}
              />
            </div>
            <div className="card skeleton-card">
              <div
                className="skeleton"
                style={{ height: "1.4rem", width: "60%" }}
              />
              <div
                className="skeleton"
                style={{ height: "1rem", width: "80%" }}
              />
              <div
                className="skeleton"
                style={{ height: "3rem", width: "100%" }}
              />
            </div>
          </div>
        ) : profiles.length === 0 ? (
          <div className="empty-state card">
            <span className="card-icon" aria-hidden="true">
              <IconGauge />
            </span>
            <h3>まだプロファイルがありません</h3>
            <p>最初の 1 件を記録するか、サンプルデータで操作感を試せます。</p>
            <div className="hero-actions" style={{ justifyContent: "center" }}>
              <a className="btn btn-primary" href="#record">
                <IconPlus />
                プロファイルを記録
              </a>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleLoadSample}
              >
                サンプルを読み込む
              </button>
            </div>
          </div>
        ) : (
          <ProfileList
            profiles={profiles}
            compareIds={compareIds}
            onToggleCompare={handleToggleCompare}
            onDelete={handleDelete}
          />
        )}
      </section>

      <div className="toast-area" role="status" aria-live="polite">
        {toast && (
          <div
            className={`alert ${toast.kind === "ok" ? "alert-ok" : "alert-err"} toast`}
          >
            {toast.text}
          </div>
        )}
      </div>
    </>
  );
}
