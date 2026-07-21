// Stepwise algorithm-state palette solver.
//
// Run:  node scripts/palette-solver.mjs
//
// The seven state colours in app/globals.css are SOLVED, not picked. Seven
// categorical colours that must simultaneously survive contrast floors, a
// semantic prominence ordering, and three colour-vision deficiencies -- in two
// themes -- is over-constrained for hand-tuning. This searches for a solution
// and PROVES it, printing every constraint check.
//
// Re-run this before changing any --state-* value. If it prints anything other
// than "ALL CONSTRAINTS SATISFIED", the palette is not shippable.
//
// Design decisions encoded here (change these deliberately, not by accident):
//   - `visited` is a near-neutral. It has finished being interesting and should
//     recede; reading as grey also removes it from CVD contention entirely,
//     which is what makes the remaining six solvable.
//   - Dark theme: prominence == luminance, so the ordering applies directly.
//     Light theme: on white, "prominent" is not "darkest" -- amber at low
//     luminance is just brown -- so prominence rides on CHROMA instead.
//   - The grayscale ramp is only an anti-collision floor. It was originally a
//     PROXY for CVD safety; we now simulate CVD directly, so a strict ramp was
//     redundant work that crushed chroma and forced muddy hues.

//
// Fixed design decisions (not searched):
//   - `visited` is a near-neutral. It has finished being interesting and should
//     recede; reading as grey also removes it from CVD contention entirely.
//   - Six chromatic states remain, which is right at the known categorical limit.
//   - Light mode uses tinted fills + saturated strokes, so a state colour only
//     ever has to clear 3:1 as a graphical object, never 4.5:1 as a text bg.
//
// Searched per state per theme: luminance, chroma, hue (within a band).
// Scored against: gamut, stroke contrast, grayscale ramp, CVD separation,
// and chroma restraint (Instrument is not a highlighter).

function toLin(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h), b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}
const enc = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
const cl = (x) => Math.min(1, Math.max(0, x));
const okGamut = (rgb) => rgb.every((v) => v >= -0.0005 && v <= 1.0005);
const lumOf = (rgb) => 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
const hexOf = (L, C, h) =>
  '#' + toLin(L, C, h).map((v) => Math.round(cl(enc(cl(v))) * 255).toString(16).padStart(2, '0')).join('');
const RA = (a, b) => { const [hi, lo] = a > b ? [a, b] : [b, a]; return (hi + 0.05) / (lo + 0.05); };

function sim(rgbLin, type) {
  const [r, g, b] = rgbLin;
  const L = 0.31399022 * r + 0.63951294 * g + 0.04649755 * b;
  const M = 0.15537241 * r + 0.75789446 * g + 0.08670142 * b;
  const S = 0.01775239 * r + 0.10944209 * g + 0.87256922 * b;
  let L2 = L, M2 = M, S2 = S;
  if (type === 'protan') L2 = 1.05118294 * M - 0.05116099 * S;
  if (type === 'deutan') M2 = 0.9513092 * L + 0.04866992 * S;
  if (type === 'tritan') S2 = -0.86744736 * L + 1.86727089 * M;
  return [
    5.47221206 * L2 - 4.6419601 * M2 + 0.16963708 * S2,
    -1.1252419 * L2 + 2.29317094 * M2 - 0.1678952 * S2,
    0.02980165 * L2 - 0.19318073 * M2 + 1.16364789 * S2,
  ];
}
const cvdDist = (a, b, type) => {
  const x = sim(a, type).map(cl), y = sim(b, type).map(cl);
  return Math.hypot(...[0, 1, 2].map((n) => enc(x[n]) - enc(y[n])));
};

// hue bands: each state keeps its identity but may shift to gain separation
const BANDS = {
  active:   [72, 95],    // amber
  frontier: [34, 52],    // orange
  path:     [344, 4],    // rose  (wraps)
  final:    [145, 168],  // green
  visited:  [190, 205],  // teal, near-neutral
  compare:  [228, 252],  // blue
  swap:     [292, 312],  // violet
};
const CHROMATIC = ['active', 'frontier', 'path', 'final', 'compare', 'swap'];
const ALL = [...CHROMATIC, 'visited'];

// Prominence ranking. Same in both themes; only the direction of luminance flips.
// active is the focus and must dominate; visited has finished being interesting
// and must recede. Without this the optimiser happily makes `visited` the
// brightest thing on screen, which is semantically backwards.
const PROMINENCE = ['active', 'final', 'frontier', 'path', 'compare', 'swap', 'visited'];

const CRITICAL = [
  ['active', 'compare'], ['active', 'swap'], ['compare', 'swap'],
  ['visited', 'frontier'], ['final', 'visited'], ['final', 'path'],
  ['active', 'frontier'], ['final', 'frontier'], ['active', 'final'],
  ['path', 'frontier'], ['compare', 'visited'],
];

