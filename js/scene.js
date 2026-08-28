// Illustrations : chaque chapitre est dessiné en SVG à partir du décor renvoyé
// par le modèle (lieu + moment + emojis des personnages). Aucune image externe.
import { rng } from './util.js';

const L = 800;   // largeur du dessin
const H = 450;   // hauteur
const SOL = 330; // ligne de sol

const entre = (r, min, max) => min + r() * (max - min);

// --- Primitives -------------------------------------------------------------

function degrade(id, haut, bas) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${haut}"/><stop offset="1" stop-color="${bas}"/>
  </linearGradient>`;
}

function etoiles(r, n = 40) {
  let out = '';
  for (let i = 0; i < n; i += 1) {
    const x = entre(r, 10, L - 10);
    const y = entre(r, 10, SOL - 40);
    const taille = entre(r, 1.2, 3);
    out += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${taille.toFixed(1)}" fill="#fff" opacity="${entre(r, 0.5, 1).toFixed(2)}"/>`;
  }
  return out;
}

function nuages(r, n = 3, couleur = '#ffffff') {
  let out = '';
  for (let i = 0; i < n; i += 1) {
    const x = entre(r, 60, L - 60);
    const y = entre(r, 40, 150);
    const s = entre(r, 0.7, 1.4);
    out += `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${s.toFixed(2)})" opacity="0.92">
      <ellipse cx="0" cy="0" rx="46" ry="22" fill="${couleur}"/>
      <ellipse cx="-30" cy="6" rx="28" ry="16" fill="${couleur}"/>
      <ellipse cx="32" cy="8" rx="24" ry="14" fill="${couleur}"/>
    </g>`;
  }
  return out;
}

function astre(moment) {
  if (moment === 'nuit') {
    return `<g><circle cx="660" cy="90" r="42" fill="#fff6d0"/>
      <circle cx="644" cy="80" r="34" fill="#ffffff" opacity="0.25"/></g>`;
  }
  const couleur = moment === 'soir' ? '#ff8f5e' : '#ffd84d';
  return `<g><circle cx="${moment === 'soir' ? 150 : 680}" cy="${moment === 'soir' ? 250 : 80}" r="46" fill="${couleur}" opacity="0.95"/>
    <circle cx="${moment === 'soir' ? 150 : 680}" cy="${moment === 'soir' ? 250 : 80}" r="68" fill="${couleur}" opacity="0.22"/></g>`;
}

function ciel(moment, lieu) {
  if (lieu === 'espace') {
    return `<rect width="${L}" height="${H}" fill="url(#g-espace)"/>`;
  }
  if (lieu === 'grotte' || lieu === 'souterrain') {
    return `<rect width="${L}" height="${H}" fill="url(#g-grotte)"/>`;
  }
  return `<rect width="${L}" height="${H}" fill="url(#g-ciel)"/>`;
}

function terre(couleur, couleur2) {
  return `<path d="M0,${SOL} C160,${SOL - 26} 300,${SOL + 18} 470,${SOL - 8} C610,${SOL - 28} 720,${SOL + 12} ${L},${SOL - 6} L${L},${H} L0,${H} Z" fill="${couleur}"/>
    <path d="M0,${SOL + 40} C200,${SOL + 20} 420,${SOL + 60} ${L},${SOL + 30} L${L},${H} L0,${H} Z" fill="${couleur2}" opacity="0.55"/>`;
}

function collines(r, couleurs = ['#7ec87e', '#5fae61']) {
  let out = '';
  couleurs.forEach((c, i) => {
    const y = SOL - 30 - i * 26;
    const dx = entre(r, -60, 60);
    out += `<path d="M${-80 + dx},${y + 60} Q${180 + dx},${y - 50} ${420 + dx},${y + 30} Q${640 + dx},${y + 80} ${L + 80},${y - 10} L${L + 80},${SOL + 60} L${-80 + dx},${SOL + 60} Z" fill="${c}"/>`;
  });
  return out;
}

