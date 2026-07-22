"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ProfileDraft } from "../lib/types";
import { IconPlus } from "./icons";

const RESIN_TYPES = [
  "スタンダード",
  "ABS-like",
  "水洗い",
  "タフ",
  "柔軟",
  "その他",
] as const;
const FEP_STATES = ["新品", "良好", "曇り有", "要交換"] as const;

interface RecordFormProps {
  /** RERF 推定から渡される露光値。クリックの度に新しいオブジェクトで渡し再反映を保証する。 */
  prefill: { exposureS: number } | null;
  printerSuggestions: string[];
  resinSuggestions: string[];
  onSave: (draft: ProfileDraft) => void;
}

interface FormState {
  printer: string;
  resin: string;
  resinType: string;
  tempC: string;
  fep: string;
  layerHeightMm: string;
  normalExposureS: string;
  bottomExposureS: string;
  bottomLayers: string;
  lightOffDelayS: string;
  note: string;
}

const EMPTY: FormState = {
  printer: "",
  resin: "",
  resinType: "スタンダード",
  tempC: "",
  fep: "新品",
  layerHeightMm: "",
  normalExposureS: "",
  bottomExposureS: "",
  bottomLayers: "",
  lightOffDelayS: "",
  note: "",
};

type Errors = Partial<Record<keyof FormState, string>>;

