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
await page.click('.grille-themes .carte-theme >> nth=0');
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
async function lancerJeu(jeu, difficulte, texte = []) {
  return page.evaluate(async ({ jeu, difficulte, texte }) => {
    const m = await import('./js/minijeux.js');
    document.querySelector('#overlay-epreuve').hidden = false;
    const zone = document.querySelector('#epreuve-zone');
    window.__ordre = [];
    window.__resultat = undefined;
    m.jouer(jeu, zone, {
      difficulte,
      texte,
      narrer() {},
      surDemonstration: (symbole) => window.__ordre.push(symbole),
    }).then((r) => { window.__resultat = r; });
  }, { jeu, difficulte, texte });
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

// Les jeux d'action ajoutés pour le combat.
await lancerJeu('corde', 3);
await page.waitForSelector('#epreuve-zone .jeu-tambour:not([disabled])', { timeout: 12000 });
const finCorde = Date.now() + 15000;
while ((await resultatJeu()) === undefined && Date.now() < finCorde) {
  await page.click('#epreuve-zone .jeu-tambour', { timeout: 2000 }).catch(() => {});
  await page.waitForTimeout(40);
}
await page.waitForTimeout(900);
const scoreCorde = await resultatJeu();
verifier(scoreCorde?.reussi === true, `tir à la corde : tirer vite fait gagner (${scoreCorde?.detail ?? 'aucun résultat'})`);

await lancerJeu('compter', 3);
await page.waitForSelector('#epreuve-zone .jeu-tambour:not([disabled])', { timeout: 12000 });
const aTaper = await page.$$eval('#epreuve-zone .pastille-compte', (n) => n.length);
for (let i = 0; i < aTaper; i += 1) {
  await page.click('#epreuve-zone .jeu-tambour');
  await page.waitForTimeout(120);
}
await page.waitForTimeout(3000);
const scoreCompte = await resultatJeu();
verifier(scoreCompte?.reussi === true, `compte juste : ${aTaper} tapes exactement (${scoreCompte?.detail ?? 'aucun résultat'})`);

await lancerJeu('taupes', 2);
const finTaupes = Date.now() + 25000;
while ((await resultatJeu()) === undefined && Date.now() < finTaupes) {
  const ami = await page.$('#epreuve-zone .jeu-cible:not(.guepe):not(.attrapee)');
  if (ami) await ami.click().catch(() => {});
  await page.waitForTimeout(120);
}
const scoreTaupes = await resultatJeu();
verifier(scoreTaupes?.reussi === true, `attrape sans se faire piquer : les guêpes évitées (${scoreTaupes?.detail ?? 'aucun résultat'})`);

// Jeux de lecture : ils doivent piocher dans le texte du chapitre.
const chapitre = [
  'Alban pousse la porte violette du jardin.',
  'Un ballon jaune flotte devant lui, tout tremblant.',
];
await lancerJeu('motJuste', 3, chapitre);
await page.waitForSelector('#epreuve-zone .jeu-mot');
const motsProposes = await page.$$eval('#epreuve-zone .jeu-mot', (n) => n.map((m) => m.textContent));
const consigneMot = await page.textContent('#epreuve-zone .jeu-consigne');
const attendu = consigneMot.replace('Touche le mot :', '').trim();
verifier(motsProposes.length === 3 && motsProposes.includes(attendu),
  `touche le bon mot : « ${attendu} » parmi ${motsProposes.join(', ')}`);
await page.click(`#epreuve-zone .jeu-mot:text-is("${attendu}")`);
await page.waitForTimeout(800);
verifier((await resultatJeu())?.reussi === true, 'le bon mot fait gagner');

await lancerJeu('motManquant', 3, chapitre);
await page.waitForSelector('#epreuve-zone .jeu-mot');
const phraseTrou = await page.textContent('#epreuve-zone .jeu-consigne');
verifier(phraseTrou.includes('_____'), `le mot qui manque : « ${phraseTrou.split('\n').pop().trim()} »`);

await lancerJeu('lireEtFaire', 3, chapitre);
await page.waitForSelector('#epreuve-zone .jeu-lire');
const aLire = await page.textContent('#epreuve-zone .jeu-lire');
const images = await page.$$eval('#epreuve-zone .jeu-case', (n) => n.length);
verifier(images >= 3 && /Touche le mot/.test(aLire), `lis et trouve : « ${aLire.trim()} » avec ${images} images`);

await lancerJeu('intrus', 5);
await page.waitForSelector('#epreuve-zone .jeu-case');
const nbCases = (await page.$$('#epreuve-zone .jeu-case')).length;
verifier(nbCases === 16, `trouve l’intrus devient difficile : ${nbCases} cases au niveau 5`);

// --- Rencontre costaude et carte des lieux ---------------------------------
const etatEcran = () => page.evaluate(() => ({
  combat: Boolean(document.querySelector('#epreuve-objectif .adversaire')),
  epreuve: !document.querySelector('#overlay-epreuve').hidden,
  choix: document.querySelectorAll('#choix:not(.masque) .carte-choix').length,
  actions: document.querySelectorAll('#epreuve-zone .carte-choix').length,
}));

let deVerifie = false;
async function jouerEpreuve() {
  if (await page.isVisible('#btn-lancer-de')) {
    // Le seuil annoncé doit tenir compte du bonus : sinon l'enfant lit
    // « il faut 3 », fait 2, et gagne quand même.
    if (!deVerifie) {
      deVerifie = true;
      const de = await page.evaluate(() => ({
        consigne: document.querySelector('.epreuve-consigne')?.textContent || '',
        gagnantes: document.querySelectorAll('.faces-gagnantes .face.gagnante').length,
      }));
      const seuil = Number((de.consigne.match(/(\d+)/) || [])[1]);
      verifier(
        Number.isFinite(seuil) && de.gagnantes === 7 - seuil,
        `le dé annonce le vrai seuil : « ${de.consigne.trim()} » et ${de.gagnantes} faces gagnantes`,
      );
    }
    await page.click('#btn-lancer-de');
    await page.waitForTimeout(2800);
    return;
  }
  const cibles = await page.$$('#epreuve-zone .jeu-case, #epreuve-zone .jeu-cible, #epreuve-zone .jeu-tambour');
  for (const cible of cibles.slice(0, 8)) await cible.click().catch(() => {});
  await page.waitForTimeout(1500);
}

async function attendreAction() {
  await page.waitForFunction(() => (
    !document.querySelector('#overlay-epreuve').hidden
    || document.querySelector('#choix:not(.masque) .carte-choix') !== null
  ), { timeout: 40000 });
}

await page.goto(ADRESSE); // on repart d'une aventure neuve
await page.click('#btn-nouvelle');
await page.click('.grille-themes .carte-theme >> nth=0');
await page.fill('#champ-prenom', 'Lina');
await page.click('#btn-demarrer');

let combatVu = false;
for (let tour = 0; tour < 25 && !combatVu; tour += 1) {
  await attendreAction();
  const vue = await etatEcran();
  if (vue.combat) { combatVu = true; break; }
  if (vue.epreuve) { await jouerEpreuve(); continue; }
  await page.click('#choix .carte-choix');
  await page.waitForTimeout(3800);
}
verifier(combatVu, 'une rencontre costaude finit par barrer la route');

for (let manche = 0; manche < 20; manche += 1) {
  const vue = await etatEcran();
  if (!vue.epreuve) break;
  if (vue.actions) {
    await page.click('#epreuve-zone .carte-choix');
    await page.waitForTimeout(600);
    continue;
  }
  await jouerEpreuve();
}
await page.waitForTimeout(1500);
verifier(await page.isHidden('#overlay-epreuve'), 'le combat se termine et rend la main à l’histoire');

await page.waitForSelector('#choix:not(.masque) .carte-choix', { timeout: 40000 });
await page.click('#btn-resume');
await page.waitForTimeout(400);
const lieux = (await page.$$('#carte-lieux .tuile-lieu')).length;
verifier(lieux >= 2, `la carte propose de retourner dans un lieu connu (${lieux} lieux)`);
await page.click('#btn-fermer-resume');

verifier(deVerifie, 'une épreuve de dé a bien été rencontrée pendant le parcours');

verifier(erreursJs.length === 0, `aucune erreur JavaScript${erreursJs.length ? ` (${erreursJs.join(' | ')})` : ''}`);
await navigateur.close();
process.exit(echecs.length ? 1 : 0);
