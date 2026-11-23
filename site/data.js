// ============================================================
//  惑星「きちゅう」の設定ファイル（国・家・種族の数字）
//  ここの数字を書きかえると、きちゅうの世界が変わります。
//  ※ すべて授業用に作った架空の数字です（実在する国の統計ではありません）
// ============================================================

const KICHU = {
  planetName: "きちゅう",
  population: "1億",

  // ---------- 国 ----------
  // birthShare   : きちゅうで生まれる赤ちゃんモンスターのうち、その国で生まれる割合（%）
  // familyOdds   : [ゆとりのある家, ふつうの家, くらしのきびしい家] に生まれる確率
  // start        : 生まれたときの ステータス（0〜100）
  // schoolRate   : 6さいで学校に通える確率
  // advanceRate  : 15さいで「進学する」を選んだとき、進学できる確率
  // netRate      : 「きちゅうネット」が使える確率
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
      color: "#4C7DF0",
      tagline: "光る塔が立ちならぶ、ゆたかな国。病院も学校もすぐ近く。",
      birthShare: 8,
      familyOdds: [0.3, 0.55, 0.15],
      start: { health: 74, learn: 20, money: 62, happy: 55 },
      schoolRate: 0.99,
      advanceRate: 0.92,
      netRate: 0.98,
      clinicRate: 0.99,
      checkupCost: 3,
      sickRate: 0.03,
      jobLossRate: 0.02,
      disaster: { rate: 0.01, text: ["記録的な大雪で、町じゅうが止まった", "大停電で、町が3日間まっくらになった", "モノレールが故障して、町が大混乱した"] },
      mortality: { infant: 0.002, child: 0.0002, adult: 0.0003, aging: 0.000026 },
    },
    {
      id: "midori",
      name: "ミドリ共和国",
      color: "#3FAE5A",
      tagline: "風車と畑がひろがる、のどかな国。",
      birthShare: 22,
      familyOdds: [0.18, 0.57, 0.25],
      start: { health: 68, learn: 15, money: 50, happy: 55 },
      schoolRate: 0.96,
      advanceRate: 0.75,
      netRate: 0.85,
      clinicRate: 0.9,
      checkupCost: 8,
      sickRate: 0.045,
      jobLossRate: 0.03,
      disaster: { rate: 0.015, text: ["大きな地震がおきて、家がこわれた", "ひょうが降って、畑の野菜がぜんぶだめになった", "竜巻が村を通りすぎていった"] },
      mortality: { infant: 0.008, child: 0.001, adult: 0.0008, aging: 0.000038 },
    },
    {
      id: "hateno",
      name: "ハテノ諸島",
      color: "#19A7C4",
      tagline: "海にうかぶ島々の国。魚はおいしいが、台風が多い。",
      birthShare: 10,
      familyOdds: [0.12, 0.5, 0.38],
      start: { health: 64, learn: 12, money: 42, happy: 60 },
      schoolRate: 0.92,
      advanceRate: 0.6,
      netRate: 0.7,
      clinicRate: 0.75,
      checkupCost: 12,
      sickRate: 0.05,
      jobLossRate: 0.04,
      disaster: { rate: 0.06, text: ["大きな台風が島をおそった", "高波で、家族の船が流された", "台風で、家の屋根が飛んでいった", "島じゅうが水びたしになる大雨がふった"] },
      mortality: { infant: 0.016, child: 0.002, adult: 0.0012, aging: 0.000055 },
    },
    {
      id: "sunaoka",
      name: "スナオカ連邦",
      color: "#E08A2E",
      tagline: "砂の丘がつづく、若いモンスターの多い国。水がとても貴重。",
      birthShare: 28,
      familyOdds: [0.08, 0.4, 0.52],
      start: { health: 58, learn: 8, money: 32, happy: 52 },
      schoolRate: 0.8,
      advanceRate: 0.42,
      netRate: 0.5,
      clinicRate: 0.55,
      checkupCost: 18,
      sickRate: 0.07,
      jobLossRate: 0.05,
      disaster: { rate: 0.05, text: ["ひどい干ばつで、作物が育たなかった", "大きな砂嵐で、家が砂にうもれた", "井戸がかれて、水を遠くまでくみに行った", "イナゴの大群が畑をおそった"] },
      mortality: { infant: 0.024, child: 0.004, adult: 0.0018, aging: 0.00008 },
    },
    {
      id: "morinooku",
      name: "モリノオク王国",
      color: "#9A5CD0",
      tagline: "深い森にかこまれた王国。学校や病院が遠い村も多い。",
      birthShare: 32,
      familyOdds: [0.05, 0.33, 0.62],
      start: { health: 54, learn: 5, money: 26, happy: 55 },
      schoolRate: 0.66,
      advanceRate: 0.3,
      netRate: 0.32,
      clinicRate: 0.4,
      checkupCost: 22,
      sickRate: 0.08,
      jobLossRate: 0.05,
      disaster: { rate: 0.04, text: ["大雨で川があふれ、家が流された", "山くずれで、村への道がふさがれた", "森の大火事で、村が煙につつまれた", "長雨で、畑の作物がくさってしまった"] },
      mortality: { infant: 0.035, child: 0.006, adult: 0.0022, aging: 0.00011 },
    },
  ],

  // ---------- 家 ----------
  // bonus      : 生まれたときの ステータスに足される数
  // schoolAdj  : 学校に通える確率・ネットが使える確率に足される数
  // advanceAdj : 進学できる確率に足される数
  families: [
    {
      id: "yutori",
      name: "ゆとりのある家",
      short: "ゆとり",
      bonus: { health: 8, learn: 10, money: 25, happy: 5 },
      schoolAdj: 0.15,
      advanceAdj: 0.2,
    },
    {
      id: "futsu",
      name: "ふつうの家",
      short: "ふつう",
      bonus: { health: 0, learn: 0, money: 0, happy: 0 },
      schoolAdj: 0,
      advanceAdj: 0,
    },
    {
      id: "kibishii",
      name: "くらしのきびしい家",
      short: "きびしい",
      bonus: { health: -6, learn: -3, money: -18, happy: -3 },
      schoolAdj: -0.12,
      advanceAdj: -0.2,
    },
  ],

  // ---------- 種族（見た目がかわるだけで、有利・不利はありません） ----------
  species: [
    { id: "purun", name: "ぷるん族", note: "ゼリーのような体。気持ちがすぐ顔に出る" },
    { id: "moko", name: "もこもこ族", note: "ふわふわの毛。雨の日は2倍にふくらむ" },
    { id: "tsuno", name: "ツノッコ族", note: "小さな2本のツノ。ツノで天気がわかるらしい" },
    { id: "gyoro", name: "ギョロ族", note: "大きなひとつ目。遠くの文字まで読める" },
    { id: "pata", name: "パタパタ族", note: "小さな羽がある。でも飛べるのは少しだけ" },
  ],

  // ---------- 名前 ----------
  names: [
    "ポポ", "モルン", "ピコ", "グルル", "ミャモ", "ズズ", "ペロン", "ノノ",
    "ガブ", "チュチュ", "ムニ", "ボンボ", "リリ", "トト", "ニョロ", "パフ",
    "ゴロン", "キキ", "モチ", "プー", "ルル", "ドド", "ピピン", "ヌー",
  ],
};
