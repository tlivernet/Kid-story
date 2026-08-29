// Le surlignage vit dans le DOM : il se teste dans un vrai navigateur.
//   npx http-server -p 8123 -c-1 &   puis   node tests/surlignage.mjs
const ADRESSE = process.env.ADRESSE || 'http://127.0.0.1:8123/index.html';

let chromium;
try { ({ chromium } = await import('playwright')); } catch {
  console.error('Playwright manquant : npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}

const echecs = [];
const verifier = (condition, message) => {
  console.log(`${condition ? '✅' : '❌'} ${message}`);
  if (!condition) echecs.push(message);
};

const navigateur = await chromium.launch();
const page = await navigateur.newPage();
const erreursJs = [];
page.on('pageerror', (e) => erreursJs.push(e.message));
await page.goto(ADRESSE);

// Deux phrases de trois mots, comme les construit l'écran de jeu.
await page.evaluate(() => {
  const zone = document.querySelector('#texte-histoire');
  zone.innerHTML = '';
  [['Le', 'renard', 'court'], ['Il', 'saute', 'haut']].forEach((mots, index) => {
    const phrase = document.createElement('span');
    phrase.className = 'phrase';
    phrase.dataset.index = String(index);
    let position = 0;
    mots.forEach((mot, i) => {
      if (i) { phrase.appendChild(document.createTextNode(' ')); position += 1; }
      const noeud = document.createElement('span');
      noeud.className = 'mot';
      noeud.textContent = mot;
      noeud.dataset.debut = String(position);
      noeud.dataset.fin = String(position + mot.length);
      phrase.appendChild(noeud);
      position += mot.length;
    });
    zone.appendChild(phrase);
  });
});

const etat = () => page.evaluate(() => ({
  phrasesLues: [...document.querySelectorAll('.phrase.lue')].map((p) => p.dataset.index),
  motsActifs: [...document.querySelectorAll('.mot.actif')].map((m) => m.textContent),
}));

await page.evaluate(async () => {
  const m = await import('./js/surlignage.js');
  window.__s = m;
});

// Lecture de la première phrase, jusqu'à son dernier mot.
await page.evaluate(() => { window.__s.marquerPhrase(0); window.__s.marquerMot(0, 0); });
await page.evaluate(() => window.__s.marquerMot(0, 10)); // « court », dernier mot de la phrase
let vue = await etat();
verifier(vue.motsActifs.join() === 'court', `le mot lu est surligné (${vue.motsActifs.join() || 'aucun'})`);

// Passage à la phrase suivante : c'est là que le dernier mot restait allumé.
await page.evaluate(() => window.__s.marquerPhrase(1));
vue = await etat();
verifier(vue.motsActifs.length === 0, `aucun mot ne reste allumé au changement de phrase (${vue.motsActifs.join() || 'aucun'})`);
verifier(vue.phrasesLues.join() === '1', `seule la nouvelle phrase est surlignée (${vue.phrasesLues.join()})`);

// Un seul mot allumé à la fois à l'intérieur d'une phrase.
await page.evaluate(() => { window.__s.marquerMot(1, 0); window.__s.marquerMot(1, 3); });
vue = await etat();
verifier(vue.motsActifs.join() === 'saute', `un seul mot allumé à la fois (${vue.motsActifs.join() || 'aucun'})`);

// Fin de lecture : plus rien n'est surligné.
await page.evaluate(() => window.__s.effacerTout());
vue = await etat();
verifier(vue.motsActifs.length === 0 && vue.phrasesLues.length === 0, 'tout s’éteint à la fin de la lecture');

verifier(erreursJs.length === 0, `aucune erreur JavaScript${erreursJs.length ? ` (${erreursJs.join(' | ')})` : ''}`);
await navigateur.close();
process.exit(echecs.length ? 1 : 0);