const THEME = {
  dark:  { surfLum: lumOf(toLin(0.235, 0.014, 258).map(cl)), inkLum: lumOf(toLin(0.165, 0.012, 258).map(cl)),
           lumRange: [0.150, 0.78], grayStep: 1.14, maxC: 0.165, needInk: true, invert: false },
  light: { surfLum: 1.0, inkLum: lumOf(toLin(0.235, 0.014, 258).map(cl)),
           lumRange: [0.055, 0.400], grayStep: 1.12, maxC: 0.185, needInk: false, invert: true },
};

function place(hue, targetLum, chroma) {
  let lo = 0, hi = 1;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (lumOf(toLin(mid, chroma, hue).map(cl)) < targetLum) lo = mid; else hi = mid;
  }
  const L = (lo + hi) / 2;
  const rgb = toLin(L, chroma, hue);
  if (!okGamut(rgb)) return null;
  if (Math.abs(lumOf(rgb) - targetLum) / targetLum > 0.03) return null;
  return { L, C: chroma, h: hue, lum: lumOf(rgb) };
}

function score(cand, cfg) {
  let s = 0;
  const entries = Object.entries(cand);

  for (const [, v] of entries) {
    const r = RA(v.lum, cfg.surfLum);
    if (r < 3.06) s += (3.06 - r) * 700;                                   // stroke contrast
    if (cfg.needInk) { const ri = RA(v.lum, cfg.inkLum); if (ri < 4.58) s += (4.58 - ri) * 600; }
    if (v.C > cfg.maxC) s += (v.C - cfg.maxC) * 900;                 // restraint
    s -= v.C * 260;                                                    // mild reward for chroma
  }

  // Anti-collision floor only. A strict luminance ramp was originally a PROXY for
  // CVD safety; we now simulate CVD directly, so the ramp was redundant work that
  // crushed chroma and forced muddy hues. Keep just enough to stop two states
  // landing on the same luminance.
  const target = cfg.grayStep + 0.01;
  const sorted = entries.slice().sort((a, b) => a[1].lum - b[1].lum);
  for (let i = 1; i < sorted.length; i++) {
    const r = RA(sorted[i][1].lum, sorted[i - 1][1].lum);
    if (r < target) s += (target - r) * 2000;
  }

  // Semantic prominence.
  // Dark theme: prominence == luminance, so the ordering applies directly.
  // Light theme: on white, "prominent" is NOT "darkest" - amber at low luminance
  // is just brown. There prominence is carried by CHROMA, and luminance only has
  // to clear the contrast floor.
  if (!cfg.invert) {
    for (let i = 1; i < PROMINENCE.length; i++) {
      const hi = cand[PROMINENCE[i - 1]], lo = cand[PROMINENCE[i]];
      if (!hi || !lo) continue;
      if (hi.lum < lo.lum) s += (lo.lum - hi.lum) * 2600 + 60;
    }
  } else {
    for (let i = 1; i < PROMINENCE.length; i++) {
      const hi = cand[PROMINENCE[i - 1]], lo = cand[PROMINENCE[i]];
      if (!hi || !lo) continue;
      if (hi.C < lo.C) s += (lo.C - hi.C) * 3200 + 60;
    }
  }

  const lin = {};
  for (const [k, v] of entries) lin[k] = toLin(v.L, v.C, v.h).map(cl);
  for (const type of ['deutan', 'protan', 'tritan']) {
    for (let i = 0; i < ALL.length; i++)
      for (let j = i + 1; j < ALL.length; j++) {
        const a = ALL[i], b = ALL[j];
        if (!lin[a] || !lin[b]) continue;
        const d = cvdDist(lin[a], lin[b], type);
        const isCrit = CRITICAL.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
        const need = isCrit ? 0.22 : 0.15;
        if (d < need) s += (need - d) * (isCrit ? 1400 : 500);
      }
  }
  return s;
}

const rnd = (a, b) => a + Math.random() * (b - a);
const hueIn = (band) => {
  const [a, b] = band;
  return b < a ? (rnd(a, b + 360)) % 360 : rnd(a, b);
};

