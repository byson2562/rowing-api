import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ローイング記録とは",
  description:
    "ローイング記録を大会・年度・種目・団体で検索できるRowingAPIの案内ページ。日本の主要大会結果を横断して確認できます。",
  alternates: {
    canonical: "/rowing-records"
  },
  openGraph: {
    title: "ローイング記録とは | RowingAPI",
    description:
      "ローイング記録を大会・年度・種目・団体で検索できるRowingAPIの案内ページ。",
    url: "/rowing-records"
  }
};

export default function RowingRecordsPage() {
  return (
    <main className="container" style={{ paddingTop: 24 }}>
      <section className="table-card" style={{ maxWidth: 960, margin: "0 auto" }}>
        <h1>ローイング記録を検索するなら RowingAPI</h1>
        <p>
          RowingAPIは、日本ローイング大会の記録を検索・可視化するためのサービスです。
          年度、大会名、種目、Final、団体などの条件で結果を絞り込めます。
        </p>

        <h2>できること</h2>
        <ul>
          <li>ローイング記録の検索（年・大会・種目・団体）</li>
          <li>Final Aを基準にしたメダル傾向の可視化</li>
          <li>種目ごとの優勝タイム推移の確認</li>
        </ul>

        <h2>対象データ</h2>
        <p>現在は2009年から2025年までの大会記録を収録しています。</p>

        <p style={{ marginTop: 24 }}>
          実際の検索画面は <Link href="/">トップページ</Link> から利用できます。
        </p>
      </section>
    </main>
  );
}
