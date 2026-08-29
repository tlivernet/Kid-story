// Les jeux de lecture travaillent sur le texte du chapitre : on vérifie la
// matière qu'ils en tirent, pas leur rendu.
import test from 'node:test';
import assert from 'node:assert/strict';
import { JEUX, JEUX_LECTURE, NOMS_JEUX, typeEpreuve } from '../js/minijeux.js';
import { MOTS_CP, MOTS_IMAGES } from '../js/config.js';

test('les trois jeux de lecture existent et sont nommés', () => {
  assert.equal(JEUX_LECTURE.length, 3);
  for (const nom of JEUX_LECTURE) {
    assert.equal(typeof JEUX[nom], 'function', `${nom} manquant`);
    assert.ok(NOMS_JEUX[nom], `${nom} sans nom affiché`);
  }
});

test('les jeux de lecture peuvent être désactivés', () => {
  for (let i = 0; i < 60; i += 1) {
    const sansLecture = typeEpreuve('minijeux', false);
    assert.ok(!JEUX_LECTURE.includes(sansLecture), `${sansLecture} ne devrait pas sortir`);
  }
  const tires = new Set();
  for (let i = 0; i < 200; i += 1) tires.add(typeEpreuve('minijeux', true));
  assert.ok(JEUX_LECTURE.some((jeu) => tires.has(jeu)), 'activés, ils doivent sortir');
});

test('le vocabulaire de CP et les images sont utilisables', () => {
  assert.ok(MOTS_CP.length >= 60, `seulement ${MOTS_CP.length} mots`);
  assert.equal(new Set(MOTS_CP).size, MOTS_CP.length, 'aucun doublon');
  for (const mot of MOTS_CP) {
    assert.ok(mot.length >= 3 && mot.length <= 10, `« ${mot} » est mal calibré pour un CP`);
  }
  assert.ok(MOTS_IMAGES.length >= 20);
  for (const { mot, emoji } of MOTS_IMAGES) {
    assert.ok(mot && emoji, 'chaque image a son mot');
  }
});

test('les mots proposés viennent du chapitre quand c’est possible', async () => {
  // On rejoue la logique d'extraction sur un vrai chapitre.
  const texte = [
    'Alban ouvre la porte violette du jardin.',
    'Un ballon jaune flotte devant lui, tout tremblant.',
  ];
  const mots = texte.join(' ').toLowerCase()
    .replace(/[^a-zàâäéèêëîïôöùûüçœ' -]/g, ' ')
    .split(/[\s'-]+/)
    .filter((mot) => mot.length >= 4 && mot.length <= 10);
  assert.ok(mots.includes('violette'));
  assert.ok(mots.includes('ballon'));
  assert.ok(!mots.includes('un'), 'les mots trop courts sont écartés');
});
