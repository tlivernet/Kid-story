// Mini-jeux d'épreuve : jouables sans savoir lire, à la place (ou en plus) du dé.
// Chaque jeu renvoie une promesse { reussi, detail }.
import { el, vider, attendre, piocher, vibrer } from './util.js';

const SYMBOLES = ['🍎', '⭐', '🐸', '🔔', '🌸', '🎈'];

// Les paires du bas de liste se ressemblent beaucoup : elles servent aux
// difficultés élevées.
const PAIRES_INTRUS = [
  ['🍎', '🍏'], ['🐶', '🐺'], ['🐢', '🐸'], ['🍋', '🍐'], ['🐝', '🐞'],
  ['🧢', '👒'], ['🌲', '🌳'], ['🚗', '🚙'], ['🐰', '🐇'], ['🦊', '🐕'],
];
const PAIRES_SUBTILES = [
  ['⭐', '🌟'], ['😺', '😸'], ['🌘', '🌒'], ['😀', '😃'], ['🔵', '🔷'],
  ['🌕', '🌝'], ['🍀', '☘️'], ['💛', '🟡'], ['🥔', '🥥'], ['😐', '😑'],
];

const AMIS = ['🦊', '🦉', '🐭', '🐰', '🐻', '🐱'];

// --- Mémoire : répéter la suite lumineuse --------------------------------

async function memoire(zone, { difficulte, narrer, surDemonstration }) {
  const longueur = Math.min(5, 1 + difficulte);
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
  const objectif = Math.max(3, difficulte + 2);
  const apparitions = objectif + 2;
  const duree = 1350 - difficulte * 150;

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
  const cases = difficulte <= 2 ? 9 : difficulte === 3 ? 12 : 16;
  const [commun, different] = piocher(difficulte >= 4 ? PAIRES_SUBTILES : PAIRES_INTRUS);
  const cible = Math.floor(Math.random() * cases);
  const secondes = difficulte <= 2 ? 0 : 14 - difficulte;
  const essaisMax = difficulte <= 2 ? 2 : 1;

  vider(zone);
  const consigne = secondes
    ? `Touche vite l’image qui n’est pas comme les autres. Tu as ${secondes} secondes.`
    : 'Touche l’image qui n’est pas comme les autres.';
  zone.appendChild(el('p', { class: 'jeu-consigne', text: consigne }));
  const grille = el('div', { class: `jeu-grille jeu-grille-${cases <= 9 ? 3 : 4}` });
  zone.appendChild(grille);
  const barre = secondes ? el('div', { class: 'jeu-barre' }, [el('span', {})]) : null;
  if (barre) zone.appendChild(barre);
  narrer?.(consigne);

  return new Promise((resoudre) => {
    let fini = false;
    const terminer = async (reussi, detail) => {
      if (fini) return;
      fini = true;
      clearInterval(minuteur);
      grille.querySelectorAll('button').forEach((b, k) => { if (k === cible) b.classList.add('trouve'); });
      await attendre(reussi ? 500 : 900);
      resoudre({ reussi, detail });
    };

    let minuteur = null;
    if (secondes) {
      const debut = Date.now();
      barre.firstChild.style.transition = `width ${secondes}s linear`;
      requestAnimationFrame(() => { barre.firstChild.style.width = '0%'; });
      minuteur = setInterval(() => {
        if (Date.now() - debut >= secondes * 1000) terminer(false, 'le temps est passé trop vite');
      }, 200);
    }

    let essais = 0;
    for (let i = 0; i < cases; i += 1) {
      const bouton = el('button', { class: 'jeu-case', text: i === cible ? different : commun });
      bouton.addEventListener('click', () => {
        if (fini) return;
        if (i === cible) {
          bouton.classList.add('trouve');
          vibrer(30);
          terminer(true, 'intrus repéré');
          return;
        }
        essais += 1;
        bouton.classList.add('rate');
        vibrer(10);
        if (essais >= essaisMax) terminer(false, 'l’intrus était bien caché');
      });
      grille.appendChild(bouton);
    }
  });
}

// --- Tape vite : un nombre de coups dans le temps imparti ------------------

