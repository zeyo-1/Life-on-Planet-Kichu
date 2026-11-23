// ============================================================
//  モンスターの一生のシナリオ
//  選択・仕事・できごと・称号（エンディング）をここに書いています。
//  新しいできごとや選択肢を足すと、ゲームにそのまま出てきます。
//
//  分かれ道の選択肢は、たくさん用意した中から乱数で4つ選んで表示します。
//  always: true がついた選択肢は、かならず表示されます。
//
//  選択の apply(L, c, opt, t) で使える道具：
//    t.roll("〇〇できる", 確率)  … 乱数で判定して、あたりなら true
//    t.great(文, 変化)  … 大成功（紙ふぶきが出る）
//    t.good(文, 変化)   … うれしいこと
//    t.bad(文, 変化)    … つらいこと
//    t.info(文, 変化)   … ふつうのこと
//    変化の例：{ happy: 8, money: -5 }  （health / learn / money / happy）
// ============================================================

const STORY = {
  // ---------- 7さいで決まる「性格」 ----------
  traits: {
    run: "かけっこ大好き",
    book: "物知り",
    make: "ものづくり好き",
    sky: "夢見がち",
    funny: "お笑い好き",
    kind: "やさしい",
  },

  // ---------- 13さいで決まる「特技」 ----------
  skills: {
    cook: "料理",
    music: "歌とダンス",
    code: "プログラミング",
    animal: "動物と話せる",
    art: "絵",
    magic: "手品",
  },

  // ---------- 仕事 ----------
  // money / happy : 毎年すこしずつ増える量
  // hat           : キャラクターの帽子や小物
  jobs: {
    home: { name: "ふるさとの働き者", money: 0.25, happy: 0.15, hat: "bandana" },
    newcomer: { name: "ユタカ国の新しい住人", money: 0.5, happy: 0, hat: "none" },
    city: { name: "都会の会社員", money: 0.5, happy: 0, hat: "tie" },
    farmer: { name: "農家", money: 0.3, happy: 0.2, hat: "straw" },
    office: { name: "町役場の職員", money: 0.4, happy: 0.1, hat: "tie" },
    postman: { name: "宇宙郵便屋さん", money: 0.4, happy: 0.15, hat: "cap" },
    chef: { name: "屋台の料理人", money: 0.3, happy: 0.2, hat: "chef" },
    streamer: { name: "きちゅうチューバー", money: 0.1, happy: 0.25, hat: "headphones" },
    programmer: { name: "プログラマー", money: 0.6, happy: 0.05, hat: "glasses" },
    vet: { name: "どうぶつのお医者さん", money: 0.5, happy: 0.2, hat: "nurse" },
    illustrator: { name: "イラストレーター", money: 0.25, happy: 0.25, hat: "beret" },
    magician: { name: "マジシャン", money: 0.2, happy: 0.25, hat: "tophat" },
    researcher: { name: "研究者", money: 0.5, happy: 0.15, hat: "goggles" },
    athlete: { name: "きちゅうボール選手", money: 0.15, happy: 0.25, hat: "headband" },
    explorer: { name: "冒険家", money: -0.05, happy: 0.35, hat: "explorer" },
    inventor: { name: "発明家", money: 0.15, happy: 0.25, hat: "propeller" },
    comedian: { name: "お笑い芸人", money: 0.1, happy: 0.3, hat: "nose" },
    nursery: { name: "保育士", money: 0.35, happy: 0.3, hat: "flower" },
  },

  // ---------- 決まった年れいでおこること ----------
  milestones: [
    {
      age: 6,
      apply(L, c, t) {
        const f = KichuSim.familyOf(L.family);
        const p = Math.min(0.995, Math.max(0.02, c.schoolRate + f.schoolAdj));
        if (t.roll("学校に通える", p)) {
          L.school = true;
          t.good("モンスター小学校に入学した！", { learn: 10, happy: 4 });
        } else {
          t.bad("学校が遠く、家の手伝いもあって、学校に通えなかった", {}, "自分では選べないできごと");
        }
      },
    },
    {
      age: 65,
      apply(L, c, t) {
        if (L.money < 30) t.info("生活のため、65さいをすぎても働き続けた");
        else t.info("長く続けた仕事を引退した。おつかれさま！", { happy: 4 });
      },
    },
    {
      age: 100,
      apply(L, c, t) {
        t.great("100さいの誕生日！ ケーキのろうそくが多すぎて、火事になりかけた", { happy: 10 });
      },
    },
  ],

  // ---------- 選択（10回。それぞれ たくさんの中から4つ表示） ----------
  choices: [
    {
      id: "play",
      age: 7,
      prompt: () => "7さい。いちばん好きな遊びは？",
      options: (L) => [
        { id: "run1", trait: "run", label: "外を走りまわる", sub: "足の速さで勝負", say: "かけっこで町いちばんになった", eff: { health: 6, happy: 3 } },
        { id: "run2", trait: "run", label: "木登りで町いちばんをめざす", sub: "いちばん高い木へ", say: "町でいちばん高い木のてっぺんまで登った", eff: { health: 5, happy: 4 } },
        { id: "book1", trait: "book", label: "図鑑を読みまくる", sub: "知りたいことだらけ", say: L.school ? "図鑑を丸ごと暗記して、大人たちをおどろかせた" : "拾った図鑑を、ボロボロになるまで読んだ", eff: { learn: 7 } },
        { id: "book2", trait: "book", label: "なぞなぞを100個考える", sub: "家族はもう答えたくない", say: "なぞなぞ大会で、大人に勝った", eff: { learn: 5, happy: 2 } },
        { id: "make1", trait: "make", label: "ガラクタで何かを作る", sub: "家のものが少しずつ消える", say: "ガラクタでロボットを作った。夜中に勝手に動いた", eff: { learn: 3, happy: 4 } },
        { id: "make2", trait: "make", label: "砂で巨大なお城を作る", sub: "完成まで1か月", say: "砂のお城が、町の新聞にのった", eff: { learn: 2, happy: 5 } },
        { id: "sky1", trait: "sky", label: "ぼーっと空をながめる", sub: "雲の形を研究中", say: "雲の形を100種類言えるようになった", eff: { happy: 6 } },
        { id: "sky2", trait: "sky", label: "夜ふかしして星を数える", sub: "目標は1万個", say: "星を3000個まで数えて、ねむってしまった", eff: { happy: 5, learn: 1 } },
        { id: "funny1", trait: "funny", label: "ものまねでみんなを笑わせる", sub: "先生のまねが得意", say: "先生のものまねがウケすぎて、先生まで笑った", eff: { happy: 7 } },
        { id: "funny2", trait: "funny", label: "変顔コンテストを開く", sub: "優勝は自分", say: "変顔コンテストで、審査員が笑いすぎてたおれた", eff: { happy: 7 } },
        { id: "kind1", trait: "kind", label: "小さい子の面倒をみる", sub: "近所の人気者", say: "近所の小さい子たちに、すっかりなつかれた", eff: { happy: 6 } },
        { id: "kind2", trait: "kind", label: "けがした鳥を看病する", sub: "毎日えさをあげた", say: "看病した鳥が元気になって、空へ飛んでいった", eff: { happy: 6, learn: 1 } },
      ],
      apply(L, c, opt, t) {
        L.trait = opt.trait;
        t.good(opt.say, opt.eff);
      },
    },
    {
      id: "skill",
      age: 13,
      prompt: () => "13さい。ひみつの特訓、何をする？",
      options: (L, c) => [
        { id: "cook1", skill: "cook", label: "料理", sub: "めざせ、きちゅう一の味", say: "目玉焼きを片手で割れるようになった", eff: { happy: 4 } },
        { id: "cook2", skill: "cook", label: "お菓子づくり", sub: "プリンをきわめたい", say: "作ったプリンが、近所で評判になった", eff: { happy: 5 } },
        { id: "music1", skill: "music", label: "歌とダンス", sub: "鏡の前で毎晩", say: "毎晩おどっていたら、家族まで一緒におどりだした", eff: { happy: 6 } },
        { id: "music2", skill: "music", label: "ギターの練習", sub: "指が痛い", say: "ギターで3曲ひけるようになった", eff: { happy: 5 } },
        { id: "code1", skill: "code", label: "プログラミング", sub: "きちゅうネットで勉強", p: netChance(L, c), pLabel: "ネットが使える確率", say: "はじめて作ったゲームが、友だちに大ウケした", fail: "村にネットがなく、木の枝で地面にプログラムを書いた", eff: { learn: 7, happy: 3 } },
        { id: "code2", skill: "code", label: "ロボット作り", sub: "目標は自動宿題マシン", p: netChance(L, c), pLabel: "部品が手に入る確率", say: "宿題を自動でやるロボットを作った（先生にバレた）", fail: "部品が手に入らず、ロボットは設計図だけになった", eff: { learn: 6, happy: 3 } },
        { id: "animal1", skill: "animal", label: "動物と話す練習", sub: "まずは近所の鳥から", say: "近所の鳥と、たぶん会話できるようになった", eff: { happy: 5 } },
        { id: "animal2", skill: "animal", label: "虫の観察", sub: "毎日ノートに記録", say: "虫の観察ノートが10冊になった", eff: { learn: 4, happy: 3 } },
        { id: "art1", skill: "art", label: "絵をかきまくる", sub: "ノートのはしにも", say: "描いたマンガが、クラスで回し読みされた", eff: { happy: 5 } },
        { id: "art2", skill: "art", label: "粘土で作品づくり", sub: "部屋が作品だらけ", say: "粘土のモンスター像が、学校にかざられた", eff: { happy: 5 } },
        { id: "magic1", skill: "magic", label: "手品の練習", sub: "タネはひみつ", say: "トランプ手品で、家族を全員おどろかせた", eff: { happy: 5 } },
        { id: "magic2", skill: "magic", label: "ものを消す技の研究", sub: "まずは消しゴムから", say: "消しゴムを消す手品に成功した（本当になくした）", eff: { happy: 3 } },
      ],
      apply(L, c, opt, t) {
        L.skill = opt.skill;
        if (opt.p == null) t.good(opt.say, opt.eff);
        else if (t.roll(opt.pLabel.replace("確率", ""), opt.p)) t.good(opt.say, opt.eff);
        else t.bad(opt.fail, { learn: 3 }, "自分では選べないできごと");
      },
    },
    {
      id: "path",
      age: 15,
      prompt: () => "15さい。これからどうする？",
      options: (L, c) => [
        { id: "study", always: true, label: "進学する", sub: "もっと勉強したい", p: advanceChance(L, c), pLabel: "進学できる確率" },
        { id: "work", label: "働きはじめる", sub: "家族を助けたい" },
        { id: "wander", label: "ひとり旅に出る", sub: "自分さがしの旅", p: 0.4, pLabel: "すごいものに出会う確率" },
        { id: "apprentice", label: "職人に弟子入りする", sub: "技をみがきたい" },
        { id: "selfStudy", label: "働きながら独学する", sub: "図書館に毎日通う" },
        { id: "abroad", label: "留学に挑戦する", sub: "遠い国で学びたい", p: clamp(0.04 + L.money / 200 + L.learn / 300, 0.03, 0.7), pLabel: "留学できる確率" },
        { id: "gap", label: "1年のんびり考える", sub: "あせらない" },
      ],
      apply(L, c, opt, t) {
        const id = opt.id;
        if (id === "study") {
          if (t.roll("進学できる", opt.p)) {
            L.advanced = true;
            t.good("進学できた！ 勉強の毎日がはじまった", { learn: 15, happy: 5, money: -4 });
          } else t.bad("進学したかったが、学費が足りず働くことになった", { money: 6, happy: -8 });
        }
        if (id === "work") t.info("家族を助けるため、働きはじめた", { money: 12 });
        if (id === "wander") {
          L.flags.wander = true;
          if (t.roll("すごいものに出会う", opt.p)) t.great("きちゅうの北のはてで、虹色のオーロラを見た！", { happy: 12, learn: 4, money: -4 });
          else t.good("道に迷って3日間さまよった。いい思い出になった", { happy: 6, learn: 3, money: -4 });
        }
        if (id === "apprentice") t.good("きびしい親方のもとで、修行をはじめた", { learn: 5, money: 3 });
        if (id === "selfStudy") t.good("昼は働き、夜は図書館で勉強した", { learn: 6, money: 5, health: -2 });
        if (id === "abroad") {
          if (t.roll("留学できる", opt.p)) {
            L.advanced = true;
            L.flags.abroad = true;
            t.great("ユタカ国の学校に留学できた！", { learn: 15, happy: 6 });
          } else t.bad("留学のおかねが足りず、あきらめた", { happy: -6 });
        }
        if (id === "gap") t.info("1年かけて、やりたいことをじっくり考えた", { happy: 4 });
      },
    },
    {
      id: "love",
      age: 18,
      prompt: () => "18さい。気になるあの子がいる…どうする？",
      options: (L) => {
        const special = {
          music: { id: "song", label: "歌で気持ちを伝える", sub: "ひと晩で1曲つくった", p: 0.5, win: "歌が届いた！ なぜか周りから拍手まで起きた", lose: "歌は届かなかったが、通りすがりのモンスターたちが泣いていた" },
          cook: { id: "bento", label: "手作り弁当をわたす", sub: "胃袋をつかむ作戦", p: 0.55, win: "お弁当は完食。「毎日食べたい」と言われた！", lose: "お弁当は好評だったが、気持ちは伝わっていなかった" },
          art: { id: "portrait", label: "似顔絵をプレゼントする", sub: "3日かけて描いた", p: 0.5, win: "似顔絵を見て、あの子が泣いて喜んだ！", lose: "似顔絵は「似てない」と言われた…" },
          magic: { id: "flower", label: "手品で花を出して告白", sub: "練習は100回", p: 0.45, win: "花が出た瞬間、「はい」と言ってもらえた！", lose: "花のかわりに、ハトが出てきて逃げていった" },
          code: { id: "app", label: "告白アプリを作る", sub: "徹夜で完成", p: 0.35, win: "アプリはバグったが、気持ちは伝わった！", lose: "アプリがバグって、まちがえて先生に送信された…" },
          animal: { id: "bird", label: "鳥に手紙を運んでもらう", sub: "なかよしの鳥にたのむ", p: 0.5, win: "鳥が手紙を届けてくれた。返事は「うん」！", lose: "鳥が手紙を食べてしまった" },
        }[L.skill];
        const list = [
          { id: "confess", label: "正面から告白する", sub: "当たってくだけろ", p: clamp(0.3 + (L.happy - 50) / 200, 0.1, 0.75), win: "まさかのOK！ 2匹で夕日を見た", lose: "「友だちでいよう」と言われた。その夜は枕をぬらした" },
          { id: "letter", label: "手紙を書く", sub: "3日かけて書いた", p: clamp(0.25 + L.learn / 300, 0.1, 0.7), win: "手紙の返事は「わたしも」だった！", lose: "手紙は書いたが、渡せないまま引き出しの奥へ…", winKind: "good" },
          { id: "date", label: "デートにさそう", sub: "行き先は遊園地", p: 0.45, win: "観覧車のてっぺんで「好き」と言えた！", lose: "デートの日、まさかの大雨で中止になった" },
          { id: "friend", label: "友だちに相談する", sub: "作戦会議", p: 0.4, win: "友だちのおかげで、気持ちが伝わった！", lose: "友だちのほうが、先に告白していた…", winKind: "good" },
          { id: "message", label: "メッセージを送る", sub: "送信ボタンが押せない", p: 0.35, win: "既読がついて、返事は「うん」！", lose: "既読がついたまま、返事が来なかった", winKind: "good" },
          { id: "fortune", label: "占いを信じて行動する", sub: "今日のラッキーカラーは緑", p: 0.3, win: "占いのとおりにしたら、うまくいった！", lose: "占いによると、今日は運勢最悪の日だった", winKind: "good" },
          { id: "watch", label: "そっと見守る", sub: "今はまだ…" },
          { id: "polish", label: "まずは自分をみがく", sub: "いつか言う" },
        ];
        if (special) list.unshift({ ...special, always: true });
        return list.map((o) => (o.p != null ? { ...o, pLabel: "気持ちが伝わる確率" } : o));
      },
      apply(L, c, opt, t) {
        if (opt.id === "watch") {
          L.love = "friend";
          t.info("見守っているうちに、いちばんの友だちになった", { happy: 3 });
          return;
        }
        if (opt.id === "polish") {
          L.love = "friend";
          t.good("自分をみがく毎日がはじまった", { learn: 3, happy: 2 });
          return;
        }
        if (t.roll("気持ちが伝わる", opt.p)) {
          L.love = "yes";
          t[opt.winKind || "great"](opt.win, { happy: 12 });
        } else {
          L.love = "no";
          t.bad(opt.lose, { happy: -6 });
        }
      },
    },
    {
      id: "job",
      age: 22,
      prompt: () => "22さい。どんな仕事をする？",
      options: (L, c) => {
        const bySkill = {
          cook: { id: "chef", label: "屋台を開く", sub: "看板メニューで勝負", p: 0.5, pLabel: "お客さんが来る確率" },
          music: { id: "streamer", label: "きちゅうチューバーになる", sub: "めざせ登録者100万", p: 0.2, pLabel: "いきなり人気が出る確率" },
          code: { id: "programmer", label: "プログラマーになる", sub: "大きな会社をめざす", p: clamp(0.3 + L.learn / 200, 0.1, 0.9), pLabel: "大きな会社に入れる確率" },
          animal: { id: "vet", label: "どうぶつのお医者さんをめざす", sub: "試験はむずかしい", p: clamp(0.2 + L.learn / 150, 0.1, 0.9), pLabel: "試験に受かる確率" },
          art: { id: "illustrator", label: "イラストレーターになる", sub: "絵で食べていきたい", p: 0.35, pLabel: "絵の仕事が来る確率" },
          magic: { id: "magician", label: "マジシャンになる", sub: "あこがれのステージへ", p: 0.3, pLabel: "デビュー公演が満員になる確率" },
        };
        const byTrait = {
          run: { id: "athlete", label: "きちゅうボール選手をめざす", sub: "プロの世界はきびしい", p: clamp(0.15 + L.health / 300, 0.1, 0.6), pLabel: "プロになれる確率" },
          book: { id: "researcher", label: "研究者になる", sub: "なぞを解き明かしたい", p: clamp(L.learn / 110, 0.05, 0.9), pLabel: "研究所に入れる確率" },
          make: { id: "inventor", label: "発明家になる", sub: "まだだれも見たことのないものを" },
          sky: { id: "explorer", label: "冒険家になる", sub: "地図はいらない" },
          funny: { id: "comedian", label: "お笑い芸人になる", sub: "きちゅうを笑わせたい", p: 0.25, pLabel: "初舞台でウケる確率" },
          kind: { id: "nursery", label: "保育士をめざす", sub: "子どもが大好き", p: clamp(0.35 + L.learn / 200, 0.1, 0.9), pLabel: "試験に受かる確率" },
        };
        const list = [];
        if (bySkill[L.skill]) list.push({ ...bySkill[L.skill], always: true });
        if (byTrait[L.trait]) list.push({ ...byTrait[L.trait], always: true });
        list.push(
          { id: "home", label: "ふるさとで働く", sub: "家族の近くがいちばん" },
          { id: "city", label: "都会の会社で働く", sub: "ビルの30階", p: clamp(0.25 + L.learn / 150, 0.1, 0.9), pLabel: "会社に入れる確率" },
          { id: "farmer", label: "農家になる", sub: "とれたて野菜を届けたい" },
          { id: "office", label: "町役場で働く", sub: "町の役に立ちたい", p: clamp(0.2 + L.learn / 120, 0.1, 0.9), pLabel: "試験に受かる確率" },
          { id: "postman", label: "宇宙郵便屋さんになる", sub: "2つの月まで配達" }
        );
        if (L.country !== "yutaka") list.push({ id: "move", label: "ユタカ国への移住に挑戦", sub: "新しい国で暮らしたい", p: moveChance(L), pLabel: "移住できる確率" });
        return list;
      },
      apply(L, c, opt, t) {
        const id = opt.id;
        // 判定に失敗したら、ふるさとで働く
        const fallback = (text) => {
          L.job = "home";
          t.bad(text, { happy: -5 });
        };
        if (id === "home") {
          L.job = "home";
          t.info("ふるさとで働きはじめた", { money: 6, happy: 6 });
        } else if (id === "city") {
          if (t.roll("会社に入れる", opt.p)) {
            L.job = "city";
            t.good("都会の会社に入った。満員モノレールにおどろいた", { money: 10 });
          } else fallback("都会の会社には入れず、ふるさとで働くことに");
        } else if (id === "farmer") {
          L.job = "farmer";
          t.good("畑を借りて、農家になった", { happy: 6, money: 3 });
        } else if (id === "office") {
          if (t.roll("試験に受かる", opt.p)) {
            L.job = "office";
            t.good("町役場の試験に合格した", { money: 8, happy: 4 });
          } else fallback("役場の試験に落ちた…ふるさとで働きながら再挑戦することに");
        } else if (id === "postman") {
          L.job = "postman";
          t.good("宇宙郵便屋さんになった。毎日が月への出張", { money: 5, happy: 6 });
        } else if (id === "chef") {
          L.job = "chef";
          if (t.roll("お客さんが来る", opt.p)) {
            L.flags.hit = true;
            t.good("屋台にいきなり行列ができた！", { money: 10, happy: 6 });
          } else t.bad("屋台を開いたが、最初のお客さんは鳥だけだった", { money: -5 });
        } else if (id === "streamer") {
          L.job = "streamer";
          if (t.roll("いきなり人気が出る", opt.p)) {
            L.flags.hit = true;
            t.great("最初の動画がいきなりバズった！ 登録者10万", { money: 12, happy: 10 });
          } else t.info("配信をはじめた。登録者は3（ほぼ家族）", { money: -3 });
        } else if (id === "programmer") {
          L.job = "programmer";
          if (t.roll("大きな会社に入れる", opt.p)) t.good("大きな会社にプログラマーとして入った", { money: 15 });
          else t.info("小さな会社でプログラマーになった", { money: 6 });
        } else if (id === "vet") {
          if (t.roll("試験に受かる", opt.p)) {
            L.job = "vet";
            t.good("試験に合格！ どうぶつ病院で働きはじめた", { money: 8, happy: 6 });
          } else fallback("試験に落ちた…まずはふるさとの牧場で働くことに");
        } else if (id === "illustrator") {
          L.job = "illustrator";
          if (t.roll("絵の仕事が来る", opt.p)) {
            L.flags.hit = true;
            t.good("はじめての絵の仕事が来た！ 絵本の表紙だった", { money: 8, happy: 8 });
          } else t.info("絵の仕事はまだ来ない。アルバイトしながら描き続けた", { money: 2 });
        } else if (id === "magician") {
          L.job = "magician";
          if (t.roll("デビュー公演が満員になる", opt.p)) {
            L.flags.hit = true;
            t.great("デビュー公演が満員になった！", { money: 10, happy: 10 });
          } else t.info("デビュー公演のお客さんは、家族だけだった", {});
        } else if (id === "athlete") {
          if (t.roll("プロになれる", opt.p)) {
            L.job = "athlete";
            L.flags.hit = true;
            t.great("プロ入り決定！ 背番号は1", { money: 10, happy: 10 });
          } else fallback("プロテストに落ちた。町のチームで楽しむことにした");
        } else if (id === "researcher") {
          if (t.roll("研究所に入れる", opt.p)) {
            L.job = "researcher";
            t.good("研究所に入れた！ 白衣がよく似合う", { learn: 6, money: 6 });
          } else fallback("研究所の試験に落ちた…ふるさとで働きながら独学することに");
        } else if (id === "inventor") {
          L.job = "inventor";
          t.good("ガレージで発明家としてデビューした", { happy: 6 });
        } else if (id === "explorer") {
          L.job = "explorer";
          t.good("地図を持たずに旅立った", { happy: 8, money: -3 });
        } else if (id === "comedian") {
          L.job = "comedian";
          if (t.roll("初舞台でウケる", opt.p)) {
            L.flags.hit = true;
            t.great("初舞台で大爆笑！ その場でスカウトされた", { money: 8, happy: 10 });
          } else t.info("初舞台はすべった。でも、あきらめない", { happy: -2 });
        } else if (id === "nursery") {
          if (t.roll("試験に受かる", opt.p)) {
            L.job = "nursery";
            t.good("保育士の試験に合格した！", { money: 6, happy: 8 });
          } else fallback("試験に落ちた…ふるさとで働きながら再挑戦することに");
        } else if (id === "move") {
          if (t.roll("移住できる", opt.p)) {
            L.country = "yutaka";
            L.migrated = true;
            L.job = "newcomer";
            t.good("ユタカ国に移り住んだ！ 新しい国での暮らしがはじまる", { money: 10, happy: -3 });
          } else fallback("移住の許可がおりず、ふるさとに残った");
        }
      },
    },
    {
      id: "life",
      age: 28,
      prompt: () => "28さい。これからの暮らしは？",
      options: (L) => [
        L.love === "yes"
          ? { id: "partner", always: true, label: "あの子と家族になる", sub: "18さいからの縁" }
          : { id: "partner", always: true, label: "パートナーと家族になる", sub: "にぎやかな毎日" },
        { id: "solo", label: "気ままにひとり暮らし", sub: "自由がいちばん" },
        { id: "pet", label: "なぞの生き物「モフ」を飼う", sub: "1日20時間ねるらしい" },
        { id: "share", label: "友だちとシェアハウス", sub: "毎日が合宿" },
        { id: "nomad", label: "旅をしながら暮らす", sub: "家はキャンピングカー" },
        { id: "parents", label: "実家で家族と暮らす", sub: "ごはんがおいしい" },
        { id: "island", label: "無人島で暮らす", sub: "自給自足" },
      ],
      apply(L, c, opt, t) {
        const id = opt.id;
        if (id === "partner") {
          L.partner = true;
          if (L.love === "yes") {
            L.flags.firstLove = true;
            t.great("18さいのときのあの子と、家族になった！", { happy: 14 });
          } else t.good("パートナーと一緒に暮らしはじめた", { happy: 10 });
        }
        if (id === "solo") t.info("ひとりの暮らしを楽しむことにした", { happy: 6, money: 6 });
        if (id === "pet") {
          L.pet = true;
          t.good("モフがやってきた。さっそく寝ている", { happy: 9 });
        }
        if (id === "share") t.good("シェアハウスで、毎晩パーティーになった", { happy: 8, money: 3 });
        if (id === "nomad") {
          L.flags.wander = true;
          t.good("キャンピングカーで、きちゅうをめぐる暮らしをはじめた", { happy: 9, money: -4 });
        }
        if (id === "parents") t.info("実家で暮らすことにした。ごはんがおいしい", { money: 8, happy: 3 });
        if (id === "island") t.good("無人島で、自給自足の暮らしをはじめた", { happy: 6, health: 3, money: -3 });
      },
    },
    {
      id: "chance",
      age: 35,
      prompt: (L) => "35さい。" + bigChance(L).prompt,
      options: (L) => {
        const ch = bigChance(L);
        const list = [
          { id: "go", always: true, label: ch.go, sub: "大成功か、大失敗か", p: ch.p },
          { id: "stay", always: true, label: "今のままでいい", sub: "安定がいちばん" },
          { id: "team", label: "仲間と一緒に挑戦する", sub: "ひとりより心強い", p: Math.min(0.9, ch.p + 0.1) },
          { id: "prep", label: "1年準備してから挑戦する", sub: "あわてない", p: Math.min(0.9, ch.p + 0.15) },
          { id: "coin", label: "コインを投げて決める", sub: "運命にまかせる" },
        ];
        if (L.partner) list.push({ id: "family", label: "家族に相談してから挑戦する", sub: "家族は味方", p: Math.min(0.9, ch.p + 0.08) });
        return list.map((o) => (o.p != null ? { ...o, pLabel: "成功する確率" } : o));
      },
      apply(L, c, opt, t) {
        const ch = bigChance(L);
        const tryIt = (p, lead) => {
          if (t.roll("成功する", p)) {
            L.flags.bigWin = true;
            t.great(lead + ch.win, { money: 20, happy: 12 });
          } else t.bad(lead + ch.lose, { money: -10, happy: -6 });
        };
        if (opt.id === "stay") t.info("今の暮らしを大切にすることにした", { happy: 2 });
        else if (opt.id === "go") tryIt(opt.p, "");
        else if (opt.id === "team") tryIt(opt.p, "仲間と力を合わせた。");
        else if (opt.id === "prep") tryIt(opt.p, "1年かけて準備した。");
        else if (opt.id === "family") tryIt(opt.p, "家族に背中をおされた。");
        else if (opt.id === "coin") {
          if (t.roll("コインが表", 0.5)) {
            t.info("コインは表。挑戦することにした");
            tryIt(ch.p, "");
          } else t.info("コインは裏。今の暮らしを続けることにした", { happy: 1 });
        }
      },
    },
    {
      id: "checkup",
      age: 40,
      prompt: () => "40さい。体のこと、どうする？",
      options: (L, c) => [
        { id: "yes", always: true, label: `健康診断を受ける（おかね −${c.checkupCost}）`, sub: "病気は早く見つけたい", p: c.clinicRate, pLabel: "近くに病院がある確率" },
        { id: "no", always: true, label: "何もしない", sub: "おかねを節約" },
        { id: "exercise", label: "運動をはじめる", sub: "まずは散歩から" },
        { id: "diet", label: "食生活を見直す", sub: "プリンをへらす" },
        { id: "dock", label: `全身を検査する（おかね −${c.checkupCost * 2}）`, sub: "すみずみまで調べる", p: c.clinicRate * 0.9, pLabel: "検査できる病院がある確率" },
        { id: "guts", label: "気合いで乗りきる", sub: "根性には自信がある" },
      ],
      apply(L, c, opt, t) {
        const id = opt.id;
        if (id === "no") t.info("体のことは、特に何もしなかった");
        if (id === "exercise") t.good("毎朝の運動をはじめた。三日坊主にはならなかった", { health: 6 });
        if (id === "diet") t.good("好物のプリンを週1回にへらした", { health: 4, happy: -1 });
        if (id === "guts") t.info("根性で乗りきることにした");
        if (id === "yes" || id === "dock") {
          if (t.roll(id === "yes" ? "近くに病院がある" : "検査できる病院がある", opt.p)) {
            L.checkup = true;
            const cost = id === "yes" ? c.checkupCost : c.checkupCost * 2;
            t.good("検査で病気を早く見つけ、治療できた", { money: -cost, health: id === "yes" ? 8 : 11 });
          } else t.bad("近くに病院がなく、検査を受けられなかった", {}, "自分では選べないできごと");
        }
      },
    },
    {
      id: "second",
      age: 55,
      prompt: () => "55さい。人生の後半、何をはじめる？",
      options: (L) => [
        { id: "teach", label: "若いモンスターに教える", sub: "経験を伝えたい" },
        { id: "trip", label: "きちゅう一周旅行", sub: "おかねがかかる", p: clamp(L.money / 90, 0.05, 0.95), pLabel: "おかねが足りる確率" },
        { id: "band", label: "バンドを組む", sub: "今からでもおそくない", p: 0.25, pLabel: "ヒットする確率" },
        { id: "rest", label: "のんびりすごす", sub: "昼寝は最高" },
        { id: "cooking", label: "料理教室に通う", sub: "包丁さばきに自信なし" },
        { id: "volunteer", label: "ボランティアをはじめる", sub: "町の役に立ちたい" },
        { id: "college", label: "大学に入りなおす", sub: "もう一度、学生に", p: clamp(0.3 + L.learn / 200, 0.1, 0.9), pLabel: "合格する確率" },
        { id: "dance", label: "ダンスを習う", sub: "腰に気をつけて" },
        { id: "novel", label: "小説を書く", sub: "主人公は自分", p: 0.2, pLabel: "賞をとる確率" },
      ],
      apply(L, c, opt, t) {
        const id = opt.id;
        if (id === "teach") t.good("教え子に「先生みたいになりたい」と言われた", { learn: 4, happy: 8 });
        if (id === "rest") t.good("昼寝の世界チャンピオンを名のりはじめた", { health: 5, happy: 4 });
        if (id === "cooking") t.good("料理教室で、きちゅう焼きの作り方を覚えた", { happy: 6 });
        if (id === "volunteer") t.good("町の子どもたちに、勉強を教えるボランティアをはじめた", { happy: 8 });
        if (id === "dance") t.good("ダンス教室で、いちばんノリノリの生徒になった", { health: 4, happy: 6 });
        if (id === "trip") {
          if (t.roll("おかねが足りる", opt.p)) {
            L.flags.worldTrip = true;
            t.great("2つの月が両方見える丘で、星を見ながらラーメンを食べた", { happy: 14, money: -15 });
          } else t.info("おかねが足りず、となり町まで行って帰ってきた", { happy: 3, money: -3 });
        }
        if (id === "band") {
          if (t.roll("ヒットする", opt.p)) {
            L.flags.bandHit = true;
            t.great("まさかのヒット曲が生まれた！ 曲名は「腰がいたい」", { happy: 12, money: 10 });
          } else t.good("お客さんは3匹だったが、最高に楽しかった", { happy: 7 });
        }
        if (id === "college") {
          if (t.roll("合格する", opt.p)) t.good("55さいで大学生になった！", { learn: 10, happy: 6 });
          else t.info("試験には落ちたが、勉強は続けた", { learn: 4 });
        }
        if (id === "novel") {
          if (t.roll("賞をとる", opt.p)) {
            L.flags.novel = true;
            t.great("書いた小説が、きちゅう文学賞をとった！", { happy: 12, money: 8 });
          } else t.good("小説を書き上げた。読んだのは家族だけ", { happy: 5 });
        }
      },
    },
    {
      id: "last",
      age: 70,
      prompt: () => "70さい。最後にやってみたいことは？",
      options: (L) => [
        { id: "space", label: "宇宙旅行に行く", sub: "きちゅうを外から見たい", p: clamp((L.money - 35) / 80, 0.03, 0.75), pLabel: "行ける確率" },
        { id: "book", label: "自分の一生を本にする", sub: "タイトルはもう決めた" },
        L.partner || L.kids > 0
          ? { id: "family", label: "家族とすごす", sub: "孫の顔も見たい" }
          : { id: "family", label: "昔からの友だちとすごす", sub: "昔話に花がさく" },
        { id: "pumpkin", label: "巨大カボチャを育てる", sub: "めざせ町いちばん", p: 0.35, pLabel: "町いちばんになる確率" },
        { id: "cruise", label: "豪華客船で一周旅行", sub: "おかねがかかる", p: clamp(L.money / 100, 0.03, 0.9), pLabel: "おかねが足りる確率" },
        { id: "marathon", label: "マラソン完走に挑戦", sub: "42.195km", p: clamp(L.health / 90, 0.05, 0.9), pLabel: "完走できる確率" },
        { id: "memories", label: "思い出の場所をめぐる", sub: "生まれた町から" },
        { id: "dream", label: "若いころの夢に再挑戦", sub: "まだ間に合う", p: 0.3, pLabel: "夢がかなう確率" },
      ],
      apply(L, c, opt, t) {
        const id = opt.id;
        if (id === "space") {
          if (t.roll("宇宙に行ける", opt.p)) {
            L.flags.space = true;
            t.great("きちゅうを宇宙から見た。まるくて、きれいだった", { happy: 15 });
          } else t.bad("抽選にはずれた。かわりに宇宙の図鑑を買った", { happy: -2 });
        }
        if (id === "book") t.good(`自伝『${L.name}の一生』が、町の図書館に置かれた`, { happy: 8 });
        if (id === "family") t.good(L.partner || L.kids > 0 ? "家族と毎日わらってすごした" : "昔からの友だちと、毎日昔話をした", { happy: 10 });
        if (id === "memories") t.good("生まれた町や、思い出の場所をゆっくりめぐった", { happy: 8 });
        if (id === "pumpkin") {
          if (t.roll("町いちばんになる", opt.p)) {
            L.flags.pumpkin = true;
            t.great("重さ300kgのカボチャで町いちばんになった！", { happy: 12 });
          } else t.info("カボチャはふつうの大きさだったが、おいしかった", { happy: 4 });
        }
        if (id === "cruise") {
          if (t.roll("おかねが足りる", opt.p)) {
            L.flags.worldTrip = true;
            t.great("豪華客船で、きちゅうをぐるっと一周した！", { happy: 12, money: -12 });
          } else t.info("おかねが足りず、近くの湖でボートに乗った", { happy: 3 });
        }
        if (id === "marathon") {
          if (t.roll("完走できる", opt.p)) {
            L.flags.runner = true;
            t.great("70さいで、マラソンを完走した！", { happy: 12, health: 3 });
          } else t.bad("30kmでリタイアした。でも、みんなが拍手してくれた", { happy: 2, health: -3 });
        }
        if (id === "dream") {
          if (t.roll("夢がかなう", opt.p)) t.great("若いころの夢を、ついにかなえた！", { happy: 14 });
          else t.good("夢はかなわなかったけれど、挑戦して楽しかった", { happy: 5 });
        }
      },
    },
  ],

  // ---------- 毎年おこるかもしれない できごと ----------
  // ages     : おこる年れいの範囲 [から, まで]
  // rate     : 1年のうちに おこる確率（数字、または L と国から計算する関数）
  // when     : おこるための条件（なければ いつでも）
  // max      : 一生のうちに おこる最大の回数
  // cooldown : 一度おこったら、次におこるまで あける年数
  // kind     : "great"（大成功）, "good"（うれしい）, "bad"（つらい）, "info"（ふつう）
  // text     : 文。["…", "…"] のように いくつか書くと、おこるたびに順番に使われる
  events: [
    // ===== きびしい現実（国や家によって確率がちがう） =====
    {
      id: "sick", ages: [1, 120], kind: "bad", cooldown: 2,
      rate: (L, c) => c.sickRate * (L.age < 5 ? 1.6 : L.age >= 60 ? 1.5 : 1),
      text: (L) => L.age < 5
        ? ["高い熱が続く病気にかかった", "おなかの病気で、何日もねこんだ", "せきが止まらない病気にかかった"]
        : ["重い病気にかかって入院した", "きちゅうインフルエンザにかかった", "原因のわからない熱が続いた", "胸の病気で、しばらく働けなかった", "おなかをこわして、1週間ねこんだ", "目の病気で、しばらく本が読めなかった"],
      effect: { health: -12, happy: -4 },
    },
    { id: "injury", ages: [5, 60], kind: "bad", rate: 0.018, max: 3, cooldown: 5, text: ["大きなけがをして、しばらく動けなかった", "階段から落ちて、骨を折った", "スポーツ中に、アンテナをいためた"], effect: { health: -6, happy: -2 } },
    { id: "disaster", ages: [1, 120], kind: "bad", cooldown: 3, rate: (L, c) => c.disaster.rate, text: (L, c) => c.disaster.text, effect: { money: -14, health: -5, happy: -6 } },
    { id: "childWork", ages: [7, 14], kind: "bad", max: 2, rate: 0.12, when: (L) => L.family === "kibishii" || !L.school, text: ["家計を助けるため、朝から晩まで働いた", "弟や妹の世話で、遊ぶ時間がなかった"], effect: { money: 4, learn: -3, health: -2 } },
    { id: "water", ages: [6, 16], kind: "bad", max: 1, rate: 0.1, when: (L) => (L.country === "sunaoka" || L.country === "morinooku") && L.family !== "yutori", text: "毎朝、遠くの井戸まで水をくみに行った", effect: { health: -2, learn: -2 } },
    { id: "jobLoss", ages: [23, 64], kind: "bad", max: 2, cooldown: 6, rate: (L, c) => c.jobLossRate, text: ["働いていた会社がなくなってしまった", "仕事がへって、給料が下がった"], effect: { money: -14, happy: -8 } },
    { id: "debt", ages: [25, 64], kind: "bad", max: 1, rate: 0.04, when: (L) => L.money < 20, text: "生活費が足りず、借金をした", effect: { money: 4, happy: -6 } },
    { id: "fraud", ages: [25, 80], kind: "bad", max: 1, rate: 0.008, text: "「絶対もうかる」という話にだまされた", effect: { money: -10, happy: -4 } },
    { id: "overwork", ages: [25, 60], kind: "bad", max: 1, rate: 0.012, text: "働きすぎて、たおれてしまった", effect: { health: -6 } },
    { id: "back", ages: [50, 120], kind: "bad", max: 2, cooldown: 8, rate: 0.03, text: ["腰をいためてしまった", "ひざが痛くて、階段がつらくなった"], effect: { health: -6, happy: -2 } },

    // ===== 赤ちゃんのころ =====
    { id: "firstWord", ages: [1, 2], kind: "good", max: 1, rate: 0.25, text: "はじめてしゃべった言葉は「ごはん」だった", effect: { happy: 3 } },
    { id: "firstWalk", ages: [1, 2], kind: "good", max: 1, rate: 0.2, text: "はじめて歩いた！ 3歩でころんだ", effect: { happy: 3 } },
    { id: "antenna", ages: [1, 5], kind: "good", max: 1, rate: 0.08, text: "頭のアンテナが、はじめてピカッと光った", effect: { happy: 4 } },
    { id: "toy", ages: [2, 5], kind: "info", max: 1, rate: 0.08, text: "おもちゃを分解して、元にもどせなくなった", effect: { learn: 1 } },
    { id: "hide", ages: [3, 7], kind: "info", max: 1, rate: 0.06, text: "かくれんぼで本気でかくれすぎて、夕方まで見つけてもらえなかった", effect: {} },

    // ===== 子どものころ =====
    { id: "friend", ages: [4, 20], kind: "good", rate: 0.05, max: 2, cooldown: 4, text: ["なんでも話せる親友ができた", "大げんかした友だちと仲直りして、親友になった"], effect: { happy: 8 } },
    { id: "base", ages: [6, 12], kind: "good", rate: 0.04, max: 1, text: "友だちと森に秘密基地を作った", effect: { happy: 6 } },
    { id: "bugHero", ages: [6, 11], kind: "good", rate: 0.04, max: 1, text: "でっかい虫をつかまえて、クラスのヒーローになった", effect: { happy: 5 } },
    { id: "fang", ages: [6, 9], kind: "info", rate: 0.06, max: 1, text: "はじめてキバがぬけた。屋根の上に投げた", effect: {} },
    { id: "lost", ages: [5, 10], kind: "bad", rate: 0.03, max: 1, text: "おつかいの帰りに迷子になって、泣いた", effect: { happy: -2 } },
    { id: "window", ages: [7, 13], kind: "bad", rate: 0.03, max: 1, text: "ボール遊びで、近所の家の窓をわってしまった", effect: { money: -2, happy: -3 } },
    { id: "moonView", ages: [5, 15], kind: "good", rate: 0.04, max: 1, text: "家族で月見をした。2つの月が両方まんまるだった", effect: { happy: 5 } },
    { id: "babyMofu", ages: [6, 15], kind: "good", rate: 0.03, max: 1, text: "迷子の子モフを、家まで送りとどけた", effect: { happy: 5 } },
    { id: "pudding", ages: [7, 14], kind: "good", rate: 0.04, max: 1, when: (L) => L.school, text: "給食のプリンをかけたじゃんけんで10連勝した", effect: { happy: 5 } },
    { id: "research", ages: [7, 12], kind: "good", rate: 0.04, max: 1, when: (L) => L.school, text: "夏休みの自由研究「アンテナはなぜ光るのか」で賞をとった", effect: { learn: 5, happy: 3 } },
    { id: "drawing", ages: [6, 12], kind: "good", rate: 0.03, max: 1, text: "描いた絵が、町のコンクールで入選した", effect: { happy: 5 } },
    { id: "zero", ages: [8, 17], kind: "bad", rate: 0.025, max: 1, when: (L) => L.school, text: "テストで0点をとった。名前を書き忘れていた", effect: { happy: -3, learn: 2 } },
    { id: "relay", ages: [9, 18], kind: "good", max: 1, rate: (L) => (L.trait === "run" ? 0.1 : 0.025), when: (L) => L.school, text: "リレーのアンカーで3匹ぬきした！", effect: { happy: 7, health: 3 } },
    { id: "bookLove", ages: [7, 25], kind: "good", max: 1, rate: (L) => (L.trait === "book" ? 0.08 : 0.02), text: "図書館の本を、ぜんぶ読みおわった", effect: { learn: 10, happy: 3 } },

    // ===== 国ごとのくらし =====
    { id: "monorail", ages: [6, 15], kind: "good", rate: 0.05, max: 1, when: (L) => L.country === "yutaka", text: "モノレールの運転席を見学させてもらった", effect: { happy: 5 } },
    { id: "late", ages: [20, 64], kind: "info", rate: 0.03, max: 1, when: (L) => L.country === "yutaka", text: "モノレールが止まって、大事な日に遅刻した", effect: { happy: -1 } },
    { id: "windmill", ages: [6, 15], kind: "good", rate: 0.05, max: 1, when: (L) => L.country === "midori", text: "風車のてっぺんから、町じゅうを見下ろした", effect: { happy: 5 } },
    { id: "harvest", ages: [20, 80], kind: "good", rate: 0.03, max: 1, when: (L) => L.country === "midori", text: "大豊作！ 野菜をご近所に配ってまわった", effect: { happy: 6, money: 3 } },
    { id: "fishing", ages: [6, 20], kind: "good", rate: 0.05, max: 1, when: (L) => L.country === "hateno", text: "はじめて自分で大きな魚をつった", effect: { happy: 5 } },
    { id: "whale", ages: [10, 90], kind: "great", rate: 0.015, max: 1, when: (L) => L.country === "hateno", text: "海で、空飛ぶクジラの群れを見た！", effect: { happy: 8 } },
    { id: "sled", ages: [6, 15], kind: "good", rate: 0.05, max: 1, when: (L) => L.country === "sunaoka", text: "砂の丘をソリですべって遊んだ", effect: { happy: 5 } },
    { id: "oasis", ages: [15, 80], kind: "good", rate: 0.02, max: 1, when: (L) => L.country === "sunaoka", text: "砂漠で、地図にないオアシスを見つけた", effect: { happy: 6 } },
    { id: "treeHouse", ages: [6, 14], kind: "good", rate: 0.05, max: 1, when: (L) => L.country === "morinooku", text: "大きな木の上に、ツリーハウスを作った", effect: { happy: 5 } },
    { id: "parade", ages: [5, 90], kind: "good", rate: 0.02, max: 1, when: (L) => L.country === "morinooku", text: "王様のパレードで、手をふってもらった", effect: { happy: 5 } },

    // ===== 種族ならでは =====
    { id: "melt", ages: [8, 90], kind: "info", rate: 0.03, max: 1, when: (L) => L.species === "purun", text: "暑すぎる日に、体が少しとけかけた", effect: {} },
    { id: "puff", ages: [5, 90], kind: "info", rate: 0.03, max: 1, when: (L) => L.species === "moko", text: "雨の日に毛が2倍にふくらみ、ドアを通れなかった", effect: {} },
    { id: "weather", ages: [8, 90], kind: "good", rate: 0.03, max: 1, when: (L) => L.species === "tsuno", text: "ツノで天気を当てて、町の天気予報係になった", effect: { happy: 5 } },
    { id: "farSight", ages: [8, 90], kind: "good", rate: 0.03, max: 1, when: (L) => L.species === "gyoro", text: "大きな目で、遠くにいる迷子を見つけた", effect: { happy: 5 } },
    { id: "fly", ages: [8, 60], kind: "great", rate: 0.03, max: 1, when: (L) => L.species === "pata", text: "はじめて10秒間、空を飛べた！", effect: { happy: 8 } },

    // ===== 性格・特技ならでは =====
    { id: "marathon", ages: [12, 50], kind: "good", rate: 0.04, max: 1, when: (L) => L.trait === "run", text: "きちゅうマラソンで優勝した！", effect: { happy: 6, health: 4 } },
    { id: "quiz", ages: [12, 60], kind: "good", rate: 0.04, max: 1, when: (L) => L.trait === "book", text: "クイズ大会で、町いちばんになった", effect: { happy: 6, learn: 3 } },
    { id: "clock", ages: [10, 40], kind: "good", rate: 0.04, max: 1, when: (L) => L.trait === "make", text: "目覚まし時計を改造して、毎朝おどる時計にした", effect: { happy: 5, learn: 2 } },
    { id: "newStar", ages: [8, 60], kind: "info", rate: 0.04, max: 1, when: (L) => L.trait === "sky", text: "夜空に新しい星を見つけた…と思ったら、飛行機だった", effect: { happy: 1 } },
    { id: "stage", ages: [13, 19], kind: "good", rate: 0.08, max: 1, when: (L) => L.skill === "music", text: "文化祭のステージで歌った。拍手が鳴りやまなかった", effect: { happy: 8 } },
    { id: "fullCourse", ages: [13, 19], kind: "good", rate: 0.08, max: 1, when: (L) => L.skill === "cook", text: "家族の誕生日に、フルコースを作った", effect: { happy: 6 } },
    { id: "schoolApp", ages: [14, 19], kind: "good", rate: 0.06, max: 1, when: (L) => L.skill === "code", text: "作ったアプリを、学校のみんなが使い始めた", effect: { learn: 4, happy: 5 } },
    { id: "birdHome", ages: [13, 19], kind: "good", rate: 0.08, max: 1, when: (L) => L.skill === "animal", text: "迷子の鳥を、鳴き声だけで家に帰した", effect: { happy: 6 } },

    // ===== 中学生・高校生のころ =====
    { id: "play", ages: [12, 18], kind: "good", rate: 0.04, max: 1, when: (L) => L.school, text: "文化祭の劇で、木の役なのに主役より目立った", effect: { happy: 6 } },
    { id: "trip", ages: [12, 17], kind: "good", rate: 0.05, max: 1, when: (L) => L.school, text: "修学旅行のまくら投げ大会で優勝した", effect: { happy: 6 } },
    { id: "topScore", ages: [14, 18], kind: "good", rate: 0.08, max: 1, when: (L) => L.school && L.learn >= 50, text: "テストで学年1位をとった", effect: { learn: 6, happy: 4 } },
    { id: "allNighter", ages: [14, 18], kind: "bad", rate: 0.03, max: 1, when: (L) => L.school, text: "テスト前に一夜づけしようとして、すぐねむってしまった", effect: { learn: -2 } },
    { id: "talk", ages: [14, 19], kind: "good", rate: 0.04, max: 1, text: "親友と、夜明けまで将来の話をした", effect: { happy: 5 } },
    { id: "growth", ages: [13, 16], kind: "info", rate: 0.06, max: 1, text: "1年で、体がひとまわり大きくなった", effect: { health: 2 } },
    { id: "partTime", ages: [15, 19], kind: "good", rate: 0.05, max: 1, text: "はじめてのアルバイト代で、家族にケーキを買った", effect: { money: 3, happy: 5 } },
    { id: "license", ages: [17, 30], kind: "good", rate: 0.04, max: 1, text: "空飛ぶスクーターの免許をとった", effect: { happy: 5 } },
    { id: "phone", ages: [14, 30], kind: "bad", rate: 0.015, max: 1, text: "スマホを海に落とした", effect: { money: -3, happy: -3 } },

    // ===== きちゅうならではの不思議 =====
    { id: "doubleMoon", ages: [5, 110], kind: "great", rate: 0.006, max: 1, text: "2つの月が重なる「ダブルムーン」を見た。願いごとをした", effect: { happy: 8 } },
    { id: "meteor", ages: [10, 90], kind: "great", rate: 0.004, max: 1, text: "道で拾った石が、なんと隕石だった！", effect: { money: 18, happy: 5 } },
    { id: "alien", ages: [15, 95], kind: "good", rate: 0.005, max: 1, text: "となりの星から来た旅行者に、道を聞かれた", effect: { happy: 5 } },
    { id: "rainbow", ages: [5, 100], kind: "good", rate: 0.006, max: 1, text: "空に3本の虹がならんだ。いいことがありそう", effect: { happy: 4 } },
    { id: "net", ages: [10, 60], kind: "good", max: 1, rate: (L, c) => c.netRate * 0.02, text: "住んでいる町に「きちゅうネット」がつながった", effect: { learn: 6, happy: 3 } },
    { id: "flame", ages: [15, 50], kind: "bad", max: 1, rate: 0.025, when: (L) => L.skill === "code" || L.job === "streamer", text: "きちゅうネットで炎上した…しばらくスマホを封印", effect: { happy: -8 } },
    { id: "wallet", ages: [20, 80], kind: "info", rate: 0.008, max: 1, text: "財布を落とした。次の日、なぜかカラスが届けてくれた", effect: {} },

    // ===== 仕事ごとのできごと =====
    { id: "chefBuzz", ages: [23, 70], kind: "good", max: 1, rate: 0.04, when: (L) => L.job === "chef", text: "新メニュー「きちゅう焼き」に行列ができた", effect: { money: 10, happy: 4 } },
    { id: "critic", ages: [23, 70], kind: "good", max: 1, rate: 0.03, when: (L) => L.job === "chef", text: "有名な料理評論家が、屋台に食べに来た", effect: { happy: 6, money: 4 } },
    { id: "price", ages: [23, 70], kind: "bad", max: 1, rate: 0.03, when: (L) => L.job === "chef", text: "食材が値上がりして、メニューを減らした", effect: { money: -6 } },
    { id: "streamBuzz", ages: [23, 60], kind: "good", max: 1, rate: 0.05, when: (L) => L.job === "streamer", text: "動画「モフの寝顔 10時間」が100万回再生された", effect: { money: 12, happy: 5 } },
    { id: "collab", ages: [23, 60], kind: "good", max: 1, rate: 0.03, when: (L) => L.job === "streamer", text: "あこがれの大物配信者とコラボした", effect: { happy: 7 } },
    { id: "asleep", ages: [23, 60], kind: "info", max: 1, rate: 0.03, when: (L) => L.job === "streamer", text: "配信中に寝落ちした。その回が過去最高の視聴数だった", effect: { money: 3 } },
    { id: "bug", ages: [23, 64], kind: "bad", max: 2, cooldown: 5, rate: 0.04, when: (L) => L.job === "programmer", text: ["バグを直すため、3日間徹夜した", "大事な発表の直前に、プログラムが動かなくなった"], effect: { health: -5, happy: -3 } },
    { id: "hackathon", ages: [23, 50], kind: "good", max: 1, rate: 0.03, when: (L) => L.job === "programmer", text: "きちゅうハッカソンで優勝した", effect: { happy: 6, money: 5 } },
    { id: "appHit", ages: [23, 64], kind: "great", max: 1, rate: 0.02, when: (L) => L.job === "programmer", text: "作ったアプリが、きちゅう中で使われた！", effect: { money: 15, happy: 6 } },
    { id: "paper", ages: [23, 70], kind: "good", max: 1, rate: 0.04, when: (L) => L.job === "researcher", text: "論文が「きちゅう科学」の表紙をかざった", effect: { learn: 8, money: 5 } },
    { id: "explode", ages: [23, 70], kind: "info", max: 1, rate: 0.03, when: (L) => L.job === "researcher", text: "実験が爆発して、髪型が変わった", effect: {} },
    { id: "island", ages: [23, 70], kind: "good", max: 1, rate: 0.05, when: (L) => L.job === "explorer", text: "地図にのっていない島を見つけた", effect: { happy: 8 } },
    { id: "flower", ages: [23, 70], kind: "good", max: 1, rate: 0.03, when: (L) => L.job === "explorer", text: "ジャングルで、自分より大きな花を見つけた", effect: { happy: 6 } },
    { id: "stranded", ages: [23, 70], kind: "bad", max: 1, rate: 0.03, when: (L) => L.job === "explorer", text: "雪山で遭難しかけた。モフにそっくりな生き物に助けられた", effect: { health: -5 } },
    { id: "goal", ages: [23, 40], kind: "good", max: 1, rate: 0.05, when: (L) => L.job === "athlete", text: "試合で決勝ゴールを決めた！", effect: { happy: 8, money: 6 } },
    { id: "sportInjury", ages: [23, 40], kind: "bad", max: 1, rate: 0.03, when: (L) => L.job === "athlete", text: "けがで、半年間試合に出られなかった", effect: { health: -5, happy: -4 } },
    { id: "invent", ages: [23, 80], kind: "info", max: 1, rate: 0.04, when: (L) => L.job === "inventor", text: "自動でネギを切るマシンを発明した（売れなかった）", effect: { happy: 2, money: -3 } },
    { id: "patent", ages: [23, 80], kind: "good", max: 1, rate: 0.03, when: (L) => L.job === "inventor", text: "ねむくならない枕を発明して、特許をとった", effect: { money: 8, happy: 5 } },
    { id: "vetSave", ages: [23, 70], kind: "good", max: 1, rate: 0.05, when: (L) => L.job === "vet", text: "けがをした鳥を治して、空へ返した", effect: { happy: 6 } },
    { id: "nightCall", ages: [23, 70], kind: "info", max: 1, rate: 0.03, when: (L) => L.job === "vet", text: "夜中に急患のモフが運ばれてきた。原因は食べすぎだった", effect: {} },
    { id: "mail", ages: [23, 64], kind: "good", max: 1, rate: 0.04, when: (L) => L.job === "postman", text: "月面の小さな村に、はじめて手紙を届けた", effect: { happy: 6, money: 4 } },
    { id: "penguin", ages: [23, 64], kind: "good", max: 1, rate: 0.03, when: (L) => L.job === "postman", text: "ペンギンそっくりの宇宙人に、ラブレターを届けた", effect: { happy: 5 } },
    { id: "festival", ages: [23, 80], kind: "good", max: 1, rate: 0.03, when: (L) => L.job === "home", text: "村祭りでおどりを披露し、大ウケした", effect: { happy: 6 } },
    { id: "watermelon", ages: [23, 80], kind: "good", max: 1, rate: 0.03, when: (L) => L.job === "home", text: "村でいちばん大きなスイカを育てた", effect: { happy: 5 } },
    { id: "language", ages: [22, 40], kind: "bad", max: 1, rate: 0.12, when: (L) => L.job === "newcomer", text: "ユタカ国の言葉がうまく話せず、苦労した", effect: { happy: -5 } },
    { id: "newFriend", ages: [23, 60], kind: "good", max: 1, rate: 0.08, when: (L) => L.migrated, text: "ユタカ国で、なんでも話せる友だちができた", effect: { happy: 8 } },
    { id: "promotion", ages: [23, 64], kind: "good", max: 3, cooldown: 4, rate: (L) => 0.02 + L.learn / 1500, text: ["仕事が認められて、給料が上がった", "チームのリーダーをまかされた", "社長に名前を覚えてもらえた"], effect: { money: 12, happy: 4 } },

    { id: "bigLaugh", ages: [23, 70], kind: "good", max: 1, rate: 0.05, when: (L) => L.job === "comedian", text: "ネタがウケすぎて、お客さんがいすから落ちた", effect: { happy: 7, money: 4 } },
    { id: "silence", ages: [23, 70], kind: "bad", max: 1, rate: 0.04, when: (L) => L.job === "comedian", text: "ネタがすべって、会場がしーんとなった", effect: { happy: -5 } },
    { id: "portraits", ages: [23, 70], kind: "good", max: 1, rate: 0.06, when: (L) => L.job === "nursery", text: "子どもたちから、似顔絵をプレゼントされた", effect: { happy: 8 } },
    { id: "kidsCold", ages: [23, 70], kind: "bad", max: 1, rate: 0.04, when: (L) => L.job === "nursery", text: "子どもたちのかぜが、ぜんぶうつった", effect: { health: -4 } },
    { id: "picturebook", ages: [23, 70], kind: "good", max: 1, rate: 0.05, when: (L) => L.job === "illustrator", text: "描いた絵本が、本屋さんにならんだ", effect: { happy: 7, money: 5 } },
    { id: "deadline", ages: [23, 70], kind: "bad", max: 1, rate: 0.04, when: (L) => L.job === "illustrator", text: "しめきり前に、3日間ねむれなかった", effect: { health: -4 } },
    { id: "tvMagic", ages: [23, 70], kind: "good", max: 1, rate: 0.04, when: (L) => L.job === "magician", text: "テレビのマジック番組に出演した", effect: { happy: 7, money: 5 } },
    { id: "trickOut", ages: [23, 70], kind: "bad", max: 1, rate: 0.04, when: (L) => L.job === "magician", text: "ステージの上で、タネがバレてしまった", effect: { happy: -5 } },
    { id: "deal", ages: [23, 64], kind: "good", max: 1, rate: 0.05, when: (L) => L.job === "city", text: "大きな取引をまとめて、ボーナスが出た", effect: { money: 10, happy: 3 } },
    { id: "crowded", ages: [23, 64], kind: "info", max: 1, rate: 0.05, when: (L) => L.job === "city", text: "満員モノレールで、毎朝ぺちゃんこになった", effect: { happy: -1 } },
    { id: "cabbage", ages: [23, 80], kind: "bad", max: 1, rate: 0.05, when: (L) => L.job === "farmer", text: "畑にモフの群れがやってきて、キャベツを食べられた", effect: { money: -5 } },
    { id: "veggies", ages: [23, 80], kind: "good", max: 1, rate: 0.05, when: (L) => L.job === "farmer", text: "とれたての野菜が、町のレストランで大人気になった", effect: { money: 8, happy: 4 } },
    { id: "stamps", ages: [23, 64], kind: "info", max: 1, rate: 0.05, when: (L) => L.job === "office", text: "1日に1000枚の書類にハンコを押した", effect: {} },
    { id: "thanks", ages: [23, 64], kind: "good", max: 1, rate: 0.05, when: (L) => L.job === "office", text: "町のモンスターたちから、感謝の手紙が届いた", effect: { happy: 7 } },

    // ===== おとなになってから =====
    { id: "travel", ages: [18, 80], kind: "good", max: 3, cooldown: 6, rate: (L) => 0.004 + L.money / 1200, text: ["きちゅうの反対側まで旅をした", "月まで日帰り旅行をした", "南の島で、星空の下にねころんだ"], effect: { happy: 10, money: -4 } },
    { id: "lottery", ages: [18, 120], kind: "great", max: 1, rate: 0.004, text: "くじで大当たり！", effect: { money: 20, happy: 6 } },
    { id: "move", ages: [22, 50], kind: "info", max: 1, rate: 0.02, text: "引っこしをした。荷物の半分はガラクタだった", effect: {} },
    { id: "bread", ages: [20, 60], kind: "info", max: 1, rate: 0.015, text: "はじめて焼いたパンが、石のように固かった", effect: {} },
    { id: "reunion", ages: [30, 70], kind: "good", max: 1, rate: 0.02, text: "同窓会で、昔の親友と再会した", effect: { happy: 6 } },
    { id: "neighbor", ages: [25, 85], kind: "good", max: 1, rate: 0.015, text: "となりに引っこしてきたモンスターと仲良くなった", effect: { happy: 5 } },
    { id: "volunteer", ages: [20, 75], kind: "good", max: 1, rate: 0.015, text: "町のゴミ拾いボランティアで、表彰された", effect: { happy: 5 } },
    { id: "scooter", ages: [20, 70], kind: "bad", max: 1, rate: 0.008, text: "空飛ぶスクーターで、電柱にぶつかった（けがは軽かった）", effect: { health: -3, money: -3 } },
    { id: "house", ages: [30, 55], kind: "good", max: 1, rate: 0.04, when: (L) => L.money >= 60, text: "あこがれのマイホームを建てた", effect: { money: -10, happy: 10 } },
    { id: "baby", ages: [29, 42], kind: "good", max: 3, rate: 0.16, when: (L) => L.partner, text: ["子どもがタマゴからかえった！", "2匹目の子どもがタマゴからかえった！", "3匹目の子どもがタマゴからかえった！"], effect: { happy: 10, money: -5 } },
    { id: "kidWalk", ages: [30, 50], kind: "good", max: 1, rate: 0.15, when: (L) => L.kids > 0, text: "子どもがはじめて歩いた。家族みんなで拍手した", effect: { happy: 6 } },
    { id: "kidSchool", ages: [36, 55], kind: "good", max: 1, rate: 0.1, when: (L) => L.kids > 0, text: "子どもの入学式で、こっそり泣いた", effect: { happy: 6 } },
    { id: "rebel", ages: [42, 62], kind: "bad", max: 1, rate: 0.06, when: (L) => L.kids > 0, text: "子どもの反抗期で、毎日けんかになった", effect: { happy: -4 } },
    { id: "kidGrad", ages: [48, 70], kind: "good", max: 1, rate: 0.08, when: (L) => L.kids > 0, text: "子どもがひとり立ちした。少しさみしい", effect: { happy: 4 } },
    { id: "pudding2", ages: [29, 80], kind: "bad", max: 1, rate: 0.04, when: (L) => L.partner, text: "パートナーと大げんか。原因は冷蔵庫のプリンだった", effect: { happy: -3 } },
    { id: "anniversary", ages: [35, 90], kind: "good", max: 1, rate: 0.04, when: (L) => L.partner, text: "記念日に、パートナーが手紙をくれた", effect: { happy: 7 } },
    { id: "mofu", ages: [29, 95], kind: "good", max: 1, rate: 0.06, when: (L) => L.pet, text: "モフが「おすわり」を覚えた（3年かかった）", effect: { happy: 5 } },
    { id: "mofuBig", ages: [30, 95], kind: "info", max: 1, rate: 0.05, when: (L) => L.pet, text: "モフが2倍の大きさに育った。ベッドをとられた", effect: { happy: 2 } },
    { id: "mofuRun", ages: [30, 95], kind: "info", max: 1, rate: 0.04, when: (L) => L.pet, text: "モフが家出した…と思ったら、押し入れで寝ていた", effect: {} },

    // ===== 年をとってから =====
    { id: "grandchild", ages: [52, 95], kind: "good", max: 1, rate: 0.1, when: (L) => L.kids > 0, text: "孫がタマゴからかえった！", effect: { happy: 10 } },
    { id: "gameLoss", ages: [60, 95], kind: "good", max: 1, rate: 0.05, when: (L) => L.kids > 0, text: "孫にゲームで完敗した。くやしいけど楽しい", effect: { happy: 5 } },
    { id: "diary", ages: [50, 95], kind: "info", max: 1, rate: 0.02, text: "若いころの日記が見つかり、ひとりで赤面した", effect: { happy: 2 } },
    { id: "hobby", ages: [55, 120], kind: "good", max: 1, rate: 0.03, text: "畑づくりという楽しい趣味を見つけた", effect: { happy: 6, health: 3 } },
    { id: "walkClub", ages: [60, 95], kind: "good", max: 1, rate: 0.03, text: "毎朝の散歩仲間が10匹になった", effect: { health: 3, happy: 4 } },
    { id: "smartphone", ages: [65, 100], kind: "info", max: 1, rate: 0.03, text: "新しいスマホの使い方がわからず、同じことを3回聞いた", effect: {} },
    { id: "glasses", ages: [70, 110], kind: "info", max: 1, rate: 0.03, text: "メガネを頭にのせたまま、メガネをさがした", effect: {} },
    { id: "seniorDance", ages: [62, 95], kind: "good", max: 1, rate: 0.02, text: "シニアダンス大会で優勝した", effect: { happy: 7, health: 2 } },
    { id: "teaParty", ages: [65, 105], kind: "good", max: 1, rate: 0.03, text: "近所の仲間と、毎週お茶会を開くようになった", effect: { happy: 5 } },
    { id: "oldLetter", ages: [60, 100], kind: "good", max: 1, rate: 0.02, text: "昔お世話になったモンスターから、手紙がとどいた", effect: { happy: 6 } },
  ],

  // ---------- 称号（一生の終わりに、上から順に当てはまるものが1つ選ばれる） ----------
  titles: [
    { id: "smallStar", name: "小さな星", desc: "きちゅうでは、早く旅立ったモンスターは星になって家族を見守るといわれています。", test: (L) => L.deathAge < 7 },
    { id: "space", name: "宇宙を見たモンスター", desc: "きちゅうを外から見た、数少ないモンスター。", test: (L) => L.flags.space },
    { id: "legendStreamer", name: "伝説のきちゅうチューバー", desc: "月面配信は、いまも語りつがれている。", test: (L) => L.job === "streamer" && L.flags.bigWin },
    { id: "gourmet", name: "きちゅう料理王", desc: "「きちゅう焼き」の生みの親。", test: (L) => L.job === "chef" && L.flags.bigWin },
    { id: "discoverer", name: "新種ハンター", desc: "図鑑に自分の名前がのった。", test: (L) => L.job === "researcher" && L.flags.bigWin },
    { id: "founder", name: "天才起業家", desc: "きちゅうの全員がそのアプリを使っている。", test: (L) => L.job === "programmer" && L.flags.bigWin },
    { id: "hero", name: "きちゅうボールの英雄", desc: "決勝ゴールは、何度も再放送された。", test: (L) => L.job === "athlete" && L.flags.bigWin },
    { id: "ruins", name: "伝説の冒険家", desc: "古代モンスターの遺跡を見つけた。", test: (L) => L.job === "explorer" && L.flags.bigWin },
    { id: "flyer", name: "空飛ぶ発明王", desc: "空飛ぶ自転車は、いまや通学の定番。", test: (L) => L.job === "inventor" && L.flags.bigWin },
    { id: "giantMofu", name: "巨大モフの恩人", desc: "巨大モフの背中に乗ったことがある。", test: (L) => L.job === "vet" && L.flags.bigWin },
    { id: "stormMail", name: "嵐の配達モンスター", desc: "どんな嵐でも、手紙は届く。", test: (L) => L.job === "postman" && L.flags.bigWin },
    { id: "painter", name: "伝説の画家", desc: "描いた絵は、美術館にかざられている。", test: (L) => L.job === "illustrator" && L.flags.bigWin },
    { id: "magicStar", name: "きちゅう一のマジシャン", desc: "モフを消して、ちゃんと戻した。", test: (L) => L.job === "magician" && L.flags.bigWin },
    { id: "comedyStar", name: "きちゅう一のお笑いスター", desc: "決めゼリフは、いまも流行っている。", test: (L) => L.job === "comedian" && L.flags.bigWin },
    { id: "teacher", name: "みんなの先生", desc: "保育園の子どもたちは、おとなになっても会いに来る。", test: (L) => L.job === "nursery" && L.flags.bigWin },
    { id: "business", name: "伝説のビジネスモンスター", desc: "社長賞のトロフィーが光っている。", test: (L) => L.job === "city" && L.flags.bigWin },
    { id: "tomato", name: "きちゅう一のトマト農家", desc: "そのトマトは、国の名物になった。", test: (L) => L.job === "farmer" && L.flags.bigWin },
    { id: "park", name: "公園をつくったモンスター", desc: "町の公園には、名前がきざまれている。", test: (L) => L.job === "office" && L.flags.bigWin },
    { id: "festival", name: "伝説のお祭り委員長", desc: "あのお祭りは、町の歴史に残った。", test: (L) => (L.job === "home" || L.job === "newcomer") && L.flags.bigWin },
    { id: "centenarian", name: "100さいの長老", desc: "100回のろうそくを吹き消した。", test: (L) => L.deathAge >= 100 },
    { id: "tycoon", name: "大富豪", desc: "おかねメーターが、ほぼ満タン。", test: (L) => L.money >= 90 },
    { id: "firstLove", name: "初恋をつらぬいたモンスター", desc: "18さいの告白から、ずっと一緒。", test: (L) => L.flags.firstLove },
    { id: "rockstar", name: "遅咲きのロックスター", desc: "代表曲は「腰がいたい」。", test: (L) => L.flags.bandHit },
    { id: "novelist", name: "遅咲きの小説家", desc: "主人公のモデルは、もちろん自分。", test: (L) => L.flags.novel },
    { id: "runner", name: "70さいのランナー", desc: "42.195kmを走りきった。", test: (L) => L.flags.runner },
    { id: "pumpkin", name: "カボチャ名人", desc: "300kgのカボチャを育てた。", test: (L) => L.flags.pumpkin },
    { id: "mofuFriend", name: "モフの親友", desc: "モフは今日もとなりで寝ている。", test: (L) => L.pet },
    { id: "stormy", name: "波乱万丈", desc: "つらいことを、何度も乗りこえた。", test: (L) => L.badCount >= 15 },
    { id: "happiest", name: "しあわせの達人", desc: "しあわせメーターが、ほぼ満タン。", test: (L) => L.happy >= 85 },
    { id: "traveler", name: "旅するモンスター", desc: "見た景色の数なら負けない。", test: (L) => L.flags.wander || L.flags.worldTrip },
    { id: "scholar", name: "物知り博士", desc: "まなびメーターが、ほぼ満タン。", test: (L) => L.learn >= 85 },
    { id: "sprinter", name: "かけぬけたモンスター", desc: "短くても、まっすぐな一生だった。", test: (L) => L.deathAge < 30 },
    { id: "ordinary", name: "ふつうがいちばん", desc: "おだやかな日々こそ、たからもの。", test: () => true },
  ],
};

