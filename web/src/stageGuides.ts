import type { RuleId } from "./types";

interface StrategyAssets {
  detailImage: string;
  summaryImage: string;
}

interface StrategySummary {
  checklist: string[];
  comeback: string;
  defense: string;
  focus: string;
  ng: string;
  opening: string;
}

interface StrategyOpeningDetail {
  avoid: string;
  firstGoal: string;
  route: string;
}

interface StrategyPosition {
  id: string;
  label: string;
  purpose: string;
  risk: string;
}

interface StrategyComeback {
  steps: string[];
}

interface StrategyDefense {
  priorities: string[];
}

interface StrategySpecialUsage {
  trizooka: {
    attack: string;
    comeback: string;
    defense: string;
  };
}

interface StrategyRoute {
  description: string;
  id: string;
  label: string;
}

interface StrategyMapAnnotation {
  label: string;
  number: number;
  x: number;
  y: number;
}

interface StrategyDetail {
  advantage: string[];
  basicPlan: string;
  comeback: StrategyComeback;
  defense: StrategyDefense;
  disadvantage: string[];
  enemyThreats: string[];
  keyPositions: StrategyPosition[];
  mapAnnotations: StrategyMapAnnotation[];
  mistakes: string[];
  neutral: string[];
  opening: StrategyOpeningDetail;
  routes: StrategyRoute[];
  specialUsage: StrategySpecialUsage;
}

export interface StageGuide {
  assets: StrategyAssets;
  detail: StrategyDetail;
  id: string;
  mapOrientation: string;
  rule: RuleId;
  ruleName: string;
  stage: string;
  summary: StrategySummary;
  weapon: string;
  weaponKit: {
    special: string;
    sub: string;
  };
}

interface RawStrategyEntry {
  assets: {
    detail_image: string;
    summary_image: string;
  };
  detail: {
    advantage: string[];
    basic_plan: string;
    comeback: StrategyComeback;
    defense: StrategyDefense;
    disadvantage: string[];
    enemy_threats: string[];
    key_positions: StrategyPosition[];
    map_annotations: StrategyMapAnnotation[];
    mistakes: string[];
    neutral: string[];
    opening: {
      avoid: string;
      first_goal: string;
      route: string;
    };
    routes: StrategyRoute[];
    special_usage: StrategySpecialUsage;
  };
  id: string;
  rule: string;
  rule_name_ja?: string;
  stage: {
    id?: string;
    name_ja: string;
    short_name_ja?: string;
  };
  summary: StrategySummary;
  weapon: string;
}

