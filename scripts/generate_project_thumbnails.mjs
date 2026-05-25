#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'public', 'projects');

const projects = [
  ['computational-life-alife', 'soup'],
  ['llm-posttraining-harness', 'posttraining'],
  ['tabular-foundation-models', 'tabular'],
  ['reliability-modeling-templates', 'survival'],
  ['hardware-reliability-field-to-test', 'fieldtest'],
  ['media-ingest-pipeline', 'pipeline'],
  ['youtube-embed-pipeline', 'pipeline'],
  ['total-recall-industrial-anomaly-detection', 'anomaly'],
  ['kaggle-birdclef-2026', 'spectrogram'],
  ['agentic-research-template', 'agent'],
  ['local-embeddings', 'embedding'],
  ['audio-embeddings', 'spectrogram'],
  ['moe-deep-dive', 'moe'],
  ['resnet-identity-mini', 'resnet'],
  ['rl-context-compaction', 'learning'],
  ['rl-compaction', 'learning'],
  ['rl-gym-sutton', 'grid'],
  ['streaming-train-demo', 'streaming'],
  ['complexity-aware-program-evolution', 'pareto'],
  ['erdos-concentration', 'concentration'],
  ['random-matrix-visualizer', 'eigen'],
  ['paxos-explore', 'paxos'],
  ['tierra-web', 'soup'],
  ['blindwatchmaker', 'evolution'],
  ['vienna-ep-ui', 'energy'],
  ['random-neighbors', 'embedding'],
  ['bayesian-marketing-attribution', 'bayes'],
  ['tricentis-lead-scoring', 'bars'],
  ['nopioid', 'map'],
  ['AQPy', 'sensor'],
];

function hash(s) {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = Math.imul(s, 1664525) + 1013904223 >>> 0) / 2 ** 32);
}

