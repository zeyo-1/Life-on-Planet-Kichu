// ============================================================
//  モンスターの一生のシナリオ
//  選択・仕事・できごと・称号（エンディング）をここに書いています。
//  新しいできごとや選択肢を足すと、ゲームにそのまま出てきます。
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
  },

  // ---------- 13さいで決まる「特技」 ----------
  skills: {
    cook: "料理",
    music: "歌とダンス",
    code: "プログラミング",
    animal: "動物と話せる",
  },

  // ---------- 仕事 ----------
  // money / happy : 毎年すこしずつ増える量
  // hat           : キャラクターの帽子や小物
  jobs: {
    home: { name: "ふるさとの働き者", money: 0.25, happy: 0.15, hat: "bandana" },
    newcomer: { name: "ユタカ国の新しい住人", money: 0.5, happy: 0, hat: "none" },
    chef: { name: "屋台の料理人", money: 0.3, happy: 0.2, hat: "chef" },
    streamer: { name: "きちゅうチューバー", money: 0.1, happy: 0.25, hat: "headphones" },
    programmer: { name: "プログラマー", money: 0.6, happy: 0.05, hat: "glasses" },
    vet: { name: "どうぶつのお医者さん", money: 0.5, happy: 0.2, hat: "nurse" },
    researcher: { name: "研究者", money: 0.5, happy: 0.15, hat: "goggles" },
    athlete: { name: "きちゅうボール選手", money: 0.15, happy: 0.25, hat: "headband" },
    explorer: { name: "冒険家", money: -0.05, happy: 0.35, hat: "explorer" },
    inventor: { name: "発明家", money: 0.15, happy: 0.25, hat: "propeller" },
    postman: { name: "宇宙郵便屋さん", money: 0.4, happy: 0.15, hat: "cap" },
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

  // ---------- 選択（10回） ----------
  choices: [
    {
      id: "play",
      age: 7,
      prompt: () => "7さい。いちばん好きな遊びは？",
      options: () => [
        { id: "run", label: "外を走りまわる", sub: "足の速さで勝負" },
        { id: "book", label: "図鑑を読みまくる", sub: "知りたいことだらけ" },
        { id: "make", label: "ガラクタで何かを作る", sub: "家のものが少しずつ消える" },
        { id: "sky", label: "ぼーっと空をながめる", sub: "雲の形を研究中" },
      ],
      apply(L, c, opt, t) {
        L.trait = opt.id;
        if (opt.id === "run") t.good("かけっこで町いちばんになった", { health: 6, happy: 3 });
        if (opt.id === "book") {
          if (L.school) t.good("図鑑を丸ごと暗記して、大人たちをおどろかせた", { learn: 7 });
          else t.good("拾った図鑑を、ボロボロになるまで読んだ", { learn: 5 });
        }
        if (opt.id === "make") t.good("ガラクタでロボットを作った。夜中に勝手に動いた", { learn: 3, happy: 4 });
        if (opt.id === "sky") t.good("雲の形を100種類言えるようになった", { happy: 6 });
      },
    },
    {
      id: "skill",
      age: 13,
      prompt: () => "13さい。ひみつの特訓、何をする？",
      options: (L, c) => [
        { id: "cook", label: "料理", sub: "めざせ、きちゅう一の味" },
        { id: "music", label: "歌とダンス", sub: "鏡の前で毎晩" },
        { id: "code", label: "プログラミング", sub: "きちゅうネットで勉強", p: netChance(L, c), pLabel: "ネットが使える確率" },
        { id: "animal", label: "動物と話す練習", sub: "まずは近所の鳥から" },
      ],
      apply(L, c, opt, t) {
        L.skill = opt.id;
        if (opt.id === "cook") t.good("目玉焼きを片手で割れるようになった", { happy: 4 });
        if (opt.id === "music") t.good("毎晩おどっていたら、家族まで一緒におどりだした", { happy: 6 });
        if (opt.id === "animal") t.good("近所の鳥と、たぶん会話できるようになった", { happy: 5 });
        if (opt.id === "code") {
          if (t.roll("ネットが使える", opt.p)) t.good("はじめて作ったゲームが、友だちに大ウケした", { learn: 7, happy: 3 });
          else t.bad("村にネットがなく、木の枝で地面にプログラムを書いた", { learn: 3 }, "自分では選べないできごと");
        }
      },
    },
    {
      id: "path",
      age: 15,
      prompt: () => "15さい。これからどうする？",
      options: (L, c) => [
        { id: "study", label: "進学する", sub: "もっと勉強したい", p: advanceChance(L, c), pLabel: "進学できる確率" },
        { id: "work", label: "働きはじめる", sub: "家族を助けたい" },
        { id: "wander", label: "ひとり旅に出る", sub: "自分さがしの旅", p: 0.4, pLabel: "すごいものに出会う確率" },
      ],
      apply(L, c, opt, t) {
        if (opt.id === "study") {
          if (t.roll("進学できる", opt.p)) {
            L.advanced = true;
            t.good("進学できた！ 勉強の毎日がはじまった", { learn: 15, happy: 5, money: -4 });
          } else {
            t.bad("進学したかったが、学費が足りず働くことになった", { money: 6, happy: -8 });
          }
        }
        if (opt.id === "work") t.info("家族を助けるため、働きはじめた", { money: 12 });
        if (opt.id === "wander") {
          L.flags.wander = true;
          if (t.roll("すごいものに出会う", opt.p)) t.great("きちゅうの北のはてで、虹色のオーロラを見た！", { happy: 12, learn: 4, money: -4 });
          else t.good("道に迷って3日間さまよった。いい思い出になった", { happy: 6, learn: 3, money: -4 });
        }
      },
    },
    {
      id: "love",
      age: 18,
      prompt: () => "18さい。気になるあの子がいる…どうする？",
      options: (L) => {
        let special;
        if (L.skill === "music") special = { id: "song", label: "歌で気持ちを伝える", sub: "ひと晩で1曲つくった", p: 0.5 };
        else if (L.skill === "cook") special = { id: "bento", label: "手作り弁当をわたす", sub: "胃袋をつかむ作戦", p: 0.55 };
        else special = { id: "letter", label: "手紙を書く", sub: "3日かけて書いた", p: clamp(0.25 + L.learn / 300, 0.1, 0.7) };
        special.pLabel = "気持ちが伝わる確率";
        return [
          { id: "confess", label: "正面から告白する", sub: "当たってくだけろ", p: clamp(0.3 + (L.happy - 50) / 200, 0.1, 0.75), pLabel: "OKをもらえる確率" },
          special,
          { id: "watch", label: "そっと見守る", sub: "今はまだ…" },
        ];
      },
      apply(L, c, opt, t) {
        const texts = {
          confess: ["まさかのOK！ 2匹で夕日を見た", "「友だちでいよう」と言われた。その夜は枕をぬらした"],
          song: ["歌が届いた！ なぜか周りから拍手まで起きた", "歌は届かなかったが、通りすがりのモンスターたちが泣いていた"],
          bento: ["お弁当は完食。「毎日食べたい」と言われた！", "お弁当は好評だったが、気持ちは伝わっていなかった"],
          letter: ["手紙の返事は「わたしも」だった！", "手紙は書いたが、渡せないまま引き出しの奥へ…"],
        };
        if (opt.id === "watch") {
          L.love = "friend";
          t.info("見守っているうちに、いちばんの友だちになった", { happy: 3 });
          return;
        }
        if (t.roll("気持ちが伝わる", opt.p)) {
          L.love = "yes";
          t.great(texts[opt.id][0], { happy: 12 });
        } else {
          L.love = "no";
          t.bad(texts[opt.id][1], { happy: -6 });
        }
      },
    },
    {
      id: "job",
      age: 22,
      prompt: () => "22さい。どんな仕事をする？",
      options: (L, c) => {
        const list = [{ id: "home", label: "ふるさとで働く", sub: "家族の近くがいちばん" }];
        const bySkill = {
          cook: { id: "chef", label: "屋台を開く", sub: "看板メニューで勝負", p: 0.5, pLabel: "お客さんが来る確率" },
          music: { id: "streamer", label: "きちゅうチューバーになる", sub: "めざせ登録者100万", p: 0.2, pLabel: "いきなり人気が出る確率" },
          code: { id: "programmer", label: "プログラマーになる", sub: "大きな会社をめざす", p: clamp(0.3 + L.learn / 200, 0.1, 0.9), pLabel: "大きな会社に入れる確率" },
          animal: { id: "vet", label: "どうぶつのお医者さんをめざす", sub: "試験はむずかしい", p: clamp(0.2 + L.learn / 150, 0.1, 0.9), pLabel: "試験に受かる確率" },
        };
        const byTrait = {
          run: { id: "athlete", label: "きちゅうボール選手をめざす", sub: "プロの世界はきびしい", p: clamp(0.15 + L.health / 300, 0.1, 0.6), pLabel: "プロになれる確率" },
          book: { id: "researcher", label: "研究者になる", sub: "なぞを解き明かしたい", p: clamp(L.learn / 110, 0.05, 0.9), pLabel: "研究所に入れる確率" },
          make: { id: "inventor", label: "発明家になる", sub: "まだだれも見たことのないものを" },
          sky: { id: "explorer", label: "冒険家になる", sub: "地図はいらない" },
        };
        if (bySkill[L.skill]) list.push(bySkill[L.skill]);
        if (byTrait[L.trait]) list.push(byTrait[L.trait]);
        if (L.country !== "yutaka") list.push({ id: "move", label: "ユタカ国への移住に挑戦", sub: "新しい国で暮らしたい", p: moveChance(L), pLabel: "移住できる確率" });
        else list.push({ id: "postman", label: "宇宙郵便屋さんになる", sub: "2つの月まで配達" });
        return list;
      },
      apply(L, c, opt, t) {
        const id = opt.id;
        if (id === "home") {
          L.job = "home";
          t.info("ふるさとで働きはじめた", { money: 6, happy: 6 });
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
          } else {
            L.job = "home";
            t.bad("試験に落ちた…まずはふるさとの牧場で働くことに", { happy: -5 });
          }
        } else if (id === "athlete") {
          if (t.roll("プロになれる", opt.p)) {
            L.job = "athlete";
            L.flags.hit = true;
            t.great("プロ入り決定！ 背番号は1", { money: 10, happy: 10 });
          } else {
            L.job = "home";
            t.bad("プロテストに落ちた。町のチームで楽しむことにした", { happy: -4 });
          }
        } else if (id === "researcher") {
          if (t.roll("研究所に入れる", opt.p)) {
            L.job = "researcher";
            t.good("研究所に入れた！ 白衣がよく似合う", { learn: 6, money: 6 });
          } else {
            L.job = "home";
            t.bad("研究所の試験に落ちた…ふるさとで働きながら独学することに", { happy: -5 });
          }
        } else if (id === "inventor") {
          L.job = "inventor";
          t.good("ガレージで発明家としてデビューした", { happy: 6 });
        } else if (id === "explorer") {
          L.job = "explorer";
          t.good("地図を持たずに旅立った", { happy: 8, money: -3 });
        } else if (id === "move") {
          if (t.roll("移住できる", opt.p)) {
            L.country = "yutaka";
            L.migrated = true;
            L.job = "newcomer";
            t.good("ユタカ国に移り住んだ！ 新しい国での暮らしがはじまる", { money: 10, happy: -3 });
          } else {
            L.job = "home";
            t.bad("移住の許可がおりず、ふるさとに残った", { happy: -6 });
          }
        } else if (id === "postman") {
          L.job = "postman";
          t.good("宇宙郵便屋さんになった。毎日が月への出張", { money: 5, happy: 6 });
        }
      },
    },
    {
      id: "life",
      age: 28,
      prompt: () => "28さい。これからの暮らしは？",
      options: (L) => [
        L.love === "yes"
          ? { id: "partner", label: "あの子と家族になる", sub: "18さいからの縁" }
          : { id: "partner", label: "パートナーと家族になる", sub: "にぎやかな毎日" },
        { id: "solo", label: "気ままにひとり暮らし", sub: "自由がいちばん" },
        { id: "pet", label: "なぞの生き物「モフ」を飼う", sub: "1日20時間ねるらしい" },
      ],
      apply(L, c, opt, t) {
        if (opt.id === "partner") {
          L.partner = true;
          if (L.love === "yes") {
            L.flags.firstLove = true;
            t.great("18さいのときのあの子と、家族になった！", { happy: 14 });
          } else t.good("パートナーと一緒に暮らしはじめた", { happy: 10 });
        }
        if (opt.id === "solo") t.info("ひとりの暮らしを楽しむことにした", { happy: 6, money: 6 });
        if (opt.id === "pet") {
          L.pet = true;
          t.good("モフがやってきた。さっそく寝ている", { happy: 9 });
        }
      },
    },
    {
      id: "chance",
      age: 35,
      prompt: (L) => "35さい。" + bigChance(L).prompt,
      options: (L) => [
        { id: "go", label: bigChance(L).go, sub: "大成功か、大失敗か", p: bigChance(L).p, pLabel: "成功する確率" },
        { id: "stay", label: "今のままでいい", sub: "安定がいちばん" },
      ],
      apply(L, c, opt, t) {
        if (opt.id === "stay") {
          t.info("今の暮らしを大切にすることにした", { happy: 2 });
          return;
        }
        const ch = bigChance(L);
        if (t.roll("成功する", opt.p)) {
          L.flags.bigWin = true;
          t.great(ch.win, { money: 20, happy: 12 });
        } else {
          t.bad(ch.lose, { money: -10, happy: -6 });
        }
      },
    },
    {
      id: "checkup",
      age: 40,
      prompt: () => "40さい。健康診断を受ける？",
      options: (L, c) => [
        { id: "yes", label: `受ける（おかね −${c.checkupCost}）`, sub: "病気は早く見つけたい", p: c.clinicRate, pLabel: "近くに病院がある確率" },
        { id: "no", label: "受けない", sub: "おかねを節約" },
      ],
      apply(L, c, opt, t) {
        if (opt.id === "no") {
          t.info("健康診断は受けなかった");
          return;
        }
        if (t.roll("近くに病院がある", opt.p)) {
          L.checkup = true;
          t.good("健康診断で病気を早く見つけ、治療できた", { money: -c.checkupCost, health: 8 });
        } else {
          t.bad("近くに病院がなく、健康診断を受けられなかった", {}, "自分では選べないできごと");
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
      ],
      apply(L, c, opt, t) {
        if (opt.id === "teach") t.good("教え子に「先生みたいになりたい」と言われた", { learn: 4, happy: 8 });
        if (opt.id === "rest") t.good("昼寝の世界チャンピオンを名のりはじめた", { health: 5, happy: 4 });
        if (opt.id === "trip") {
          if (t.roll("おかねが足りる", opt.p)) {
            L.flags.worldTrip = true;
            t.great("2つの月が両方見える丘で、星を見ながらラーメンを食べた", { happy: 14, money: -15 });
          } else t.info("おかねが足りず、となり町まで行って帰ってきた", { happy: 3, money: -3 });
        }
        if (opt.id === "band") {
          if (t.roll("ヒットする", opt.p)) {
            L.flags.bandHit = true;
            t.great("まさかのヒット曲が生まれた！ 曲名は「腰がいたい」", { happy: 12, money: 10 });
          } else t.good("お客さんは3匹だったが、最高に楽しかった", { happy: 7 });
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
      ],
      apply(L, c, opt, t) {
        if (opt.id === "space") {
          if (t.roll("宇宙に行ける", opt.p)) {
            L.flags.space = true;
            t.great("きちゅうを宇宙から見た。まるくて、きれいだった", { happy: 15 });
          } else t.bad("抽選にはずれた。かわりに宇宙の図鑑を買った", { happy: -2 });
        }
        if (opt.id === "book") t.good(`自伝『${L.name}の一生』が、町の図書館に置かれた`, { happy: 8 });
        if (opt.id === "family") t.good(L.partner || L.kids > 0 ? "家族と毎日わらってすごした" : "昔からの友だちと、毎日昔話をした", { happy: 10 });
        if (opt.id === "pumpkin") {
          if (t.roll("町いちばんになる", opt.p)) {
            L.flags.pumpkin = true;
            t.great("重さ300kgのカボチャで町いちばんになった！", { happy: 12 });
          } else t.info("カボチャはふつうの大きさだったが、おいしかった", { happy: 4 });
        }
      },
    },
  ],

  // ---------- 毎年おこるかもしれない できごと ----------
  // ages : おこる年れいの範囲 [から, まで]
  // rate : 1年のうちに おこる確率（数字、または L と国から計算する関数）
  // when : おこるための条件（なければ いつでも）
  // max  : 一生のうちに おこる最大の回数
  // kind : "great"（大成功）, "good"（うれしい）, "bad"（つらい）
  events: [
    // --- きびしい現実 ---
    { id: "sick", ages: [1, 120], kind: "bad", rate: (L, c) => c.sickRate * (L.age < 5 ? 1.6 : L.age >= 60 ? 1.5 : 1), text: (L) => (L.age < 5 ? "高い熱が続く病気にかかった" : "重い病気にかかった"), effect: { health: -12, happy: -4 } },
    { id: "injury", ages: [5, 60], kind: "bad", rate: 0.02, text: "大きなけがをして、しばらく動けなかった", effect: { health: -6, happy: -2 } },
    { id: "disaster", ages: [1, 120], kind: "bad", rate: (L, c) => c.disaster.rate, text: (L, c) => c.disaster.text, effect: { money: -14, health: -5, happy: -6 } },
    { id: "childWork", ages: [7, 14], kind: "bad", max: 2, rate: 0.15, when: (L) => L.family === "kibishii" || !L.school, text: "家計を助けるため、朝から晩まで働いた", effect: { money: 4, learn: -3, health: -2 } },
    { id: "jobLoss", ages: [23, 64], kind: "bad", rate: (L, c) => c.jobLossRate, text: "働いていた会社がなくなってしまった", effect: { money: -14, happy: -8 } },
    { id: "back", ages: [50, 120], kind: "bad", rate: 0.04, text: "腰をいためてしまった", effect: { health: -6, happy: -2 } },

    // --- 子ども・学生のころ ---
    { id: "friend", ages: [4, 20], kind: "good", rate: 0.07, max: 2, text: "なんでも話せる親友ができた", effect: { happy: 8 } },
    { id: "base", ages: [6, 12], kind: "good", rate: 0.05, max: 1, text: "友だちと森に秘密基地を作った", effect: { happy: 6 } },
    { id: "pudding", ages: [7, 14], kind: "good", rate: 0.05, max: 1, when: (L) => L.school, text: "給食のプリンをかけたじゃんけんで10連勝した", effect: { happy: 5 } },
    { id: "zero", ages: [8, 17], kind: "bad", rate: 0.03, max: 1, when: (L) => L.school, text: "テストで0点をとった。名前を書き忘れていた", effect: { happy: -3, learn: 2 } },
    { id: "relay", ages: [9, 18], kind: "good", max: 1, rate: (L) => (L.trait === "run" ? 0.12 : 0.03), when: (L) => L.school, text: "リレーのアンカーで3匹ぬきした！", effect: { happy: 7, health: 3 } },
    { id: "play", ages: [12, 18], kind: "good", rate: 0.05, max: 1, when: (L) => L.school, text: "文化祭の劇で、木の役なのに主役より目立った", effect: { happy: 6 } },
    { id: "bookLove", ages: [7, 25], kind: "good", max: 1, rate: (L) => (L.trait === "book" ? 0.1 : 0.03), text: "図書館の本を、ぜんぶ読みおわった", effect: { learn: 10, happy: 3 } },

    // --- きちゅうならではの不思議 ---
    { id: "doubleMoon", ages: [5, 110], kind: "great", rate: 0.008, max: 1, text: "2つの月が重なる「ダブルムーン」を見た。願いごとをした", effect: { happy: 8 } },
    { id: "meteor", ages: [10, 90], kind: "great", rate: 0.005, max: 1, text: "道で拾った石が、なんと隕石だった！", effect: { money: 18, happy: 5 } },
    { id: "alien", ages: [15, 95], kind: "good", rate: 0.006, max: 1, text: "となりの星から来た旅行者に、道を聞かれた", effect: { happy: 5 } },
    { id: "net", ages: [10, 60], kind: "good", max: 1, rate: (L, c) => c.netRate * 0.03, text: "住んでいる町に「きちゅうネット」がつながった", effect: { learn: 6, happy: 3 } },
    { id: "flame", ages: [15, 50], kind: "bad", max: 1, rate: 0.03, when: (L) => L.skill === "code" || L.job === "streamer", text: "きちゅうネットで炎上した…しばらくスマホを封印", effect: { happy: -8 } },

    // --- 仕事ごとのできごと ---
    { id: "chefBuzz", ages: [23, 70], kind: "good", max: 2, rate: 0.05, when: (L) => L.job === "chef", text: "新メニュー「きちゅう焼き」に行列ができた", effect: { money: 10, happy: 4 } },
    { id: "streamBuzz", ages: [23, 60], kind: "good", max: 2, rate: 0.06, when: (L) => L.job === "streamer", text: "動画「モフの寝顔 10時間」が100万回再生された", effect: { money: 12, happy: 5 } },
    { id: "bug", ages: [23, 64], kind: "bad", max: 2, rate: 0.06, when: (L) => L.job === "programmer", text: "バグを直すため、3日間徹夜した", effect: { health: -5, happy: -3 } },
    { id: "appHit", ages: [23, 64], kind: "great", max: 1, rate: 0.03, when: (L) => L.job === "programmer", text: "作ったアプリが、きちゅう中で使われた！", effect: { money: 15, happy: 6 } },
    { id: "paper", ages: [23, 70], kind: "good", max: 2, rate: 0.05, when: (L) => L.job === "researcher", text: "論文が「きちゅう科学」の表紙をかざった", effect: { learn: 8, money: 5 } },
    { id: "island", ages: [23, 70], kind: "good", max: 2, rate: 0.06, when: (L) => L.job === "explorer", text: "地図にのっていない島を見つけた", effect: { happy: 8 } },
    { id: "goal", ages: [23, 40], kind: "good", max: 2, rate: 0.06, when: (L) => L.job === "athlete", text: "試合で決勝ゴールを決めた！", effect: { happy: 8, money: 6 } },
    { id: "invent", ages: [23, 80], kind: "good", max: 2, rate: 0.05, when: (L) => L.job === "inventor", text: "自動でネギを切るマシンを発明した（売れなかった）", effect: { happy: 4, money: -3 } },
    { id: "vetSave", ages: [23, 70], kind: "good", max: 2, rate: 0.06, when: (L) => L.job === "vet", text: "けがをした鳥を治して、空へ返した", effect: { happy: 6 } },
    { id: "mail", ages: [23, 64], kind: "good", max: 1, rate: 0.05, when: (L) => L.job === "postman", text: "月面の小さな村に、はじめて手紙を届けた", effect: { happy: 6, money: 4 } },
    { id: "festival", ages: [23, 80], kind: "good", max: 2, rate: 0.04, when: (L) => L.job === "home", text: "村祭りでおどりを披露し、大ウケした", effect: { happy: 6 } },
    { id: "promotion", ages: [23, 64], kind: "good", rate: (L) => 0.025 + L.learn / 1200, text: "仕事が認められて、給料が上がった", effect: { money: 14, happy: 4 } },

    // --- おとなになってから ---
    { id: "travel", ages: [18, 80], kind: "good", rate: (L) => 0.005 + L.money / 1000, text: "きちゅうの反対側まで旅をした", effect: { happy: 10, money: -4 } },
    { id: "lottery", ages: [18, 120], kind: "great", max: 1, rate: 0.005, text: "くじで大当たり！", effect: { money: 20, happy: 6 } },
    { id: "baby", ages: [29, 42], kind: "good", max: 3, rate: 0.18, when: (L) => L.partner, text: "子どもがタマゴからかえった！", effect: { happy: 10, money: -5 } },
    { id: "mofu", ages: [29, 95], kind: "good", max: 2, rate: 0.08, when: (L) => L.pet, text: "モフが「おすわり」を覚えた（3年かかった）", effect: { happy: 5 } },
    { id: "grandchild", ages: [52, 95], kind: "good", max: 1, rate: 0.1, when: (L) => L.kids > 0, text: "孫がタマゴからかえった！", effect: { happy: 10 } },
    { id: "gameLoss", ages: [60, 95], kind: "good", max: 1, rate: 0.05, when: (L) => L.kids > 0, text: "孫にゲームで完敗した。くやしいけど楽しい", effect: { happy: 5 } },
    { id: "diary", ages: [50, 95], kind: "good", max: 1, rate: 0.03, text: "若いころの日記が見つかり、ひとりで赤面した", effect: { happy: 3 } },
    { id: "hobby", ages: [55, 120], kind: "good", max: 1, rate: 0.04, text: "畑づくりという楽しい趣味を見つけた", effect: { happy: 6, health: 3 } },
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
    { id: "festival", name: "伝説のお祭り委員長", desc: "あのお祭りは、町の歴史に残った。", test: (L) => (L.job === "home" || L.job === "newcomer") && L.flags.bigWin },
    { id: "centenarian", name: "100さいの長老", desc: "100回のろうそくを吹き消した。", test: (L) => L.deathAge >= 100 },
    { id: "tycoon", name: "大富豪", desc: "おかねメーターが、ほぼ満タン。", test: (L) => L.money >= 90 },
    { id: "firstLove", name: "初恋をつらぬいたモンスター", desc: "18さいの告白から、ずっと一緒。", test: (L) => L.flags.firstLove },
    { id: "rockstar", name: "遅咲きのロックスター", desc: "代表曲は「腰がいたい」。", test: (L) => L.flags.bandHit },
    { id: "pumpkin", name: "カボチャ名人", desc: "300kgのカボチャを育てた。", test: (L) => L.flags.pumpkin },
    { id: "mofuFriend", name: "モフの親友", desc: "モフは今日もとなりで寝ている。", test: (L) => L.pet },
    { id: "stormy", name: "波乱万丈", desc: "つらいことを、何度も乗りこえた。", test: (L) => L.badCount >= 12 },
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
  };
  return table[L.job] || { prompt: "町のお祭りの実行委員長をたのまれた！", go: "引き受ける", p: 0.45, win: "町の歴史に残る、最高のお祭りになった！", lose: "当日、大雨でお祭りが中止になった…" };
}
