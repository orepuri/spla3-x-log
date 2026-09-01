import type { AppSettings, RuleId } from "./types";

export const defaultSeasonId = "2026-autumn";

export const seasons = [
  { id: defaultSeasonId, name: "2026秋 Drizzle Season" },
  { id: "2026-summer", name: "2026夏 Sizzle Season" },
];

export const rules: Array<{ id: RuleId; name: string }> = [
  { id: "area", name: "ガチエリア" },
  { id: "tower", name: "ガチヤグラ" },
  { id: "rainmaker", name: "ガチホコ" },
  { id: "clam", name: "ガチアサリ" },
];

export const stageSearchEntries = [
  "海女美術大学",
  "オヒョウ海運",
  "カジキ空港",
  "キンメダイ美術館",
  "クサヤ温泉",
  "コンブトラック",
  "ゴンズイ地区",
  "ザトウマーケット",
  "スメーシーワールド",
  "タカアシ経済特区",
  "タラポートショッピングパーク",
  "チョウザメ造船",
  "デカライン高架下",
  "ナメロウ金属",
  "ナンプラー遺跡",
  "ネギトロ炭鉱",
  "バイガイ亭",
  "ヒラメが丘団地",
  "マサバ海峡大橋",
  "マテガイ放水路",
  "マヒマヒリゾート＆スパ",
  "マンタマリア号",
  "ヤガラ市場",
  "ユノハナ大渓谷",
  "リュウグウターミナル",
] as const;

export const stageSearchMetadata: Record<string, { aliases: string[]; romaji: string[]; yomi: string }> = {
  海女美術大学: { aliases: ["amabi", "amabi art academy"], romaji: ["amabi", "amabijutsudaigaku"], yomi: "あまびじゅつだいがく" },
  オヒョウ海運: { aliases: ["ohyo", "ohyokaiun", "ohyou"], romaji: ["ohyo", "ohyou", "ohyoukaiun"], yomi: "おひょうかいうん" },
  カジキ空港: { aliases: ["kajiki"], romaji: ["kajiki", "kajikikuukou", "kajikikuko"], yomi: "かじきくうこう" },
  キンメダイ美術館: { aliases: ["kinmedai"], romaji: ["kinmedai", "kinmedaibijutsukan"], yomi: "きんめだいびじゅつかん" },
  クサヤ温泉: { aliases: ["kusaya"], romaji: ["kusaya", "kusayaonsen"], yomi: "くさやおんせん" },
  コンブトラック: { aliases: ["konbu"], romaji: ["konbu", "konbutorakku", "kombu"], yomi: "こんぶとらっく" },
  ゴンズイ地区: { aliases: ["gonzui"], romaji: ["gonzui", "gonzuichiku"], yomi: "ごんずいちく" },
  ザトウマーケット: { aliases: ["zato", "zatou"], romaji: ["zato", "zatou", "zatoumaketto"], yomi: "ざとうまーけっと" },
  スメーシーワールド: { aliases: ["sumeshi", "sumeshi world"], romaji: ["sumeshi", "sume", "sumeshiwarudo"], yomi: "すめーしーわーるど" },
  タカアシ経済特区: { aliases: ["takaashi"], romaji: ["takaashi", "takaashikeizaitokku"], yomi: "たかあしけいざいとっく" },
  タラポートショッピングパーク: { aliases: ["taraport", "tarapoto"], romaji: ["taraport", "tarapoto", "tarapotoshoppingpark"], yomi: "たらぽーとしょっぴんぐぱーく" },
  チョウザメ造船: { aliases: ["chozame", "chouzame"], romaji: ["chozame", "chouzame", "chouzamezousen"], yomi: "ちょうざめぞうせん" },
  デカライン高架下: { aliases: ["dekaline", "dekarain"], romaji: ["dekaline", "dekarain", "dekarainkoukashita"], yomi: "でからいんこうかした" },
  ナメロウ金属: { aliases: ["namero", "namerou"], romaji: ["namero", "namerou", "nameroukinzoku"], yomi: "なめろうきんぞく" },
  ナンプラー遺跡: { aliases: ["nampura", "nanpura"], romaji: ["nampura", "nanpura", "nanpuraiseki"], yomi: "なんぷらーいせき" },
  ネギトロ炭鉱: { aliases: ["negitoro"], romaji: ["negitoro", "negitorotankou"], yomi: "ねぎとろたんこう" },
  バイガイ亭: { aliases: ["baigai"], romaji: ["baigai", "baigaitei"], yomi: "ばいがいてい" },
  ヒラメが丘団地: { aliases: ["hirame"], romaji: ["hirame", "hiramegaokadanchi"], yomi: "ひらめがおかだんち" },
  マサバ海峡大橋: { aliases: ["masaba"], romaji: ["masaba", "masabakaikyouoohashi", "masabakaikyooohashi"], yomi: "まさばかいきょうおおはし" },
  マテガイ放水路: { aliases: ["mategai"], romaji: ["mategai", "mategaihousuiro"], yomi: "まてがいほうすいろ" },
  "マヒマヒリゾート＆スパ": { aliases: ["mahimahi"], romaji: ["mahimahi", "mahimahiresort", "mahimahiresortspa"], yomi: "まひまひりぞーとあんどすぱ" },
  マンタマリア号: { aliases: ["manta", "mantamaria"], romaji: ["manta", "mantamaria", "mantamariagou"], yomi: "まんたまりあごう" },
  ヤガラ市場: { aliases: ["yagara"], romaji: ["yagara", "yagaraichiba"], yomi: "やがらいちば" },
  ユノハナ大渓谷: { aliases: ["yunohana"], romaji: ["yunohana", "yunohanadaikeikoku"], yomi: "ゆのはなだいけいこく" },
  リュウグウターミナル: { aliases: ["ryugu", "ryuugu"], romaji: ["ryugu", "ryuugu", "ryuuguutaaminaru", "ryuguterminal"], yomi: "りゅうぐうたーみなる" },
};

export const stages = [...stageSearchEntries];

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
