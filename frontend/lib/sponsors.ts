// フッター協賛枠に表示するスポンサー一覧。
// 契約が決まったらここに追加する(空のあいだは協賛枠自体が描画されない)。
export type Sponsor = {
  name: string;
  /** Silver以上のプランのみリンクを設定する */
  url?: string;
  /** Goldは配列の先頭に手動で配置する(表示順=配列順) */
  plan?: "bronze" | "silver" | "gold";
};

export const sponsors: Sponsor[] = [];
