// Mini-jeux d'épreuve : jouables sans savoir lire, à la place (ou en plus) du dé.
// Chaque jeu renvoie une promesse { reussi, detail }.
import { el, vider, attendre, piocher, vibrer } from './util.js';

const SYMBOLES = ['🍎', '⭐', '🐸', '🔔', '🌸', '🎈'];

const PAIRES_INTRUS = [
  ['🍎', '🍏'], ['⭐', '🌟'], ['🐶', '🐺'], ['😺', '😸'], ['🌘', '🌒'],
  ['🐢', '🐸'], ['🍋', '🍐'], ['🐝', '🐞'], ['🧢', '👒'], ['🌲', '🌳'],
];

const AMIS = ['🦊', '🦉', '🐭', '🐰', '🐻', '🐱'];

// --- Mémoire : répéter la suite lumineuse --------------------------------

async function memoire(zone, { difficulte, narrer, surDemonstration }) {
  const longueur = Math.min(5, 2 + Math.round(difficulte / 2));
  const symboles = SYMBOLES.slice(0, 4);
  const suite = Array.from({ length: longueur }, () => piocher(symboles));

  vider(zone);
  const consigne = 'Regarde bien la suite, puis touche les images dans le même ordre.';
  zone.appendChild(el('p', { class: 'jeu-consigne', text: consigne }));
  const grille = el('div', { class: 'jeu-grille jeu-grille-4' });
  const boutons = symboles.map((symbole, i) => el('button', {
    class: `jeu-case jeu-couleur-${i + 1}`, text: symbole, disabled: 'disabled',
  }));
  boutons.forEach((b) => grille.appendChild(b));
  zone.appendChild(grille);
  const jauge = el('p', { class: 'jeu-jauge', text: '•'.repeat(longueur) });
  zone.appendChild(jauge);

  narrer?.(consigne);
  await attendre(1800);

  for (const symbole of suite) {
    const bouton = boutons[symboles.indexOf(symbole)];
    bouton.classList.add('allume');
    surDemonstration?.(symbole);
    vibrer(15);
    await attendre(620);
    bouton.classList.remove('allume');
    await attendre(240);
  }

  return new Promise((resoudre) => {
    let position = 0;
    boutons.forEach((bouton, i) => {
      bouton.disabled = false;
      bouton.addEventListener('click', async () => {
        if (bouton.disabled) return;
        bouton.classList.add('allume');
        vibrer(12);
        setTimeout(() => bouton.classList.remove('allume'), 220);
        if (symboles[i] !== suite[position]) {
          boutons.forEach((b) => { b.disabled = true; });
          resoudre({ reussi: false, detail: 'la suite s’est mélangée' });
          return;
        }
        position += 1;
        jauge.textContent = '★'.repeat(position) + '•'.repeat(longueur - position);
        if (position === suite.length) {
          boutons.forEach((b) => { b.disabled = true; });
          await attendre(300);
          resoudre({ reussi: true, detail: 'la suite entière retrouvée' });
        }
      });
    });
  });
}

// --- Attrape : toucher les amis qui passent -------------------------------

async function attrape(zone, { difficulte, narrer }) {
  const objectif = Math.max(3, difficulte + 1);
  const apparitions = objectif + 2;
  const duree = 1500 - difficulte * 120;

  vider(zone);
  const consigne = `Attrape les amis qui passent. Il en faut ${objectif}.`;
  zone.appendChild(el('p', { class: 'jeu-consigne', text: consigne }));
  const terrain = el('div', { class: 'jeu-terrain' });
  zone.appendChild(terrain);
  const compteur = el('p', { class: 'jeu-jauge', text: `0 / ${objectif}` });
  zone.appendChild(compteur);

  narrer?.(consigne);
  await attendre(1600);

  let attrapes = 0;
  for (let i = 0; i < apparitions; i += 1) {
    const cible = el('button', { class: 'jeu-cible', text: piocher(AMIS) });
    cible.style.left = `${10 + Math.random() * 70}%`;
    cible.style.top = `${10 + Math.random() * 60}%`;
    let touche = false;
    cible.addEventListener('click', () => {
      if (touche) return;
      touche = true;
      attrapes += 1;
      compteur.textContent = `${attrapes} / ${objectif}`;
      cible.classList.add('attrapee');
      vibrer(20);
    });
    terrain.appendChild(cible);
    await attendre(duree);
    cible.remove();
  }

  const reussi = attrapes >= objectif;
  return {
    reussi,
    detail: reussi
      ? `${attrapes} amis attrapés`
      : `${attrapes} amis attrapés, il en fallait ${objectif}`,
  };
}

// --- Intrus : trouver celui qui n'est pas comme les autres -----------------

async function intrus(zone, { difficulte, narrer }) {
  const cases = difficulte <= 2 ? 6 : difficulte === 3 ? 9 : 12;
  const [commun, different] = piocher(PAIRES_INTRUS);
  const cible = Math.floor(Math.random() * cases);

  vider(zone);
  const consigne = 'Touche l’image qui n’est pas comme les autres.';
  zone.appendChild(el('p', { class: 'jeu-consigne', text: consigne }));
  const grille = el('div', { class: `jeu-grille jeu-grille-${cases <= 6 ? 3 : 4}` });
  zone.appendChild(grille);
  narrer?.(consigne);

  return new Promise((resoudre) => {
    let essais = 0;
    for (let i = 0; i < cases; i += 1) {
      const bouton = el('button', { class: 'jeu-case', text: i === cible ? different : commun });
      bouton.addEventListener('click', async () => {
        if (i === cible) {
          bouton.classList.add('trouve');
          vibrer(30);
          await attendre(500);
          resoudre({ reussi: true, detail: 'intrus repéré' });
          return;
        }
        essais += 1;
        bouton.classList.add('rate');
        vibrer(10);
        if (essais >= 2) {
          grille.querySelectorAll('button').forEach((b, k) => { if (k === cible) b.classList.add('trouve'); });
          await attendre(700);
          resoudre({ reussi: false, detail: 'l’intrus était bien caché' });
        }
      });
      grille.appendChild(bouton);
    }
  });
}

export const JEUX = { memoire, attrape, intrus };

export const NOMS_JEUX = {
  memoire: 'Jeu de mémoire',
  attrape: 'Attrape les amis',
  intrus: 'Trouve l’intrus',
};

// Quelle épreuve pour ce choix ? Le réglage décide, le hasard varie.
export function typeEpreuve(reglage) {
  if (reglage === 'de') return 'de';
  const jeux = Object.keys(JEUX);
  if (reglage === 'minijeux') return piocher(jeux);
  return Math.random() < 0.4 ? 'de' : piocher(jeux);
}

export function jouer(nom, zone, options) {
  const jeu = JEUX[nom];
  if (!jeu) return Promise.resolve({ reussi: true, detail: '' });
  return jeu(zone, options);
}
