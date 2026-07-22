// resin-calib — 露光推定ロジックの回帰テスト（node:test・追加依存なし）。
// 実行: pnpm test (= node --test)
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSteps, estimateExposure } from "../app/lib/exposure.mjs";

test("buildSteps: base + i*increment を生成する", () => {
  assert.deepEqual(buildSteps(1.6, 0.2, 4), [1.6, 1.8, 2.0, 2.2]);
});

test("buildSteps: 浮動小数の誤差を 0.01 粒度で丸める", () => {
  // 1.1 + 0.1 が 1.2000000000000002 にならないこと
  assert.deepEqual(buildSteps(1.1, 0.1, 3), [1.1, 1.2, 1.3]);
});

test("buildSteps: 不正入力では空配列を返す", () => {
  assert.deepEqual(buildSteps(-1, 0.2, 4), []);
  assert.deepEqual(buildSteps(1, 0, 4), []);
  assert.deepEqual(buildSteps(1, 0.2, 0), []);
  assert.deepEqual(buildSteps(1, 0.2, 3.5), []);
  assert.deepEqual(buildSteps(1, 0.2, 100), []); // 段数上限超過
  assert.deepEqual(buildSteps(Number.NaN, 0.2, 4), []);
});

test("estimateExposure: 空入力は empty", () => {
  const r = estimateExposure([]);
  assert.equal(r.status, "empty");
  assert.equal(r.recommendedS, null);
});

test("estimateExposure: 全段未硬化は all-under", () => {
  const r = estimateExposure([
    { exposureS: 1.6, state: "under" },
    { exposureS: 1.8, state: "under" },
  ]);
  assert.equal(r.status, "all-under");
  assert.equal(r.recommendedS, null);
});

test("estimateExposure: 全段過硬化は all-over", () => {
  const r = estimateExposure([
    { exposureS: 3.0, state: "over" },
    { exposureS: 3.2, state: "over" },
  ]);
  assert.equal(r.status, "all-over");
  assert.equal(r.recommendedS, null);
});

test("estimateExposure: under と over だけで good が無いと no-good", () => {
  const r = estimateExposure([
    { exposureS: 1.6, state: "under" },
    { exposureS: 3.2, state: "over" },
  ]);
  assert.equal(r.status, "no-good");
  assert.equal(r.recommendedS, null);
});

test("estimateExposure: 良好域の下限（最短）を推奨する", () => {
  const r = estimateExposure([
    { exposureS: 1.6, state: "under" },
    { exposureS: 2.0, state: "good" },
    { exposureS: 2.4, state: "good" },
    { exposureS: 2.8, state: "over" },
  ]);
  assert.equal(r.status, "ok");
  assert.equal(r.recommendedS, 2.0);
  assert.deepEqual(r.goodBand, { loS: 2.0, hiS: 2.4 });
  assert.equal(r.contiguous, true);
});

test("estimateExposure: 入力順がばらばらでも露光昇順で評価する", () => {
  const r = estimateExposure([
    { exposureS: 2.8, state: "over" },
    { exposureS: 2.4, state: "good" },
    { exposureS: 1.6, state: "under" },
    { exposureS: 2.0, state: "good" },
  ]);
  assert.equal(r.recommendedS, 2.0);
});

test("estimateExposure: 良好段が飛び石なら contiguous=false でも下限を推奨", () => {
  const r = estimateExposure([
    { exposureS: 1.6, state: "good" },
    { exposureS: 2.0, state: "over" },
    { exposureS: 2.4, state: "good" },
  ]);
  assert.equal(r.status, "ok");
  assert.equal(r.recommendedS, 1.6);
  assert.equal(r.contiguous, false);
});

test("buildSteps: 段数 60（境界 OK 側）は 60 要素を返す", () => {
  const steps = buildSteps(1, 0.1, 60);
  assert.equal(steps.length, 60);
  assert.equal(steps[0], 1);
  assert.equal(steps[59], 6.9);
});

test("estimateExposure: 非有限な exposure の段は除外して評価する", () => {
  const r = estimateExposure([
    { exposureS: Number.NaN, state: "good" },
    { exposureS: 2.0, state: "good" },
    { exposureS: 2.4, state: "over" },
  ]);
  assert.equal(r.status, "ok");
  assert.equal(r.recommendedS, 2.0);
});
