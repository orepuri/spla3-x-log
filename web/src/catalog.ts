import type { AppSettings, RuleId } from "./types";

export const defaultSeasonId = "2026-summer";

export const seasons = [{ id: defaultSeasonId, name: "2026夏 Sizzle Season" }];

export const rules: Array<{ id: RuleId; name: string }> = [
  { id: "area", name: "ガチエリア" },
  { id: "tower", name: "ガチヤグラ" },
  { id: "rainmaker", name: "ガチホコ" },
  { id: "clam", name: "ガチアサリ" },
];

export const stages = [
  "ユノハナ大渓谷",
  "ゴンズイ地区",
  "ヤガラ市場",
  "マテガイ放水路",
  "ナメロウ金属",
  "マサバ海峡大橋",
  "キンメダイ美術館",
  "マヒマヒリゾート＆スパ",
  "海女美術大学",
  "チョウザメ造船",
  "ザトウマーケット",
  "スメーシーワールド",
  "クサヤ温泉",
  "ヒラメが丘団地",
  "ナンプラー遺跡",
  "マンタマリア号",
  "タラポートショッピングパーク",
  "コンブトラック",
  "タカアシ経済特区",
  "オヒョウ海運",
  "バイガイ亭",
  "ネギトロ炭鉱",
  "カジキ空港",
  "リュウグウターミナル",
  "デカライン高架下",
];

export const weapons = [
  "スプラシューター",
  "スプラシューターコラボ",
  "52ガロン",
  "N-ZAP85",
  "わかばシューター",
  "シャープマーカー",
  "ボールドマーカー",
  "プライムシューター",
  "ジェットスイーパー",
  "L3リールガン",
  "H3リールガン",
  "スプラローラー",
  "カーボンローラー",
  "ダイナモローラー",
  "ヴァリアブルローラー",
  "スプラチャージャー",
  "リッター4K",
  "スクイックリンα",
  "14式竹筒銃・甲",
  "バケットスロッシャー",
  "ヒッセン",
  "スクリュースロッシャー",
  "エクスプロッシャー",
  "バレルスピナー",
  "スプラスピナー",
  "ハイドラント",
  "クーゲルシュライバー",
  "スプラマニューバー",
  "デュアルスイーパー",
  "クアッドホッパーブラック",
  "パラシェルター",
  "キャンピングシェルター",
  "ホットブラスター",
  "ロングブラスター",
  "ノヴァブラスター",
  "クラッシュブラスター",
  "パブロ",
  "ホクサイ",
  "トライストリンガー",
  "LACT-450",
  "ドライブワイパー",
  "ジムワイパー",
  "スパッタリー",
  "モップリン",
  "イグザミナー",
  "フィンセント",
  "S-BLAST92",
];

export const defaultSettings: AppSettings = {
  season: defaultSeasonId,
  rule: "area",
  weapon: "スプラシューター",
  stageA: "ユノハナ大渓谷",
  stageB: "マサバ海峡大橋",
};

export function seasonName(id: string) {
  return seasons.find((season) => season.id === id)?.name || id;
}
