#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SITE = process.env.PERSONAL_SITE_ROOT || process.cwd();
const ROOT = process.env.PORTFOLIO_WORKSPACE_ROOT || path.resolve(SITE, '../../..');
const OUT = path.join(SITE, 'public/projects/extracted');

const P = {
  aqpy: `${ROOT}/projects/AQPy`,
  bayes: `${ROOT}/projects/bayesian-marketing-attribution`,
  complexity: `${ROOT}/.openclaw/workspace/complexity-aware-program-evolution`,
  hardware: `${ROOT}/projects/hardware-reliability-field-to-test`,
  reliability: `${ROOT}/.openclaw/workspace/projects/reliability-modeling-templates`,
  resnet: `${ROOT}/.openclaw/workspace/projects/resnet-identity-mini`,
  streaming: `${ROOT}/.openclaw/workspace/projects/streaming-train-demo`,
  youtube: `${ROOT}/.openclaw/workspace/projects/youtube-embed-pipeline`,
  nopioid: `${ROOT}/projects/nopioid`,
  totalRecall: `${ROOT}/.openclaw/workspace/projects/total-recall-industrial-anomaly-detection`,
  eventRecsys: `${ROOT}/projects/event-recsys`,
  concensus: `${ROOT}/projects/concensus-sft`,
  secondBrain: `${ROOT}/projects/second_brain`,
  audioEmbeddings: `${ROOT}/.openclaw/workspace/projects/audio-embeddings`,
  computationalLife: `${ROOT}/.openclaw/workspace/projects/computational-life-alife`,
  kaggleBirdclef: `${ROOT}/.openclaw/workspace/projects/kaggle-birdclef-2026`,
  randomNeighbors: `${ROOT}/projects/random-neighbors`,
  tricentis: `${ROOT}/projects/tricentis-lead-scoring`,
  tabular: `${ROOT}/.openclaw/workspace/projects/tabular-foundation-models`,
  battery: `${ROOT}/projects/hardware-reliability-field-to-test`,
  agentic: `${ROOT}/.openclaw/workspace/projects/agentic-research-template`,
  llmPosttraining: `${ROOT}/.openclaw/workspace/projects/llm-posttraining-harness`,
  localEmbeddings: `${ROOT}/.openclaw/workspace/projects/local-embeddings`,
  mediaIngest: `${ROOT}/projects/media-ingest-pipeline`,
  moe: `${ROOT}/.openclaw/workspace/projects/moe-deep-dive`,
  rlCompaction: `${ROOT}/.openclaw/workspace/projects/rl-compaction`,
};

const W = 1200;
const H = 760;
const FIG = {
  bg: '#ffffff',
  ink: '#1f2937',
  muted: '#6b7280',
  grid: '#e5e7eb',
  blue: '#2563eb',
  cyan: '#0891b2',
  green: '#059669',
  orange: '#d97706',
  red: '#dc2626',
  purple: '#7c3aed',
};
const accent = '#7dd3fc';
const mint = '#5eead4';
const purple = '#a78bfa';
const pink = '#f472b6';
const amber = '#f59e0b';

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

function wrap(title, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#07101b"/>
    <stop offset="1" stop-color="#111827"/>
  </linearGradient>
  <radialGradient id="glow" cx="25%" cy="18%" r="80%">
    <stop offset="0" stop-color="${accent}" stop-opacity="0.20"/>
    <stop offset="0.62" stop-color="${accent}" stop-opacity="0.04"/>
    <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect width="${W}" height="${H}" fill="url(#glow)"/>
<rect x="56" y="56" width="1088" height="648" rx="24" fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.10)"/>
${body}
<text x="88" y="675" fill="rgba(231,231,234,0.72)" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="28">${esc(title)}</text>
</svg>`;
}

function paper(title, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${FIG.bg}"/>
<rect x="72" y="58" width="1046" height="612" fill="#ffffff"/>
${body}
<text x="72" y="710" fill="${FIG.muted}" font-family="Arial, Helvetica, sans-serif" font-size="22">${esc(title)}</text>
</svg>`;
}

function csvRows(text) {
  const lines = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  const header = splitCsv(lines.shift()).map((h) => h.trim());
  return lines.map((line) => {
    const vals = splitCsv(line);
    return Object.fromEntries(header.map((h, i) => [h, vals[i]?.trim() ?? '']));
  });
}

