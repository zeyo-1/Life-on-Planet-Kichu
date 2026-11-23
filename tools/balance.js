// ============================================================
//  バランス確認用スクリプト
//  使い方: node tools/balance.js [人数]
//  data.js の数字を変えたあと、各国の平均寿命などがどうなるかを確かめられます。
//  GitHub Actions でも公開前にこれを動かして、壊れていないか確認しています。
// ============================================================
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const site = path.join(__dirname, "..", "site");
const code = ["data.js", "story.js", "sim.js"].map((f) => fs.readFileSync(path.join(site, f), "utf8")).join("\n");
const ctx = { performance, console, Math };
vm.createContext(ctx);
vm.runInContext(code + "\nthis.KICHU = KICHU; this.STORY = STORY; this.KichuSim = KichuSim;", ctx);

const n = Number(process.argv[2] || 10000);
const { summary, ms } = ctx.KichuSim.simulateMany(n, 2026);

console.log(`${n}匹を ${ms.toFixed(0)}ms で計算しました\n`);
console.log("国            人数   平均寿命  学校   5さい未満  65さい以上");
for (const c of summary.byCountry) {
  console.log(
    c.name.padEnd(8, "　"),
    String(c.count).padStart(6),
    (c.avgAge.toFixed(1) + "さい").padStart(9),
    ((c.school * 100).toFixed(0) + "%").padStart(5),
    ((c.under5 * 100).toFixed(1) + "%").padStart(9),
    ((c.over65 * 100).toFixed(0) + "%").padStart(9)
  );
}
console.log(`\n全体の平均寿命 ${summary.avgAge.toFixed(1)}さい`);
console.log("寿命の分布（10さいごと）", summary.bins.join(" "));
console.log("\n称号の数");
for (const t of ctx.STORY.titles) {
  const k = summary.titles[t.id] || 0;
  console.log("  " + t.name.padEnd(16, "　"), String(k).padStart(5), ((k / n) * 100).toFixed(2) + "%");
}

// おかしな結果になっていないかの確認
const problems = [];
for (const c of summary.byCountry) {
  if (!Number.isFinite(c.avgAge)) problems.push(`${c.name} の平均寿命が計算できません`);
  else if (c.avgAge < 1 || c.avgAge > 120) problems.push(`${c.name} の平均寿命 ${c.avgAge.toFixed(1)} がおかしいです`);
}
if (problems.length) {
  console.error("\n問題が見つかりました:\n- " + problems.join("\n- "));
  process.exit(1);
}
console.log("\nOK：シミュレーションは正常に動いています");
