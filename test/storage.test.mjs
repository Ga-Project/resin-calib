// resin-calib — 永続化ロジック（正規化 / シリアライズ / インポート）の回帰テスト。
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeProfile,
  parseProfiles,
  sampleProfiles,
  serializeProfiles,
} from "../app/lib/storage.mjs";

const valid = {
  id: "a",
  createdAt: 1000,
  printer: "Elegoo Mars 4",
  resin: "Standard Grey",
  resinType: "スタンダード",
  tempC: 25,
  fep: "新品",
  layerHeightMm: 0.05,
  normalExposureS: 2.4,
  bottomExposureS: 28,
  bottomLayers: 5,
  lightOffDelayS: 0.5,
  note: "メモ",
};

test("normalizeProfile: 正常データを正規化する", () => {
  const p = normalizeProfile(valid);
  assert.ok(p);
  assert.equal(p.printer, "Elegoo Mars 4");
  assert.equal(p.normalExposureS, 2.4);
  assert.equal(p.tempC, 25);
});

test("normalizeProfile: 必須欠落（printer/resin/normal>0）は null", () => {
  assert.equal(normalizeProfile({ ...valid, printer: "" }), null);
  assert.equal(normalizeProfile({ ...valid, resin: "   " }), null);
  assert.equal(normalizeProfile({ ...valid, normalExposureS: 0 }), null);
  assert.equal(normalizeProfile({ ...valid, normalExposureS: "x" }), null);
  assert.equal(normalizeProfile(null), null);
  assert.equal(normalizeProfile("nope"), null);
});

test("normalizeProfile: 任意の数値は空なら null に正規化", () => {
  const p = normalizeProfile({ printer: "P", resin: "R", normalExposureS: 2 });
  assert.ok(p);
  assert.equal(p.tempC, null);
  assert.equal(p.layerHeightMm, null);
  assert.equal(p.bottomExposureS, null);
  assert.equal(p.note, "");
});

test("normalizeProfile: 文字列の数値も受け入れる", () => {
  const p = normalizeProfile({
    printer: "P",
    resin: "R",
    normalExposureS: "2.4",
    tempC: "25",
  });
  assert.ok(p);
  assert.equal(p.normalExposureS, 2.4);
  assert.equal(p.tempC, 25);
});

test("serialize → parse でラウンドトリップできる", () => {
  const json = serializeProfiles([valid]);
  const r = parseProfiles(json);
  assert.equal(r.ok, true);
  assert.equal(r.profiles.length, 1);
  assert.equal(r.profiles[0].printer, "Elegoo Mars 4");
});

test("parseProfiles: 素の配列も受け付ける", () => {
  const r = parseProfiles(JSON.stringify([valid]));
  assert.equal(r.ok, true);
  assert.equal(r.profiles.length, 1);
});

test("parseProfiles: 壊れた JSON はエラー", () => {
  const r = parseProfiles("{ not json");
  assert.equal(r.ok, false);
});

test("parseProfiles: 空文字はエラー", () => {
  assert.equal(parseProfiles("").ok, false);
  assert.equal(parseProfiles("   ").ok, false);
});

test("parseProfiles: profiles 配列が無い形はエラー", () => {
  const r = parseProfiles(JSON.stringify({ foo: "bar" }));
  assert.equal(r.ok, false);
});

test("parseProfiles: 不正要素は skipped に数えて有効分のみ返す", () => {
  const r = parseProfiles(
    JSON.stringify({ profiles: [valid, { printer: "", resin: "" }] }),
  );
  assert.equal(r.ok, true);
  assert.equal(r.profiles.length, 1);
  assert.equal(r.skipped, 1);
});

test("parseProfiles: 有効要素ゼロはエラー", () => {
  const r = parseProfiles(JSON.stringify({ profiles: [{ printer: "" }] }));
  assert.equal(r.ok, false);
});

test("sampleProfiles: 2件・必須を満たす決定論データ", () => {
  const s = sampleProfiles();
  assert.equal(s.length, 2);
  for (const p of s) {
    assert.ok(normalizeProfile(p), "sample は normalizeProfile を通る");
  }
});
