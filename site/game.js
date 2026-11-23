// ============================================================
//  画面の動き
//  sim.js の計算結果を受け取って、画面に表示します。
// ============================================================

(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // 小さな要素づくりの道具
  function h(tag, props = {}, children = []) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === "class") e.className = v;
      else if (k === "text") e.textContent = v;
      else if (k === "style") e.setAttribute("style", v);
      else e.setAttribute(k, v);
    }
    for (const c of [].concat(children)) {
      if (c == null) continue;
      e.append(c instanceof Node ? c : document.createTextNode(c));
    }
    return e;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((res) => setTimeout(res, reduceMotion ? Math.min(ms, 150) : ms));

  // 1年が進む速さ [何もない年, できごとがあった年]（ミリ秒）
  const SPEEDS = { slow: [1100, 2600], normal: [520, 1600], fast: [130, 650] };
  const MANY = { n: 10000, seed: 2026 };
  const STAT_LABELS = { health: "けんこう", learn: "まなび", money: "おかね", happy: "しあわせ" };

  const state = {
    life: null,
    seed: null,
    timer: null,
    paused: false,
    speed: "normal",
    planet: null,
    choices: [],
    prevStats: null,
    many: null,
    manyPromise: null,
    manyListeners: [],
    lines: null,
  };

  const params = new URLSearchParams(location.search);

  // ---------- 数字の見せ方 ----------
  function pct(p) {
    const v = p * 100;
    if (v < 1) return v.toFixed(2) + "%";
    if (v < 10) return v.toFixed(1) + "%";
    return Math.round(v) + "%";
  }
  const fmt = (n) => n.toLocaleString("ja-JP");

  // ---------- 画面の切りかえ ----------
  function show(id) {
    $$(".screen").forEach((s) => (s.hidden = s.id !== id));
    window.scrollTo(0, 0);
  }

  // ---------- 惑星きちゅうと年輪（SVG） ----------
  const NS = "http://www.w3.org/2000/svg";
  const R0 = 82;      // 0さいの年輪の半径
  const STEP = 1.38;  // 1年ごとに広がる幅
  let planetCount = 0;

  function s(tag, attrs = {}) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  }

  function makePlanet(label, extraClass = "") {
    const id = "kp" + ++planetCount;
    const svg = s("svg", { viewBox: "-240 -240 480 480", class: "planet " + extraClass, role: "img", "aria-label": label });
    const defs = s("defs");
    const clip = s("clipPath", { id: id + "c" });
    clip.append(s("circle", { r: 70 }));
    const grad = s("radialGradient", { id: id + "g", cx: "36%", cy: "30%", r: "80%" });
    grad.append(
      s("stop", { offset: "0%", "stop-color": "#52c2ab" }),
      s("stop", { offset: "65%", "stop-color": "#2e9b88" }),
      s("stop", { offset: "100%", "stop-color": "#1b6a5d" })
    );
    defs.append(clip, grad);

    const rings = s("g", { class: "rings" });
    const body = s("g");
    body.append(s("circle", { r: 70, fill: `url(#${id}g)` }));
    const land = s("g", { class: "land", "clip-path": `url(#${id}c)` });
    [
      "M-46,-30 C-30,-52 2,-50 12,-34 C20,-20 6,-6 -10,-10 C-24,-13 -36,-2 -48,-10 C-58,-17 -54,-24 -46,-30 Z",
      "M8,12 C26,0 54,8 56,28 C58,46 36,58 20,50 C8,44 14,34 4,28 C-4,23 -2,17 8,12 Z",
      "M-56,22 C-46,14 -32,22 -34,34 C-36,44 -50,46 -58,38 C-64,32 -62,26 -56,22 Z",
      "M30,-46 C38,-52 50,-46 48,-38 C46,-31 36,-30 31,-35 C27,-39 27,-43 30,-46 Z",
    ].forEach((d) => land.append(s("path", { d })));
    land.append(s("circle", { class: "shade", cx: 34, cy: 30, r: 72 }));
    body.append(land, s("circle", { r: 75, class: "atmo" }));
    svg.append(defs, rings, body);
    return svg;
  }

  // 年輪が広がるにつれて、少しずつ引いて全体を見せる
  function fitView(svg, age) {
    const half = age == null ? 240 : Math.min(240, Math.max(118, R0 + age * STEP + 18));
    svg.setAttribute("viewBox", `${-half} ${-half} ${half * 2} ${half * 2}`);
  }

  function addRing(svg, age, kind, animate) {
    const ring = s("circle", { r: (R0 + age * STEP).toFixed(2), class: `ring ring-${kind}${animate ? " ring-new" : ""}` });
    svg.querySelector(".rings").append(ring);
  }

  function ringKind(out) {
    if (out.logs.some((l) => l.kind === "bad")) return "bad";
    if (out.logs.some((l) => l.kind === "good")) return "good";
    return "none";
  }

  // はじめの画面には、だれかの人生の年輪をうっすら描いておく
  function drawTitleArt() {
    const svg = makePlanet("惑星きちゅうと、ある人の人生の年輪", "demo");
    let life = null;
    for (let seed = 11; seed < 400; seed++) {
      const pick = KichuSim.makeRandom(seed);
      const l = KichuSim.createLife(seed);
      const kinds = [];
      while (l.alive) {
        let out = KichuSim.step(l);
        let kind;
        if (out.choice) {
          const opts = out.choice.options;
          out = KichuSim.choose(l, opts[Math.floor(pick() * opts.length)].id);
          kind = "choice";
        }
        kinds.push(kind || ringKind(out));
      }
      if (l.deathAge >= 78 && l.deathAge <= 92) {
        life = kinds;
        break;
      }
    }
    (life || []).forEach((k, age) => addRing(svg, age, k, false));
    $("#title-art").replaceChildren(svg);
  }

  // ---------- 誕生のくじ ----------
  function buildLottery(box, items) {
    const total = items.reduce((a, b) => a + b.weight, 0);
    const track = h("div", { class: "lot-track" });
    items.forEach((it, i) => {
      const share = it.weight / total;
      const seg = h("div", { class: "lot-seg", style: `flex: ${it.weight} 1 0; background: ${it.color}`, "data-i": i });
      if (share >= 0.12) seg.append(h("b", { text: it.short || it.name }), h("span", { text: pct(share) }));
      else if (share >= 0.07) seg.append(h("span", { text: pct(share) }));
      track.append(seg);
    });
    const needle = h("div", { class: "lot-needle", style: "left: 0%" });
    const scale = h("div", { class: "lot-scale" }, [h("span", { text: "0" }), h("span", { text: "1" })]);
    const legend = h("ul", { class: "lot-legend" });
    items.forEach((it, i) => {
      legend.append(
        h("li", { "data-i": i }, [h("i", { class: "swatch", style: `background: ${it.color}` }), `${it.name} ${pct(it.weight / total)}`])
      );
    });
    box.replaceChildren(track, needle, scale);
    box.after(legend);
    return { needle, track, legend };
  }

  function spinTo(ui, r, index) {
    return new Promise((resolve) => {
      const finish = () => {
        ui.needle.style.left = r * 100 + "%";
        ui.track.querySelectorAll(".lot-seg").forEach((el) => el.classList.toggle("is-dim", Number(el.dataset.i) !== index));
        ui.legend.querySelectorAll("li").forEach((el) => el.classList.toggle("is-dim", Number(el.dataset.i) !== index));
        resolve();
      };
      if (reduceMotion) return finish();
      const duration = 1900;
      const distance = 2 + r; // 2往復ぶん進んでから止まる
      const t0 = performance.now();
      const frame = (now) => {
        const t = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        ui.needle.style.left = ((distance * eased) % 1) * 100 + "%";
        if (t < 1) requestAnimationFrame(frame);
        else finish();
      };
      requestAnimationFrame(frame);
    });
  }

  async function startBirth(seed) {
    clearTimer();
    state.seed = seed;
    state.life = KichuSim.createLife(seed);
    const life = state.life;
    const c = KichuSim.countryOf(life.birthCountry);
    const f = KichuSim.familyOf(life.family);

    show("screen-birth");
    $$(".lot-legend").forEach((el) => el.remove());
    $("#family-step").hidden = true;
    $("#born").hidden = true;
    $("#res-country").textContent = "";
    $("#res-family").textContent = "";

    const countryItems = KICHU.countries.map((k) => ({ name: k.name, weight: k.birthShare, color: k.color }));
    const ui1 = buildLottery($("#lot-country"), countryItems);
    await wait(500);
    if (state.life !== life) return;
    await spinTo(ui1, life.lottery.country.r, life.lottery.country.index);
    if (state.life !== life) return;
    $("#res-country").replaceChildren(`乱数 ${life.lottery.country.r.toFixed(4)} → `, h("b", { text: c.name }));

    await wait(700);
    if (state.life !== life) return;
    $("#family-step").hidden = false;
    $("#family-step").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
    const familyColors = ["#e0b354", "#8fa9c4", "#6f7f9e"];
    const familyShort = ["ゆとり", "ふつう", "きびしい"];
    const familyItems = KICHU.families.map((k, i) => ({ name: k.name, short: familyShort[i], weight: c.familyOdds[i], color: familyColors[i] }));
    const ui2 = buildLottery($("#lot-family"), familyItems);
    await wait(300);
    if (state.life !== life) return;
    await spinTo(ui2, life.lottery.family.r, life.lottery.family.index);
    if (state.life !== life) return;
    $("#res-family").replaceChildren(`乱数 ${life.lottery.family.r.toFixed(4)} → `, h("b", { text: f.name }));

    await wait(600);
    if (state.life !== life) return;
    $("#born-text").textContent = `あなたは、${c.name}の${f.name}に生まれました。名前は「${life.name}」です。`;
    $("#born-tagline").textContent = `${c.name}：${c.tagline}`;
    $("#born").hidden = false;
    $("#born").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
    $("#btn-start").focus({ preventScroll: true });
  }

  // ---------- 人生の進行 ----------
  function clearTimer() {
    if (state.timer) clearTimeout(state.timer);
    state.timer = null;
  }
  function schedule(ms) {
    clearTimer();
    if (state.paused) return;
    state.timer = setTimeout(tick, ms);
  }

  function enterLife() {
    const life = state.life;
    state.choices = [];
    state.prevStats = null;
    state.paused = false;
    updatePauseButton();
    state.planet = makePlanet(`${life.name}さんの人生の年輪`);
    fitView(state.planet, 0);
    $("#orbit-life").replaceChildren(state.planet);
    $("#log").replaceChildren();
    $("#who-name").textContent = `${life.name}さん`;
    renderPlace();
    $("#who-age").textContent = "0";
    renderMeters({ health: life.health, learn: life.learn, money: life.money, happy: life.happy });
    $("#peek-panel").replaceChildren(h("p", { class: "muted", text: "1年ごとに、ここに判定が出ます。" }));
    pushLog($("#log"), life.history[0], true);
    show("screen-life");
    schedule(1000);
  }

  function renderPlace() {
    const life = state.life;
    const c = KichuSim.countryOf(life.country);
    const f = KichuSim.familyOf(life.family);
    $("#who-place").textContent = life.migrated ? `${c.name}で暮らす（${KichuSim.countryOf(life.birthCountry).name}生まれ）` : `${c.name}・${f.name}`;
  }

  function tick() {
    state.timer = null;
    const life = state.life;
    if (!life || !life.alive || state.paused || life.pending) return;
    const out = KichuSim.step(life);
    applyYear(out);
    if (out.choice) {
      openChoice(out.choice);
      return;
    }
    afterYear(out);
  }

  function applyYear(out, forcedKind) {
    $("#who-age").textContent = String(out.age);
    out.logs.forEach((entry) => pushLog($("#log"), entry, true));
    renderMeters(out.stats);
    if (out.death) renderPeek(out);
    if (!out.choice) {
      addRing(state.planet, out.age, forcedKind || ringKind(out), true);
      fitView(state.planet, out.age + 1);
    }
  }

  function afterYear(out) {
    if (out.dead) {
      addRing(state.planet, out.age + 1.6, "end", true);
      state.timer = setTimeout(showEnd, reduceMotion ? 600 : 1800);
      return;
    }
    const [plain, eventful] = SPEEDS[state.speed];
    schedule(out.logs.length ? eventful : plain);
  }

  function renderMeters(stats) {
    const box = $("#meters");
    if (!box.children.length) {
      for (const [key, label] of Object.entries(STAT_LABELS)) {
        box.append(
          h("div", { class: "meter", "data-key": key }, [
            h("dt", {}, [h("span", { text: label }), h("span", { class: "delta" })]),
            h("dd", { role: "meter", "aria-label": label, "aria-valuemin": "0", "aria-valuemax": "100" }, [h("div", { class: "fill" })]),
          ])
        );
      }
    }
    for (const key of Object.keys(STAT_LABELS)) {
      const v = Math.round(stats[key]);
      const row = box.querySelector(`[data-key="${key}"]`);
      row.querySelector(".fill").style.width = v + "%";
      row.querySelector("dd").setAttribute("aria-valuenow", v);
      const prev = state.prevStats ? Math.round(state.prevStats[key]) : v;
      const d = v - prev;
      const delta = row.querySelector(".delta");
      if (Math.abs(d) >= 3) {
        delta.textContent = (d > 0 ? "+" : "−") + Math.abs(d);
        delta.className = "delta show " + (d > 0 ? "up" : "down");
      } else {
        delta.className = "delta";
      }
    }
    state.prevStats = { ...stats };
  }

  function renderPeek(out) {
    const { p, r, hit } = out.death;
    $("#peek-panel").replaceChildren(
      h("div", { class: "row" }, [h("span", { text: `${out.age}さいの1年で亡くなる確率` }), h("b", { text: pct(p) })]),
      h("div", { class: "row" }, [h("span", { text: "引いた乱数" }), h("b", { text: r.toFixed(4) })]),
      h("p", { class: "verdict", text: hit ? "→ 乱数が確率より小さかった" : "→ 乱数が確率より大きいので、次の年へ" })
    );
  }

  function rollText(roll) {
    if (roll.from != null) {
      return `乱数 ${roll.r.toFixed(4)} が、このできごとの区間 ${roll.from.toFixed(3)}〜${(roll.from + roll.p).toFixed(3)}（確率 ${pct(roll.p)}）に入った`;
    }
    return `「${roll.what}」確率 ${pct(roll.p)}、乱数 ${roll.r.toFixed(4)} → ${roll.hit ? "あたり" : "はずれ"}`;
  }

  function pushLog(list, entry, newestFirst) {
    const kind = entry.isChoice ? "choice" : entry.kind;
    const li = h("li", { class: `ev ev-${kind}${newestFirst ? " ev-new" : ""}` }, [
      h("span", { class: "ev-age", text: `${entry.age}さい` }),
      h("span", { class: "ev-text", text: entry.text }),
    ]);
    if (entry.note) li.append(h("span", { class: "ev-note", text: entry.note }));
    if (entry.roll && entry.kind !== "death") li.append(h("span", { class: "ev-roll peek-only", text: rollText(entry.roll) }));
    if (newestFirst) list.prepend(li);
    else list.append(li);
  }

  // ---------- 選択 ----------
  let lastFocus = null;
  function openChoice(choice) {
    lastFocus = document.activeElement;
    $("#choice-q").textContent = choice.prompt;
    const box = $("#choice-options");
    box.replaceChildren();
    choice.options.forEach((opt) => {
      const b = h("button", { type: "button", class: "opt" }, [h("span", { class: "opt-label", text: opt.label })]);
      if (opt.p != null) b.append(h("span", { class: "opt-p peek-only", text: `${opt.pLabel} ${pct(opt.p)}` }));
      b.addEventListener("click", () => pick(choice, opt));
      box.append(b);
    });
    $("#choice").hidden = false;
    box.querySelector("button").focus();
  }

  function pick(choice, opt) {
    $("#choice").hidden = true;
    const out = KichuSim.choose(state.life, opt.id);
    out.logs.forEach((l) => (l.isChoice = true));
    state.choices.push({ age: out.age, label: opt.label, result: out.logs[0] ? out.logs[0].text : "" });
    renderPlace();
    applyYear(out, "choice");
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    afterYear(out);
  }

  // ---------- 一時停止と速さ ----------
  function updatePauseButton() {
    $("#btn-pause").textContent = state.paused ? "再開する" : "一時停止";
  }
  $("#btn-pause").addEventListener("click", () => {
    state.paused = !state.paused;
    updatePauseButton();
    if (state.paused) clearTimer();
    else if (state.life && state.life.alive && !state.life.pending) schedule(200);
  });
  $$(".speed button").forEach((b) =>
    b.addEventListener("click", () => {
      state.speed = b.dataset.speed;
      $$(".speed button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    })
  );

  // ---------- 一生のまとめ ----------
  function showEnd() {
    state.timer = null;
    const life = state.life;
    const c0 = KichuSim.countryOf(life.birthCountry);
    const f = KichuSim.familyOf(life.family);
    fitView(state.planet, null); // まとめでは全員同じ大きさの枠で見せる
    $("#orbit-end").replaceChildren(state.planet);
    $("#end-name").textContent = life.name;
    $("#end-age").textContent = String(life.deathAge);
    const last = life.history[life.history.length - 1];
    $("#end-cause").textContent = last.text + "。";

    const goods = life.history.filter((e) => e.kind === "good").length;
    const bads = life.history.filter((e) => e.kind === "bad").length;
    const facts = $("#end-facts");
    facts.replaceChildren();
    const fact = (label, value) => facts.append(h("div", {}, [h("dt", { text: label }), h("dd", {}, value)]));
    fact("生まれた場所", `${c0.name}・${f.name}` + (life.migrated ? "（22さいでユタカ国へ移住）" : ""));
    fact("小学校", life.deathAge < 6 ? "通う年れいになる前に一生を終えた" : life.school ? "通えた" : "通えなかった");
    if (state.choices.length) {
      const ul = h("ul");
      state.choices.forEach((ch) => ul.append(h("li", {}, [`${ch.age}さい：${ch.label}`, h("span", { class: "res", text: ch.result })])));
      fact("選んだこと", ul);
    } else {
      fact("選んだこと", "選択の年れいになる前に一生を終えた");
    }
    fact("できごと", `うれしいこと ${goods}回、つらいこと ${bads}回`);

    $("#end-seed").textContent = String(state.seed);
    const endLog = $("#end-log");
    endLog.replaceChildren();
    life.history.forEach((e) => pushLog(endLog, e, false));
    $(".history").open = false;

    const compare = $("#end-compare");
    compare.textContent = "同じ日に生まれた1万人を計算しています…";
    show("screen-end");
    ensureMany().then((res) => {
      if (state.life !== life) return;
      const row = res.summary.byCountry.find((r) => r.id === life.birthCountry);
      let text = `${c0.name}に生まれた人の平均寿命は ${row.avgAge.toFixed(1)}さい（1万人を計算した結果）。`;
      if (life.deathAge < 5) text += `${c0.name}では、100人のうち約${Math.max(1, Math.round(row.under5 * 100))}人が5さいまでに亡くなります。`;
      else if (life.deathAge >= row.avgAge + 10) text += "平均よりずっと長い一生でした。";
      else if (life.deathAge <= row.avgAge - 10) text += "平均よりずっと短い一生でした。";
      compare.textContent = text;
    });
  }

  // ---------- 1万人を一気に計算する ----------
  // 画面が固まらないように、少しずつ区切って計算します
  function ensureMany(onProgress) {
    if (onProgress) state.manyListeners.push(onProgress);
    if (state.many) return Promise.resolve(state.many);
    if (state.manyPromise) return state.manyPromise;
    state.manyPromise = new Promise((resolve) => {
      const { n, seed } = MANY;
      const pickRandom = KichuSim.makeRandom(seed + 999);
      const people = [];
      let ms = 0;
      let i = 0;
      const chunk = () => {
        const t0 = performance.now();
        const end = Math.min(n, i + 250);
        for (; i < end; i++) people.push(KichuSim.simulatePerson(seed, i, pickRandom));
        ms += performance.now() - t0;
        state.manyListeners.forEach((fn) => fn(i, n));
        if (i < n) setTimeout(chunk, 0);
        else {
          state.many = { people, ms, summary: KichuSim.summarize(people) };
          resolve(state.many);
        }
      };
      setTimeout(chunk, 0);
    });
    return state.manyPromise;
  }

  async function showMany() {
    show("screen-many");
    $("#many-body").hidden = true;
    $("#many-progress").hidden = false;
    const counter = $("#many-n");
    counter.textContent = "0";
    let res;
    if (state.many) {
      // 計算ずみでも、数が増えていくようすを少しだけ見せる
      const steps = reduceMotion ? 1 : 20;
      for (let k = 1; k <= steps; k++) {
        counter.textContent = fmt(Math.round((MANY.n * k) / steps));
        await wait(30);
      }
      res = state.many;
    } else {
      res = await ensureMany((i) => (counter.textContent = fmt(i)));
    }
    renderMany(res);
    $("#many-progress").hidden = true;
    $("#many-body").hidden = false;
  }

  function renderMany(res) {
    const life = state.life;
    const sum = res.summary;
    const sec = res.ms / 1000;
    $("#many-time").replaceChildren(
      `${fmt(sum.total)}人分の一生を、このコンピュータは `,
      h("b", { text: sec < 1 ? sec.toFixed(2) + "秒" : sec.toFixed(1) + "秒" }),
      " で計算しました。"
    );

    const tbody = $("#many-table tbody");
    tbody.replaceChildren();
    sum.byCountry.forEach((r) => {
      const mine = life && r.id === life.birthCountry;
      tbody.append(
        h("tr", { class: mine ? "is-you" : "" }, [
          h("td", {}, [
            h("span", { class: "cname" }, [
              h("span", { class: "cn" }, [h("i", { class: "swatch", style: `background: ${r.color}` }), r.name]),
              mine ? h("span", { class: "you-tag", text: "あなた" }) : null,
            ]),
          ]),
          h("td", { class: "num", text: `${fmt(r.count)}人` }),
          h("td", {}, [
            h("div", { class: "lifebar" }, [
              h("div", { class: "track" }, [h("div", { class: "bar-fill", style: `width: ${r.avgAge}%; background: ${r.color}` })]),
              h("span", { text: `${r.avgAge.toFixed(1)}さい` }),
            ]),
          ]),
          h("td", { class: "num", text: pct(r.school) }),
          h("td", { class: "num", text: pct(r.under5) }),
        ])
      );
    });

    const hist = $("#hist");
    hist.replaceChildren();
    const max = Math.max(...sum.bins);
    const myBin = life && life.deathAge != null ? Math.min(10, Math.floor(life.deathAge / 10)) : -1;
    hist.setAttribute("aria-label", "亡くなった年れいの分布：" + sum.bins.map((b, i) => `${i * 10}さい台 ${b}人`).join("、"));
    sum.bins.forEach((count, i) => {
      const col = h("div", { class: "hist-col" + (i === myBin ? " is-you" : ""), title: `${i * 10}${i === 10 ? "さい以上" : "〜" + (i * 10 + 9) + "さい"}：${fmt(count)}人` });
      const height = (count / max) * 100;
      if (i === myBin) col.append(h("span", { class: "hist-you", style: `bottom: calc(${height}% + 6px)`, text: "あなた" }));
      col.append(h("div", { class: "hist-bar", style: `height: ${height}%` }));
      col.append(h("span", { class: "hist-label", text: i === 10 ? "100〜" : String(i * 10) }));
      hist.append(col);
    });

    if (life && life.deathAge != null) {
      const longer = res.people.filter((p) => p.age > life.deathAge).length;
      $("#many-you").textContent = `あなた（${life.deathAge}さい）より長く生きた人は、1万人のうち ${fmt(longer)}人（${pct(longer / sum.total)}）でした。`;
    } else {
      $("#many-you").textContent = "";
    }
    if (state.lines) {
      $("#lines-note").textContent = `このゲームは HTML・CSS・JavaScript の約${fmt(state.lines)}行でできています。data.js の数字を変えれば、別の世界も作れます。`;
    }
  }

  // ---------- しくみの説明 ----------
  let guideReturn = null;
  function openGuide() {
    guideReturn = document.activeElement;
    $("#guide-seed").textContent = state.seed ? `いまの人生番号：${state.seed}` : "";
    $("#guide").hidden = false;
    $("#btn-guide-close").focus();
    if (state.timer) {
      clearTimer();
      state.resumeAfterGuide = true;
    }
  }
  function closeGuide() {
    $("#guide").hidden = true;
    if (guideReturn && document.contains(guideReturn)) guideReturn.focus();
    if (state.resumeAfterGuide) {
      state.resumeAfterGuide = false;
      if (state.life && state.life.alive && !state.life.pending) schedule(300);
      else if (state.life && !state.life.alive && $("#screen-life").hidden === false) showEnd();
    }
  }

  function fillGuideTable() {
    const tbody = $("#guide-table tbody");
    KICHU.countries.forEach((c) => {
      tbody.append(
        h("tr", {}, [
          h("td", {}, [h("span", { class: "cn" }, [h("i", { class: "swatch", style: `background: ${c.color}` }), c.name])]),
          h("td", { class: "num", text: c.birthShare + "%" }),
          h("td", { class: "num", text: pct(c.schoolRate) }),
          h("td", { class: "num", text: pct(c.advanceRate) }),
          h("td", { class: "num", text: pct(c.clinicRate) }),
          h("td", { class: "num", text: pct(c.mortality.infant) }),
        ])
      );
    });
  }

  // 自分自身のファイルを読み込んで、行数を数える（GitHub Pages などで公開したときに動く）
  async function countLines() {
    try {
      const files = ["index.html", "style.css", "data.js", "sim.js", "game.js"];
      const texts = await Promise.all(files.map((f) => fetch(f).then((r) => (r.ok ? r.text() : Promise.reject()))));
      const total = texts.reduce((sum, t) => sum + t.split("\n").length, 0);
      state.lines = Math.round(total / 100) * 100;
      $("#guide-lines").textContent = `5つのファイルを合わせて、約${fmt(state.lines)}行のプログラムです。`;
    } catch (e) {
      state.lines = null;
    }
  }

  // ---------- ボタン ----------
  const newSeed = () => 10000 + Math.floor(Math.random() * 90000);
  const urlSeed = Number(params.get("seed"));

  $("#btn-born").addEventListener("click", () => startBirth(urlSeed > 0 ? urlSeed : newSeed()));
  $("#btn-start").addEventListener("click", enterLife);
  $("#btn-again").addEventListener("click", () => startBirth(newSeed()));
  $("#btn-again2").addEventListener("click", () => startBirth(newSeed()));
  $("#btn-same").addEventListener("click", () => startBirth(state.seed));
  $("#btn-many").addEventListener("click", showMany);
  $("#btn-guide").addEventListener("click", openGuide);
  $("#btn-guide2").addEventListener("click", openGuide);
  $("#btn-guide-close").addEventListener("click", closeGuide);
  $("#guide").addEventListener("click", (e) => {
    if (e.target === $("#guide")) closeGuide();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("#guide").hidden) closeGuide();
  });
  $("#btn-home").addEventListener("click", () => {
    clearTimer();
    state.life = null;
    $("#choice").hidden = true;
    show("screen-title");
  });

  const peek = $("#peek");
  const setPeek = (on) => {
    peek.checked = on;
    document.body.classList.toggle("peek", on);
  };
  peek.addEventListener("change", () => setPeek(peek.checked));
  setPeek(params.get("peek") === "1");

  drawTitleArt();
  fillGuideTable();
  countLines();
})();
