// Tests de l'état de l'aventure : sac, bible des personnages, graines narratives, arc.
import test from 'node:test';
import assert from 'node:assert/strict';
import { nouvelEtat, appliquerChapitre, normaliserEtat } from '../js/state.js';
import { etape, blocEtat } from '../js/prompt.js';

const base = () => nouvelEtat({
  heros: { prenom: 'Lina', avatar: '🦸‍♀️' }, theme: 'Dragons', themeId: 'dragons', longueur: 8,
});

const chapitre = (extra = {}) => ({
  titre: '', texte: ['Une phrase.'], lieu: 'foret', moment: 'jour', acteurs: ['🦸‍♀️'], objets_decor: [],
  quete: 'trouver l’œuf', memoire: 'Lina cherche l’œuf.', compagnon: '', personnages: [],
  promesse_plantee: '', promesse_payee: '', sac_ajouter: [], sac_retirer: [],
  coeurs_delta: 0, etoiles_delta: 0, choix: [{ texte: 'Avancer', emoji: '👟', objet_requis: '', epreuve_nom: '', epreuve_difficulte: 0 }],
  fin_titre: '', fin_message: '', ...extra,
});

test('le sac accueille les objets et rend ceux qui sont utilisés', () => {
  const etat = base();
  appliquerChapitre(etat, chapitre({ sac_ajouter: [{ nom: 'Clé dorée', emoji: '🗝️', pouvoir: 'ouvre' }] }));
  assert.equal(etat.sac.length, 1);
  appliquerChapitre(etat, chapitre({ sac_ajouter: [{ nom: 'clé dorée', emoji: '🗝️', pouvoir: 'ouvre' }] }));
  assert.equal(etat.sac.length, 1, 'pas de doublon');
  appliquerChapitre(etat, chapitre({ sac_retirer: ['Clé dorée'] }));
  assert.equal(etat.sac.length, 0);
});

test('une graine plantée est retenue puis retirée quand elle fleurit', () => {
  const etat = base();
  appliquerChapitre(etat, chapitre({ promesse_plantee: 'une plume bleue oubliée sur le rocher' }));
  assert.deepEqual(etat.promesses, ['une plume bleue oubliée sur le rocher']);
  appliquerChapitre(etat, chapitre({ promesse_payee: 'la plume bleue sert à chatouiller le dragon' }));
  assert.deepEqual(etat.promesses, [], 'la graine est reconnue malgré une autre formulation');
});

test('les graines en attente sont plafonnées', () => {
  const etat = base();
  for (const g of ['la porte grince', 'le chat gris miaule', 'la carte est déchirée', 'le vent siffle fort', 'la cloche sonne seule']) {
    appliquerChapitre(etat, chapitre({ promesse_plantee: g }));
  }
  assert.equal(etat.promesses.length, 4);
  assert.equal(etat.promesses[3], 'la cloche sonne seule');
});

test('la troupe est remplacée par la version la plus récente', () => {
  const etat = base();
  appliquerChapitre(etat, chapitre({ personnages: [{ nom: 'Nino', emoji: '🦊', manie: 'renifle tout' }] }));
  assert.equal(etat.personnages[0].nom, 'Nino');
  appliquerChapitre(etat, chapitre({
    personnages: [
      { nom: 'Nino', emoji: '🦊', manie: 'renifle tout' },
      { nom: 'Bouli', emoji: '🦉', manie: 'parle en rimes' },
    ],
  }));
  assert.equal(etat.personnages.length, 2);
});

test('les cœurs restent entre 1 et 3 : l’enfant ne peut pas perdre', () => {
  const etat = base();
  for (let i = 0; i < 5; i += 1) appliquerChapitre(etat, chapitre({ coeurs_delta: -1 }));
  assert.equal(etat.coeurs, 1);
  for (let i = 0; i < 5; i += 1) appliquerChapitre(etat, chapitre({ coeurs_delta: 1 }));
  assert.equal(etat.coeurs, 3);
});