function montagnes(r, neige = true, couleur = '#8b93b5') {
  let out = '';
  for (let i = 0; i < 3; i += 1) {
    const x = 80 + i * 260 + entre(r, -40, 40);
    const h = entre(r, 120, 200);
    const w = entre(r, 130, 190);
    out += `<path d="M${x - w},${SOL} L${x},${SOL - h} L${x + w},${SOL} Z" fill="${couleur}"/>`;
    if (neige) {
      out += `<path d="M${x - w * 0.28},${SOL - h * 0.68} L${x},${SOL - h} L${x + w * 0.28},${SOL - h * 0.68} Q${x + 8},${SOL - h * 0.58} ${x - 4},${SOL - h * 0.66} Z" fill="#ffffff"/>`;
    }
  }
  return out;
}

function feuillu(x, y, s, couleur = '#3f9e4d') {
  return `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${s.toFixed(2)})">
    <rect x="-7" y="-46" width="14" height="50" rx="5" fill="#8a5a34"/>
    <circle cx="0" cy="-62" r="34" fill="${couleur}"/>
    <circle cx="-26" cy="-46" r="24" fill="${couleur}"/>
    <circle cx="26" cy="-48" r="26" fill="${couleur}"/>
  </g>`;
}

function sapin(x, y, s, couleur = '#2f7d4f') {
  return `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${s.toFixed(2)})">
    <rect x="-6" y="-22" width="12" height="26" rx="4" fill="#7a4a2b"/>
    <path d="M0,-96 L34,-46 L-34,-46 Z" fill="${couleur}"/>
    <path d="M0,-70 L40,-16 L-40,-16 Z" fill="${couleur}"/>
  </g>`;
}

function palmier(x, y, s) {
  return `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${s.toFixed(2)})">
    <path d="M0,0 C-6,-30 -2,-60 8,-84" stroke="#a06a3a" stroke-width="12" fill="none" stroke-linecap="round"/>
    <g fill="#3fae5a">
      <ellipse cx="8" cy="-88" rx="40" ry="12" transform="rotate(-18 8 -88)"/>
      <ellipse cx="8" cy="-88" rx="40" ry="12" transform="rotate(18 8 -88)"/>
      <ellipse cx="8" cy="-88" rx="38" ry="11" transform="rotate(70 8 -88)"/>
      <ellipse cx="8" cy="-88" rx="38" ry="11" transform="rotate(-70 8 -88)"/>
    </g>
    <circle cx="8" cy="-80" r="7" fill="#c98a3a"/>
  </g>`;
}

function repartir(r, n, dessin, { min = 40, max = L - 40, ySol = SOL, sMin = 0.7, sMax = 1.2 } = {}) {
  let out = '';
  for (let i = 0; i < n; i += 1) {
    const x = min + ((max - min) * (i + entre(r, 0.1, 0.9))) / n;
    const s = entre(r, sMin, sMax);
    out += dessin(x, ySol + entre(r, -10, 24), s, r);
  }
  return out;
}

function buissons(r, n = 4, couleur = '#4aa85f') {
  return repartir(r, n, (x, y, s) => `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${s.toFixed(2)})">
    <ellipse cx="0" cy="0" rx="30" ry="18" fill="${couleur}"/>
    <ellipse cx="-16" cy="-8" rx="18" ry="14" fill="${couleur}"/>
    <ellipse cx="16" cy="-6" rx="20" ry="15" fill="${couleur}"/></g>`);
}

function fleurs(r, n = 8) {
  const couleurs = ['#ff6f91', '#ffd166', '#c77dff', '#ffffff'];
  let out = '';
  for (let i = 0; i < n; i += 1) {
    const x = entre(r, 20, L - 20);
    const y = entre(r, SOL + 10, H - 20);
    const c = couleurs[Math.floor(r() * couleurs.length)];
    out += `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)})">
      <rect x="-1.5" y="0" width="3" height="14" fill="#3f8f4f"/>
      <circle cx="0" cy="-2" r="6" fill="${c}"/><circle cx="0" cy="-2" r="2.5" fill="#fff3b0"/></g>`;
  }
  return out;
}

