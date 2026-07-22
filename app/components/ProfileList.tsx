"use client";

import { useMemo, useState } from "react";
import type { Profile } from "../lib/types";
import { IconScale, IconSearch, IconTrash, IconX } from "./icons";

interface ProfileListProps {
  profiles: Profile[];
  compareIds: string[];
  onToggleCompare: (id: string) => void;
  onDelete: (id: string) => void;
}

function num(v: number | null, unit: string): string {
  return v == null ? "—" : `${v}${unit}`;
}

function dateLabel(ms: number): string {
  if (!ms) return "—";
  const d = new Date(ms);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

const COMPARE_ROWS: { label: string; get: (p: Profile) => string }[] = [
  { label: "機種", get: (p) => p.printer },
  { label: "レジン", get: (p) => p.resin },
  { label: "種別", get: (p) => p.resinType || "—" },
  { label: "造形温度", get: (p) => num(p.tempC, "°C") },
  { label: "FEP", get: (p) => p.fep || "—" },
  { label: "レイヤー高", get: (p) => num(p.layerHeightMm, "mm") },
  { label: "normal 露光", get: (p) => num(p.normalExposureS, "s") },
  { label: "bottom 露光", get: (p) => num(p.bottomExposureS, "s") },
  { label: "bottom 層数", get: (p) => num(p.bottomLayers, "層") },
  { label: "light-off delay", get: (p) => num(p.lightOffDelayS, "s") },
];

export function ProfileList({
  profiles,
  compareIds,
  onToggleCompare,
  onDelete,
}: ProfileListProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [printerFilter, setPrinterFilter] = useState("");

  const printers = useMemo(
    () => [...new Set(profiles.map((p) => p.printer))].sort(),
    [profiles],
  );
  const types = useMemo(
    () => [...new Set(profiles.map((p) => p.resinType).filter(Boolean))].sort(),
    [profiles],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return profiles.filter((p) => {
      if (typeFilter && p.resinType !== typeFilter) return false;
      if (printerFilter && p.printer !== printerFilter) return false;
      if (q) {
        const hay = `${p.printer} ${p.resin} ${p.note}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [profiles, search, typeFilter, printerFilter]);

  const compareProfiles = useMemo(
    () => profiles.filter((p) => compareIds.includes(p.id)),
    [profiles, compareIds],
  );

  const hasFilter =
    search.trim() !== "" || typeFilter !== "" || printerFilter !== "";

  function clearAll() {
    setSearch("");
    setTypeFilter("");
    setPrinterFilter("");
  }

  return (
    <div className="profiles">
      <div className="filter-bar">
        <div className="field with-unit search-field">
          <label htmlFor="pf-search" className="sr-only">
            プロファイルを検索
          </label>
          <span className="search-icon" aria-hidden="true">
            <IconSearch />
          </span>
          <input
            id="pf-search"
            type="search"
            value={search}
            placeholder="機種・レジン・メモを検索"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="field filter-select">
          <label htmlFor="pf-type" className="sr-only">
            レジン種別で絞り込み
          </label>
          <select
            id="pf-type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">種別: すべて</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="field filter-select">
          <label htmlFor="pf-printer" className="sr-only">
            機種で絞り込み
          </label>
          <select
            id="pf-printer"
            value={printerFilter}
            onChange={(e) => setPrinterFilter(e.target.value)}
          >
            <option value="">機種: すべて</option>
            {printers.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasFilter && (
        <div className="chip-row">
          {search.trim() && (
            <button
              type="button"
              className="badge chip"
              onClick={() => setSearch("")}
            >
              検索: {search.trim()} <IconX />
            </button>
          )}
          {typeFilter && (
            <button
              type="button"
              className="badge chip"
              onClick={() => setTypeFilter("")}
            >
              種別: {typeFilter} <IconX />
            </button>
          )}
          {printerFilter && (
            <button
              type="button"
              className="badge chip"
              onClick={() => setPrinterFilter("")}
            >
              機種: {printerFilter} <IconX />
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-clear"
            onClick={clearAll}
          >
            条件をクリア
          </button>
        </div>
      )}

      <p className="result-count" aria-live="polite">
        <span className="tabular">{filtered.length}</span> 件
        {profiles.length !== filtered.length && (
          <span className="text-dim">（全 {profiles.length} 件中）</span>
        )}
      </p>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <span className="card-icon" aria-hidden="true">
            <IconSearch />
          </span>
          <h3>条件に合うプロファイルがありません</h3>
          <p>検索語や絞り込みを変えてみてください。</p>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map((p) => {
            const inCompare = compareIds.includes(p.id);
            return (
              <article
                className={`card profile-card${inCompare ? " is-comparing" : ""}`}
                key={p.id}
              >
                <div className="profile-head">
                  <h3>{p.printer}</h3>
                  <p className="profile-resin">{p.resin}</p>
                </div>
                <div className="badge-row">
                  {p.resinType && (
                    <span className="badge badge-accent">{p.resinType}</span>
                  )}
                  {p.tempC != null && (
                    <span className="badge tabular">{p.tempC}°C</span>
                  )}
                  {p.fep && <span className="badge">FEP: {p.fep}</span>}
                  {p.layerHeightMm != null && (
                    <span className="badge tabular">{p.layerHeightMm}mm</span>
                  )}
                </div>
                <dl className="param-grid">
                  <div>
                    <dt>normal</dt>
                    <dd className="tabular">{num(p.normalExposureS, "s")}</dd>
                  </div>
                  <div>
                    <dt>bottom</dt>
                    <dd className="tabular">{num(p.bottomExposureS, "s")}</dd>
                  </div>
                  <div>
                    <dt>bottom 層</dt>
                    <dd className="tabular">{num(p.bottomLayers, "")}</dd>
                  </div>
                  <div>
                    <dt>light-off</dt>
                    <dd className="tabular">{num(p.lightOffDelayS, "s")}</dd>
                  </div>
                </dl>
                {p.note && <p className="profile-note">{p.note}</p>}
                <div className="profile-foot">
                  <span className="text-dim profile-date tabular">
                    {dateLabel(p.createdAt)}
                  </span>
                  <div className="profile-actions">
                    <label className="compare-toggle">
                      <input
                        type="checkbox"
                        checked={inCompare}
                        onChange={() => onToggleCompare(p.id)}
                      />
                      比較に追加
                    </label>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon"
                      aria-label={`${p.printer} / ${p.resin} を削除`}
                      onClick={() => onDelete(p.id)}
                    >
                      <IconTrash />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {compareProfiles.length >= 2 && (
        <section className="compare" aria-label="プロファイル比較">
          <h3>
            <IconScale /> 比較（{compareProfiles.length} 件）
          </h3>
          <div className="compare-scroll">
            <table className="compare-table">
              <thead>
                <tr>
                  <th scope="col">項目</th>
                  {compareProfiles.map((p) => (
                    <th scope="col" key={p.id}>
                      {p.printer}
                      <span className="th-sub">{p.resin}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row) => {
                  const values = compareProfiles.map((p) => row.get(p));
                  const baseVal = values[0];
                  const differs = new Set(values).size > 1;
                  return (
                    <tr key={row.label}>
                      <th scope="row">
                        {row.label}
                        {differs && (
                          <span
                            className="diff-flag"
                            title="プロファイル間で値が異なります"
                          >
                            違い
                          </span>
                        )}
                      </th>
                      {values.map((v, i) => {
                        const isDiff = differs && v !== baseVal;
                        return (
                          <td
                            key={compareProfiles[i]?.id ?? i}
                            className={`tabular${isDiff ? " diff-cell" : ""}`}
                          >
                            {v}
                            {isDiff && (
                              <sup
                                className="diff-mark"
                                aria-label="基準と異なる"
                              >
                                ≠
                              </sup>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="field-hint">
            ≠
            と「違い」は、左端のプロファイルと値が異なる箇所を示します（色だけに頼らない表示）。
          </p>
        </section>
      )}
    </div>
  );
}
