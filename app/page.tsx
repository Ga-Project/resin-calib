// resin-calib — トップページ。共通デザイン基盤（globals.css）＋製品の顔（theme.css）の上に、
// ランディング（header / hero / footer）と実機能ツール（ResinCalibTool・client）を載せる。
// セマンティックランドマーク（header / main / footer）・h1 は1つ・skip-link を持つ。
import Link from "next/link";
import { ResinCalibTool } from "./components/ResinCalibTool";

export default function Home() {
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
          <nav className="header-nav" aria-label="セクション">
            <a className="btn btn-ghost" href="#record">
              記録
            </a>
            <a className="btn btn-ghost" href="#rerf">
              推定
            </a>
            <a className="btn btn-ghost" href="#profiles">
              一覧
            </a>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1} style={{ outline: "none" }}>
        <section className="hero">
          <div className="container">
            <span className="eyebrow">露光時間 記録 &amp; 推奨ツール</span>
            <h1>
              露光の<span className="accent-text">最適解</span>
              を、勘で探さない。
            </h1>
            <p className="hero-lead">
              機種 × レジン × 造形温度 × FEP の状態ごとに、露光条件を記録。RERF
              露光テストの結果から推奨露光時間を割り出し、過去のプロファイルと並べて比較できます。
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary btn-lg" href="#record">
                プロファイルを記録
              </a>
              <a className="btn btn-secondary btn-lg" href="#rerf">
                露光テストから推定
              </a>
            </div>
            <p className="hero-note">
              データは端末に保存・外部送信なし ・ 登録不要 ・ 無料
            </p>
          </div>
        </section>

        <div className="container">
          <ResinCalibTool />
        </div>
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-notes">
            <p>
              <strong>推奨露光値について：</strong>
              推奨露光値は、入力されたテスト結果から機械的に算出した参考情報です。レジン・機種・環境により最適値は変動するため、最終的な露光設定はご自身の判断と責任で調整してください。
            </p>
            <p>
              <strong>プライバシー：</strong>
              入力したデータはお使いの端末（ブラウザ）内にのみ保存され、外部のサーバーには送信されません。ブラウザのデータを消去すると失われるため、定期的な書き出し（バックアップ）をおすすめします。
            </p>
            <p>
              <strong>商標：</strong>
              記載の機種名・レジン製品名は各社の商標です。本ツールは各メーカーと提携・関連するものではありません。
            </p>
          </div>
          <p className="footer-copy">© レジンキャリブ（resin-calib）</p>
        </div>
      </footer>
    </>
  );
}