async function tape(zone, { difficulte, narrer }) {
  const objectif = 8 + difficulte * 3;
  const secondes = 5;
  const instrument = piocher(['🥁', '🔔', '🪘', '🎹']);

  vider(zone);
  const consigne = `Tape ${objectif} fois sur le tambour avant la fin !`;
  zone.appendChild(el('p', { class: 'jeu-consigne', text: consigne }));
  const bouton = el('button', { class: 'jeu-tambour', text: instrument, disabled: 'disabled' });
  zone.appendChild(bouton);
  const compteur = el('p', { class: 'jeu-jauge', text: `0 / ${objectif}` });
  zone.appendChild(compteur);
  const barre = el('div', { class: 'jeu-barre' }, [el('span', {})]);
  zone.appendChild(barre);

  narrer?.(consigne);
  await attendre(2200);

  return new Promise((resoudre) => {
    let coups = 0;
    let fini = false;
    bouton.disabled = false;
    bouton.focus?.();

    const terminer = async () => {
      if (fini) return;
      fini = true;
      clearInterval(minuteur);
      bouton.disabled = true;
      await attendre(400);
      const reussi = coups >= objectif;
      resoudre({
        reussi,
        detail: reussi ? `${coups} coups de tambour` : `${coups} coups seulement, il en fallait ${objectif}`,
      });
    };

    bouton.addEventListener('click', () => {
      if (fini) return;
      coups += 1;
      compteur.textContent = `${coups} / ${objectif}`;
      bouton.classList.remove('frappe');
      void bouton.offsetWidth; // relance l'animation
      bouton.classList.add('frappe');
      vibrer(8);
      if (coups >= objectif) terminer();
    });

    barre.firstChild.style.transition = `width ${secondes}s linear`;
    requestAnimationFrame(() => { barre.firstChild.style.width = '0%'; });
    const debut = Date.now();
    const minuteur = setInterval(() => {
      if (Date.now() - debut >= secondes * 1000) terminer();
    }, 100);
  });
}

// --- Tir à la corde : tenir plus fort que l'adversaire ---------------------

async function corde(zone, { difficulte, narrer }) {
  const secondes = 8;
  const force = 0.55 + difficulte * 0.09; // ce que tire l'adversaire par seconde

  vider(zone);
  const consigne = 'Tire sur la corde ! Tape vite pour gagner du terrain.';
  zone.appendChild(el('p', { class: 'jeu-consigne', text: consigne }));
  const piste = el('div', { class: 'jeu-corde' }, [
    el('span', { class: 'jeu-corde-heros', text: '🧒' }),
    el('span', { class: 'jeu-corde-lien', text: '━━━━━━' }),
    el('span', { class: 'jeu-corde-rival', text: '🐻' }),
  ]);
  zone.appendChild(piste);
  const bouton = el('button', { class: 'jeu-tambour', text: '🪢', disabled: 'disabled' });
  zone.appendChild(bouton);
  const barre = el('div', { class: 'jeu-barre' }, [el('span', {})]);
  zone.appendChild(barre);

  narrer?.(consigne);
  await attendre(2000);

  return new Promise((resoudre) => {
    let position = 0; // de -100 (perdu) à +100 (gagné)
    let fini = false;
    bouton.disabled = false;
    const placer = () => {
      piste.style.setProperty('--tirage', `${Math.max(-40, Math.min(40, position / 2.5))}px`);
    };

    const terminer = async (gagne) => {
      if (fini) return;
      fini = true;
      clearInterval(tirage);
      clearInterval(minuteur);
      bouton.disabled = true;
      await attendre(400);
      resoudre({ reussi: gagne, detail: gagne ? 'la corde est de ton côté' : 'l’autre a tiré plus fort' });
    };

    bouton.addEventListener('click', () => {
      if (fini) return;
      position += 6;
      bouton.classList.remove('frappe');
      void bouton.offsetWidth;
      bouton.classList.add('frappe');
      vibrer(8);
      placer();
      if (position >= 100) terminer(true);
    });

    const tirage = setInterval(() => {
      position -= force;
      placer();
      if (position <= -100) terminer(false);
    }, 100);

    barre.firstChild.style.transition = `width ${secondes}s linear`;
    requestAnimationFrame(() => { barre.firstChild.style.width = '0%'; });
    const debut = Date.now();
    const minuteur = setInterval(() => {
      if (Date.now() - debut >= secondes * 1000) terminer(position > 0);
    }, 100);
  });
}

// --- Chasse aux amis : toucher les bons, éviter les guêpes -----------------

