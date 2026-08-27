import type { MetadataRoute } from "next";

import { SITE_URL } from "./site";

// サイトマップ。static export では build 時に out/sitemap.xml として書き出される。
// robots.txt は置かない: robots.txt はオリジン単位でしか読まれず、この製品が置ける
// /<slug>/robots.txt はクローラに取得されない（唯一有効な
// https://ga-project.github.io/robots.txt は当社の管理外）。
// sitemap は Search Console に直接送信できるためサブパスでも有効。
// URL は layout の metadataBase と同じ絶対 URL（basePath 込み）に揃える。
// 単一ページのツールなので、トップ 1 URL を自己参照する。
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      // lastModified は入れない。static export ではビルド時刻しか入れられず、README だけ
      // 直したデプロイでも動く＝中身と無関係に「更新された」と言うことになる。
      // 不正確な lastmod は検索エンジン側で無視されるので、書かない方が誠実。
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
