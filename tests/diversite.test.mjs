// Ce que voit réellement le modèle quand il doit proposer un objet.
import test from 'node:test';
import assert from 'node:assert/strict';

// localStorage minimal pour tester la mémoire longue hors navigateur.
const memoire = new Map();
globalThis.localStorage = {
  getItem: (c) => (memoire.has(c) ? memoire.get(c) : null),
  setItem: (c, v) => memoire.set(c, String(v)),
  removeItem: (c) => memoire.delete(c),
};

const { coffre } = await import('../js/prompt.js');
const { TRESORS, INSPIRATIONS } = await import('../js/config.js');
const { souvenirs } = await import('../js/storage.js');

const etatAvec = (objetsEvites = []) => ({ objetsEvites, sac: [] });

test('la réserve de trésors est assez large pour ne pas tourner en rond', () => {
  assert.ok(TRESORS.length >= 60, `seulement ${TRESORS.length} trésors`);
  const noms = new Set(TRESORS.map((t) => t.nom));
  assert.equal(noms.size, TRESORS.length, 'aucun doublon dans la réserve');
});

test('chaque tour propose un tirage différent', () => {
  const tirages = new Set();
  for (let i = 0; i < 20; i += 1) tirages.add(coffre(etatAvec()));
  assert.ok(tirages.size >= 18, `tirages trop semblables : ${tirages.size} sur 20`);
});

test('un tirage contient huit trésors distincts', () => {
  const texte = coffre(etatAvec());
  const items = texte.split(':')[1].split(';').map((t) => t.trim());
  assert.equal(items.length, 8);
  assert.equal(new Set(items).size, 8);
});

test('les objets déjà vus sont écartés du tirage et annoncés au modèle', () => {
  const evites = TRESORS.slice(0, 5).map((t) => t.nom);
  for (let i = 0; i < 30; i += 1) {
    const texte = coffre(etatAvec(evites));
    for (const nom of evites) {
      assert.ok(!texte.split('\n')[0].includes(nom), `${nom} ne devrait plus être proposé`);
    }
    assert.match(texte, /Déjà vus dans les aventures précédentes/);
  }
});

test('la mémoire longue retient les objets dès qu’ils sont offerts', () => {
  memoire.clear();
  souvenirs.ajouterObjets(['Boussole rieuse', 'Caillou tiède']);
  souvenirs.ajouterObjets(['boussole rieuse', 'Plume bleue']);
  const { objets } = souvenirs.charger();
  assert.deepEqual(objets, ['Boussole rieuse', 'Caillou tiède', 'Plume bleue'], 'pas de doublon, même casse différente');
});

test('la mémoire longue plafonne pour ne pas gonfler indéfiniment', () => {
  memoire.clear();
  souvenirs.ajouterObjets(Array.from({ length: 60 }, (_, i) => `objet ${i}`));
  assert.equal(souvenirs.charger().objets.length, 40);
});

test('toute la carte d’inspiration est retenue, pas seulement le début', () => {
  memoire.clear();
  const carte = {
    debut: INSPIRATIONS.debuts[0],
    compagnon: INSPIRATIONS.compagnons[0],
    objet: INSPIRATIONS.objets[3], // « un bout de ficelle qui se noue tout seul »
    twist: INSPIRATIONS.twists[0],
    ton: INSPIRATIONS.tons[0],
  };
  souvenirs.ajouterInspiration(carte);
  const vus = souvenirs.charger();
  assert.ok(vus.debuts.includes(carte.debut));
  assert.ok(vus.compagnons.includes(carte.compagnon), 'le compagnon aussi');
  assert.ok(vus.twists.includes(carte.twist), 'le retournement aussi');
  assert.ok(vus.objets.includes(carte.objet), 'l’objet insolite compte comme un objet déjà offert');
});

test('un objet déjà vu écarte aussi sa variante reformulée', () => {
  // Le modèle rebaptise volontiers « la ficelle qui se noue toute seule »
  // en « ficelle vivante » : le filtrage doit quand même l'attraper.
  const evites = ['ficelle qui se noue toute seule'];
  for (let i = 0; i < 40; i += 1) {
    const texte = coffre(etatAvec(evites)).split('\n')[0];
    assert.ok(!/ficelle/.test(texte), 'la ficelle ne doit plus sortir du coffre');
  }
});

test('les listes d’inspiration sont assez fournies', () => {
  const { debuts, compagnons, objets, twists, tons } = INSPIRATIONS;
  for (const [nom, liste] of Object.entries({ debuts, compagnons, objets, twists, tons })) {
    assert.ok(liste.length >= 8, `${nom} : seulement ${liste.length} entrées`);
    assert.equal(new Set(liste).size, liste.length, `${nom} contient un doublon`);
  }
});
