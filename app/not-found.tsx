// resin-calib — 404 ページ（web テンプレ）。
// Next 既定の英語・無スタイル 404 ではなく、共通デザイン基盤を当てた日本語の 404。
// static export（output: "export"）では out/404.html に書き出され、GitHub Pages の 404 になる。
// page.tsx と同じランドマーク（header / main / footer）・h1 は1つ・skip-link を持つ。

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ページが見つかりません — resin-calib",
  // 404 は検索インデックス対象外にする（誤ってインデックスされないように）。
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <a className="skip-link" href="#main">
        本文へスキップ
      </a>

      <header className="site-header">
        <div className="container">
          <Link className="brand" href="/">
            <span className="brand-mark" aria-hidden="true">
              R
            </span>
            <span>レジンキャリブ</span>
          </Link>
        </div>
      </header>

      <main id="main" tabIndex={-1} style={{ outline: "none" }}>
        <section className="hero">
          <div className="container container-narrow">
            <span className="badge badge-accent">404</span>
            <h1 style={{ marginTop: "var(--sp-4)" }}>
              ページが<span className="accent-text">見つかりません</span>
            </h1>
            <p className="hero-lead">
              お探しのページは見つかりませんでした。移動・削除されたか、URL
              が誤っている可能性があります。
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/">
                ホームへ戻る
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>© レジンキャリブ（resin-calib）</p>
        </div>
      </footer>
    </>
  );
}
