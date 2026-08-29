// Stockage local : réglages, partie en cours, journal des aventures.
import { REGLAGES_DEFAUT } from './config.js';
import { normaliserEtat } from './state.js';

const PREFIXE = 'livre-magique:';

function lire(cle, defaut) {
  try {
    const brut = localStorage.getItem(PREFIXE + cle);
    return brut ? JSON.parse(brut) : defaut;
  } catch {
    return defaut;
  }
}

function ecrire(cle, valeur) {
  try {
    localStorage.setItem(PREFIXE + cle, JSON.stringify(valeur));
    return true;
  } catch {
    return false;
  }
}

export const reglages = {
  charger() {
    return { ...REGLAGES_DEFAUT, ...lire('reglages', {}) };
  },
  enregistrer(valeurs) {
    return ecrire('reglages', { ...this.charger(), ...valeurs });
  },
};

export const partie = {
  charger: () => normaliserEtat(lire('partie', null)),
  enregistrer: (etat) => ecrire('partie', etat),
  effacer: () => localStorage.removeItem(PREFIXE + 'partie'),
};

export const journal = {
  charger: () => lire('journal', []),
  ajouter(entree) {
    const tout = this.charger();
    tout.unshift(entree);
    ecrire('journal', tout.slice(0, 20));
  },
  effacer: () => localStorage.removeItem(PREFIXE + 'journal'),
};

// Mémoire longue, indépendante du carnet : le carnet n'enregistre qu'une
// aventure terminée, or la plupart s'arrêtent en cours de route. Sans cela,
// les objets et les débuts déjà vus revenaient sans arrêt.
const SOUVENIRS_VIDES = { objets: [], debuts: [], compagnons: [], twists: [] };

export const souvenirs = {
  charger() {
    return { ...SOUVENIRS_VIDES, ...lire('souvenirs', {}) };
  },
  ajouterObjets(noms = []) {
    const memoire = this.charger();
    for (const nom of noms) {
      if (!nom) continue;
      const propre = String(nom).trim();
      if (!memoire.objets.some((o) => o.toLowerCase() === propre.toLowerCase())) memoire.objets.push(propre);
    }
    memoire.objets = memoire.objets.slice(-40);
    ecrire('souvenirs', memoire);
    return memoire.objets;
  },
  // Toute la carte d'inspiration est retenue : sinon le même compagnon et le
  // même objet insolite revenaient d'une aventure à l'autre.
  ajouterInspiration(inspiration) {
    if (!inspiration) return;
    const memoire = this.charger();
    for (const [champ, limite] of [['debuts', 8], ['compagnons', 8], ['twists', 8]]) {
      const valeur = inspiration[champ.slice(0, -1)];
      if (valeur && !memoire[champ].includes(valeur)) memoire[champ].push(valeur);
      memoire[champ] = memoire[champ].slice(-limite);
    }
    if (inspiration.objet && !memoire.objets.includes(inspiration.objet)) memoire.objets.push(inspiration.objet);
    memoire.objets = memoire.objets.slice(-40);
    ecrire('souvenirs', memoire);
  },
  effacer: () => localStorage.removeItem(PREFIXE + 'souvenirs'),
};

export const heros = {
  charger: () => lire('heros', { prenom: '', avatar: '🦸' }),
  enregistrer: (h) => ecrire('heros', h),
};
