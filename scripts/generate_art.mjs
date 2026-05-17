#!/usr/bin/env node
/**
 * Generate a few lightweight SVG art templates for the site.
 * Outputs to public/art/*.svg
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'public', 'art');

function rng(seed=1){
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2**32;
}

function svgWrap(w,h,inner){
  return `<?xml version="1.0" encoding="UTF-8"?>\n`+
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">\n`+
    `<defs>\n`+
    `  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">\n`+
    `    <stop offset="0" stop-color="#070a12"/>\n`+
    `    <stop offset="1" stop-color="#0b1020"/>\n`+
    `  </linearGradient>\n`+
    `  <radialGradient id="glow" cx="25%" cy="20%" r="80%">\n`+
    `    <stop offset="0" stop-color="rgba(125,211,252,0.20)"/>\n`+
    `    <stop offset="0.55" stop-color="rgba(125,211,252,0.05)"/>\n`+
    `    <stop offset="1" stop-color="rgba(125,211,252,0)"/>\n`+
    `  </radialGradient>\n`+
    `  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">\n`+
    `    <feGaussianBlur stdDeviation="6"/>\n`+
    `  </filter>\n`+
    `</defs>\n`+
    `<rect width="100%" height="100%" fill="url(#bg)"/>\n`+
    `<rect width="100%" height="100%" fill="url(#glow)"/>\n`+
    inner +
    `\n</svg>`;
}

function lossLandscape(){
  const w=1600,h=480;
  const r=rng(7);
  // Contour-like noisy waves
  let paths='';
  for(let i=0;i<18;i++){
    const y = 60 + i*20;
    let d=`M 0 ${y}`;
    for(let x=0;x<=w;x+=40){
      const yy = y + 18*Math.sin((x/140)+i*0.55) + 10*Math.sin((x/55)+i*0.18) + (r()-0.5)*6;
      d += ` L ${x} ${yy.toFixed(2)}`;
    }
    const a = 0.10 + i*0.012;
    paths += `<path d="${d}" fill="none" stroke="rgba(231,231,234,${a.toFixed(3)})" stroke-width="1"/>\n`;
  }
  // Hillclimb trajectory
  let traj='';
  let x=180,y=360;
  traj += `M ${x} ${y}`;
  for(let k=0;k<22;k++){
    x += 55 + (r()-0.5)*18;
    y += -12 + (r()-0.5)*22;
    traj += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  const inner =
    `<g opacity="0.95">${paths}</g>`+
    `<path d="${traj}" fill="none" stroke="rgba(125,211,252,0.85)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`+
    `<path d="${traj}" fill="none" stroke="rgba(125,211,252,0.25)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" filter="url(#soft)"/>`+
    `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="6" fill="rgba(125,211,252,0.95)"/>`;
  return svgWrap(w,h,inner);
}

function embeddingScatter(){
  const w=1600,h=480;
  const r=rng(11);
  const clusters=[
    {cx:430,cy:260,c:'rgba(125,211,252,0.85)'},
    {cx:820,cy:210,c:'rgba(167,139,250,0.75)'},
    {cx:1160,cy:290,c:'rgba(94,234,212,0.70)'},
  ];
  let dots='';
  for(const cl of clusters){
    for(let i=0;i<220;i++){
      const ang = r()*Math.PI*2;
      const rad = Math.pow(r(),0.55) * (90 + r()*40);
      const x = cl.cx + Math.cos(ang)*rad + (r()-0.5)*18;
      const y = cl.cy + Math.sin(ang)*rad + (r()-0.5)*18;
      const rr = 1.1 + r()*2.2;
      const a = 0.12 + r()*0.35;
      dots += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${rr.toFixed(2)}" fill="${cl.c.replace('0.85',a.toFixed(3)).replace('0.75',a.toFixed(3)).replace('0.70',a.toFixed(3))}"/>\n`;
    }
  }
  const inner = `<g>${dots}</g>`+
    `<path d="M 240 370 C 520 80, 900 70, 1320 330" fill="none" stroke="rgba(231,231,234,0.10)" stroke-width="2"/>`;
  return svgWrap(w,h,inner);
}

function telemetryTraces(){
  const w=1600,h=480;
  const r=rng(19);
  const lines=[];
  for(let j=0;j<4;j++){
    const base=120 + j*70;
    let d=`M 60 ${base}`;
    for(let x=60;x<=w-60;x+=18){
      const noise = 10*Math.sin((x/60)+j*0.9) + 6*Math.sin((x/18)+j*0.4) + (r()-0.5)*6;
      const spike = (r()<0.015) ? (r()*-90) : 0;
      const y = base + noise + spike;
      d += ` L ${x} ${y.toFixed(2)}`;
    }
    lines.push(d);
  }
  const cols=['rgba(125,211,252,0.8)','rgba(94,234,212,0.7)','rgba(167,139,250,0.6)','rgba(231,231,234,0.25)'];
  let inner='<g>';
  inner += `<rect x="40" y="70" width="1520" height="330" rx="18" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)"/>`;
  for(let i=0;i<lines.length;i++){
    inner += `<path d="${lines[i]}" fill="none" stroke="${cols[i]}" stroke-width="2" stroke-linecap="round"/>`;
  }
  inner += '</g>';
  return svgWrap(w,h,inner);
}

function manifoldBox(){
  const w=1600,h=480;
  // a pseudo-3D wireframe cube + a folded manifold sheet inside
  const inner = `
  <g opacity="0.95">
    <path d="M 360 130 L 980 90 L 1240 200 L 620 240 Z" fill="rgba(255,255,255,0.01)" stroke="rgba(231,231,234,0.18)"/>
    <path d="M 360 130 L 360 330 L 620 420 L 620 240 Z" fill="rgba(255,255,255,0.01)" stroke="rgba(231,231,234,0.14)"/>
    <path d="M 620 240 L 1240 200 L 1240 400 L 620 420 Z" fill="rgba(255,255,255,0.01)" stroke="rgba(231,231,234,0.14)"/>
    <path d="M 980 90 L 980 290" stroke="rgba(231,231,234,0.12)"/>
    <path d="M 360 330 L 980 290 L 1240 400" stroke="rgba(231,231,234,0.10)"/>
    <path d="M 360 130 L 620 240" stroke="rgba(231,231,234,0.10)"/>
    <path d="M 980 90 L 1240 200" stroke="rgba(231,231,234,0.10)"/>
  </g>
  <path d="M 520 320 C 650 160, 800 390, 940 200 C 1010 110, 1120 140, 1160 260 C 1200 380, 1050 380, 980 340 C 870 275, 720 420, 600 380" fill="none" stroke="rgba(125,211,252,0.75)" stroke-width="3"/>
  <path d="M 520 320 C 650 160, 800 390, 940 200 C 1010 110, 1120 140, 1160 260 C 1200 380, 1050 380, 980 340 C 870 275, 720 420, 600 380" fill="none" stroke="rgba(125,211,252,0.20)" stroke-width="10" filter="url(#soft)"/>
  `;
  return svgWrap(w,h,inner);
}

function trainabilityMap(){
  const w=1600,h=480;
  const r=rng(23);
  const cell=10;
  const cols=Math.floor(w/cell);
  const rows=Math.floor(h/cell);
  let inner='<g opacity="0.95">';
  for(let j=0;j<rows;j++){
    for(let i=0;i<cols;i++){
      // synthetic boundary: combine two sinusoids + noise; threshold -> stable vs diverge
      const x=i/cols*6.5;
      const y=j/rows*6.5;
      const v = Math.sin(2.1*x + 0.7*Math.sin(1.3*y)) + Math.cos(2.2*y + 0.4*Math.sin(1.1*x)) + (r()-0.5)*0.35;
      // palette: diverge = warm, converge = cool; near-boundary = bright
      const stable = v < 0.15;
      const dist = Math.min(1, Math.abs(v)/1.6);
      let fill;
      if(stable){
        const a = 0.08 + (1-dist)*0.55;
        fill = `rgba(34,211,238,${a.toFixed(3)})`; // cyan-ish
      } else {
        const a = 0.07 + (1-dist)*0.55;
        fill = `rgba(251,113,133,${a.toFixed(3)})`; // warm pink/red
      }
      inner += `<rect x="${i*cell}" y="${j*cell}" width="${cell}" height="${cell}" fill="${fill}"/>`;
    }
  }
  inner += '</g>';
  // subtle vignette
  inner += `<rect width="100%" height="100%" fill="rgba(0,0,0,0.10)"/>`;
  return svgWrap(w,h,inner);
}

function juliaIsh(){
  const w=1600,h=480;
  const r=rng(5);
  // not a true Julia set; a fast aesthetic: repeated complex-ish warp + color bands
  const cell=8;
  const cols=Math.floor(w/cell);
  const rows=Math.floor(h/cell);
  let inner='<g opacity="0.95">';
  for(let j=0;j<rows;j++){
    for(let i=0;i<cols;i++){
      let x = (i/cols-0.5)*3.2;
      let y = (j/rows-0.5)*1.6;
      const cx=-0.11, cy=0.68;
      let it=0;
      for(;it<18;it++){
        const xx=x*x - y*y + cx;
        const yy=2*x*y + cy;
        x=xx; y=yy;
        if(x*x+y*y>6.0) break;
      }
      const t = it/18;
      const a = 0.08 + 0.65*Math.pow(1-t,1.2);
      const cool = `rgba(34,211,238,${a.toFixed(3)})`;
      const warm = `rgba(251,191,36,${(a*0.6).toFixed(3)})`;
      const fill = (t<0.55) ? cool : warm;
      inner += `<rect x="${i*cell}" y="${j*cell}" width="${cell}" height="${cell}" fill="${fill}"/>`;
    }
  }
  inner += '</g>';
  inner += `<rect width="100%" height="100%" fill="rgba(0,0,0,0.12)"/>`;
  return svgWrap(w,h,inner);
}

async function main(){
  await fs.mkdir(OUT, { recursive: true });
  const items = [
    ['loss-landscape.svg', lossLandscape()],
    ['embedding-scatter.svg', embeddingScatter()],
    ['telemetry-traces.svg', telemetryTraces()],
    ['manifold-box.svg', manifoldBox()],
    ['trainability-map.svg', trainabilityMap()],
    ['julia-ish.svg', juliaIsh()],
  ];
  for (const [name, content] of items){
    await fs.writeFile(path.join(OUT, name), content, 'utf8');
    console.log(`[write] public/art/${name}`);
  }
}

main().catch(e=>{console.error(e); process.exit(1);});
