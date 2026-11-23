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
      else if (k === "html") e.innerHTML = v;
      else if (k === "style") e.setAttribute("style", v);
      else e.setAttribute(k, v);
    }
    for (const c of [].concat(children)) {
      if (c == null) continue;
      e.append(c instanceof Node ? c : document.createTextNode(c));
    }
    return e;
  }

  // 「アニメーションを減らす」設定のときは、ずっと動き続ける飾り（ゆれ・きらめき）だけを止める。
  // ルーレットや演出はゲームの中身なので、設定にかかわらず動かす。
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));

  // 1年が進む速さ [何もない年, できごとがあった年]（ミリ秒）
  const SPEEDS = { slow: [900, 2600], normal: [380, 1300], fast: [120, 600] };
  const MANY = { n: 10000, seed: 2026 };
  const CHOICE_AGES = STORY.choices.map((c) => c.age);
  const STATS = [
    { key: "health", label: "けんこう", color: "#ff6f7d", icon: '<path d="M12 21s-7.5-4.6-9.3-9.4C1.4 8 3.6 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.6 3.5 4.3 7.1C19.5 16.4 12 21 12 21z"/>' },
    { key: "learn", label: "まなび", color: "#6c8cff", icon: '<path d="M3 5.5C6 4 9 4 12 6c3-2 6-2 9-.5V19c-3-1.5-6-1.5-9 .5-3-2-6-2-9-.5z"/><path d="M12 6v13.5" fill="none"/>' },
    { key: "money", label: "おかね", color: "#ffc93c", icon: '<circle cx="12" cy="12" r="9"/><path d="M9 9.5l3 3.5 3-3.5M12 13v4M9.5 14h5" fill="none"/>' },
    { key: "happy", label: "しあわせ", color: "#3cc6a5", icon: '<circle cx="12" cy="12" r="9"/><path d="M8 13.5c1.2 2 6.8 2 8 0" fill="none"/><circle cx="9" cy="10" r="1" fill="#231942"/><circle cx="15" cy="10" r="1" fill="#231942"/>' },
  ];
  const KIND_LABEL = { great: "大成功", good: "うれしい", bad: "つらい", info: "できごと", death: "一生の終わり" };

  const state = {
    life: null,
    seed: null,
    timer: null,
    bubbleTimer: null,
    paused: false,
    speed: "normal",
    scene: null,
    prevStats: null,
    many: null,
    manyPromise: null,
    manyListeners: [],
    manyFast: false,
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

  function show(id) {
    $$(".screen").forEach((s) => (s.hidden = s.id !== id));
    window.scrollTo(0, 0);
  }

  // ============================================================
  //  はじめの画面
  // ============================================================
  $("#title-art").innerHTML = KichuScene.planet();

  // ============================================================
  //  誕生のルーレット
  // ============================================================
  function arcPath(r, a0, a1) {
    const p = (a) => [Math.sin(a) * r, -Math.cos(a) * r];
    const [x0, y0] = p(a0);
    const [x1, y1] = p(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M0 0 L${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}Z`;
  }

  function buildWheel(box, items) {
    const total = items.reduce((a, b) => a + b.weight, 0);
    const bounds = [];
    let a = 0;
    let segs = "";
    items.forEach((it, i) => {
      const share = it.weight / total;
      const a1 = a + share * Math.PI * 2;
      const mid = (a + a1) / 2;
      const lx = Math.sin(mid) * 64;
      const ly = -Math.cos(mid) * 64;
      let label;
      if (share >= 0.14) label = `<text class="seg-label" x="${lx.toFixed(1)}" y="${(ly - 2).toFixed(1)}" text-anchor="middle">${it.short}</text><text class="seg-label seg-pct" x="${lx.toFixed(1)}" y="${(ly + 14).toFixed(1)}" text-anchor="middle">${pct(share)}</text>`;
      else label = `<text class="seg-label seg-pct" x="${(Math.sin(mid) * 76).toFixed(1)}" y="${(-Math.cos(mid) * 76 + 4).toFixed(1)}" text-anchor="middle">${pct(share)}</text>`;
      segs += `<g class="seg" data-i="${i}"><path d="${arcPath(100, a, a1)}" fill="${it.color}" stroke="#231942" stroke-width="3" stroke-linejoin="round"/>${label}</g>`;
      bounds.push(a1 / (Math.PI * 2));
      a = a1;
    });
    box.innerHTML = `<svg viewBox="-118 -128 236 246" role="img" aria-label="${items.map((it) => `${it.name} ${pct(it.weight / total)}`).join("、")}">
      <circle r="108" fill="#fffdf7" stroke="#231942" stroke-width="4"/>
      <g class="disc">${segs}</g>
      <circle r="18" fill="#3cc6a5" stroke="#231942" stroke-width="3.5"/><circle cx="-6" cy="-3" r="4" fill="#fff"/><circle cx="6" cy="-3" r="4" fill="#fff"/><circle cx="-5.5" cy="-2.5" r="2" fill="#231942"/><circle cx="6.5" cy="-2.5" r="2" fill="#231942"/>
      <path class="pointer" d="M-13 -124 H13 L0 -96Z" fill="#ffc93c" stroke="#231942" stroke-width="3.5" stroke-linejoin="round"/>
    </svg>`;
    return { disc: box.querySelector(".disc"), pointer: box.querySelector(".pointer"), segs: Array.from(box.querySelectorAll(".seg")), bounds, box };
  }

  // 針の下にある区画の番号（disc の回転角から計算）
  function segmentAt(ui, rot) {
    const f = (((-rot % 360) + 360) % 360) / 360;
    const i = ui.bounds.findIndex((b) => f < b);
    return i < 0 ? ui.bounds.length - 1 : i;
  }

  // ルーレットを回す。最後は乱数 r の位置（0〜1 を一周とした角度）で止まる
  // 前半 2.4秒は同じ速さで回り、後半 4.6秒かけてゆっくり止まる
  function spinWheel(ui, r, index) {
    return new Promise((resolve) => {
      const target = -(r * 360) - 360 * 8;
      const T1 = 2400;
      const T2 = 4600;
      const speed = target / (T1 + T2 / 3); // 1ミリ秒あたりの角度
      const angleAt = (ms) => {
        if (ms <= T1) return speed * ms;
        const s = Math.min(1, (ms - T1) / T2);
        return speed * T1 + ((speed * T2) / 3) * (1 - Math.pow(1 - s, 3));
      };
      const finish = () => {
        ui.disc.style.transform = `rotate(${target}deg)`;
        ui.segs.forEach((g) => {
          g.classList.remove("is-on");
          g.classList.toggle("is-dim", Number(g.dataset.i) !== index);
          g.classList.toggle("is-win", Number(g.dataset.i) === index);
        });
        ui.box.classList.add("stopped");
        resolve();
      };
      ui.box.classList.remove("stopped");
      const t0 = performance.now();
      let current = -1;
      const frame = (now) => {
        const ms = now - t0;
        const t = Math.min(1, ms / (T1 + T2));
        const rot = t >= 1 ? target : angleAt(ms);
        ui.disc.style.transform = `rotate(${rot}deg)`;
        const i = segmentAt(ui, rot);
        if (i !== current) {
          if (current >= 0) ui.segs[current].classList.remove("is-on");
          ui.segs[i].classList.add("is-on");
          current = i;
          ui.pointer.classList.remove("tick");
          void ui.pointer.getBoundingClientRect();
          ui.pointer.classList.add("tick");
        }
        if (t < 1) requestAnimationFrame(frame);
        else finish();
      };
      requestAnimationFrame(frame);
    });
  }

  async function startBirth(seed) {
    clearTimer();
    $("#reveal").hidden = true;
    state.seed = seed;
    state.life = KichuSim.createLife(seed);
    const life = state.life;
    const c = KichuSim.countryOf(life.birthCountry);
    const f = KichuSim.familyOf(life.family);
    const alive = () => state.life === life;

    show("screen-birth");
    $("#wheel-family-box").hidden = true;
    $("#born").hidden = true;
    $("#res-country").textContent = "";
    $("#res-family").textContent = "";

    const shortName = { yutaka: "ユタカ", midori: "ミドリ", hateno: "ハテノ", sunaoka: "スナオカ", morinooku: "モリノオク" };
    const ui1 = buildWheel($("#wheel-country"), KICHU.countries.map((k) => ({ name: k.name, short: shortName[k.id] || k.name, weight: k.birthShare, color: k.color })));
    $("#res-country").replaceChildren(h("span", { class: "spinning", text: "ルーレット、回転中…" }));
    await wait(700);
    if (!alive()) return;
    await spinWheel(ui1, life.lottery.country.r, life.lottery.country.index);
    if (!alive()) return;
    $("#res-country").replaceChildren(h("span", { class: "pop" }, [`乱数 ${life.lottery.country.r.toFixed(4)} → `, h("b", { text: c.name })]));

    await wait(1200);
    if (!alive()) return;
    $("#wheel-family-box").hidden = false;
    $("#wheel-family-box").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
    const familyColors = ["#ffc93c", "#9fb4ff", "#7c6fa8"];
    const ui2 = buildWheel($("#wheel-family"), KICHU.families.map((k, i) => ({ name: k.name, short: k.short, weight: c.familyOdds[i], color: familyColors[i] })));
    $("#res-family").replaceChildren(h("span", { class: "spinning", text: "ルーレット、回転中…" }));
    await wait(700);
    if (!alive()) return;
    await spinWheel(ui2, life.lottery.family.r, life.lottery.family.index);
    if (!alive()) return;
    $("#res-family").replaceChildren(h("span", { class: "pop" }, [`乱数 ${life.lottery.family.r.toFixed(4)} → `, h("b", { text: f.name })]));

    await wait(1100);
    if (!alive()) return;
    const sp = KICHU.species.find((s) => s.id === life.species);
    const preview = KichuScene.create();
    preview.setCountry(c.id);
    preview.setTime(0.02);
    preview.setCast(life, 0);
    $("#born-scene").replaceChildren(preview.el);
    $("#born-text").textContent = `あなたは${c.name}の${f.name}で、タマゴからかえります。${sp.name}の「${life.name}」です。`;
    $("#born-tagline").textContent = `${c.name}：${c.tagline}`;
    $("#born-species").textContent = `${sp.name}：${sp.note}（種族による有利・不利はありません）`;
    $("#born").hidden = false;
    $("#born").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
    $("#btn-start").focus({ preventScroll: true });
  }

  // ============================================================
  //  一生の進行
  // ============================================================
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
    state.prevStats = null;
    state.choicesMade = 0;
    state.trace = [{ age: 0, health: life.health, learn: life.learn, money: life.money, happy: life.happy }];
    state.paused = false;
    updatePauseButton();
    state.scene = KichuScene.create();
    state.scene.setCountry(life.country);
    state.scene.setTime(0);
    state.scene.setCast(life, 0);
    $("#stage-scene").replaceChildren(state.scene.el);
    $("#log").replaceChildren();
    $("#who-name").textContent = life.name;
    renderPlace();
    $("#who-age").textContent = "0";
    renderMeters(life);
    renderTags();
    $("#peek-panel").replaceChildren(h("p", { class: "soft-dark", text: "1年ごとに、ここに判定が出ます。" }));
    pushLog($("#log"), life.history[0], true);
    showBubble(life.history[0]);
    show("screen-life");
    ensureMany(); // 1万匹の計算を、うしろで少しずつ始めておく
    schedule(1600);
  }

  function renderPlace() {
    const life = state.life;
    const c = KichuSim.countryOf(life.country);
    const f = KichuSim.familyOf(life.family);
    const sp = KICHU.species.find((s) => s.id === life.species);
    $("#who-place").textContent = life.migrated ? `${c.name}在住（${KichuSim.countryOf(life.birthCountry).name}生まれ）・${sp.name}` : `${c.name}・${f.name}・${sp.name}`;
  }

  function renderTags() {
    const L = state.life;
    const tags = [];
    if (L.trait) tags.push(["性格", STORY.traits[L.trait]]);
    if (L.skill) tags.push(["特技", STORY.skills[L.skill]]);
    if (L.job) tags.push(["仕事", STORY.jobs[L.job].name]);
    if (L.partner) tags.push(["家族", L.kids ? `パートナーと子ども${L.kids}匹` : "パートナー"]);
    if (L.pet) tags.push(["ペット", "モフ"]);
    $("#tags").replaceChildren(...tags.map(([k, v]) => h("span", { class: "tag" }, [h("b", { text: k }), v])));
  }

  function tick() {
    state.timer = null;
    const life = state.life;
    if (!life || !life.alive || state.paused || life.pending) return;
    const out = KichuSim.step(life);
    applyYear(out);
    if (out.choice) {
      // 分かれ道の前に、ひと呼吸おく
      showBubble({ kind: "info", text: "分かれ道がやってきた！" });
      state.timer = setTimeout(() => {
        state.timer = null;
        openChoice(out.choice);
      }, 900);
      return;
    }
    afterYear(out);
  }

  function applyYear(out) {
    const L = state.life;
    // 人生グラフ用に、毎年のメーターを記録する（同じ年は上書き）
    const point = { age: out.age + (out.dead ? 0 : 1), ...out.stats };
    if (out.choice) point.age = out.age;
    const lastPoint = state.trace[state.trace.length - 1];
    if (lastPoint && lastPoint.age === point.age) state.trace[state.trace.length - 1] = point;
    else state.trace.push(point);
    $("#who-age").textContent = String(out.age);
    out.logs.forEach((entry) => pushLog($("#log"), entry, true));
    renderMeters(out.stats);
    renderTags();
    if (out.death) renderPeek(out);
    const age = out.dead ? out.age : L.age;
    state.scene.setCountry(L.country);
    state.scene.setTime(Math.min(1.1, age / 100));
    state.scene.setCast(L, age);
    const top = pickHighlight(out.logs);
    if (top) {
      showBubble(top);
      effectFor(top);
    } else {
      hideBubbleSoon();
    }
  }

  function pickHighlight(logs) {
    for (const k of ["death", "great", "bad", "good", "info"]) {
      const e = logs.find((l) => l.kind === k);
      if (e) return e;
    }
    return null;
  }

  function afterYear(out) {
    if (out.dead) {
      state.scene.setTime(1.06);
      state.timer = setTimeout(showEnd, 2600);
      return;
    }
    const [plain, eventful] = SPEEDS[state.speed];
    schedule(out.logs.length ? eventful : plain);
  }

  // ---------- 吹き出しと演出 ----------
  function showBubble(entry) {
    clearTimeout(state.bubbleTimer);
    const b = $("#bubble");
    b.className = `bubble k-${entry.kind} show`;
    b.replaceChildren(h("span", { class: "b-kind", text: KIND_LABEL[entry.kind] || "できごと" }), entry.text);
  }
  function hideBubbleSoon() {
    clearTimeout(state.bubbleTimer);
    state.bubbleTimer = setTimeout(() => $("#bubble").classList.remove("show"), 900);
  }

  function effectFor(entry) {
    const fx = $("#fx");
    if (entry.kind === "great") {
      confetti(fx, 40);
      stamp(fx, "大成功！", "");
    } else if (entry.kind === "good") {
      confetti(fx, 12);
    } else if (entry.kind === "bad") {
      const disaster = entry.eventId === "disaster";
      rain(fx, disaster ? 50 : 24);
      if (disaster && !reduceMotion) {
        const f = $("#stage-frame");
        f.classList.remove("shake");
        void f.offsetWidth;
        f.classList.add("shake");
      }
      if (entry.roll && entry.roll.from == null && !entry.roll.hit) stamp(fx, "ざんねん…", "bad");
    }
  }
  function confetti(fx, n) {
    const colors = ["#ffc93c", "#ff6f7d", "#3cc6a5", "#6c8cff", "#c9b8ff", "#ffffff"];
    for (let i = 0; i < n; i++) {
      const p = h("span", { class: "confetti", style: `left:${Math.random() * 100}%; background:${colors[i % colors.length]}; animation-delay:${(Math.random() * 0.4).toFixed(2)}s; animation-duration:${(1.4 + Math.random()).toFixed(2)}s` });
      fx.append(p);
      setTimeout(() => p.remove(), 2600);
    }
  }
  function rain(fx, n) {
    for (let i = 0; i < n; i++) {
      const d = h("span", { class: "raindrop", style: `left:${Math.random() * 110}%; animation-delay:${(Math.random() * 0.8).toFixed(2)}s` });
      fx.append(d);
      setTimeout(() => d.remove(), 1900);
    }
  }
  function stamp(fx, text, cls) {
    const el = h("span", { class: `stamp ${cls}`, text });
    fx.append(el);
    setTimeout(() => el.remove(), 1600);
  }

  // ---------- メーター ----------
  function renderMeters(stats) {
    const box = $("#meters");
    if (!box.children.length) {
      for (const st of STATS) {
        box.append(
          h("div", { class: "meter", "data-key": st.key }, [
            h("dt", {}, [
              h("span", { html: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="${st.color}" stroke="#231942" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${st.icon}</svg>` }),
              h("span", { text: st.label }),
              h("span", { class: "delta" }),
              h("span", { class: "val" }),
            ]),
            h("dd", { role: "meter", "aria-label": st.label, "aria-valuemin": "0", "aria-valuemax": "100" }, [h("div", { class: "fill", style: `background:${st.color}` })]),
          ])
        );
      }
    }
    for (const st of STATS) {
      const v = Math.round(stats[st.key]);
      const row = box.querySelector(`[data-key="${st.key}"]`);
      row.querySelector(".fill").style.width = v + "%";
      row.querySelector(".val").textContent = v;
      row.querySelector("dd").setAttribute("aria-valuenow", v);
      const prev = state.prevStats ? Math.round(state.prevStats[st.key]) : v;
      const d = v - prev;
      const delta = row.querySelector(".delta");
      if (Math.abs(d) >= 3) {
        delta.textContent = (d > 0 ? "+" : "−") + Math.abs(d);
        delta.className = "delta show " + (d > 0 ? "up" : "down");
      } else delta.className = "delta";
    }
    state.prevStats = { health: stats.health, learn: stats.learn, money: stats.money, happy: stats.happy };
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
    if (roll.from != null) return `乱数 ${roll.r.toFixed(4)} が、このできごとの区間 ${roll.from.toFixed(3)}〜${(roll.from + roll.p).toFixed(3)}（確率 ${pct(roll.p)}）に入った`;
    return `「${roll.what}」確率 ${pct(roll.p)}、乱数 ${roll.r.toFixed(4)} → ${roll.hit ? "あたり" : "はずれ"}`;
  }

  function pushLog(list, entry, newestFirst) {
    const li = h("li", { class: `ev ev-${entry.kind}${entry.isChoice ? " ev-choice" : ""}${newestFirst ? " ev-new" : ""}` }, [
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
    const n = CHOICE_AGES.indexOf(state.life.age) + 1;
    $("#choice-badge").textContent = `分かれ道 ${n} / ${CHOICE_AGES.length}`;
    $("#choice-q").textContent = choice.prompt;
    $("#choice-pool").textContent = `この分かれ道の選択肢は全部で${choice.total}個。そのうち${choice.options.length}個が乱数で選ばれて表示されています。`;
    const box = $("#choice-options");
    box.replaceChildren();
    choice.options.forEach((opt) => {
      const b = h("button", { type: "button", class: "opt" }, [h("span", { class: "opt-label", text: opt.label })]);
      if (opt.sub) b.append(h("span", { class: "opt-sub", text: opt.sub }));
      if (opt.p != null) b.append(h("span", { class: "opt-p peek-only", text: `${opt.pLabel} ${pct(opt.p)}` }));
      b.addEventListener("click", () => pick(opt));
      box.append(b);
    });
    $("#choice").hidden = false;
    box.querySelector("button").focus();
  }

  function pick(opt) {
    $("#choice").hidden = true;
    state.choicesMade += 1;
    const out = KichuSim.choose(state.life, opt.id);
    out.logs.forEach((l) => {
      if (l.kind !== "death") l.isChoice = true;
    });
    renderPlace();
    applyYear(out);
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

  // ============================================================
  //  一生のまとめ（称号発表 → 人生カード）
  // ============================================================
  function rarityOf(titleId, count, total) {
    if (titleId === "smallStar") return { cls: "r-star", label: "星になったモンスター", stars: "☆" };
    const share = count / total;
    if (share <= 0.01) return { cls: "r-ultra", label: "ウルトラレア", stars: "★★★★" };
    if (share <= 0.03) return { cls: "r-rare", label: "レア", stars: "★★★" };
    if (share <= 0.08) return { cls: "r-some", label: "ちょっとレア", stars: "★★" };
    return { cls: "r-common", label: "よくある称号", stars: "★" };
  }

  function drawRadar(L) {
    const axes = [
      { k: "health", label: "けんこう", a: -90 },
      { k: "learn", label: "まなび", a: 0 },
      { k: "money", label: "おかね", a: 90 },
      { k: "happy", label: "しあわせ", a: 180 },
    ];
    const R = 50;
    const pt = (a, r) => [Math.cos((a * Math.PI) / 180) * r, Math.sin((a * Math.PI) / 180) * r];
    const pts = (k) => axes.map((x) => pt(x.a, R * k).map((v) => v.toFixed(1)).join(",")).join(" ");
    let g = "";
    [0.33, 0.66, 1].forEach((k) => (g += `<polygon class="ax" points="${pts(k)}"/>`));
    axes.forEach((x) => {
      const [x2, y2] = pt(x.a, R);
      g += `<line class="ax" x1="0" y1="0" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
    });
    g += `<polygon class="shape" points="${axes.map((x) => pt(x.a, (Math.max(4, L.peak[x.k]) / 100) * R).map((v) => v.toFixed(1)).join(",")).join(" ")}"/>`;
    axes.forEach((x) => {
      const [tx, ty] = pt(x.a, R + 15);
      g += `<text x="${tx.toFixed(1)}" y="${(ty + 4).toFixed(1)}" text-anchor="middle">${x.label}</text>`;
    });
    const svg = $("#radar");
    svg.innerHTML = g;
    svg.setAttribute("aria-label", "一生でいちばん高かった値：" + axes.map((x) => `${x.label} ${Math.round(L.peak[x.k])}`).join("、"));
  }

  // 記録のタイル
  function drawRecords(L) {
    const count = (k) => L.history.filter((e) => e.kind === k).length;
    const days = L.deathAge > 0 ? `約${fmt(L.deathAge * 365)}日` : "365日未満";
    const icon = (body, fill) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="${fill}" stroke="#231942" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${body}</svg>`;
    const tiles = [
      { cls: "wide", icon: icon('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" fill="none"/>', "#c9b8ff"), v: days, k: "きちゅうで過ごした日数" },
      { icon: icon('<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>', "#ff6f7d"), v: count("great"), k: "大成功" },
      { icon: icon('<circle cx="12" cy="12" r="9"/><path d="M8 13.5c1.2 2 6.8 2 8 0" fill="none"/><circle cx="9" cy="10" r="1" fill="#231942"/><circle cx="15" cy="10" r="1" fill="#231942"/>', "#ffc93c"), v: count("good"), k: "うれしいこと" },
      { icon: icon('<path d="M12 3c3 4.5 6 7.6 6 11a6 6 0 0 1-12 0c0-3.4 3-6.5 6-11z"/>', "#6c8cff"), v: count("bad"), k: "つらいこと" },
      { icon: icon('<path d="M12 21V11M12 11L5 4M12 11l7-7M5 4v5M5 4h5M19 4v5M19 4h-5" fill="none"/>', "#3cc6a5"), v: state.choicesMade, k: "分かれ道" },
    ];
    $("#records").replaceChildren(
      ...tiles.map((t, i) => h("div", { class: `rec ${t.cls || ""}`, style: `animation-delay:${0.08 * i}s` }, [h("span", { html: t.icon }), h("b", { text: String(t.v) }), h("span", { text: t.k })]))
    );
  }

  // 人生グラフ：4つのメーターが一生でどう変わったか
  function drawLifeChart(L) {
    const svg = $("#lifechart");
    // 画面の幅に合わせて描く（文字が小さくなりすぎないように）
    const W = Math.round(Math.min(640, Math.max(300, svg.clientWidth || 640)));
    const H = 250, left = 34, right = 12, top = 44, bottom = 210;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const maxAge = Math.max(10, L.deathAge);
    const x = (age) => left + (age / maxAge) * (W - left - right);
    const y = (v) => bottom - (v / 100) * (bottom - top);
    let g = "";
    [0, 50, 100].forEach((v) => (g += `<line class="grid" x1="${left}" x2="${W - right}" y1="${y(v)}" y2="${y(v)}"/><text class="tick" x="${left - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`));
    const step = maxAge > 60 || W < 420 ? 20 : 10;
    for (let a = 0; a <= maxAge; a += step) g += `<text class="tick" x="${x(a)}" y="${bottom + 18}" text-anchor="middle">${a}さい</text>`;
    g += `<line class="axis" x1="${left}" x2="${W - right}" y1="${bottom}" y2="${bottom}"/>`;
    // できごとの印（上の帯）
    if (W >= 420) g += `<text class="lane" x="${left - 6}" y="22" text-anchor="end">できごと</text>`;
    L.history.forEach((e, i) => {
      const cx = x(Math.min(e.age + 0.5, maxAge)).toFixed(1);
      const delay = `style="animation-delay:${(0.4 + (e.age / maxAge) * 2).toFixed(2)}s"`;
      if (e.kind === "great") g += `<path class="mk" ${delay} d="M${cx} 8 l3 6.5 7 .8 -5.2 4.8 1.4 7 -6.2-3.5 -6.2 3.5 1.4-7 -5.2-4.8 7-.8z" fill="#ff6f7d" stroke="#231942" stroke-width="1.5"/>`;
      else if (e.kind === "bad") g += `<circle class="mk" ${delay} cx="${cx}" cy="18" r="5" fill="#6c8cff" stroke="#231942" stroke-width="1.5"/>`;
      else if (e.kind === "good") g += `<circle class="mk" ${delay} cx="${cx}" cy="18" r="3.5" fill="#ffc93c" stroke="#231942" stroke-width="1.2"/>`;
      if (e.isChoice && (i === 0 || L.history[i - 1].age !== e.age || !L.history[i - 1].isChoice)) g += `<path d="M${cx} ${bottom - 6} l6 6 -6 6 -6 -6z" fill="#231942"/>`;
    });
    // 4本の線
    STATS.forEach((st) => {
      const pts = state.trace.map((p) => `${x(p.age).toFixed(1)},${y(p[st.key]).toFixed(1)}`).join(" ");
      g += `<polyline class="line" pathLength="1" points="${pts}" stroke="${st.color}"/>`;
    });
    svg.innerHTML = g;
    const last = state.trace[state.trace.length - 1];
    svg.setAttribute("aria-label", `0さいから${L.deathAge}さいまでの、4つのメーターの変化。最後は ` + STATS.map((st) => `${st.label} ${Math.round(last[st.key])}`).join("、"));
    $("#chart-legend").replaceChildren(
      ...STATS.map((st) => h("span", {}, [h("i", { style: `background:${st.color}` }), st.label])),
      h("span", {}, ["◆ 分かれ道"]),
      h("span", {}, [h("span", { style: "color:#ff6f7d", text: "★" }), " 大成功"])
    );
  }

  // 名場面：大成功・選べないできごと・分かれ道の結果から、最大8つ
  function drawMoments(L) {
    const ol = $("#moments");
    ol.replaceChildren();
    const pool = L.history.filter((e) => e.kind !== "death" && (e.isChoice || e.kind === "great" || e.note));
    const first = pool.filter((e) => e.kind === "great" || e.note);
    const rest = pool.filter((e) => !(e.kind === "great" || e.note));
    const top = first.concat(rest).slice(0, 8).sort((a, b) => a.age - b.age);
    if (!top.length) {
      ol.append(h("li", {}, [h("span", { class: "m-age", html: `<b>${L.deathAge}</b><small>さい</small>` }), h("span", { class: "m-text", text: "短い一生でしたが、家族はタマゴからかえった日のことをずっと覚えています。" })]));
      return;
    }
    top.forEach((e) =>
      ol.append(
        h("li", { class: `m-${e.kind}` }, [
          h("span", { class: "m-age", html: `<b>${e.age}</b><small>さい</small>` }),
          h("span", { class: "m-text" }, [e.isChoice ? h("span", { class: "m-tag", text: "選んだ" }) : null, e.text]),
        ])
      )
    );
  }

  function drawCompare(L, sum) {
    const c0 = KichuSim.countryOf(L.birthCountry);
    const row = sum.byCountry.find((r) => r.id === L.birthCountry);
    const rows = [
      { label: `${L.name}（あなた）`, v: L.deathAge, color: "#ffc93c", cls: "you" },
      { label: `${c0.name}の平均`, v: row.avgAge, color: c0.color },
      { label: "きちゅう全体の平均", v: sum.avgAge, color: "#c9b8ff" },
    ];
    $("#compare-bars").replaceChildren(
      ...rows.map((r, i) =>
        h("div", { class: `bar-row ${r.cls || ""}` }, [
          h("span", { text: r.label }),
          h("div", { class: "track" }, [h("div", { class: "fill", style: `width:${Math.min(100, (r.v / 110) * 100)}%; background:${r.color}; animation-delay:${0.15 * i}s` })]),
          h("b", { text: `${Number.isInteger(r.v) ? r.v : r.v.toFixed(1)}さい` }),
        ])
      )
    );
    let text = "平均は、同じ日にかえった1万匹を計算した結果です。";
    if (L.deathAge < 5) text += `${c0.name}では、100匹のうち約${Math.max(1, Math.round(row.under5 * 100))}匹が5さいまでに亡くなります。`;
    else if (L.deathAge >= row.avgAge + 10) text += `${c0.name}の平均より、ずっと長い一生でした。`;
    else if (L.deathAge <= row.avgAge - 10) text += `${c0.name}の平均より、ずっと短い一生でした。`;
    $("#end-compare").textContent = text;
  }

  function burst(fx, rar) {
    fx.replaceChildren();
    if (rar.cls === "r-star") {
      for (let i = 0; i < 24; i++) fx.append(h("span", { class: "sparkle", style: `left:${Math.random() * 100}%; top:${Math.random() * 100}%; animation-delay:${(Math.random() * 1.6).toFixed(2)}s` }));
      return;
    }
    const n = { "r-ultra": 120, "r-rare": 70, "r-some": 40, "r-common": 24 }[rar.cls];
    confetti(fx, n);
    if (rar.cls === "r-ultra" || rar.cls === "r-rare") {
      setTimeout(() => confetti(fx, Math.round(n / 2)), 700);
      for (let i = 0; i < 18; i++) fx.append(h("span", { class: "sparkle", style: `left:${Math.random() * 100}%; top:${Math.random() * 80}%; animation-delay:${(Math.random() * 1.6).toFixed(2)}s` }));
    }
  }

  async function showEnd() {
    state.timer = null;
    const L = state.life;
    const c0 = KichuSim.countryOf(L.birthCountry);
    const f = KichuSim.familyOf(L.family);
    const sp = KICHU.species.find((s) => s.id === L.species);
    const title = KichuSim.titleById(L.title);

    // 人生カード（称号発表のうしろで用意しておく）
    const cardScene = KichuScene.create();
    cardScene.setCountry(L.country);
    cardScene.setTime(Math.min(1.1, Math.max(0.05, L.deathAge / 100)));
    cardScene.setCast(L, L.deathAge);
    $("#card-scene").replaceChildren(cardScene.el);
    const wrap = $(".card-wrap");
    wrap.className = "card-wrap";
    const card = $("#life-card");
    card.className = "card";
    $("#card-title").textContent = title.name;
    $("#card-desc").textContent = title.desc;
    $("#card-name").textContent = `${L.name}（${sp.name}）`;
    $("#end-age").textContent = String(L.deathAge);
    const meta = [`${c0.name}・${f.name}`];
    if (L.migrated) meta.push("22さいでユタカ国へ移住");
    if (L.job) meta.push(STORY.jobs[L.job].name);
    $("#card-meta").textContent = meta.join(" ／ ");
    drawRadar(L);

    const last = L.history[L.history.length - 1];
    $("#end-cause").textContent = `${L.name}は、${last.text}。`;
    drawRecords(L);
    drawMoments(L);
    $("#compare-bars").replaceChildren();
    $("#end-compare").textContent = "同じ日にかえった1万匹を計算しています…";
    $("#end-seed").textContent = String(state.seed);
    const endLog = $("#end-log");
    endLog.replaceChildren();
    L.history.forEach((e) => pushLog(endLog, e, false));
    $(".history").open = false;

    // 称号発表
    const reveal = $("#reveal");
    reveal.className = "reveal";
    reveal.hidden = false;
    $("#reveal-lead").textContent = `${L.name}の一生にあたえられる称号は…`;
    $("#reveal-stars").textContent = "";
    $("#reveal-title").textContent = "";
    $("#reveal-rarity").textContent = "";
    $("#reveal-fx").replaceChildren();
    state.manyFast = true; // 称号のレア度を出すため、計算を急ぐ
    show("screen-end");
    const [res] = await Promise.all([ensureMany(), wait(2200)]);
    if (state.life !== L) return;

    const sum = res.summary;
    const count = sum.titles[L.title] || 0;
    const rar = rarityOf(L.title, count, sum.total);
    const rarityText = L.title === "smallStar" ? rar.label : `${rar.label}（1万匹中 ${fmt(count)}匹）`;
    $("#reveal-stars").textContent = rar.stars;
    $("#reveal-title").textContent = title.name;
    $("#reveal-rarity").textContent = rarityText;
    reveal.classList.add("done", rar.cls);
    burst($("#reveal-fx"), rar);
    $("#btn-reveal").focus({ preventScroll: true });

    wrap.classList.add(rar.cls);
    $("#card-rarity").textContent = `${rar.stars} ${rarityText}`;
    drawCompare(L, sum);
    state.pendingCard = L;
  }

  function closeReveal() {
    const reveal = $("#reveal");
    if (reveal.hidden || !reveal.classList.contains("done")) return;
    reveal.classList.add("closing");
    setTimeout(() => {
      reveal.hidden = true;
      reveal.classList.remove("closing");
      const card = $("#life-card");
      card.classList.remove("show");
      void card.offsetWidth;
      card.classList.add("show");
      if (state.pendingCard) drawLifeChart(state.pendingCard);
      state.pendingCard = null;
    }, 380);
  }
  $("#btn-reveal").addEventListener("click", closeReveal);

  // ============================================================
  //  1万匹を一気に計算する
  //  画面が固まらないように、少しずつ区切って計算します
  // ============================================================
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
        const end = Math.min(n, i + (state.manyFast ? 300 : 60));
        for (; i < end; i++) people.push(KichuSim.simulatePerson(seed, i, pickRandom));
        ms += performance.now() - t0;
        state.manyListeners.forEach((fn) => fn(i, n));
        if (i < n) setTimeout(chunk, state.manyFast ? 0 : 40);
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
    const bar = $("#many-bar");
    const progress = (i) => {
      counter.textContent = fmt(i);
      bar.style.width = (i / MANY.n) * 100 + "%";
    };
    let res;
    state.manyFast = true;
    if (state.many) {
      const steps = 24;
      for (let k = 1; k <= steps; k++) {
        progress(Math.round((MANY.n * k) / steps));
        await wait(30);
      }
      res = state.many;
    } else {
      res = await ensureMany(progress);
    }
    renderMany(res);
    $("#many-progress").hidden = true;
    $("#many-body").hidden = false;
  }

  function renderMany(res) {
    const L = state.life;
    const sum = res.summary;
    const sec = res.ms / 1000;
    $("#many-time").replaceChildren(`${fmt(sum.total)}匹分の一生を、このコンピュータは `, h("b", { text: sec < 1 ? sec.toFixed(2) + "秒" : sec.toFixed(1) + "秒" }), " で計算しました。");

    const tbody = $("#many-table tbody");
    tbody.replaceChildren();
    sum.byCountry.forEach((r) => {
      const mine = L && r.id === L.birthCountry;
      tbody.append(
        h("tr", { class: mine ? "is-you" : "" }, [
          h("td", {}, [
            h("span", { class: "cname" }, [
              h("span", { class: "cn" }, [h("i", { class: "swatch", style: `background: ${r.color}` }), r.name]),
              mine ? h("span", { class: "you-tag", text: "あなた" }) : null,
            ]),
          ]),
          h("td", { class: "num col-n", text: `${fmt(r.count)}匹` }),
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
    const myBin = L && L.deathAge != null ? Math.min(10, Math.floor(L.deathAge / 10)) : -1;
    hist.setAttribute("aria-label", "亡くなった年れいの分布：" + sum.bins.map((b, i) => `${i * 10}さい台 ${b}匹`).join("、"));
    sum.bins.forEach((count, i) => {
      const col = h("div", { class: "hist-col" + (i === myBin ? " is-you" : ""), title: `${i * 10}${i === 10 ? "さい以上" : "〜" + (i * 10 + 9) + "さい"}：${fmt(count)}匹` });
      const height = (count / max) * 100;
      if (i === myBin) col.append(h("span", { class: "hist-you", style: `bottom: calc(${height}% + 6px)`, text: "あなた" }));
      col.append(h("div", { class: "hist-bar", style: `height: ${height}%` }));
      col.append(h("span", { class: "hist-label", text: i === 10 ? "100〜" : String(i * 10) }));
      hist.append(col);
    });

    if (L && L.deathAge != null) {
      const longer = res.people.filter((p) => p.age > L.deathAge).length;
      $("#many-you").textContent = `あなた（${L.deathAge}さい）より長く生きたモンスターは、1万匹のうち ${fmt(longer)}匹（${pct(longer / sum.total)}）でした。`;
    } else $("#many-you").textContent = "";

    const ranking = $("#ranking");
    ranking.replaceChildren();
    STORY.titles
      .map((t) => ({ t, n: sum.titles[t.id] || 0 }))
      .sort((a, b) => b.n - a.n)
      .forEach((x, i) => {
        const mine = L && L.title === x.t.id;
        ranking.append(
          h("li", { class: mine ? "is-you" : "" }, [
            h("span", { class: "rk", text: String(i + 1) }),
            h("span", { class: "rn" }, [x.t.name, mine ? " " : null, mine ? h("span", { class: "you-tag", text: "あなた" }) : null]),
            h("span", { class: "rc", text: `${fmt(x.n)}匹` }),
          ])
        );
      });

    if (state.lines) {
      $("#lines-note").textContent = `このゲームは HTML・CSS・JavaScript の約${fmt(state.lines)}行でできています。data.js や story.js を書きかえれば、別の世界も作れます。`;
    }
  }

  // ============================================================
  //  しくみの説明
  // ============================================================
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
      else if (state.life && !state.life.alive && !$("#screen-life").hidden) showEnd();
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
      const files = ["index.html", "style.css", "data.js", "story.js", "sim.js", "scene.js", "game.js"];
      const texts = await Promise.all(files.map((f) => fetch(f).then((r) => (r.ok ? r.text() : Promise.reject()))));
      const total = texts.reduce((sum, t) => sum + t.split("\n").length, 0);
      state.lines = Math.round(total / 100) * 100;
      $("#guide-lines").textContent = `7つのファイルを合わせて、約${fmt(state.lines)}行のプログラムです。`;
    } catch (e) {
      state.lines = null;
    }
  }

  // ============================================================
  //  ボタン
  // ============================================================
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
    $("#reveal").hidden = true;
    show("screen-title");
  });

  const peek = $("#peek");
  const setPeek = (on) => {
    peek.checked = on;
    document.body.classList.toggle("peek", on);
  };
  peek.addEventListener("change", () => setPeek(peek.checked));
  setPeek(params.get("peek") === "1");

  fillGuideTable();
  countLines();
})();