const strategyMapImages = import.meta.glob("../../strategy/assets/strategy-maps/*.svg", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const rawStrategyEntries: RawStrategyEntry[] = [
  {
    "id": "clam_blitz_namero_metalworks_splattershot",
    "rule": "clam_blitz",
    "stage": {
      "id": "mincemeat_metalworks",
      "name_ja": "ナメロウ金属"
    },
    "weapon": "splattershot",
    "assets": {
      "summary_image": "assets/strategy-maps/namero_metalworks_clam_summary.svg",
      "detail_image": "assets/strategy-maps/namero_metalworks_clam_detail.svg"
    },
    "summary": {
      "focus": "中央の貝を管理しつつ、7個止めで位置バレを避ける。人数有利かウルショで敵高台・ゴール前をどかしてから一気に入る。",
      "opening": "初動は中央左寄りを塗りながら貝回収。即パワー化せず、7個前後で味方の位置を見る。長射程が見ている正面ルートで無理に撃ち合わない。",
      "comeback": "自陣側を塗ってウルショを準備。中央正面に単独で出ず、敵高台・ゴール前・パワー持ち周辺にウルショを合わせて中央を取り返す。",
      "defense": "自ゴール前の塗りを維持し、横から入る敵とジャンプ先を先に潰す。パワー持ちだけでなく、後続の通常アサリ持ちを止める。",
      "ng": "パワーアサリを持って単独で正面突破しない。人数不利で中央グレート・橋まわりに居続けない。",
      "checklist": [
        "7個止めで位置バレ時間を短くする",
        "攻める前に敵高台・ゴール前をウルショでどかす",
        "防衛時はパワー持ちより後続の追加投入も見る"
      ]
    },
    "detail": {
      "basic_plan": "ナメロウ金属は中央通過時に射線が通りやすく、単独侵入が止められやすい。スプラシューターは中央塗り・短中距離対面・キューバンで足場制限を担当し、ゴール前は人数有利かウルショ始動で入る。",
      "opening": {
        "route": "自陣左寄り→中央手前→中央左。貝を拾いながら中央を塗る。",
        "first_goal": "中央塗りと貝数確認。敵が2落ち以上なら前へ、拮抗なら7個止めで待つ。",
        "avoid": "初動からパワーアサリを作って位置を晒し、正面からゴール前へ行く動き。"
      },
      "key_positions": [
        {
          "id": "mid_left",
          "label": "中央左手前",
          "purpose": "初動で立つ場所。塗り・貝回収・敵の中央入りを止める。",
          "risk": "長射程やブラスターに見られると苦しいので、長く顔を出さない。"
        },
        {
          "id": "enemy_goal_front",
          "label": "敵ゴール前",
          "purpose": "人数有利後に一気に詰める場所。キューバンで足場を奪ってから投げる。",
          "risk": "単独で入ると復帰組に挟まれやすい。"
        },
        {
          "id": "own_goal_front",
          "label": "自ゴール前",
          "purpose": "防衛の最終ライン。塗り返しとジャンプ投げ拒否を優先。",
          "risk": "ゴール下だけ見ていると横抜け・後続投入を通す。"
        }
      ],
      "neutral": [
        "中央の貝を拾い切るより、敵に拾わせない塗りを優先する。",
        "7個止めで味方に1個もらう、または味方へ渡してパワー化する。",
        "キューバンは中央の通路・敵の待機位置・ゴール前に置き、相手を動かす。"
      ],
      "advantage": [
        "敵2落ち以上か、敵後衛をウルショで下げたら前へ出る。",
        "パワー持ちは最後尾ではなく、護衛の少し後ろ。通常アサリ持ちは追加投入を意識する。",
        "ゴールを開けた後は前に出すぎず、敵復帰ルートを見て投入時間を伸ばす。"
      ],
      "disadvantage": [
        "パワー持ちで孤立したら無理に保持せず、味方が拾える場所に捨てる判断も持つ。",
        "敵にゴール前を取られたら、自陣塗りとスペシャルを優先して即突撃しない。"
      ],
      "comeback": {
        "steps": [
          "自陣側・中央手前を塗ってウルショを溜める。",
          "敵の高台、ゴール前待機、パワー持ち周辺をウルショでどかす。",
          "味方と同時に中央へ入り、落とした敵の貝を拾わせない。"
        ]
      },
      "defense": {
        "priorities": [
          "自ゴール前の塗りを維持する。",
          "パワー持ちのルートを先読みしてキューバンを置く。",
          "ゴールが開いたら後続の通常アサリ持ちを優先的に落とす。",
          "敵のスーパージャンプ先を見たら即ボム・メインで処理する。"
        ]
      },
      "special_usage": {
        "trizooka": {
          "attack": "ゴール前・敵高台・護衛を先に狙う。1発目で敵を下げ、2〜3発目で投げ込みルートを作る。",
          "comeback": "中央に入る直前に撃つ。人数不利のまま雑に撃たない。",
          "defense": "敵パワー持ち、ジャンプ先、ゴール前の護衛に撃つ。"
        }
      },
      "routes": [
        {
          "id": "opening_left",
          "label": "初動左寄り",
          "description": "中央左手前へ入り、貝回収と塗りで主導権を作る。"
        },
        {
          "id": "attack_main_after_pick",
          "label": "人数有利後の正面寄り",
          "description": "敵が落ちた後にだけ中央を越える。キューバンで足場を奪う。"
        },
        {
          "id": "defensive_reset",
          "label": "自陣リセット",
          "description": "劣勢時は自陣側に下がり、ウルショ準備とゴール前塗りを優先する。"
        }
      ],
      "enemy_threats": [
        "長射程：中央・グレート・ゴール前への射線。ウルショか味方の圧に合わせる。",
        "ブラスター：段差・通路での待ち。曲がり角にキューバンを置いてから入る。",
        "ローラー/筆：ゴール前潜伏とジャンプ先作り。自ゴール前の塗り維持で拒否する。"
      ],
      "mistakes": [
        "パワーを早く作りすぎて位置バレしたまま中央で倒される。",
        "ゴールを開けたあと、全員が投げに集中して敵復帰ルートを見ない。",
        "防衛でパワー持ちだけを追い、通常アサリの追加投入を止められない。"
      ],
      "map_annotations": [
        {
          "number": 1,
          "label": "初動・打開の通過点",
          "x": 0.43,
          "y": 0.56
        },
        {
          "number": 2,
          "label": "中央の貝管理",
          "x": 0.49,
          "y": 0.36
        },
        {
          "number": 3,
          "label": "攻めのゴール前",
          "x": 0.6,
          "y": 0.19
        },
        {
          "number": 4,
          "label": "自陣塗り・打開準備",
          "x": 0.5,
          "y": 0.69
        },
        {
          "number": 5,
          "label": "防衛で見る左抜け",
          "x": 0.34,
          "y": 0.32
        },
        {
          "number": 6,
          "label": "防衛で見る右抜け",
          "x": 0.69,
          "y": 0.32
        }
      ]
    }
  },
  {
    "id": "clam_blitz_ryugu_terminal_splattershot",
    "rule": "clam_blitz",
    "stage": {
      "id": "lemuria_hub",
      "name_ja": "リュウグウターミナル"
    },
    "weapon": "splattershot",
    "assets": {
      "summary_image": "assets/strategy-maps/ryugu_terminal_clam_summary.svg",
      "detail_image": "assets/strategy-maps/ryugu_terminal_clam_detail.svg"
    },
    "summary": {
      "focus": "中央橋・低地の貝を管理し、移動床まわりで孤立しない。パワー化はゴールに近づいてから行い、位置バレ時間を短くする。",
      "opening": "初動は中央手前を広く塗り、貝を拾いながら敵の横入りを確認。橋・移動床に固執せず、撃ち合いが長引くなら一度下がる。",
      "comeback": "自陣高めを塗ってウルショを準備。中央橋の敵、ゴール前待機、パワー持ち周辺をどかしてから味方と入る。",
      "defense": "自ゴール前の塗りを維持し、左右の抜けとジャンプ先を警戒。ゴールが開いたら通常アサリ持ちの追加投入を最優先で止める。",
      "ng": "パワー持ちで移動床・橋上に長く滞在しない。ゴール前単独潜伏だけで打開しようとしない。",
      "checklist": [
        "中央橋・低地で孤立しない",
        "パワー化はできるだけゴール近くで行う",
        "防衛時は左右抜けとジャンプ先を塗りで消す"
      ]
    },
    "detail": {
      "basic_plan": "リュウグウターミナルは中央橋・低地・移動床まわりで視線とルートが切り替わりやすい。スプラシューターは中央の塗り維持、横入りの察知、ウルショでの高台・ゴール前排除を担当する。",
      "opening": {
        "route": "自陣ゴール側→中央手前→中央橋・低地。まず広く塗って貝の位置を見えるようにする。",
        "first_goal": "中央で貝を集めつつ、敵がどちらのサイドから入ってくるかを見る。",
        "avoid": "移動床や橋上でパワーを持ったまま止まり、全員に位置を見られて落とされる動き。"
      },
      "key_positions": [
        {
          "id": "center_bridge",
          "label": "中央橋・低地",
          "purpose": "貝管理と人数有利作りの主戦場。",
          "risk": "複数方向から撃たれやすいので、味方位置なしで粘らない。"
        },
        {
          "id": "enemy_goal_side",
          "label": "敵ゴール側",
          "purpose": "人数有利後に詰める場所。近くでパワー化して位置バレを短くする。",
          "risk": "単独潜伏は読まれると弱い。通常アサリの後続がないと点が伸びない。"
        },
        {
          "id": "own_goal_side",
          "label": "自ゴール側",
          "purpose": "防衛と打開の起点。塗り返しでジャンプ投げと潜伏を拒否。",
          "risk": "ゴール前だけ見ていると中央から追加アサリを運ばれる。"
        }
      ],
      "neutral": [
        "中央低地を塗り、貝が自インク上に見える状態を作る。",
        "味方が6〜7個なら渡してパワー化、逆に自分は7個止めで待つ。",
        "キューバンは橋の出口、移動床の降り口、ゴール前の待機位置に置く。"
      ],
      "advantage": [
        "敵2落ち、または中央橋の敵を下げたタイミングでゴール側へ入る。",
        "パワー作成はゴール近くで行い、位置バレ時間を短くする。",
        "ゴールを開けたら一人は前を見て、残りが通常アサリを入れる形を意識する。"
      ],
      "disadvantage": [
        "中央橋を取り返す前にゴールへ抜けようとしない。",
        "敵パワー持ちが見えたら、進行方向の塗りを奪って足を止める。"
      ],
      "comeback": {
        "steps": [
          "自陣ゴール側・中央手前を塗ってウルショを溜める。",
          "中央橋上、移動床出口、敵ゴール前待機にウルショを撃つ。",
          "味方が中央に入るタイミングで前へ出て、落ちた貝を回収させない。"
        ]
      },
      "defense": {
        "priorities": [
          "自ゴール前と左右抜けルートを塗り返す。",
          "敵パワー持ちの進行先にキューバンを置く。",
          "ゴールが開いたら通常アサリ持ちとジャンプ先を優先処理する。",
          "敵の抜けを追いすぎて中央の追加投入を空けない。"
        ]
      },
      "special_usage": {
        "trizooka": {
          "attack": "中央橋・敵ゴール前・護衛に撃ち、投げ込み前の安全時間を作る。",
          "comeback": "自陣高めから中央橋上の敵へ。味方の復帰前に撃ち切らない。",
          "defense": "敵パワー持ち、ジャンプ先、ゴール前の密集に撃つ。"
        }
      },
      "routes": [
        {
          "id": "opening_center",
          "label": "初動中央手前",
          "description": "中央低地を塗り、貝と敵の横入りを確認する。"
        },
        {
          "id": "side_entry_after_pick",
          "label": "人数有利後のゴール側侵入",
          "description": "敵が落ちたあとにゴール近くでパワー化し、位置バレ時間を短くする。"
        },
        {
          "id": "defensive_reset",
          "label": "自ゴール側リセット",
          "description": "防衛時は左右抜けを消し、ジャンプ先を塗りで拒否する。"
        }
      ],
      "enemy_threats": [
        "機動力の高い筆・マニューバー：左右抜けとゴール前ジャンプ先作り。",
        "長射程：橋・低地を見下ろす位置。ウルショで下げてから中央へ。",
        "ブラスター：橋出口・段差周辺。曲がり角で長く撃ち合わない。"
      ],
      "mistakes": [
        "中央低地で長く撃ち合い、貝もスペシャルも失う。",
        "パワー持ちで橋・移動床上に滞在して位置バレし続ける。",
        "ゴールを開けた後に全員がゴール前へ寄り、敵復帰と中央追加を見ない。"
      ],
      "map_annotations": [
        {
          "number": 1,
          "label": "初動・中央手前",
          "x": 0.53,
          "y": 0.57
        },
        {
          "number": 2,
          "label": "中央橋・貝管理",
          "x": 0.5,
          "y": 0.35
        },
        {
          "number": 3,
          "label": "攻めのゴール前",
          "x": 0.35,
          "y": 0.2
        },
        {
          "number": 4,
          "label": "自ゴール前防衛",
          "x": 0.65,
          "y": 0.81
        },
        {
          "number": 5,
          "label": "左抜け警戒",
          "x": 0.25,
          "y": 0.34
        },
        {
          "number": 6,
          "label": "右抜け警戒",
          "x": 0.75,
          "y": 0.36
        },
        {
          "number": 7,
          "label": "打開準備",
          "x": 0.5,
          "y": 0.68
        }
      ]
    }
  },
  {
    "id": "splat_zones_crableg_capital_splattershot",
    "rule": "splat_zones",
    "rule_name_ja": "ガチエリア",
    "stage": {
      "id": "crableg_capital",
      "name_ja": "タラポートショッピングパーク",
      "short_name_ja": "タラポート"
    },
    "weapon": "splattershot",
    "assets": {
      "summary_image": "assets/strategy-maps/splat_zones_crableg_capital_summary.svg",
      "detail_image": "assets/strategy-maps/splat_zones_crableg_capital_detail.svg"
    },
    "summary": {
      "focus": "橋・中央エリアを塗りで維持し、長射程がいる高台をウルショでどかしてから前に出る。",
      "opening": "初動は中央手前を広く塗り、エリアを触りつつ敵の高台位置を見る。正面で長射程に射程負けするなら無理に詰めない。",
      "comeback": "自陣側で塗りとウルショを準備し、橋上・高台・エリア奥の敵をどかしてから一斉に入る。",
      "defense": "エリアを塗るだけでなく、中央橋を渡ってくる敵と高台から下りる敵を先に止める。",
      "ng": "人数不利でエリア内に残らない。敵高台へ単独で登って返り討ちにされない。",
      "checklist": [
        "橋・中央エリアを塗りで維持し、長射程がいる高台をウルショでどかしてから前に出る",
        "ウルショは高台・関門・進行先など、メインで届きにくい敵をどかすために使う",
        "人数不利では無理に前へ出ず、塗り返しと味方合流を優先する"
      ]
    },
    "detail": {
      "basic_plan": "橋・中央エリアを塗りで維持し、長射程がいる高台をウルショでどかしてから前に出る。 スシは万能だが射程で押し切る武器ではないため、塗り・ボム・ウルショを組み合わせて有利な距離だけ戦う。",
      "opening": {
        "route": "初動は中央手前を広く塗り、エリアを触りつつ敵の高台位置を見る。正面で長射程に射程負けするなら無理に詰めない。",
        "first_goal": "中央手前の足場を作り、味方が動ける塗りと敵位置の情報を取る。",
        "avoid": "人数不利でエリア内に残らない。敵高台へ単独で登って返り討ちにされない。"
      },
      "key_positions": [
        {
          "id": "main_objective",
          "label": "中央橋・エリア手前",
          "purpose": "主戦場。ここを塗り・ボム・対面で維持する。",
          "risk": "長射程・ブラスターの橋上管理"
        },
        {
          "id": "enemy_side",
          "label": "敵陣側の入口・高台",
          "purpose": "抑えで見る場所。敵の復帰と塗り返しを遅らせる。",
          "risk": "深追いすると復帰敵に挟まれる。"
        },
        {
          "id": "own_side",
          "label": "自陣側の打開起点",
          "purpose": "打開時に塗り返してスペシャルを準備する場所。",
          "risk": "塗り返しだけで止まるとルール関与が遅れる。"
        }
      ],
      "neutral": [
        "中央手前の塗りを維持し、敵の進入ルートをキューバンボムで制限する。",
        "射程負けする相手には正面から付き合わず、段差・壁・ボムで動かしてから撃つ。",
        "味方が前に出たタイミングで一緒にラインを上げる。"
      ],
      "advantage": [
        "人数有利ができたら、オブジェクトだけでなく敵の復帰口を見て時間を稼ぐ。",
        "ウルトラショットは敵高台・関門・進行先など、メインで届かない場所に使う。",
        "深追いより、生存して塗りとルール関与を続けることを優先する。"
      ],
      "disadvantage": [
        "自陣側を塗ってスペシャルを準備し、味方と同時に入る。",
        "人数不利でオブジェクトに単独特攻しない。"
      ],
      "comeback": {
        "steps": [
          "自陣側と中央手前を塗り返し、ウルトラショットを準備する。",
          "オブジェクト周辺・高台・関門前の敵をウルトラショットやキューバンボムでどかす。",
          "味方の復帰・スペシャルに合わせて中央へ入り、落とした敵の位置を塗りで塞ぐ。"
        ]
      },
      "defense": {
        "priorities": [
          "オブジェクトに直接関与する敵より前に、護衛や横入りを確認する。",
          "自陣側の足場を塗り返し、潜伏とスーパージャンプ先を消す。",
          "敵のスペシャルに合わせて下がる場所を用意する。"
        ]
      },
      "special_usage": {
        "trizooka": {
          "attack": "敵高台・関門前・オブジェクト前の護衛をどかす。1発目で下げ、残りでルートを作る。",
          "comeback": "味方が入る直前に撃つ。人数不利で雑に撃ち切らない。",
          "defense": "オブジェクト周辺の密集、敵の前衛、後衛の射線を止めるために使う。"
        }
      },
      "routes": [
        {
          "id": "opening_route",
          "label": "初動ルート",
          "description": "中央手前を塗って、敵位置を見てから主戦場へ入る。"
        },
        {
          "id": "comeback_route",
          "label": "打開ルート",
          "description": "自陣側を塗り返し、スペシャルを準備してから味方と同時に入る。"
        },
        {
          "id": "defense_route",
          "label": "防衛ルート",
          "description": "自陣側の重要地点を塗り返し、横入りと潜伏を消す。"
        }
      ],
      "enemy_threats": [
        "長射程・ブラスターの橋上管理",
        "長射程が高台や橋上に残ると、スシの射程では正面突破しづらい。",
        "ブラスター・ローラー・筆系の潜伏や横入りは、塗り返しとボム確認で拒否する。"
      ],
      "mistakes": [
        "人数不利でエリア内に残らない。敵高台へ単独で登って返り討ちにされない。",
        "メインだけで射程負け相手を倒そうとする。",
        "打開時に味方を待たず、一人でオブジェクトへ触りに行く。"
      ],
      "map_annotations": [
        {
          "number": 1,
          "label": "初動・打開の通過点",
          "x": 0.5,
          "y": 0.56
        },
        {
          "number": 2,
          "label": "主戦場・オブジェクト",
          "x": 0.5,
          "y": 0.5
        },
        {
          "number": 3,
          "label": "左側の警戒地点",
          "x": 0.4,
          "y": 0.36
        },
        {
          "number": 4,
          "label": "右側の警戒地点",
          "x": 0.6,
          "y": 0.36
        },
        {
          "number": 5,
          "label": "自陣側の打開起点",
          "x": 0.5,
          "y": 0.69
        }
      ]
    }
  },
  {
    "id": "splat_zones_urchin_underpass_splattershot",
    "rule": "splat_zones",
    "rule_name_ja": "ガチエリア",
    "stage": {
      "id": "urchin_underpass",
      "name_ja": "デカライン高架下",
      "short_name_ja": "デカライン"
    },
    "weapon": "splattershot",
    "assets": {
      "summary_image": "assets/strategy-maps/splat_zones_urchin_underpass_summary.svg",
      "detail_image": "assets/strategy-maps/splat_zones_urchin_underpass_detail.svg"
    },
    "summary": {
      "focus": "中央広場の塗りと左右の横展開を両立。正面だけでなく裏気味の入りを常に警戒する。",
      "opening": "初動は中央広場手前を塗り、敵の左右展開を確認。前に出られるなら横から圧をかける。",
      "comeback": "自陣側から中央を塗り返し、ウルショで中央奥・高台・潜伏位置をどかしてからエリアを触る。",
      "defense": "エリア周辺の塗りを維持し、左右通路からの抜けと潜伏を先に潰す。",
      "ng": "正面だけ見て左右抜けを通さない。エリアを取ったあと中央奥で倒されない。",
      "checklist": [
        "中央広場の塗りと左右の横展開を両立",
        "ウルショは高台・関門・進行先など、メインで届きにくい敵をどかすために使う",
        "人数不利では無理に前へ出ず、塗り返しと味方合流を優先する"
      ]
    },
    "detail": {
      "basic_plan": "中央広場の塗りと左右の横展開を両立。正面だけでなく裏気味の入りを常に警戒する。 スシは万能だが射程で押し切る武器ではないため、塗り・ボム・ウルショを組み合わせて有利な距離だけ戦う。",
      "opening": {
        "route": "初動は中央広場手前を塗り、敵の左右展開を確認。前に出られるなら横から圧をかける。",
        "first_goal": "中央手前の足場を作り、味方が動ける塗りと敵位置の情報を取る。",
        "avoid": "正面だけ見て左右抜けを通さない。エリアを取ったあと中央奥で倒されない。"
      },
      "key_positions": [
        {
          "id": "main_objective",
          "label": "中央広場・左右通路",
          "purpose": "主戦場。ここを塗り・ボム・対面で維持する。",
          "risk": "横展開・潜伏・ローラー系"
        },
        {
          "id": "enemy_side",
          "label": "敵陣側の入口・高台",
          "purpose": "抑えで見る場所。敵の復帰と塗り返しを遅らせる。",
          "risk": "深追いすると復帰敵に挟まれる。"
        },
        {
          "id": "own_side",
          "label": "自陣側の打開起点",
          "purpose": "打開時に塗り返してスペシャルを準備する場所。",
          "risk": "塗り返しだけで止まるとルール関与が遅れる。"
        }
      ],
      "neutral": [
        "中央手前の塗りを維持し、敵の進入ルートをキューバンボムで制限する。",
        "射程負けする相手には正面から付き合わず、段差・壁・ボムで動かしてから撃つ。",
        "味方が前に出たタイミングで一緒にラインを上げる。"
      ],
      "advantage": [
        "人数有利ができたら、オブジェクトだけでなく敵の復帰口を見て時間を稼ぐ。",
        "ウルトラショットは敵高台・関門・進行先など、メインで届かない場所に使う。",
        "深追いより、生存して塗りとルール関与を続けることを優先する。"
      ],
      "disadvantage": [
        "自陣側を塗ってスペシャルを準備し、味方と同時に入る。",
        "人数不利でオブジェクトに単独特攻しない。"
      ],
      "comeback": {
        "steps": [
          "自陣側と中央手前を塗り返し、ウルトラショットを準備する。",
          "オブジェクト周辺・高台・関門前の敵をウルトラショットやキューバンボムでどかす。",
          "味方の復帰・スペシャルに合わせて中央へ入り、落とした敵の位置を塗りで塞ぐ。"
        ]
      },
      "defense": {
        "priorities": [
          "オブジェクトに直接関与する敵より前に、護衛や横入りを確認する。",
          "自陣側の足場を塗り返し、潜伏とスーパージャンプ先を消す。",
          "敵のスペシャルに合わせて下がる場所を用意する。"
        ]
      },
      "special_usage": {
        "trizooka": {
          "attack": "敵高台・関門前・オブジェクト前の護衛をどかす。1発目で下げ、残りでルートを作る。",
          "comeback": "味方が入る直前に撃つ。人数不利で雑に撃ち切らない。",
          "defense": "オブジェクト周辺の密集、敵の前衛、後衛の射線を止めるために使う。"
        }
      },
      "routes": [
        {
          "id": "opening_route",
          "label": "初動ルート",
          "description": "中央手前を塗って、敵位置を見てから主戦場へ入る。"
        },
        {
          "id": "comeback_route",
          "label": "打開ルート",
          "description": "自陣側を塗り返し、スペシャルを準備してから味方と同時に入る。"
        },
        {
          "id": "defense_route",
          "label": "防衛ルート",
          "description": "自陣側の重要地点を塗り返し、横入りと潜伏を消す。"
        }
      ],
      "enemy_threats": [
        "横展開・潜伏・ローラー系",
        "長射程が高台や橋上に残ると、スシの射程では正面突破しづらい。",
        "ブラスター・ローラー・筆系の潜伏や横入りは、塗り返しとボム確認で拒否する。"
      ],
      "mistakes": [
        "正面だけ見て左右抜けを通さない。エリアを取ったあと中央奥で倒されない。",
        "メインだけで射程負け相手を倒そうとする。",
        "打開時に味方を待たず、一人でオブジェクトへ触りに行く。"
      ],
      "map_annotations": [
        {
          "number": 1,
          "label": "初動・打開の通過点",
          "x": 0.5,
          "y": 0.56
        },
        {
          "number": 2,
          "label": "主戦場・オブジェクト",
          "x": 0.5,
          "y": 0.5
        },
        {
          "number": 3,
          "label": "左側の警戒地点",
          "x": 0.4,
          "y": 0.36
        },
        {
          "number": 4,
          "label": "右側の警戒地点",
          "x": 0.6,
          "y": 0.36
        },
        {
          "number": 5,
          "label": "自陣側の打開起点",
          "x": 0.5,
          "y": 0.69
        }
      ]
    }
  },
  {
    "id": "splat_zones_eeltail_alley_splattershot",
    "rule": "splat_zones",
    "rule_name_ja": "ガチエリア",
    "stage": {
      "id": "eeltail_alley",
      "name_ja": "ゴンズイ地区",
      "short_name_ja": "ゴンズイ"
    },
    "weapon": "splattershot",
    "assets": {
      "summary_image": "assets/strategy-maps/splat_zones_eeltail_alley_summary.svg",
      "detail_image": "assets/strategy-maps/splat_zones_eeltail_alley_detail.svg"
    },
    "summary": {
      "focus": "広い中央エリアを一人で塗り切ろうとせず、橋・高台の敵をウルショでどかして味方と塗り返す。",
      "opening": "初動は中央手前を塗ってエリアに触る。長射程が橋上を見ている場合は正面対面を避ける。",
      "comeback": "自陣塗りでウルショを準備し、橋上・エリア奥・長射程を退かせてから塗り返す。",
      "defense": "エリアだけでなく橋上から下りる敵、左右から入る敵を先に見る。",
      "ng": "広いエリアを単独で塗り返そうとしない。橋上の長射程に正面から挑まない。",
      "checklist": [
        "広い中央エリアを一人で塗り切ろうとせず、橋・高台の敵をウルショでどかして味方と塗り返す",
        "ウルショは高台・関門・進行先など、メインで届きにくい敵をどかすために使う",
        "人数不利では無理に前へ出ず、塗り返しと味方合流を優先する"
      ]
    },
    "detail": {
      "basic_plan": "広い中央エリアを一人で塗り切ろうとせず、橋・高台の敵をウルショでどかして味方と塗り返す。 スシは万能だが射程で押し切る武器ではないため、塗り・ボム・ウルショを組み合わせて有利な距離だけ戦う。",
      "opening": {
        "route": "初動は中央手前を塗ってエリアに触る。長射程が橋上を見ている場合は正面対面を避ける。",
        "first_goal": "中央手前の足場を作り、味方が動ける塗りと敵位置の情報を取る。",
        "avoid": "広いエリアを単独で塗り返そうとしない。橋上の長射程に正面から挑まない。"
      },
      "key_positions": [
        {
          "id": "main_objective",
          "label": "広い中央エリア・橋上",
          "purpose": "主戦場。ここを塗り・ボム・対面で維持する。",
          "risk": "長射程・スペシャルによる橋制圧"
        },
        {
          "id": "enemy_side",
          "label": "敵陣側の入口・高台",
          "purpose": "抑えで見る場所。敵の復帰と塗り返しを遅らせる。",
          "risk": "深追いすると復帰敵に挟まれる。"
        },
        {
          "id": "own_side",
          "label": "自陣側の打開起点",
          "purpose": "打開時に塗り返してスペシャルを準備する場所。",
          "risk": "塗り返しだけで止まるとルール関与が遅れる。"
        }
      ],
      "neutral": [
        "中央手前の塗りを維持し、敵の進入ルートをキューバンボムで制限する。",
        "射程負けする相手には正面から付き合わず、段差・壁・ボムで動かしてから撃つ。",
        "味方が前に出たタイミングで一緒にラインを上げる。"
      ],
      "advantage": [
        "人数有利ができたら、オブジェクトだけでなく敵の復帰口を見て時間を稼ぐ。",
        "ウルトラショットは敵高台・関門・進行先など、メインで届かない場所に使う。",
        "深追いより、生存して塗りとルール関与を続けることを優先する。"
      ],
      "disadvantage": [
        "自陣側を塗ってスペシャルを準備し、味方と同時に入る。",
        "人数不利でオブジェクトに単独特攻しない。"
      ],
      "comeback": {
        "steps": [
          "自陣側と中央手前を塗り返し、ウルトラショットを準備する。",
          "オブジェクト周辺・高台・関門前の敵をウルトラショットやキューバンボムでどかす。",
          "味方の復帰・スペシャルに合わせて中央へ入り、落とした敵の位置を塗りで塞ぐ。"
        ]
      },
      "defense": {
        "priorities": [
          "オブジェクトに直接関与する敵より前に、護衛や横入りを確認する。",
          "自陣側の足場を塗り返し、潜伏とスーパージャンプ先を消す。",
          "敵のスペシャルに合わせて下がる場所を用意する。"
        ]
      },
      "special_usage": {
        "trizooka": {
          "attack": "敵高台・関門前・オブジェクト前の護衛をどかす。1発目で下げ、残りでルートを作る。",
          "comeback": "味方が入る直前に撃つ。人数不利で雑に撃ち切らない。",
          "defense": "オブジェクト周辺の密集、敵の前衛、後衛の射線を止めるために使う。"
        }
      },
      "routes": [
        {
          "id": "opening_route",
          "label": "初動ルート",
          "description": "中央手前を塗って、敵位置を見てから主戦場へ入る。"
        },
        {
          "id": "comeback_route",
          "label": "打開ルート",
          "description": "自陣側を塗り返し、スペシャルを準備してから味方と同時に入る。"
        },
        {
          "id": "defense_route",
          "label": "防衛ルート",
          "description": "自陣側の重要地点を塗り返し、横入りと潜伏を消す。"
        }
      ],
      "enemy_threats": [
        "長射程・スペシャルによる橋制圧",
        "長射程が高台や橋上に残ると、スシの射程では正面突破しづらい。",
        "ブラスター・ローラー・筆系の潜伏や横入りは、塗り返しとボム確認で拒否する。"
      ],
      "mistakes": [
        "広いエリアを単独で塗り返そうとしない。橋上の長射程に正面から挑まない。",
        "メインだけで射程負け相手を倒そうとする。",
        "打開時に味方を待たず、一人でオブジェクトへ触りに行く。"
      ],
      "map_annotations": [
        {
          "number": 1,
          "label": "初動・打開の通過点",
          "x": 0.5,
          "y": 0.56
        },
        {
          "number": 2,
          "label": "主戦場・オブジェクト",
          "x": 0.5,
          "y": 0.5
        },
        {
          "number": 3,
          "label": "左側の警戒地点",
          "x": 0.4,
          "y": 0.36
        },
        {
          "number": 4,
          "label": "右側の警戒地点",
          "x": 0.6,
          "y": 0.36
        },
        {
          "number": 5,
          "label": "自陣側の打開起点",
          "x": 0.5,
          "y": 0.69
        }
      ]
    }
  },
  {
    "id": "splat_zones_barnacle_and_dime_splattershot",
    "rule": "splat_zones",
    "rule_name_ja": "ガチエリア",
    "stage": {
      "id": "barnacle_and_dime",
      "name_ja": "バイガイ亭",
      "short_name_ja": "バイガイ"
    },
    "weapon": "splattershot",
    "assets": {
      "summary_image": "assets/strategy-maps/splat_zones_barnacle_and_dime_summary.svg",
      "detail_image": "assets/strategy-maps/splat_zones_barnacle_and_dime_detail.svg"
    },
    "summary": {
      "focus": "中央エリアを取った後のロックが強いので、取る前は焦らず、取った後は敵出口を見て塗り返しを遅らせる。",
      "opening": "初動は中央手前を塗り、短射程対面で人数有利を作る。高台・角待ちにボムを入れてから入る。",
      "comeback": "自陣側でウルショを準備し、エリア奥・敵高台・潜伏位置をどかしてから入る。",
      "defense": "エリア周辺を維持し、敵の復帰出口と横抜けをボム・メインで止める。",
      "ng": "一度押された状態で単独正面突破しない。エリアを取っても奥へ行きすぎて倒されない。",
      "checklist": [
        "中央エリアを取った後のロックが強いので、取る前は焦らず、取った後は敵出口を見て塗り返しを遅らせる",
        "ウルショは高台・関門・進行先など、メインで届きにくい敵をどかすために使う",
        "人数不利では無理に前へ出ず、塗り返しと味方合流を優先する"
      ]
    },
    "detail": {
      "basic_plan": "中央エリアを取った後のロックが強いので、取る前は焦らず、取った後は敵出口を見て塗り返しを遅らせる。 スシは万能だが射程で押し切る武器ではないため、塗り・ボム・ウルショを組み合わせて有利な距離だけ戦う。",
      "opening": {
        "route": "初動は中央手前を塗り、短射程対面で人数有利を作る。高台・角待ちにボムを入れてから入る。",
        "first_goal": "中央手前の足場を作り、味方が動ける塗りと敵位置の情報を取る。",
        "avoid": "一度押された状態で単独正面突破しない。エリアを取っても奥へ行きすぎて倒されない。"
      },
      "key_positions": [
        {
          "id": "main_objective",
          "label": "中央エリア・敵出口",
          "purpose": "主戦場。ここを塗り・ボム・対面で維持する。",
          "risk": "ロックアウト・角待ち・短射程乱戦"
        },
        {
          "id": "enemy_side",
          "label": "敵陣側の入口・高台",
          "purpose": "抑えで見る場所。敵の復帰と塗り返しを遅らせる。",
          "risk": "深追いすると復帰敵に挟まれる。"
        },
        {
          "id": "own_side",
          "label": "自陣側の打開起点",
          "purpose": "打開時に塗り返してスペシャルを準備する場所。",
          "risk": "塗り返しだけで止まるとルール関与が遅れる。"
        }
      ],
      "neutral": [
        "中央手前の塗りを維持し、敵の進入ルートをキューバンボムで制限する。",
        "射程負けする相手には正面から付き合わず、段差・壁・ボムで動かしてから撃つ。",
        "味方が前に出たタイミングで一緒にラインを上げる。"
      ],
      "advantage": [
        "人数有利ができたら、オブジェクトだけでなく敵の復帰口を見て時間を稼ぐ。",
        "ウルトラショットは敵高台・関門・進行先など、メインで届かない場所に使う。",
        "深追いより、生存して塗りとルール関与を続けることを優先する。"
      ],
      "disadvantage": [
        "自陣側を塗ってスペシャルを準備し、味方と同時に入る。",
        "人数不利でオブジェクトに単独特攻しない。"
      ],
      "comeback": {
        "steps": [
          "自陣側と中央手前を塗り返し、ウルトラショットを準備する。",
          "オブジェクト周辺・高台・関門前の敵をウルトラショットやキューバンボムでどかす。",
          "味方の復帰・スペシャルに合わせて中央へ入り、落とした敵の位置を塗りで塞ぐ。"
        ]
      },
      "defense": {
        "priorities": [
          "オブジェクトに直接関与する敵より前に、護衛や横入りを確認する。",
          "自陣側の足場を塗り返し、潜伏とスーパージャンプ先を消す。",
          "敵のスペシャルに合わせて下がる場所を用意する。"
        ]
      },
      "special_usage": {
        "trizooka": {
          "attack": "敵高台・関門前・オブジェクト前の護衛をどかす。1発目で下げ、残りでルートを作る。",
          "comeback": "味方が入る直前に撃つ。人数不利で雑に撃ち切らない。",
          "defense": "オブジェクト周辺の密集、敵の前衛、後衛の射線を止めるために使う。"
        }
      },
      "routes": [
        {
          "id": "opening_route",
          "label": "初動ルート",
          "description": "中央手前を塗って、敵位置を見てから主戦場へ入る。"
        },
        {
          "id": "comeback_route",
          "label": "打開ルート",
          "description": "自陣側を塗り返し、スペシャルを準備してから味方と同時に入る。"
        },
        {
          "id": "defense_route",
          "label": "防衛ルート",
          "description": "自陣側の重要地点を塗り返し、横入りと潜伏を消す。"
        }
      ],
      "enemy_threats": [
        "ロックアウト・角待ち・短射程乱戦",
        "長射程が高台や橋上に残ると、スシの射程では正面突破しづらい。",
        "ブラスター・ローラー・筆系の潜伏や横入りは、塗り返しとボム確認で拒否する。"
      ],
      "mistakes": [
        "一度押された状態で単独正面突破しない。エリアを取っても奥へ行きすぎて倒されない。",
        "メインだけで射程負け相手を倒そうとする。",
        "打開時に味方を待たず、一人でオブジェクトへ触りに行く。"
      ],
      "map_annotations": [
        {
          "number": 1,
          "label": "初動・打開の通過点",
          "x": 0.5,
          "y": 0.56
        },
        {
          "number": 2,
          "label": "主戦場・オブジェクト",
          "x": 0.5,
          "y": 0.5
        },
        {
          "number": 3,
          "label": "左側の警戒地点",
          "x": 0.4,
          "y": 0.36
        },
        {
          "number": 4,
          "label": "右側の警戒地点",
          "x": 0.6,
          "y": 0.36
        },
        {
          "number": 5,
          "label": "自陣側の打開起点",
          "x": 0.5,
          "y": 0.69
        }
      ]
    }
  },
  {
    "id": "rainmaker_mincemeat_metalworks_splattershot",
    "rule": "rainmaker",
    "rule_name_ja": "ガチホコ",
    "stage": {
      "id": "mincemeat_metalworks",
      "name_ja": "マテガイ放水路",
      "short_name_ja": "マテガイ"
    },
    "weapon": "splattershot",
    "assets": {
      "summary_image": "assets/strategy-maps/rainmaker_mincemeat_metalworks_summary.svg",
      "detail_image": "assets/strategy-maps/rainmaker_mincemeat_metalworks_detail.svg"
    },
    "summary": {
      "focus": "中央で割った後すぐ持たず、護衛を落としてからルート選択。縦長なので防衛はホコ持ちより護衛処理を優先する。",
      "opening": "初動はホコ割りに参加しつつ、割り負けそうなら引く。割ったら中央の敵を落としてから持つ。",
      "comeback": "自陣側でウルショを準備し、ホコ持ちの前にいる護衛と中央高台をどかして止める。",
      "defense": "ホコの進行ルートにキューバンを置き、ホコ持ちの足を止めて護衛を先に落とす。",
      "ng": "ホコを持って単独中央突破しない。割り負け後に中央へ残って連続デスしない。",
      "checklist": [
        "中央で割った後すぐ持たず、護衛を落としてからルート選択",
        "ウルショは高台・関門・進行先など、メインで届きにくい敵をどかすために使う",
        "人数不利では無理に前へ出ず、塗り返しと味方合流を優先する"
      ]
    },
    "detail": {
      "basic_plan": "中央で割った後すぐ持たず、護衛を落としてからルート選択。縦長なので防衛はホコ持ちより護衛処理を優先する。 スシは万能だが射程で押し切る武器ではないため、塗り・ボム・ウルショを組み合わせて有利な距離だけ戦う。",
      "opening": {
        "route": "初動はホコ割りに参加しつつ、割り負けそうなら引く。割ったら中央の敵を落としてから持つ。",
        "first_goal": "中央手前の足場を作り、味方が動ける塗りと敵位置の情報を取る。",
        "avoid": "ホコを持って単独中央突破しない。割り負け後に中央へ残って連続デスしない。"
      },
      "key_positions": [
        {
          "id": "main_objective",
          "label": "中央ホコ・左右進行ルート",
          "purpose": "主戦場。ここを塗り・ボム・対面で維持する。",
          "risk": "縦長射線・護衛の前詰め"
        },
        {
          "id": "enemy_side",
          "label": "敵陣側の入口・高台",
          "purpose": "抑えで見る場所。敵の復帰と塗り返しを遅らせる。",
          "risk": "深追いすると復帰敵に挟まれる。"
        },
        {
          "id": "own_side",
          "label": "自陣側の打開起点",
          "purpose": "打開時に塗り返してスペシャルを準備する場所。",
          "risk": "塗り返しだけで止まるとルール関与が遅れる。"
        }
      ],
      "neutral": [
        "中央手前の塗りを維持し、敵の進入ルートをキューバンボムで制限する。",
        "射程負けする相手には正面から付き合わず、段差・壁・ボムで動かしてから撃つ。",
        "味方が前に出たタイミングで一緒にラインを上げる。"
      ],
      "advantage": [
        "人数有利ができたら、オブジェクトだけでなく敵の復帰口を見て時間を稼ぐ。",
        "ウルトラショットは敵高台・関門・進行先など、メインで届かない場所に使う。",
        "深追いより、生存して塗りとルール関与を続けることを優先する。"
      ],
      "disadvantage": [
        "自陣側を塗ってスペシャルを準備し、味方と同時に入る。",
        "人数不利でオブジェクトに単独特攻しない。"
      ],
      "comeback": {
        "steps": [
          "自陣側と中央手前を塗り返し、ウルトラショットを準備する。",
          "オブジェクト周辺・高台・関門前の敵をウルトラショットやキューバンボムでどかす。",
          "味方の復帰・スペシャルに合わせて中央へ入り、落とした敵の位置を塗りで塞ぐ。"
        ]
      },
      "defense": {
        "priorities": [
          "オブジェクトに直接関与する敵より前に、護衛や横入りを確認する。",
          "自陣側の足場を塗り返し、潜伏とスーパージャンプ先を消す。",
          "敵のスペシャルに合わせて下がる場所を用意する。"
        ]
      },
      "special_usage": {
        "trizooka": {
          "attack": "敵高台・関門前・オブジェクト前の護衛をどかす。1発目で下げ、残りでルートを作る。",
          "comeback": "味方が入る直前に撃つ。人数不利で雑に撃ち切らない。",
          "defense": "オブジェクト周辺の密集、敵の前衛、後衛の射線を止めるために使う。"
        }
      },
      "routes": [
        {
          "id": "opening_route",
          "label": "初動ルート",
          "description": "中央手前を塗って、敵位置を見てから主戦場へ入る。"
        },
        {
          "id": "comeback_route",
          "label": "打開ルート",
          "description": "自陣側を塗り返し、スペシャルを準備してから味方と同時に入る。"
        },
        {
          "id": "defense_route",
          "label": "防衛ルート",
          "description": "自陣側の重要地点を塗り返し、横入りと潜伏を消す。"
        }
      ],
      "enemy_threats": [
        "縦長射線・護衛の前詰め",
        "長射程が高台や橋上に残ると、スシの射程では正面突破しづらい。",
        "ブラスター・ローラー・筆系の潜伏や横入りは、塗り返しとボム確認で拒否する。"
      ],
      "mistakes": [
        "ホコを持って単独中央突破しない。割り負け後に中央へ残って連続デスしない。",
        "メインだけで射程負け相手を倒そうとする。",
        "打開時に味方を待たず、一人でオブジェクトへ触りに行く。"
      ],
      "map_annotations": [
        {
          "number": 1,
          "label": "初動・打開の通過点",
          "x": 0.5,
          "y": 0.56
        },
        {
          "number": 2,
          "label": "主戦場・オブジェクト",
          "x": 0.5,
          "y": 0.5
        },
        {
          "number": 3,
          "label": "左側の警戒地点",
          "x": 0.4,
          "y": 0.36
        },
        {
          "number": 4,
          "label": "右側の警戒地点",
          "x": 0.6,
          "y": 0.36
        },
        {
          "number": 5,
          "label": "自陣側の打開起点",
          "x": 0.5,
          "y": 0.69
        }
      ]
    }
  },
  {
    "id": "rainmaker_hammerhead_bridge_splattershot",
    "rule": "rainmaker",
    "rule_name_ja": "ガチホコ",
    "stage": {
      "id": "hammerhead_bridge",
      "name_ja": "マサバ海峡大橋",
      "short_name_ja": "マサバ"
    },
    "weapon": "splattershot",
    "assets": {
      "summary_image": "assets/strategy-maps/rainmaker_hammerhead_bridge_summary.svg",
      "detail_image": "assets/strategy-maps/rainmaker_hammerhead_bridge_detail.svg"
    },
    "summary": {
      "focus": "細長い橋の射線を意識し、ホコを持つ前に前方をウルショ・ボムでどかす。防衛は中央橋で止める。",
      "opening": "初動はホコ割りと中央橋の塗り。割った直後に持つより、敵前衛を落として安全な橋上を作る。",
      "comeback": "橋上の敵、ホコ護衛、進行先の箱裏をウルショで退かせ、ホコの足場をキューバンで止める。",
      "defense": "中央橋で止めるのが基本。自陣深くまで引かず、ホコ持ちの前の護衛から落とす。",
      "ng": "細い橋でホコを持ったまま孤立しない。敵長射程が残っているのに直線ルートへ出ない。",
      "checklist": [
        "細長い橋の射線を意識し、ホコを持つ前に前方をウルショ・ボムでどかす",
        "ウルショは高台・関門・進行先など、メインで届きにくい敵をどかすために使う",
        "人数不利では無理に前へ出ず、塗り返しと味方合流を優先する"
      ]
    },
    "detail": {
      "basic_plan": "細長い橋の射線を意識し、ホコを持つ前に前方をウルショ・ボムでどかす。防衛は中央橋で止める。 スシは万能だが射程で押し切る武器ではないため、塗り・ボム・ウルショを組み合わせて有利な距離だけ戦う。",
      "opening": {
        "route": "初動はホコ割りと中央橋の塗り。割った直後に持つより、敵前衛を落として安全な橋上を作る。",
        "first_goal": "中央手前の足場を作り、味方が動ける塗りと敵位置の情報を取る。",
        "avoid": "細い橋でホコを持ったまま孤立しない。敵長射程が残っているのに直線ルートへ出ない。"
      },
      "key_positions": [
        {
          "id": "main_objective",
          "label": "中央橋・箱裏・ホコ進行路",
          "purpose": "主戦場。ここを塗り・ボム・対面で維持する。",
          "risk": "直線射線・箱裏潜伏・長射程"
        },
        {
          "id": "enemy_side",
          "label": "敵陣側の入口・高台",
          "purpose": "抑えで見る場所。敵の復帰と塗り返しを遅らせる。",
          "risk": "深追いすると復帰敵に挟まれる。"
        },
        {
          "id": "own_side",
          "label": "自陣側の打開起点",
          "purpose": "打開時に塗り返してスペシャルを準備する場所。",
          "risk": "塗り返しだけで止まるとルール関与が遅れる。"
        }
      ],
      "neutral": [
        "中央手前の塗りを維持し、敵の進入ルートをキューバンボムで制限する。",
        "射程負けする相手には正面から付き合わず、段差・壁・ボムで動かしてから撃つ。",
        "味方が前に出たタイミングで一緒にラインを上げる。"
      ],
      "advantage": [
        "人数有利ができたら、オブジェクトだけでなく敵の復帰口を見て時間を稼ぐ。",
        "ウルトラショットは敵高台・関門・進行先など、メインで届かない場所に使う。",
        "深追いより、生存して塗りとルール関与を続けることを優先する。"
      ],
      "disadvantage": [
        "自陣側を塗ってスペシャルを準備し、味方と同時に入る。",
        "人数不利でオブジェクトに単独特攻しない。"
      ],
      "comeback": {
        "steps": [
          "自陣側と中央手前を塗り返し、ウルトラショットを準備する。",
          "オブジェクト周辺・高台・関門前の敵をウルトラショットやキューバンボムでどかす。",
          "味方の復帰・スペシャルに合わせて中央へ入り、落とした敵の位置を塗りで塞ぐ。"
        ]
      },
      "defense": {
        "priorities": [
          "オブジェクトに直接関与する敵より前に、護衛や横入りを確認する。",
          "自陣側の足場を塗り返し、潜伏とスーパージャンプ先を消す。",
          "敵のスペシャルに合わせて下がる場所を用意する。"
        ]
      },
      "special_usage": {
        "trizooka": {
          "attack": "敵高台・関門前・オブジェクト前の護衛をどかす。1発目で下げ、残りでルートを作る。",
          "comeback": "味方が入る直前に撃つ。人数不利で雑に撃ち切らない。",
          "defense": "オブジェクト周辺の密集、敵の前衛、後衛の射線を止めるために使う。"
        }
      },
      "routes": [
        {
          "id": "opening_route",
          "label": "初動ルート",
          "description": "中央手前を塗って、敵位置を見てから主戦場へ入る。"
        },
        {
          "id": "comeback_route",
          "label": "打開ルート",
          "description": "自陣側を塗り返し、スペシャルを準備してから味方と同時に入る。"
        },
        {
          "id": "defense_route",
          "label": "防衛ルート",
          "description": "自陣側の重要地点を塗り返し、横入りと潜伏を消す。"
        }
      ],
      "enemy_threats": [
        "直線射線・箱裏潜伏・長射程",
        "長射程が高台や橋上に残ると、スシの射程では正面突破しづらい。",
        "ブラスター・ローラー・筆系の潜伏や横入りは、塗り返しとボム確認で拒否する。"
      ],
      "mistakes": [
        "細い橋でホコを持ったまま孤立しない。敵長射程が残っているのに直線ルートへ出ない。",
        "メインだけで射程負け相手を倒そうとする。",
        "打開時に味方を待たず、一人でオブジェクトへ触りに行く。"
      ],
      "map_annotations": [
        {
          "number": 1,
          "label": "初動・打開の通過点",
          "x": 0.5,
          "y": 0.56
        },
        {
          "number": 2,
          "label": "主戦場・オブジェクト",
          "x": 0.5,
          "y": 0.5
        },
        {
          "number": 3,
          "label": "左側の警戒地点",
          "x": 0.4,
          "y": 0.36
        },
        {
          "number": 4,
          "label": "右側の警戒地点",
          "x": 0.6,
          "y": 0.36
        },
        {
          "number": 5,
          "label": "自陣側の打開起点",
          "x": 0.5,
          "y": 0.69
        }
      ]
    }
  },
  {
    "id": "tower_control_bluefin_depot_splattershot",
    "rule": "tower_control",
    "rule_name_ja": "ガチヤグラ",
    "stage": {
      "id": "bluefin_depot",
      "name_ja": "カジキ空港",
      "short_name_ja": "カジキ"
    },
    "weapon": "splattershot",
    "assets": {
      "summary_image": "assets/strategy-maps/tower_control_bluefin_depot_summary.svg",
      "detail_image": "assets/strategy-maps/tower_control_bluefin_depot_detail.svg"
    },
    "summary": {
      "focus": "ヤグラが中央から右へ進み、その後左側へ渡る流れを意識。関門前はヤグラ前の敵をウルショで退かす。",
      "opening": "初動はヤグラ周辺を塗り、中央で人数有利を作る。水際・段差付近で孤立しない。",
      "comeback": "自陣側からヤグラ進路を塗り、関門付近の敵高台・ヤグラ上をウルショで掃除してから止める。",
      "defense": "関門前で止める意識。ヤグラ上だけでなく、ヤグラ前に出る護衛を先に落とす。",
      "ng": "人数不利でヤグラに乗り続けない。段差下からヤグラ上だけを撃ち続けない。",
      "checklist": [
        "ヤグラが中央から右へ進み、その後左側へ渡る流れを意識",
        "ウルショは高台・関門・進行先など、メインで届きにくい敵をどかすために使う",
        "人数不利では無理に前へ出ず、塗り返しと味方合流を優先する"
      ]
    },
    "detail": {
      "basic_plan": "ヤグラが中央から右へ進み、その後左側へ渡る流れを意識。関門前はヤグラ前の敵をウルショで退かす。 スシは万能だが射程で押し切る武器ではないため、塗り・ボム・ウルショを組み合わせて有利な距離だけ戦う。",
      "opening": {
        "route": "初動はヤグラ周辺を塗り、中央で人数有利を作る。水際・段差付近で孤立しない。",
        "first_goal": "中央手前の足場を作り、味方が動ける塗りと敵位置の情報を取る。",
        "avoid": "人数不利でヤグラに乗り続けない。段差下からヤグラ上だけを撃ち続けない。"
      },
      "key_positions": [
        {
          "id": "main_objective",
          "label": "中央ヤグラ・第1関門・左右高台",
          "purpose": "主戦場。ここを塗り・ボム・対面で維持する。",
          "risk": "水際の孤立・関門前ロック"
        },
        {
          "id": "enemy_side",
          "label": "敵陣側の入口・高台",
          "purpose": "抑えで見る場所。敵の復帰と塗り返しを遅らせる。",
          "risk": "深追いすると復帰敵に挟まれる。"
        },
        {
          "id": "own_side",
          "label": "自陣側の打開起点",
          "purpose": "打開時に塗り返してスペシャルを準備する場所。",
          "risk": "塗り返しだけで止まるとルール関与が遅れる。"
        }
      ],
      "neutral": [
        "中央手前の塗りを維持し、敵の進入ルートをキューバンボムで制限する。",
        "射程負けする相手には正面から付き合わず、段差・壁・ボムで動かしてから撃つ。",
        "味方が前に出たタイミングで一緒にラインを上げる。"
      ],
      "advantage": [
        "人数有利ができたら、オブジェクトだけでなく敵の復帰口を見て時間を稼ぐ。",
        "ウルトラショットは敵高台・関門・進行先など、メインで届かない場所に使う。",
        "深追いより、生存して塗りとルール関与を続けることを優先する。"
      ],
      "disadvantage": [
        "自陣側を塗ってスペシャルを準備し、味方と同時に入る。",
        "人数不利でオブジェクトに単独特攻しない。"
      ],
      "comeback": {
        "steps": [
          "自陣側と中央手前を塗り返し、ウルトラショットを準備する。",
          "オブジェクト周辺・高台・関門前の敵をウルトラショットやキューバンボムでどかす。",
          "味方の復帰・スペシャルに合わせて中央へ入り、落とした敵の位置を塗りで塞ぐ。"
        ]
      },
      "defense": {
        "priorities": [
          "オブジェクトに直接関与する敵より前に、護衛や横入りを確認する。",
          "自陣側の足場を塗り返し、潜伏とスーパージャンプ先を消す。",
          "敵のスペシャルに合わせて下がる場所を用意する。"
        ]
      },
      "special_usage": {
        "trizooka": {
          "attack": "敵高台・関門前・オブジェクト前の護衛をどかす。1発目で下げ、残りでルートを作る。",
          "comeback": "味方が入る直前に撃つ。人数不利で雑に撃ち切らない。",
          "defense": "オブジェクト周辺の密集、敵の前衛、後衛の射線を止めるために使う。"
        }
      },
      "routes": [
        {
          "id": "opening_route",
          "label": "初動ルート",
          "description": "中央手前を塗って、敵位置を見てから主戦場へ入る。"
        },
        {
          "id": "comeback_route",
          "label": "打開ルート",
          "description": "自陣側を塗り返し、スペシャルを準備してから味方と同時に入る。"
        },
        {
          "id": "defense_route",
          "label": "防衛ルート",
          "description": "自陣側の重要地点を塗り返し、横入りと潜伏を消す。"
        }
      ],
      "enemy_threats": [
        "水際の孤立・関門前ロック",
        "長射程が高台や橋上に残ると、スシの射程では正面突破しづらい。",
        "ブラスター・ローラー・筆系の潜伏や横入りは、塗り返しとボム確認で拒否する。"
      ],
      "mistakes": [
        "人数不利でヤグラに乗り続けない。段差下からヤグラ上だけを撃ち続けない。",
        "メインだけで射程負け相手を倒そうとする。",
        "打開時に味方を待たず、一人でオブジェクトへ触りに行く。"
      ],
      "map_annotations": [
        {
          "number": 1,
          "label": "初動・打開の通過点",
          "x": 0.5,
          "y": 0.56
        },
        {
          "number": 2,
          "label": "主戦場・オブジェクト",
          "x": 0.5,
          "y": 0.5
        },
        {
          "number": 3,
          "label": "左側の警戒地点",
          "x": 0.4,
          "y": 0.36
        },
        {
          "number": 4,
          "label": "右側の警戒地点",
          "x": 0.6,
          "y": 0.36
        },
        {
          "number": 5,
          "label": "自陣側の打開起点",
          "x": 0.5,
          "y": 0.69
        }
      ]
    }
  },
  {
    "id": "tower_control_urchin_underpass_splattershot",
    "rule": "tower_control",
    "rule_name_ja": "ガチヤグラ",
    "stage": {
      "id": "urchin_underpass",
      "name_ja": "デカライン高架下",
      "short_name_ja": "デカライン"
    },
    "weapon": "splattershot",
    "assets": {
      "summary_image": "assets/strategy-maps/tower_control_urchin_underpass_summary.svg",
      "detail_image": "assets/strategy-maps/tower_control_urchin_underpass_detail.svg"
    },
    "summary": {
      "focus": "中央広場でヤグラ周りを塗り、ヤグラ前の制圧を優先。左右展開を使って関門前の敵をどかす。",
      "opening": "初動はヤグラ周辺を塗って中央広場を取る。正面だけでなく左右からヤグラを見られないようにする。",
      "comeback": "自陣側からヤグラ進路を塗り返し、ウルショでヤグラ上・関門周辺・高台をどかして止める。",
      "defense": "ヤグラ上よりヤグラ前の護衛を優先。関門で止めるために左右通路も見る。",
      "ng": "ヤグラに乗ることだけを優先しない。中央奥へ深追いしてヤグラ周りを空けない。",
      "checklist": [
        "中央広場でヤグラ周りを塗り、ヤグラ前の制圧を優先",
        "ウルショは高台・関門・進行先など、メインで届きにくい敵をどかすために使う",
        "人数不利では無理に前へ出ず、塗り返しと味方合流を優先する"
      ]
    },
    "detail": {
      "basic_plan": "中央広場でヤグラ周りを塗り、ヤグラ前の制圧を優先。左右展開を使って関門前の敵をどかす。 スシは万能だが射程で押し切る武器ではないため、塗り・ボム・ウルショを組み合わせて有利な距離だけ戦う。",
      "opening": {
        "route": "初動はヤグラ周辺を塗って中央広場を取る。正面だけでなく左右からヤグラを見られないようにする。",
        "first_goal": "中央手前の足場を作り、味方が動ける塗りと敵位置の情報を取る。",
        "avoid": "ヤグラに乗ることだけを優先しない。中央奥へ深追いしてヤグラ周りを空けない。"
      },
      "key_positions": [
        {
          "id": "main_objective",
          "label": "中央広場・ヤグラ進路・左右通路",
          "purpose": "主戦場。ここを塗り・ボム・対面で維持する。",
          "risk": "左右展開・関門前の固め"
        },
        {
          "id": "enemy_side",
          "label": "敵陣側の入口・高台",
          "purpose": "抑えで見る場所。敵の復帰と塗り返しを遅らせる。",
          "risk": "深追いすると復帰敵に挟まれる。"
        },
        {
          "id": "own_side",
          "label": "自陣側の打開起点",
          "purpose": "打開時に塗り返してスペシャルを準備する場所。",
          "risk": "塗り返しだけで止まるとルール関与が遅れる。"
        }
      ],
      "neutral": [
        "中央手前の塗りを維持し、敵の進入ルートをキューバンボムで制限する。",
        "射程負けする相手には正面から付き合わず、段差・壁・ボムで動かしてから撃つ。",
        "味方が前に出たタイミングで一緒にラインを上げる。"
      ],
      "advantage": [
        "人数有利ができたら、オブジェクトだけでなく敵の復帰口を見て時間を稼ぐ。",
        "ウルトラショットは敵高台・関門・進行先など、メインで届かない場所に使う。",
        "深追いより、生存して塗りとルール関与を続けることを優先する。"
      ],
      "disadvantage": [
        "自陣側を塗ってスペシャルを準備し、味方と同時に入る。",
        "人数不利でオブジェクトに単独特攻しない。"
      ],
      "comeback": {
        "steps": [
          "自陣側と中央手前を塗り返し、ウルトラショットを準備する。",
          "オブジェクト周辺・高台・関門前の敵をウルトラショットやキューバンボムでどかす。",
          "味方の復帰・スペシャルに合わせて中央へ入り、落とした敵の位置を塗りで塞ぐ。"
        ]
      },
      "defense": {
        "priorities": [
          "オブジェクトに直接関与する敵より前に、護衛や横入りを確認する。",
          "自陣側の足場を塗り返し、潜伏とスーパージャンプ先を消す。",
          "敵のスペシャルに合わせて下がる場所を用意する。"
        ]
      },
      "special_usage": {
        "trizooka": {
          "attack": "敵高台・関門前・オブジェクト前の護衛をどかす。1発目で下げ、残りでルートを作る。",
          "comeback": "味方が入る直前に撃つ。人数不利で雑に撃ち切らない。",
          "defense": "オブジェクト周辺の密集、敵の前衛、後衛の射線を止めるために使う。"
        }
      },
      "routes": [
        {
          "id": "opening_route",
          "label": "初動ルート",
          "description": "中央手前を塗って、敵位置を見てから主戦場へ入る。"
        },
        {
          "id": "comeback_route",
          "label": "打開ルート",
          "description": "自陣側を塗り返し、スペシャルを準備してから味方と同時に入る。"
        },
        {
          "id": "defense_route",
          "label": "防衛ルート",
          "description": "自陣側の重要地点を塗り返し、横入りと潜伏を消す。"
        }
      ],
      "enemy_threats": [
        "左右展開・関門前の固め",
        "長射程が高台や橋上に残ると、スシの射程では正面突破しづらい。",
        "ブラスター・ローラー・筆系の潜伏や横入りは、塗り返しとボム確認で拒否する。"
      ],
      "mistakes": [
        "ヤグラに乗ることだけを優先しない。中央奥へ深追いしてヤグラ周りを空けない。",
        "メインだけで射程負け相手を倒そうとする。",
        "打開時に味方を待たず、一人でオブジェクトへ触りに行く。"
      ],
      "map_annotations": [
        {
          "number": 1,
          "label": "初動・打開の通過点",
          "x": 0.5,
          "y": 0.56
        },
        {
          "number": 2,
          "label": "主戦場・オブジェクト",
          "x": 0.5,
          "y": 0.5
        },
        {
          "number": 3,
          "label": "左側の警戒地点",
          "x": 0.4,
          "y": 0.36
        },
        {
          "number": 4,
          "label": "右側の警戒地点",
          "x": 0.6,
          "y": 0.36
        },
        {
          "number": 5,
          "label": "自陣側の打開起点",
          "x": 0.5,
          "y": 0.69
        }
      ]
    }
  },
  {
    "id": "rainmaker_manta_maria_splattershot",
    "rule": "rainmaker",
    "rule_name_ja": "ガチホコ",
    "stage": {
      "id": "manta_maria",
      "name_ja": "マンタマリア号",
      "short_name_ja": "マンタ"
    },
    "weapon": "splattershot",
    "assets": {
      "summary_image": "assets/strategy-maps/rainmaker_manta_maria_summary.svg",
      "detail_image": "assets/strategy-maps/rainmaker_manta_maria_detail.svg"
    },
    "summary": {
      "focus": "中央マスト周りと網上の射線を意識し、ホコを持つ前に前方・高台・網上をウルショでどかす。",
      "opening": "初動はホコ割りに参加しつつ、割り負けそうなら即下がる。割った後はマスト周りの敵を落としてから持つ。",
      "comeback": "自陣側を塗ってウルショを準備し、ホコ前の護衛・網上・中央マスト周りをどかして止める。",
      "defense": "ホコ進行先にキューバンを置き、ホコ持ちの足を止めてから護衛を落とす。網上からの射線も見る。",
      "ng": "ホコ持ちで網上・中央マスト周辺に長く滞在しない。敵高台が残っているのに直進しない。",
      "checklist": [
        "中央マスト周りと網上の射線を意識し、ホコを持つ前に前方・高台・網上をウルショでどかす",
        "ウルショは高台・関門・ゴール前など、メインで届きにくい敵をどかすために使う",
        "人数不利では無理に前へ出ず、塗り返しと味方合流を優先する"
      ]
    },
    "detail": {
      "basic_plan": "中央マスト周りと網上の射線を意識し、ホコを持つ前に前方・高台・網上をウルショでどかす。 スシは万能だが射程で押し切る武器ではないため、塗り・ボム・ウルショを組み合わせて有利な距離だけ戦う。",
      "opening": {
        "route": "初動はホコ割りに参加しつつ、割り負けそうなら即下がる。割った後はマスト周りの敵を落としてから持つ。",
        "first_goal": "中央手前の足場を作り、味方が動ける塗りと敵位置の情報を取る。",
        "avoid": "ホコ持ちで網上・中央マスト周辺に長く滞在しない。敵高台が残っているのに直進しない。"
      },
      "key_positions": [
        {
          "id": "main_objective",
          "label": "中央マスト・網上・ホコ進行路",
          "purpose": "主戦場。ここを塗り・ボム・対面で維持する。",
          "risk": "網上射線・中央マスト周りの挟み"
        },
        {
          "id": "enemy_side",
          "label": "敵陣側の入口・高台・ゴール前",
          "purpose": "抑え・攻めで見る場所。敵の復帰と塗り返し、またはゴール前待機を遅らせる。",
          "risk": "深追いすると復帰敵に挟まれる。"
        },
        {
          "id": "own_side",
          "label": "自陣側の打開起点",
          "purpose": "打開時に塗り返してスペシャルを準備する場所。",
          "risk": "塗り返しだけで止まるとルール関与が遅れる。"
        }
      ],
      "neutral": [
        "中央手前の塗りを維持し、敵の進入ルートをキューバンボムで制限する。",
        "射程負けする相手には正面から付き合わず、段差・壁・ボムで動かしてから撃つ。",
        "味方が前に出たタイミングで一緒にラインを上げる。"
      ],
      "advantage": [
        "人数有利ができたら、オブジェクトだけでなく敵の復帰口を見て時間を稼ぐ。",
        "ウルトラショットは敵高台・関門・進行先・ゴール前など、メインで届かない場所に使う。",
        "深追いより、生存して塗りとルール関与を続けることを優先する。"
      ],
      "disadvantage": [
        "自陣側を塗ってスペシャルを準備し、味方と同時に入る。",
        "人数不利でオブジェクトに単独特攻しない。"
      ],
      "comeback": {
        "steps": [
          "自陣側と中央手前を塗り返し、ウルトラショットを準備する。",
          "オブジェクト周辺・高台・関門前・ゴール前の敵をウルトラショットやキューバンボムでどかす。",
          "味方の復帰・スペシャルに合わせて中央へ入り、落とした敵の位置を塗りで塞ぐ。"
        ]
      },
      "defense": {
        "priorities": [
          "オブジェクトに直接関与する敵より前に、護衛や横入りを確認する。",
          "自陣側の足場を塗り返し、潜伏とスーパージャンプ先を消す。",
          "敵のスペシャルに合わせて下がる場所を用意する。"
        ]
      },
      "special_usage": {
        "trizooka": {
          "attack": "敵高台・関門前・オブジェクト前・ゴール前の護衛をどかす。1発目で下げ、残りでルートを作る。",
          "comeback": "味方が入る直前に撃つ。人数不利で雑に撃ち切らない。",
          "defense": "オブジェクト周辺の密集、敵の前衛、後衛の射線を止めるために使う。"
        }
      },
      "routes": [
        {
          "id": "opening_route",
          "label": "初動ルート",
          "description": "中央手前を塗って、敵位置を見てから主戦場へ入る。"
        },
        {
          "id": "comeback_route",
          "label": "打開ルート",
          "description": "自陣側を塗り返し、スペシャルを準備してから味方と同時に入る。"
        },
        {
          "id": "defense_route",
          "label": "防衛ルート",
          "description": "自陣側の重要地点を塗り返し、横入りと潜伏を消す。"
        }
      ],
      "enemy_threats": [
        "網上射線・中央マスト周りの挟み",
        "長射程が高台や橋上に残ると、スシの射程では正面突破しづらい。",
        "ブラスター・ローラー・筆系の潜伏や横入りは、塗り返しとボム確認で拒否する。"
      ],
      "mistakes": [
        "ホコ持ちで網上・中央マスト周辺に長く滞在しない。敵高台が残っているのに直進しない。",
        "メインだけで射程負け相手を倒そうとする。",
        "打開時に味方を待たず、一人でオブジェクトへ触りに行く。"
      ],
      "map_annotations": [
        {
          "number": 1,
          "label": "初動・打開の通過点",
          "x": 0.5,
          "y": 0.56
        },
        {
          "number": 2,
          "label": "主戦場・オブジェクト",
          "x": 0.5,
          "y": 0.5
        },
        {
          "number": 3,
          "label": "左側の警戒地点",
          "x": 0.4,
          "y": 0.36
        },
        {
          "number": 4,
          "label": "右側の警戒地点",
          "x": 0.6,
          "y": 0.36
        },
        {
          "number": 5,
          "label": "自陣側の打開起点",
          "x": 0.5,
          "y": 0.69
        }
      ]
    }
  },
  {
    "id": "rainmaker_brinewater_springs_splattershot",
    "rule": "rainmaker",
    "rule_name_ja": "ガチホコ",
    "stage": {
      "id": "brinewater_springs",
      "name_ja": "タカアシ経済特区",
      "short_name_ja": "タカアシ"
    },
    "weapon": "splattershot",
    "assets": {
      "summary_image": "assets/strategy-maps/rainmaker_brinewater_springs_summary.svg",
      "detail_image": "assets/strategy-maps/rainmaker_brinewater_springs_detail.svg"
    },
    "summary": {
      "focus": "縦に狭く射線が通りやすいので、ホコを持つ前に前方を落とす。中央突破よりも人数有利の確定を優先する。",
      "opening": "初動はホコ割りと中央手前塗り。割った直後に持たず、敵前衛と高台を見てからルートを選ぶ。",
      "comeback": "自陣側でウルショを溜め、ホコ前護衛・高台・進行先の潜伏をどかして止める。",
      "defense": "中央寄りで止めたい。自陣深くに入られる前に、ホコ持ちの足場と護衛をキューバンで削る。",
      "ng": "射線が通る場所でホコを持って孤立しない。防衛でホコ持ちだけを追って護衛を放置しない。",
      "checklist": [
        "縦に狭く射線が通りやすいので、ホコを持つ前に前方を落とす",
        "ウルショは高台・関門・ゴール前など、メインで届きにくい敵をどかすために使う",
        "人数不利では無理に前へ出ず、塗り返しと味方合流を優先する"
      ]
    },
    "detail": {
      "basic_plan": "縦に狭く射線が通りやすいので、ホコを持つ前に前方を落とす。中央突破よりも人数有利の確定を優先する。 スシは万能だが射程で押し切る武器ではないため、塗り・ボム・ウルショを組み合わせて有利な距離だけ戦う。",
      "opening": {
        "route": "初動はホコ割りと中央手前塗り。割った直後に持たず、敵前衛と高台を見てからルートを選ぶ。",
        "first_goal": "中央手前の足場を作り、味方が動ける塗りと敵位置の情報を取る。",
        "avoid": "射線が通る場所でホコを持って孤立しない。防衛でホコ持ちだけを追って護衛を放置しない。"
      },
      "key_positions": [
        {
          "id": "main_objective",
          "label": "中央ホコ・高台射線・狭い進行路",
          "purpose": "主戦場。ここを塗り・ボム・対面で維持する。",
          "risk": "縦射線・高台・ホコ前護衛"
        },
        {
          "id": "enemy_side",
          "label": "敵陣側の入口・高台・ゴール前",
          "purpose": "抑え・攻めで見る場所。敵の復帰と塗り返し、またはゴール前待機を遅らせる。",
          "risk": "深追いすると復帰敵に挟まれる。"
        },
        {
          "id": "own_side",
          "label": "自陣側の打開起点",
          "purpose": "打開時に塗り返してスペシャルを準備する場所。",
          "risk": "塗り返しだけで止まるとルール関与が遅れる。"
        }
      ],
      "neutral": [
        "中央手前の塗りを維持し、敵の進入ルートをキューバンボムで制限する。",
        "射程負けする相手には正面から付き合わず、段差・壁・ボムで動かしてから撃つ。",
        "味方が前に出たタイミングで一緒にラインを上げる。"
      ],
      "advantage": [
        "人数有利ができたら、オブジェクトだけでなく敵の復帰口を見て時間を稼ぐ。",
        "ウルトラショットは敵高台・関門・進行先・ゴール前など、メインで届かない場所に使う。",
        "深追いより、生存して塗りとルール関与を続けることを優先する。"
      ],
      "disadvantage": [
        "自陣側を塗ってスペシャルを準備し、味方と同時に入る。",
        "人数不利でオブジェクトに単独特攻しない。"
      ],
      "comeback": {
        "steps": [
          "自陣側と中央手前を塗り返し、ウルトラショットを準備する。",
          "オブジェクト周辺・高台・関門前・ゴール前の敵をウルトラショットやキューバンボムでどかす。",
          "味方の復帰・スペシャルに合わせて中央へ入り、落とした敵の位置を塗りで塞ぐ。"
        ]
      },
      "defense": {
        "priorities": [
          "オブジェクトに直接関与する敵より前に、護衛や横入りを確認する。",
          "自陣側の足場を塗り返し、潜伏とスーパージャンプ先を消す。",
          "敵のスペシャルに合わせて下がる場所を用意する。"
        ]
      },
      "special_usage": {
        "trizooka": {
          "attack": "敵高台・関門前・オブジェクト前・ゴール前の護衛をどかす。1発目で下げ、残りでルートを作る。",
          "comeback": "味方が入る直前に撃つ。人数不利で雑に撃ち切らない。",
          "defense": "オブジェクト周辺の密集、敵の前衛、後衛の射線を止めるために使う。"
        }
      },
      "routes": [
        {
          "id": "opening_route",
          "label": "初動ルート",
          "description": "中央手前を塗って、敵位置を見てから主戦場へ入る。"
        },
        {
          "id": "comeback_route",
          "label": "打開ルート",
          "description": "自陣側を塗り返し、スペシャルを準備してから味方と同時に入る。"
        },
        {
          "id": "defense_route",
          "label": "防衛ルート",
          "description": "自陣側の重要地点を塗り返し、横入りと潜伏を消す。"
        }
      ],
      "enemy_threats": [
        "縦射線・高台・ホコ前護衛",
        "長射程が高台や橋上に残ると、スシの射程では正面突破しづらい。",
        "ブラスター・ローラー・筆系の潜伏や横入りは、塗り返しとボム確認で拒否する。"
      ],
      "mistakes": [
        "射線が通る場所でホコを持って孤立しない。防衛でホコ持ちだけを追って護衛を放置しない。",
        "メインだけで射程負け相手を倒そうとする。",
        "打開時に味方を待たず、一人でオブジェクトへ触りに行く。"
      ],
      "map_annotations": [
        {
          "number": 1,
          "label": "初動・打開の通過点",
          "x": 0.5,
          "y": 0.56
        },
        {
          "number": 2,
          "label": "主戦場・オブジェクト",
          "x": 0.5,
          "y": 0.5
        },
        {
          "number": 3,
          "label": "左側の警戒地点",
          "x": 0.4,
          "y": 0.36
        },
        {
          "number": 4,
          "label": "右側の警戒地点",
          "x": 0.6,
          "y": 0.36
        },
        {
          "number": 5,
          "label": "自陣側の打開起点",
          "x": 0.5,
          "y": 0.69
        }
      ]
    }
  },
  {
    "id": "splat_zones_hammerhead_bridge_splattershot",
    "rule": "splat_zones",
    "rule_name_ja": "ガチエリア",
    "stage": {
      "id": "hammerhead_bridge",
      "name_ja": "マサバ海峡大橋",
      "short_name_ja": "マサバ"
    },
    "weapon": "splattershot",
    "assets": {
      "summary_image": "assets/strategy-maps/splat_zones_hammerhead_bridge_summary.svg",
      "detail_image": "assets/strategy-maps/splat_zones_hammerhead_bridge_detail.svg"
    },
    "summary": {
      "focus": "細長い橋の中央エリアを塗りで維持し、長射程・箱裏・橋上をウルショでどかしてから前へ出る。",
      "opening": "初動は中央橋手前を塗り、エリアに触りながら敵長射程の位置を見る。橋上で長く撃ち合わない。",
      "comeback": "自陣側を塗ってウルショを準備し、エリア奥・箱裏・長射程をどかしてから塗り返す。",
      "defense": "エリアを取った後は橋上と敵出口を見て、敵に足場を作らせない。",
      "ng": "細い橋上で孤立しない。エリアを塗っただけで前の敵を見ない動きは避ける。",
      "checklist": [
        "細長い橋の中央エリアを塗りで維持し、長射程・箱裏・橋上をウルショでどかしてから前へ出る",
        "ウルショは高台・関門・ゴール前など、メインで届きにくい敵をどかすために使う",
        "人数不利では無理に前へ出ず、塗り返しと味方合流を優先する"
      ]
    },
    "detail": {
      "basic_plan": "細長い橋の中央エリアを塗りで維持し、長射程・箱裏・橋上をウルショでどかしてから前へ出る。 スシは万能だが射程で押し切る武器ではないため、塗り・ボム・ウルショを組み合わせて有利な距離だけ戦う。",
      "opening": {
        "route": "初動は中央橋手前を塗り、エリアに触りながら敵長射程の位置を見る。橋上で長く撃ち合わない。",
        "first_goal": "中央手前の足場を作り、味方が動ける塗りと敵位置の情報を取る。",
        "avoid": "細い橋上で孤立しない。エリアを塗っただけで前の敵を見ない動きは避ける。"
      },
      "key_positions": [
        {
          "id": "main_objective",
          "label": "中央橋エリア・箱裏・敵出口",
          "purpose": "主戦場。ここを塗り・ボム・対面で維持する。",
          "risk": "直線射線・箱裏潜伏・長射程"
        },
        {
          "id": "enemy_side",
          "label": "敵陣側の入口・高台・ゴール前",
          "purpose": "抑え・攻めで見る場所。敵の復帰と塗り返し、またはゴール前待機を遅らせる。",
          "risk": "深追いすると復帰敵に挟まれる。"
        },
        {
          "id": "own_side",
          "label": "自陣側の打開起点",
          "purpose": "打開時に塗り返してスペシャルを準備する場所。",
          "risk": "塗り返しだけで止まるとルール関与が遅れる。"
        }
      ],
      "neutral": [
        "中央手前の塗りを維持し、敵の進入ルートをキューバンボムで制限する。",
        "射程負けする相手には正面から付き合わず、段差・壁・ボムで動かしてから撃つ。",
        "味方が前に出たタイミングで一緒にラインを上げる。"
      ],
      "advantage": [
        "人数有利ができたら、オブジェクトだけでなく敵の復帰口を見て時間を稼ぐ。",
        "ウルトラショットは敵高台・関門・進行先・ゴール前など、メインで届かない場所に使う。",
        "深追いより、生存して塗りとルール関与を続けることを優先する。"
      ],
      "disadvantage": [
        "自陣側を塗ってスペシャルを準備し、味方と同時に入る。",
        "人数不利でオブジェクトに単独特攻しない。"
      ],
      "comeback": {
        "steps": [
          "自陣側と中央手前を塗り返し、ウルトラショットを準備する。",
          "オブジェクト周辺・高台・関門前・ゴール前の敵をウルトラショットやキューバンボムでどかす。",
          "味方の復帰・スペシャルに合わせて中央へ入り、落とした敵の位置を塗りで塞ぐ。"
        ]
      },
      "defense": {
        "priorities": [
          "オブジェクトに直接関与する敵より前に、護衛や横入りを確認する。",
          "自陣側の足場を塗り返し、潜伏とスーパージャンプ先を消す。",
          "敵のスペシャルに合わせて下がる場所を用意する。"
        ]
      },
      "special_usage": {
        "trizooka": {
          "attack": "敵高台・関門前・オブジェクト前・ゴール前の護衛をどかす。1発目で下げ、残りでルートを作る。",
          "comeback": "味方が入る直前に撃つ。人数不利で雑に撃ち切らない。",
          "defense": "オブジェクト周辺の密集、敵の前衛、後衛の射線を止めるために使う。"
        }
      },
      "routes": [
        {
          "id": "opening_route",
          "label": "初動ルート",
          "description": "中央手前を塗って、敵位置を見てから主戦場へ入る。"
        },
        {
          "id": "comeback_route",
          "label": "打開ルート",
          "description": "自陣側を塗り返し、スペシャルを準備してから味方と同時に入る。"
        },
        {
          "id": "defense_route",
          "label": "防衛ルート",
          "description": "自陣側の重要地点を塗り返し、横入りと潜伏を消す。"
        }
      ],
      "enemy_threats": [
        "直線射線・箱裏潜伏・長射程",
        "長射程が高台や橋上に残ると、スシの射程では正面突破しづらい。",
        "ブラスター・ローラー・筆系の潜伏や横入りは、塗り返しとボム確認で拒否する。"
      ],
      "mistakes": [
        "細い橋上で孤立しない。エリアを塗っただけで前の敵を見ない動きは避ける。",
        "メインだけで射程負け相手を倒そうとする。",
        "打開時に味方を待たず、一人でオブジェクトへ触りに行く。"
      ],
      "map_annotations": [
        {
          "number": 1,
          "label": "初動・打開の通過点",
          "x": 0.5,
          "y": 0.56
        },
        {
          "number": 2,
          "label": "主戦場・オブジェクト",
          "x": 0.5,
          "y": 0.5
        },
        {
          "number": 3,
          "label": "左側の警戒地点",
          "x": 0.4,
          "y": 0.36
        },
        {
          "number": 4,
          "label": "右側の警戒地点",
          "x": 0.6,
          "y": 0.36
        },
        {
          "number": 5,
          "label": "自陣側の打開起点",
          "x": 0.5,
          "y": 0.69
        }
      ]
    }
  },
  {
    "id": "splat_zones_inkblot_art_academy_splattershot",
    "rule": "splat_zones",
    "rule_name_ja": "ガチエリア",
    "stage": {
      "id": "inkblot_art_academy",
      "name_ja": "海女美術大学",
      "short_name_ja": "海女美"
    },
    "weapon": "splattershot",
    "assets": {
      "summary_image": "assets/strategy-maps/splat_zones_inkblot_art_academy_summary.svg",
      "detail_image": "assets/strategy-maps/splat_zones_inkblot_art_academy_detail.svg"
    },
    "summary": {
      "focus": "中央エリアと左右高台の取り合い。スシは中央塗りを作り、敵高台・網周辺をウルショでどかす。",
      "opening": "初動は中央手前を塗り、左または右の高台に敵が乗る前に圧をかける。射程負け相手には正面で粘らない。",
      "comeback": "自陣側とエリア手前を塗ってウルショを準備し、敵高台・エリア奥・潜伏をどかしてから入る。",
      "defense": "エリア維持と左右高台のケアを両立する。敵が高台を取ったら無理に詰めず、ボムとウルショで下げる。",
      "ng": "中央だけ見て左右高台を放置しない。敵高台に単独で登って倒されない。",
      "checklist": [
        "中央エリアと左右高台の取り合い",
        "ウルショは高台・関門・ゴール前など、メインで届きにくい敵をどかすために使う",
        "人数不利では無理に前へ出ず、塗り返しと味方合流を優先する"
      ]
    },
    "detail": {
      "basic_plan": "中央エリアと左右高台の取り合い。スシは中央塗りを作り、敵高台・網周辺をウルショでどかす。 スシは万能だが射程で押し切る武器ではないため、塗り・ボム・ウルショを組み合わせて有利な距離だけ戦う。",
      "opening": {
        "route": "初動は中央手前を塗り、左または右の高台に敵が乗る前に圧をかける。射程負け相手には正面で粘らない。",
        "first_goal": "中央手前の足場を作り、味方が動ける塗りと敵位置の情報を取る。",
        "avoid": "中央だけ見て左右高台を放置しない。敵高台に単独で登って倒されない。"
      },
      "key_positions": [
        {
          "id": "main_objective",
          "label": "中央エリア・左右高台・網周辺",
          "purpose": "主戦場。ここを塗り・ボム・対面で維持する。",
          "risk": "高台射線・網上移動・潜伏"
        },
        {
          "id": "enemy_side",
          "label": "敵陣側の入口・高台・ゴール前",
          "purpose": "抑え・攻めで見る場所。敵の復帰と塗り返し、またはゴール前待機を遅らせる。",
          "risk": "深追いすると復帰敵に挟まれる。"
        },
        {
          "id": "own_side",
          "label": "自陣側の打開起点",
          "purpose": "打開時に塗り返してスペシャルを準備する場所。",
          "risk": "塗り返しだけで止まるとルール関与が遅れる。"
        }
      ],
      "neutral": [
        "中央手前の塗りを維持し、敵の進入ルートをキューバンボムで制限する。",
        "射程負けする相手には正面から付き合わず、段差・壁・ボムで動かしてから撃つ。",
        "味方が前に出たタイミングで一緒にラインを上げる。"
      ],
      "advantage": [
        "人数有利ができたら、オブジェクトだけでなく敵の復帰口を見て時間を稼ぐ。",
        "ウルトラショットは敵高台・関門・進行先・ゴール前など、メインで届かない場所に使う。",
        "深追いより、生存して塗りとルール関与を続けることを優先する。"
      ],
      "disadvantage": [
        "自陣側を塗ってスペシャルを準備し、味方と同時に入る。",
        "人数不利でオブジェクトに単独特攻しない。"
      ],
      "comeback": {
        "steps": [
          "自陣側と中央手前を塗り返し、ウルトラショットを準備する。",
          "オブジェクト周辺・高台・関門前・ゴール前の敵をウルトラショットやキューバンボムでどかす。",
          "味方の復帰・スペシャルに合わせて中央へ入り、落とした敵の位置を塗りで塞ぐ。"
        ]
      },
      "defense": {
        "priorities": [
          "オブジェクトに直接関与する敵より前に、護衛や横入りを確認する。",
          "自陣側の足場を塗り返し、潜伏とスーパージャンプ先を消す。",
          "敵のスペシャルに合わせて下がる場所を用意する。"
        ]
      },
      "special_usage": {
        "trizooka": {
          "attack": "敵高台・関門前・オブジェクト前・ゴール前の護衛をどかす。1発目で下げ、残りでルートを作る。",
          "comeback": "味方が入る直前に撃つ。人数不利で雑に撃ち切らない。",
          "defense": "オブジェクト周辺の密集、敵の前衛、後衛の射線を止めるために使う。"
        }
      },
      "routes": [
        {
          "id": "opening_route",
          "label": "初動ルート",
          "description": "中央手前を塗って、敵位置を見てから主戦場へ入る。"
        },
        {
          "id": "comeback_route",
          "label": "打開ルート",
          "description": "自陣側を塗り返し、スペシャルを準備してから味方と同時に入る。"
        },
        {
          "id": "defense_route",
          "label": "防衛ルート",
          "description": "自陣側の重要地点を塗り返し、横入りと潜伏を消す。"
        }
      ],
      "enemy_threats": [
        "高台射線・網上移動・潜伏",
        "長射程が高台や橋上に残ると、スシの射程では正面突破しづらい。",
        "ブラスター・ローラー・筆系の潜伏や横入りは、塗り返しとボム確認で拒否する。"
      ],
      "mistakes": [
        "中央だけ見て左右高台を放置しない。敵高台に単独で登って倒されない。",
        "メインだけで射程負け相手を倒そうとする。",
        "打開時に味方を待たず、一人でオブジェクトへ触りに行く。"
      ],
      "map_annotations": [
        {
          "number": 1,
          "label": "初動・打開の通過点",
          "x": 0.5,
          "y": 0.56
        },
        {
          "number": 2,
          "label": "主戦場・オブジェクト",
          "x": 0.5,
          "y": 0.5
        },
        {
          "number": 3,
          "label": "左側の警戒地点",
          "x": 0.4,
          "y": 0.36
        },
        {
          "number": 4,
          "label": "右側の警戒地点",
          "x": 0.6,
          "y": 0.36
        },
        {
          "number": 5,
          "label": "自陣側の打開起点",
          "x": 0.5,
          "y": 0.69
        }
      ]
    }
  },
  {
    "id": "tower_control_eeltail_alley_splattershot",
    "rule": "tower_control",
    "rule_name_ja": "ガチヤグラ",
    "stage": {
      "id": "eeltail_alley",
      "name_ja": "ゴンズイ地区",
      "short_name_ja": "ゴンズイ"
    },
    "weapon": "splattershot",
    "assets": {
      "summary_image": "assets/strategy-maps/tower_control_eeltail_alley_summary.svg",
      "detail_image": "assets/strategy-maps/tower_control_eeltail_alley_detail.svg"
    },
    "summary": {
      "focus": "広い中央でヤグラ前を掃除し、橋上・高台をウルショで下げてから進める。関門ではヤグラ前の制圧を優先する。",
      "opening": "初動はヤグラ周辺と中央手前を塗る。橋上の敵と長射程位置を見て、無理に正面から乗らない。",
      "comeback": "自陣側を塗り返し、ヤグラ上・橋上・関門前をウルショでどかして止める。",
      "defense": "ヤグラ上だけでなく、ヤグラ前の護衛と橋上から撃つ敵を優先して落とす。",
      "ng": "人数不利でヤグラに乗り続けない。橋上長射程を放置したまま進めない。",
      "checklist": [
        "広い中央でヤグラ前を掃除し、橋上・高台をウルショで下げてから進める",
        "ウルショは高台・関門・ゴール前など、メインで届きにくい敵をどかすために使う",
        "人数不利では無理に前へ出ず、塗り返しと味方合流を優先する"
      ]
    },
    "detail": {
      "basic_plan": "広い中央でヤグラ前を掃除し、橋上・高台をウルショで下げてから進める。関門ではヤグラ前の制圧を優先する。 スシは万能だが射程で押し切る武器ではないため、塗り・ボム・ウルショを組み合わせて有利な距離だけ戦う。",
      "opening": {
        "route": "初動はヤグラ周辺と中央手前を塗る。橋上の敵と長射程位置を見て、無理に正面から乗らない。",
        "first_goal": "中央手前の足場を作り、味方が動ける塗りと敵位置の情報を取る。",
        "avoid": "人数不利でヤグラに乗り続けない。橋上長射程を放置したまま進めない。"
      },
      "key_positions": [
        {
          "id": "main_objective",
          "label": "中央ヤグラ・橋上・関門前",
          "purpose": "主戦場。ここを塗り・ボム・対面で維持する。",
          "risk": "橋上射線・長射程・関門前ロック"
        },
        {
          "id": "enemy_side",
          "label": "敵陣側の入口・高台・ゴール前",
          "purpose": "抑え・攻めで見る場所。敵の復帰と塗り返し、またはゴール前待機を遅らせる。",
          "risk": "深追いすると復帰敵に挟まれる。"
        },
        {
          "id": "own_side",
          "label": "自陣側の打開起点",
          "purpose": "打開時に塗り返してスペシャルを準備する場所。",
          "risk": "塗り返しだけで止まるとルール関与が遅れる。"
        }
      ],
      "neutral": [
        "中央手前の塗りを維持し、敵の進入ルートをキューバンボムで制限する。",
        "射程負けする相手には正面から付き合わず、段差・壁・ボムで動かしてから撃つ。",
        "味方が前に出たタイミングで一緒にラインを上げる。"
      ],
      "advantage": [
        "人数有利ができたら、オブジェクトだけでなく敵の復帰口を見て時間を稼ぐ。",
        "ウルトラショットは敵高台・関門・進行先・ゴール前など、メインで届かない場所に使う。",
        "深追いより、生存して塗りとルール関与を続けることを優先する。"
      ],
      "disadvantage": [
        "自陣側を塗ってスペシャルを準備し、味方と同時に入る。",
        "人数不利でオブジェクトに単独特攻しない。"
      ],
      "comeback": {
        "steps": [
          "自陣側と中央手前を塗り返し、ウルトラショットを準備する。",
          "オブジェクト周辺・高台・関門前・ゴール前の敵をウルトラショットやキューバンボムでどかす。",
          "味方の復帰・スペシャルに合わせて中央へ入り、落とした敵の位置を塗りで塞ぐ。"
        ]
      },
      "defense": {
        "priorities": [
          "オブジェクトに直接関与する敵より前に、護衛や横入りを確認する。",
          "自陣側の足場を塗り返し、潜伏とスーパージャンプ先を消す。",
          "敵のスペシャルに合わせて下がる場所を用意する。"
        ]
      },
      "special_usage": {
        "trizooka": {
          "attack": "敵高台・関門前・オブジェクト前・ゴール前の護衛をどかす。1発目で下げ、残りでルートを作る。",
          "comeback": "味方が入る直前に撃つ。人数不利で雑に撃ち切らない。",
          "defense": "オブジェクト周辺の密集、敵の前衛、後衛の射線を止めるために使う。"
        }
      },
      "routes": [
        {
          "id": "opening_route",
          "label": "初動ルート",
          "description": "中央手前を塗って、敵位置を見てから主戦場へ入る。"
        },
        {
          "id": "comeback_route",
          "label": "打開ルート",
          "description": "自陣側を塗り返し、スペシャルを準備してから味方と同時に入る。"
        },
        {
          "id": "defense_route",
          "label": "防衛ルート",
          "description": "自陣側の重要地点を塗り返し、横入りと潜伏を消す。"
        }
      ],
      "enemy_threats": [
        "橋上射線・長射程・関門前ロック",
        "長射程が高台や橋上に残ると、スシの射程では正面突破しづらい。",
        "ブラスター・ローラー・筆系の潜伏や横入りは、塗り返しとボム確認で拒否する。"
      ],
      "mistakes": [
        "人数不利でヤグラに乗り続けない。橋上長射程を放置したまま進めない。",
        "メインだけで射程負け相手を倒そうとする。",
        "打開時に味方を待たず、一人でオブジェクトへ触りに行く。"
      ],
      "map_annotations": [
        {
          "number": 1,
          "label": "初動・打開の通過点",
          "x": 0.5,
          "y": 0.56
        },
        {
          "number": 2,
          "label": "主戦場・オブジェクト",
          "x": 0.5,
          "y": 0.5
        },
        {
          "number": 3,
          "label": "左側の警戒地点",
          "x": 0.4,
          "y": 0.36
        },
        {
          "number": 4,
          "label": "右側の警戒地点",
          "x": 0.6,
          "y": 0.36
        },
        {
          "number": 5,
          "label": "自陣側の打開起点",
          "x": 0.5,
          "y": 0.69
        }
      ]
    }
  },
  {
    "id": "tower_control_mahi_mahi_resort_splattershot",
    "rule": "tower_control",
    "rule_name_ja": "ガチヤグラ",
    "stage": {
      "id": "mahi_mahi_resort",
      "name_ja": "マヒマヒリゾート＆スパ",
      "short_name_ja": "マヒマヒ"
    },
    "weapon": "splattershot",
    "assets": {
      "summary_image": "assets/strategy-maps/tower_control_mahi_mahi_resort_summary.svg",
      "detail_image": "assets/strategy-maps/tower_control_mahi_mahi_resort_detail.svg"
    },
    "summary": {
      "focus": "水場と狭い足場で事故りやすい。ヤグラ周辺を塗り固め、関門前は落水しない位置からウルショで掃除する。",
      "opening": "初動は中央手前とヤグラ周辺を塗る。足場が狭いので、対面前に逃げ道を作る。",
      "comeback": "自陣側の足場を塗り返し、ヤグラ上・関門前・高台をウルショでどかしてから入る。",
      "defense": "関門前で止める。ヤグラ上よりもヤグラ前の護衛と横から詰める敵を先に落とす。",
      "ng": "水際でジャンプ撃ちや長時間対面をしない。人数不利でヤグラに乗って落水事故を増やさない。",
      "checklist": [
        "水場と狭い足場で事故りやすい",
        "ウルショは高台・関門・ゴール前など、メインで届きにくい敵をどかすために使う",
        "人数不利では無理に前へ出ず、塗り返しと味方合流を優先する"
      ]
    },
    "detail": {
      "basic_plan": "水場と狭い足場で事故りやすい。ヤグラ周辺を塗り固め、関門前は落水しない位置からウルショで掃除する。 スシは万能だが射程で押し切る武器ではないため、塗り・ボム・ウルショを組み合わせて有利な距離だけ戦う。",
      "opening": {
        "route": "初動は中央手前とヤグラ周辺を塗る。足場が狭いので、対面前に逃げ道を作る。",
        "first_goal": "中央手前の足場を作り、味方が動ける塗りと敵位置の情報を取る。",
        "avoid": "水際でジャンプ撃ちや長時間対面をしない。人数不利でヤグラに乗って落水事故を増やさない。"
      },
      "key_positions": [
        {
          "id": "main_objective",
          "label": "中央ヤグラ・狭い足場・関門前",
          "purpose": "主戦場。ここを塗り・ボム・対面で維持する。",
          "risk": "落水・狭所乱戦・高台射線"
        },
        {
          "id": "enemy_side",
          "label": "敵陣側の入口・高台・ゴール前",
          "purpose": "抑え・攻めで見る場所。敵の復帰と塗り返し、またはゴール前待機を遅らせる。",
          "risk": "深追いすると復帰敵に挟まれる。"
        },
        {
          "id": "own_side",
          "label": "自陣側の打開起点",
          "purpose": "打開時に塗り返してスペシャルを準備する場所。",
          "risk": "塗り返しだけで止まるとルール関与が遅れる。"
        }
      ],
      "neutral": [
        "中央手前の塗りを維持し、敵の進入ルートをキューバンボムで制限する。",
        "射程負けする相手には正面から付き合わず、段差・壁・ボムで動かしてから撃つ。",
        "味方が前に出たタイミングで一緒にラインを上げる。"
      ],
      "advantage": [
        "人数有利ができたら、オブジェクトだけでなく敵の復帰口を見て時間を稼ぐ。",
        "ウルトラショットは敵高台・関門・進行先・ゴール前など、メインで届かない場所に使う。",
        "深追いより、生存して塗りとルール関与を続けることを優先する。"
      ],
      "disadvantage": [
        "自陣側を塗ってスペシャルを準備し、味方と同時に入る。",
        "人数不利でオブジェクトに単独特攻しない。"
      ],
      "comeback": {
        "steps": [
          "自陣側と中央手前を塗り返し、ウルトラショットを準備する。",
          "オブジェクト周辺・高台・関門前・ゴール前の敵をウルトラショットやキューバンボムでどかす。",
          "味方の復帰・スペシャルに合わせて中央へ入り、落とした敵の位置を塗りで塞ぐ。"
        ]
      },
      "defense": {
        "priorities": [
          "オブジェクトに直接関与する敵より前に、護衛や横入りを確認する。",
          "自陣側の足場を塗り返し、潜伏とスーパージャンプ先を消す。",
          "敵のスペシャルに合わせて下がる場所を用意する。"
        ]
      },
      "special_usage": {
        "trizooka": {
          "attack": "敵高台・関門前・オブジェクト前・ゴール前の護衛をどかす。1発目で下げ、残りでルートを作る。",
          "comeback": "味方が入る直前に撃つ。人数不利で雑に撃ち切らない。",
          "defense": "オブジェクト周辺の密集、敵の前衛、後衛の射線を止めるために使う。"
        }
      },
      "routes": [
        {
          "id": "opening_route",
          "label": "初動ルート",
          "description": "中央手前を塗って、敵位置を見てから主戦場へ入る。"
        },
        {
          "id": "comeback_route",
          "label": "打開ルート",
          "description": "自陣側を塗り返し、スペシャルを準備してから味方と同時に入る。"
        },
        {
          "id": "defense_route",
          "label": "防衛ルート",
          "description": "自陣側の重要地点を塗り返し、横入りと潜伏を消す。"
        }
      ],
      "enemy_threats": [
        "落水・狭所乱戦・高台射線",
        "長射程が高台や橋上に残ると、スシの射程では正面突破しづらい。",
        "ブラスター・ローラー・筆系の潜伏や横入りは、塗り返しとボム確認で拒否する。"
      ],
      "mistakes": [
        "水際でジャンプ撃ちや長時間対面をしない。人数不利でヤグラに乗って落水事故を増やさない。",
        "メインだけで射程負け相手を倒そうとする。",
        "打開時に味方を待たず、一人でオブジェクトへ触りに行く。"
      ],
      "map_annotations": [
        {
          "number": 1,
          "label": "初動・打開の通過点",
          "x": 0.5,
          "y": 0.56
        },
        {
          "number": 2,
          "label": "主戦場・オブジェクト",
          "x": 0.5,
          "y": 0.5
        },
        {
          "number": 3,
          "label": "左側の警戒地点",
          "x": 0.4,
          "y": 0.36
        },
        {
          "number": 4,
          "label": "右側の警戒地点",
          "x": 0.6,
          "y": 0.36
        },
        {
          "number": 5,
          "label": "自陣側の打開起点",
          "x": 0.5,
          "y": 0.69
        }
      ]
    }
  },
  {
    "id": "clam_blitz_hagglefish_market_splattershot",
    "rule": "clam_blitz",
    "rule_name_ja": "ガチアサリ",
    "stage": {
      "id": "hagglefish_market",
      "name_ja": "ヤガラ市場",
      "short_name_ja": "ヤガラ"
    },
    "weapon": "splattershot",
    "assets": {
      "summary_image": "assets/strategy-maps/clam_blitz_hagglefish_market_summary.svg",
      "detail_image": "assets/strategy-maps/clam_blitz_hagglefish_market_detail.svg"
    },
    "summary": {
      "focus": "中央と左右通路で貝を管理し、7個止めで位置バレを避ける。ゴール前は人数有利後に一気に入る。",
      "opening": "初動は中央手前を塗りながら貝回収。左右通路の敵入りを確認し、単独で奥へ行きすぎない。",
      "comeback": "自陣側を塗ってウルショを準備し、ゴール前待機・中央通路・パワー持ち周辺をどかしてから中央を取り返す。",
      "defense": "自ゴール前の塗りを維持し、左右抜けとジャンプ先を消す。ゴール後は通常アサリ持ちを優先処理する。",
      "ng": "パワー持ち単独でゴールへ行かない。ゴールを開けた後に追加投入役がいない状態で突っ込まない。",
      "checklist": [
        "中央と左右通路で貝を管理し、7個止めで位置バレを避ける",
        "ウルショは高台・関門・ゴール前など、メインで届きにくい敵をどかすために使う",
        "人数不利では無理に前へ出ず、塗り返しと味方合流を優先する"
      ]
    },
    "detail": {
      "basic_plan": "中央と左右通路で貝を管理し、7個止めで位置バレを避ける。ゴール前は人数有利後に一気に入る。 スシは万能だが射程で押し切る武器ではないため、塗り・ボム・ウルショを組み合わせて有利な距離だけ戦う。",
      "opening": {
        "route": "初動は中央手前を塗りながら貝回収。左右通路の敵入りを確認し、単独で奥へ行きすぎない。",
        "first_goal": "中央手前の足場を作り、味方が動ける塗りと敵位置の情報を取る。",
        "avoid": "パワー持ち単独でゴールへ行かない。ゴールを開けた後に追加投入役がいない状態で突っ込まない。"
      },
      "key_positions": [
        {
          "id": "main_objective",
          "label": "中央市場・左右通路・ゴール前",
          "purpose": "主戦場。ここを塗り・ボム・対面で維持する。",
          "risk": "左右抜け・潜伏・連続投入"
        },
        {
          "id": "enemy_side",
          "label": "敵陣側の入口・高台・ゴール前",
          "purpose": "抑え・攻めで見る場所。敵の復帰と塗り返し、またはゴール前待機を遅らせる。",
          "risk": "深追いすると復帰敵に挟まれる。"
        },
        {
          "id": "own_side",
          "label": "自陣側の打開起点",
          "purpose": "打開時に塗り返してスペシャルを準備する場所。",
          "risk": "塗り返しだけで止まるとルール関与が遅れる。"
        }
      ],
      "neutral": [
        "中央手前の塗りを維持し、敵の進入ルートをキューバンボムで制限する。",
        "射程負けする相手には正面から付き合わず、段差・壁・ボムで動かしてから撃つ。",
        "味方が前に出たタイミングで一緒にラインを上げる。"
      ],
      "advantage": [
        "人数有利ができたら、オブジェクトだけでなく敵の復帰口を見て時間を稼ぐ。",
        "ウルトラショットは敵高台・関門・進行先・ゴール前など、メインで届かない場所に使う。",
        "深追いより、生存して塗りとルール関与を続けることを優先する。"
      ],
      "disadvantage": [
        "自陣側を塗ってスペシャルを準備し、味方と同時に入る。",
        "人数不利でオブジェクトに単独特攻しない。"
      ],
      "comeback": {
        "steps": [
          "自陣側と中央手前を塗り返し、ウルトラショットを準備する。",
          "オブジェクト周辺・高台・関門前・ゴール前の敵をウルトラショットやキューバンボムでどかす。",
          "味方の復帰・スペシャルに合わせて中央へ入り、落とした敵の位置を塗りで塞ぐ。"
        ]
      },
      "defense": {
        "priorities": [
          "オブジェクトに直接関与する敵より前に、護衛や横入りを確認する。",
          "自陣側の足場を塗り返し、潜伏とスーパージャンプ先を消す。",
          "敵のスペシャルに合わせて下がる場所を用意する。"
        ]
      },
      "special_usage": {
        "trizooka": {
          "attack": "敵高台・関門前・オブジェクト前・ゴール前の護衛をどかす。1発目で下げ、残りでルートを作る。",
          "comeback": "味方が入る直前に撃つ。人数不利で雑に撃ち切らない。",
          "defense": "オブジェクト周辺の密集、敵の前衛、後衛の射線を止めるために使う。"
        }
      },
      "routes": [
        {
          "id": "opening_route",
          "label": "初動ルート",
          "description": "中央手前を塗って、敵位置を見てから主戦場へ入る。"
        },
        {
          "id": "comeback_route",
          "label": "打開ルート",
          "description": "自陣側を塗り返し、スペシャルを準備してから味方と同時に入る。"
        },
        {
          "id": "defense_route",
          "label": "防衛ルート",
          "description": "自陣側の重要地点を塗り返し、横入りと潜伏を消す。"
        }
      ],
      "enemy_threats": [
        "左右抜け・潜伏・連続投入",
        "長射程が高台や橋上に残ると、スシの射程では正面突破しづらい。",
        "ブラスター・ローラー・筆系の潜伏や横入りは、塗り返しとボム確認で拒否する。"
      ],
      "mistakes": [
        "パワー持ち単独でゴールへ行かない。ゴールを開けた後に追加投入役がいない状態で突っ込まない。",
        "メインだけで射程負け相手を倒そうとする。",
        "打開時に味方を待たず、一人でオブジェクトへ触りに行く。"
      ],
      "map_annotations": [
        {
          "number": 1,
          "label": "初動・打開の通過点",
          "x": 0.5,
          "y": 0.56
        },
        {
          "number": 2,
          "label": "主戦場・オブジェクト",
          "x": 0.5,
          "y": 0.5
        },
        {
          "number": 3,
          "label": "左側の警戒地点",
          "x": 0.4,
          "y": 0.36
        },
        {
          "number": 4,
          "label": "右側の警戒地点",
          "x": 0.6,
          "y": 0.36
        },
        {
          "number": 5,
          "label": "自陣側の打開起点",
          "x": 0.5,
          "y": 0.69
        }
      ]
    }
  },
  {
    "id": "clam_blitz_bluefin_depot_splattershot",
    "rule": "clam_blitz",
    "rule_name_ja": "ガチアサリ",
    "stage": {
      "id": "bluefin_depot",
      "name_ja": "ネギトロ炭鉱",
      "short_name_ja": "ネギトロ"
    },
    "weapon": "splattershot",
    "assets": {
      "summary_image": "assets/strategy-maps/clam_blitz_bluefin_depot_summary.svg",
      "detail_image": "assets/strategy-maps/clam_blitz_bluefin_depot_detail.svg"
    },
    "summary": {
      "focus": "上下差と分断を意識し、中央の貝を管理しつつゴール前へ単独で抜けない。人数有利後にパワー化する。",
      "opening": "初動は中央手前で貝回収と塗り。左右の高低差から入る敵を確認し、孤立しそうなら下がる。",
      "comeback": "自陣側の足場を塗り返し、中央高台・ゴール前待機・パワー持ち周辺をウルショでどかす。",
      "defense": "自ゴール前の塗り返しと上下からの侵入確認を優先。ジャンプ先と潜伏を消す。",
      "ng": "上下差を無視してパワー持ちで単独侵入しない。ゴール前潜伏だけに頼らない。",
      "checklist": [
        "上下差と分断を意識し、中央の貝を管理しつつゴール前へ単独で抜けない",
        "ウルショは高台・関門・ゴール前など、メインで届きにくい敵をどかすために使う",
        "人数不利では無理に前へ出ず、塗り返しと味方合流を優先する"
      ]
    },
    "detail": {
      "basic_plan": "上下差と分断を意識し、中央の貝を管理しつつゴール前へ単独で抜けない。人数有利後にパワー化する。 スシは万能だが射程で押し切る武器ではないため、塗り・ボム・ウルショを組み合わせて有利な距離だけ戦う。",
      "opening": {
        "route": "初動は中央手前で貝回収と塗り。左右の高低差から入る敵を確認し、孤立しそうなら下がる。",
        "first_goal": "中央手前の足場を作り、味方が動ける塗りと敵位置の情報を取る。",
        "avoid": "上下差を無視してパワー持ちで単独侵入しない。ゴール前潜伏だけに頼らない。"
      },
      "key_positions": [
        {
          "id": "main_objective",
          "label": "中央高低差・ゴール前・左右侵入路",
          "purpose": "主戦場。ここを塗り・ボム・対面で維持する。",
          "risk": "上下差からの奇襲・ゴール前潜伏"
        },
        {
          "id": "enemy_side",
          "label": "敵陣側の入口・高台・ゴール前",
          "purpose": "抑え・攻めで見る場所。敵の復帰と塗り返し、またはゴール前待機を遅らせる。",
          "risk": "深追いすると復帰敵に挟まれる。"
        },
        {
          "id": "own_side",
          "label": "自陣側の打開起点",
          "purpose": "打開時に塗り返してスペシャルを準備する場所。",
          "risk": "塗り返しだけで止まるとルール関与が遅れる。"
        }
      ],
      "neutral": [
        "中央手前の塗りを維持し、敵の進入ルートをキューバンボムで制限する。",
        "射程負けする相手には正面から付き合わず、段差・壁・ボムで動かしてから撃つ。",
        "味方が前に出たタイミングで一緒にラインを上げる。"
      ],
      "advantage": [
        "人数有利ができたら、オブジェクトだけでなく敵の復帰口を見て時間を稼ぐ。",
        "ウルトラショットは敵高台・関門・進行先・ゴール前など、メインで届かない場所に使う。",
        "深追いより、生存して塗りとルール関与を続けることを優先する。"
      ],
      "disadvantage": [
        "自陣側を塗ってスペシャルを準備し、味方と同時に入る。",
        "人数不利でオブジェクトに単独特攻しない。"
      ],
      "comeback": {
        "steps": [
          "自陣側と中央手前を塗り返し、ウルトラショットを準備する。",
          "オブジェクト周辺・高台・関門前・ゴール前の敵をウルトラショットやキューバンボムでどかす。",
          "味方の復帰・スペシャルに合わせて中央へ入り、落とした敵の位置を塗りで塞ぐ。"
        ]
      },
      "defense": {
        "priorities": [
          "オブジェクトに直接関与する敵より前に、護衛や横入りを確認する。",
          "自陣側の足場を塗り返し、潜伏とスーパージャンプ先を消す。",
          "敵のスペシャルに合わせて下がる場所を用意する。"
        ]
      },
      "special_usage": {
        "trizooka": {
          "attack": "敵高台・関門前・オブジェクト前・ゴール前の護衛をどかす。1発目で下げ、残りでルートを作る。",
          "comeback": "味方が入る直前に撃つ。人数不利で雑に撃ち切らない。",
          "defense": "オブジェクト周辺の密集、敵の前衛、後衛の射線を止めるために使う。"
        }
      },
      "routes": [
        {
          "id": "opening_route",
          "label": "初動ルート",
          "description": "中央手前を塗って、敵位置を見てから主戦場へ入る。"
        },
        {
          "id": "comeback_route",
          "label": "打開ルート",
          "description": "自陣側を塗り返し、スペシャルを準備してから味方と同時に入る。"
        },
        {
          "id": "defense_route",
          "label": "防衛ルート",
          "description": "自陣側の重要地点を塗り返し、横入りと潜伏を消す。"
        }
      ],
      "enemy_threats": [
        "上下差からの奇襲・ゴール前潜伏",
        "長射程が高台や橋上に残ると、スシの射程では正面突破しづらい。",
        "ブラスター・ローラー・筆系の潜伏や横入りは、塗り返しとボム確認で拒否する。"
      ],
      "mistakes": [
        "上下差を無視してパワー持ちで単独侵入しない。ゴール前潜伏だけに頼らない。",
        "メインだけで射程負け相手を倒そうとする。",
        "打開時に味方を待たず、一人でオブジェクトへ触りに行く。"
      ],
      "map_annotations": [
        {
          "number": 1,
          "label": "初動・打開の通過点",
          "x": 0.5,
          "y": 0.56
        },
        {
          "number": 2,
          "label": "主戦場・オブジェクト",
          "x": 0.5,
          "y": 0.5
        },
        {
          "number": 3,
          "label": "左側の警戒地点",
          "x": 0.4,
          "y": 0.36
        },
        {
          "number": 4,
          "label": "右側の警戒地点",
          "x": 0.6,
          "y": 0.36
        },
        {
          "number": 5,
          "label": "自陣側の打開起点",
          "x": 0.5,
          "y": 0.69
        }
      ]
    }
  },
  {
    "id": "clam_blitz_scorch_gorge_splattershot",
    "rule": "clam_blitz",
    "rule_name_ja": "ガチアサリ",
    "stage": {
      "id": "scorch_gorge",
      "name_ja": "ユノハナ大渓谷",
      "short_name_ja": "ユノハナ"
    },
    "weapon": "splattershot",
    "assets": {
      "summary_image": "assets/strategy-maps/clam_blitz_scorch_gorge_summary.svg",
      "detail_image": "assets/strategy-maps/clam_blitz_scorch_gorge_detail.svg"
    },
    "summary": {
      "focus": "中央高台まわりの貝管理が重要。正面突破より、人数有利とウルショでゴール前をどかして入る。",
      "opening": "初動は中央手前を塗り、貝を拾いながら敵高台と左右展開を確認する。即パワー化せず7個止めを意識する。",
      "comeback": "自陣側を塗り、中央高台・ゴール前・パワー持ち周辺へウルショを撃って中央を取り返す。",
      "defense": "自ゴール前の塗り返しと左右抜けの確認を優先。敵の追加投入役を止める。",
      "ng": "中央高台を取られているのにパワー持ちで正面突破しない。ゴール後に全員で投げに寄りすぎない。",
      "checklist": [
        "中央高台まわりの貝管理が重要",
        "ウルショは高台・関門・ゴール前など、メインで届きにくい敵をどかすために使う",
        "人数不利では無理に前へ出ず、塗り返しと味方合流を優先する"
      ]
    },
    "detail": {
      "basic_plan": "中央高台まわりの貝管理が重要。正面突破より、人数有利とウルショでゴール前をどかして入る。 スシは万能だが射程で押し切る武器ではないため、塗り・ボム・ウルショを組み合わせて有利な距離だけ戦う。",
      "opening": {
        "route": "初動は中央手前を塗り、貝を拾いながら敵高台と左右展開を確認する。即パワー化せず7個止めを意識する。",
        "first_goal": "中央手前の足場を作り、味方が動ける塗りと敵位置の情報を取る。",
        "avoid": "中央高台を取られているのにパワー持ちで正面突破しない。ゴール後に全員で投げに寄りすぎない。"
      },
      "key_positions": [
        {
          "id": "main_objective",
          "label": "中央高台・左右ルート・ゴール前",
          "purpose": "主戦場。ここを塗り・ボム・対面で維持する。",
          "risk": "中央高台制圧・左右抜け・連続投入"
        },
        {
          "id": "enemy_side",
          "label": "敵陣側の入口・高台・ゴール前",
          "purpose": "抑え・攻めで見る場所。敵の復帰と塗り返し、またはゴール前待機を遅らせる。",
          "risk": "深追いすると復帰敵に挟まれる。"
        },
        {
          "id": "own_side",
          "label": "自陣側の打開起点",
          "purpose": "打開時に塗り返してスペシャルを準備する場所。",
          "risk": "塗り返しだけで止まるとルール関与が遅れる。"
        }
      ],
      "neutral": [
        "中央手前の塗りを維持し、敵の進入ルートをキューバンボムで制限する。",
        "射程負けする相手には正面から付き合わず、段差・壁・ボムで動かしてから撃つ。",
        "味方が前に出たタイミングで一緒にラインを上げる。"
      ],
      "advantage": [
        "人数有利ができたら、オブジェクトだけでなく敵の復帰口を見て時間を稼ぐ。",
        "ウルトラショットは敵高台・関門・進行先・ゴール前など、メインで届かない場所に使う。",
        "深追いより、生存して塗りとルール関与を続けることを優先する。"
      ],
      "disadvantage": [
        "自陣側を塗ってスペシャルを準備し、味方と同時に入る。",
        "人数不利でオブジェクトに単独特攻しない。"
      ],
      "comeback": {
        "steps": [
          "自陣側と中央手前を塗り返し、ウルトラショットを準備する。",
          "オブジェクト周辺・高台・関門前・ゴール前の敵をウルトラショットやキューバンボムでどかす。",
          "味方の復帰・スペシャルに合わせて中央へ入り、落とした敵の位置を塗りで塞ぐ。"
        ]
      },
      "defense": {
        "priorities": [
          "オブジェクトに直接関与する敵より前に、護衛や横入りを確認する。",
          "自陣側の足場を塗り返し、潜伏とスーパージャンプ先を消す。",
          "敵のスペシャルに合わせて下がる場所を用意する。"
        ]
      },
      "special_usage": {
        "trizooka": {
          "attack": "敵高台・関門前・オブジェクト前・ゴール前の護衛をどかす。1発目で下げ、残りでルートを作る。",
          "comeback": "味方が入る直前に撃つ。人数不利で雑に撃ち切らない。",
          "defense": "オブジェクト周辺の密集、敵の前衛、後衛の射線を止めるために使う。"
        }
      },
      "routes": [
        {
          "id": "opening_route",
          "label": "初動ルート",
          "description": "中央手前を塗って、敵位置を見てから主戦場へ入る。"
        },
        {
          "id": "comeback_route",
          "label": "打開ルート",
          "description": "自陣側を塗り返し、スペシャルを準備してから味方と同時に入る。"
        },
        {
          "id": "defense_route",
          "label": "防衛ルート",
          "description": "自陣側の重要地点を塗り返し、横入りと潜伏を消す。"
        }
      ],
      "enemy_threats": [
        "中央高台制圧・左右抜け・連続投入",
        "長射程が高台や橋上に残ると、スシの射程では正面突破しづらい。",
        "ブラスター・ローラー・筆系の潜伏や横入りは、塗り返しとボム確認で拒否する。"
      ],
      "mistakes": [
        "中央高台を取られているのにパワー持ちで正面突破しない。ゴール後に全員で投げに寄りすぎない。",
        "メインだけで射程負け相手を倒そうとする。",
        "打開時に味方を待たず、一人でオブジェクトへ触りに行く。"
      ],
      "map_annotations": [
        {
          "number": 1,
          "label": "初動・打開の通過点",
          "x": 0.5,
          "y": 0.56
        },
        {
          "number": 2,
          "label": "主戦場・オブジェクト",
          "x": 0.5,
          "y": 0.5
        },
        {
          "number": 3,
          "label": "左側の警戒地点",
          "x": 0.4,
          "y": 0.36
        },
        {
          "number": 4,
          "label": "右側の警戒地点",
          "x": 0.6,
          "y": 0.36
        },
        {
          "number": 5,
          "label": "自陣側の打開起点",
          "x": 0.5,
          "y": 0.69
        }
      ]
    }
  },
  {
    "id": "clam_blitz_wahoo_world_splattershot",
    "rule": "clam_blitz",
    "rule_name_ja": "ガチアサリ",
    "stage": {
      "id": "wahoo_world",
      "name_ja": "スメーシーワールド",
      "short_name_ja": "スメシー"
    },
    "weapon": "splattershot",
    "assets": {
      "summary_image": "assets/strategy-maps/clam_blitz_wahoo_world_summary.svg",
      "detail_image": "assets/strategy-maps/clam_blitz_wahoo_world_detail.svg"
    },
    "summary": {
      "focus": "中央回転ギミック周辺で貝を管理し、ゴール前へは人数有利かウルショ始動で入る。外周からの抜けを常に見る。",
      "opening": "初動は中央手前を塗って貝回収。回転床・外周の敵入りを見て、孤立しそうなら中央に戻る。",
      "comeback": "自陣側を塗ってウルショを準備し、中央・外周・ゴール前待機をどかしてから入る。",
      "defense": "自ゴール前と外周ルートを塗り返し、潜伏・ジャンプ先・追加投入役を消す。",
      "ng": "外周に一人で行きすぎて中央の貝管理を失わない。パワー持ちで回転床上に長く滞在しない。",
      "checklist": [
        "中央回転ギミック周辺で貝を管理し、ゴール前へは人数有利かウルショ始動で入る",
        "ウルショは高台・関門・ゴール前など、メインで届きにくい敵をどかすために使う",
        "人数不利では無理に前へ出ず、塗り返しと味方合流を優先する"
      ]
    },
    "detail": {
      "basic_plan": "中央回転ギミック周辺で貝を管理し、ゴール前へは人数有利かウルショ始動で入る。外周からの抜けを常に見る。 スシは万能だが射程で押し切る武器ではないため、塗り・ボム・ウルショを組み合わせて有利な距離だけ戦う。",
      "opening": {
        "route": "初動は中央手前を塗って貝回収。回転床・外周の敵入りを見て、孤立しそうなら中央に戻る。",
        "first_goal": "中央手前の足場を作り、味方が動ける塗りと敵位置の情報を取る。",
        "avoid": "外周に一人で行きすぎて中央の貝管理を失わない。パワー持ちで回転床上に長く滞在しない。"
      },
      "key_positions": [
        {
          "id": "main_objective",
          "label": "中央回転床・外周ルート・ゴール前",
          "purpose": "主戦場。ここを塗り・ボム・対面で維持する。",
          "risk": "外周抜け・回転床の孤立・ゴール前潜伏"
        },
        {
          "id": "enemy_side",
          "label": "敵陣側の入口・高台・ゴール前",
          "purpose": "抑え・攻めで見る場所。敵の復帰と塗り返し、またはゴール前待機を遅らせる。",
          "risk": "深追いすると復帰敵に挟まれる。"
        },
        {
          "id": "own_side",
          "label": "自陣側の打開起点",
          "purpose": "打開時に塗り返してスペシャルを準備する場所。",
          "risk": "塗り返しだけで止まるとルール関与が遅れる。"
        }
      ],
      "neutral": [
        "中央手前の塗りを維持し、敵の進入ルートをキューバンボムで制限する。",
        "射程負けする相手には正面から付き合わず、段差・壁・ボムで動かしてから撃つ。",
        "味方が前に出たタイミングで一緒にラインを上げる。"
      ],
      "advantage": [
        "人数有利ができたら、オブジェクトだけでなく敵の復帰口を見て時間を稼ぐ。",
        "ウルトラショットは敵高台・関門・進行先・ゴール前など、メインで届かない場所に使う。",
        "深追いより、生存して塗りとルール関与を続けることを優先する。"
      ],
      "disadvantage": [
        "自陣側を塗ってスペシャルを準備し、味方と同時に入る。",
        "人数不利でオブジェクトに単独特攻しない。"
      ],
      "comeback": {
        "steps": [
          "自陣側と中央手前を塗り返し、ウルトラショットを準備する。",
          "オブジェクト周辺・高台・関門前・ゴール前の敵をウルトラショットやキューバンボムでどかす。",
          "味方の復帰・スペシャルに合わせて中央へ入り、落とした敵の位置を塗りで塞ぐ。"
        ]
      },
      "defense": {
        "priorities": [
          "オブジェクトに直接関与する敵より前に、護衛や横入りを確認する。",
          "自陣側の足場を塗り返し、潜伏とスーパージャンプ先を消す。",
          "敵のスペシャルに合わせて下がる場所を用意する。"
        ]
      },
      "special_usage": {
        "trizooka": {
          "attack": "敵高台・関門前・オブジェクト前・ゴール前の護衛をどかす。1発目で下げ、残りでルートを作る。",
          "comeback": "味方が入る直前に撃つ。人数不利で雑に撃ち切らない。",
          "defense": "オブジェクト周辺の密集、敵の前衛、後衛の射線を止めるために使う。"
        }
      },
      "routes": [
        {
          "id": "opening_route",
          "label": "初動ルート",
          "description": "中央手前を塗って、敵位置を見てから主戦場へ入る。"
        },
        {
          "id": "comeback_route",
          "label": "打開ルート",
          "description": "自陣側を塗り返し、スペシャルを準備してから味方と同時に入る。"
        },
        {
          "id": "defense_route",
          "label": "防衛ルート",
          "description": "自陣側の重要地点を塗り返し、横入りと潜伏を消す。"
        }
      ],
      "enemy_threats": [
        "外周抜け・回転床の孤立・ゴール前潜伏",
        "長射程が高台や橋上に残ると、スシの射程では正面突破しづらい。",
        "ブラスター・ローラー・筆系の潜伏や横入りは、塗り返しとボム確認で拒否する。"
      ],
      "mistakes": [
        "外周に一人で行きすぎて中央の貝管理を失わない。パワー持ちで回転床上に長く滞在しない。",
        "メインだけで射程負け相手を倒そうとする。",
        "打開時に味方を待たず、一人でオブジェクトへ触りに行く。"
      ],
      "map_annotations": [
        {
          "number": 1,
          "label": "初動・打開の通過点",
          "x": 0.5,
          "y": 0.56
        },
        {
          "number": 2,
          "label": "主戦場・オブジェクト",
          "x": 0.5,
          "y": 0.5
        },
        {
          "number": 3,
          "label": "左側の警戒地点",
          "x": 0.4,
          "y": 0.36
        },
        {
          "number": 4,
          "label": "右側の警戒地点",
          "x": 0.6,
          "y": 0.36
        },
        {
          "number": 5,
          "label": "自陣側の打開起点",
          "x": 0.5,
          "y": 0.69
        }
      ]
    }
  }
];

export const strategyAssumptions = {
  mapOrientation: "画像は上が敵陣、下が自陣。左右は自陣から敵陣を見た方向。",
  note: "内容はスプラシューター向けの実戦メモ例。ステージ形状は模式化しており、公式マップの転載ではありません。",
  playerRole: "前中衛。塗り・対面・キューバンボムで前線を作り、ウルトラショットで高台・関門・進行先をどかす。",
  summaryUsage: "試合前に10〜20秒で確認する。詳細は復習・研究用。",
};

const ruleIds: Record<string, RuleId> = {
  clam_blitz: "clam",
  rainmaker: "rainmaker",
  splat_zones: "area",
  tower_control: "tower",
};

const ruleNames: Record<RuleId, string> = {
  area: "ガチエリア",
  clam: "ガチアサリ",
  rainmaker: "ガチホコ",
  tower: "ガチヤグラ",
};

export const stageGuides: StageGuide[] = rawStrategyEntries.map((entry) => {
  const rule = ruleIds[entry.rule];
  const summaryImage = imageUrl(entry.assets.summary_image);
  const detailImage = imageUrl(entry.assets.detail_image);
  return {
    assets: { detailImage, summaryImage },
    detail: {
      advantage: entry.detail.advantage,
      basicPlan: entry.detail.basic_plan,
      comeback: entry.detail.comeback,
      defense: entry.detail.defense,
      disadvantage: entry.detail.disadvantage,
      enemyThreats: entry.detail.enemy_threats,
      keyPositions: entry.detail.key_positions,
      mapAnnotations: entry.detail.map_annotations,
      mistakes: entry.detail.mistakes,
      neutral: entry.detail.neutral,
      opening: {
        avoid: entry.detail.opening.avoid,
        firstGoal: entry.detail.opening.first_goal,
        route: entry.detail.opening.route,
      },
      routes: entry.detail.routes,
      specialUsage: entry.detail.special_usage,
    },
    id: entry.id,
    mapOrientation: strategyAssumptions.mapOrientation,
    rule,
    ruleName: entry.rule_name_ja || ruleNames[rule],
    stage: entry.stage.name_ja,
    summary: entry.summary,
    weapon: "スプラシューター",
    weaponKit: {
      special: "ウルトラショット",
      sub: "キューバンボム",
    },
  };
});

export function getStrategyGuide(rule: RuleId, stage: string) {
  return stageGuides.find((guide) => guide.rule === rule && guide.stage === stage) || null;
}

export function getStrategyGuideById(id: string | undefined) {
  return stageGuides.find((guide) => guide.id === id) || null;
}

export function hasStrategyGuide(rule: RuleId, stage: string) {
  return Boolean(getStrategyGuide(rule, stage));
}

export function hasAnyStrategyGuide(stage: string) {
  return stageGuides.some((guide) => guide.stage === stage);
}

function imageUrl(path: string) {
  const image = strategyMapImages[`../../strategy/${path}`];
  if (!image) throw new Error(`Missing strategy map image: ${path}`);
  return image;
}
