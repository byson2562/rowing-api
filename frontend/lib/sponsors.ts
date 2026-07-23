// フッター協賛枠に表示するスポンサー一覧。
// 契約が決まったらここに追加する(空のあいだは協賛枠自体が描画されない)。
// 個人スポンサーは希望者のみ名前を掲載。リンクは個別相談の企業・団体協賛のみ設定する。
export type Sponsor = {
  name: string;
  url?: string;
};

export const sponsors: Sponsor[] = [];