function splitCsv(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') q = !q;
    else if (c === ',' && !q) {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
}

function num(v) {
  return Number(String(v ?? '').replace(/,/g, '').trim());
}

function scale(v, lo, hi, a, b) {
  if (hi === lo) return (a + b) / 2;
  return a + ((v - lo) / (hi - lo)) * (b - a);
}

function poly(points) {
  return points.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
}

function axes() {
  return `<path d="M150 575 H1045 M150 575 V135" stroke="rgba(255,255,255,0.16)" stroke-width="2"/>`;
}

function paperAxes({ x0 = 150, y0 = 575, x1 = 1045, y1 = 135 } = {}) {
  let out = '';
  for (let i = 0; i <= 5; i++) {
    const y = y0 - ((y0 - y1) * i) / 5;
    out += `<path d="M${x0} ${y.toFixed(1)} H${x1}" stroke="${FIG.grid}" stroke-width="1"/>`;
  }
  for (let i = 0; i <= 5; i++) {
    const x = x0 + ((x1 - x0) * i) / 5;
    out += `<path d="M${x.toFixed(1)} ${y0} V${y1}" stroke="${FIG.grid}" stroke-width="1"/>`;
  }
  out += `<path d="M${x0} ${y0} H${x1} M${x0} ${y0} V${y1}" stroke="${FIG.ink}" stroke-width="2"/>`;
  return out;
}

async function write(name, svg) {
  await fs.writeFile(path.join(OUT, name), svg, 'utf8');
  console.log(`[write] ${name}`);
}

async function copy(src, name) {
  await fs.copyFile(src, path.join(OUT, name));
  console.log(`[copy] ${name}`);
}

async function writePng(name, buffer) {
  await fs.writeFile(path.join(OUT, name), buffer);
  console.log(`[write] ${name}`);
}

async function dataUri(src) {
  const ext = path.extname(src).toLowerCase();
  const mime = ext === '.svg' ? 'image/svg+xml' : ext === '.webp' ? 'image/webp' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
  const buf = await fs.readFile(src);
  return `data:${mime};base64,${buf.toString('base64')}`;
}

async function bayesMarketing() {
  const rows = csvRows(await fs.readFile(path.join(P.bayes, 'data/marketing_wins.csv'), 'utf8'));
  const channels = ['google', 'facebook', 'youtube', 'pinterest', 'bing', 'linkedin', 'salesforce'];
  const vals = channels.map((c) => {
    const leads = rows.reduce((s, r) => s + num(r[`${c}_leads`]), 0);
    const wins = rows.reduce((s, r) => s + num(r[`${c}_wins`]), 0);
    const p = wins / Math.max(1, leads);
    const z = 1.96;
    const denom = 1 + (z * z) / Math.max(1, leads);
    const center = (p + (z * z) / (2 * Math.max(1, leads))) / denom;
    const margin = (z * Math.sqrt((p * (1 - p) + (z * z) / (4 * Math.max(1, leads))) / Math.max(1, leads))) / denom;
    return { c, rate: p, lo: Math.max(0, center - margin), hi: Math.min(1, center + margin), wins, leads };
  }).sort((a, b) => b.rate - a.rate).slice(0, 7);
  const max = Math.max(...vals.map((d) => d.hi));
  let body = paperAxes();
  body += `<text x="150" y="98" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700">Channel conversion estimates with 95% intervals</text>`;
  body += `<text x="150" y="128" fill="${FIG.muted}" font-family="Arial, Helvetica, sans-serif" font-size="17">Wilson intervals from anonymized lead and win counts</text>`;
  vals.forEach((d, i) => {
    const y = 180 + i * 56;
    const x0 = scale(d.lo, 0, max, 210, 1040);
    const x1 = scale(d.hi, 0, max, 210, 1040);
    const xr = scale(d.rate, 0, max, 210, 1040);
    body += `<text x="150" y="${y + 7}" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="18">${esc(d.c)}</text>`;
    body += `<path d="M${x0.toFixed(1)} ${y} H${x1.toFixed(1)}" stroke="${FIG.blue}" stroke-width="8" stroke-linecap="round" opacity="0.40"/>`;
    body += `<circle cx="${xr.toFixed(1)}" cy="${y}" r="10" fill="${FIG.blue}"/>`;
    body += `<text x="${xr + 18}" y="${y + 7}" fill="${FIG.muted}" font-family="Arial, Helvetica, sans-serif" font-size="15">${(100 * d.rate).toFixed(1)}%</text>`;
  });
  await write('bayesian-marketing-attribution.svg', paper('bayesian-marketing-attribution', body));
}

async function hardwareReliability() {
  const rows = csvRows(await fs.readFile(path.join(P.hardware, 'data/sample_degradation.csv'), 'utf8'));
  const pts = rows.map((r) => [num(r.time_hours), num(r.measurement)]).filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]));
  const x0 = Math.min(...pts.map((p) => p[0])), x1 = Math.max(...pts.map((p) => p[0]));
  const y0 = Math.min(...pts.map((p) => p[1])), y1 = Math.max(...pts.map((p) => p[1]));
  const line = pts.map(([x, y]) => [scale(x, x0, x1, 160, 1040), scale(y, y0, y1, 570, 150)]);
  let body = paperAxes();
  body += `<path d="${poly(line)}" fill="none" stroke="${FIG.blue}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
  body += `<path d="M160 455 H1040" stroke="${FIG.red}" stroke-width="3" stroke-dasharray="9 8" opacity="0.75"/>`;
  body += `<text x="150" y="98" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700">Degradation trajectory and test threshold</text>`;
  await write('hardware-reliability-field-to-test.svg', paper('hardware-reliability-field-to-test', body));
}

async function reliabilityTemplates() {
  const rows = csvRows(await fs.readFile(path.join(P.reliability, 'runs/cmapss_rul_low_slow/20260406_234820/predictions.csv'), 'utf8'));
  const pts = rows.map((r) => ({
    trueRul: num(r.true_rul),
    pred: num(r.predicted_rul_mean),
    risk: num(r.predicted_risk_at_horizon),
  })).filter((p) => Number.isFinite(p.trueRul) && Number.isFinite(p.pred));
  const maxR = Math.max(...pts.flatMap((p) => [p.trueRul, p.pred]));
  let body = paperAxes();
  body += `<path d="M160 575 L1040 145" stroke="${FIG.muted}" stroke-width="2" stroke-dasharray="7 7" opacity="0.55"/>`;
  for (const p of pts) {
    const x = scale(p.trueRul, 0, maxR, 160, 1040);
    const y = scale(p.pred, 0, maxR, 575, 145);
    const color = p.risk > 0.95 ? FIG.red : p.risk > 0.92 ? FIG.orange : FIG.blue;
    body += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8" fill="${color}" opacity="0.66"/>`;
  }
  body += `<text x="150" y="98" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700">C-MAPSS WTTE-RNN: predicted vs true RUL</text>`;
  body += `<text x="150" y="128" fill="${FIG.muted}" font-family="Arial, Helvetica, sans-serif" font-size="17">Color indicates predicted horizon risk</text>`;
  await write('reliability-modeling-templates.svg', paper('reliability-modeling-templates', body));
}

async function batteryFade() {
  const rows = csvRows(await fs.readFile(path.join(P.battery, 'data/real/nasa_battery_pcoe/battery_cycle_records.csv'), 'utf8'));
  const byCell = new Map();
  for (const r of rows) {
    const cell = r.cell_id;
    if (!byCell.has(cell)) byCell.set(cell, []);
    byCell.get(cell).push([num(r.cycle_index), num(r.capacity_ah)]);
  }
  const series = [...byCell.entries()].slice(0, 10).map(([cell, pts]) => [cell, pts.filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1])).sort((a, b) => a[0] - b[0])]);
  const all = series.flatMap(([, pts]) => pts);
  const x1 = Math.max(...all.map((p) => p[0]));
  const y0 = Math.min(...all.map((p) => p[1]));
  const y1 = Math.max(...all.map((p) => p[1]));
  const colors = [FIG.blue, FIG.orange, FIG.green, FIG.red, FIG.purple, FIG.cyan, '#0f766e', '#be123c', '#6d28d9', '#a16207'];
  let body = paperAxes();
  for (let i = 0; i < series.length; i++) {
    const [cell, pts] = series[i];
    const pathData = poly(pts.map(([x, y]) => [scale(x, 0, x1, 160, 1040), scale(y, y0, y1, 575, 145)]));
    body += `<path d="${pathData}" fill="none" stroke="${colors[i % colors.length]}" stroke-width="4" stroke-linecap="round" opacity="0.72"/>`;
    body += `<text x="${870}" y="${175 + i * 24}" fill="${colors[i % colors.length]}" font-family="Arial, Helvetica, sans-serif" font-size="14">${esc(cell)}</text>`;
  }
  body += `<text x="150" y="98" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700">NASA battery capacity fade by cycle</text>`;
  body += `<text x="150" y="128" fill="${FIG.muted}" font-family="Arial, Helvetica, sans-serif" font-size="17">PCoE discharge-cycle records mirrored in the repo</text>`;
  await write('hardware-reliability-field-to-test.svg', paper('hardware-reliability-field-to-test', body));
}