function champignons(r, n = 3) {
  return repartir(r, n, (x, y, s) => `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${s.toFixed(2)})">
    <rect x="-6" y="-16" width="12" height="18" rx="5" fill="#f7ead2"/>
    <path d="M-20,-14 A20,16 0 0 1 20,-14 Z" fill="#e5533d"/>
    <circle cx="-8" cy="-18" r="3.4" fill="#fff"/><circle cx="7" cy="-20" r="3" fill="#fff"/></g>`, { sMin: 0.6, sMax: 1 });
}

function rochers(r, n = 3, couleur = '#9aa3ad') {
  return repartir(r, n, (x, y, s) => `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${s.toFixed(2)})">
    <path d="M-30,0 L-18,-22 L4,-28 L26,-14 L32,0 Z" fill="${couleur}"/>
    <path d="M-18,-22 L4,-28 L2,-12 Z" fill="#ffffff" opacity="0.18"/></g>`);
}

function cactus(r, n = 3) {
  return repartir(r, n, (x, y, s) => `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${s.toFixed(2)})">
    <rect x="-11" y="-70" width="22" height="72" rx="11" fill="#4ba36a"/>
    <rect x="-34" y="-52" width="16" height="34" rx="8" fill="#4ba36a"/>
    <rect x="-34" y="-52" width="16" height="16" rx="8" fill="#4ba36a"/>
    <rect x="20" y="-60" width="15" height="30" rx="7" fill="#4ba36a"/></g>`);
}

function vagues(r, haut = '#4bb3e6', bas = '#2a86c4') {
  let out = `<rect x="0" y="${SOL - 10}" width="${L}" height="${H - SOL + 10}" fill="${bas}"/>`;
  for (let i = 0; i < 3; i += 1) {
    const y = SOL + 6 + i * 34;
    out += `<path d="M0,${y} Q100,${y - 14} 200,${y} T400,${y} T600,${y} T${L},${y} L${L},${H} L0,${H} Z" fill="${haut}" opacity="${(0.35 - i * 0.08).toFixed(2)}"/>`;
  }
  return out;
}

function maison(x, y, s, couleur = '#f2c98a', toit = '#c0553f') {
  return `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${s.toFixed(2)})">
    <rect x="-40" y="-60" width="80" height="62" rx="6" fill="${couleur}"/>
    <path d="M-52,-58 L0,-98 L52,-58 Z" fill="${toit}"/>
    <rect x="-12" y="-34" width="26" height="36" rx="4" fill="#8a5a34"/>
    <rect x="-32" y="-48" width="16" height="16" rx="3" fill="#bfe8ff"/>
    <rect x="18" y="-48" width="16" height="16" rx="3" fill="#bfe8ff"/></g>`;
}

function immeubles(r, n = 5) {
  let out = '';
  const couleurs = ['#8ea2c6', '#a8b6d6', '#7b8db1'];
  for (let i = 0; i < n; i += 1) {
    const w = entre(r, 60, 100);
    const h = entre(r, 90, 190);
    const x = (L / n) * i + entre(r, 0, 20);
    const c = couleurs[Math.floor(r() * couleurs.length)];
    out += `<rect x="${x.toFixed(0)}" y="${(SOL - h).toFixed(0)}" width="${w.toFixed(0)}" height="${(h + 20).toFixed(0)}" rx="6" fill="${c}"/>`;
    for (let fy = SOL - h + 16; fy < SOL - 16; fy += 26) {
      for (let fx = x + 12; fx < x + w - 16; fx += 24) {
        out += `<rect x="${fx.toFixed(0)}" y="${fy.toFixed(0)}" width="12" height="14" rx="2" fill="${r() > 0.4 ? '#ffe9a8' : '#5c6b8a'}"/>`;
      }
    }
  }
  return out;
}

