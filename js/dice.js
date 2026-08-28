// Épreuves : un dé à 6 faces, avec bonus si un compagnon accompagne le héros.
import { attendre } from './util.js';

const PIONS = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[26, 26], [50, 50], [74, 74]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 26], [72, 26], [28, 50], [72, 50], [28, 74], [72, 74]],
};

export function faceDe(valeur) {
  const points = (PIONS[valeur] || PIONS[1])
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#2b2140"/>`)
    .join('');
  return `<svg viewBox="0 0 100 100" class="de-svg" aria-hidden="true">
    <rect x="4" y="4" width="92" height="92" rx="20" fill="#fffdf6" stroke="#e0d5bd" stroke-width="4"/>
    ${points}
  </svg>`;
}

export function bonusDe(etat) {
  return etat.compagnon ? 1 : 0;
}

export function lancer(difficulte, bonus = 0) {
  const de = 1 + Math.floor(Math.random() * 6);
  const total = de + bonus;
  return { de, bonus, total, difficulte, reussi: total >= difficulte };
}

// Petite animation : le dé roule avant de s'arrêter sur le résultat.
export async function animer(element, resultat, reduit = false) {
  if (reduit) {
    element.innerHTML = faceDe(resultat.de);
    await attendre(400);
    return;
  }
  const tours = 12;
  for (let i = 0; i < tours; i += 1) {
    element.innerHTML = faceDe(1 + Math.floor(Math.random() * 6));
    element.classList.toggle('de-roule');
    await attendre(60 + i * 12);
  }
  element.classList.remove('de-roule');
  element.innerHTML = faceDe(resultat.de);
  element.classList.add('de-pose');
  await attendre(500);
  element.classList.remove('de-pose');
}