function toNumOrNull(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function validate(state: FormState): Errors {
  const errors: Errors = {};
  if (state.printer.trim() === "") errors.printer = "機種名を入力してください";
  if (state.resin.trim() === "")
    errors.resin = "レジン製品名を入力してください";

  const normal = toNumOrNull(state.normalExposureS);
  if (state.normalExposureS.trim() === "") {
    errors.normalExposureS = "normal 露光を入力してください";
  } else if (normal === null || normal <= 0) {
    errors.normalExposureS = "露光時間は 0 より大きい値で入力してください";
  }

  if (state.layerHeightMm.trim() !== "") {
    const lh = toNumOrNull(state.layerHeightMm);
    if (lh === null || lh < 0.01 || lh > 0.3) {
      errors.layerHeightMm =
        "レイヤー高は 0.01〜0.30mm の範囲で入力してください";
    }
  }
  // 造形温度は形式のみ検証（低温環境もあり得るため符号は問わない）。
  if (state.tempC.trim() !== "" && toNumOrNull(state.tempC) === null) {
    errors.tempC = "数値で入力してください";
  }
  // 露光・ディレイは物理的に負になり得ないため 0 以上を要求する。
  for (const k of ["bottomExposureS", "lightOffDelayS"] as const) {
    if (state[k].trim() !== "") {
      const n = toNumOrNull(state[k]);
      if (n === null || n < 0) errors[k] = "0 以上の数値で入力してください";
    }
  }
  // bottom 層数は 0 以上の整数。
  if (state.bottomLayers.trim() !== "") {
    const n = toNumOrNull(state.bottomLayers);
    if (n === null || n < 0 || !Number.isInteger(n)) {
      errors.bottomLayers = "0 以上の整数で入力してください";
    }
  }
  return errors;
}

export function RecordForm({
  prefill,
  printerSuggestions,
  resinSuggestions,
  onSave,
}: RecordFormProps) {
  const [state, setState] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState(false);
  const normalRef = useRef<HTMLInputElement>(null);
  const printerListId = useId();
  const resinListId = useId();

  // RERF 推定の「この値でプロファイルを作成」から露光値を受け取り、フォームに反映する。
  useEffect(() => {
    if (prefill && Number.isFinite(prefill.exposureS)) {
      setState((s) => ({ ...s, normalExposureS: String(prefill.exposureS) }));
      normalRef.current?.focus();
    }
  }, [prefill]);

  function set<K extends keyof FormState>(key: K, value: string) {
    setState((s) => ({ ...s, [key]: value }));
    if (touched) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);
    const found = validate(state);
    setErrors(found);
    const firstKey = Object.keys(found)[0];
    if (firstKey) {
      // 最初のエラー項目へフォーカスを移す。クエリはこのフォーム内に限定する
      // （ページに複数フォームがあっても他フォームへフォーカスが飛ばないように）。
      const el = e.currentTarget.querySelector<HTMLElement>(
        `[name="${firstKey}"]`,
      );
      el?.focus();
      return;
    }
    const draft: ProfileDraft = {
      printer: state.printer.trim(),
      resin: state.resin.trim(),
      resinType: state.resinType,
      tempC: toNumOrNull(state.tempC),
      fep: state.fep,
      layerHeightMm: toNumOrNull(state.layerHeightMm),
      normalExposureS: toNumOrNull(state.normalExposureS) ?? 0,
      bottomExposureS: toNumOrNull(state.bottomExposureS),
      bottomLayers: toNumOrNull(state.bottomLayers),
      lightOffDelayS: toNumOrNull(state.lightOffDelayS),
      note: state.note.trim(),
    };
    onSave(draft);
    setState(EMPTY);
    setErrors({});
    setTouched(false);
  }

  const err = (k: keyof FormState) =>
    errors[k] ? (
      <span className="field-error" id={`${k}-error`} role="alert">
        {errors[k]}
      </span>
    ) : null;

  const invalid = (k: keyof FormState) =>
    errors[k]
      ? { "aria-invalid": true as const, "aria-describedby": `${k}-error` }
      : {};

  return (
    <form className="card" onSubmit={handleSubmit} noValidate>
      <datalist id={printerListId}>
        {printerSuggestions.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      <datalist id={resinListId}>
        {resinSuggestions.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>

      <fieldset className="field-group">
        <legend>機種・レジン</legend>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="rf-printer">
              機種名 <span aria-hidden="true">*</span>
            </label>
            <input
              id="rf-printer"
              name="printer"
              list={printerListId}
              value={state.printer}
              placeholder="例: Elegoo Mars 4 Ultra"
              required
              {...invalid("printer")}
              onChange={(e) => set("printer", e.target.value)}
            />
            {err("printer")}
          </div>
          <div className="field">
            <label htmlFor="rf-resin">
              レジン製品名 <span aria-hidden="true">*</span>
            </label>
            <input
              id="rf-resin"
              name="resin"
              list={resinListId}
              value={state.resin}
              placeholder="例: Elegoo Standard Grey"
              required
              {...invalid("resin")}
              onChange={(e) => set("resin", e.target.value)}
            />
            {err("resin")}
          </div>
          <div className="field">
            <label htmlFor="rf-resinType">レジン種別</label>
            <select
              id="rf-resinType"
              name="resinType"
              value={state.resinType}
              onChange={(e) => set("resinType", e.target.value)}
            >
              {RESIN_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className="field-group">
        <legend>環境条件</legend>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="rf-tempC">造形温度</label>
            <div className="with-unit">
              <input
                id="rf-tempC"
                name="tempC"
                type="number"
                inputMode="decimal"
                step="0.5"
                className="tabular"
                value={state.tempC}
                placeholder="25"
                {...invalid("tempC")}
                onChange={(e) => set("tempC", e.target.value)}
              />
              <span className="unit" aria-hidden="true">
                °C
              </span>
            </div>
            <span className="field-hint">任意</span>
            {err("tempC")}
          </div>
          <div className="field">
            <label htmlFor="rf-fep">FEP状態</label>
            <select
              id="rf-fep"
              name="fep"
              value={state.fep}
              onChange={(e) => set("fep", e.target.value)}
            >
              {FEP_STATES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="rf-layer">レイヤー高</label>
            <div className="with-unit">
              <input
                id="rf-layer"
                name="layerHeightMm"
                type="number"
                inputMode="decimal"
                step="0.01"
                className="tabular"
                value={state.layerHeightMm}
                placeholder="0.05"
                {...invalid("layerHeightMm")}
                onChange={(e) => set("layerHeightMm", e.target.value)}
              />
              <span className="unit" aria-hidden="true">
                mm
              </span>
            </div>
            <span className="field-hint">任意・0.01〜0.30</span>
            {err("layerHeightMm")}
          </div>
        </div>
      </fieldset>

      <fieldset className="field-group">
        <legend>露光パラメータ</legend>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="rf-normal">
              normal 露光 <span aria-hidden="true">*</span>
            </label>
            <div className="with-unit">
              <input
                id="rf-normal"
                name="normalExposureS"
                ref={normalRef}
                type="number"
                inputMode="decimal"
                step="0.1"
                className="tabular"
                value={state.normalExposureS}
                placeholder="2.4"
                required
                {...invalid("normalExposureS")}
                onChange={(e) => set("normalExposureS", e.target.value)}
              />
              <span className="unit" aria-hidden="true">
                s
              </span>
            </div>
            {err("normalExposureS")}
          </div>
          <div className="field">
            <label htmlFor="rf-bottom">bottom 露光</label>
            <div className="with-unit">
              <input
                id="rf-bottom"
                name="bottomExposureS"
                type="number"
                inputMode="decimal"
                step="1"
                className="tabular"
                value={state.bottomExposureS}
                placeholder="28"
                {...invalid("bottomExposureS")}
                onChange={(e) => set("bottomExposureS", e.target.value)}
              />
              <span className="unit" aria-hidden="true">
                s
              </span>
            </div>
            <span className="field-hint">任意</span>
            {err("bottomExposureS")}
          </div>
          <div className="field">
            <label htmlFor="rf-bottomLayers">bottom 層数</label>
            <div className="with-unit">
              <input
                id="rf-bottomLayers"
                name="bottomLayers"
                type="number"
                inputMode="numeric"
                step="1"
                className="tabular"
                value={state.bottomLayers}
                placeholder="5"
                {...invalid("bottomLayers")}
                onChange={(e) => set("bottomLayers", e.target.value)}
              />
              <span className="unit" aria-hidden="true">
                層
              </span>
            </div>
            <span className="field-hint">任意</span>
            {err("bottomLayers")}
          </div>
          <div className="field">
            <label htmlFor="rf-lod">light-off delay</label>
            <div className="with-unit">
              <input
                id="rf-lod"
                name="lightOffDelayS"
                type="number"
                inputMode="decimal"
                step="0.1"
                className="tabular"
                value={state.lightOffDelayS}
                placeholder="0.5"
                {...invalid("lightOffDelayS")}
                onChange={(e) => set("lightOffDelayS", e.target.value)}
              />
              <span className="unit" aria-hidden="true">
                s
              </span>
            </div>
            <span className="field-hint">任意</span>
            {err("lightOffDelayS")}
          </div>
        </div>
      </fieldset>

      <fieldset className="field-group">
        <legend>メモ</legend>
        <div className="field">
          <label htmlFor="rf-note">自由メモ</label>
          <textarea
            id="rf-note"
            name="note"
            rows={2}
            value={state.note}
            placeholder="例: RERF で 2.2〜2.6s が良好。室温 25℃ の基準。"
            onChange={(e) => set("note", e.target.value)}
          />
          <span className="field-hint">任意</span>
        </div>
      </fieldset>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          <IconPlus />
          このプロファイルを保存
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setState(EMPTY);
            setErrors({});
            setTouched(false);
          }}
        >
          入力をクリア
        </button>
      </div>
    </form>
  );
}
