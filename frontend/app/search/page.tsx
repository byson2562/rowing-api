import type { Metadata } from "next";
import { Suspense } from "react";

import SearchPage from "../search-page";
import { SEARCH_DEFAULT_DESCRIPTION, SEARCH_DEFAULT_TITLE } from "../../lib/search-meta";

// 完全静的サイトのため、クエリごとの metadata はここでは出せない。
// フィルタ付きURL(?year=…)の title / canonical / robots は lib/search-meta.ts の規則で
// クライアント側(search-page.tsx)が書き換える。
export const metadata: Metadata = {
  title: SEARCH_DEFAULT_TITLE,
  description: SEARCH_DEFAULT_DESCRIPTION,
  alternates: { canonical: "/search" }
};

export default function Page() {
  // useSearchParams を使うクライアントコンポーネントは Suspense 境界が必要(静的生成時に
  // クエリが未定のため、境界の中だけをクライアントで描画する)
  return (
    <Suspense fallback={null}>
      <SearchPage />
    </Suspense>
  );
}