// ---------- シナリオで使う小さな計算 ----------
function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}
function advanceChance(L, c) {
  const f = KichuSim.familyOf(L.family);
  return clamp(c.advanceRate + f.advanceAdj + (L.school ? 0 : -0.25), 0.03, 0.98);
}
function netChance(L, c) {
  const f = KichuSim.familyOf(L.family);
  return clamp(c.netRate + f.schoolAdj, 0.05, 0.99);
}
function moveChance(L) {
  return clamp(0.06 + L.learn / 250 + (L.money - 30) / 400, 0.03, 0.6);
}

// 35さいの「人生最大のチャンス」は、仕事によって中身が変わる
function bigChance(L) {
  const hit = L.flags.hit ? 0.2 : 0;
  const table = {
    chef: { prompt: "きちゅう料理グランプリにさそわれた！", go: "出場する", p: 0.3 + hit, win: "優勝！「きちゅう焼き」が国の名物になった", lose: "決勝で鍋をひっくり返した…" },
    streamer: { prompt: "月面から生配信しないかと言われた！", go: "月へ行く", p: 0.3 + hit, win: "月面配信が伝説に。同時視聴500万匹！", lose: "月で電波が届かず、真っ暗な画面が3時間流れた" },
    programmer: { prompt: "自分のアプリで会社をつくるチャンス！", go: "起業する", p: 0.35, win: "アプリ「きちゅうナビ」が大ヒット！", lose: "アプリは完成したが、使ったのは自分だけだった" },
    researcher: { prompt: "新種の生き物をさがす大調査にさそわれた！", go: "調査に行く", p: 0.4, win: `新種を発見し「${L.name}ムシ」と名づけた！`, lose: "見つけたのは、ただの石だった" },
    athlete: { prompt: "きちゅうカップの決勝戦に出られることになった！", go: "出場する", p: 0.35 + hit, win: "決勝ゴールを決めて、きちゅうのヒーローになった！", lose: "決勝で、自分のゴールにシュートしてしまった…" },
    explorer: { prompt: "きちゅうの裏側にある大洞くつのうわさを聞いた！", go: "探検に行く", p: 0.4, win: "洞くつの奥で、古代モンスターの遺跡を見つけた！", lose: "洞くつで3日間迷子になり、救助された" },
    inventor: { prompt: "空飛ぶ自転車が完成しそうだ！", go: "発表会に出す", p: 0.3, win: "空飛ぶ自転車が本当に飛んだ！ 注文が殺到", lose: "発表会で自転車が爆発した（けが人なし）" },
    vet: { prompt: "伝説の巨大モフが病気だという知らせが！", go: "助けに行く", p: 0.5, win: "巨大モフを治した！ お礼に背中に乗せてもらった", lose: "かけつけたら、巨大モフは自力で治っていた" },
    postman: { prompt: "嵐の夜、月まで緊急の手紙を届けてほしいとたのまれた！", go: "引き受ける", p: 0.5, win: "嵐をこえて手紙を届けた！ 宇宙郵便の英雄に", lose: "途中で迷子になり、手紙は1週間遅れて届いた" },
    illustrator: { prompt: "きちゅう美術館で個展を開くチャンス！", go: "個展を開く", p: 0.3 + hit, win: "個展に長い行列ができ、絵が美術館にかざられた！", lose: "個展の日は大雨。お客さんは2匹だった" },
    magician: { prompt: "きちゅう最大のステージで、マジックショーをやらないかと言われた！", go: "ステージに立つ", p: 0.3 + hit, win: "モフを消すマジックで大喝采！（モフはちゃんと戻った）", lose: "ハトを出すはずが、出てきたのは自分の靴下だった" },
    comedian: { prompt: "きちゅうお笑いグランプリの決勝に進んだ！", go: "決勝に出る", p: 0.3 + hit, win: "優勝！ 決めゼリフが流行語になった", lose: "ネタを全部忘れて、5分間だまって立っていた" },
    nursery: { prompt: "町に新しい保育園をつくる話がきた！", go: "園長になる", p: 0.45, win: "子どもたちの笑い声があふれる保育園ができた！", lose: "おかねが集まらず、計画は止まってしまった" },
    city: { prompt: "会社の大きなプロジェクトのリーダーにえらばれた！", go: "引き受ける", p: 0.4, win: "プロジェクトは大成功！ 社長賞をもらった", lose: "プロジェクトは失敗…でも、いい経験になった" },
    farmer: { prompt: "「きちゅう一のトマト」を決める大会に出られることになった！", go: "出場する", p: 0.35, win: "きちゅう一のトマトに選ばれた！", lose: "大会の前の日に、トマトをモフに食べられた" },
    office: { prompt: "町の新しい公園づくりをまかされた！", go: "引き受ける", p: 0.45, win: "町じゅうのモンスターが集まる公園ができた！", lose: "工事中に温泉がわいて、公園は温泉になった" },
  };
  return table[L.job] || { prompt: "町のお祭りの実行委員長をたのまれた！", go: "引き受ける", p: 0.45, win: "町の歴史に残る、最高のお祭りになった！", lose: "当日、大雨でお祭りが中止になった…" };
}
