import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
// 製品の "顔"（accent/neutral/radius/font/density）はここで上書きする。
// globals.css の後に読み込むこと（後勝ちで :root トークンを上書きするため）。
import "./theme.css";
// この製品固有のコンポーネント追加スタイル（構造クラスは上書きせず、新規 UI のみ）。
import "./ui.css";
import { toJsonLd } from "./lib/json-ld.mjs";
import { SITE_URL } from "./site";

const SITE_NAME = "レジンキャリブ";
const TITLE = "レジンキャリブ — 光造形3Dプリント 露光時間 記録＆推奨ツール";
const DESCRIPTION =
  "光造形（LCD/MSLA）3Dプリンタの最適露光時間を、機種×レジン×造形温度×FEPの状態ごとに記録。RERF露光テストの結果から推奨露光時間を割り出し、過去のプロファイルと比較できます。端末内保存・登録不要・無料。Resin exposure calculator & RERF profile manager.";

// 共有カード（1200×630）。原版は scripts/og-card.html、書き出し先が public/og.png。
const OG_IMAGE = `${SITE_URL}og.png`;
// 画像に何が写っているかを書く（製品の説明は og:description が持っている）。
// ここが製品説明の重複だと、画像を見られない環境には情報が何も届かない。
const OG_ALT =
  "1.6秒から4.4秒まで露光時間を変えた8枚の試験片が並ぶ図。短い側は「未硬化」で穴が大きく縁が荒れ、長い側は「過硬化」で穴が埋まっていく。中央の3枚が「良好域」で、その下限にあたる2.8秒に「推奨」と示されている。";

// 検索エンジンに「何をするページか」を機械可読で渡す。露光条件を扱う計算ツールなので、
// 無料であること（offers ¥0）と端末内で完結することまで含めて明示する。
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  alternateName: "Resin Calib",
  url: SITE_URL,
  image: OG_IMAGE,
  description: DESCRIPTION,
  inLanguage: "ja",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web browser",
  browserRequirements: "JavaScript が有効なモダンブラウザ",
  offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
};

export const metadata: Metadata = {
  // 相対 URL を絶対 URL に解決する基準。これが無いと og:image が相対のまま出て
  // SNS 側で解決できない。
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: SITE_URL },
  // keywords メタは主要な検索エンジンに使われない。既存踏襲で置いているだけで、
  // ここを増やしても順位には効かない（効くのは本文とタイトル）。
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
    siteName: SITE_NAME,
    url: SITE_URL,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: OG_ALT,
      },
    ],
  },
  // 画像付きの大きなカードで出す（summary だと画像が出ず、共有しても中身が伝わらない）。
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: OG_IMAGE, alt: OG_ALT }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLd(JSON_LD) }}
        />
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
