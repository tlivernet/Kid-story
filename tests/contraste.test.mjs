// Contraste des textes sur leur fond, mesuré selon la formule WCAG.
// En thème sombre, le mot correct d'un jeu de lecture s'affichait à 1,03 :
// texte clair sur fond vert pâle, donc invisible.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../css/app.css', import.meta.url), 'utf8');

// Les variables sont lues dans la feuille de style : si quelqu'un les change,
// le test le voit.
function variables(bloc) {
  const valeurs = {};
  for (const [, nom, valeur] of bloc.matchAll(/--([\w-]+):\s*([^;]+);/g)) valeurs[nom] = valeur.trim();
  return valeurs;
}
const clair = variables(css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {'))));
const blocSombre = css.slice(css.indexOf('prefers-color-scheme: dark'));
const sombre = { ...clair, ...variables(blocSombre.slice(0, blocSombre.indexOf('body {'))) };

const canal = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
function luminance(couleur) {
  const n = couleur.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}
function contraste(texte, fond) {
  const [clairL, sombreL] = [luminance(texte), luminance(fond)].sort((a, b) => b - a);
  return (clairL + 0.05) / (sombreL + 0.05);
}

// nom, couleur du texte, couleur du fond, taille en px (>= 24 : seuil 3)
const SURFACES = (v) => [
  ['texte de l’histoire', v.encre, v.creme, 24],
  ['phrase en cours de lecture', '#2f2545', '#fff3cf', 24],
  ['carte de choix', v.encre, v === clair ? '#ffffff' : '#2c2444', 20],
  ['choix énoncé', '#2f2545', '#fff6da', 20],
  ['titre du chapitre', v['violet-texte'], v.creme, 24],
  ['titre de fin', v['violet-texte'], v.creme, 32],
  ['consigne d’épreuve', v['violet-texte'], v.creme, 20],
  ['jauge de mini-jeu', v['violet-texte'], v.creme, 24],
  ['titre dans le carnet', v['violet-texte'], v === clair ? '#ffffff' : '#2c2444', 16],
  ['mot à lire', v === clair ? '#2f2545' : v.encre, v === clair ? '#fff6da' : '#46391f', 27],
  ['carte de mot', v.encre, v === clair ? '#ffffff' : '#2c2444', 26],
  ['tambour du mini-jeu', v.encre, v === clair ? '#ffffff' : '#2c2444', 35],
  ['tuile de lieu', v.encre, v === clair ? '#ffffff' : '#2c2444', 15],
  ['mot trouvé', v === clair ? '#2f2545' : v.encre, v === clair ? '#d7f5e0' : '#245239', 26],
  ['mot raté', v === clair ? '#2f2545' : v.encre, v === clair ? '#ffe6e4' : '#4d2a2a', 26],
  ['case de mini-jeu allumée', '#2f2545', v.or, 35],
];

for (const [nom, palette] of [['clair', clair], ['sombre', sombre]]) {
  test(`thème ${nom} : chaque texte reste lisible sur son fond`, () => {
    for (const [surface, texte, fond, taille] of SURFACES(palette)) {
      const seuil = taille >= 24 ? 3 : 4.5;
      const mesure = contraste(texte, fond);
      assert.ok(
        mesure >= seuil,
        `${surface} : contraste ${mesure.toFixed(2)} (${texte} sur ${fond}), il faut au moins ${seuil}`,
      );
    }
  });
}

test('le violet de texte est distinct du violet de marque en thème sombre', () => {
  assert.equal(clair['violet-texte'], clair.violet, 'même couleur en thème clair');
  assert.notEqual(sombre['violet-texte'], sombre.violet, 'le violet de marque est trop sombre pour du texte');
});

test('aucune couleur de texte n’utilise plus le violet de marque', () => {
  assert.equal((css.match(/color:\s*var\(--violet\)/g) || []).length, 0);
  assert.ok((css.match(/color:\s*var\(--violet-texte\)/g) || []).length >= 8);
});

test('les composants boutons fixent leur couleur de texte', () => {
  // Sans « color », un <button> retombe sur la couleur système (noire), ce qui
  // devient illisible dès que le fond passe en sombre.
  for (const classe of ['jeu-mot', 'jeu-case', 'jeu-tambour', 'tuile-lieu', 'avatar', 'teinte']) {
    const regle = css.match(new RegExp(`\\.${classe} \\{[^}]*\\}`));
    assert.ok(regle, `règle .${classe} introuvable`);
    assert.match(regle[0], /color:/, `.${classe} n’impose pas sa couleur de texte`);
  }
});

test('la feuille de style ne contient pas de bloc dupliqué', () => {
  assert.equal((css.match(/@keyframes frappe/g) || []).length, 1);
  assert.equal((css.match(/\.jeu-tambour \{/g) || []).length, 1);
});
