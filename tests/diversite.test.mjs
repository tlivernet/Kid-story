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

test('un objet ne peut apparaître qu’un chapitre sur trois', async () => {
  const { momentDObjet } = await import('../js/prompt.js');
  const avecSac = (chapitre) => ({ chapitre, sac: [{ nom: 'Clé' }] });
  assert.equal(momentDObjet(avecSac(0)), true, 'le premier chapitre pose le décor');
  assert.equal(momentDObjet(avecSac(1)), false);
  assert.equal(momentDObjet(avecSac(2)), true);
  assert.equal(momentDObjet(avecSac(3)), false);
  assert.equal(momentDObjet(avecSac(4)), false);
  assert.equal(momentDObjet({ chapitre: 4, sac: [] }), true, 'sac vide : on peut redonner un objet');
});

// Manquer d'un objet est la mécanique du genre : elle doit tomber assez souvent
// pour que l'enfant comprenne à quoi sert son sac.
test('une porte fermée tombe un chapitre sur trois, jamais en même temps qu’un cadeau', async () => {
  const { momentDePorte, momentDObjet } = await import('../js/prompt.js');
  const etat = (chapitre) => ({ chapitre, sac: [{ nom: 'Clé' }] });
  assert.equal(momentDePorte(etat(0)), false, 'pas de porte avant que le sac existe');
  assert.equal(momentDePorte(etat(2)), false);
  assert.equal(momentDePorte(etat(3)), true);
  assert.equal(momentDePorte(etat(6)), true);
  assert.equal(momentDePorte(etat(9)), true);
  const portes = [...Array(12).keys()].filter((c) => momentDePorte(etat(c)));
  assert.equal(portes.length, 3, `douze chapitres devraient poser trois portes (${portes})`);
  for (const chapitre of portes) {
    assert.equal(momentDObjet(etat(chapitre)), false, `chapitre ${chapitre} : cadeau et porte le même tour`);
  }
});

test('le message annonce la porte fermée et réclame la conséquence d’un choix audacieux', async () => {
  const { messageSuivant } = await import('../js/prompt.js');
  const base = {
    heros: { prenom: 'Lina', avatar: '🦊' }, theme: 'Dragons', longueur: 12,
    coeurs: 3, etoiles: 1, sac: [{ nom: 'Clé', emoji: '🗝️', pouvoir: 'ouvre' }],
    personnages: [], promesses: [], objetsEvites: [], quete: 'x', memoire: 'y', lieux: [],
  };
  const avecPorte = messageSuivant({ ...base, chapitre: 3 }, { resume: 'r' });
  assert.match(avecPorte, /PORTE FERMÉE/, 'le chapitre 3 doit demander une porte fermée');
  const sansPorte = messageSuivant({ ...base, chapitre: 4 }, { resume: 'r' });
  assert.match(sansPorte, /Pas de porte fermée/);

  const rate = messageSuivant({ ...base, chapitre: 4 }, { resume: 'r', risque: 'coute' });
  assert.match(rate, /coeurs_delta = -1/, 'un choix audacieux raté doit coûter pour de bon');
  assert.match(rate, /pas de cadeau de consolation/);
  const gagne = messageSuivant({ ...base, chapitre: 4 }, { resume: 'r', risque: 'paye' });
  assert.match(gagne, /vraie avance/);
});

test('le mode démo pose lui aussi des portes et un choix audacieux', async () => {
  const { chapitreDemo } = await import('../js/demo.js');
  const etat = {
    // Le chapitre 3 du mode démo est la rencontre costaude, qui n'a pas de choix :
    // la première porte tombe donc au chapitre 6.
    id: 'demo-1', chapitre: 6, longueur: 12, themeId: 'pirates', realiste: false,
    heros: { prenom: 'Lina', avatar: '🦊' }, sac: [], etoiles: 0, coeurs: 3,
    quete: 'retrouver le trésor', memoire: '', compagnon: '', lieu: 'plage',
  };
  const chapitre = chapitreDemo(etat, { resume: 'r' });
  const audacieux = chapitre.choix.filter((c) => c.risque);
  assert.equal(audacieux.length, 1, 'un seul choix audacieux par liste');
  const ferme = chapitre.choix.find((c) => c.objet_requis && !etat.sac.some((o) => o.nom === c.objet_requis));
  assert.ok(ferme, 'le chapitre 6 doit proposer un choix qui demande un objet absent du sac');

  const paye = chapitreDemo({ ...etat, chapitre: 4 }, { resume: 'r', risque: 'paye' });
  assert.equal(paye.etoiles_delta, 1, 'l’audace qui paie rapporte une étoile');
  const coute = chapitreDemo({ ...etat, chapitre: 4 }, { resume: 'r', risque: 'coute' });
  assert.equal(coute.coeurs_delta, -1, 'l’audace qui rate coûte un cœur');
});

