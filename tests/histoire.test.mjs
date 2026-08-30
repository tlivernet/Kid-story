// Tests de l'état de l'aventure : sac, bible des personnages, graines narratives, arc.
import test from 'node:test';
import assert from 'node:assert/strict';
import { nouvelEtat, appliquerChapitre, normaliserEtat, perdreCoeur, secourir } from '../js/state.js';
import { etape, blocEtat } from '../js/prompt.js';

const base = () => nouvelEtat({
  heros: { prenom: 'Lina', avatar: '🦸‍♀️' }, theme: 'Dragons', themeId: 'dragons', longueur: 8,
});

const chapitre = (extra = {}) => ({
  titre: '', texte: ['Une phrase.'], lieu: 'foret', moment: 'jour', acteurs: ['🦸‍♀️'], objets_decor: [],
  quete: 'trouver l’œuf', memoire: 'Lina cherche l’œuf.', compagnon: '', personnages: [],
  promesse_plantee: '', promesse_payee: '', lieu_nom: '', adversaire_nom: '', adversaire_emoji: '',
  adversaire_coeurs: 0, sac_ajouter: [], sac_retirer: [],
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

test('le courage descend jusqu’à zéro mais jamais plus bas', () => {
  const etat = base();
  assert.equal(perdreCoeur(etat), 2);
  assert.equal(perdreCoeur(etat), 1);
  assert.equal(perdreCoeur(etat), 0);
  assert.equal(perdreCoeur(etat), 0, 'pas de courage négatif');
  for (let i = 0; i < 5; i += 1) appliquerChapitre(etat, chapitre({ coeurs_delta: 1 }));
  assert.equal(etat.coeurs, 3);
});

test('à zéro courage, on est secouru : un objet et une étoile en moins, pas de fin', () => {
  const etat = base();
  etat.etoiles = 2;
  appliquerChapitre(etat, chapitre({ sac_ajouter: [{ nom: 'Lanterne', emoji: '🏮', pouvoir: 'éclaire' }] }));
  etat.coeurs = 0;
  const perdu = secourir(etat);
  assert.equal(perdu.nom, 'Lanterne');
  assert.equal(etat.sac.length, 0);
  assert.equal(etat.coeurs, 2, 'on repart avec du courage');
  assert.equal(etat.etoiles, 1);
  assert.equal(etat.termine, false, 'l’aventure continue');
});

test('un chapitre sans choix mais avec un adversaire ne termine pas l’histoire', () => {
  const etat = base();
  const bilan = appliquerChapitre(etat, chapitre({
    choix: [], adversaire_nom: 'Groumf', adversaire_emoji: '🧌', adversaire_coeurs: 2,
  }));
  assert.equal(bilan.fini, false);
  assert.equal(etat.termine, false);
});

test('une rencontre costaude est mémorisée puis oubliée', () => {
  const etat = base();
  appliquerChapitre(etat, chapitre({ adversaire_nom: 'Groumf le troll', adversaire_emoji: '👹', adversaire_coeurs: 2 }));
  assert.equal(etat.adversaire.coeurs, 2);
  appliquerChapitre(etat, chapitre({ adversaire_coeurs: 0 }));
  assert.equal(etat.adversaire, null);
});

test('les lieux visités alimentent la carte, sans doublon', () => {
  const etat = base();
  appliquerChapitre(etat, chapitre({ lieu_nom: 'la clairière aux champignons' }));
  appliquerChapitre(etat, chapitre({ lieu_nom: 'La Clairière aux champignons' }));
  appliquerChapitre(etat, chapitre({ lieu_nom: 'le pont de pierre', lieu: 'montagne' }));
  assert.deepEqual(etat.lieux.map((l) => l.nom), ['la clairière aux champignons', 'le pont de pierre']);
});

test('une fin annoncée trop tôt est ignorée : l’aventure continue', () => {
  const etat = base(); // longueur 8
  const bilan = appliquerChapitre(etat, chapitre({ choix: [], fin_titre: 'Bravo', fin_message: 'Fini !' }));
  assert.equal(bilan.fini, false, 'pas de fin au premier chapitre');
  assert.equal(etat.termine, false);
});

test('un chapitre sans choix ni texte ne termine pas non plus l’aventure', () => {
  const etat = base();
  etat.chapitre = 1;
  const bilan = appliquerChapitre(etat, chapitre({ texte: [], choix: [] }));
  assert.equal(bilan.fini, false);
  assert.equal(etat.termine, false);
});

test('une fin arrivée assez loin est acceptée', () => {
  const etat = base(); // longueur 8, moitié = 4
  etat.chapitre = 5;
  const bilan = appliquerChapitre(etat, chapitre({ choix: [], fin_titre: 'Bravo', fin_message: 'Fini !' }));
  assert.equal(bilan.fini, true);
  assert.equal(etat.termine, true);
  assert.equal(etat.finTitre, 'Bravo');
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

// Vu en jeu : un choix « Trouver une lampe torche » exigeait la lampe torche.
// La porte se fermait sur ce que le choix allait justement chercher.
test('un choix qui part chercher un objet ne peut pas exiger cet objet', async () => {
  const { exigenceIncoherente } = await import('../js/util.js');
  assert.equal(exigenceIncoherente('Trouver une lampe torche', 'Lampe torche'), true);
  assert.equal(exigenceIncoherente('Chercher la clé dorée', 'Clé dorée'), true);
  assert.equal(exigenceIncoherente('Fabriquer une corde solide', 'Corde solide'), true);
  // Une exigence légitime nomme aussi l'objet : c'est le verbe qui tranche.
  assert.equal(exigenceIncoherente('Ouvrir la porte avec la clé dorée', 'Clé dorée'), false);
  assert.equal(exigenceIncoherente('Éclairer la cave', 'Lampe torche'), false);
  assert.equal(exigenceIncoherente('Chercher le chat', 'Lampe torche'), false);
  assert.equal(exigenceIncoherente('Partir tout de suite', ''), false);
});
