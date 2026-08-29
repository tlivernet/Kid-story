// État d'une aventure + application d'un chapitre reçu.
import { REGLAGES_DEFAUT } from './config.js';

export function nouvelEtat({
  heros, theme, themeId, longueur = REGLAGES_DEFAUT.longueur, idee = '',
  richesse = REGLAGES_DEFAUT.richesse, inspiration = null,
}) {
  return {
    id: `av-${Date.now()}`,
    heros,
    theme,
    themeId,
    idee,
    longueur,
    chapitre: 0,
    coeurs: 3,
    etoiles: 0,
    sac: [],
    compagnon: '',
    personnages: [],
    promesses: [],
    richesse,
    inspiration,
    quete: '',
    memoire: '',
    lieu: '',
    titre: '',
    termine: false,
    dernier: null,
    finTitre: '',
    finMessage: '',
    historique: [],   // messages envoyés au modèle
    chapitres: [],    // souvenirs affichés dans le carnet
  };
}

const MAX_SAC = 6;
const MAX_GRAINES = 4;

const motsCles = (texte) => new Set(
  String(texte).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/).filter((m) => m.length > 3),
);

// Deux formulations parlent-elles de la même graine ?
function memeGraine(a, b) {
  const motsA = motsCles(a);
  const motsB = motsCles(b);
  if (!motsA.size || !motsB.size) return false;
  let communs = 0;
  for (const mot of motsA) if (motsB.has(mot)) communs += 1;
  return communs / Math.min(motsA.size, motsB.size) >= 0.5;
}

export function appliquerChapitre(etat, chapitre) {
  const nouveaux = [];

  for (const objet of chapitre.sac_ajouter || []) {
    if (!objet?.nom) continue;
    if (etat.sac.some((o) => o.nom.toLowerCase() === objet.nom.toLowerCase())) continue;
    const propre = { nom: objet.nom, emoji: objet.emoji || '✨', pouvoir: objet.pouvoir || '' };
    etat.sac.push(propre);
    nouveaux.push(propre);
  }
  if (etat.sac.length > MAX_SAC) etat.sac = etat.sac.slice(etat.sac.length - MAX_SAC);

  for (const nom of chapitre.sac_retirer || []) {
    const i = etat.sac.findIndex((o) => o.nom.toLowerCase() === String(nom).toLowerCase());
    if (i >= 0) etat.sac.splice(i, 1);
  }

  // Bible de l'histoire : troupe rencontrée et graines narratives en attente.
  if (Array.isArray(chapitre.personnages) && chapitre.personnages.length) {
    etat.personnages = chapitre.personnages
      .filter((p) => p?.nom)
      .slice(0, 4)
      .map((p) => ({ nom: p.nom, emoji: p.emoji || '🙂', manie: p.manie || '' }));
  }
  if (chapitre.promesse_payee) {
    etat.promesses = etat.promesses.filter((g) => !memeGraine(g, chapitre.promesse_payee));
  }
  if (chapitre.promesse_plantee && !etat.promesses.some((g) => memeGraine(g, chapitre.promesse_plantee))) {
    etat.promesses.push(chapitre.promesse_plantee);
  }
  if (etat.promesses.length > MAX_GRAINES) etat.promesses = etat.promesses.slice(-MAX_GRAINES);

  const coeursAvant = etat.coeurs;
  etat.coeurs = Math.max(1, Math.min(3, etat.coeurs + (chapitre.coeurs_delta || 0)));
  etat.etoiles += chapitre.etoiles_delta || 0;
  if (chapitre.quete) etat.quete = chapitre.quete;
  if (chapitre.memoire) etat.memoire = chapitre.memoire;
  if (chapitre.compagnon !== undefined) etat.compagnon = chapitre.compagnon || etat.compagnon;
  if (chapitre.lieu) etat.lieu = chapitre.lieu;
  if (chapitre.titre && !etat.titre) etat.titre = chapitre.titre;

  etat.chapitre += 1;
  etat.dernier = chapitre;
  etat.chapitres.push({
    n: etat.chapitre,
    texte: chapitre.texte || [],
    decor: {
      lieu: chapitre.lieu,
      moment: chapitre.moment,
      acteurs: chapitre.acteurs || [],
      objets_decor: chapitre.objets_decor || [],
    },
  });

  const fini = Boolean(chapitre.fin_titre) || !(chapitre.choix || []).length;
  if (fini) {
    etat.termine = true;
    etat.finTitre = chapitre.fin_titre || 'Bravo !';
    etat.finMessage = chapitre.fin_message || 'Quelle belle aventure !';
  }

  return { nouveaux, coeursGagnes: etat.coeurs - coeursAvant, fini };
}

// On garde un historique court : le modèle a la mémoire + l'état à chaque tour.
export function ajouterEchange(etat, messageUtilisateur, texteChapitre) {
  etat.historique.push({ role: 'user', content: messageUtilisateur });
  etat.historique.push({ role: 'assistant', content: texteChapitre });
  if (etat.historique.length > 8) etat.historique = etat.historique.slice(-8);
}

export function messagesPour(etat, messageUtilisateur) {
  return [...etat.historique, { role: 'user', content: messageUtilisateur }];
}
