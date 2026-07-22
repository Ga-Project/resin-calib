"use client";

import { useMemo, useState } from "react";
import { buildSteps, estimateExposure } from "../lib/exposure.mjs";
import type { CureState, EstimateResult, RerfStep } from "../lib/types";
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconDroplet,
  IconLayers,
} from "./icons";

interface RerfEstimatorProps {
  onUseValue: (exposureS: number) => void;
}

const CURE_OPTIONS: {
  value: CureState;
  label: string;
  Icon: typeof IconDroplet;
}[] = [
  { value: "under", label: "未硬化", Icon: IconDroplet },
  { value: "good", label: "良好", Icon: IconCircleCheck },
  { value: "over", label: "過硬化", Icon: IconAlertTriangle },
];

function fmt(n: number): string {
  return Number.isInteger(n)
    ? String(n)
    : n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export function RerfEstimator({ onUseValue }: RerfEstimatorProps) {
  const [base, setBase] = useState("1.6");
  const [increment, setIncrement] = useState("0.2");
  const [count, setCount] = useState("8");
  const [exposures, setExposures] = useState<number[]>([]);
  const [states, setStates] = useState<(CureState | null)[]>([]);

  function generate() {
    const b = Number(base);
    const inc = Number(increment);
    const c = Number(count);
    const built = buildSteps(b, inc, c);
    setExposures(built);
    setStates(built.map(() => null));
  }

  const rerfSteps: RerfStep[] = useMemo(() => {
    const out: RerfStep[] = [];
    exposures.forEach((exposureS, i) => {
      const state = states[i];
      if (state) out.push({ exposureS, state });
    });
    return out;
  }, [exposures, states]);

  const unsetCount = exposures.length - rerfSteps.length;
  // 全段の判定が揃って初めて推定する。未入力段があると推奨が部分データに基づき
  // 誤誘導になり得るため（より低い良好段が未入力かもしれない）、揃うまで結果を出さない。
  const complete = exposures.length > 0 && unsetCount === 0;

  const estimate: EstimateResult = useMemo(
    () => (complete ? estimateExposure(rerfSteps) : estimateExposure([])),
    [complete, rerfSteps],
  );

  const countNum = Number(count);
  const canGenerate =
    Number(base) >= 0 &&
    Number(increment) > 0 &&
    Number.isInteger(countNum) &&
    countNum > 0 &&
    countNum <= 60;

  return (
    <div className="rerf">
      <div className="card">
        <h3 style={{ marginTop: 0 }}>テスト条件</h3>
        <p className="field-hint" style={{ marginTop: 0 }}>
          RERF（露光テスト）で使った「1段目の露光・1段あたりの増分・段数」を入れて段リストを作ります。
        </p>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="rerf-base">1段目の露光</label>
            <div className="with-unit">
              <input
                id="rerf-base"
                type="number"
                inputMode="decimal"
                step="0.1"
                className="tabular"
                value={base}
                onChange={(e) => setBase(e.target.value)}
              />
              <span className="unit" aria-hidden="true">
                s
              </span>
            </div>
          </div>
          <div className="field">
            <label htmlFor="rerf-inc">1段あたりの増分</label>
            <div className="with-unit">
              <input
                id="rerf-inc"
                type="number"
                inputMode="decimal"
                step="0.1"
                className="tabular"
                value={increment}
                onChange={(e) => setIncrement(e.target.value)}
              />
              <span className="unit" aria-hidden="true">
                s
              </span>
            </div>
          </div>
          <div className="field">
            <label htmlFor="rerf-count">段数</label>
            <div className="with-unit">
              <input
                id="rerf-count"
                type="number"
                inputMode="numeric"
                step="1"
                min="1"
                max="60"
                className="tabular"
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
              <span className="unit" aria-hidden="true">
                段
              </span>
            </div>
            <span className="field-hint">1〜60</span>
          </div>
        </div>
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={generate}
            disabled={!canGenerate}
          >
            <IconLayers />
            段リストを生成
          </button>
        </div>
      </div>

      <div className="rerf-grid">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>段ごとの硬化状態</h3>
          {exposures.length === 0 ? (
            <div className="empty-state">
              <span className="card-icon" aria-hidden="true">
                <IconLayers />
              </span>
              <p>
                テスト条件を入力して「段リストを生成」を押すと、ここに各段が並びます。
              </p>
            </div>
          ) : (
            <>
              <p className="field-hint" style={{ marginTop: 0 }}>
                各段の仕上がりを選んでください。
                {unsetCount > 0 && (
                  <span>
                    {" "}
                    未入力 <span className="tabular">{unsetCount}</span> /{" "}
                    <span className="tabular">{exposures.length}</span> 段
                  </span>
                )}
              </p>
              <ul className="rerf-rows" role="list">
                {exposures.map((exposureS, i) => {
                  const isRec =
                    estimate.status === "ok" &&
                    estimate.recommendedS === exposureS &&
                    states[i] === "good";
                  return (
                    <li
                      key={`${i}-${exposureS}`}
                      className={`rerf-row${isRec ? " is-rec" : ""}`}
                      aria-current={isRec ? "true" : undefined}
                    >
                      <span className="rerf-exp tabular">
                        {fmt(exposureS)}
                        <span className="unit-inline" aria-hidden="true">
                          s
                        </span>
                      </span>
                      <span className="rerf-step-label">段 {i + 1}</span>
                      {isRec && (
                        <span className="badge badge-accent rerf-rec-badge">
                          推奨起点
                        </span>
                      )}
                      <fieldset
                        className="seg"
                        role="radiogroup"
                        aria-label={`段 ${i + 1}（${fmt(exposureS)}秒）の硬化状態`}
                      >
                        {CURE_OPTIONS.map(({ value, label, Icon }) => (
                          <label key={value} className={`seg-opt seg-${value}`}>
                            <input
                              type="radio"
                              name={`cure-${i}`}
                              value={value}
                              checked={states[i] === value}
                              onChange={() =>
                                setStates((prev) => {
                                  const next = [...prev];
                                  next[i] = value;
                                  return next;
                                })
                              }
                            />
                            <span className="seg-icon" aria-hidden="true">
                              <Icon />
                            </span>
                            <span className="seg-label">{label}</span>
                          </label>
                        ))}
                      </fieldset>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        <div className="card rerf-result" aria-live="polite" aria-atomic="true">
          <h3 style={{ marginTop: 0 }}>推奨露光</h3>
          {estimate.status === "ok" && estimate.recommendedS != null ? (
            <>
              <p className="result-value tabular">
                {fmt(estimate.recommendedS)}
                <span className="result-unit">s</span>
              </p>
              {estimate.goodBand && (
                <p className="result-band tabular">
                  良好域 {fmt(estimate.goodBand.loS)}–
                  {fmt(estimate.goodBand.hiS)} s
                </p>
              )}
              <p className="result-note">{estimate.message}</p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  estimate.recommendedS != null &&
                  onUseValue(estimate.recommendedS)
                }
              >
                この値でプロファイルを作成
              </button>
            </>
          ) : (
            <div
              className="empty-state"
              style={{ padding: "var(--sp-8) var(--sp-4)" }}
            >
              <span className="card-icon" aria-hidden="true">
                <IconCircleCheck />
              </span>
              <p>
                {exposures.length === 0
                  ? "段リストを作り、各段の硬化状態を入力すると推奨露光が表示されます。"
                  : !complete
                    ? `残り ${unsetCount} 段の判定を入力すると推奨露光が表示されます。`
                    : estimate.message}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
