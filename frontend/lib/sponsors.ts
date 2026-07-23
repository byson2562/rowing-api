// フッター協賛枠に表示するスポンサー一覧。
// 契約が決まったらここに追加する(空のあいだは協賛枠自体が描画されない)。
export type Sponsor = {
  name: string;
  /** スタンダードプランのみリンクを設定する */
  url?: string;
};

export const sponsors: Sponsor[] = [];