function chateau(r) {
  const x = 400 + entre(r, -40, 40);
  return `<g transform="translate(${x.toFixed(0)} ${SOL}) scale(1.1)">
    <rect x="-110" y="-130" width="220" height="132" fill="#d9d3c7"/>
    <rect x="-150" y="-170" width="60" height="172" fill="#cbc4b6"/>
    <rect x="90" y="-170" width="60" height="172" fill="#cbc4b6"/>
    <path d="M-150,-170 L-120,-215 L-90,-170 Z" fill="#7b5ea7"/>
    <path d="M90,-170 L120,-215 L150,-170 Z" fill="#7b5ea7"/>
    <path d="M-110,-130 L0,-186 L110,-130 Z" fill="#6a4f96"/>
    <rect x="-26" y="-70" width="52" height="72" rx="26" fill="#6d4b31"/>
    <rect x="-70" y="-112" width="24" height="30" rx="12" fill="#9fd8f5"/>
    <rect x="46" y="-112" width="24" height="30" rx="12" fill="#9fd8f5"/></g>`;
}

function colonnes(r, n = 4) {
  let out = '';
  for (let i = 0; i < n; i += 1) {
    const x = 140 + i * 150 + entre(r, -14, 14);
    const h = entre(r, 90, 150);
    out += `<g><rect x="${x - 16}" y="${SOL - h}" width="32" height="${h}" fill="#e6e0d2"/>
      <rect x="${x - 24}" y="${SOL - h - 12}" width="48" height="14" rx="3" fill="#d8d1c0"/></g>`;
  }
  return out;
}

function stalactites(r, n = 7) {
  let out = '';
  for (let i = 0; i < n; i += 1) {
    const x = entre(r, 20, L - 20);
    const h = entre(r, 40, 120);
    out += `<path d="M${x - 22},0 L${x + 22},0 L${x},${h} Z" fill="#4a3f6b"/>`;
  }
  for (let i = 0; i < 4; i += 1) {
    const x = entre(r, 40, L - 40);
    const h = entre(r, 30, 70);
    out += `<path d="M${x - 18},${SOL + 10} L${x + 18},${SOL + 10} L${x},${SOL + 10 - h} Z" fill="#5b4d82"/>`;
  }
  return out;
}

function planetes(r, n = 3) {
  const couleurs = ['#ff9f6e', '#7bd6c0', '#c39cf0'];
  let out = '';
  for (let i = 0; i < n; i += 1) {
    const x = entre(r, 70, L - 70);
    const y = entre(r, 60, 260);
    const rad = entre(r, 18, 46);
    const c = couleurs[i % couleurs.length];
    out += `<g><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${rad.toFixed(0)}" fill="${c}"/>`;
    if (r() > 0.5) out += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(rad * 1.9).toFixed(0)}" ry="${(rad * 0.4).toFixed(0)}" fill="none" stroke="#ffe9a8" stroke-width="5" opacity="0.8" transform="rotate(-18 ${x.toFixed(0)} ${y.toFixed(0)})"/>`;
    out += '</g>';
  }
  return out;
}

function bateau(r) {
  const x = 400 + entre(r, -120, 120);
  return `<g transform="translate(${x.toFixed(0)} ${SOL + 20})">
    <path d="M-90,0 L90,0 L60,44 L-60,44 Z" fill="#8a5a34"/>
    <rect x="-6" y="-120" width="12" height="120" fill="#6d4b31"/>
    <path d="M6,-114 L86,-56 L6,-16 Z" fill="#fff6e8"/>
    <path d="M-6,-100 L-70,-52 L-6,-24 Z" fill="#ffd9c0"/></g>`;
}

