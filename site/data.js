// ============================================================
//  惑星「きちゅう」の設定ファイル
//  ここの数字を書きかえると、きちゅうの世界が変わります。
//  ※ すべて授業用に作った架空の数字です（実在する国の統計ではありません）
// ============================================================

const KICHU = {
  planetName: "きちゅう",
  population: "80億",

  // ---------- 国 ----------
  // birthShare   : きちゅうで生まれる赤ちゃんのうち、その国で生まれる割合（%）
  // familyOdds   : [ゆとりのある家, ふつうの家, くらしのきびしい家] に生まれる確率
  // start        : 生まれたときの ステータス（0〜100）
  // schoolRate   : 6さいで小学校に通える確率
  // advanceRate  : 15さいで「進学したい」と選んだとき、進学できる確率
  // clinicRate   : 近くに病院があり、健康診断を受けられる確率
  // checkupCost  : 健康診断にかかる おかね
  // sickRate     : 1年のうちに 重い病気にかかる確率
  // jobLossRate  : 1年のうちに 仕事を失う確率
  // mortality    : 亡くなる確率のもと（sim.js の deathProbability で使う）
  //   infant : 0さいの1年間に亡くなる確率
  //   child  : 1〜4さいの1年間に亡くなる確率
  //   adult  : 事故などで亡くなる確率（毎年）
  //   aging  : 年をとるほど大きくなる確率のもと
  countries: [
    {
      id: "yutaka",
      name: "ユタカ国",
      color: "#3D6FC2",
      tagline: "高いビルと大きな病院がある、ゆたかな国。子どもは少なめ。",
      birthShare: 8,
      familyOdds: [0.3, 0.55, 0.15],
      start: { health: 74, learn: 20, money: 62, happy: 55 },
      schoolRate: 0.99,
      advanceRate: 0.92,
      clinicRate: 0.99,
      checkupCost: 3,
      sickRate: 0.03,
      jobLossRate: 0.02,
      disaster: { text: "記録的な大雪で、町じゅうが止まった", rate: 0.01 },
      mortality: { infant: 0.002, child: 0.0002, adult: 0.0003, aging: 0.000026 },
    },
    {
      id: "midori",
      name: "ミドリ共和国",
      color: "#3A9A5B",
      tagline: "畑と工場がほどよくある、のどかな国。",
      birthShare: 22,
      familyOdds: [0.18, 0.57, 0.25],
      start: { health: 68, learn: 15, money: 50, happy: 55 },
      schoolRate: 0.96,
      advanceRate: 0.75,
      clinicRate: 0.9,
      checkupCost: 8,
      sickRate: 0.045,
      jobLossRate: 0.03,
      disaster: { text: "大きな地震がおきて、家がこわれた", rate: 0.015 },
      mortality: { infant: 0.008, child: 0.001, adult: 0.0008, aging: 0.000038 },
    },
    {
      id: "hateno",
      name: "ハテノ諸島",
      color: "#1E9DB0",
      tagline: "海にうかぶ島々の国。魚はおいしいが、台風が多い。",
      birthShare: 10,
      familyOdds: [0.12, 0.5, 0.38],
      start: { health: 64, learn: 12, money: 42, happy: 60 },
      schoolRate: 0.92,
      advanceRate: 0.6,
      clinicRate: 0.75,
      checkupCost: 12,
      sickRate: 0.05,
      jobLossRate: 0.04,
      disaster: { text: "大きな台風が島をおそった", rate: 0.06 },
      mortality: { infant: 0.016, child: 0.002, adult: 0.0012, aging: 0.000055 },
    },
    {
      id: "sunaoka",
      name: "スナオカ連邦",
      color: "#C7812F",
      tagline: "砂の丘が広がる、若者の多い国。水がとても貴重。",
      birthShare: 28,
      familyOdds: [0.08, 0.4, 0.52],
      start: { health: 58, learn: 8, money: 32, happy: 52 },
      schoolRate: 0.8,
      advanceRate: 0.42,
      clinicRate: 0.55,
      checkupCost: 18,
      sickRate: 0.07,
      jobLossRate: 0.05,
      disaster: { text: "ひどい干ばつで、作物が育たなかった", rate: 0.05 },
      mortality: { infant: 0.024, child: 0.004, adult: 0.0018, aging: 0.00008 },
    },
    {
      id: "morinooku",
      name: "モリノオク王国",
      color: "#8656B0",
      tagline: "深い森にかこまれた国。学校や病院が遠い村も多い。",
      birthShare: 32,
      familyOdds: [0.05, 0.33, 0.62],
      start: { health: 54, learn: 5, money: 26, happy: 55 },
      schoolRate: 0.66,
      advanceRate: 0.3,
      clinicRate: 0.4,
      checkupCost: 22,
      sickRate: 0.08,
      jobLossRate: 0.05,
      disaster: { text: "大雨で川があふれ、家が流された", rate: 0.04 },
      mortality: { infant: 0.035, child: 0.006, adult: 0.0022, aging: 0.00011 },
    },
  ],

  // ---------- 家 ----------
  // bonus      : 生まれたときの ステータスに足される数
  // schoolAdj  : 小学校に通える確率に足される数
  // advanceAdj : 進学できる確率に足される数
  families: [
    {
      id: "yutori",
      name: "ゆとりのある家",
      bonus: { health: 8, learn: 10, money: 25, happy: 5 },
      schoolAdj: 0.15,
      advanceAdj: 0.2,
    },
    {
      id: "futsu",
      name: "ふつうの家",
      bonus: { health: 0, learn: 0, money: 0, happy: 0 },
      schoolAdj: 0,
      advanceAdj: 0,
    },
    {
      id: "kibishii",
      name: "くらしのきびしい家",
      bonus: { health: -6, learn: -3, money: -18, happy: -3 },
      schoolAdj: -0.12,
      advanceAdj: -0.2,
    },
  ],

  // ---------- 名前 ----------
  names: [
    "ソラ", "ハル", "リク", "ナギ", "ミオ", "ユウ", "カイ", "ルカ",
    "アオ", "ヒナ", "トワ", "メイ", "レン", "ノア", "サク", "ユラ",
    "コハク", "イオ", "マヒロ", "セナ", "ツムギ", "ヒカル", "アサ", "ミナト",
  ],

  // ---------- 毎年おこるかもしれない できごと ----------
  // ages : おこる年れいの範囲 [から, まで]
  // rate : 1年のうちに おこる確率（数字、または life と国から計算する関数）
  // when : おこるための条件（なければ いつでも）
  // max  : 一生のうちに おこる最大の回数
  // kind : "good"（うれしい）か "bad"（つらい）
  // effect : ステータスの変化
  events: [
    {
      id: "sick", ages: [1, 120], kind: "bad",
      rate: (life, c) => c.sickRate * (life.age < 5 ? 1.6 : life.age >= 60 ? 1.5 : 1),
      text: (life) => (life.age < 5 ? "高い熱が続く病気にかかった" : "重い病気にかかった"),
      effect: { health: -12, happy: -4 },
    },
    {
      id: "injury", ages: [5, 60], kind: "bad", rate: 0.025,
      text: "大きなけがをして、しばらく動けなかった",
      effect: { health: -6, happy: -2 },
    },
    {
      id: "disaster", ages: [1, 120], kind: "bad",
      rate: (life, c) => c.disaster.rate,
      text: (life, c) => c.disaster.text,
      effect: { money: -14, health: -5, happy: -6 },
    },
    {
      id: "friend", ages: [4, 20], kind: "good", rate: 0.1, max: 2,
      text: "なんでも話せる親友ができた",
      effect: { happy: 8 },
    },
    {
      id: "book", ages: [7, 25], kind: "good", max: 1,
      rate: (life) => (life.school ? 0.08 : 0.04),
      text: "本を読むのが大好きになった",
      effect: { learn: 10, happy: 3 },
    },
    {
      id: "club", ages: [10, 18], kind: "good", max: 1, rate: 0.07,
      when: (life) => life.school,
      text: "仲間と大会に出て、入賞した",
      effect: { happy: 8, health: 3 },
    },
    {
      id: "childWork", ages: [7, 14], kind: "bad", max: 2, rate: 0.15,
      when: (life) => life.family === "kibishii" || !life.school,
      text: "家計を助けるため、朝から晩まで働いた",
      effect: { money: 4, learn: -3, health: -2 },
    },
    {
      id: "net", ages: [10, 60], kind: "good", max: 1, rate: 0.03,
      text: "住んでいる町に「きちゅうネット」がつながった",
      effect: { learn: 6, happy: 3 },
    },
    {
      id: "promotion", ages: [20, 64], kind: "good",
      rate: (life) => 0.03 + life.learn / 1000,
      text: "仕事が認められ、給料が上がった",
      effect: { money: 14, happy: 4 },
    },
    {
      id: "jobLoss", ages: [20, 64], kind: "bad",
      rate: (life, c) => c.jobLossRate,
      text: "働いていた会社がなくなってしまった",
      effect: { money: -14, happy: -8 },
    },
    {
      id: "travel", ages: [18, 80], kind: "good",
      rate: (life) => 0.01 + life.money / 800,
      text: "きちゅうの反対側まで旅をした",
      effect: { happy: 10, money: -4 },
    },
    {
      id: "lottery", ages: [18, 120], kind: "good", max: 1, rate: 0.006,
      text: "くじで大当たりした！",
      effect: { money: 20, happy: 6 },
    },
    {
      id: "baby", ages: [26, 42], kind: "good", max: 3, rate: 0.18,
      when: (life) => life.partner,
      text: "子どもが生まれた",
      effect: { happy: 10, money: -5 },
    },
    {
      id: "grandchild", ages: [52, 90], kind: "good", max: 1, rate: 0.1,
      when: (life) => life.kids > 0,
      text: "孫が生まれた",
      effect: { happy: 10 },
    },
    {
      id: "hobby", ages: [55, 120], kind: "good", max: 1, rate: 0.04,
      text: "畑づくりという楽しい趣味を見つけた",
      effect: { happy: 6, health: 3 },
    },
    {
      id: "back", ages: [50, 120], kind: "bad", rate: 0.05,
      text: "腰をいためてしまった",
      effect: { health: -6, happy: -2 },
    },
  ],
};
