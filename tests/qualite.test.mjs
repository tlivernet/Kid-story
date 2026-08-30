// Le modèle dérive sur la longueur des phrases : l'application le mesure et le
// lui rappelle avec des chiffres au tour suivant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mesurerTexte, consigneStyle } from '../js/qualite.js';

// Un chapitre au bon rythme : des respirations courtes, une phrase qui file.
const bienRythme = [
  'Alban pousse la porte violette.',
  'Rien ne bouge.',
  'Au fond de la cour, un ballon jaune flotte tout seul au-dessus des pavés mouillés.',
  'Il approche.',
  'Il tremble un peu, mais il sourit.',
];

// Extrait réel d'une histoire générée : 8 phrases, 20 mots en moyenne.
const longEtVrai = [
  'Alban secoue encore une fois le coquillage, et cette fois, une petite voix claire s’échappe enfin.',
  'Ballon sursaute et lâche un petit couinement de surprise, mais reste bien accroché à Alban.',
  'Alban réfléchit fort, puis a une idée : il faut un objet qui montre ce qu’on a perdu.',
  'Au même instant, une petite boussole dorée apparaît, coincée sous une pierre lumineuse près d’eux.',
];

test('un chapitre bien rythmé ne déclenche aucune remarque', () => {
  const mesure = mesurerTexte(bienRythme);
  assert.equal(mesure.phrases, 5);
  assert.ok(mesure.moyenne < 10, `moyenne ${mesure.moyenne}`);
  assert.ok(mesure.courtes >= 2, `${mesure.courtes} phrases courtes`);
  assert.ok(mesure.etendue >= 7, `étendue ${mesure.etendue}`);
  assert.equal(consigneStyle(mesure, 'riche'), '');
});

// Le vrai défaut d'une histoire entendue : toutes les phrases de la même
// longueur. Aucune ne dépasse la limite, et pourtant la lecture est plate.
test('des phrases toutes de la même longueur sont signalées', () => {
  const plat = [
    'Alban arrive au commissariat du village, sa tasse de café à la main.',
    'Un camion klaxonne devant la porte, deux jours avant la date prévue.',
    'Son jeune apprenti, Timo, trébuche en courant vers le camion garé là.',
    'Ensemble, ils ouvrent la caisse en bois et trouvent des dossiers poussiéreux.',
  ];
  const mesure = mesurerTexte(plat);
  assert.equal(mesure.courtes, 0);
  assert.ok(mesure.etendue < 7, `étendue ${mesure.etendue}`);
  const consigne = consigneStyle(mesure, 'riche');
  assert.match(consigne, /métronome/);
  assert.match(consigne, /phrase\(s\) de 5 mots ou moins/);
});

test('un chapitre peut monter à seize mots sans être repris', () => {
  const mesure = mesurerTexte(bienRythme);
  assert.ok(mesure.plusLongue >= 13, `la plus longue fait ${mesure.plusLongue} mots`);
  assert.equal(mesure.tropLongues, 0);
});

test('des phrases trop longues sont chiffrées et corrigées', () => {
  const mesure = mesurerTexte(longEtVrai);
  assert.ok(mesure.moyenne > 14, `moyenne mesurée : ${mesure.moyenne}`);
  const consigne = consigneStyle(mesure, 'riche');
  assert.match(consigne, /mots en moyenne/);
  assert.match(consigne, /Coupe-les en deux/);
  assert.match(consigne, /L’enfant écoute|L'enfant écoute/);
});

test('un chapitre trop long est signalé, selon le réglage de richesse', () => {
  const dix = Array.from({ length: 10 }, () => 'Une phrase courte et nette.');
  assert.match(consigneStyle(mesurerTexte(dix), 'riche'), /10 phrases, n.en écris pas plus de 8/);
  const sept = Array.from({ length: 7 }, () => 'Une phrase courte et nette.');
  assert.match(consigneStyle(mesurerTexte(sept), 'simple'), /pas plus de 6/);
});

test('un chapitre vide ne casse pas la mesure', () => {
  const mesure = mesurerTexte([]);
  assert.equal(mesure.phrases, 0);
  assert.equal(consigneStyle(mesure), '');
  assert.equal(mesurerTexte(['   ', '']).phrases, 0);
});

test('la consigne de rattrapage arrive dans le message du tour suivant', async () => {
  const { messageSuivant } = await import('../js/prompt.js');
  const etat = {
    heros: { prenom: 'Alban', avatar: '🧑‍🚀' }, theme: 'Espace', chapitre: 3, longueur: 12,
    coeurs: 3, etoiles: 2, sac: [], personnages: [], promesses: [], objetsEvites: [],
    quete: 'retrouver le vaisseau', memoire: 'des faits', lieux: [], richesse: 'riche',
  };
  const message = messageSuivant(etat, {
    resume: 'Il a choisi : « Suivre le vent »',
    style: consigneStyle(mesurerTexte(longEtVrai), 'riche'),
  });
  assert.match(message, /À CORRIGER : tes phrases faisaient/);
});

// Le compte de chapitres est une fenêtre : forcer douze chapitres pile produit
// du remplissage, ce qui s'entend à la lecture.
test('la fin est une fenêtre, pas un couperet', async () => {
  const { messageSuivant } = await import('../js/prompt.js');
  const base = {
    heros: { prenom: 'Alban', avatar: '🧑‍🚀' }, theme: 'Espace', longueur: 12,
    coeurs: 3, etoiles: 2, sac: [], personnages: [], promesses: [], objetsEvites: [],
    quete: 'q', memoire: 'm', lieux: [], richesse: 'riche',
  };
  const dire = (chapitre) => messageSuivant({ ...base, chapitre }, { resume: 'r' });
  assert.match(dire(6), /dénouement/, 'le dénouement s’annonce avant la fenêtre');
  assert.match(dire(8), /peut se terminer maintenant/, 'à 9 chapitres sur 12, la fin est permise');
  assert.match(dire(8), /au plus tard au chapitre 15/);
  assert.match(dire(14), /DERNIER chapitre/, 'à 15 chapitres, la fin est obligatoire');
  assert.doesNotMatch(dire(11), /DERNIER chapitre/, 'douze chapitres ne ferment plus l’histoire d’office');
});