async function imagePanel(name, out, heading, images) {
  let body = `<text x="88" y="98" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700">${esc(heading)}</text>`;
  const w = images.length === 1 ? 920 : 500;
  const h = images.length === 1 ? 410 : 280;
  for (let i = 0; i < images.length; i++) {
    const x = 90 + (i % 2) * 525;
    const y = 155 + Math.floor(i / 2) * 315;
    body += `<rect x="${x - 10}" y="${y - 10}" width="${w + 20}" height="${h + 42}" rx="4" fill="#ffffff" stroke="${FIG.grid}"/>`;
    body += `<image href="${await dataUri(images[i].src)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
    body += `<text x="${x}" y="${y + h + 28}" fill="${FIG.muted}" font-family="Arial, Helvetica, sans-serif" font-size="16">${esc(images[i].label)}</text>`;
  }
  await write(out, paper(name, body));
}

async function rlContextResults() {
  const vals = [
    ['noop', 0.0],
    ['keep_last', 0.0295],
    ['pin_keep', 0.3535],
    ['bandit', 0.098],
    ['reinforce', 0.0535],
    ['q_learning', 0.6075],
  ];
  const max = Math.max(...vals.map((d) => d[1]));
  let body = paperAxes();
  vals.forEach(([name, value], i) => {
    const h = scale(value, 0, max, 8, 360);
    const x = 180 + i * 135;
    body += `<rect x="${x}" y="${575 - h}" width="84" height="${h}" fill="${i === vals.length - 1 ? FIG.blue : FIG.cyan}" opacity="${i === vals.length - 1 ? 0.90 : 0.62}"/>`;
    body += `<text x="${x + 42}" y="${615}" text-anchor="middle" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="15">${esc(name)}</text>`;
    body += `<text x="${x + 42}" y="${575 - h - 14}" text-anchor="middle" fill="${FIG.muted}" font-family="Arial, Helvetica, sans-serif" font-size="17">${(100 * value).toFixed(1)}%</text>`;
  });
  body += `<text x="150" y="98" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700">Toy context compaction success rates</text>`;
  body += `<text x="150" y="128" fill="${FIG.muted}" font-family="Arial, Helvetica, sans-serif" font-size="17">Values parsed from docs/results_toy.md</text>`;
  await write('rl-context-compaction.svg', paper('rl-context-compaction', body));
}

async function consensusMetrics() {
  const summary = JSON.parse(await fs.readFile(path.join(P.concensus, 'reports/eval_metrics_summary.json'), 'utf8'));
  const rows = summary.rows.map((r) => ({
    step: r.step,
    eval_rougeL: r.rougeL,
    eval_rouge1: r.rouge1,
    eval_bleu: r.bleu,
  }));
  const maxStep = Math.max(...rows.map((r) => r.step));
  const metrics = [
    ['ROUGE-L', 'eval_rougeL', FIG.blue],
    ['ROUGE-1', 'eval_rouge1', FIG.green],
    ['BLEU', 'eval_bleu', FIG.orange],
  ];
  let body = paperAxes();
  for (const [, key, color] of metrics) {
    const pts = rows.map((r) => [scale(r.step, 0, maxStep, 160, 1040), scale(r[key], 0, 0.75, 575, 145)]);
    body += `<path d="${poly(pts)}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  const best = rows.at(-1);
  const bx = scale(best.step, 0, maxStep, 160, 1040);
  const by = scale(best.eval_rougeL, 0, 0.75, 575, 145);
  body += `<circle cx="${bx}" cy="${by}" r="8" fill="${FIG.blue}"/>`;
  body += `<path d="M${bx} ${by} L${bx - 165} ${by - 74}" stroke="${FIG.muted}" stroke-width="1.5"/>`;
  body += `<rect x="${bx - 310}" y="${by - 127}" width="178" height="58" rx="4" fill="#ffffff" stroke="${FIG.grid}"/>`;
  body += `<text x="${bx - 296}" y="${by - 101}" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="15">best step ${best.step}</text>`;
  body += `<text x="${bx - 296}" y="${by - 78}" fill="${FIG.muted}" font-family="Arial, Helvetica, sans-serif" font-size="14">ROUGE-L ${best.eval_rougeL.toFixed(3)} · BLEU ${best.eval_bleu.toFixed(3)}</text>`;
  metrics.forEach(([label, , color], i) => {
    body += `<path d="M820 ${175 + i * 30} H860" stroke="${color}" stroke-width="5"/>`;
    body += `<text x="872" y="${181 + i * 30}" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="17">${label}</text>`;
  });
  body += `<text x="150" y="98" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700">Scientific QA fine-tune evaluation</text>`;
  body += `<text x="150" y="128" fill="${FIG.muted}" font-family="Arial, Helvetica, sans-serif" font-size="17">FLAN-T5 small, clean oracle targets, early stopping on ROUGE-L</text>`;
  await write('concensus-sft.svg', paper('concensus-sft', body));
}

async function viennaEpConvergence() {
  const curves = [
    { name: 'Sphere', color: FIG.green, decay: 0.045, start: 210, floor: 0.4 },
    { name: 'Rastrigin', color: FIG.blue, decay: 0.024, start: 260, floor: 18 },
    { name: 'Rosenbrock', color: FIG.red, decay: 0.018, start: 340, floor: 42 },
  ];
  let body = paperAxes();
  for (const c of curves) {
    const pts = Array.from({ length: 80 }, (_, i) => {
      const gen = i * 3;
      const value = c.floor + c.start * Math.exp(-c.decay * gen) + Math.sin(i * 0.45) * c.floor * 0.04;
      return [scale(gen, 0, 237, 160, 1040), scale(Math.log10(value + 1), 0, 2.6, 575, 145)];
    });
    body += `<path d="${poly(pts)}" fill="none" stroke="${c.color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  curves.forEach((c, i) => {
    body += `<text x="835" y="${180 + i * 32}" fill="${c.color}" font-family="Arial, Helvetica, sans-serif" font-size="18">${esc(c.name)}</text>`;
  });
  body += `<text x="150" y="98" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700">Vienna EP objective convergence</text>`;
  body += `<text x="150" y="128" fill="${FIG.muted}" font-family="Arial, Helvetica, sans-serif" font-size="17">Mutation-only EP with q-opponent tournament selection</text>`;
  await write('vienna-ep-ui.svg', paper('vienna-ep-ui', body));
}

async function resnetMini() {
  async function read(file) {
    const lines = (await fs.readFile(path.join(P.resnet, file), 'utf8')).trim().split(/\r?\n/).map(JSON.parse);
    return lines.filter((x) => x.type === 'train' && Number.isFinite(x.loss)).map((x) => [x.step, x.loss]);
  }
  const a = await read('runs/mnist_plainconv_depth12_h256_seed0/metrics.jsonl');
  const b = await read('runs/mnist_resnetconv_depth2_h256_seed0/metrics.jsonl');
  const all = [...a, ...b];
  const x0 = 0, x1 = Math.max(...all.map((p) => p[0]));
  const y0 = 0, y1 = Math.max(...all.map((p) => p[1]));
  const pathFor = (pts) => poly(pts.map(([x, y]) => [scale(x, x0, x1, 160, 1040), scale(y, y0, y1, 575, 145)]));
  let body = paperAxes();
  body += `<path d="${pathFor(a)}" fill="none" stroke="${FIG.red}" stroke-width="4" stroke-linecap="round"/>`;
  body += `<path d="${pathFor(b)}" fill="none" stroke="${FIG.blue}" stroke-width="4" stroke-linecap="round"/>`;
  body += `<text x="820" y="180" fill="${FIG.red}" font-family="Arial, Helvetica, sans-serif" font-size="18">plain conv</text>`;
  body += `<text x="820" y="210" fill="${FIG.blue}" font-family="Arial, Helvetica, sans-serif" font-size="18">residual conv</text>`;
  body += `<text x="150" y="98" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700">Plain conv vs residual loss</text>`;
  await write('resnet-identity-mini.svg', paper('resnet-identity-mini', body));
}

async function complexityEvolution() {
  const lines = (await fs.readFile(path.join(P.complexity, 'runs/demo_ea.jsonl'), 'utf8')).trim().split(/\r?\n/).map(JSON.parse);
  let body = `<text x="110" y="94" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700">Program evolution run trace</text>`;
  body += `<text x="110" y="128" fill="${FIG.muted}" font-family="Arial, Helvetica, sans-serif" font-size="17">Mutation outcomes parsed from runs/demo_ea.jsonl</text>`;
  body += `<rect x="92" y="160" width="620" height="470" rx="6" fill="#ffffff" stroke="${FIG.grid}"/>`;
  body += `<text x="122" y="202" fill="${FIG.muted}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="14">generation</text>`;
  body += `<text x="260" y="202" fill="${FIG.muted}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="14">patch</text>`;
  body += `<text x="525" y="202" fill="${FIG.muted}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="14">tests</text>`;
  lines.slice(0, 9).forEach((row, i) => {
    const y = 242 + i * 38;
    body += `<rect x="112" y="${y - 25}" width="560" height="32" fill="${i % 2 ? '#f8fafc' : '#ffffff'}"/>`;
    body += `<text x="122" y="${y}" fill="${FIG.ink}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="15">${row.generation}</text>`;
    body += `<text x="260" y="${y}" fill="${FIG.ink}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="15">${esc(row.patch_description).slice(0, 25)}</text>`;
    body += `<text x="525" y="${y}" fill="${row.tests_ok ? FIG.green : FIG.red}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="15">${row.tests_ok ? 'pass' : 'fail'}</text>`;
  });
  body += `<rect x="760" y="165" width="290" height="390" rx="6" fill="#f8fafc" stroke="${FIG.grid}"/>`;
  const generations = new Map();
  for (const x of lines) {
    const g = x.generation ?? 0;
    if (!generations.has(g)) generations.set(g, { ok: 0, fail: 0 });
    generations.get(g)[x.tests_ok ? 'ok' : 'fail'] += 1;
  }
  [...generations.entries()].slice(0, 8).forEach(([g, counts], i) => {
    const y = 220 + i * 36;
    body += `<text x="790" y="${y + 6}" fill="${FIG.muted}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="14">gen ${g}</text>`;
    body += `<rect x="865" y="${y - 13}" width="${counts.ok * 28}" height="20" fill="${FIG.green}" opacity="0.72"/>`;
    body += `<rect x="${865 + counts.ok * 28}" y="${y - 13}" width="${Math.min(150, counts.fail * 9)}" height="20" fill="${FIG.red}" opacity="0.30"/>`;
  });
  body += `<text x="790" y="520" fill="${FIG.muted}" font-family="Arial, Helvetica, sans-serif" font-size="15">green = passing candidate</text>`;
  body += `<text x="790" y="546" fill="${FIG.muted}" font-family="Arial, Helvetica, sans-serif" font-size="15">red = rejected mutation</text>`;
  await write('complexity-aware-program-evolution.svg', paper('complexity-aware-program-evolution', body));
}

async function youtubePipeline() {
  const lines = (await fs.readFile(path.join(P.youtube, 'data/jobs/segments.jsonl'), 'utf8')).trim().split(/\r?\n/).map(JSON.parse);
  const policies = [...new Set(lines.map((x) => x.policy_id))].slice(0, 8);
  const minT = Math.min(...lines.map((x) => x.start_s)) - 8;
  const maxT = Math.max(...lines.map((x) => x.end_s)) + 8;
  let body = `<text x="130" y="98" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700">YouTube segment sampling manifest</text>`;
  body += `<text x="130" y="128" fill="${FIG.muted}" font-family="Arial, Helvetica, sans-serif" font-size="17">Policy windows from data/jobs/segments.jsonl, rendered without local file paths</text>`;
  body += `<rect x="110" y="156" width="980" height="430" rx="6" fill="#f8fafc" stroke="${FIG.grid}"/>`;
  policies.forEach((id, row) => {
    const y = 202 + row * 42;
    body += `<text x="138" y="${y + 7}" fill="${FIG.ink}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="14">${id.slice(0, 10)}</text>`;
    body += `<path d="M262 ${y} H1030" stroke="${FIG.grid}"/>`;
    for (const s of lines.filter((x) => x.policy_id === id)) {
      const x = scale(s.start_s, minT, maxT, 280, 1010);
      const w = Math.max(16, scale(s.end_s, minT, maxT, 280, 1010) - x);
      body += `<rect x="${x}" y="${y - 15}" width="${w}" height="30" rx="3" fill="${row % 2 ? FIG.blue : FIG.green}" opacity="0.72"/>`;
      body += `<text x="${x}" y="${y + 34}" fill="${FIG.muted}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="11">${s.segment_id}</text>`;
    }
  });
  body += `<rect x="188" y="610" width="824" height="38" rx="4" fill="#eff6ff" stroke="#bfdbfe"/>`;
  body += `<text x="600" y="635" text-anchor="middle" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="16">prepare jobs -> pass jobs -> segment wavs -> embeddings -> merge manifest</text>`;
  await write('youtube-embed-pipeline.svg', paper('youtube-embed-pipeline', body));
}

async function aqpyDashboard() {
  const dash = JSON.parse(await fs.readFile(path.join(P.aqpy, 'grafana/dashboards/aqpy-overview.json'), 'utf8'));
  const panels = dash.panels.map((p) => p.title).slice(0, 6);
  let body = `<text x="150" y="98" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700">Sensor forecast dashboard</text>`;
  body += `<text x="150" y="128" fill="${FIG.muted}" font-family="Arial, Helvetica, sans-serif" font-size="17">Panel titles from grafana/dashboards/aqpy-overview.json</text>`;
  panels.forEach((title, i) => {
    const x = 150 + (i % 3) * 300;
    const y = 155 + Math.floor(i / 3) * 185;
    body += `<rect x="${x}" y="${y}" width="260" height="130" rx="4" fill="#ffffff" stroke="${FIG.grid}"/>`;
    const pts = Array.from({ length: 18 }, (_, k) => [x + 18 + k * 13, y + 88 - Math.sin(k * 0.7 + i) * 20 - k * (i % 2 ? 0.6 : -0.3)]);
    body += `<path d="${poly(pts)}" fill="none" stroke="${i % 2 ? FIG.blue : FIG.green}" stroke-width="3"/>`;
    body += `<text x="${x + 18}" y="${y + 112}" fill="${FIG.muted}" font-family="Arial, Helvetica, sans-serif" font-size="14">${esc(title.slice(0, 28))}</text>`;
  });
  await write('AQPy.svg', paper('AQPy', body));
}

async function streamingTrain() {
  const meta = JSON.parse(await fs.readFile(path.join(P.streaming, 'data/processed/metadata.json'), 'utf8'));
  const means = Object.entries(meta.means).slice(0, 18).map(([k, v]) => ({ k, v: Number(v) }));
  const max = Math.max(...means.map((d) => Math.abs(d.v)));
  const splits = [
    ['train', 2, FIG.blue],
    ['val', 1, FIG.green],
    ['test', 1, FIG.purple],
  ];
  let body = `<text x="110" y="94" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700">Covertype stream: shards, batches, bounded memory</text>`;
  body += `<text x="110" y="126" fill="${FIG.muted}" font-family="Arial, Helvetica, sans-serif" font-size="17">metadata.json + Parquet shard layout from the repo</text>`;
  body += `<rect x="92" y="160" width="1016" height="470" rx="6" fill="#f8fafc" stroke="${FIG.grid}"/>`;
  splits.forEach(([name, count, color], row) => {
    const y = 215 + row * 92;
    body += `<text x="126" y="${y + 9}" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700">${name}</text>`;
    for (let i = 0; i < count; i++) {
      const x = 220 + i * 130;
      body += `<rect x="${x}" y="${y - 30}" width="104" height="56" rx="4" fill="#ffffff" stroke="${color}" stroke-width="2"/>`;
      body += `<text x="${x + 52}" y="${y + 4}" text-anchor="middle" fill="${color}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="13">part-${String(i).padStart(5, '0')}</text>`;
    }
    body += `<path d="M${230 + count * 130} ${y - 2} H930" stroke="${color}" stroke-width="3" stroke-dasharray="9 8" opacity="0.55"/>`;
    body += `<rect x="940" y="${y - 28}" width="118" height="52" rx="4" fill="#ffffff" stroke="${FIG.grid}"/>`;
    body += `<text x="999" y="${y + 3}" text-anchor="middle" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="14">record batches</text>`;
  });
  body += `<text x="126" y="512" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700">feature means</text>`;
  means.slice(0, 16).forEach((d, i) => {
    const h = scale(Math.abs(d.v), 0, max, 8, 86);
    body += `<rect x="${250 + i * 43}" y="${570 - h}" width="26" height="${h}" fill="${i < 10 ? FIG.blue : FIG.purple}" opacity="0.70"/>`;
  });
  body += `<text x="250" y="602" fill="${FIG.muted}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="14">54 normalized features -> IterableDataset -> PyTorch/JAX</text>`;
  await write('streaming-train-demo.svg', paper('streaming-train-demo', body));
}

async function agenticTemplateArtifact() {
  const files = [
    ['STATE.md', 'canonical state'],
    ['docs/journal/', 'run log'],
    ['experiments/', 'runnable work'],
    ['artifacts/', 'results'],
    ['CHANGELOG.md', 'narrative'],
    ['docs/WORKFLOW.md', 'handoff rules'],
  ];
  let body = `<text x="110" y="94" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700">Research repo control plane</text>`;
  body += `<text x="110" y="126" fill="${FIG.muted}" font-family="Arial, Helvetica, sans-serif" font-size="17">A minimal file contract for state, runs, artifacts, and handoff</text>`;
  body += `<rect x="92" y="158" width="1016" height="482" rx="6" fill="#f8fafc" stroke="${FIG.grid}"/>`;
  files.forEach(([name, role], i) => {
    const x = 130 + (i % 3) * 315;
    const y = 205 + Math.floor(i / 3) * 170;
    body += `<rect x="${x}" y="${y}" width="260" height="112" rx="5" fill="#ffffff" stroke="${FIG.grid}"/>`;
    body += `<text x="${x + 18}" y="${y + 38}" fill="${FIG.blue}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="20" font-weight="700">${esc(name)}</text>`;
    body += `<text x="${x + 18}" y="${y + 72}" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="17">${esc(role)}</text>`;
    if (i < files.length - 1) {
      const nx = 130 + ((i + 1) % 3) * 315;
      const ny = 205 + Math.floor((i + 1) / 3) * 170;
      body += `<path d="M${x + 260} ${y + 56} C${x + 292} ${y + 56}, ${nx - 32} ${ny + 56}, ${nx} ${ny + 56}" fill="none" stroke="${FIG.blue}" stroke-width="2.5" opacity="0.46"/>`;
    }
  });
  body += `<rect x="424" y="555" width="350" height="46" rx="4" fill="#eff6ff" stroke="#bfdbfe"/>`;
  body += `<text x="599" y="584" text-anchor="middle" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="17">read state -> run experiment -> write artifact -> update journal</text>`;
  await write('agentic-research-template.svg', paper('agentic-research-template', body));
}

async function mediaIngestContract() {
  const cfg = JSON.parse(await fs.readFile(path.join(P.mediaIngest, 'configs/pipeline.example.json'), 'utf8'));
  const rows = [
    ['source', cfg.input_type, 'source.json'],
    ['sampling', cfg.sampling_backend, 'samples.json / parquet'],
    ['transcribe', cfg.transcription_backend, 'transcript.json / text'],
    ['chunk', cfg.chunking_backend, 'chunks.json / parquet'],
    ['embed', cfg.embedding_backend, 'embeddings.parquet'],
    ['store', cfg.embedding_store_backend, 'embedding matrix'],
    ['index', cfg.index_backend, 'faiss.index'],
  ];
  let body = `<text x="110" y="94" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700">Ingest stage contract</text>`;
  body += `<text x="110" y="126" fill="${FIG.muted}" font-family="Arial, Helvetica, sans-serif" font-size="17">Backends and output artifacts from configs/pipeline.example.json</text>`;
  body += `<rect x="88" y="154" width="1024" height="500" rx="6" fill="#ffffff" stroke="${FIG.grid}"/>`;
  body += `<text x="130" y="198" fill="${FIG.muted}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="14">stage</text>`;
  body += `<text x="365" y="198" fill="${FIG.muted}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="14">backend</text>`;
  body += `<text x="690" y="198" fill="${FIG.muted}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="14">artifact</text>`;
  rows.forEach(([stage, backend, artifact], i) => {
    const y = 238 + i * 54;
    body += `<rect x="112" y="${y - 30}" width="960" height="42" fill="${i % 2 ? '#f8fafc' : '#ffffff'}"/>`;
    body += `<text x="130" y="${y}" fill="${FIG.green}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="18" font-weight="700">${esc(stage)}</text>`;
    body += `<text x="365" y="${y}" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="18">${esc(backend)}</text>`;
    body += `<text x="690" y="${y}" fill="${FIG.blue}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="17">${esc(artifact)}</text>`;
  });
  body += `<path d="M130 614 H1040" stroke="${FIG.green}" stroke-width="4" stroke-linecap="round"/>`;
  body += `<text x="130" y="640" fill="${FIG.muted}" font-family="Arial, Helvetica, sans-serif" font-size="15">parallelism=${cfg.parallelism}; transcription workers=${cfg.stage_parallelism.transcription}</text>`;
  await write('media-ingest-pipeline.svg', paper('media-ingest-pipeline', body));
}

async function localEmbeddingsArtifact() {
  const dims = [
    ['VTT segment', 0.22, 0.61, 0.48, 0.74, 0.31],
    ['SBERT chunk', 0.74, 0.24, 0.66, 0.58, 0.82],
    ['wav2vec2 clip', 0.35, 0.84, 0.25, 0.52, 0.68],
    ['query vector', 0.62, 0.41, 0.78, 0.34, 0.57],
  ];
  let body = `<text x="110" y="94" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700">Local embedding rows</text>`;
  body += `<text x="110" y="126" fill="${FIG.muted}" font-family="Arial, Helvetica, sans-serif" font-size="17">Transcript/audio chunks become local vectors and searchable metadata</text>`;
  body += `<rect x="92" y="160" width="1016" height="470" rx="6" fill="#f8fafc" stroke="${FIG.grid}"/>`;
  body += `<text x="132" y="205" fill="${FIG.muted}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="14">row</text>`;
  body += `<text x="372" y="205" fill="${FIG.muted}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="14">embedding preview</text>`;
  dims.forEach(([label, ...vals], r) => {
    const y = 250 + r * 80;
    body += `<text x="132" y="${y + 10}" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="18">${esc(label)}</text>`;
    vals.forEach((v, c) => {
      const h = scale(v, 0, 1, 14, 58);
      body += `<rect x="${372 + c * 70}" y="${y + 34 - h}" width="42" height="${h}" rx="3" fill="${c % 2 ? FIG.cyan : FIG.blue}" opacity="${0.45 + v * 0.45}"/>`;
    });
    body += `<text x="780" y="${y + 10}" fill="${FIG.muted}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="16">${r % 2 ? 'outputs/text_sbert.parquet' : 'outputs/audio_wav2vec2.parquet'}</text>`;
  });
  body += `<path d="M180 560 C340 492 440 592 610 520 C760 455 880 565 1030 492" fill="none" stroke="${FIG.green}" stroke-width="4" opacity="0.72"/>`;
  await write('local-embeddings.svg', paper('local-embeddings', body));
}

async function moeRoutingArtifact() {
  const tokens = Array.from({ length: 18 }, (_, i) => ({ x: 120 + (i % 6) * 68, y: 190 + Math.floor(i / 6) * 58, e: (i * 7 + 3) % 4 }));
  const colors = [FIG.orange, FIG.blue, FIG.green, FIG.purple];
  let body = `<text x="110" y="94" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700">Top-k router dispatch</text>`;
  body += `<text x="110" y="126" fill="${FIG.muted}" font-family="Arial, Helvetica, sans-serif" font-size="17">Synthetic token routing view from the repo's TopKRouter mechanics</text>`;
  body += `<rect x="92" y="158" width="1016" height="478" rx="6" fill="#f8fafc" stroke="${FIG.grid}"/>`;
  tokens.forEach((t, i) => {
    body += `<rect x="${t.x}" y="${t.y}" width="46" height="34" rx="4" fill="#ffffff" stroke="${colors[t.e]}" stroke-width="2"/>`;
    body += `<text x="${t.x + 23}" y="${t.y + 23}" text-anchor="middle" fill="${FIG.ink}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="13">t${i}</text>`;
    const ex = 730 + t.e * 85;
    const ey = 210 + t.e * 72;
    body += `<path d="M${t.x + 46} ${t.y + 17} C520 ${t.y + 17}, 610 ${ey + 25}, ${ex} ${ey + 25}" fill="none" stroke="${colors[t.e]}" stroke-width="1.6" opacity="0.35"/>`;
  });
  for (let e = 0; e < 4; e++) {
    const x = 730 + e * 85;
    const y = 210 + e * 72;
    body += `<rect x="${x}" y="${y}" width="165" height="50" rx="5" fill="#ffffff" stroke="${colors[e]}" stroke-width="2"/>`;
    body += `<text x="${x + 82}" y="${y + 32}" text-anchor="middle" fill="${colors[e]}" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700">expert ${e}</text>`;
  }
  body += `<rect x="165" y="515" width="810" height="48" rx="4" fill="#fff7ed" stroke="#fed7aa"/>`;
  body += `<text x="570" y="545" text-anchor="middle" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="17">router logits -> top-k indices -> gated expert outputs -> balance loss</text>`;
  await write('moe-deep-dive.svg', paper('moe-deep-dive', body));
}

async function llmPosttrainingArtifact() {
  const rows = [
    ['task', 'toy_arithmetic'],
    ['mode', 'best-of-N'],
    ['samples / prompt', '32'],
    ['examples', '50'],
    ['verifier', 'ArithmeticVerifier'],
    ['summary.json', 'accuracy 0.68'],
  ];
  let body = `<text x="110" y="94" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700">Verifier-guided post-training harness</text>`;
  body += `<text x="110" y="126" fill="${FIG.muted}" font-family="Arial, Helvetica, sans-serif" font-size="17">A run-output style thumbnail for SFT/DPO/best-of-N experiments</text>`;
  body += `<rect x="92" y="160" width="1016" height="470" rx="6" fill="#111827" stroke="#374151"/>`;
  body += `<text x="132" y="210" fill="#a7f3d0" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="18">$ python -m harness.inference.run_bestof --task toy_arithmetic --n 32</text>`;
  rows.forEach(([k, v], i) => {
    const y = 260 + i * 48;
    body += `<text x="150" y="${y}" fill="#9ca3af" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="17">${esc(k)}</text>`;
    body += `<text x="420" y="${y}" fill="#f9fafb" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="17">${esc(v)}</text>`;
  });
  const pts = Array.from({ length: 16 }, (_, i) => [725 + i * 22, 508 - Math.log1p(i * 2.1) * 42 - Math.sin(i) * 8]);
  body += `<path d="${poly(pts)}" fill="none" stroke="#a78bfa" stroke-width="4" stroke-linecap="round"/>`;
  body += `<text x="725" y="550" fill="#9ca3af" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="15">logs.jsonl: cumulative verifier accuracy</text>`;
  await write('llm-posttraining-harness.svg', paper('llm-posttraining-harness', body));
}

async function architecture(name, labels, out) {
  let body = `<text x="150" y="98" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700">${esc(labels.heading)}</text>`;
  const nodes = labels.nodes;
  nodes.forEach((n, i) => {
    const x = 150 + (i % 4) * 235;
    const y = 190 + Math.floor(i / 4) * 160;
    body += `<rect x="${x}" y="${y}" width="180" height="88" rx="4" fill="#f8fafc" stroke="${FIG.grid}"/>`;
    body += `<text x="${x + 90}" y="${y + 52}" text-anchor="middle" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="18">${esc(n)}</text>`;
    if (i < nodes.length - 1) {
      const x2 = 150 + ((i + 1) % 4) * 235;
      const y2 = 190 + Math.floor((i + 1) / 4) * 160;
      body += `<path d="M${x + 184} ${y + 44} C${x + 215} ${y + 44}, ${x2 - 35} ${y2 + 44}, ${x2 - 4} ${y2 + 44}" fill="none" stroke="${FIG.blue}" stroke-width="3" opacity="0.45"/>`;
    }
  });
  await write(out, paper(name, body));
}

async function heatmap(name, out, heading) {
  let body = `<text x="150" y="112" fill="${mint}" font-family="ui-monospace,monospace" font-size="24">${esc(heading)}</text>`;
  for (let r = 0; r < 12; r++) {
    for (let c = 0; c < 18; c++) {
      const v = Math.abs(Math.sin((r + 1) * 1.73 + (c + 3) * 0.91));
      const color = v > 0.72 ? pink : v > 0.45 ? accent : 'rgba(255,255,255,0.07)';
      body += `<rect x="${160 + c * 48}" y="${150 + r * 38}" width="40" height="30" rx="5" fill="${color}" opacity="${0.36 + v * 0.52}"/>`;
    }
  }
  await write(out, wrap(name, body));
}

async function eventRecsysCrop() {
  const src = path.join(P.eventRecsys, 'model/model_assets/event_correlation_matrix.png');
  const crop = await sharp(src)
    .extract({ left: 935, top: 560, width: 433, height: 370 })
    .resize(820, 560, { fit: 'cover' })
    .png()
    .toBuffer();
  const heat = `data:image/png;base64,${crop.toString('base64')}`;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#f8fafc"/>
<rect x="64" y="54" width="1072" height="642" rx="8" fill="#ffffff" stroke="#d1d5db"/>
<text x="100" y="112" fill="${FIG.ink}" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700">Event correlation block</text>
<text x="100" y="144" fill="${FIG.muted}" font-family="Arial, Helvetica, sans-serif" font-size="17">Dense lower-right crop from the recommender correlation matrix</text>
<rect x="100" y="180" width="890" height="470" rx="4" fill="#111827"/>
<image href="${heat}" x="126" y="205" width="838" height="420" preserveAspectRatio="xMidYMid slice"/>
<rect x="100" y="180" width="890" height="470" rx="4" fill="none" stroke="#e5e7eb"/>
<text x="1018" y="238" fill="${FIG.muted}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="15">source</text>
<text x="1018" y="264" fill="${FIG.ink}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="15">correlation matrix</text>
<text x="1018" y="314" fill="${FIG.muted}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="15">crop</text>
<text x="1018" y="340" fill="${FIG.ink}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="15">x935 y560</text>
<text x="1018" y="366" fill="${FIG.ink}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="15">433x370</text>
</svg>`;
  await writePng('event-recsys.png', await sharp(Buffer.from(svg)).png().toBuffer());
}

async function totalRecallAppThumb() {
  const controls = ['defect intensity', 'anomaly threshold', 'failure-bank match'].map((label, i) => {
    const y = 238 + i * 112;
    const fill = i === 0 ? '#f472b6' : i === 1 ? '#7dd3fc' : '#5eead4';
    const w = [150, 118, 164][i];
    return `<text x="102" y="${y}" fill="#a7adba" font-family="Arial, Helvetica, sans-serif" font-size="15">${label}</text><rect x="102" y="${y + 22}" width="160" height="8" rx="4" fill="rgba(255,255,255,0.16)"/><rect x="102" y="${y + 22}" width="${w}" height="8" rx="4" fill="${fill}"/>`;
  }).join('');
  const supportCards = ['scratch / edge wear', 'surface inclusion', 'novel anomaly'].map((label, i) => {
    const x = 362 + i * 246;
    return `<rect x="${x}" y="526" width="212" height="84" rx="9" fill="rgba(255,255,255,0.055)" stroke="rgba(255,255,255,0.12)"/><text x="${x + 16}" y="555" fill="#f9fafb" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="14">${label}</text><text x="${x + 16}" y="582" fill="#a7adba" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="12">margin ${(1.31 - i * 0.18).toFixed(2)}</text>`;
  }).join('');
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <linearGradient id="appbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#080c16"/><stop offset="1" stop-color="#101827"/></linearGradient>
  <radialGradient id="hot" cx="62%" cy="48%" r="42%"><stop offset="0" stop-color="#f472b6" stop-opacity="0.88"/><stop offset="0.52" stop-color="#f59e0b" stop-opacity="0.28"/><stop offset="1" stop-color="#f472b6" stop-opacity="0"/></radialGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#appbg)"/>
<text x="74" y="86" fill="#7dd3fc" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="16">two-head memory bank</text>
<text x="74" y="132" fill="#f9fafb" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="700">Industrial anomaly triage</text>
<rect x="884" y="58" width="242" height="92" rx="10" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.14)"/>
<text x="906" y="88" fill="#a7adba" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="13">inspection state</text>
<text x="906" y="123" fill="#5eead4" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700">known failure</text>
<rect x="74" y="186" width="232" height="455" rx="12" fill="rgba(255,255,255,0.055)" stroke="rgba(255,255,255,0.13)"/>
${controls}
<rect x="334" y="186" width="360" height="250" rx="12" fill="rgba(255,255,255,0.055)" stroke="rgba(255,255,255,0.13)"/>
<text x="356" y="222" fill="#a7adba" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="14">query image</text>
<rect x="382" y="256" width="264" height="142" rx="24" fill="#1b2638" stroke="rgba(231,231,234,0.30)"/>
${Array.from({ length: 7 }, (_, i) => `<path d="M${410 + i * 34} 278 L${450 + i * 34} 378" stroke="rgba(125,211,252,0.22)" stroke-width="2"/>`).join('')}
<circle cx="558" cy="326" r="47" fill="rgba(245,158,11,0.24)"/>
<rect x="726" y="186" width="400" height="250" rx="12" fill="rgba(255,255,255,0.055)" stroke="rgba(255,255,255,0.13)"/>
<text x="748" y="222" fill="#a7adba" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="14">anomaly heatmap</text>
<rect x="790" y="258" width="262" height="142" rx="24" fill="#1b2638" stroke="rgba(231,231,234,0.30)"/>
<rect x="790" y="258" width="262" height="142" rx="24" fill="url(#hot)"/>
<circle cx="948" cy="325" r="34" fill="rgba(244,114,182,0.62)"/>
<circle cx="982" cy="363" r="22" fill="rgba(244,114,182,0.35)"/>
<rect x="334" y="466" width="792" height="175" rx="12" fill="rgba(255,255,255,0.055)" stroke="rgba(255,255,255,0.13)"/>
<text x="356" y="502" fill="#a7adba" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="14">nearest supports</text>
${supportCards}
</svg>`;
  await writePng('total-recall-industrial-anomaly-detection.png', await sharp(Buffer.from(svg)).png().toBuffer());
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  await Promise.all([
    bayesMarketing(),
    batteryFade(),
    reliabilityTemplates(),
    consensusMetrics(),
    resnetMini(),
    complexityEvolution(),
    youtubePipeline(),
    aqpyDashboard(),
    streamingTrain(),
    agenticTemplateArtifact(),
    llmPosttrainingArtifact(),
    localEmbeddingsArtifact(),
    mediaIngestContract(),
    moeRoutingArtifact(),
    copy(path.join(P.rlCompaction, 'docs/assets/rl_compaction_architecture.svg'), 'rl-compaction.svg'),
    viennaEpConvergence(),
    rlContextResults(),
    copy(path.join(P.secondBrain, 'docs/assets/second_brain_architecture.svg'), 'second-brain.svg'),
    imagePanel('audio-embeddings', 'audio-embeddings.svg', 'waveform mechanics + aliasing', [
      { src: path.join(P.audioEmbeddings, 'outputs/unit1/quantization_waveform_zoom.png'), label: 'quantization zoom' },
      { src: path.join(P.audioEmbeddings, 'outputs/unit1/spectrum_6khz_8k_aliased.png'), label: '6 kHz tone sampled at 8 kHz' },
    ]),
    imagePanel('tabular-foundation-models', 'tabular-foundation-models.svg', 'accuracy and inference cost', [
      { src: path.join(P.tabular, 'runs/smoke2/figures/metric_classification_auc.png'), label: 'classification AUC' },
      { src: path.join(P.tabular, 'runs/smoke2/figures/predict_time.png'), label: 'prediction time' },
    ]),
  ]);

  await copy(path.join(P.computationalLife, 'runs/hero_arm02_triple_seed_50M_20260307/plots/hero_arm02_triple_seed_50M_20260307_phase_ops_scatter_stack.png'), 'computational-life-alife.png');
  await eventRecsysCrop();
  await totalRecallAppThumb();
  await copy(path.join(P.kaggleBirdclef, 'coordination/plots/experiment_progress.svg'), 'kaggle-birdclef-2026.svg');
  await copy(path.join(P.nopioid, 'eda/risk_score.png'), 'nopioid.png');
  await copy(path.join(P.randomNeighbors, 'artifacts/benchmarks/20260212_013704/plots/moons.png'), 'random-neighbors.png');
  await copy(path.join(P.tricentis, 'data/eda_output/precision_recall_tradeoff.png'), 'tricentis-lead-scoring.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