function base(title, accent, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760" role="img" aria-label="${title}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#07101b"/>
    <stop offset="0.55" stop-color="#0b1020"/>
    <stop offset="1" stop-color="#121827"/>
  </linearGradient>
  <radialGradient id="glow" cx="28%" cy="16%" r="78%">
    <stop offset="0" stop-color="${accent}" stop-opacity="0.28"/>
    <stop offset="0.58" stop-color="${accent}" stop-opacity="0.055"/>
    <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
  </radialGradient>
  <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="12"/></filter>
</defs>
<rect width="1200" height="760" fill="url(#bg)"/>
<rect width="1200" height="760" fill="url(#glow)"/>
<rect x="58" y="58" width="1084" height="644" rx="28" fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.095)"/>
${body}
</svg>`;
}

function pathLine(points, close = false) {
  return points.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + (close ? ' Z' : '');
}

function thumbnail(name, kind) {
  const r = rng(hash(name));
  const accents = ['#7dd3fc', '#5eead4', '#a78bfa', '#f59e0b', '#f472b6'];
  const accent = accents[hash(kind) % accents.length];
  let body = '';

  if (kind === 'embedding') {
    for (const c of [[370, 390], [620, 300], [820, 430]]) {
      for (let i = 0; i < 110; i++) {
        const a = r() * Math.PI * 2;
        const d = Math.pow(r(), 0.58) * (70 + r() * 60);
        body += `<circle cx="${c[0] + Math.cos(a) * d}" cy="${c[1] + Math.sin(a) * d}" r="${1.8 + r() * 3.6}" fill="${accent}" opacity="${0.18 + r() * 0.34}"/>`;
      }
    }
    body += `<path d="M260 520 C470 180 770 180 970 500" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="3"/>`;
  } else if (kind === 'spectrogram' || kind === 'spectrum') {
    for (let x = 150; x < 1050; x += 16) {
      const h = 60 + Math.pow(r(), 2) * 390;
      body += `<rect x="${x}" y="${585 - h}" width="10" height="${h}" rx="3" fill="${accent}" opacity="${0.18 + r() * 0.46}"/>`;
    }
    for (let i = 0; i < 7; i++) body += `<path d="M150 ${180 + i * 58} H1050" stroke="rgba(255,255,255,0.08)"/>`;
  } else if (kind === 'pipeline' || kind === 'agent') {
    const xs = [190, 410, 630, 850, 1010];
    xs.forEach((x, i) => {
      body += `<rect x="${x - 72}" y="${285 + (i % 2) * 72}" width="144" height="92" rx="14" fill="rgba(255,255,255,0.045)" stroke="${accent}" stroke-opacity="0.48"/>`;
      if (i < xs.length - 1) body += `<path d="M${x + 78} ${331 + (i % 2) * 72} C${x + 135} ${331 + (i % 2) * 72}, ${xs[i + 1] - 135} ${331 + ((i + 1) % 2) * 72}, ${xs[i + 1] - 78} ${331 + ((i + 1) % 2) * 72}" fill="none" stroke="${accent}" stroke-opacity="0.58" stroke-width="4"/>`;
    });
  } else if (kind === 'survival' || kind === 'bayes') {
    for (let i = 0; i < 4; i++) {
      let x = 180, y = 210 + i * 70;
      let d = `M ${x} ${y}`;
      for (let k = 0; k < 8; k++) {
        x += 90 + r() * 28;
        y += 18 + r() * 22;
        d += ` H ${x.toFixed(1)} V ${y.toFixed(1)}`;
      }
      body += `<path d="${d}" fill="none" stroke="${i ? 'rgba(255,255,255,0.28)' : accent}" stroke-width="${i ? 3 : 5}" stroke-linecap="round"/>`;
    }
  } else if (kind === 'bars' || kind === 'tabular' || kind === 'features') {
    for (let i = 0; i < 10; i++) {
      const h = 90 + r() * 330;
      body += `<rect x="${170 + i * 86}" y="${600 - h}" width="48" height="${h}" rx="8" fill="${i % 3 === 0 ? accent : 'rgba(255,255,255,0.22)'}"/>`;
    }
    body += `<path d="M150 600 H1040" stroke="rgba(255,255,255,0.18)" stroke-width="3"/>`;
  } else if (kind === 'learning' || kind === 'posttraining' || kind === 'streaming') {
    for (let j = 0; j < 4; j++) {
      const pts = [];
      for (let i = 0; i < 34; i++) pts.push([150 + i * 28, 555 - 300 * (1 - Math.exp(-i / (8 + j * 3))) + Math.sin(i * 0.7 + j) * 20 + (r() - 0.5) * 22 + j * 24]);
      body += `<path d="${pathLine(pts)}" fill="none" stroke="${j ? 'rgba(255,255,255,0.22)' : accent}" stroke-width="${j ? 3 : 5}" stroke-linecap="round"/>`;
    }
  } else if (kind === 'grid') {
    for (let y = 0; y < 7; y++) for (let x = 0; x < 10; x++) body += `<rect x="${190 + x * 78}" y="${150 + y * 68}" width="56" height="48" rx="7" fill="${r() > 0.75 ? accent : 'rgba(255,255,255,0.05)'}" opacity="${r() > 0.75 ? 0.55 : 1}" stroke="rgba(255,255,255,0.08)"/>`;
    body += `<path d="M220 560 C350 430 420 380 540 360 C700 330 740 230 940 180" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>`;
  } else if (kind === 'moe') {
    for (let i = 0; i < 8; i++) {
      const y = 155 + i * 65;
      body += `<circle cx="250" cy="${y}" r="9" fill="${accent}" opacity="0.75"/>`;
      for (let j = 0; j < 4; j++) body += `<path d="M265 ${y} C420 ${y - 80 + j * 55}, 650 ${160 + j * 115}, 820 ${160 + j * 115}" fill="none" stroke="rgba(255,255,255,${0.08 + r() * 0.22})" stroke-width="${1 + r() * 4}"/>`;
    }
    for (let j = 0; j < 4; j++) body += `<rect x="830" y="${120 + j * 115}" width="170" height="80" rx="14" fill="rgba(255,255,255,0.045)" stroke="${accent}" stroke-opacity="0.36"/>`;
  } else if (kind === 'resnet') {
    for (let i = 0; i < 5; i++) {
      const x = 170 + i * 180;
      body += `<rect x="${x}" y="280" width="110" height="120" rx="14" fill="rgba(255,255,255,0.045)" stroke="${accent}" stroke-opacity="0.42"/>`;
      body += `<path d="M${x + 110} 340 H${x + 180}" stroke="${accent}" stroke-width="4"/>`;
      body += `<path d="M${x} 270 C${x + 55} 185 ${x + 150} 185 ${x + 180} 270" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="4"/>`;
    }
  } else if (kind === 'paxos') {
    const ys = [190, 310, 430, 550];
    ys.forEach((y, i) => body += `<text x="120" y="${y + 5}" fill="rgba(255,255,255,0.38)" font-family="ui-monospace,monospace" font-size="28">n${i + 1}</text><path d="M190 ${y} H1040" stroke="rgba(255,255,255,0.10)"/>`);
    for (let i = 0; i < 15; i++) {
      const y1 = ys[Math.floor(r() * ys.length)], y2 = ys[Math.floor(r() * ys.length)], x = 230 + r() * 720;
      body += `<path d="M${x} ${y1} L${x + 90 + r() * 90} ${y2}" stroke="${accent}" stroke-opacity="${0.22 + r() * 0.36}" stroke-width="3"/>`;
    }
  } else if (kind === 'concentration') {
    for (let i = 0; i < 5; i++) {
      const pts = [];
      for (let x = 0; x < 80; x++) {
        const z = (x - 40) / (7 + i * 2);
        pts.push([150 + x * 11, 560 - 360 * Math.exp(-0.5 * z * z) / (1 + i * 0.22)]);
      }
      body += `<path d="${pathLine(pts)}" fill="none" stroke="${i ? 'rgba(255,255,255,0.18)' : accent}" stroke-width="${i ? 3 : 5}"/>`;
    }
  } else if (kind === 'eigen') {
    for (let i = 0; i < 380; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 230;
      body += `<circle cx="${600 + Math.cos(a) * d}" cy="${380 + Math.sin(a) * d}" r="${1.8 + r() * 3.8}" fill="${accent}" opacity="${0.12 + r() * 0.38}"/>`;
    }
    body += `<circle cx="600" cy="380" r="230" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="3"/>`;
  } else if (kind === 'anomaly' || kind === 'map' || kind === 'energy') {
    for (let y = 0; y < 12; y++) for (let x = 0; x < 20; x++) {
      const v = r();
      body += `<rect x="${150 + x * 45}" y="${120 + y * 42}" width="40" height="37" rx="5" fill="${v > 0.86 ? accent : 'rgba(255,255,255,0.06)'}" opacity="${v > 0.86 ? 0.72 : 1}"/>`;
    }
  } else if (kind === 'pareto') {
    for (let i = 0; i < 90; i++) body += `<circle cx="${170 + r() * 850}" cy="${160 + r() * 420}" r="${3 + r() * 8}" fill="${r() > 0.72 ? accent : 'rgba(255,255,255,0.22)'}" opacity="0.72"/>`;
    body += `<path d="M190 560 C360 470 520 320 690 250 C820 195 900 155 1020 130" fill="none" stroke="${accent}" stroke-width="5"/>`;
  } else if (kind === 'evolution' || kind === 'soup') {
    for (let i = 0; i < 76; i++) {
      const x = 160 + r() * 880, y = 130 + r() * 470;
      body += `<path d="M${x} ${y} l${-18 + r() * 36} ${-18 + r() * 36} l${-18 + r() * 36} ${-18 + r() * 36}" stroke="${r() > 0.7 ? accent : 'rgba(255,255,255,0.24)'}" stroke-width="${2 + r() * 3}" stroke-linecap="round"/>`;
    }
  } else {
    for (let i = 0; i < 18; i++) body += `<path d="M150 ${160 + i * 24} C360 ${80 + r() * 520}, 760 ${80 + r() * 520}, 1050 ${160 + i * 24}" fill="none" stroke="${i % 4 ? 'rgba(255,255,255,0.12)' : accent}" stroke-width="${i % 4 ? 2 : 4}"/>`;
  }

  body += `<text x="92" y="672" fill="rgba(231,231,234,0.74)" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="30">${name}</text>`;
  return base(name, accent, body);
}

await fs.mkdir(OUT, { recursive: true });
for (const [name, kind] of projects) {
  await fs.writeFile(path.join(OUT, `${name}.svg`), thumbnail(name, kind), 'utf8');
  console.log(`[write] public/projects/${name}.svg`);
}
