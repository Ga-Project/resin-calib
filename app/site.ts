import "server-only";

// 公開 URL の単一の出どころ。
//
// GitHub Pages のプロジェクトページ配信では公開 URL に /<slug> のサブパスが付く
// （next.config.mjs の PAGES_BASE_PATH と同じ値）。metadata の絶対 URL とサイトマップが
// これを取り違えると、ページ自体は表示できても共有カードの画像だけ 404 になる、といった
// ズレ方をする。両者が同じ定数を見るようにして食い違いを防ぐ。
// 末尾スラッシュが混ざると SITE_URL が "...//og.png" のように二重になるため落とす。
const BASE_PATH = (process.env.PAGES_BASE_PATH || "").replace(/\/$/, "");

/** 末尾スラッシュ付きの公開 URL（例: https://ga-project.github.io/resin-calib/）。 */
export const SITE_URL = `https://ga-project.github.io${BASE_PATH}/`;

// このモジュールはサーバー側（metadata / sitemap）専用。冒頭の `import "server-only"` により、
// client component から（間接的にでも・値を使わない副作用だけの import でも）読まれると
// ビルドが落ちる。実行時に throw する形だと、値が使われない場合に「throw だけがクライアント
// チャンクに残る」＝出力物の検査は緑のまま訪問者のブラウザで例外、という壊れ方をする。
// client component から import すると process.env が空に置換され、basePath を落とした
// 誤った URL（https://ga-project.github.io/og.png）が静かに出来上がる。
