// Génère les icônes PNG de l'application (aucune dépendance : encodeur PNG maison).
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';

const TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function morceau(type, donnees) {
  const longueur = Buffer.alloc(4);
  longueur.writeUInt32BE(donnees.length);
  const corps = Buffer.concat([Buffer.from(type, 'ascii'), donnees]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corps));
  return Buffer.concat([longueur, corps, crc]);
}

function encoderPng(largeur, hauteur, pixels) {
  const brut = Buffer.alloc((largeur * 4 + 1) * hauteur);
  for (let y = 0; y < hauteur; y += 1) {
    brut[y * (largeur * 4 + 1)] = 0;
    pixels.copy(brut, y * (largeur * 4 + 1) + 1, y * largeur * 4, (y + 1) * largeur * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largeur, 0);
  ihdr.writeUInt32BE(hauteur, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    morceau('IHDR', ihdr),
    morceau('IDAT', zlib.deflateSync(brut, { level: 9 })),
    morceau('IEND', Buffer.alloc(0)),
  ]);
}

// --- Dessin (coordonnées normalisées 0..1, échantillonnage 3x3) -------------

const dansPolygone = (px, py, pts) => {
  let dedans = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i += 1) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) dedans = !dedans;
  }
  return dedans;
};

function etoile(cx, cy, rExt, rInt, branches = 5) {
  const pts = [];
  for (let i = 0; i < branches * 2; i += 1) {
    const r = i % 2 === 0 ? rExt : rInt;
    const a = (Math.PI * i) / branches - Math.PI / 2;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}

function melanger(fond, couleur, alpha) {
  return [
    fond[0] * (1 - alpha) + couleur[0] * alpha,
    fond[1] * (1 - alpha) + couleur[1] * alpha,
    fond[2] * (1 - alpha) + couleur[2] * alpha,
  ];
}

function dessiner(taille) {
  const pixels = Buffer.alloc(taille * taille * 4);
  const rayon = 0.22;                       // coins arrondis
  const livreG = [[0.16, 0.66], [0.48, 0.58], [0.48, 0.86], [0.14, 0.90]];
  const livreD = [[0.52, 0.58], [0.84, 0.66], [0.86, 0.90], [0.52, 0.86]];
  const etoileHaute = etoile(0.5, 0.34, 0.20, 0.085);
  const petite1 = etoile(0.20, 0.22, 0.055, 0.024);
  const petite2 = etoile(0.80, 0.26, 0.045, 0.02);

  for (let y = 0; y < taille; y += 1) {
    for (let x = 0; x < taille; x += 1) {
      let r = 0; let g = 0; let b = 0; let a = 0;
      for (let sy = 0; sy < 3; sy += 1) {
        for (let sx = 0; sx < 3; sx += 1) {
          const px = (x + (sx + 0.5) / 3) / taille;
          const py = (y + (sy + 0.5) / 3) / taille;

          // Fond arrondi avec dégradé violet → rose.
          const dx = Math.max(rayon - px, px - (1 - rayon), 0);
          const dy = Math.max(rayon - py, py - (1 - rayon), 0);
          const dehors = Math.hypot(dx, dy) > rayon;
          if (dehors) continue;

          let couleur = melanger([91, 63, 168], [140, 88, 200], py);
          couleur = melanger(couleur, [255, 111, 145], Math.max(0, py - 0.55) * 0.8);

          if (dansPolygone(px, py, petite1) || dansPolygone(px, py, petite2)) couleur = [255, 255, 255];
          if (dansPolygone(px, py, etoileHaute)) couleur = [255, 201, 77];
          if (dansPolygone(px, py, livreG) || dansPolygone(px, py, livreD)) couleur = [253, 246, 232];
          if (px > 0.485 && px < 0.515 && py > 0.56 && py < 0.88) couleur = [214, 197, 168];

          r += couleur[0]; g += couleur[1]; b += couleur[2]; a += 255;
        }
      }
      const n = 9;
      const i = (y * taille + x) * 4;
      const alpha = a / n;
      pixels[i] = alpha ? Math.round(r / (a / 255)) : 0;
      pixels[i + 1] = alpha ? Math.round(g / (a / 255)) : 0;
      pixels[i + 2] = alpha ? Math.round(b / (a / 255)) : 0;
      pixels[i + 3] = Math.round(alpha);
    }
  }
  return encoderPng(taille, taille, pixels);
}

const dossier = path.join(process.cwd(), 'icons');
fs.mkdirSync(dossier, { recursive: true });
for (const taille of [180, 192, 512]) {
  fs.writeFileSync(path.join(dossier, `icone-${taille}.png`), dessiner(taille));
  console.log(`icons/icone-${taille}.png`);
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#5b3fa8"/><stop offset="0.6" stop-color="#8c58c8"/><stop offset="1" stop-color="#ff6f91"/>
  </linearGradient></defs>
  <rect width="100" height="100" rx="22" fill="url(#f)"/>
  <path d="M20 22 l2 5 5 1 -4 4 1 5 -4 -3 -4 3 1 -5 -4 -4 5 -1z" fill="#fff" opacity="0.9"/>
  <path d="M80 26 l1.6 4 4 0.8 -3 3 0.8 4 -3.4 -2.4 -3.4 2.4 0.8 -4 -3 -3 4 -0.8z" fill="#fff" opacity="0.8"/>
  <path d="M50 14 L57 30 L74 32 L61 43 L65 60 L50 51 L35 60 L39 43 L26 32 L43 30 Z" fill="#ffc94d"/>
  <path d="M16 66 L48 58 L48 86 L14 90 Z" fill="#fdf6e8"/>
  <path d="M52 58 L84 66 L86 90 L52 86 Z" fill="#fdf6e8"/>
  <rect x="48.5" y="56" width="3" height="32" fill="#d6c5a8"/>
</svg>`;
fs.writeFileSync(path.join(dossier, 'icone.svg'), svg);
console.log('icons/icone.svg');
