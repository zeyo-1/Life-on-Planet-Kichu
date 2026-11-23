// ============================================================
//  シミュレーションの本体
//  画面のことは何も知らず、「1年すすめる」「選ぶ」だけを計算します。
//  data.js の KICHU を読んで動きます。
// ============================================================

const KichuSim = (() => {
  const STATS = ["health", "learn", "money", "happy"];
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  // ---------- 疑似乱数 ----------
  // コンピュータの乱数は「計算」で作られています（mulberry32 という方法）。
  // 同じ seed（人生番号）から始めると、まったく同じ乱数が同じ順番で出てきます。
  function makeRandom(seed) {
    let a = seed >>> 0;
    return function random() {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296; // 0以上1未満
    };
  }

  const countryMap = new Map(KICHU.countries.map((c) => [c.id, c]));
  const familyMap = new Map(KICHU.families.map((f) => [f.id, f]));
  const countryOf = (id) => countryMap.get(id);
  const familyOf = (id) => familyMap.get(id);

  // 重みつき抽選：0〜1 の乱数 r が、どの区間に入ったかを返す
  function pickWeighted(weights, r) {
    const total = weights.reduce((a, b) => a + b, 0);
    let x = r * total;
    for (let i = 0; i < weights.length; i++) {
      if (x < weights[i]) return i;
      x -= weights[i];
    }
    return weights.length - 1;
  }

  function addEffect(life, effect) {
    for (const key of STATS) {
      if (effect[key]) life[key] = clamp(life[key] + effect[key], 0, 100);
    }
  }

  // ---------- 誕生 ----------
  function createLife(seed) {
    const random = makeRandom(seed);
    const rCountry = random();
    const ci = pickWeighted(KICHU.countries.map((c) => c.birthShare), rCountry);
    const c = KICHU.countries[ci];
    const rFamily = random();
    const fi = pickWeighted(c.familyOdds, rFamily);
    const f = KICHU.families[fi];

    const life = {
      seed,
      random,
      age: 0,
      alive: true,
      name: KICHU.names[Math.floor(random() * KICHU.names.length)],
      birthCountry: c.id,
      country: c.id,
      family: f.id,
      lottery: { country: { r: rCountry, index: ci }, family: { r: rFamily, index: fi } },
      school: false,
      advanced: false,
      partner: false,
      kids: 0,
      checkup: false,
      migrated: false,
      job: null,
      counts: {},
      history: [],
      pending: null,
      deathAge: null,
      cause: null,
    };
    for (const key of STATS) {
      const wiggle = Math.round((random() - 0.5) * 10); // ±5 のばらつき
      life[key] = clamp(c.start[key] + f.bonus[key] + wiggle, 0, 100);
    }
    life.history.push({
      age: 0,
      kind: "info",
      text: `${c.name}の${f.name}に生まれた。名前は${life.name}。`,
    });
    return life;
  }

  // ---------- その年に亡くなる確率 ----------
  function deathProbability(life) {
    if (life.age >= 120) return 1;
    const m = countryOf(life.country).mortality;
    let p = m.adult + m.aging * Math.exp(0.085 * life.age) * (life.checkup ? 0.8 : 1);
    if (life.age === 0) p += m.infant;
    else if (life.age < 5) p += m.child;
    // けんこう が低いほど 確率が上がる（60 で 1倍）
    const healthEffect = clamp(1 + (60 - life.health) / 80, 0.6, 2);
    return clamp(p * healthEffect, 0, 0.95);
  }

  // ---------- 決まった年れいで おこること ----------
  function stageEvents(life, out) {
    const c = countryOf(life.country);
    const f = familyOf(life.family);
    if (life.age === 6) {
      const p = clamp(c.schoolRate + f.schoolAdj, 0.02, 0.995);
      const r = life.random();
      const roll = { what: "小学校に通える", p, r, hit: r < p };
      if (roll.hit) {
        life.school = true;
        addEffect(life, { learn: 10, happy: 4 });
        log(life, out, "good", "小学校に入学した", roll);
      } else {
        log(life, out, "bad", "学校が遠く、家の手伝いもあって、小学校に通えなかった", roll, "自分では選べないできごと");
      }
    }
    if (life.age === 65) {
      if (life.money < 30) log(life, out, "info", "生活のため、65さいをすぎても働き続けた");
      else log(life, out, "info", "長く続けた仕事を引退した");
    }
    if (life.age === 100) {
      addEffect(life, { happy: 10 });
      log(life, out, "good", "100さいの誕生日をむかえた！");
    }
  }

  // ---------- たまに おこること（1年に1つまで） ----------
  // 0〜1 の数直線に、できごとごとの確率の長さの区間を並べ、
  // 乱数を1つ引いて、どの区間に入ったかで その年のできごとを決める。
  // （どこにも入らなければ「何もない1年」）
  function randomEvent(life, out) {
    if (life.age === 0) return;
    const c = countryOf(life.country);
    const r = life.random();
    let start = 0;
    for (const ev of KICHU.events) {
      if (life.age < ev.ages[0] || life.age > ev.ages[1]) continue;
      if (ev.max && (life.counts[ev.id] || 0) >= ev.max) continue;
      if (ev.when && !ev.when(life)) continue;
      const p = typeof ev.rate === "function" ? ev.rate(life, c) : ev.rate;
      if (r < start + p) {
        const text = typeof ev.text === "function" ? ev.text(life, c) : ev.text;
        life.counts[ev.id] = (life.counts[ev.id] || 0) + 1;
        if (ev.id === "baby") life.kids += 1;
        addEffect(life, ev.effect);
        log(life, out, ev.kind, text, { what: "このできごとがおこる", p, r, from: start, hit: true });
        return;
      }
      start += p;
      if (start >= 1) return;
    }
  }

  // ---------- 選択（選んでも、結果は確率で決まることがある） ----------
  const CHOICES = [
    {
      id: "advance",
      age: 15,
      prompt: () => "15さい。これからどうする？",
      options: (life, c) => [
        { id: "study", label: "もっと勉強したい（進学する）", p: advanceChance(life, c), pLabel: "進学できる確率" },
        { id: "work", label: "働きはじめる" },
      ],
      apply(life, c, opt, out) {
        if (opt.id === "work") {
          life.job = "early";
          addEffect(life, { money: 12 });
          log(life, out, "info", "家族を助けるため、働きはじめた");
          return;
        }
        const roll = rollFor(life, "進学できる", opt.p);
        if (roll.hit) {
          life.advanced = true;
          addEffect(life, { learn: 15, happy: 5, money: -4 });
          log(life, out, "good", "進学できた！ 勉強の毎日がはじまった", roll);
        } else {
          life.job = "early";
          addEffect(life, { money: 6, happy: -8 });
          log(life, out, "bad", "進学したかったが、学費が足りず働くことになった", roll);
        }
      },
    },
    {
      id: "job",
      age: 22,
      prompt: () => "22さい。どこで、どんなふうに働く？",
      options: (life, c) => {
        const list = [
          { id: "home", label: "ふるさとで、家族の近くで働く" },
          { id: "city", label: "都会の会社で働く" },
        ];
        if (life.country !== "yutaka") {
          list.push({ id: "move", label: "ユタカ国への移住に挑戦する", p: moveChance(life), pLabel: "移住できる確率" });
        } else {
          list.push({ id: "startup", label: "自分の会社をつくる", p: startupChance(life), pLabel: "うまくいく確率" });
        }
        return list;
      },
      apply(life, c, opt, out) {
        if (opt.id === "home") {
          life.job = "home";
          addEffect(life, { money: 6, happy: 8 });
          log(life, out, "info", "ふるさとで働きはじめた");
        } else if (opt.id === "city") {
          life.job = "city";
          addEffect(life, { money: Math.round(5 + life.learn / 5), happy: -3 });
          log(life, out, "info", "都会の会社で働きはじめた");
        } else if (opt.id === "move") {
          const roll = rollFor(life, "移住できる", opt.p);
          if (roll.hit) {
            life.country = "yutaka";
            life.migrated = true;
            life.job = "move";
            addEffect(life, { money: 10, happy: -4 });
            log(life, out, "good", "ユタカ国に移り住んだ！ 新しい国での生活がはじまる", roll);
          } else {
            life.job = "home";
            addEffect(life, { happy: -6 });
            log(life, out, "bad", "移住の許可がおりず、ふるさとに残った", roll);
          }
        } else if (opt.id === "startup") {
          const roll = rollFor(life, "会社がうまくいく", opt.p);
          life.job = "startup";
          if (roll.hit) {
            addEffect(life, { money: 25, happy: 8 });
            log(life, out, "good", "つくった会社が大成功した！", roll);
          } else {
            addEffect(life, { money: -15, happy: -6 });
            log(life, out, "bad", "会社はうまくいかず、借金が残った", roll);
          }
        }
      },
    },
    {
      id: "family",
      age: 28,
      prompt: () => "28さい。これからの暮らしは？",
      options: () => [
        { id: "partner", label: "パートナーと家族をつくる" },
        { id: "solo", label: "ひとりの暮らしを楽しむ" },
      ],
      apply(life, c, opt, out) {
        if (opt.id === "partner") {
          life.partner = true;
          addEffect(life, { happy: 10 });
          log(life, out, "good", "パートナーと一緒に暮らしはじめた");
        } else {
          addEffect(life, { happy: 6, money: 6 });
          log(life, out, "info", "ひとりの暮らしを楽しむことにした");
        }
      },
    },
    {
      id: "checkup",
      age: 40,
      prompt: () => "40さい。健康診断を受ける？",
      options: (life, c) => [
        { id: "yes", label: `受ける（おかね −${c.checkupCost}）`, p: c.clinicRate, pLabel: "近くに病院がある確率" },
        { id: "no", label: "受けない（おかねを節約する）" },
      ],
      apply(life, c, opt, out) {
        if (opt.id === "no") {
          log(life, out, "info", "健康診断は受けなかった");
          return;
        }
        const roll = rollFor(life, "近くに病院がある", opt.p);
        if (roll.hit) {
          life.checkup = true;
          addEffect(life, { money: -c.checkupCost, health: 8 });
          log(life, out, "good", "健康診断で病気を早く見つけ、治療できた", roll);
        } else {
          log(life, out, "bad", "近くに病院がなく、健康診断を受けられなかった", roll, "自分では選べないできごと");
        }
      },
    },
  ];

  function advanceChance(life, c) {
    const f = familyOf(life.family);
    return clamp(c.advanceRate + f.advanceAdj + (life.school ? 0 : -0.25), 0.03, 0.98);
  }
  function moveChance(life) {
    return clamp(0.06 + life.learn / 250 + (life.money - 30) / 400, 0.03, 0.6);
  }
  function startupChance(life) {
    return clamp(0.2 + life.learn / 300, 0.05, 0.7);
  }
  function rollFor(life, what, p) {
    const r = life.random();
    return { what, p, r, hit: r < p };
  }

  // ---------- 毎年の小さな変化 ----------
  function yearlyDrift(life) {
    const c = countryOf(life.country);
    const a = life.age;
    if (life.school && a >= 6 && a < 15) life.learn += 2;
    if (life.advanced && a >= 15 && a < 21) life.learn += 2;
    let dh = (life.money - 50) / 200 + (c.clinicRate - 0.6) * 0.3;
    if (a >= 45) dh -= 0.6;
    life.health += dh;
    if (a >= 18 && a < 65) life.money += 0.2 + life.learn / 250 - life.kids * 0.15;
    else if (a >= 65) life.money -= 0.3;
    life.happy += (55 - life.happy) * 0.04;
    for (const key of STATS) life[key] = clamp(life[key], 0, 100);
  }

  function causeOfDeath(life) {
    const r = life.random();
    if (life.age < 5) return "病気";
    if (life.age < 40) return r < 0.5 ? "事故" : "病気";
    if (life.age < 80) return r < 0.15 ? "事故" : "病気";
    return r < 0.6 ? "老衰" : "病気";
  }

  function log(life, out, kind, text, roll, note) {
    const entry = { age: life.age, kind, text, roll: roll || null, note: note || null };
    life.history.push(entry);
    out.logs.push(entry);
  }

  function snapshot(life) {
    return { health: life.health, learn: life.learn, money: life.money, happy: life.happy };
  }

  function endYear(life, out) {
    yearlyDrift(life);
    const p = deathProbability(life);
    const r = life.random();
    out.death = { p, r, hit: r < p };
    if (r < p) {
      life.alive = false;
      life.deathAge = life.age;
      life.cause = causeOfDeath(life);
      const when = life.age === 0 ? "生まれて1年もたたないうちに" : `${life.age}さいで`;
      log(life, out, "death", `${when}、${life.cause}のため、きちゅうでの一生を終えた`, out.death);
      out.dead = true;
    } else {
      life.age += 1;
    }
    out.stats = snapshot(life);
  }

  // ---------- 1年すすめる ----------
  function step(life) {
    if (!life.alive) throw new Error("この人生はもう終わっています");
    if (life.pending) throw new Error("選択がまだです");
    const out = { age: life.age, logs: [], choice: null, death: null, dead: false, stats: null };
    stageEvents(life, out);
    const choice = CHOICES.find((ch) => ch.age === life.age);
    if (choice) {
      const c = countryOf(life.country);
      life.pending = { def: choice, options: choice.options(life, c) };
      out.choice = { id: choice.id, prompt: choice.prompt(life, c), options: life.pending.options };
      out.stats = snapshot(life);
      return out;
    }
    randomEvent(life, out);
    endYear(life, out);
    return out;
  }

  // ---------- 選ぶ ----------
  function choose(life, optionId) {
    const pending = life.pending;
    if (!pending) throw new Error("選ぶものがありません");
    const opt = pending.options.find((o) => o.id === optionId);
    const out = { age: life.age, logs: [], choice: null, death: null, dead: false, stats: null };
    life.pending = null;
    pending.def.apply(life, countryOf(life.country), opt, out);
    endYear(life, out);
    return out;
  }

  // ---------- たくさんの人生を一気に計算する ----------
  function runToEnd(life, pickRandom) {
    while (life.alive) {
      const out = step(life);
      if (out.choice) {
        const opts = out.choice.options;
        choose(life, opts[Math.floor(pickRandom() * opts.length)].id);
      }
    }
    return life;
  }

  // i 番目の人の人生を最後まで計算して、結果だけを返す
  function simulatePerson(seed, i, pickRandom) {
    const life = runToEnd(createLife((seed * 100003 + i * 7919) >>> 0), pickRandom);
    return {
      birth: life.birthCountry,
      family: life.family,
      age: life.deathAge,
      school: life.school,
      migrated: life.migrated,
    };
  }

  function simulateMany(n, seed) {
    const pickRandom = makeRandom(seed + 999);
    const t0 = performance.now();
    const people = [];
    for (let i = 0; i < n; i++) people.push(simulatePerson(seed, i, pickRandom));
    const ms = performance.now() - t0;
    return { people, ms, summary: summarize(people) };
  }

  function summarize(people) {
    const byCountry = KICHU.countries.map((c) => {
      const group = people.filter((p) => p.birth === c.id);
      const n = group.length || 1;
      return {
        id: c.id,
        name: c.name,
        color: c.color,
        count: group.length,
        avgAge: group.reduce((s, p) => s + p.age, 0) / n,
        school: group.filter((p) => p.school).length / n,
        under5: group.filter((p) => p.age < 5).length / n,
        over65: group.filter((p) => p.age >= 65).length / n,
      };
    });
    const bins = new Array(11).fill(0); // 0-9, 10-19, …, 100+
    for (const p of people) bins[Math.min(10, Math.floor(p.age / 10))] += 1;
    const avgAge = people.reduce((s, p) => s + p.age, 0) / people.length;
    return { byCountry, bins, avgAge, total: people.length };
  }

  return {
    makeRandom,
    createLife,
    step,
    choose,
    deathProbability,
    simulatePerson,
    simulateMany,
    summarize,
    countryOf,
    familyOf,
  };
})();