function glacons(r, n = 4) {
  let out = '';
  for (let i = 0; i < n; i += 1) {
    const x = entre(r, 60, L - 60);
    const h = entre(r, 50, 120);
    out += `<path d="M${x - 60},${SOL} L${x - 20},${SOL - h} L${x + 16},${SOL - h * 0.7} L${x + 60},${SOL} Z" fill="#dff2ff"/>
      <path d="M${x - 20},${SOL - h} L${x + 16},${SOL - h * 0.7} L${x + 10},${SOL} L${x - 6},${SOL} Z" fill="#bfe3f7"/>`;
  }
  return out;
}

function lave(r) {
  let out = `<path d="M0,${SOL - 20} L200,${SOL - 120} L280,${SOL - 60} L400,${SOL - 160} L520,${SOL - 70} L640,${SOL - 130} L${L},${SOL - 30} L${L},${H} L0,${H} Z" fill="#5b3a3a"/>`;
  out += `<path d="M380,${SOL - 158} q20,40 -10,80 q40,-10 60,10 q-10,-50 -50,-90 Z" fill="#ff7a3d"/>`;
  for (let i = 0; i < 5; i += 1) {
    const x = entre(r, 60, L - 60);
    out += `<circle cx="${x.toFixed(0)}" cy="${(SOL + entre(r, 20, 80)).toFixed(0)}" r="${entre(r, 6, 14).toFixed(0)}" fill="#ff9c4d" opacity="0.9"/>`;
  }
  return out;
}

function guirlandes(r) {
  let out = '';
  for (let i = 0; i < 2; i += 1) {
    const y = 60 + i * 40;
    out += `<path d="M0,${y} Q200,${y + 50} 400,${y} T${L},${y}" stroke="#ffffff" stroke-width="3" fill="none" opacity="0.7"/>`;
    for (let k = 0; k < 12; k += 1) {
      const x = 30 + k * 62;
      out += `<circle cx="${x}" cy="${y + 26 - Math.abs(6 - k) * 2}" r="7" fill="${['#ff6f91', '#ffd166', '#7bd6c0', '#9fd8f5'][k % 4]}"/>`;
    }
  }
  return out;
}

// --- Recettes de décor ------------------------------------------------------

