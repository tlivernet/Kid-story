// Audit de contraste sur le rendu réel, dans les deux thèmes.
//
// Le test unitaire tests/contraste.test.mjs compare des couples de couleurs
// écrits à la main : il a laissé passer un fond clair resté clair en thème
// sombre sous un texte devenu clair, donc invisible. Ici on ne suppose rien —
// on ouvre l'application, on mesure getComputedStyle sur chaque élément qui
// porte du texte, et on remonte les ancêtres pour trouver le fond réellement
// peint.
//   npx http-server -p 8123 -c-1 &   puis   node tests/contraste-navigateur.mjs
//
// Par défaut il ne joue que trois mini-jeux représentatifs : la passe complète
// prend plusieurs minutes et n'a pas sa place à chaque livraison.
//   COMPLET=1 node tests/contraste-navigateur.mjs   → les dix mini-jeux.
const ADRESSE = process.env.ADRESSE || 'http://127.0.0.1:8123/index.html';
const COMPLET = process.env.COMPLET === '1';
// « lis et trouve » est le jeu où le défaut est apparu ; « touche le bon mot »
// couvre les cartes de lecture, « intrus » les cases colorées et le chronomètre.
const JEUX_RAPIDES = ['lireEtFaire', 'motJuste', 'intrus'];
const JEUX_TOUS = ['intrus', 'memoire', 'tape', 'corde', 'compter', 'attrape', 'taupes',
  'motJuste', 'motManquant', 'lireEtFaire'];

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('Playwright manquant : npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}

const echecs = [];
const verifier = (condition, message) => {
  console.log(`${condition ? '✅' : '❌'} ${message}`);
  if (!condition) echecs.push(message);
};

// Injecté dans la page : rend la liste des textes trop peu contrastés.
const AUDIT = () => {
  const canal = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const lire = (couleur) => {
    const m = couleur.match(/[\d.]+/g);
    if (!m) return null;
    const [r, v, b, a = '1'] = m;
    return { r: +r, v: +v, b: +b, a: +a };
  };
  const luminance = ({ r, v, b }) => 0.2126 * canal(r) + 0.7152 * canal(v) + 0.0722 * canal(b);
  const fondu = (dessus, dessous) => ({
    r: dessus.r * dessus.a + dessous.r * (1 - dessus.a),
    v: dessus.v * dessus.a + dessous.v * (1 - dessus.a),
    b: dessus.b * dessus.a + dessous.b * (1 - dessus.a),
    a: 1,
  });
  // Le fond réellement peint : on empile les ancêtres jusqu'à l'opacité pleine.
  const fondDe = (noeud) => {
    let couche = { r: 255, v: 255, b: 255, a: 1 };
    const pile = [];
    for (let n = noeud; n && n !== document.documentElement.parentNode; n = n.parentElement) {
      const c = lire(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0) pile.push(c);
      if (c && c.a >= 1) break;
    }
    for (const c of pile.reverse()) couche = fondu(c, couche);
    return couche;
  };
  const contraste = (a, b) => {
    const [haut, bas] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (haut + 0.05) / (bas + 0.05);
  };

  const problemes = [];
  for (const noeud of document.querySelectorAll('body *')) {
    const style = getComputedStyle(noeud);
    if (style.visibility === 'hidden' || style.display === 'none' || +style.opacity === 0) continue;
    const boite = noeud.getBoundingClientRect();
    if (!boite.width || !boite.height) continue;
    // Seul le texte posé directement dans ce nœud est peint par sa couleur.
    const texte = [...noeud.childNodes]
      .filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim();
    if (!texte) continue;
    // Un emoji est une image : sa lisibilité ne dépend pas de la couleur du texte.
    if (!/[a-zA-Z0-9À-ÿ]/.test(texte)) continue;
    const avant = lire(style.color);
    if (!avant || avant.a === 0) continue;
    const fond = fondDe(noeud);
    const mesure = contraste(fondu(avant, fond), fond);
    const px = parseFloat(style.fontSize);
    const gras = parseInt(style.fontWeight, 10) >= 700;
    const seuil = (px >= 24 || (px >= 18.66 && gras)) ? 3 : 4.5;
    if (mesure < seuil) {
      problemes.push({
        ou: noeud.className || noeud.tagName.toLowerCase(),
        texte: texte.slice(0, 34),
        mesure: +mesure.toFixed(2),
        seuil,
        couleur: style.color,
        fond: `rgb(${Math.round(fond.r)}, ${Math.round(fond.v)}, ${Math.round(fond.b)})`,
      });
    }
  }
  return problemes;
};

async function auditer(page, quoi) {
  const problemes = await page.evaluate(AUDIT);
  verifier(
    problemes.length === 0,
    problemes.length === 0
      ? `${quoi} : tous les textes sont lisibles`
      : `${quoi} : ${problemes.length} texte(s) illisible(s) — ${problemes
        .map((p) => `« ${p.texte} » (.${String(p.ou).split(' ')[0]}) ${p.mesure} < ${p.seuil}, ${p.couleur} sur ${p.fond}`)
        .join(' | ')}`,
  );
}

const navigateur = await chromium.launch();

for (const theme of ['light', 'dark']) {
  const page = await navigateur.newPage({ viewport: { width: 420, height: 900 }, colorScheme: theme });
  await page.addInitScript(() => {
    localStorage.setItem('livre-magique:reglages', JSON.stringify({ epreuves: 'de', lectureAuto: false }));
  });
  await page.goto(ADRESSE);
  await page.waitForTimeout(300);
  await auditer(page, `thème ${theme} · accueil`);

  await page.click('#btn-nouvelle');
  await page.waitForTimeout(200);
  await auditer(page, `thème ${theme} · choix du thème`);

  await page.click('.grille-themes .carte-theme >> nth=0');
  await page.fill('#champ-prenom', 'Lina');
  await page.click('#grille-avatars .avatar >> nth=0');
  await page.waitForTimeout(200);
  await auditer(page, `thème ${theme} · héros`);

  await page.click('#btn-demarrer');
  await page.waitForSelector('#choix .carte-choix', { timeout: 20000 });
  await page.waitForTimeout(500);
  await auditer(page, `thème ${theme} · écran de jeu`);

  // Le carnet : une aventure en cours y figure dès le premier chapitre.
  await page.evaluate(() => { document.querySelector('#btn-maison').click(); });
  await page.waitForTimeout(300);
  await page.click('#btn-carnet');
  await page.waitForTimeout(400);
  await auditer(page, `thème ${theme} · carnet`);
  await page.evaluate(() => { document.querySelector('#ecran-carnet [data-retour]').click(); });
  await page.waitForTimeout(300);
  await page.click('#btn-continuer');
  await page.waitForSelector('#choix .carte-choix', { timeout: 20000 });
  await page.waitForTimeout(400);

  await page.click('#btn-outils');
  await page.waitForTimeout(200);
  await auditer(page, `thème ${theme} · menu d’outils`);
  await page.click('#btn-resume');
  await page.waitForTimeout(300);
  await auditer(page, `thème ${theme} · résumé de l’histoire`);
  await page.click('#btn-fermer-resume');
  await page.click('#btn-sac');
  await page.waitForTimeout(300);
  await auditer(page, `thème ${theme} · sac de quête`);
  await page.click('#btn-fermer-sac');

  // Chaque mini-jeu, à l'écran, dans le même thème.
  const lancerJeu = (jeu, difficulte, texte = []) => page.evaluate(async ({ jeu, difficulte, texte }) => {
    const m = await import('./js/minijeux.js');
    document.querySelector('#overlay-epreuve').hidden = false;
    const zone = document.querySelector('#epreuve-zone');
    m.jouer(jeu, zone, { difficulte, texte, narrer() {} });
  }, { jeu, difficulte, texte });

  const phrases = ['Le renard court vite.', 'Un ballon jaune roule devant lui.'];
  for (const jeu of COMPLET ? JEUX_TOUS : JEUX_RAPIDES) {
    await lancerJeu(jeu, 3, phrases);
    await page.waitForTimeout(1600);
    await auditer(page, `thème ${theme} · mini-jeu ${jeu}`);
    // On force aussi les états gagné/raté, qui repeignent les cases.
    await page.evaluate(() => {
      const cases = document.querySelectorAll('#epreuve-zone .jeu-case, #epreuve-zone .jeu-mot');
      if (cases[0]) cases[0].classList.add('trouve');
      if (cases[1]) cases[1].classList.add('rate');
      if (cases[2]) cases[2].classList.add('allume');
    });
    await auditer(page, `thème ${theme} · mini-jeu ${jeu} (gagné/raté)`);
    await page.evaluate(() => { document.querySelector('#overlay-epreuve').hidden = true; });
  }
  await page.close();
}

await navigateur.close();
console.log(echecs.length
  ? `\n${echecs.length} problème(s) de contraste`
  : `\nAucun texte illisible${COMPLET ? ' (passe complète)' : ' (passe rapide — COMPLET=1 pour les dix mini-jeux)'}`);
process.exit(echecs.length ? 1 : 0);
