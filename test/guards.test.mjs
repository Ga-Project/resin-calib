// 静かに壊れる種類の失敗を、書き出した out/ で捕まえる。
//
// ソースを grep する検査では、書き方（クォート・エイリアス・動的 import・中間モジュール経由）を
// 変えるだけで素通りしてしまう。ここでは実際に配信されるファイルを見るので、
// 書き方に関係なく結果だけで判定できる。
//
// **先に `pnpm build` を実行しておくこと。** out/ が無ければこのファイルは失敗する
// （「ビルドしていないから緑」になると、検査が存在しないのと同じになるため）。

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "out");

function requireBuild() {
  assert.ok(
    existsSync(join(OUT, "index.html")),
    "out/index.html がありません。先に `pnpm build` を実行してください。",
  );
}

const indexHtml = () => readFileSync(join(OUT, "index.html"), "utf8");

/** out/ 配下の該当拡張子のファイルを再帰的に集める。 */
function outFiles(re, dir) {
  const found = [];
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) found.push(...outFiles(re, abs));
    else if (re.test(name)) found.push(abs);
  }
  return found;
}

/** HTML から JSON-LD ブロックだけを取り出す。 */
function jsonLdBlocks(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) =>
    JSON.parse(m[1]),
  );
}

// --- サーバー専用モジュールがクライアントへ漏れていないこと ---------------
// app/site.ts は公開 URL を process.env から組む。client component から（間接的にでも）
// 読まれるとクライアントバンドルに入り、basePath を落とした URL が静かに出来上がる。
// 「クライアント JS に公開 URL が焼かれていないか」で見れば、経路に依存せず判定できる。
test("クライアントバンドルに公開 URL が焼き込まれていない", () => {
  requireBuild();
  const scripts = outFiles(/\.js$/, join(OUT, "_next"));
  assert.ok(scripts.length > 0, "out/_next にクライアントスクリプトがありません");
  const leaked = scripts
    .filter((f) => readFileSync(f, "utf8").includes("ga-project.github.io"))
    .map((f) => f.slice(OUT.length + 1));
  assert.deepEqual(
    leaked,
    [],
    `公開 URL がクライアントバンドルに漏れています: ${leaked.join(", ")}`,
  );
});

// --- 共有カードが実在し、絶対 URL で解決されていること ---------------------
// og:image が相対のままだと SNS 側で解決できず、画像なしの小カードに落ちる。
// basePath を落とした絶対 URL（.../og.png）も同様に 404 になる。
test("og:image が basePath 込みの絶対 URL で、実体が out/ にある", () => {
  requireBuild();
  const html = indexHtml();
  const og = html.match(/property="og:image"\s+content="([^"]+)"/)?.[1];
  assert.ok(og, "og:image が出力されていません");
  assert.equal(
    og,
    "https://ga-project.github.io/resin-calib/og.png",
    "og:image が basePath 込みの絶対 URL になっていません",
  );
  assert.ok(existsSync(join(OUT, "og.png")), "out/og.png がありません");
});

test("共有カードは画像付きの大きなカードで出る", () => {
  requireBuild();
  assert.match(
    indexHtml(),
    /name="twitter:card"\s+content="summary_large_image"/,
    "twitter:card が summary_large_image ではありません（画像なしの小カードになります）",
  );
});

// --- 書き出した PNG が原版と同期していること -------------------------------
// og-card.html を直したのに ./scripts/og-card.sh を流し忘れると、古い PNG が
// 公開され続ける。PNG は macOS のフォントに依存し CI で再生成できないので、
// 原版のハッシュを突き合わせて「書き出し忘れ」だけを検出する。
test("public/og.png が scripts/og-card.html の現在の内容から書き出されている", () => {
  const recorded = readFileSync(join(ROOT, "scripts/og-card.html.sha256"), "utf8").trim();
  const actual = createHash("sha256")
    .update(readFileSync(join(ROOT, "scripts/og-card.html")))
    .digest("hex");
  assert.equal(
    actual,
    recorded,
    "og-card.html が変更されています。./scripts/og-card.sh を実行し public/og.png を一緒にコミットしてください。",
  );
});

// --- サイトマップ -----------------------------------------------------------
test("sitemap.xml が canonical と同じ URL を指している", () => {
  requireBuild();
  const sitemapPath = join(OUT, "sitemap.xml");
  assert.ok(existsSync(sitemapPath), "out/sitemap.xml がありません");
  const xml = readFileSync(sitemapPath, "utf8");
  const loc = xml.match(/<loc>([^<]+)<\/loc>/)?.[1];
  assert.equal(loc, "https://ga-project.github.io/resin-calib/");

  const canonical = indexHtml().match(/rel="canonical"\s+href="([^"]+)"/)?.[1];
  assert.equal(loc, canonical, "sitemap の URL と canonical が食い違っています");
});

// --- 構造化データ -----------------------------------------------------------
// 画面と構造化データがズレると、検索結果にだけ嘘が出る。値の出どころを揃えているか
// 見るのではなく、書き出された両方を突き合わせて判定する。
test("JSON-LD が1件あり、canonical・og:image と同じ URL を指す", () => {
  requireBuild();
  const html = indexHtml();
  const blocks = jsonLdBlocks(html);
  assert.equal(blocks.length, 1, "JSON-LD が 1 件ではありません");
  const ld = blocks[0];
  assert.equal(ld["@type"], "WebApplication");
  assert.equal(ld.url, html.match(/rel="canonical"\s+href="([^"]+)"/)?.[1]);
  assert.equal(ld.image, html.match(/property="og:image"\s+content="([^"]+)"/)?.[1]);
});

test("JSON-LD が無料であると明示している（画面の表示と一致）", () => {
  requireBuild();
  const html = indexHtml();
  // 画面側が「無料」を名乗っている以上、構造化データの offers も 0 でなければ齟齬になる。
  assert.match(html, /無料/, "画面に「無料」の表示がありません");
  const ld = jsonLdBlocks(html)[0];
  assert.equal(ld.offers.price, "0");
  assert.equal(ld.offers.priceCurrency, "JPY");
});

test("JSON-LD が script を閉じる文字列を含まない", () => {
  requireBuild();
  // "</script>" が素通りすると script 要素がそこで閉じ、以降が HTML として解釈される。
  const raw = indexHtml().match(
    /<script type="application\/ld\+json">(.*?)<\/script>/s,
  )?.[1];
  assert.ok(raw);
  assert.ok(!raw.includes("<"), "JSON-LD 内の < がエスケープされていません");
});

// --- 計測タグ ---------------------------------------------------------------
// 公開ビルドで計測が落ちると、流入の有無を判断する材料そのものが消える。
test("公開ビルドに GoatCounter のカウントタグが載っている", () => {
  requireBuild();
  assert.match(indexHtml(), /data-goatcounter="https:\/\/[a-z0-9-]+\.goatcounter\.com\/count"/);
});