async function taupes(zone, { difficulte, narrer }) {
  const objectif = 4 + difficulte;
  const apparitions = objectif + 4 + difficulte;
  const duree = 1300 - difficulte * 130;
  const partGuepes = 0.25 + difficulte * 0.05;

  vider(zone);
  const consigne = `Touche les animaux, mais surtout pas les guêpes ! Il en faut ${objectif}.`;
  zone.appendChild(el('p', { class: 'jeu-consigne', text: consigne }));
  const terrain = el('div', { class: 'jeu-terrain' });
  zone.appendChild(terrain);
  const compteur = el('p', { class: 'jeu-jauge', text: `0 / ${objectif}` });
  zone.appendChild(compteur);

  narrer?.(consigne);
  await attendre(2400);

  let touches = 0;
  let piques = 0;
  for (let i = 0; i < apparitions && piques < 2; i += 1) {
    const guepe = Math.random() < partGuepes;
    const cible = el('button', { class: `jeu-cible${guepe ? ' guepe' : ''}`, text: guepe ? '🐝' : piocher(AMIS) });
    cible.style.left = `${10 + Math.random() * 70}%`;
    cible.style.top = `${10 + Math.random() * 60}%`;
    let touche = false;
    cible.addEventListener('click', () => {
      if (touche) return;
      touche = true;
      cible.classList.add('attrapee');
      if (guepe) { piques += 1; vibrer(40); } else { touches += 1; vibrer(15); }
      compteur.textContent = `${touches} / ${objectif}`;
    });
    terrain.appendChild(cible);
    await attendre(duree);
    cible.remove();
  }

  const reussi = touches >= objectif && piques < 2;
  return {
    reussi,
    detail: piques >= 2 ? 'les guêpes t’ont chatouillé' : reussi ? `${touches} amis touchés` : `${touches} amis sur ${objectif}`,
  };
}

// --- Compte juste : taper exactement le bon nombre de fois -----------------

async function compter(zone, { difficulte, narrer }) {
  const cible = 3 + difficulte;
  vider(zone);
  const consigne = `Tape exactement ${cible} fois, puis arrête-toi.`;
  zone.appendChild(el('p', { class: 'jeu-consigne', text: consigne }));
  const rangee = el('div', { class: 'jeu-compte' });
  const pastilles = Array.from({ length: cible }, () => el('span', { class: 'pastille-compte', text: '○' }));
  pastilles.forEach((p) => rangee.appendChild(p));
  zone.appendChild(rangee);
  const bouton = el('button', { class: 'jeu-tambour', text: '👏', disabled: 'disabled' });
  zone.appendChild(bouton);

  narrer?.(consigne);
  await attendre(2400);

  return new Promise((resoudre) => {
    let coups = 0;
    let fini = false;
    let minuteur = null;
    bouton.disabled = false;

    const conclure = async () => {
      if (fini) return;
      fini = true;
      clearTimeout(minuteur);
      bouton.disabled = true;
      await attendre(500);
      const reussi = coups === cible;
      resoudre({
        reussi,
        detail: reussi ? `${cible} fois, pile poil` : `${coups} au lieu de ${cible}`,
      });
    };

    bouton.addEventListener('click', () => {
      if (fini) return;
      coups += 1;
      if (coups <= cible) pastilles[coups - 1].textContent = '●';
      bouton.classList.remove('frappe');
      void bouton.offsetWidth;
      bouton.classList.add('frappe');
      vibrer(10);
      if (coups > cible) { conclure(); return; }
      // Deux secondes sans toucher : l'enfant a décidé de s'arrêter.
      clearTimeout(minuteur);
      minuteur = setTimeout(conclure, 2000);
    });
  });
}

export const JEUX = { memoire, attrape, intrus, tape, corde, taupes, compter };

export const NOMS_JEUX = {
  memoire: 'Jeu de mémoire',
  attrape: 'Attrape les amis',
  intrus: 'Trouve l’intrus',
  tape: 'Tape vite !',
  corde: 'Tir à la corde',
  taupes: 'Attrape sans te faire piquer',
  compter: 'Compte juste',
};

// Les jeux d'action, ceux qui marchent le mieux pendant un combat.
export const JEUX_ACTION = ['tape', 'corde', 'taupes', 'attrape'];
export const JEUX_MALINS = ['memoire', 'intrus', 'compter'];

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
