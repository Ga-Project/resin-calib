# レジンキャリブ（resin-calib）

光造形（LCD/MSLA）3D プリンタの露光時間を記録・推定するツール。
機種・レジン・造形温度・FEP の状態ごとに露光プロファイルを残し、RERF（露光テスト）の
結果から推奨露光時間を割り出して、過去のプロファイルと並べて比較する。

記録は端末内（localStorage）に保存し、外部へ送信しない。登録不要・無料。
Next.js 14（App Router）の static export（`out/` に静的書き出し）でサーバランタイムを持たない。

公開先: <https://ga-project.github.io/resin-calib/>

## セットアップ & 開発

```bash
./setup.sh                 # pnpm install
pnpm dev                   # http://localhost:3000（ホットリロード）
```

## ビルド（static export）

```bash
pnpm build                 # next build → out/ に静的 HTML/CSS/JS を生成
./run.sh serve             # out/ をビルドしてローカル配信
```

`out/` がそのまま配信物。`next start`（サーバ常駐）は使わない。

公開ビルドだけ環境変数を 2 つ渡す（CI が設定する）。手元で公開と同じ出力を得たいときは同じ値を使う。

```bash
PAGES_BASE_PATH=/resin-calib NEXT_PUBLIC_GOATCOUNTER_CODE=ga-project pnpm build
```

- `PAGES_BASE_PATH` … プロジェクトページ（`<owner>.github.io/resin-calib/`）のサブパス。
  未設定だと `/_next/...` をルートから取りに行って全アセットが 404 になる。
- `NEXT_PUBLIC_GOATCOUNTER_CODE` … cookieless の計測タグ。未設定ならタグは出力されない。

## テスト

```bash
pnpm verify                # 公開と同じ env でビルドしてから全テストを走らせる
```

`test/guards.test.mjs` は書き出した `out/` を検査するので、**ビルドが先に要る**
（`out/` が無ければ「ビルドしていないから緑」にならないよう、明示的に失敗する）。

素の `pnpm build && pnpm test` は使わない。`PAGES_BASE_PATH` を渡さずにビルドすると
公開 URL から `/resin-calib` が落ち、計測タグも出ないため、**製品は壊れていないのに
検査だけが赤くなる**（og:image・sitemap と canonical の一致・計測タグの3件）。
手元は `pnpm verify` 一本で CI と同じ検査（typecheck → lint → build → test）を通す。
CI はこれに `secret scan` を先頭で足し、どの検査で落ちたかが Actions 上で切り分けられる
よう、同じ内容を段階に分けて実行する。どれかが落ちれば公開へ進まない。

テストは `test/*.test.mjs` だけが走る。この命名から外れたファイルは黙って実行されない。

- `test/exposure.test.mjs` … RERF からの推奨露光時間の推定ロジック
- `test/storage.test.mjs` … 永続化（正規化 / シリアライズ / インポート）
- `test/smoke.test.mjs` … 最小の健全性
- `test/guards.test.mjs` … 静かに壊れる失敗を `out/` で検出する
  （公開 URL のクライアントバンドルへの漏れ／共有カードの絶対 URL と実体／原版と
  書き出した PNG のズレ／sitemap と canonical の食い違い／構造化データと画面の齟齬／
  計測タグの消失）

## 共有カード（og:image）

リンクを共有したときのカード画像は `public/og.png`。原版は `scripts/og-card.html` で、
書き出しは次のコマンド。

```bash
./scripts/og-card.sh       # 原版 → public/og.png（1200×630）
```

原版を直したら必ずこれを流し、書き出した PNG も一緒にコミットする（配信されるのは
コミットされた PNG そのもの）。書き出し忘れは `test/guards.test.mjs` が原版のハッシュ
（`scripts/og-card.html.sha256`）とのズレとして検出する。書き出し前にレイアウト検査
（はみ出し・主要ブロックの重なり・枠外）が走り、壊れていれば書き出さずに落ちる。

## デプロイ

GitHub Pages（GitHub Actions で自動デプロイ）。`.github/workflows/pages.yml` が `main` への
push で `secret scan → typecheck → lint → build → test → Pages 公開` を直列に流す。
途中で落ちれば公開へ進まない。

## 構成

```
resin-calib/
├─ app/
│  ├─ page.tsx              # ランディング（hero / 各セクション）＋ ツール本体の設置
│  ├─ layout.tsx            # SEO/OGP メタ・構造化データ・計測タグ
│  ├─ site.ts               # 公開 URL の単一の出どころ（server-only）
│  ├─ sitemap.ts            # sitemap.xml（build 時に out/ へ書き出す）
│  ├─ not-found.tsx         # 404 ページ
│  ├─ components/           # RecordForm / RerfEstimator / ProfileList / ResinCalibTool
│  ├─ lib/                  # exposure（推定ロジック）/ storage（永続化）/ types
│  ├─ globals.css           # 共通デザイン基盤（トークン + ベーススタイル・light/dark・a11y）
│  ├─ theme.css             # この製品の顔（UV バイオレット・寒色スレート・計器的な角）
│  └─ ui.css                # この製品固有のコンポーネント追加スタイル
├─ lib/json-ld.mjs          # 構造化データを script の中身として安全に書き出す
├─ public/og.png            # 共有カード（scripts/og-card.html から書き出す）
├─ scripts/og-card.{html,sh}# 共有カードの原版と書き出し
├─ test/                    # node:test（追加の依存なし）
├─ next.config.mjs          # output: "export" / basePath（PAGES_BASE_PATH）
└─ .github/workflows/       # pages.yml
```

## デザイン

`app/globals.css`（共通の構造・コンポーネント・a11y）の上に `app/theme.css`（この製品の顔）を
重ねる 2 層構成。個性はトークンで出し、構造クラス（`.btn` / `.card` / `.hero` …）の見た目は
個別 CSS で書き換えない。

この製品は 405nm の UV 硬化を象徴する **UV バイオレット/オーキッド**（`--accent-h: 288`）に、
ごく僅かに紫を含む寒色スレート（`--neutral-hue: 250`）と、計器的に締めた角
（`--radius: 10px`）・やや高い情報密度（`--density: 0.95`）を合わせている。
light / dark 双方で WCAG AA を満たす L 値を実測して選んである（詳細は `theme.css` 冒頭）。

## 免責

推奨露光値は記録と RERF 結果から算出した**参考情報**であり、最終的な造形設定の調整と
その結果は利用者の責任による。

## 秘密情報

static export は実行時サーバを持たないため、サーバ秘密は原則不要。
将来 env が要るときのために age recipient 分離の枠組みだけ維持している。

- 公開鍵: `age.recipient`（コミット可）
- 復号鍵: リポジトリ外のローカル鍵ストアに置く（**repo 外**・コミット厳禁）
- 正本: `secrets.age`（暗号文・通常は空の `.env.age.example` を暗号化しただけ・コミット可）
