// ============================================================
//  イラスト（SVG）
//  国ごとの風景、年れいで変わる空、モンスターを描きます。
//  一生を「1日の空」で表します：生まれた日は夜明け、年をとると夕焼けに。
// ============================================================

const KichuScene = (() => {
  const INK = "#231942";
  const BODY = ["#7ED6C0", "#FF9EB5", "#FFD166", "#9FB4FF", "#C59BFF", "#8EE07A", "#FFA766", "#66C7F4", "#F78FD6", "#B8E986"];
  const ACCENT = ["#FF6F7D", "#4C7DF0", "#2FA36B", "#9A5CD0", "#E08A2E", "#19A7C4", "#FFB300"];
  const SPECIES_IDS = ["purun", "moko", "tsuno", "gyoro", "pata"];
  let uid = 0;

  // ---------- 見た目（人生番号から決まる。シミュレーションの乱数とは別） ----------
  function lookFor(seed, salt, species) {
    const r = KichuSim.makeRandom((seed * 977 + salt * 7717 + 13) >>> 0);
    const body = BODY[Math.floor(r() * BODY.length)];
    let accent = ACCENT[Math.floor(r() * ACCENT.length)];
    const sp = species || SPECIES_IDS[Math.floor(r() * SPECIES_IDS.length)];
    return { species: sp, body, accent };
  }

  // ---------- モンスター1匹（足もとが原点） ----------
  const SHAPE = {
    purun: { top: -80, eye: -40 },
    moko: { top: -78, eye: -44 },
    tsuno: { top: -76, eye: -46 },
    gyoro: { top: -86, eye: -50 },
    pata: { top: -76, eye: -42 },
  };

  function bodyShape(look) {
    const { body, accent } = look;
    const st = `stroke="${INK}" stroke-width="3" stroke-linejoin="round"`;
    switch (look.species) {
      case "purun":
        return `<path d="M-40 0 C-46 -52 -26 -80 0 -80 C26 -80 46 -52 40 0 C24 6 10 2 0 4 C-10 2 -24 6 -40 0Z" fill="${body}" ${st}/>
          <ellipse cx="-17" cy="-58" rx="8" ry="12" fill="#fff" opacity=".55" transform="rotate(25 -17 -58)"/>`;
      case "moko": {
        let fluff = "";
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          fluff += `<circle cx="${(Math.cos(a) * 33).toFixed(1)}" cy="${(-40 + Math.sin(a) * 33).toFixed(1)}" r="11"/>`;
        }
        return `<ellipse cx="-14" cy="-3" rx="10" ry="6" fill="${accent}" ${st}/><ellipse cx="14" cy="-3" rx="10" ry="6" fill="${accent}" ${st}/>
          <g fill="${body}" ${st}>${fluff}</g><circle cx="0" cy="-40" r="34" fill="${body}"/>`;
      }
      case "tsuno":
        return `<path d="M-20 -70 L-26 -94 L-8 -74Z" fill="${accent}" ${st}/><path d="M20 -70 L26 -94 L8 -74Z" fill="${accent}" ${st}/>
          <ellipse cx="-15" cy="-2" rx="11" ry="6" fill="${body}" ${st}/><ellipse cx="15" cy="-2" rx="11" ry="6" fill="${body}" ${st}/>
          <rect x="-34" y="-76" width="68" height="74" rx="28" fill="${body}" ${st}/>
          <ellipse cx="0" cy="-20" rx="20" ry="13" fill="#fff" opacity=".4"/>`;
      case "gyoro":
        return `<ellipse cx="-14" cy="-2" rx="10" ry="6" fill="${accent}" ${st}/><ellipse cx="14" cy="-2" rx="10" ry="6" fill="${accent}" ${st}/>
          <path d="M0 -86 C32 -86 42 -40 38 -16 C36 -2 -36 -2 -38 -16 C-42 -40 -32 -86 0 -86Z" fill="${body}" ${st}/>`;
      case "pata":
        return `<g class="wing wing-l"><path d="M-30 -50 C-62 -76 -74 -40 -58 -28 C-50 -22 -38 -30 -30 -36Z" fill="${accent}" ${st}/></g>
          <g class="wing wing-r"><path d="M30 -50 C62 -76 74 -40 58 -28 C50 -22 38 -30 30 -36Z" fill="${accent}" ${st}/></g>
          <ellipse cx="-13" cy="-3" rx="9" ry="5" fill="${accent}" ${st}/><ellipse cx="13" cy="-3" rx="9" ry="5" fill="${accent}" ${st}/>
          <circle cx="0" cy="-40" r="35" fill="${body}" ${st}/>`;
    }
    return "";
  }

  function face(look, mood) {
    const s = SHAPE[look.species];
    const y = s.eye;
    let eyes;
    if (look.species === "gyoro") {
      eyes = `<circle cx="0" cy="${y}" r="16" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="2" cy="${y + 1}" r="7.5" fill="${INK}"/><circle cx="5" cy="${y - 3}" r="2.6" fill="#fff"/>`;
    } else {
      eyes = [-12, 12]
        .map((x) => `<circle cx="${x}" cy="${y}" r="7.5" fill="#fff" stroke="${INK}" stroke-width="2.5"/><circle cx="${x + 1.5}" cy="${y + 1}" r="3.8" fill="${INK}"/><circle cx="${x + 3}" cy="${y - 1.5}" r="1.4" fill="#fff"/>`)
        .join("");
    }
    const my = y + (look.species === "gyoro" ? 26 : 16);
    const mouth =
      mood === "happy"
        ? `<path d="M-9 ${my} Q0 ${my + 10} 9 ${my}" fill="${INK}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`
        : mood === "sad"
        ? `<path d="M-7 ${my + 5} Q0 ${my - 2} 7 ${my + 5}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`
        : `<path d="M-6 ${my + 1} Q0 ${my + 5} 6 ${my + 1}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    const cheeks = look.species === "gyoro" ? "" : `<ellipse cx="-24" cy="${y + 11}" rx="6" ry="4" fill="#FF6F7D" opacity=".45"/><ellipse cx="24" cy="${y + 11}" rx="6" ry="4" fill="#FF6F7D" opacity=".45"/>`;
    return eyes + cheeks + mouth;
  }

  function antenna(look, mood) {
    const top = SHAPE[look.species].top;
    const color = mood === "happy" ? "#FFD23F" : mood === "sad" ? "#8FA3FF" : "#8EF0CF";
    return `<path d="M0 ${top + 2} Q2 ${top - 10} 7 ${top - 18}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <circle class="bulb" cx="7" cy="${top - 21}" r="6" fill="${color}" stroke="${INK}" stroke-width="2.5"/>`;
  }

  function hat(look, kind) {
    const s = SHAPE[look.species];
    const t = s.top;
    const e = s.eye;
    const st = `stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"`;
    switch (kind) {
      case "chef":
        return `<g transform="translate(-8 0)"><rect x="-16" y="${t - 14}" width="32" height="16" rx="3" fill="#fff" ${st}/>
          <circle cx="-10" cy="${t - 22}" r="11" fill="#fff" ${st}/><circle cx="10" cy="${t - 22}" r="11" fill="#fff" ${st}/><circle cx="0" cy="${t - 30}" r="12" fill="#fff" ${st}/></g>`;
      case "headphones":
        return `<path d="M-34 ${e - 4} C-34 ${t - 16} 34 ${t - 16} 34 ${e - 4}" fill="none" stroke="${INK}" stroke-width="6"/>
          <rect x="-44" y="${e - 14}" width="14" height="22" rx="6" fill="#FF6F7D" ${st}/><rect x="30" y="${e - 14}" width="14" height="22" rx="6" fill="#FF6F7D" ${st}/>`;
      case "glasses":
        if (look.species === "gyoro") return `<circle cx="0" cy="${e}" r="21" fill="none" stroke="${INK}" stroke-width="3.5"/>`;
        return `<g fill="none" stroke="${INK}" stroke-width="3"><circle cx="-12" cy="${e}" r="11"/><circle cx="12" cy="${e}" r="11"/><path d="M-1 ${e} H1"/></g>`;
      case "goggles":
        return `<rect x="-36" y="${e - 24}" width="72" height="8" rx="4" fill="#4C7DF0" ${st}/>
          <circle cx="-12" cy="${e - 20}" r="9" fill="#B6F0FF" ${st}/><circle cx="12" cy="${e - 20}" r="9" fill="#B6F0FF" ${st}/>`;
      case "propeller":
        return `<path d="M-22 ${t + 6} A22 18 0 0 1 22 ${t + 6}Z" fill="#FFD23F" ${st}/><path d="M0 ${t - 12} V${t - 2}" stroke="${INK}" stroke-width="3"/>
          <g class="prop" style="transform-origin: 0px ${t - 13}px"><ellipse cx="-12" cy="${t - 13}" rx="12" ry="4" fill="#FF6F7D" ${st}/><ellipse cx="12" cy="${t - 13}" rx="12" ry="4" fill="#4C7DF0" ${st}/></g>`;
      case "explorer":
        return `<ellipse cx="0" cy="${t + 2}" rx="42" ry="9" fill="#D9B27C" ${st}/><path d="M-22 ${t + 2} C-22 ${t - 22} 22 ${t - 22} 22 ${t + 2}Z" fill="#E8C795" ${st}/>
          <rect x="-22" y="${t - 6}" width="44" height="6" fill="#9A5CD0"/>`;
      case "cap":
        return `<path d="M-26 ${t + 8} C-26 ${t - 16} 26 ${t - 16} 26 ${t + 8}Z" fill="#4C7DF0" ${st}/><path d="M18 ${t + 6} H44 C44 ${t + 12} 30 ${t + 13} 18 ${t + 11}Z" fill="#2E5BC9" ${st}/>
          <rect x="-8" y="${t - 6}" width="14" height="9" rx="1.5" fill="#fff" ${st}/>`;
      case "headband":
        return `<rect x="-36" y="${e - 24}" width="72" height="9" rx="4" fill="#FF6F7D" ${st}/><path d="M34 ${e - 20} l14 -6 l-2 12z" fill="#FF6F7D" ${st}/>`;
      case "nurse":
        return `<path d="M-18 ${t + 6} L-14 ${t - 12} H14 L18 ${t + 6}Z" fill="#fff" ${st}/><path d="M-2 ${t - 7} h4 v4 h4 v4 h-4 v4 h-4 v-4 h-4 v-4 h4z" fill="#2FA36B"/>`;
      case "bandana":
        return `<path d="M-34 ${e - 22} C-20 ${e - 32} 20 ${e - 32} 34 ${e - 22} L32 ${e - 14} C18 ${e - 22} -18 ${e - 22} -32 ${e - 14}Z" fill="${look.accent}" ${st}/>
          <path d="M32 ${e - 18} l12 4 l-8 8z" fill="${look.accent}" ${st}/>`;
      case "crown":
        return `<path d="M-20 ${t + 2} L-22 ${t - 18} L-10 ${t - 8} L0 ${t - 22} L10 ${t - 8} L22 ${t - 18} L20 ${t + 2}Z" fill="#FFD23F" ${st}/>`;
    }
    return "";
  }

  function elderBits(look) {
    const e = SHAPE[look.species].eye;
    return `<path d="M-20 ${e - 13} q6 -5 12 0 M8 ${e - 13} q6 -5 12 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
      <path d="M38 -44 Q48 -50 46 -40 L42 0" fill="none" stroke="#8B5A2B" stroke-width="5" stroke-linecap="round"/>`;
  }

  function egg(look) {
    return `<path d="M0 -70 C26 -70 38 -30 36 -14 C34 2 -34 2 -36 -14 C-38 -30 -26 -70 0 -70Z" fill="#FFF8E8" stroke="${INK}" stroke-width="3"/>
      <circle cx="-14" cy="-22" r="7" fill="${look.body}"/><circle cx="16" cy="-14" r="5" fill="${look.body}"/><circle cx="8" cy="-46" r="6" fill="${look.body}"/>
      <path d="M-30 -42 l8 -7 l7 7 l8 -8 l8 8 l8 -7 l8 7" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="-8" cy="-56" r="4.5" fill="${INK}"/><circle cx="8" cy="-56" r="4.5" fill="${INK}"/>
      <circle cx="-6.5" cy="-57.5" r="1.4" fill="#fff"/><circle cx="9.5" cy="-57.5" r="1.4" fill="#fff"/>`;
  }

  // stage: egg / baby / child / teen / adult / elder
  function monster(look, stage, mood, hatKind) {
    if (stage === "egg") return `<g class="mon">${egg(look)}</g>`;
    const scale = { baby: 0.48, child: 0.66, teen: 0.84, adult: 1, elder: 0.96 }[stage] || 1;
    const showHat = (stage === "adult" || stage === "elder") && hatKind && hatKind !== "none";
    return `<g class="mon" transform="scale(${scale})">${bodyShape(look)}${antenna(look, mood)}${face(look, mood)}${
      stage === "elder" ? elderBits(look) : ""
    }${showHat ? hat(look, hatKind) : ""}</g>`;
  }

  function mofu() {
    return `<g class="mon"><path d="M-14 -30 l-4 -12 l10 6Z M14 -30 l4 -12 l-10 6Z" fill="#fff" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <ellipse cx="0" cy="-16" rx="22" ry="17" fill="#fff" stroke="${INK}" stroke-width="3"/>
      <path d="M-8 -18 q3 3 6 0 M2 -18 q3 3 6 0" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
      <ellipse cx="-13" cy="-11" rx="4" ry="2.5" fill="#FF9EB5"/><ellipse cx="13" cy="-11" rx="4" ry="2.5" fill="#FF9EB5"/></g>`;
  }

  function stageOf(age) {
    if (age <= 0) return "egg";
    if (age < 4) return "baby";
    if (age < 13) return "child";
    if (age < 20) return "teen";
    if (age < 65) return "adult";
    return "elder";
  }
  function moodOf(happy) {
    return happy >= 62 ? "happy" : happy >= 38 ? "ok" : "sad";
  }

  // ---------- 空 ----------
  const SKY = [
    { t: 0.0, top: "#F59BB4", bottom: "#FFE1A1", night: 0.1 },
    { t: 0.12, top: "#6CC0F5", bottom: "#D3F0FF", night: 0 },
    { t: 0.5, top: "#3FA3EE", bottom: "#BDE6FF", night: 0 },
    { t: 0.72, top: "#5B98E3", bottom: "#FFE0A6", night: 0 },
    { t: 0.86, top: "#6A4DB0", bottom: "#FF9670", night: 0.25 },
    { t: 0.97, top: "#2C2266", bottom: "#7C4E9E", night: 0.7 },
    { t: 1.1, top: "#130E33", bottom: "#352A6E", night: 1 },
  ];
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, k) => {
    const A = hex(a);
    const B = hex(b);
    return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, "0")).join("");
  };
  function skyAt(t) {
    t = Math.max(0, Math.min(1.1, t));
    for (let i = 0; i < SKY.length - 1; i++) {
      const a = SKY[i];
      const b = SKY[i + 1];
      if (t <= b.t) {
        const k = (t - a.t) / (b.t - a.t);
        return { top: mix(a.top, b.top, k), bottom: mix(a.bottom, b.bottom, k), night: a.night + (b.night - a.night) * k };
      }
    }
    return SKY[SKY.length - 1];
  }

  // ---------- 国ごとの風景 ----------
  function windows(x, y, w, h, cols, rows) {
    let s = "";
    const gx = w / cols;
    const gy = h / rows;
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++) {
        if ((i * 7 + j * 3) % 5 === 0) continue;
        s += `<rect class="lit" x="${(x + i * gx + gx * 0.25).toFixed(1)}" y="${(y + j * gy + gy * 0.25).toFixed(1)}" width="${(gx * 0.5).toFixed(1)}" height="${(gy * 0.45).toFixed(1)}" rx="1.5"/>`;
      }
    return s;
  }
  function building(x, y, w, h, color, cols, rows, roof) {
    return `<rect x="${x}" y="${y}" width="${w}" height="${340 - y}" rx="4" fill="${color}" stroke="${INK}" stroke-width="2.5"/>${
      roof ? `<rect x="${x + w / 2 - 3}" y="${y - 18}" width="6" height="18" fill="${INK}"/><circle cx="${x + w / 2}" cy="${y - 20}" r="4" fill="#FF6F7D"/>` : ""
    }<g fill="#FFF2B3">${windows(x + 4, y + 8, w - 8, h - 16, cols, rows)}</g>`;
  }
  function roundTree(x, y, r, c) {
    return `<rect x="${x - 4}" y="${y}" width="8" height="${r + 6}" fill="#8B5A2B" stroke="${INK}" stroke-width="2"/><circle cx="${x}" cy="${y - r * 0.4}" r="${r}" fill="${c}" stroke="${INK}" stroke-width="2.5"/>`;
  }
  function pine(x, y, h, c) {
    return `<rect x="${x - 3}" y="${y - 8}" width="6" height="12" fill="#7A4B25"/><path d="M${x} ${y - h} L${x + h * 0.38} ${y - 4} L${x - h * 0.38} ${y - 4}Z" fill="${c}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;
  }
  function palm(x, y, s = 1) {
    return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 C4 -30 2 -60 10 -86" fill="none" stroke="#9A6A3A" stroke-width="9" stroke-linecap="round"/>
      <g fill="#3FAE5A" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round">
      <path d="M10 -86 C-10 -98 -34 -92 -42 -78 C-24 -86 -8 -84 10 -86Z"/><path d="M10 -86 C30 -100 54 -94 60 -80 C42 -88 26 -86 10 -86Z"/>
      <path d="M10 -86 C0 -70 -6 -56 -4 -44 C4 -58 8 -72 10 -86Z"/><path d="M10 -86 C24 -72 30 -60 30 -48 C22 -62 16 -74 10 -86Z"/></g>
      <circle cx="6" cy="-82" r="5" fill="#8B5A2B"/><circle cx="14" cy="-80" r="5" fill="#8B5A2B"/></g>`;
  }

  const LANDS = {
    yutaka() {
      let far = "";
      [[0, 232, 60], [55, 205, 46], [96, 246, 70], [160, 188, 42], [198, 226, 62], [520, 214, 56], [572, 182, 42], [610, 236, 68], [672, 198, 52], [718, 228, 82]].forEach(
        ([x, y, w]) => (far += `<rect x="${x}" y="${y}" width="${w}" height="${340 - y}" />`)
      );
      return `<g fill="#AFC2F0" opacity=".85">${far}</g>
        <g><rect x="402" y="96" width="18" height="244" fill="#8EA6EA" stroke="${INK}" stroke-width="2.5"/>
          <ellipse cx="411" cy="150" rx="48" ry="11" fill="none" stroke="#FFD23F" stroke-width="6"/>
          <circle cx="411" cy="92" r="13" fill="#FF6F7D" stroke="${INK}" stroke-width="2.5"/><path d="M411 79 V60" stroke="${INK}" stroke-width="3"/></g>
        ${building(40, 216, 70, 120, "#6E8BE0", 3, 5, true)}${building(118, 250, 56, 86, "#8B7BE0", 2, 4)}
        ${building(226, 196, 74, 140, "#5C78D6", 3, 6)}${building(476, 230, 64, 106, "#7A92E6", 3, 4, true)}
        ${building(612, 206, 80, 130, "#6A7FD9", 3, 5)}${building(702, 252, 70, 84, "#8E86E3", 3, 3)}
        <rect x="0" y="262" width="800" height="7" fill="#5568B8" stroke="${INK}" stroke-width="2"/>
        <g class="tram"><rect x="0" y="244" width="96" height="22" rx="11" fill="#FF6F7D" stroke="${INK}" stroke-width="2.5"/>
          <g fill="#FFF2B3"><rect x="14" y="250" width="14" height="8" rx="2"/><rect x="36" y="250" width="14" height="8" rx="2"/><rect x="58" y="250" width="14" height="8" rx="2"/></g></g>
        <rect x="0" y="322" width="800" height="14" fill="#7FCF84" stroke="${INK}" stroke-width="2"/>
        <rect x="0" y="336" width="800" height="84" fill="#C4CDE3"/>
        <g fill="#fff">${[40, 160, 280, 400, 520, 640, 760].map((x) => `<rect x="${x}" y="404" width="50" height="5" rx="2"/>`).join("")}</g>
        <g>${[90, 700].map((x) => `<rect x="${x}" y="290" width="5" height="46" fill="${INK}"/><circle class="lamp" cx="${x + 2.5}" cy="288" r="8" fill="#FFF2B3" stroke="${INK}" stroke-width="2"/>`).join("")}</g>`;
    },
    midori() {
      let stripes = "";
      for (let i = 0; i < 6; i++) stripes += `<path d="M${470 + i * 26} 300 Q${560 + i * 20} 282 ${800} ${286 + i * 8}" fill="none" stroke="${i % 2 ? "#9AD88A" : "#5FB35E"}" stroke-width="7"/>`;
      return `<path d="M0 262 Q120 196 260 248 T520 238 T800 236 V420 H0Z" fill="#A6DD9C" stroke="${INK}" stroke-width="2"/>
        <path d="M0 300 Q180 248 380 292 T800 282 V420 H0Z" fill="#7CC97A" stroke="${INK}" stroke-width="2.5"/>${stripes}
        <g><path d="M588 302 L612 302 L606 208 L594 208Z" fill="#FFF6E5" stroke="${INK}" stroke-width="2.5"/><rect x="596" y="270" width="8" height="14" rx="3" fill="#8B5A2B"/>
          <g class="blades" style="transform-origin: 600px 206px">${[0, 90, 180, 270]
            .map((a) => `<rect x="596" y="150" width="8" height="56" rx="3" fill="#FFF6E5" stroke="${INK}" stroke-width="2" transform="rotate(${a} 600 206)"/>`)
            .join("")}<circle cx="600" cy="206" r="6" fill="#FF6F7D" stroke="${INK}" stroke-width="2"/></g></g>
        <g><rect x="120" y="262" width="74" height="52" fill="#E86A52" stroke="${INK}" stroke-width="2.5"/><path d="M112 264 L157 228 L202 264Z" fill="#B8443A" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
          <rect x="146" y="284" width="22" height="30" fill="#FFF6E5" stroke="${INK}" stroke-width="2"/><rect class="lit" x="128" y="274" width="12" height="10" fill="#FFF2B3"/></g>
        ${roundTree(60, 300, 24, "#4FAE5C")}${roundTree(250, 296, 20, "#5DBB63")}${roundTree(730, 300, 26, "#4FAE5C")}
        <rect x="0" y="336" width="800" height="84" fill="#6DC46B"/>
        <path d="M0 420 Q200 360 330 340 Q420 330 520 340 Q700 360 800 420Z" fill="#E9D39A" opacity=".7"/>
        <g>${[[60, 360], [140, 392], [640, 372], [720, 398], [250, 404]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#FFD23F" stroke="${INK}" stroke-width="1.5"/>`).join("")}</g>`;
    },
    hateno(id) {
      return `<defs><linearGradient id="${id}sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5CCDE6"/><stop offset="1" stop-color="#1D82B8"/></linearGradient></defs>
        <rect x="0" y="250" width="800" height="170" fill="url(#${id}sea)"/>
        <path d="M60 252 Q110 220 170 252Z M560 252 Q640 200 720 252Z" fill="#3FA28F" stroke="${INK}" stroke-width="2"/>
        <g><rect x="652" y="196" width="18" height="46" fill="#fff" stroke="${INK}" stroke-width="2.5"/><rect x="652" y="208" width="18" height="10" fill="#FF6F7D"/><rect x="652" y="228" width="18" height="10" fill="#FF6F7D"/>
          <path d="M648 196 L661 182 L674 196Z" fill="#FF6F7D" stroke="${INK}" stroke-width="2.5"/><circle class="lamp" cx="661" cy="190" r="5" fill="#FFF2B3"/></g>
        <g class="waves" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6">
          ${[270, 292, 314].map((y, i) => `<path d="M${-40 + i * 30} ${y} q20 -8 40 0 t40 0 M${260 + i * 40} ${y + 4} q20 -8 40 0 t40 0 M${560 + i * 20} ${y} q20 -8 40 0 t40 0"/>`).join("")}</g>
        <g class="boat"><path d="M440 286 H520 L506 304 H454Z" fill="#E08A2E" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/><path d="M480 284 V230 L516 280Z" fill="#fff" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/><path d="M478 284 V236 L452 280Z" fill="#FFD23F" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/></g>
        <path d="M0 328 Q200 300 420 326 T800 334 V420 H0Z" fill="#F4DA9E" stroke="${INK}" stroke-width="2.5"/>
        ${palm(110, 332, 1)}${palm(735, 340, 0.85)}
        <g fill="#FF9EB5" stroke="${INK}" stroke-width="1.5">${[[220, 392], [610, 380], [690, 404]].map(([x, y]) => `<path d="M${x} ${y} l6 -8 l6 8z"/>`).join("")}</g>`;
    },
    sunaoka() {
      return `<path d="M0 262 H70 L92 222 H190 L212 262 H330 L344 240 H420 L438 262 H560 L582 214 H690 L712 262 H800 V420 H0Z" fill="#EFAE77" stroke="${INK}" stroke-width="2"/>
        <path d="M0 300 Q150 250 320 294 T640 284 T800 294 V420 H0Z" fill="#F6CB84" stroke="${INK}" stroke-width="2.5"/>
        <ellipse cx="640" cy="318" rx="70" ry="14" fill="#5CC6D6" stroke="${INK}" stroke-width="2.5"/>${palm(604, 318, 0.7)}${palm(690, 320, 0.6)}
        <g fill="#5DAE54" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round">
          <rect x="190" y="256" width="20" height="70" rx="10"/><rect x="170" y="276" width="14" height="30" rx="7"/><path d="M184 296 H192" stroke-width="6" stroke="#5DAE54"/>
          <rect x="216" y="268" width="14" height="26" rx="7"/><path d="M208 288 H218" stroke-width="6" stroke="#5DAE54"/></g>
        <circle cx="200" cy="252" r="6" fill="#FF6F7D" stroke="${INK}" stroke-width="2"/>
        <g><path d="M440 330 V300 A34 34 0 0 1 508 300 V330Z" fill="#FFF1DA" stroke="${INK}" stroke-width="2.5"/><rect x="464" y="306" width="18" height="24" rx="9" fill="#9A6A3A"/><circle class="lit" cx="452" cy="302" r="5" fill="#FFF2B3"/><circle class="lit" cx="496" cy="302" r="5" fill="#FFF2B3"/></g>
        <rect x="0" y="336" width="800" height="84" fill="#F1C27D"/>
        <path d="M0 420 Q240 350 520 376 T800 360 V420Z" fill="#E9B26A" opacity=".8"/>
        <g fill="#C98E55" stroke="${INK}" stroke-width="1.5">${[[90, 380], [560, 404], [740, 390]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="10" ry="6"/>`).join("")}</g>`;
    },
    morinooku() {
      let trees = "";
      [[30, 312, 70], [70, 318, 56], [250, 314, 64], [520, 316, 60], [560, 312, 74], [770, 318, 66]].forEach(([x, y, h]) => (trees += pine(x, y, h, "#2E8152")));
      return `<path d="M0 268 L90 186 L170 248 L262 166 L362 252 L462 182 L562 248 L662 172 L762 238 L800 220 V420 H0Z" fill="#4E8F73" stroke="${INK}" stroke-width="2"/>
        <g><rect x="640" y="190" width="18" height="40" fill="#DCD3F0" stroke="${INK}" stroke-width="2"/><rect x="664" y="176" width="22" height="54" fill="#E6DEF7" stroke="${INK}" stroke-width="2"/><rect x="692" y="196" width="16" height="34" fill="#DCD3F0" stroke="${INK}" stroke-width="2"/>
          <path d="M636 190 L649 168 L662 190Z M660 176 L675 148 L690 176Z M688 196 L700 178 L712 196Z" fill="#9A5CD0" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
          <path d="M675 148 V132" stroke="${INK}" stroke-width="2"/><path d="M675 132 l14 5 l-14 5z" fill="#FFD23F"/><rect class="lit" x="671" y="196" width="8" height="10" fill="#FFF2B3"/></g>
        <path d="M0 300 Q200 268 400 296 T800 290 V420 H0Z" fill="#3E9A62" stroke="${INK}" stroke-width="2.5"/>
        <path d="M330 296 C350 320 290 340 320 362 C346 380 300 400 320 420 H372 C350 400 392 380 368 360 C340 338 400 320 380 296Z" fill="#6CC6E6" stroke="${INK}" stroke-width="2"/>
        ${trees}${roundTree(140, 312, 22, "#4CAF6A")}${roundTree(700, 316, 20, "#4CAF6A")}
        <g><rect x="436" y="300" width="30" height="34" rx="6" fill="#FFF3DF" stroke="${INK}" stroke-width="2.5"/><path d="M420 304 C420 272 482 272 482 304Z" fill="#E8574F" stroke="${INK}" stroke-width="2.5"/>
          <g fill="#fff"><circle cx="438" cy="290" r="4"/><circle cx="456" cy="284" r="3.5"/><circle cx="470" cy="296" r="3"/></g><rect class="lit" x="445" y="312" width="12" height="12" rx="6" fill="#FFF2B3"/></g>
        <rect x="0" y="336" width="800" height="84" fill="#55A86C"/>
        <path d="M0 420 Q200 380 400 400 T800 390 V420Z" fill="#479A5E"/>
        <g fill="#2E8152">${[[60, 380], [180, 402], [620, 386], [720, 404]].map(([x, y]) => `<path d="M${x} ${y} l4 -12 l4 12 l4 -9 l4 9z"/>`).join("")}</g>`;
    },
  };

  function starsMarkup() {
    const r = KichuSim.makeRandom(42);
    let s = "";
    for (let i = 0; i < 46; i++) {
      const x = (r() * 800).toFixed(0);
      const y = (r() * 210).toFixed(0);
      const size = (0.8 + r() * 1.8).toFixed(1);
      s += `<circle class="${i % 5 === 0 ? "twinkle" : ""}" cx="${x}" cy="${y}" r="${size}" style="animation-delay:${(r() * 3).toFixed(1)}s"/>`;
    }
    return s;
  }

  // ---------- 風景をつくる ----------
  function create(extraClass = "") {
    const id = "ks" + ++uid;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 800 420");
    svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    svg.setAttribute("class", "scene " + extraClass);
    svg.setAttribute("role", "img");
    svg.innerHTML = `<defs>
        <linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop class="sky-top" offset="0"/><stop class="sky-bottom" offset="1"/></linearGradient>
        <radialGradient id="${id}glow"><stop offset="0" stop-color="#FFF3B0" stop-opacity=".9"/><stop offset="1" stop-color="#FFF3B0" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="800" height="420" fill="url(#${id}sky)"/>
      <g class="stars" fill="#FFF6D5">${starsMarkup()}</g>
      <g class="moons"><circle cx="640" cy="70" r="22" fill="#FFF3C4" stroke="${INK}" stroke-width="2.5"/><circle cx="632" cy="64" r="5" fill="#EBDDA0"/>
        <circle cx="692" cy="104" r="11" fill="#FFC9E0" stroke="${INK}" stroke-width="2.5"/></g>
      <g class="sun"><circle r="70" fill="url(#${id}glow)"/><circle r="30" fill="#FFD84D" stroke="${INK}" stroke-width="3"/></g>
      <g class="land"></g>
      <g class="cast"></g>
      <rect class="dusk" width="800" height="420" fill="#140C3A" pointer-events="none"/>`;

    const api = {
      el: svg,
      country: null,
      castKey: "",
      setCountry(cid) {
        if (api.country === cid) return;
        api.country = cid;
        svg.querySelector(".land").innerHTML = LANDS[cid] ? LANDS[cid](id) : "";
      },
      setTime(t) {
        const sky = skyAt(t);
        svg.querySelector(".sky-top").setAttribute("stop-color", sky.top);
        svg.querySelector(".sky-bottom").setAttribute("stop-color", sky.bottom);
        svg.style.setProperty("--night", sky.night.toFixed(3));
        const k = Math.max(0, Math.min(1, (t - 0.02) / 0.92));
        const x = 70 + k * 660;
        const y = 300 - Math.sin(Math.PI * k) * 230;
        const sun = svg.querySelector(".sun");
        sun.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
        sun.style.opacity = t > 1.0 ? 0 : 1;
        svg.querySelector(".sun circle:last-child").setAttribute("fill", mix("#FFE36E", "#FF8A4D", Math.max(0, (t - 0.6) / 0.35)));
      },
      // L：シミュレーションの life。見た目は人生番号から決める
      setCast(L, ageOverride) {
        const age = ageOverride != null ? ageOverride : L.age;
        const stage = stageOf(age);
        const mood = moodOf(L.happy);
        const hatKind = L.job ? STORY.jobs[L.job].hat : null;
        const key = [L.species, stage, mood, hatKind, L.partner, L.kids, L.pet, L.seed].join("|");
        if (key === api.castKey) return;
        api.castKey = key;
        const me = lookFor(L.seed, 0, L.species);
        let s = "";
        const place = (x, inner, cls = "") =>
          `<g transform="translate(${x} 396) scale(1.3)"><ellipse cx="0" cy="0" rx="32" ry="6" fill="#000" opacity=".16"/><g class="bob ${cls}">${inner}</g></g>`;
        if (L.pet) s += place(228, mofu(), "bob-fast");
        if (L.partner) {
          const pl = lookFor(L.seed, 1);
          s += place(440, monster(pl, stageOf(Math.max(age, 20)), "happy", null));
        }
        for (let i = 0; i < L.kids; i++) {
          const kl = lookFor(L.seed, 2 + i);
          s += place(530 + i * 62, monster(kl, age - 30 - i * 3 > 20 ? "adult" : "child", "happy", null), "bob-fast");
        }
        s += place(330, monster(me, stage, mood, hatKind), "me");
        svg.querySelector(".cast").innerHTML = s;
      },
    };
    return api;
  }

  // ---------- タイトル画面の惑星 ----------
  function planet() {
    const species = SPECIES_IDS;
    let crowd = "";
    species.forEach((sp, i) => {
      const a = -Math.PI / 2 + (i - 2) * 0.34;
      const x = Math.cos(a) * 150;
      const y = Math.sin(a) * 150;
      const deg = (a * 180) / Math.PI + 90;
      const look = lookFor(7 + i, 3, sp);
      crowd += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${deg.toFixed(1)}) scale(.55)"><g class="bob" style="animation-delay:${i * 0.25}s">${monster(look, "adult", "happy", null)}</g></g>`;
    });
    return `<svg class="planet-art" viewBox="-260 -260 520 520" role="img" aria-label="惑星きちゅうと、そこに住むモンスターたち">
      <defs><radialGradient id="plG" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#7BE3C6"/><stop offset=".6" stop-color="#3CC6A5"/><stop offset="1" stop-color="#1E8F7A"/></radialGradient>
        <clipPath id="plC"><circle r="150"/></clipPath></defs>
      <circle r="178" fill="#3CC6A5" opacity=".12"/>
      <g class="orbit orbit-a"><circle cx="0" cy="-222" r="18" fill="#FFF3C4" stroke="${INK}" stroke-width="3"/></g>
      <g class="orbit orbit-b"><circle cx="205" cy="0" r="10" fill="#FFC9E0" stroke="${INK}" stroke-width="3"/></g>
      <circle r="150" fill="url(#plG)" stroke="${INK}" stroke-width="4"/>
      <g clip-path="url(#plC)">
        <path d="M-120 -40 C-90 -90 -30 -80 -20 -40 C-10 -10 -60 10 -90 0 C-120 -10 -130 -20 -120 -40Z" fill="#A6EBCF" stroke="${INK}" stroke-width="3"/>
        <path d="M20 20 C60 -10 130 10 126 60 C122 100 60 110 40 80 C24 60 -4 50 20 20Z" fill="#A6EBCF" stroke="${INK}" stroke-width="3"/>
        <path d="M-70 70 C-50 56 -24 70 -30 92 C-36 112 -70 114 -80 98 C-90 86 -84 78 -70 70Z" fill="#A6EBCF" stroke="${INK}" stroke-width="3"/>
        <g class="clouds" fill="#fff" opacity=".85"><ellipse cx="-40" cy="-100" rx="40" ry="10"/><ellipse cx="80" cy="-30" rx="34" ry="8"/><ellipse cx="-110" cy="40" rx="30" ry="8"/><ellipse cx="40" cy="120" rx="44" ry="9"/></g>
        <circle cx="60" cy="60" r="160" fill="${INK}" opacity=".12"/>
      </g>
      ${crowd}
    </svg>`;
  }

  return { create, monster, lookFor, stageOf, moodOf, planet };
})();