const RECETTES = {
  foret: { sol: ['#5aa85f', '#468a4c'], fond: (r) => collines(r) + repartir(r, 4, sapin, { sMin: 0.8, sMax: 1.3 }), avant: (r) => buissons(r, 3) + champignons(r, 3) + fleurs(r, 6) },
  prairie: { sol: ['#79c96a', '#5fae55'], fond: (r) => collines(r, ['#8fd57c', '#6cbb5e']), avant: (r) => fleurs(r, 14) + buissons(r, 2) },
  montagne: { sol: ['#9fb08f', '#7e8f73'], fond: (r) => montagnes(r, true), avant: (r) => rochers(r, 4) + repartir(r, 2, sapin, { sMin: 0.6, sMax: 0.9 }) },
  plage: { sol: ['#f6e2b3', '#e8cf98'], fond: (r) => vagues(r) + repartir(r, 2, palmier, { max: 260, sMin: 0.9, sMax: 1.2 }), avant: (r) => rochers(r, 2, '#c9b48c') },
  ocean: { sol: ['#2a86c4', '#1d6ea6'], fond: (r) => vagues(r), avant: (r) => bateau(r) },
  bateau: { sol: ['#2a86c4', '#1d6ea6'], fond: (r) => vagues(r), avant: (r) => bateau(r) },
  riviere: { sol: ['#6bbf68', '#4e9c52'], fond: (r) => collines(r) + repartir(r, 3, feuillu, { sMin: 0.7, sMax: 1 }), avant: (r) => vagues(r, '#7fd0f0', '#3fa4d6') },
  lac: { sol: ['#6bbf68', '#4e9c52'], fond: (r) => montagnes(r, true) + repartir(r, 2, sapin), avant: (r) => vagues(r, '#8fd8f2', '#4aa8d8') },
  grotte: { sol: ['#4a3f6b', '#3a3154'], fond: (r) => stalactites(r), avant: (r) => rochers(r, 3, '#6a5c96') },
  souterrain: { sol: ['#5b4636', '#463527'], fond: (r) => stalactites(r, 5), avant: (r) => rochers(r, 3, '#7a6450') },
  chateau: { sol: ['#78c06a', '#5da255'], fond: (r) => collines(r, ['#8ccf7a']) + chateau(r), avant: (r) => buissons(r, 3) + fleurs(r, 6) },
  village: { sol: ['#7cc46c', '#5da255'], fond: (r) => collines(r) + repartir(r, 3, maison, { sMin: 0.7, sMax: 1 }), avant: (r) => buissons(r, 3) + fleurs(r, 5) },
  ville: { sol: ['#9aa3ad', '#7f8892'], fond: (r) => immeubles(r, 6), avant: (r) => repartir(r, 2, feuillu, { sMin: 0.5, sMax: 0.8 }) },
  marche: { sol: ['#c9b48c', '#b39f7a'], fond: (r) => immeubles(r, 4) + guirlandes(r), avant: (r) => repartir(r, 3, (x, y, s) => `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${s.toFixed(2)})"><rect x="-44" y="-30" width="88" height="32" fill="#e0c9a0"/><path d="M-54,-30 L54,-30 L40,-58 L-40,-58 Z" fill="#e35d5b"/></g>`) },
  foire: { sol: ['#7cc46c', '#5da255'], fond: (r) => guirlandes(r) + immeubles(r, 2), avant: (r) => repartir(r, 3, (x, y, s) => `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${s.toFixed(2)})"><path d="M-40,0 L0,-70 L40,0 Z" fill="#ffd166"/><path d="M-40,0 L0,-70 L-14,0 Z" fill="#e35d5b"/></g>`) },
  maison: { sol: ['#8ac47a', '#6aa85f'], fond: (r) => collines(r) + maison(400 + entre(r, -60, 60), SOL, 1.5), avant: (r) => fleurs(r, 8) + buissons(r, 2) },
  cabane: { sol: ['#5aa85f', '#468a4c'], fond: (r) => repartir(r, 3, sapin) + maison(420, SOL, 1.1, '#c08e5a', '#7a4a2b'), avant: (r) => champignons(r, 3) + buissons(r, 2) },
  desert: { sol: ['#f0d69b', '#dcbe7f'], fond: (r) => collines(r, ['#e9cd90', '#d9b877']), avant: (r) => cactus(r, 3) + rochers(r, 2, '#cbb489') },
  jungle: { sol: ['#3f9e57', '#2f7d45'], fond: (r) => collines(r, ['#57b06a', '#3d8f52']) + repartir(r, 3, palmier, { sMin: 0.9, sMax: 1.4 }), avant: (r) => buissons(r, 5, '#37945a') + fleurs(r, 6) },
  banquise: { sol: ['#eaf6ff', '#d6ebfb'], fond: (r) => glacons(r, 4), avant: (r) => vagues(r, '#a9dcf5', '#6cbde4') },
  volcan: { sol: ['#6b4a3a', '#54382c'], fond: (r) => lave(r), avant: (r) => rochers(r, 3, '#7a5a4a') },
  espace: { sol: ['#3b2a5e', '#2a1e46'], fond: (r) => planetes(r, 3), avant: (r) => rochers(r, 3, '#6b5a9a') },
  ciel: { sol: ['#cfe9ff', '#b9dcf7'], fond: (r) => nuages(r, 6), avant: (r) => nuages(r, 3) },
  ruines: { sol: ['#b8ad8f', '#9d9376'], fond: (r) => collines(r, ['#a8b98a']) + colonnes(r, 4), avant: (r) => rochers(r, 3, '#c7bda0') },
  temple: { sol: ['#c9bfa0', '#ab9f80'], fond: (r) => colonnes(r, 5), avant: (r) => rochers(r, 2, '#d5cbb0') },
  ferme: { sol: ['#8fc96a', '#6faa54'], fond: (r) => collines(r, ['#a3d97f']) + maison(300, SOL, 1.1, '#e2a15a', '#b8452f') + maison(560, SOL, 0.8, '#f2d9a8', '#8a5a34'), avant: (r) => fleurs(r, 8) + buissons(r, 2) },
  ecole: { sol: ['#8fc96a', '#6faa54'], fond: (r) => maison(400, SOL, 1.6, '#f4d9b0', '#c0553f') + repartir(r, 2, feuillu, { sMin: 0.7, sMax: 1 }), avant: (r) => fleurs(r, 6) },
  ile: { sol: ['#f6e2b3', '#e8cf98'], fond: (r) => vagues(r) + repartir(r, 2, palmier, { min: 240, max: 560, sMin: 1, sMax: 1.3 }), avant: (r) => rochers(r, 2, '#c9b48c') },
};