test('un chapitre sans choix termine l’aventure', () => {
  const etat = base();
  const bilan = appliquerChapitre(etat, chapitre({ choix: [], fin_titre: 'Bravo', fin_message: 'Fini !' }));
  assert.equal(bilan.fini, true);
  assert.equal(etat.termine, true);
});

test('l’arc passe par toutes les étapes et finit sur le dénouement', () => {
  const noms = Array.from({ length: 8 }, (_, i) => etape(i, 8)[0]);
  assert.equal(noms[0], 'Ouverture');
  assert.equal(noms[7], 'Dénouement');
  assert.equal(new Set(noms).size, 8, 'aucune étape répétée sur huit chapitres');
});

test('l’état envoyé au modèle contient la troupe et les graines', () => {
  const etat = base();
  appliquerChapitre(etat, chapitre({
    personnages: [{ nom: 'Nino', emoji: '🦊', manie: 'renifle tout' }],
    promesse_plantee: 'la porte grince',
  }));
  const bloc = blocEtat(etat);
  assert.match(bloc, /Troupe : 🦊 Nino — renifle tout/);
  assert.match(bloc, /Graines en attente : « la porte grince »/);
});

test('le réglage des épreuves est respecté', async () => {
  const { typeEpreuve, JEUX } = await import('../js/minijeux.js');
  const jeux = Object.keys(JEUX);
  for (let i = 0; i < 30; i += 1) {
    assert.equal(typeEpreuve('de'), 'de');
    assert.ok(jeux.includes(typeEpreuve('minijeux')));
    assert.ok(['de', ...jeux].includes(typeEpreuve('melange')));
  }
});

test('la carte d’inspiration change d’une partie à l’autre', async () => {
  const { INSPIRATIONS } = await import('../js/config.js');
  const combinaisons = INSPIRATIONS.debuts.length * INSPIRATIONS.compagnons.length
    * INSPIRATIONS.objets.length * INSPIRATIONS.twists.length * INSPIRATIONS.tons.length;
  assert.ok(combinaisons > 10000, `seulement ${combinaisons} combinaisons possibles`);
});

test('le message envoyé au modèle décrit aussi bien le dé qu’un mini-jeu', async () => {
  const { messageSuivant } = await import('../js/prompt.js');
  const etat = base();
  etat.chapitre = 3;
  const avecDe = messageSuivant(etat, {
    resume: 'Il a choisi : « Grimper »',
    epreuve: { nom: 'grimper', de: 4, bonus: 1, total: 5, difficulte: 3, reussi: true },
  });
  assert.match(avecDe, /dé 4 \+ 1 de bonus = 5 contre 3 → RÉUSSITE/);
  const avecJeu = messageSuivant(etat, {
    resume: 'Il a choisi : « Se souvenir »',
    epreuve: { nom: 'Jeu de mémoire', detail: 'la suite entière retrouvée', reussi: true },
  });
  assert.match(avecJeu, /la suite entière retrouvée → RÉUSSITE/);
});

test('une partie enregistrée par une ancienne version est complétée', () => {
  const vieux = {
    id: 'av-ancien', heros: { prenom: 'Lina', avatar: '🦊' }, theme: 'Dragons',
    chapitre: 3, coeurs: 2, etoiles: 4, sac: [{ nom: 'Clé', emoji: '🗝️', pouvoir: 'ouvre' }],
    quete: 'trouver l’œuf', memoire: 'des faits', longueur: 12,
  };
  const etat = normaliserEtat(vieux);
  assert.deepEqual(etat.promesses, []);
  assert.deepEqual(etat.personnages, []);
  assert.deepEqual(etat.chapitres, []);
  assert.equal(etat.coeurs, 2);
  assert.equal(etat.sac.length, 1);
  // Et surtout : un nouveau chapitre s'applique sans planter.
  appliquerChapitre(etat, chapitre({ promesse_plantee: 'une porte grince' }));
  assert.deepEqual(etat.promesses, ['une porte grince']);
});

test('normaliserEtat ignore une sauvegarde vide', () => {
  assert.equal(normaliserEtat(null), null);
  assert.equal(normaliserEtat('abîmé'), null);
});
