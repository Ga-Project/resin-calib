// resin-calib — プロファイルの永続化に関する純粋ロジック（シリアライズ / 検証 / サンプル）。
// localStorage への読み書き自体はコンポーネント側で行い、ここは「値の変換と検証」だけを担う。
// Date / Math.random / DOM を持ち込まない（決定論的でテスト可能に保つ）。

/**
 * @typedef {Object} Profile
 * @property {string} id 一意キー（空文字なら呼び出し側で採番）
 * @property {number} createdAt 作成時刻（epoch ms）
 * @property {string} printer 機種名（必須）
 * @property {string} resin レジン製品名（必須）
 * @property {string} resinType レジン種別
 * @property {number | null} tempC 造形温度（℃）
 * @property {string} fep FEP フィルム状態
 * @property {number | null} layerHeightMm レイヤー高（mm）
 * @property {number} normalExposureS normal 露光（秒・必須・>0）
 * @property {number | null} bottomExposureS bottom 露光（秒）
 * @property {number | null} bottomLayers bottom 層数
 * @property {number | null} lightOffDelayS light-off delay（秒）
 * @property {string} note 自由メモ
 */

const SCHEMA_VERSION = 1;

/** @param {unknown} v @returns {string} */
function asString(v) {
  return typeof v === "string" ? v : "";
}

/**
 * 有限数なら number、そうでなければ null に正規化する。
 * @param {unknown} v
 * @returns {number | null}
 */
function asNumOrNull(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/**
 * 任意の生オブジェクトを Profile に正規化する。必須項目を満たさなければ null。
 * 必須: printer（非空）・resin（非空）・normalExposureS（>0 の有限数）。
 *
 * @param {unknown} raw
 * @returns {Profile | null}
 */
export function normalizeProfile(raw) {
  if (!raw || typeof raw !== "object") return null;
  const o = /** @type {Record<string, unknown>} */ (raw);

  const printer = asString(o.printer).trim();
  const resin = asString(o.resin).trim();
  const normalExposureS = asNumOrNull(o.normalExposureS);

  if (
    printer === "" ||
    resin === "" ||
    normalExposureS === null ||
    normalExposureS <= 0
  ) {
    return null;
  }

  const createdAt =
    typeof o.createdAt === "number" && Number.isFinite(o.createdAt)
      ? o.createdAt
      : 0;

  return {
    id: asString(o.id),
    createdAt,
    printer,
    resin,
    resinType: asString(o.resinType),
    tempC: asNumOrNull(o.tempC),
    fep: asString(o.fep),
    layerHeightMm: asNumOrNull(o.layerHeightMm),
    normalExposureS,
    bottomExposureS: asNumOrNull(o.bottomExposureS),
    bottomLayers: asNumOrNull(o.bottomLayers),
    lightOffDelayS: asNumOrNull(o.lightOffDelayS),
    note: asString(o.note),
  };
}

/**
 * プロファイル配列をエクスポート用 JSON 文字列にする。
 * @param {Profile[]} profiles
 * @returns {string}
 */
export function serializeProfiles(profiles) {
  const safe = Array.isArray(profiles) ? profiles : [];
  return JSON.stringify(
    { app: "resin-calib", version: SCHEMA_VERSION, profiles: safe },
    null,
    2,
  );
}

/**
 * @typedef {Object} ParseOk
 * @property {true} ok
 * @property {Profile[]} profiles 正規化済みプロファイル
 * @property {number} skipped 必須項目を満たさず除外した件数
 */
/**
 * @typedef {Object} ParseErr
 * @property {false} ok
 * @property {string} error 利用者向けの日本語メッセージ
 */

/**
 * エクスポートした JSON（または素のプロファイル配列）を読み戻す。
 * - { profiles: [...] } 形式と、素の [...] 配列の両方を受け付ける。
 * - 各要素は normalizeProfile を通し、必須を満たさない要素は skipped に数えて捨てる。
 *
 * @param {string} jsonText
 * @returns {ParseOk | ParseErr}
 */
export function parseProfiles(jsonText) {
  if (typeof jsonText !== "string" || jsonText.trim() === "") {
    return { ok: false, error: "ファイルが空です。" };
  }

  let data;
  try {
    data = JSON.parse(jsonText);
  } catch {
    return {
      ok: false,
      error:
        "JSON として読み取れませんでした。書き出したファイルか確認してください。",
    };
  }

  let list;
  if (Array.isArray(data)) {
    list = data;
  } else if (data && typeof data === "object" && Array.isArray(data.profiles)) {
    list = data.profiles;
  } else {
    return {
      ok: false,
      error:
        "プロファイルの配列が見つかりません。このアプリで書き出したファイルを選んでください。",
    };
  }

  const profiles = [];
  let skipped = 0;
  for (const item of list) {
    const p = normalizeProfile(item);
    if (p) profiles.push(p);
    else skipped += 1;
  }

  if (profiles.length === 0) {
    return { ok: false, error: "読み込めるプロファイルがありませんでした。" };
  }

  return { ok: true, profiles, skipped };
}

/**
 * 初回の空状態で「サンプルを読み込む」用の代表データ（決定論的・固定値）。
 * 実在の代表機種を例示しつつ、値は一般的なレンジに留める（メーカー公称ではない参考値）。
 * @returns {Profile[]}
 */
export function sampleProfiles() {
  return [
    {
      id: "sample-elegoo-mars4-standard",
      createdAt: 1717200000000,
      printer: "Elegoo Mars 4 Ultra",
      resin: "Elegoo Standard Grey",
      resinType: "スタンダード",
      tempC: 25,
      fep: "新品",
      layerHeightMm: 0.05,
      normalExposureS: 2.4,
      bottomExposureS: 28,
      bottomLayers: 5,
      lightOffDelayS: 0.5,
      note: "RERF で 2.2〜2.6s が良好。室温 25℃ の基準プロファイル。",
    },
    {
      id: "sample-anycubic-m5s-abslike",
      createdAt: 1717203600000,
      printer: "Anycubic Photon Mono M5s",
      resin: "Anycubic ABS-Like V2 Black",
      resinType: "ABS-like",
      tempC: 22,
      fep: "良好",
      layerHeightMm: 0.05,
      normalExposureS: 1.8,
      bottomExposureS: 24,
      bottomLayers: 6,
      lightOffDelayS: 0.5,
      note: "冬場（22℃）はやや長め。夏は 1.6s 前後まで短縮できる。",
    },
  ];
}
