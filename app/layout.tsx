import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
// 製品の "顔"（accent/neutral/radius/font/density）はここで上書きする。
// globals.css の後に読み込むこと（後勝ちで :root トークンを上書きするため）。
import "./theme.css";
// この製品固有のコンポーネント追加スタイル（構造クラスは上書きせず、新規 UI のみ）。
import "./ui.css";

const TITLE = "レジンキャリブ — 光造形3Dプリント 露光時間 記録＆推奨ツール";
const DESCRIPTION =
  "光造形（LCD/MSLA）3Dプリンタの最適露光時間を、機種×レジン×造形温度×FEPの状態ごとに記録。RERF露光テストの結果から推奨露光時間を割り出し、過去のプロファイルと比較できます。端末内保存・登録不要・無料。Resin exposure calculator & RERF profile manager.";

// SEO/OGP。metadataBase は公開 URL が決まったら設定する（OGP 画像の絶対 URL 解決に使う）。
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "光造形",
    "レジン",
    "露光時間",
    "RERF",
    "3Dプリンタ",
    "キャリブレーション",
    "resin exposure",
    "exposure calculator",
    "LCD MSLA",
    "resin profile",
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    locale: "ja_JP",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        {children}
        {/*
          analytics（cookieless・秘密キー不要）。NEXT_PUBLIC_GOATCOUNTER_CODE を
          設定したビルドでのみ GoatCounter のカウントタグを出力する。未設定なら
          タグは出ず計測は無効（ローカル/コンソール配信では未設定でクリーン）。
        */}
        {process.env.NEXT_PUBLIC_GOATCOUNTER_CODE ? (
          <script
            data-goatcounter={`https://${process.env.NEXT_PUBLIC_GOATCOUNTER_CODE}.goatcounter.com/count`}
            async
            src="//gc.zgo.at/count.js"
          />
        ) : null}
      </body>
    </html>
  );
}
