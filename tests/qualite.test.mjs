// Le modèle dérive sur la longueur des phrases : l'application le mesure et le
// lui rappelle avec des chiffres au tour suivant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mesurerTexte, consigneStyle } from '../js/qualite.js';

const court = [
  'Alban ouvre la porte violette.',
  'Un ballon jaune flotte devant lui.',
  'Il tremble un peu, mais il sourit.',
];

// Extrait réel d'une histoire générée : 8 phrases, 20 mots en moyenne.
const longEtVrai = [
  'Alban secoue encore une fois le coquillage, et cette fois, une petite voix claire s’échappe enfin.',
  'Ballon sursaute et lâche un petit couinement de surprise, mais reste bien accroché à Alban.',
  'Alban réfléchit fort, puis a une idée : il faut un objet qui montre ce qu’on a perdu.',
  'Au même instant, une petite boussole dorée apparaît, coincée sous une pierre lumineuse près d’eux.',
];

test('un chapitre bien calibré ne déclenche aucune remarque', () => {
  const mesure = mesurerTexte(court);
  assert.equal(mesure.phrases, 3);
  assert.ok(mesure.moyenne < 10);
  assert.equal(consigneStyle(mesure, 'riche'), '');
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
  const six = Array.from({ length: 6 }, () => 'Une phrase courte et nette.');
  assert.match(consigneStyle(mesurerTexte(six), 'simple'), /pas plus de 5/);
  assert.equal(consigneStyle(mesurerTexte(six), 'riche'), '', 'six phrases passent en mode riche');
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
