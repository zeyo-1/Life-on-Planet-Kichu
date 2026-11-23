// ============================================================
//  シミュレーションの本体
//  画面のことは何も知らず、「1年すすめる」「選ぶ」だけを計算します。
//  data.js（数字）と story.js（シナリオ）を読んで動きます。
// ============================================================

const KichuSim = (() => {
  const STATS = ["health", "learn", "money", "happy"];
  const lim = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

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
  const choiceAt = new Map(STORY.choices.map((ch) => [ch.age, ch]));
  const milestoneAt = new Map(STORY.milestones.map((m) => [m.age, m]));
  // 年れいごとに、おこりうるできごとを先に分けておく（計算を速くするため。順番は story.js のまま）
  const eventsAt = Array.from({ length: 121 }, (_, a) => STORY.events.filter((ev) => a >= ev.ages[0] && a <= ev.ages[1]));
  STORY.events.forEach((ev, i) => (ev._i = i)); // できごとの番号（回数を配列で数えるため）
  const N_EVENTS = STORY.events.length;

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

  function addEffect(L, effect) {
    if (!effect) return;
    for (const key of STATS) {
      if (effect[key]) L[key] = lim(L[key] + effect[key], 0, 100);
    }
  }

  // ---------- 誕生（タマゴからかえる） ----------
  function createLife(seed) {
    const random = makeRandom(seed);
    const rCountry = random();
    const ci = pickWeighted(KICHU.countries.map((c) => c.birthShare), rCountry);
    const c = KICHU.countries[ci];
    const rFamily = random();
    const fi = pickWeighted(c.familyOdds, rFamily);
    const f = KICHU.families[fi];
    const species = KICHU.species[Math.floor(random() * KICHU.species.length)];

    const L = {
      seed,
      random,
      age: 0,
      alive: true,
      name: KICHU.names[Math.floor(random() * KICHU.names.length)],
      species: species.id,
      birthCountry: c.id,
      country: c.id,
      family: f.id,
      lottery: { country: { r: rCountry, index: ci }, family: { r: rFamily, index: fi } },
      trait: null,
      skill: null,
      job: null,
      love: null,
      school: false,
      advanced: false,
      partner: false,
      pet: false,
      kids: 0,
      checkup: false,
      migrated: false,
      flags: {},
      evCount: new Uint8Array(N_EVENTS), // できごとがおこった回数
      evLast: new Int16Array(N_EVENTS).fill(-1000), // 最後におこった年れい
      goodCount: 0,
      badCount: 0,
      history: [],
      pending: null,
      deathAge: null,
      cause: null,
      title: null,
    };
    for (const key of STATS) {
      const wiggle = Math.round((random() - 0.5) * 10); // ±5 のばらつき
      L[key] = lim(c.start[key] + f.bonus[key] + wiggle, 0, 100);
    }
    L.peak = snapshot(L); // 一生でいちばん高かった値
    L.history.push({ age: 0, kind: "info", text: `タマゴからかえった！ ${c.name}の${f.name}に生まれた、${species.name}の${L.name}。` });
    return L;
  }

  // ---------- その年に亡くなる確率 ----------
  function deathProbability(L) {
    if (L.age >= 120) return 1;
    const m = countryOf(L.country).mortality;
    let p = m.adult + m.aging * Math.exp(0.085 * L.age) * (L.checkup ? 0.8 : 1);
    if (L.age === 0) p += m.infant;
    else if (L.age < 5) p += m.child;
    // けんこう が低いほど 確率が上がる（60 で 1倍）
    const healthEffect = lim(1 + (60 - L.health) / 80, 0.6, 2);
    return lim(p * healthEffect, 0, 0.95);
  }

  // ---------- story.js から使う道具 ----------
  function tools(L, out) {
    let lastRoll = null;
    const say = (kind) => (text, effect, note) => {
      addEffect(L, effect);
      const entry = { age: L.age, kind, text, roll: lastRoll, note: note || null, effect: effect || null };
      lastRoll = null;
      if (kind === "good" || kind === "great") L.goodCount += 1;
      if (kind === "bad") L.badCount += 1;
      L.history.push(entry);
      out.logs.push(entry);
    };
    return {
      roll(what, p) {
        const r = L.random();
        lastRoll = { what, p, r, hit: r < p };
        return r < p;
      },
      great: say("great"),
      good: say("good"),
      bad: say("bad"),
      info: say("info"),
    };
  }

  // ---------- たまに おこること（1年に1つまで） ----------
  // 0〜1 の数直線に、できごとごとの確率の長さの区間を並べ、
  // 乱数を1つ引いて、どの区間に入ったかで その年のできごとを決める。
  // （どこにも入らなければ「何もない1年」）
  function randomEvent(L, out) {
    if (L.age === 0) return;
    const c = countryOf(L.country);
    const r = L.random();
    let start = 0;
    const count = L.evCount;
    const lastAt = L.evLast;
    for (const ev of eventsAt[Math.min(120, L.age)]) {
      const i = ev._i;
      if (ev.max && count[i] >= ev.max) continue;
      if (ev.cooldown && L.age - lastAt[i] < ev.cooldown) continue;
      if (ev.when && !ev.when(L)) continue;
      const p = typeof ev.rate === "function" ? ev.rate(L, c) : ev.rate;
      if (r < start + p) {
        count[i] += 1;
        lastAt[i] = L.age;
        // 文がいくつか用意されていたら、おこった回数ごとに順番に使う（同じ文がつづかないように）
        let text = typeof ev.text === "function" ? ev.text(L, c) : ev.text;
        if (Array.isArray(text)) text = text[(count[i] - 1) % text.length];
        if (ev.id === "baby") L.kids += 1;
        const t = tools(L, out);
        t[ev.kind](text, ev.effect);
        const entry = out.logs[out.logs.length - 1];
        entry.roll = { what: "このできごとがおこる", p, r, from: start, hit: true };
        entry.eventId = ev.id;
        return;
      }
      start += p;
      if (start >= 1) return;
    }
  }

  // ---------- 毎年の小さな変化 ----------
  function yearlyDrift(L) {
    const c = countryOf(L.country);
    const a = L.age;
    if (L.school && a >= 6 && a < 15) L.learn += 2;
    if (L.advanced && a >= 15 && a < 21) L.learn += 2;
    let dh = (L.money - 50) / 200 + (c.clinicRate - 0.6) * 0.3;
    if (a >= 45) dh -= 0.6;
    L.health += dh;
    const job = L.job ? STORY.jobs[L.job] : null;
    if (a >= 18 && a < 65) {
      L.money += 0.15 + L.learn / 300 - L.kids * 0.15 + (job ? job.money : 0) + (L.flags.hit ? 0.5 : 0);
      if (job) L.happy += job.happy;
    } else if (a >= 65) L.money -= 0.3;
    L.happy += (55 - L.happy) * 0.04;
    for (const key of STATS) L[key] = lim(L[key], 0, 100);
  }

  function causeOfDeath(L) {
    const r = L.random();
    if (L.age < 5) return "病気";
    if (L.age < 40) return r < 0.5 ? "事故" : "病気";
    if (L.age < 80) return r < 0.15 ? "事故" : "病気";
    return r < 0.6 ? "老衰" : "病気";
  }

  function titleOf(L) {
    return STORY.titles.find((tt) => tt.test(L)) || STORY.titles[STORY.titles.length - 1];
  }

  function snapshot(L) {
    return { health: L.health, learn: L.learn, money: L.money, happy: L.happy };
  }

  function endYear(L, out) {
    yearlyDrift(L);
    for (const key of STATS) L.peak[key] = Math.max(L.peak[key], L[key]);
    const p = deathProbability(L);
    const r = L.random();
    out.death = { p, r, hit: r < p };
    if (r < p) {
      L.alive = false;
      L.deathAge = L.age;
      L.cause = causeOfDeath(L);
      L.title = titleOf(L).id;
      const when = L.age === 0 ? "タマゴからかえって1年もたたないうちに" : `${L.age}さいで`;
      const entry = { age: L.age, kind: "death", text: `${when}、${L.cause}のため、きちゅうでの一生を終えた`, roll: out.death };
      L.history.push(entry);
      out.logs.push(entry);
      out.dead = true;
    } else {
      L.age += 1;
    }
    out.stats = snapshot(L);
  }

  const newOut = (L) => ({ age: L.age, logs: [], choice: null, death: null, dead: false, stats: null });

  // ---------- 選択肢をえらぶ ----------
  // たくさんの選択肢の中から、always のものと、乱数で選んだものを合わせて SHOW 個にする
  const SHOW = 4;
  function pickOptions(L, all) {
    const always = all.filter((o) => o.always);
    const rest = all.filter((o) => !o.always);
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(L.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    return always.concat(rest).slice(0, SHOW);
  }

  // ---------- 1年すすめる ----------
  function step(L) {
    if (!L.alive) throw new Error("この人生はもう終わっています");
    if (L.pending) throw new Error("選択がまだです");
    const out = newOut(L);
    const c = countryOf(L.country);
    const ms = milestoneAt.get(L.age);
    if (ms) ms.apply(L, c, tools(L, out));
    const choice = choiceAt.get(L.age);
    if (choice) {
      const all = choice.options(L, c).filter(Boolean);
      const options = pickOptions(L, all);
      L.pending = { def: choice, options };
      out.choice = { id: choice.id, prompt: choice.prompt(L, c), options, total: all.length };
      out.stats = snapshot(L);
      return out;
    }
    if (!ms) randomEvent(L, out);
    endYear(L, out);
    return out;
  }

  // ---------- 選ぶ ----------
  function choose(L, optionId) {
    const pending = L.pending;
    if (!pending) throw new Error("選ぶものがありません");
    const opt = pending.options.find((o) => o.id === optionId);
    const out = newOut(L);
    L.pending = null;
    pending.def.apply(L, countryOf(L.country), opt, tools(L, out));
    endYear(L, out);
    return out;
  }

  // ---------- たくさんの人生を一気に計算する ----------
  function runToEnd(L, pickRandom) {
    while (L.alive) {
      const out = step(L);
      if (out.choice) {
        const opts = out.choice.options;
        choose(L, opts[Math.floor(pickRandom() * opts.length)].id);
      }
    }
    return L;
  }

  // i 番目のモンスターの一生を最後まで計算して、結果だけを返す
  function simulatePerson(seed, i, pickRandom) {
    const L = runToEnd(createLife((seed * 100003 + i * 7919) >>> 0), pickRandom);
    return { birth: L.birthCountry, family: L.family, age: L.deathAge, school: L.school, migrated: L.migrated, title: L.title };
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
    const titles = {};
    for (const p of people) titles[p.title] = (titles[p.title] || 0) + 1;
    const avgAge = people.reduce((s, p) => s + p.age, 0) / people.length;
    return { byCountry, bins, titles, avgAge, total: people.length };
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
    titleById: (id) => STORY.titles.find((tt) => tt.id === id),
  };
})();
