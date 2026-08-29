// Test de bout en bout dans un vrai navigateur (Chromium via Playwright).
// Ne fait pas partie de `npm test` : il demande un navigateur.
//   npm i -D playwright && npx playwright install chromium
//   npx http-server -p 8123 -c-1 &   puis   node tests/navigateur.mjs
const ADRESSE = process.env.ADRESSE || 'http://127.0.0.1:8123/index.html';

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

const navigateur = await chromium.launch();
const page = await navigateur.newPage({ viewport: { width: 420, height: 860 } });
const erreursJs = [];
page.on('pageerror', (e) => erreursJs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') erreursJs.push(m.text()); });

// Le mode démo suffit : aucune clé API n'est nécessaire.
await page.addInitScript(() => {
  localStorage.setItem('livre-magique:reglages', JSON.stringify({ epreuves: 'de' }));
});
await page.goto(ADRESSE);

// --- Parcours d'une aventure ------------------------------------------------
await page.click('#btn-nouvelle');
await page.click('.grille-themes .carte-theme:nth-child(1)');
await page.fill('#champ-prenom', 'Lina');
await page.click('#btn-demarrer');
await page.waitForSelector('#choix .carte-choix:not([hidden])', { timeout: 15000 });
verifier((await page.$$('.phrase')).length >= 3, 'le chapitre s’affiche phrase par phrase');
verifier(!(await page.$eval('#choix', (n) => n.classList.contains('masque'))), 'les choix apparaissent après la lecture');

const premier = await page.$('#choix .carte-choix');
await premier.click();
verifier(await premier.evaluate((n) => n.classList.contains('choisi')), 'un appui sélectionne la tuile');
await page.waitForFunction(() => document.querySelector('#choix .carte-choix.compte') !== null, { timeout: 6000 });
verifier(true, 'la jauge de validation démarre après la relecture');
await page.waitForSelector('#chargement:not([hidden])', { timeout: 8000 });
verifier(true, 'le choix se valide tout seul après trois secondes');
await page.waitForSelector('#choix .carte-choix', { timeout: 20000 });

await page.click('#btn-resume');
await page.waitForTimeout(300);
verifier((await page.$$('#contenu-resume .resume-ligne')).length >= 3, 'le résumé de l’histoire est lisible');
await page.click('#btn-fermer-resume');

// Régression : rouvrir l'application puis « Continuer » doit réafficher le chapitre.
await page.click('#btn-maison');
await page.reload();
await page.waitForSelector('#btn-continuer:not([hidden])', { timeout: 5000 });
await page.click('#btn-continuer');
await page.waitForTimeout(800);
const reprise = await page.evaluate(() => ({
  phrases: document.querySelectorAll('.phrase').length,
  choix: document.querySelectorAll('#choix .carte-choix').length,
}));
verifier(reprise.phrases > 0 && reprise.choix > 0,
  `« Continuer » réaffiche l’histoire (${reprise.phrases} phrases, ${reprise.choix} choix)`);

// --- Mini-jeux --------------------------------------------------------------
async function lancerJeu(jeu, difficulte) {
  return page.evaluate(async ({ jeu, difficulte }) => {
    const m = await import('./js/minijeux.js');
    document.querySelector('#overlay-epreuve').hidden = false;
    const zone = document.querySelector('#epreuve-zone');
    window.__ordre = [];
    window.__resultat = undefined;
    m.jouer(jeu, zone, {
      difficulte,
      narrer() {},
      surDemonstration: (symbole) => window.__ordre.push(symbole),
    }).then((r) => { window.__resultat = r; });
  }, { jeu, difficulte });
}
const resultatJeu = () => page.evaluate(() => window.__resultat);

await lancerJeu('intrus', 3);
await page.waitForSelector('#epreuve-zone .jeu-case');
const rangIntrus = await page.evaluate(() => {
  const cases = [...document.querySelectorAll('#epreuve-zone .jeu-case')].map((b) => b.textContent);
  const compte = {};
  cases.forEach((c) => { compte[c] = (compte[c] || 0) + 1; });
  return cases.findIndex((c) => compte[c] === 1);
});
await page.click(`#epreuve-zone .jeu-case:nth-child(${rangIntrus + 1})`);
await page.waitForTimeout(700);
verifier((await resultatJeu())?.reussi === true, 'trouve l’intrus : la bonne image gagne');

await lancerJeu('memoire', 4);
await page.waitForSelector('#epreuve-zone .jeu-case:not([disabled])', { timeout: 15000 });
for (const symbole of await page.evaluate(() => window.__ordre)) {
  await page.click(`#epreuve-zone .jeu-case:text-is("${symbole}")`);
  await page.waitForTimeout(260);
}
await page.waitForTimeout(600);
verifier((await resultatJeu())?.reussi === true, 'jeu de mémoire : la suite répétée gagne');

await lancerJeu('attrape', 3);
const limite = Date.now() + 25000;
while ((await resultatJeu()) === undefined && Date.now() < limite) {
  const cible = await page.$('#epreuve-zone .jeu-cible:not(.attrapee)');
  if (cible) await cible.click().catch(() => {});
  await page.waitForTimeout(120);
}
const scoreAttrape = await resultatJeu();
verifier(scoreAttrape?.reussi === true, `attrape les amis : toutes les cibles touchées gagne (${scoreAttrape?.detail ?? 'aucun résultat'})`);

await lancerJeu('tape', 3);
await page.waitForSelector('#epreuve-zone .jeu-tambour:not([disabled])', { timeout: 10000 });
const objectifTape = await page.$eval('#epreuve-zone .jeu-jauge', (n) => Number(n.textContent.split('/')[1]));
for (let i = 0; i < objectifTape; i += 1) {
  await page.click('#epreuve-zone .jeu-tambour', { timeout: 2000 }).catch(() => {});
}
await page.waitForTimeout(900);
const scoreTape = await resultatJeu();
verifier(scoreTape?.reussi === true, `tape vite : ${objectifTape} coups suffisent (${scoreTape?.detail ?? 'aucun résultat'})`);

await lancerJeu('intrus', 5);
await page.waitForSelector('#epreuve-zone .jeu-case');
const nbCases = (await page.$$('#epreuve-zone .jeu-case')).length;
verifier(nbCases === 16, `trouve l’intrus devient difficile : ${nbCases} cases au niveau 5`);

verifier(erreursJs.length === 0, `aucune erreur JavaScript${erreursJs.length ? ` (${erreursJs.join(' | ')})` : ''}`);
await navigateur.close();
process.exit(echecs.length ? 1 : 0);
