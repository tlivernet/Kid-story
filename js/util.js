// Petits utilitaires partagés.

export const $ = (sel, racine = document) => racine.querySelector(sel);
export const $$ = (sel, racine = document) => Array.from(racine.querySelectorAll(sel));

export function el(tag, attrs = {}, enfants = []) {
  const noeud = document.createElement(tag);
  for (const [cle, valeur] of Object.entries(attrs)) {
    if (valeur === null || valeur === undefined || valeur === false) continue;
    if (cle === 'class') noeud.className = valeur;
    else if (cle === 'text') noeud.textContent = valeur;
    else if (cle === 'html') noeud.innerHTML = valeur;
    else if (cle.startsWith('on') && typeof valeur === 'function') noeud.addEventListener(cle.slice(2), valeur);
    else noeud.setAttribute(cle, valeur);
  }
  for (const enfant of [].concat(enfants)) {
    if (enfant) noeud.appendChild(typeof enfant === 'string' ? document.createTextNode(enfant) : enfant);
  }
  return noeud;
}

export function vider(noeud) {
  while (noeud && noeud.firstChild) noeud.removeChild(noeud.firstChild);
}

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

// Générateur pseudo-aléatoire déterministe : un même chapitre redessine le même décor.
export function hash(texte) {
  let h = 2166136261;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rng(graine) {
  let a = typeof graine === 'string' ? hash(graine) : (graine >>> 0) || 1;
  return function suivant() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const piocher = (liste, alea = Math.random) => liste[Math.floor(alea() * liste.length)];

export function sansAccent(texte) {
  return (texte || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Découpe une phrase en mots cliquables (ponctuation conservée à part).
export function decouperMots(phrase) {
  return (phrase.match(/[^\s]+|\s+/g) || []).map((morceau) => ({
    brut: morceau,
    espace: /^\s+$/.test(morceau),
    mot: morceau.replace(/^[^\p{L}\p{N}’'-]+|[^\p{L}\p{N}’'-]+$/gu, ''),
  }));
}

// Deux formulations parlent-elles de la même chose ? Sert à ne pas reproposer
// « la ficelle qui se noue toute seule » quand le modèle l'a appelée
// « ficelle vivante ».
const motsCles = (texte) => new Set(
  String(texte).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/).filter((mot) => mot.length > 3),
);

export function memeIdee(a, b) {
  const motsA = motsCles(a);
  const motsB = motsCles(b);
  if (!motsA.size || !motsB.size) return false;
  let communs = 0;
  for (const mot of motsA) if (motsB.has(mot)) communs += 1;
  return communs / Math.min(motsA.size, motsB.size) >= 0.5;
}

// Texte préparé pour la synthèse vocale. L'affichage, lui, garde la version
// d'origine : ces retouches ne servent qu'à l'oreille.
export function texteParle(texte) {
  return String(texte)
    // Élision : avec l'apostrophe droite, les moteurs détachent la lettre
    // (« c'est » lu « c », « est »). L'apostrophe française typographique est
    // celle sur laquelle les voix françaises sont entraînées.
    .replace(/['\u02BC\u2018]/g, '\u2019')
    // Un mot tout en majuscules est épelé lettre par lettre : LUI devient Lui.
    .replace(/\p{Lu}{2,}/gu, (mot) => mot[0] + mot.slice(1).toLowerCase())
    // Espaces insécables et guillemets français perturbent le découpage.
    .replace(/[\u202F\u00A0\u2009]/g, ' ')
    .replace(/[«»]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function vibrer(ms = 12) {
  try { if (navigator.vibrate) navigator.vibrate(ms); } catch { /* ignoré */ }
}