test('sans coffre, le message interdit explicitement les objets', async () => {
  const { messageSuivant } = await import('../js/prompt.js');
  const etat = {
    heros: { prenom: 'Lina', avatar: '🦊' }, theme: 'Dragons', chapitre: 3, longueur: 12,
    coeurs: 3, etoiles: 1, sac: [{ nom: 'Clé', emoji: '🗝️', pouvoir: 'ouvre' }],
    personnages: [], promesses: [], objetsEvites: [], quete: 'x', memoire: 'y', lieux: [],
  };
  const message = messageSuivant(etat, { resume: 'Il a choisi : « Avancer »' });
  assert.match(message, /AUCUN OBJET dans ce chapitre/);
  assert.ok(!message.includes('COFFRE À TRÉSORS'), 'pas de coffre ce tour-ci');

  const avecCoffre = messageSuivant({ ...etat, chapitre: 2 }, { resume: 'x' });
  assert.match(avecCoffre, /COFFRE À TRÉSORS/);
});

test('chaque famille de voix Google est reconnue et située en prix', async () => {
  const { familleVoix } = await import('../js/config.js');
  assert.equal(familleVoix('fr-FR-Neural2-A').conseillee, true);
  assert.equal(familleVoix('fr-FR-Wavenet-C').conseillee, true);
  assert.equal(familleVoix('fr-FR-Chirp3-HD-Achernar').nom, 'Chirp 3 HD');
  assert.equal(familleVoix('fr-FR-Studio-A').cout, 'nettement la plus chère');
  assert.equal(familleVoix('fr-FR-Inconnue-9').nom, 'Autre', 'une famille future ne casse rien');
});

test('une histoire réaliste pioche dans le coffre du monde réel', async () => {
  const { TRESORS_REELS, TRESORS } = await import('../js/config.js');
  const reels = new Set(TRESORS_REELS.map((t) => t.nom));
  const magiques = new Set(TRESORS.map((t) => t.nom));
  for (let i = 0; i < 20; i += 1) {
    const texte = coffre({ realiste: true, objetsEvites: [], sac: [] }).split('\n')[0];
    const items = texte.split(':')[1].split(';').map((t) => t.trim().replace(/^\S+\s/, ''));
    for (const nom of items) {
      assert.ok(reels.has(nom), `${nom} n'est pas un objet du monde réel`);
      assert.ok(!magiques.has(nom));
    }
  }
});

test('le registre réaliste interdit explicitement la magie', async () => {
  const { registre } = await import('../js/prompt.js');
  assert.equal(registre({ realiste: false }), '', 'rien à imposer aux histoires féeriques');
  const consigne = registre({ realiste: true });
  assert.match(consigne, /Aucune magie/);
  assert.match(consigne, /aucun animal qui parle/);
  assert.match(consigne, /lampe torche/);
});

test('les thèmes du quotidien sont bien marqués et assez nombreux', async () => {
  const { THEMES } = await import('../js/config.js');
  const reels = THEMES.filter((t) => t.realiste);
  assert.ok(reels.length >= 8, `seulement ${reels.length} thèmes du quotidien`);
  assert.ok(reels.some((t) => t.id === 'pompiers'));
  assert.ok(THEMES.filter((t) => !t.realiste).length >= 10, 'les mondes imaginaires restent nombreux');
});

test('la réserve d’objets a doublé', async () => {
  const { TRESORS } = await import('../js/config.js');
  assert.ok(TRESORS.length >= 120, `seulement ${TRESORS.length} trésors`);
  assert.equal(new Set(TRESORS.map((t) => t.nom)).size, TRESORS.length, 'aucun doublon');
});

test('deux épreuves ne se suivent pas', async () => {
  const { momentDEpreuve } = await import('../js/prompt.js');
  assert.equal(momentDEpreuve({ chapitre: 5 }), true, 'aucune épreuve encore jouée');
  assert.equal(momentDEpreuve({ chapitre: 4, derniereEpreuve: 3 }), false);
  assert.equal(momentDEpreuve({ chapitre: 5, derniereEpreuve: 3 }), true);
});
