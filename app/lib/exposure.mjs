// resin-calib — 露光推定の純粋ロジック（UI 非依存・副作用なし）。
// React コンポーネントと node:test の双方から import される。
// ここには DOM / localStorage / Date など環境依存を持ち込まない（テスト可能性のため）。

/**
 * @typedef {"under" | "good" | "over"} CureState
 *   未硬化 / 良好 / 過硬化。RERF（露光テスト）の各段の判定。
 */

/**
 * @typedef {Object} RerfStep
 * @property {number} exposureS その段の露光時間（秒）
 * @property {CureState} state その段の硬化状態
 */

/**
 * @typedef {Object} GoodBand
 * @property {number} loS 良好域の下限露光（秒）
 * @property {number} hiS 良好域の上限露光（秒）
 */

/**
 * @typedef {Object} EstimateResult
 * @property {"ok" | "no-good" | "all-under" | "all-over" | "empty"} status
 * @property {number | null} recommendedS 推奨 normal 露光（秒）。算出不能なら null
 * @property {GoodBand | null} goodBand 良好と判定された段の露光レンジ
 * @property {boolean} contiguous 良好段が露光順に連続しているか（飛び石なら false）
 * @property {string} message 利用者向けの日本語説明
 */

/**
 * RERF テスト条件から各段の露光時間（秒）を生成する。
 * 段 i（0 始まり）の露光 = base + i * increment。
 *
 * @param {number} baseS 1 段目（最短）の露光時間（秒）
 * @param {number} incrementS 1 段あたりの増分（秒）
 * @param {number} count 段数
 * @returns {number[]} 露光時間（秒）の配列。引数が不正なら空配列
 */
export function buildSteps(baseS, incrementS, count) {
  if (
    !Number.isFinite(baseS) ||
    !Number.isFinite(incrementS) ||
    !Number.isInteger(count) ||
    baseS < 0 ||
    incrementS <= 0 ||
    count <= 0 ||
    count > 60
  ) {
    return [];
  }
  const steps = [];
  for (let i = 0; i < count; i += 1) {
    // 浮動小数の誤差を抑えるため小数第 2 位で丸める（露光は 0.01s 粒度で十分）。
    steps.push(Math.round((baseS + i * incrementS) * 100) / 100);
  }
  return steps;
}

/**
 * RERF の段判定から推奨露光時間を推定する。
 * 方針: 「確実に硬化した中で最も短い露光」を推奨する（光造形では過不足のない最短露光が
 * ディテール保持に有利なため）。良好域とその連続性も併せて返す。
 *
 * @param {RerfStep[]} steps 露光時間と硬化状態の配列（順不同で可）
 * @returns {EstimateResult}
 */
export function estimateExposure(steps) {
  if (!Array.isArray(steps) || steps.length === 0) {
    return {
      status: "empty",
      recommendedS: null,
      goodBand: null,
      contiguous: false,
      message: "段の判定がありません。各段の硬化状態を入力してください。",
    };
  }

  // 露光の昇順に並べ替えてから評価する（飛び石判定のため位置を固定する）。
  const sorted = [...steps]
    .filter((s) => s && Number.isFinite(s.exposureS))
    .sort((a, b) => a.exposureS - b.exposureS);

  if (sorted.length === 0) {
    return {
      status: "empty",
      recommendedS: null,
      goodBand: null,
      contiguous: false,
      message: "有効な段がありません。露光時間を確認してください。",
    };
  }

  const goodIndices = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (sorted[i].state === "good") goodIndices.push(i);
  }

  if (goodIndices.length === 0) {
    const allUnder = sorted.every((s) => s.state === "under");
    const allOver = sorted.every((s) => s.state === "over");
    if (allUnder) {
      return {
        status: "all-under",
        recommendedS: null,
        goodBand: null,
        contiguous: false,
        message:
          "すべての段が未硬化です。基準露光・増分を上げて、より長い露光で再テストしてください。",
      };
    }
    if (allOver) {
      return {
        status: "all-over",
        recommendedS: null,
        goodBand: null,
        contiguous: false,
        message:
          "すべての段が過硬化です。基準露光を下げて、より短い露光で再テストしてください。",
      };
    }
    return {
      status: "no-good",
      recommendedS: null,
      goodBand: null,
      contiguous: false,
      message:
        "良好と判定された段がありません。未硬化と過硬化の間を細かく刻んで再テストしてください。",
    };
  }

  const firstGood = goodIndices[0];
  const lastGood = goodIndices[goodIndices.length - 1];
  const contiguous = lastGood - firstGood + 1 === goodIndices.length;

  const recommendedS = sorted[firstGood].exposureS;
  const goodBand = {
    loS: sorted[firstGood].exposureS,
    hiS: sorted[lastGood].exposureS,
  };

  const message = contiguous
    ? "良好域の下限（最も短く確実に硬化した段）を推奨露光としています。"
    : "良好な段が飛び石になっています。判定を見直すか、刻みを細かくして再テストすると安定します。下限の良好段を推奨値としています。";

  return {
    status: "ok",
    recommendedS,
    goodBand,
    contiguous,
    message,
  };
}