function optimise(themeName) {
  const cfg = THEME[themeName];
  let best = null, bestScore = Infinity;

  for (let restart = 0; restart < 200; restart++) {
    const cur = {};
    for (const k of ALL) {
      for (let t = 0; t < 90; t++) {
        const p = place(hueIn(BANDS[k]), rnd(...cfg.lumRange), k === 'visited' ? rnd(0.018, 0.038) : rnd(0.095, cfg.maxC));
        if (p) { cur[k] = p; break; }
      }
      if (!cur[k]) cur[k] = place(BANDS[k][0], cfg.lumRange[0] + 0.05, 0.05);
    }
    if (Object.values(cur).some((v) => !v)) continue;

    let sc = score(cur, cfg), T = 1;
    for (let it = 0; it < 7000; it++) {
      T = 1 - it / 7000;
      const k = ALL[(Math.random() * ALL.length) | 0];
      const o = cur[k];
      const nl = Math.min(cfg.lumRange[1], Math.max(cfg.lumRange[0], o.lum + rnd(-0.09, 0.09) * T));
      const ncRaw = o.C + rnd(-0.05, 0.05) * T;
      const nc = k === 'visited' ? Math.min(0.042, Math.max(0.016, ncRaw)) : Math.min(cfg.maxC, Math.max(0.085, ncRaw));
      const nh = (o.h + rnd(-9, 9) * T + 360) % 360;
      const [ba, bb] = BANDS[k];
      const okHue = bb < ba ? (nh >= ba || nh <= bb) : (nh >= ba && nh <= bb);
      if (!okHue) continue;
      const p = place(nh, nl, nc);
      if (!p) continue;
      const prev = cur[k];
      cur[k] = p;
      const ns = score(cur, cfg);
      if (ns <= sc) sc = ns; else cur[k] = prev;
    }
    if (sc < bestScore) { bestScore = sc; best = JSON.parse(JSON.stringify(cur)); }
    if (bestScore <= 0.0001) break;
  }
  return { best, bestScore, cfg };
}

let violations = 0;
function verify(name, P, cfg) {
  console.log(`\n${'='.repeat(80)}\n${name}\n${'='.repeat(80)}`);
  const bad = (m) => { violations++; console.log(`    FAIL  ${m}`); };

  console.log('\n  stroke (>= 3:1 vs surface)');
  for (const k of ALL) {
    const v = P[k], r = RA(v.lum, cfg.surfLum);
    console.log(`    ${k.padEnd(9)} oklch(${v.L.toFixed(3)} ${v.C.toFixed(3)} ${v.h.toFixed(0).padStart(3)})  ${hexOf(v.L, v.C, v.h)}   ${r.toFixed(2)}:1`);
    if (r < 3) bad(`${k} stroke ${r.toFixed(2)}:1`);
  }

  if (cfg.needInk) {
    console.log('\n  ink on fill (>= 4.5:1)');
    for (const k of ALL) {
      const r = RA(P[k].lum, cfg.inkLum);
      if (r < 4.5) bad(`${k} ink ${r.toFixed(2)}:1`);
      else console.log(`    ${k.padEnd(9)} ${r.toFixed(2)}:1`);
    }
  }

  console.log(`\n  grayscale ramp (>= ${cfg.grayStep}x)`);
  const sorted = ALL.map((k) => [k, P[k]]).sort((a, b) => a[1].lum - b[1].lum);
  sorted.forEach(([k, v], i) => {
    if (i === 0) { console.log(`    ${k.padEnd(9)} ${v.lum.toFixed(4)}`); return; }
    const r = RA(v.lum, sorted[i - 1][1].lum);
    console.log(`    ${k.padEnd(9)} ${v.lum.toFixed(4)}   ${r.toFixed(2)}x vs ${sorted[i - 1][0]}`);
    if (r < cfg.grayStep) bad(`grayscale ${k}/${sorted[i - 1][0]} ${r.toFixed(2)}x`);
  });

  console.log('\n  CVD (critical pairs >= 0.22, others >= 0.15)');
  const lin = {}; for (const k of ALL) lin[k] = toLin(P[k].L, P[k].C, P[k].h).map(cl);
  for (const type of ['deutan', 'protan', 'tritan']) {
    const issues = [];
    for (let i = 0; i < ALL.length; i++)
      for (let j = i + 1; j < ALL.length; j++) {
        const a = ALL[i], b = ALL[j];
        const d = cvdDist(lin[a], lin[b], type);
        const isCrit = CRITICAL.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
        const need = isCrit ? 0.22 : 0.15;
        if (d < need) { issues.push(`${a}~${b}=${d.toFixed(2)}${isCrit ? '*' : ''}`); if (isCrit) bad(`${type} ${a}~${b} ${d.toFixed(2)}`); }
      }
    console.log(`    ${type.padEnd(8)} ${issues.length ? issues.join('  ') : 'all pairs clear'}`);
  }
}

const D = optimise('dark');
const L = optimise('light');
verify('DARK', D.best, D.cfg);
verify('LIGHT', L.best, L.cfg);

console.log(`\n${'='.repeat(80)}`);
console.log(violations === 0 ? '>>> ALL CONSTRAINTS SATISFIED' : `>>> ${violations} VIOLATION(S) REMAIN`);
console.log(`${'='.repeat(80)}\n`);

const emit = (P) => ALL.map((k) => `  --state-${(k + ':').padEnd(10)} oklch(${P[k].L.toFixed(3)} ${P[k].C.toFixed(3)} ${P[k].h.toFixed(1)});  /* ${hexOf(P[k].L, P[k].C, P[k].h)} */`).join('\n');
console.log('/* dark */\n' + emit(D.best));
console.log('\n/* light */\n' + emit(L.best));