const CIELS = {
  jour: ['#8ed4ff', '#e8f6ff'],
  soir: ['#ff9d6e', '#ffe0b3'],
  nuit: ['#16255c', '#43619f'],
};

function positions(n) {
  if (n <= 1) return [400];
  if (n === 2) return [300, 520];
  return [200, 400, 610];
}

/**
 * Retourne le code SVG d'une scène.
 * decor : { lieu, moment, acteurs, objets_decor }
 */
export function dessinerScene(decor = {}, graine = 'x') {
  const r = rng(String(graine));
  const lieu = RECETTES[decor.lieu] ? decor.lieu : 'prairie';
  const moment = ['jour', 'soir', 'nuit'].includes(decor.moment) ? decor.moment : 'jour';
  const recette = RECETTES[lieu];
  const [cielHaut, cielBas] = CIELS[moment];

  let svg = `<svg viewBox="0 0 ${L} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax slice" class="scene-svg" role="img">
    <defs>${degrade('g-ciel', cielHaut, cielBas)}${degrade('g-espace', '#160d33', '#3b2a6b')}${degrade('g-grotte', '#241a44', '#4a3f6b')}</defs>`;

  svg += ciel(moment, lieu);
  if (lieu === 'espace') svg += etoiles(r, 70);
  else if (moment === 'nuit') svg += etoiles(r, 45) + astre('nuit');
  else if (lieu !== 'grotte' && lieu !== 'souterrain') svg += astre(moment) + nuages(r, moment === 'soir' ? 2 : 3, moment === 'soir' ? '#ffd9c0' : '#ffffff');

  svg += recette.fond(r);
  svg += terre(recette.sol[0], recette.sol[1]);
  svg += recette.avant(r);

  // Personnages : emojis posés sur le sol, avec ombre et petit balancement.
  const acteurs = (decor.acteurs || []).filter(Boolean).slice(0, 3);
  const xs = positions(acteurs.length);
  acteurs.forEach((emoji, i) => {
    const x = xs[i];
    const y = SOL + 46 + (i % 2 === 0 ? 0 : 10);
    svg += `<ellipse cx="${x}" cy="${y + 8}" rx="42" ry="12" fill="#000" opacity="0.16"/>
      <text x="${x}" y="${y}" font-size="92" text-anchor="middle" class="acteur" style="animation-delay:${(i * 0.35).toFixed(2)}s">${emoji}</text>`;
  });

  const objets = (decor.objets_decor || []).filter(Boolean).slice(0, 2);
  objets.forEach((emoji, i) => {
    const x = i === 0 ? 80 : L - 80;
    svg += `<text x="${x}" y="${SOL + 16}" font-size="52" text-anchor="middle" class="objet-decor">${emoji}</text>`;
  });

  svg += '</svg>';
  return svg;
}

export function scenePlaceholder() {
  return dessinerScene({ lieu: 'prairie', moment: 'jour', acteurs: ['✨'], objets_decor: [] }, 'accueil');
}
