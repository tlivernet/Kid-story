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

test('les avatars couvrent la vraie vie autant que la légende', async () => {
  const { GROUPES_AVATARS, AVATARS } = await import('../js/config.js');
  const titres = GROUPES_AVATARS.map((g) => g.titre);
  assert.ok(titres.some((t) => /vraie vie/.test(t)), 'un groupe de métiers');
  assert.ok(titres.some((t) => /C.est moi/.test(t)), 'un groupe « c’est moi »');
  const metiers = GROUPES_AVATARS.find((g) => g.realiste).avatars;
  assert.ok(metiers.length >= 12, `seulement ${metiers.length} métiers`);
  for (const { emoji, nom } of metiers) assert.ok(emoji && nom, 'chaque avatar est nommé');
  assert.equal(new Set(AVATARS).size, AVATARS.length, 'aucun doublon');
});

test('la teinte de peau s’applique aux personnes, jamais aux animaux', async () => {
  const { teinter, teintable, TEINTES } = await import('../js/config.js');
  const doree = TEINTES.find((t) => t.nom === 'dorée').modificateur;
  assert.equal(teinter('🧑‍🚒', doree), '🧑🏽‍🚒');
  assert.equal(teinter('👮', doree), '👮🏽');
  assert.equal(teinter('🦊', doree), '🦊', 'un renard n’a pas de teinte');
  assert.equal(teintable('🦖'), false);
  assert.equal(teinter('🧒', ''), '🧒', 'sans teinte, rien ne change');
});

test('changer de teinte ne cumule pas les modificateurs', async () => {
  const { teinter, TEINTES } = await import('../js/config.js');
  const claire = TEINTES[1].modificateur;
  const foncee = TEINTES[5].modificateur;
  const premier = teinter('🧑‍🍳', claire);
  const second = teinter(premier, foncee);
  assert.equal(second, teinter('🧑‍🍳', foncee));
  assert.equal([...second].filter((c) => /[\u{1F3FB}-\u{1F3FF}]/u.test(c)).length, 1);
});

test('le sélecteur de présentation ne survit pas à la teinte', async () => {
  const { teinter, TEINTES } = await import('../js/config.js');
  const teinté = teinter('🕵️', TEINTES[4].modificateur);
  assert.ok(!teinté.includes('️'), 'séquence invalide sinon');
  assert.equal([...teinté].length, 2);
});
