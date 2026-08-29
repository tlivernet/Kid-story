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

export const heros = {
  charger: () => lire('heros', { prenom: '', avatar: '🦸' }),
  enregistrer: (h) => ecrire('heros', h),
};
