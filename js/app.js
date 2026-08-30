// Le Livre Magique — orchestration des écrans et du jeu.
import {
  APP, THEMES, MODELES, INSPIRATIONS, INSPIRATIONS_REELLES, familleVoix,
  GROUPES_AVATARS, TEINTES, teinter, teintable,
} from './config.js';
import { $, el, vider, decouperMots, vibrer, attendre, piocher } from './util.js';
import { reglages as storeReglages, partie, journal, souvenirs, heros as storeHeros } from './storage.js';
import { SYSTEME, SCHEMA, premierMessage, messageSuivant } from './prompt.js';
import { raconter, tester } from './api.js';
import { dessinerScene } from './scene.js';
import { marquerPhrase, marquerMot, effacerTout } from './surlignage.js';
import { mesurerTexte, consigneStyle } from './qualite.js';
import { narrateur } from './voix.js';
import { lancer, animer, bonusDe, faceDe } from './dice.js';
import { typeEpreuve, jouer, NOMS_JEUX, JEUX_ACTION, JEUX_MALINS, JEUX_LECTURE } from './minijeux.js';
import { nouvelEtat, appliquerChapitre, ajouterEchange, messagesPour, perdreCoeur, secourir } from './state.js';
import { chapitreDemo } from './demo.js';

const ui = {
  reglages: storeReglages.charger(),
  etat: null,
  theme: null,
  avatar: storeHeros.charger().avatar || '🧒',
  avatarBase: storeHeros.charger().avatarBase || '🧒',
  teinte: storeHeros.charger().teinte || '',
  lecture: true,
  demo: false,
  enCours: false,
  epreuveEnCours: false,   // une épreuve occupe l'écran : rien d'autre ne démarre
  requete: null,
  ecran: 'accueil',
  phrasesAffichees: 0,
  phrasesCourantes: [],
  phraseCourante: 0,
  derniereAction: null,
  installPrompt: null,
};

const animationsReduites = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const DELAI_VALIDATION = 3000; // temps laissé pour changer d'avis avant de valider

// Le réglage « douceur » décale la difficulté des épreuves et décide si un
// échec coûte du courage.
function difficulteEffective(base) {
  const decalage = { tendre: -1, normal: 0, corse: 1 }[ui.reglages.douceur] ?? 0;
  return Math.min(6, Math.max(2, (base || 3) + decalage));
}

const echecCouteCoeur = () => ui.reglages.douceur !== 'tendre';

// Un échec fait perdre un cœur ; à zéro, on est secouru (jamais de fin brutale).
function encaisserEchec() {
  if (!echecCouteCoeur()) return null;
  perdreCoeur(ui.etat);
  majJauges();
  if (ui.etat.coeurs > 0) return null;
  const perdu = secourir(ui.etat);
  majJauges();
  toast(perdu ? `Plus de courage… ${perdu.emoji} ${perdu.nom} est perdu, mais on t’aide !` : 'Plus de courage… un ami vient t’aider !');
  return { perdu: perdu?.nom || '' };
}

// --- Utilitaires d'interface ------------------------------------------------

// Chaque écran se présente à voix haute : l'enfant ne lit pas encore, il ne
// doit jamais avoir à deviner où il est ni ce qu'on attend de lui.
const ANNONCES = {
  accueil: () => [
    'Le Livre Magique.',
    $('#btn-continuer').hidden
      ? 'Touche la grande touche violette pour commencer une aventure.'
      : 'Touche la touche violette pour une nouvelle aventure, ou celle du dessous pour continuer ton histoire.',
  ],
  theme: () => ['Quelle histoire aujourd’hui ?', 'Touche le monde qui te plaît.'],
  heros: () => ['Qui est le héros ?', 'Choisis ton personnage, puis touche la grande touche « C’est parti ».'],
  carnet: () => ['Ton carnet d’aventures.', 'Touche une histoire pour l’écouter.'],
};

function annoncerEcran(nom, entete) {
  if (!ui.lecture || !ui.reglages.lireInterface) return;
  const phrases = [entete, ...(ANNONCES[nom]?.() || [])].filter(Boolean);
  if (!phrases.length) return;
  narrateur.debloquer();
  narrateur.lire(phrases, {});
}

function montrer(nom, entete) {
  ui.ecran = nom;
  annulerValidation();
  if (nom === 'jeu') garderEcranAllume(); else laisserEcranDormir();
  if (nom !== 'jeu') narrateur.stop();
  document.querySelectorAll('.ecran').forEach((e) => e.classList.remove('actif'));
  $(`#ecran-${nom}`).classList.add('actif');
  $(`#ecran-${nom}`).scrollTop = 0;
  annoncerEcran(nom, entete);
}

// L'écran d'une tablette s'éteint au bout de trente secondes sans toucher :
// pendant la lecture, cela coupait l'histoire en plein milieu.
async function garderEcranAllume() {
  try {
    if (!('wakeLock' in navigator) || ui.verrouEcran) return;
    ui.verrouEcran = await navigator.wakeLock.request('screen');
    ui.verrouEcran.addEventListener('release', () => { ui.verrouEcran = null; });
  } catch {
    // Verrou refusé (onglet en arrière-plan, navigateur sans l'API) : sans gravité.
  }
}

function laisserEcranDormir() {
  try { ui.verrouEcran?.release(); } catch { /* déjà relâché */ }
  ui.verrouEcran = null;
}

const JOURNAL_ERREURS = [];

function noterErreur(source, message) {
  JOURNAL_ERREURS.unshift(`${new Date().toLocaleTimeString('fr-FR')} — ${source} : ${message}`);
  JOURNAL_ERREURS.length = Math.min(JOURNAL_ERREURS.length, 8);
}

// Un pépin technique ne doit jamais laisser un écran vide : on l'affiche et on
// propose de réessayer.
function signalerPepin(message) {
  noterErreur('technique', message || 'erreur inconnue');
  try {
    if (ui.ecran !== 'jeu') return;
    ui.enCours = false;
    clearInterval(ui.chienDeGarde);
    $('#chargement').hidden = true;
    afficherErreur(
      { message: 'Un pépin a interrompu l’histoire.', aide: message || '' },
      ui.derniereAction,
    );
  } catch { /* on ne casse pas l'application dans le gestionnaire d'erreurs */ }
}

let toastTimer = null;
function toast(message) {
  const boite = $('#toast');
  boite.textContent = message;
  boite.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { boite.hidden = true; }, 3200);
}

function modeDemo() {
  return ui.demo || !ui.reglages.cle;
}

function appliquerReglages() {
  document.documentElement.style.setProperty('--taille-texte', ui.reglages.tailleTexte);
  narrateur.configurer(ui.reglages);
}

// --- Accueil ----------------------------------------------------------------

function majAccueil() {
  const sauvegarde = partie.charger();
  const bouton = $('#btn-continuer');
  if (sauvegarde && sauvegarde.chapitre > 0) {
    // Même une aventure marquée « terminée » reste accessible : sinon une fin
    // annoncée par erreur la rendrait définitivement injoignable.
    bouton.hidden = false;
    $('#btn-continuer .btn-label').textContent = sauvegarde.termine
      ? 'Reprendre l’aventure'
      : 'Continuer l’aventure';
    const titre = sauvegarde.titre || sauvegarde.theme;
    $('#detail-continuer').textContent = sauvegarde.chapitre > 0
      ? `${titre} · chapitre ${sauvegarde.chapitre}`
      : titre;
  } else {
    bouton.hidden = true;
  }
  $('#detail-nouvelle').textContent = `${THEMES.length} mondes à explorer`;
  const terminees = aventuresConnues().filter((a) => a.termine).length;
  $('#detail-carnet').textContent = terminees
    ? `${terminees} aventure${terminees > 1 ? 's' : ''} terminée${terminees > 1 ? 's' : ''}`
    : 'Encore vide — ta première histoire t’attend';
  $('#note-mode').textContent = ui.reglages.cle
    ? ''
    : 'Mode démo : les histoires sont fabriquées sur l’appareil. Ajoute une clé API Claude dans les réglages pour des aventures infinies.';
  $('#accueil-fond').innerHTML = dessinerScene(
    { lieu: 'prairie', moment: 'jour', acteurs: [], objets_decor: [] },
    'accueil-2',
  );
}

function construireThemes() {
  const grille = $('#grille-themes');
  vider(grille);
  const cartes = [
    { titre: 'Mondes imaginaires', pastille: '✨' },
    ...THEMES.filter((t) => !t.realiste),
    { titre: 'Dans la vraie vie', pastille: '🌍' },
    ...THEMES.filter((t) => t.realiste),
    { titre: 'Au hasard', pastille: '🎲' },
    { id: 'surprise', nom: 'Surprise !', emoji: '🎲' },
    { id: 'surprise-reel', nom: 'Vraie vie surprise', emoji: '🎯', realiste: true },
    { id: 'idee', nom: 'Mon idée', emoji: '✏️' },
  ];
  // Chaque monde reçoit une teinte stable : on le retrouve du coin de l'œil,
  // sans avoir à lire son nom.
  let rang = 0;
  for (const theme of cartes) {
    if (theme.titre) {
      grille.appendChild(el('h3', { class: 'titre-groupe' }, [
        el('span', { class: 'pastille', text: theme.pastille }),
        el('span', { class: 'libelle', text: theme.titre }),
        el('span', { class: 'trait' }),
      ]));
      rang = 0;
      continue;
    }
    const carte = el('button', { class: `carte-theme teinte-${(rang++ % 6) + 1}` }, [
      el('span', { class: 'haut' }, [el('span', { class: 'emoji', text: theme.emoji })]),
      el('span', { class: 'nom', text: theme.nom }),
    ]);
    carte.addEventListener('click', () => {
      let choisi = theme;
      if (theme.id === 'surprise') choisi = piocher(THEMES.filter((t) => !t.realiste));
      if (theme.id === 'surprise-reel') choisi = piocher(THEMES.filter((t) => t.realiste));
      ui.theme = choisi;
      $('#bloc-idee').hidden = theme.id !== 'idee';
      construireAvatars();
      montrer('heros', `${choisi.nom} !`);
      $('#champ-prenom').focus();
    });
    grille.appendChild(carte);
  }
}

function construireAvatars() {
  const grille = $('#grille-avatars');
  vider(grille);
  // Les métiers passent devant quand l'histoire est ancrée dans le réel.
  const realiste = Boolean(ui.theme?.realiste);
  const groupes = [...GROUPES_AVATARS].sort((a, b) => {
    const rang = (g) => (g.titre.startsWith('🧒') ? 0 : g.realiste ? (realiste ? 1 : 2) : g.titre.startsWith('✨') ? (realiste ? 2 : 1) : 3);
    return rang(a) - rang(b);
  });

  for (const groupe of groupes) {
    grille.appendChild(el('h3', { class: 'titre-groupe', text: groupe.titre }));
    for (const avatar of groupe.avatars) {
      const bouton = el('button', {
        class: 'avatar', text: teinter(avatar.emoji, ui.teinte), title: avatar.nom, 'data-base': avatar.emoji,
      });
      bouton.addEventListener('click', () => {
        ui.avatarBase = avatar.emoji;
        ui.avatar = teinter(avatar.emoji, ui.teinte);
        majAvatars();
        vibrer();
      });
      grille.appendChild(bouton);
    }
  }
  construireTeintes();
  majAvatars();
}

// Une rangée de teintes de peau : l'enfant doit pouvoir se reconnaître.
function construireTeintes() {
  const rangee = $('#rangee-teintes');
  vider(rangee);
  for (const teinte of TEINTES) {
    const bouton = el('button', {
      class: 'teinte', text: teinter('🧒', teinte.modificateur), title: `Peau ${teinte.nom}`,
      'data-teinte': teinte.modificateur,
    });
    bouton.addEventListener('click', () => {
      ui.teinte = teinte.modificateur;
      ui.avatar = teinter(ui.avatarBase, ui.teinte);
      construireAvatars();
      vibrer();
    });
    rangee.appendChild(bouton);
  }
}

function majAvatars() {
  document.querySelectorAll('#grille-avatars .avatar').forEach((bouton) => {
    bouton.classList.toggle('choisi', bouton.dataset.base === ui.avatarBase);
  });
  document.querySelectorAll('#rangee-teintes .teinte').forEach((bouton) => {
    bouton.classList.toggle('choisi', (bouton.dataset.teinte || '') === (ui.teinte || ''));
  });
  $('#bloc-teintes').hidden = !teintable(ui.avatarBase);
  $('#apercu-heros').textContent = ui.avatar;
}

// --- Démarrage d'une aventure ----------------------------------------------

// Deux aventures sur le même thème ne doivent pas se ressembler : on tire une
// carte d'inspiration, en évitant les débuts déjà vus récemment.
function tirerInspiration(realiste = false) {
  const source = realiste ? INSPIRATIONS_REELLES : INSPIRATIONS;
  const vus = souvenirs.charger();
  // Chaque élément est tiré parmi ceux qu'on n'a pas vus récemment.
  const neuf = (liste, dejaVus) => {
    const restants = liste.filter((valeur) => !dejaVus.includes(valeur));
    return piocher(restants.length ? restants : liste);
  };
  return {
    debut: neuf(source.debuts, vus.debuts),
    compagnon: neuf(source.compagnons, vus.compagnons),
    objet: neuf(source.objets, vus.objets),
    twist: neuf(source.twists, vus.twists),
    ton: piocher(source.tons),
  };
}

// Les objets déjà offerts, y compris dans les aventures abandonnées en route.
function objetsDejaVus() {
  return souvenirs.charger().objets.slice(-12);
}

function demarrer() {
  const prenom = $('#champ-prenom').value.trim() || 'Héros';
  const idee = $('#champ-idee').value.trim();
  const heros = { prenom, avatar: ui.avatar };
  storeHeros.enregistrer({ ...heros, avatarBase: ui.avatarBase, teinte: ui.teinte });

  const theme = ui.theme && ui.theme.id !== 'idee' ? ui.theme : { id: 'idee', nom: idee || 'une histoire surprise' };
  const realiste = Boolean(theme.realiste);
  ui.etat = nouvelEtat({
    heros,
    theme: theme.nom,
    themeId: theme.id === 'idee' ? piocher(THEMES).id : theme.id,
    longueur: Number(ui.reglages.longueur) || 12,
    richesse: ui.reglages.richesse,
    realiste,
    inspiration: tirerInspiration(realiste),
    objetsEvites: objetsDejaVus(),
    idee,
  });
  souvenirs.ajouterInspiration(ui.etat.inspiration);
  ui.demo = false;
  narrateur.debloquer();
  montrer('jeu');
  majJauges();
  $('#titre-histoire').hidden = true;
  $('#scene').innerHTML = dessinerScene({ lieu: 'ciel', moment: 'jour', acteurs: [heros.avatar], objets_decor: ['📖'] }, ui.etat.id);
  demanderChapitre(null);
}

function reprendre() {
  const sauvegarde = partie.charger();
  if (!sauvegarde) return;
  ui.etat = sauvegarde;
  ui.demo = false;
  narrateur.debloquer();
  montrer('jeu');
  majJauges();
  try {
    if (sauvegarde.adversaire) lancerCombat();
    else if (sauvegarde.dernier) rendreChapitre(sauvegarde.dernier, false);
    else demanderChapitre(null);
  } catch (erreur) {
    // Un chapitre enregistré illisible ne doit pas bloquer la reprise.
    noterErreur('reprise', erreur.message);
    demanderChapitre(null);
  }
}

// --- Affichage d'un chapitre ------------------------------------------------

function elementPhrase(texte, index) {
  const phrase = el('span', { class: 'phrase', 'data-index': index });
  let position = 0;
  for (const morceau of decouperMots(texte)) {
    if (morceau.espace) {
      phrase.appendChild(document.createTextNode(morceau.brut));
    } else {
      const mot = el('span', {
        class: 'mot', text: morceau.brut, 'data-debut': position, 'data-fin': position + morceau.brut.length,
      });
      mot.addEventListener('click', (e) => {
        e.stopPropagation();
        if (ui.doigtGlisse) return; // c'était un défilement, pas un appui
        vibrer(8);
        const reprise = ui.phraseCourante ?? index;
        narrateur.direMot(morceau.mot || morceau.brut, () => reprendreLecture(reprise));
      });
      phrase.appendChild(mot);
    }
    position += morceau.brut.length;
  }
  return phrase;
}

function ajouterPhrase(texte, index) {
  const zone = $('#texte-histoire');
  if (zone.querySelector(`[data-index="${index}"]`)) return;
  ui.phrasesCourantes[index] = texte;
  zone.appendChild(elementPhrase(texte, index));
  ui.phrasesAffichees = Math.max(ui.phrasesAffichees, index + 1);
}

const rappelsLecture = {
  onPhrase: (index) => {
    ui.lectureDemarree = true;
    ui.phraseCourante = index;
    ui.dernierSignalVoix = Date.now();
    marquerPhrase(index)?.scrollIntoView({ block: 'nearest' });
  },
  onMot: (index, debut) => {
    ui.dernierSignalVoix = Date.now();
    if (!ui.reglages.motParMot) return;
    marquerMot(index, debut);
  },
  onFin: () => {
    effacerTout();
    revelerChoix();
  },
  onErreur: (message) => {
    if (ui.voixSignalee) return;
    ui.voixSignalee = true;
    toast(`Voix Google indisponible (${message}) — je continue avec la voix de l’appareil.`);
  },
};

// Après avoir dit un mot touché, l'histoire repart de la phrase en cours.
function reprendreLecture(depuis) {
  if (!ui.lecture || !$('#choix').classList.contains('masque')) return;
  const phrases = ui.phrasesCourantes;
  if (!phrases.length || depuis >= phrases.length) return;
  narrateur.ouvrir(rappelsLecture);
  for (let i = depuis; i < phrases.length; i += 1) {
    if (phrases[i]) narrateur.enfiler(phrases[i], i);
  }
  narrateur.fermer();
  surveillerLaVoix();
}

// Filet de sécurité : si la voix ne démarre jamais (aucune voix installée) ou
// se bloque en route, les choix apparaissent quand même.
function surveillerLaVoix() {
  clearInterval(ui.chienDeGarde);
  ui.dernierSignalVoix = Date.now();
  ui.chienDeGarde = setInterval(() => {
    if (!$('#choix').classList.contains('masque')) { clearInterval(ui.chienDeGarde); return; }
    // Tant que la voix travaille (extrait en cours, phrase en attente), on
    // ne considère pas qu'elle est morte.
    if (narrateur.enPause || narrateur.occupe) { ui.dernierSignalVoix = Date.now(); return; }
    const silence = Date.now() - ui.dernierSignalVoix;
    // Si la voix a déjà fonctionné, les choix doivent quand même être énoncés.
    // Une voix de synthèse en ligne peut mettre quelques secondes avant le
    // premier son : on ne conclut pas trop vite à la panne.
    if (silence > (ui.lectureDemarree ? 9000 : 6000)) revelerChoix(ui.lectureDemarree);
  }, 1000);
}

// Le texte garde toute la place pendant la lecture ; les choix arrivent après.
// L'illustration se replie dès que les choix occupent le bas de l'écran, et le
// texte revient à son début : c'est le moment où l'on veut le relire.
function ajusterPlace() {
  const zone = $('#choix');
  const ouverts = !zone.classList.contains('masque') && zone.children.length > 0;
  $('#ecran-jeu').classList.toggle('choix-ouverts', ouverts);
}

function textePlein(actif) {
  const ecran = $('#ecran-jeu');
  const veut = actif === undefined ? !ecran.classList.contains('texte-plein') : actif;
  ecran.classList.toggle('texte-plein', veut);
  $('#btn-texte').setAttribute('aria-pressed', String(veut));
  $('#btn-texte').setAttribute('aria-label', veut ? 'Revenir aux choix' : 'Voir tout le texte');
}

function revelerChoix(lire = true) {
  clearInterval(ui.chienDeGarde);
  const zone = $('#choix');
  if (!zone.classList.contains('masque')) {
    // Les choix étaient déjà visibles (défilement, filet de sécurité) : ils
    // doivent quand même être énoncés, une fois.
    if (lire && !ui.choixEnonces) lireLesChoix();
    return;
  }
  if (ui.combatEnAttente) {
    ui.combatEnAttente = false;
    lancerCombat();
    return;
  }
  zone.classList.remove('masque');
  ajusterPlace();
  // On remonte au début du chapitre : pendant la lecture le texte a défilé
  // jusqu'en bas, et c'est justement là qu'on veut pouvoir y revenir.
  $('.zone-histoire').scrollTop = 0;
  if (lire) lireLesChoix();
}

// L'enfant ne lit pas encore : les choix lui sont énoncés, un par un, carte allumée.
function lireLesChoix() {
  if (!ui.lecture || !ui.reglages.lireChoix) return;
  const cartes = document.querySelectorAll('#choix .carte-choix');
  if (!cartes.length || ui.etat?.termine) return;
  ui.choixEnonces = true;
  const phrases = ['Que fais-tu ?'];
  const numeros = ['Un', 'Deux', 'Trois'];
  cartes.forEach((carte, i) => phrases.push(`${numeros[i] || i + 1} : ${carte.dataset.texte}.`));
  narrateur.lire(phrases, {
    onPhrase: (index) => {
      cartes.forEach((c, i) => c.classList.toggle('enonce', i === index - 1));
    },
    onFin: () => cartes.forEach((c) => c.classList.remove('enonce')),
  });
}

function rendreChapitre(chapitre, anime = true) {
  const zone = $('#texte-histoire');
  vider(zone);
  ui.phrasesAffichees = 0;
  (chapitre.texte || []).forEach((phrase, i) => ajouterPhrase(phrase, i));
  $('#scene').innerHTML = dessinerScene(
    { lieu: chapitre.lieu, moment: chapitre.moment, acteurs: chapitre.acteurs, objets_decor: chapitre.objets_decor },
    `${ui.etat.id}-${ui.etat.chapitre}`,
  );
  majTitreHistoire();
  rendreChoix(chapitre, false);
  majJauges();
  if (anime && ui.lecture) {
    majBoutonPause();
    narrateur.lire(chapitre.texte || [], rappelsLecture);
  }
}

// Cœurs et étoiles dessinés : un emoji change de taille et de dessin selon
// l'appareil, un tracé non.
const TRACE_COEUR = 'M12 21S3.5 15.3 3.5 9.6A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8.5 2.6C20.5 15.3 12 21 12 21z';
const TRACE_ETOILE = 'M12 3l2.7 5.7 6.3.8-4.6 4.3 1.2 6.2L12 17l-5.6 3 1.2-6.2L3 9.5l6.3-.8z';
const coeurSvg = (plein) => `<svg viewBox="0 0 24 24" class="${plein ? 'coeur' : 'coeur-vide'}" aria-hidden="true"><path d="${TRACE_COEUR}"/></svg>`;

function majJauges() {
  const etat = ui.etat;
  if (!etat) return;
  const pleins = Math.max(0, Math.min(3, etat.coeurs));
  $('#coeurs').innerHTML = coeurSvg(true).repeat(pleins) + coeurSvg(false).repeat(3 - pleins);
  $('#coeurs').setAttribute('aria-label', `${pleins} cœurs de courage sur 3`);
  $('#etoiles').innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${TRACE_ETOILE}"/></svg><b>${etat.etoiles}</b>`;
  $('#etoiles').setAttribute('aria-label', `${etat.etoiles} étoiles`);
  majRailSac();
}

// Le sac est affiché en permanence : l'enfant voit ce qu'il transporte, et
// touche un objet pour s'entendre rappeler à quoi il sert.
function majRailSac() {
  const rail = $('#rail-objets');
  const sac = ui.etat?.sac || [];
  const connus = new Set([...rail.querySelectorAll('.objet-rail')].map((n) => n.dataset.nom));
  vider(rail);
  if (!sac.length) {
    rail.appendChild(el('span', { class: 'rail-vide', text: 'Ton sac est vide' }));
    return;
  }
  for (const objet of sac) {
    const puce = el('button', { class: 'objet-rail', 'data-nom': objet.nom }, [
      el('span', { class: 'emoji', text: objet.emoji || '🎁' }),
      el('span', { class: 'nom', text: objet.nom }),
    ]);
    if (connus.size && !connus.has(objet.nom)) puce.classList.add('neuf');
    puce.addEventListener('click', () => direObjet(objet));
    rail.appendChild(puce);
  }
}

function direObjet(objet) {
  const phrase = objet.pouvoir ? `${objet.nom} : ${objet.pouvoir}` : objet.nom;
  toast(`${objet.emoji || '🎁'} ${phrase}`);
  if (ui.lecture) { narrateur.debloquer(); narrateur.direMot(phrase); }
}

// Le titre de l'histoire sert aussi de repère de progression.
function majTitreHistoire(titre = ui.etat?.titre) {
  const noeud = $('#titre-histoire');
  if (!titre) { noeud.hidden = true; return; }
  const numero = Number(ui.etat?.chapitre) || 0;
  noeud.textContent = numero > 0 ? `Chapitre ${numero} · ${titre}` : titre;
  noeud.hidden = false;
}

// Le bouton de lecture montre l'action à venir, pas l'état courant.
function majBoutonPause() {
  const bouton = $('#btn-pause');
  const enPause = Boolean(narrateur.enPause);
  bouton.classList.toggle('en-pause', enPause);
  bouton.setAttribute('aria-label', enPause ? 'Reprendre la lecture' : 'Pause');
}

function majBoutonSon() {
  $('#emoji-son').textContent = ui.lecture ? '🔊' : '🔇';
  $('#libelle-son').textContent = ui.lecture ? 'Voix allumée' : 'Voix coupée';
  $('#btn-son').classList.toggle('muet', !ui.lecture);
}

// Le menu regroupe le sac, le résumé et la voix.
function menuOutils(ouvrir) {
  const menu = $('#menu-outils');
  const veut = ouvrir === undefined ? menu.hidden : ouvrir;
  menu.hidden = !veut;
  $('#btn-outils').setAttribute('aria-expanded', String(veut));
}

// --- Choix ------------------------------------------------------------------

function rendreChoix(chapitre, masquer = false) {
  const zone = $('#choix');
  ui.choixEnonces = false;
  vider(zone);
  zone.classList.toggle('masque', masquer);
  textePlein(false);
  if (ui.etat.termine) {
    const fin = el('button', { class: 'carte-choix' }, [
      el('span', { class: 'emoji', text: '🏆' }),
      el('span', { class: 'libelle', text: 'Voir la fin de l’histoire' }),
    ]);
    fin.addEventListener('click', montrerFin);
    zone.appendChild(fin);
    const suite = el('button', { class: 'carte-choix' }, [
      el('span', { class: 'emoji', text: '▶️' }),
      el('span', { class: 'libelle', text: 'Continuer quand même l’aventure' }),
    ]);
    suite.addEventListener('click', reprendreApresFin);
    zone.appendChild(suite);
    ajusterPlace();
    return;
  }
  for (const choix of chapitre.choix || []) {
    const possede = !choix.objet_requis
      || ui.etat.sac.some((o) => o.nom.toLowerCase() === String(choix.objet_requis).toLowerCase());
    const rang = zone.children.length;
    const classes = ['carte-choix', `choix-${rang + 1}`];
    if (choix.epreuve_difficulte) classes.push('epreuve');
    if (!possede) classes.push('bloque');
    const bouton = el('button', { class: classes.join(' '), 'data-texte': choix.texte }, [
      el('span', { class: 'numero', text: String(rang + 1) }),
      el('span', { class: 'emoji', text: choix.emoji || '👉' }),
      el('span', { class: 'carte-texte' }, [el('span', { class: 'libelle', text: choix.texte })]),
    ]);
    bouton.appendChild(el('span', { class: 'validation', text: '✅' }));
    // Le badge vient après la coche : il passe ainsi sur sa propre ligne et
    // dispose de toute la largeur de la carte, quel que soit le nom de l'objet.
    const badge = badgeDuChoix(choix, possede);
    if (badge) bouton.appendChild(badge);
    bouton.appendChild(el('span', { class: 'jauge-validation' }));
    bouton.addEventListener('click', () => choisir(choix, possede, bouton));
    zone.appendChild(bouton);
  }
  ajusterPlace();
}

// Ce qu'un choix demande doit se voir sans savoir lire : un dé pour une
// épreuve, l'objet lui-même quand on l'a, un cadenas quand il manque.
function badgeDuChoix(choix, possede) {
  if (choix.objet_requis) {
    const objet = ui.etat.sac.find((o) => o.nom.toLowerCase() === String(choix.objet_requis).toLowerCase());
    return possede
      ? el('span', { class: 'badge badge-objet' }, [
        el('span', { class: 'emoji', text: objet?.emoji || '🎒' }),
        el('span', { class: 'mot', text: choix.objet_requis }),
      ])
      // Le cadenas dit « fermé », le nom dit « quoi » : pas de phrase à lire,
      // elle serait tronquée sur un téléphone. La voix, elle, la dit en entier.
      : el('span', { class: 'badge badge-manque' }, [
        el('span', { class: 'emoji', text: '🔒' }),
        el('span', { class: 'mot', text: choix.objet_requis }),
      ]);
  }
  if (choix.epreuve_difficulte) {
    return el('span', { class: 'badge badge-epreuve' }, [
      el('span', { class: 'emoji', text: '🎲' }),
      el('span', { class: 'mot', text: 'épreuve' }),
    ]);
  }
  return null;
}

// L'enfant touche une tuile : elle s'allume, se fait relire, et une jauge se
// remplit. Au bout de trois secondes l'aventure continue toute seule ; un
// nouvel appui sur la même tuile va plus vite, un appui ailleurs change d'avis.
function selectionner(choix, bouton) {
  annulerValidation();
  bouton.classList.add('choisi');
  vibrer(10);
  const lancerJauge = () => {
    if (!bouton.classList.contains('choisi') || bouton.classList.contains('compte')) return;
    bouton.classList.add('compte');
    ui.minuteurValidation = setTimeout(() => choisir(choix, true, bouton), DELAI_VALIDATION);
  };
  if (ui.lecture) {
    narrateur.direMot(choix.texte, lancerJauge);
    // Si la voix ne rend jamais la main, la jauge part quand même.
    setTimeout(lancerJauge, 2500);
  } else {
    lancerJauge();
  }
}

function annulerValidation() {
  clearTimeout(ui.minuteurValidation);
  ui.minuteurValidation = null;
  document.querySelectorAll('#choix .carte-choix').forEach((c) => {
    c.classList.remove('choisi', 'compte');
  });
}

async function choisir(choix, possede, bouton) {
  // Sans ce garde-fou, un second appui — ou le repli de 2,5 s de selectionner —
  // lançait une deuxième épreuve par-dessus celle qui était encore en cours,
  // puis deux chapitres à la suite. `enCours` ne couvrait que la requête.
  if (ui.enCours || ui.epreuveEnCours) return;
  narrateur.debloquer();
  if (possede && ui.reglages.confirmerChoix && !bouton.classList.contains('choisi')) {
    selectionner(choix, bouton);
    return;
  }
  clearTimeout(ui.minuteurValidation);
  ui.minuteurValidation = null;
  if (!possede) {
    bouton.classList.add('secoue');
    setTimeout(() => bouton.classList.remove('secoue'), 450);
    const message = `Il te faut ${choix.objet_requis} dans ton sac.`;
    toast(message);
    if (ui.lecture) narrateur.direMot(message);
    return;
  }
  vibrer(18);
  narrateur.stop();
  // Coupe la jauge ET son repli : plus aucune validation en attente ne peut
  // se déclencher pendant que l'épreuve est à l'écran.
  annulerValidation();

  const action = { resume: `Il a choisi : « ${choix.texte} »`, epreuve: null };
  if (choix.objet_requis) action.resume += ` en utilisant ${choix.objet_requis}.`;
  // Un choix audacieux sans épreuve se joue quand même : une fois sur deux il
  // coûte quelque chose. Sinon tous les chemins se valent, et l'enfant le sent.
  if (choix.risque && !choix.epreuve_difficulte) {
    action.risque = Math.random() < 0.5 ? 'paye' : 'coute';
  }

  if (choix.epreuve_difficulte) {
    ui.epreuveEnCours = true;
    try {
      ui.etat.derniereEpreuve = ui.etat.chapitre;
      const resultat = await faireEpreuve(choix);
      action.epreuve = { nom: choix.epreuve_nom || 'épreuve', ...resultat };
      if (!resultat.reussi) {
        const secours = encaisserEchec();
        if (secours) action.secours = true;
      } else if (choix.epreuve_difficulte >= 4) {
        ui.etat.etoiles += 1;
        majJauges();
      }
    } finally {
      ui.epreuveEnCours = false;
    }
  }
  demanderChapitre(action);
}

function ouvrirEpreuve(titre) {
  const overlay = $('#overlay-epreuve');
  $('#epreuve-titre').textContent = titre;
  $('#epreuve-resultat').textContent = '';
  $('#epreuve-resultat').className = 'epreuve-resultat';
  vider($('#epreuve-objectif'));
  vider($('#epreuve-zone'));
  $('#btn-lancer-de').hidden = true;
  overlay.hidden = false;
  return overlay;
}

// Annonce parlée dont on peut attendre la fin : enchaîner trop vite coupait la
// voix au milieu du résultat de l'épreuve.
function annoncer(texte) {
  if (!ui.lecture) return Promise.resolve();
  return new Promise((resoudre) => {
    let fini = false;
    const terminer = () => { if (!fini) { fini = true; resoudre(); } };
    setTimeout(terminer, 6000); // filet si la voix ne rend pas la main
    narrateur.direMot(texte, terminer);
  });
}

async function conclureEpreuve(reussi, message, dansCombat = false) {
  const resultat = $('#epreuve-resultat');
  resultat.textContent = message;
  resultat.classList.add(reussi ? 'gagne' : 'rate');
  vibrer(reussi ? 40 : 12);

  // La victoire doit se voir : une fanfare d'emojis au-dessus du résultat.
  const zone = $('#epreuve-zone');
  const fanfare = el('p', {
    class: 'epreuve-fanfare',
    text: reussi ? piocher(['🎉🌟🎉', '👏✨👏', '🏆🎊🏆']) : piocher(['💪😅💪', '🍀🙂🍀']),
  });
  zone.appendChild(fanfare);

  // On laisse la phrase se terminer, et l'écran s'affiche au moins deux secondes.
  const minimum = attendre(animationsReduites ? 900 : 2000);
  await annoncer(reussi ? `Bravo ! ${message}` : `Presque ! ${message}`);
  await minimum;
  if (!dansCombat) $('#overlay-epreuve').hidden = true;
}

// Le dé : on montre noir sur blanc ce qu'il faut faire, et on le dit à voix haute.
function epreuveDe(choix, dansCombat = false) {
  return new Promise((resoudre) => {
    if (!dansCombat) ouvrirEpreuve(`Épreuve : ${choix.epreuve_nom || 'à toi de jouer'}`);
    const zone = $('#epreuve-zone');
    vider(zone);
    $('#epreuve-resultat').textContent = '';
    $('#epreuve-resultat').className = 'epreuve-resultat';

    const bonus = bonusDe(ui.etat);
    const seuil = difficulteEffective(choix.epreuve_difficulte);
    // Ce que l'enfant doit lire sur le dé, bonus déjà déduit : sinon il voit
    // « il faut 3 », fait 2, et gagne quand même.
    const aObtenir = Math.max(1, seuil - bonus);

    // L'objectif est affiché avec le dé, y compris pendant un combat où
    // l'en-tête est occupé par l'adversaire.
    zone.appendChild(el('p', { class: 'epreuve-consigne', text: `Il faut faire ${aObtenir} ou plus.` }));
    const rangee = el('div', { class: 'faces-gagnantes' });
    for (let face = 1; face <= 6; face += 1) {
      rangee.appendChild(el('span', {
        class: `face ${face >= aObtenir ? 'gagnante' : 'perdante'}`,
        html: faceDe(face),
      }));
    }
    zone.appendChild(rangee);
    if (bonus) {
      zone.appendChild(el('p', { class: 'epreuve-bonus', text: `Ton ami t’aide : tu as besoin de ${bonus} de moins 🤝` }));
    }
    const de = el('div', { class: 'de', html: faceDe(6) });
    zone.appendChild(de);
    $('#btn-lancer-de').hidden = false;

    annoncer(`Il faut faire ${aObtenir} ou plus. Lance le dé !`);

    $('#btn-lancer-de').onclick = async () => {
      $('#btn-lancer-de').hidden = true;
      const resultat = lancer(seuil, bonus);
      await animer(de, resultat, animationsReduites);
      const message = resultat.reussi
        ? `Tu as fait ${resultat.de}, il fallait ${aObtenir}. Réussi !`
        : `Tu as fait ${resultat.de}, il fallait ${aObtenir}. Raté de peu !`;
      await conclureEpreuve(resultat.reussi, message, dansCombat);
      resoudre({ ...resultat, nom: choix.epreuve_nom || 'épreuve' });
    };
  });
}

async function epreuveJeu(choix, jeu, dansCombat = false) {
  if (!dansCombat) ouvrirEpreuve(NOMS_JEUX[jeu]);
  const resultat = await jouer(jeu, $('#epreuve-zone'), {
    difficulte: difficulteEffective(choix.epreuve_difficulte),
    narrer: (texte) => annoncer(texte),
    // Les jeux de lecture travaillent sur le texte que l'enfant vient d'entendre.
    texte: (ui.phrasesCourantes || []).filter(Boolean),
  });
  await conclureEpreuve(
    resultat.reussi,
    resultat.reussi ? `Gagné : ${resultat.detail}` : `Raté : ${resultat.detail}`,
    dansCombat,
  );
  return { ...resultat, nom: choix.epreuve_nom || NOMS_JEUX[jeu], jeu };
}

// Une rencontre costaude se joue en plusieurs manches : chaque réussite entame
// le courage de l'adversaire, chaque échec entame celui du héros.
const ACTIONS_COMBAT = [
  { texte: 'Foncer bravement', emoji: '💪', type: 'de', difficulte: 3 },
  { texte: 'Viser juste', emoji: '🎯', type: 'adresse', difficulte: 3 },
  { texte: 'Lui parler', emoji: '💬', type: 'malin', difficulte: 3 },
];

function enteteAdversaire(adversaire) {
  const zone = $('#epreuve-objectif');
  vider(zone);
  zone.appendChild(el('div', { class: 'adversaire' }, [
    el('span', { class: 'adversaire-emoji', text: adversaire.emoji }),
    el('span', {}, [
      el('b', { text: adversaire.nom }),
      el('span', {
        class: 'adversaire-coeurs',
        text: '❤️'.repeat(adversaire.coeurs) + '🤍'.repeat(adversaire.coeursMax - adversaire.coeurs),
      }),
    ]),
  ]));
}

function choisirActionCombat(adversaire) {
  return new Promise((resoudre) => {
    const zone = $('#epreuve-zone');
    vider(zone);
    delete zone.dataset.choisi;
    zone.appendChild(el('p', { class: 'jeu-consigne', text: 'Comment fais-tu ?' }));
    const cartes = [];
    ACTIONS_COMBAT.forEach((action, rang) => {
      const bouton = el('button', { class: `carte-choix choix-${rang + 1}` }, [
        el('span', { class: 'numero', text: String(rang + 1) }),
        el('span', { class: 'emoji', text: action.emoji }),
        el('span', { class: 'libelle', text: action.texte }),
      ]);
      bouton.addEventListener('click', () => {
        if (zone.dataset.choisi) return;
        zone.dataset.choisi = '1';
        narrateur.stop();
        resoudre(action);
      });
      zone.appendChild(bouton);
      cartes.push(bouton);
    });
    // L'enfant ne lit pas : on lui énonce les trois façons de s'en sortir.
    if (ui.lecture) {
      const numeros = ['Un', 'Deux', 'Trois'];
      narrateur.lire(
        ['Comment fais-tu ?', ...ACTIONS_COMBAT.map((a, i) => `${numeros[i]} : ${a.texte}.`)],
        {
          onPhrase: (index) => cartes.forEach((c, i) => c.classList.toggle('enonce', i === index - 1)),
          onFin: () => cartes.forEach((c) => c.classList.remove('enonce')),
        },
      );
    }
  });
}

async function lancerCombat() {
  const adversaire = ui.etat.adversaire;
  if (!adversaire || ui.epreuveEnCours) return;
  ui.epreuveEnCours = true;
  ui.enCours = true;
  ouvrirEpreuve(`${adversaire.nom} te barre la route !`);
  if (ui.lecture) narrateur.direMot(`${adversaire.nom} te barre la route ! Il faudra plusieurs essais.`);

  let manches = 0;
  let secouru = false;
  while (adversaire.coeurs > 0 && ui.etat.coeurs > 0 && manches < 8) {
    manches += 1;
    enteteAdversaire(adversaire);
    const action = await choisirActionCombat(adversaire);
    const faux = { epreuve_nom: action.texte, epreuve_difficulte: action.difficulte };
    let resultat;
    if (action.type === 'de') {
      resultat = await epreuveDe(faux, true);
    } else {
      // En plein combat, on reste sur l'action et la ruse : pas de lecture.
      const jeu = action.type === 'adresse' ? piocher(JEUX_ACTION) : piocher(JEUX_MALINS);
      resultat = await epreuveJeu(faux, jeu, true);
    }
    if (resultat.reussi) {
      adversaire.coeurs -= 1;
      enteteAdversaire(adversaire);
      await attendre(600);
    } else if (encaisserEchec()) {
      secouru = true;
      break;
    }
  }

  $('#overlay-epreuve').hidden = true;
  const gagne = adversaire.coeurs <= 0;
  ui.etat.adversaire = null;
  ui.enCours = false;
  ui.epreuveEnCours = false;
  if (gagne) {
    ui.etat.etoiles += 2;
    majJauges();
  }
  demanderChapitre({
    resume: `Il a affronté ${adversaire.nom}.`,
    combat: {
      nom: adversaire.nom,
      gagne,
      manches,
      detail: gagne ? 'l’enfant a tenu bon' : secouru ? 'le héros était à bout de courage' : 'l’adversaire a résisté',
    },
    secours: secouru,
  });
}

function faireEpreuve(choix) {
  const type = typeEpreuve(ui.reglages.epreuves, ui.reglages.jeuxLecture);
  narrateur.stop();
  return type === 'de' ? epreuveDe(choix) : epreuveJeu(choix, type);
}

// --- Demande d'un chapitre --------------------------------------------------

async function demanderChapitre(action) {
  const etat = ui.etat;
  ui.enCours = true;
  ui.derniereAction = action;
  annulerValidation();
  ui.phrasesAffichees = 0;
  vider($('#texte-histoire'));
  vider($('#choix'));
  $('.zone-histoire').scrollTop = 0;
  $('#erreur').hidden = true;
  $('#chargement').hidden = false;
  $('#chargement-texte').textContent = modeDemo()
    ? 'La suite de l’histoire arrive…'
    : 'La Plume Magique écrit ton histoire…';
  clearTimeout(ui.minuteurAttente);
  ui.minuteurAttente = setTimeout(() => {
    if (ui.enCours) $('#chargement-texte').textContent = 'C’est un peu long… la Plume réfléchit encore.';
  }, 20000);

  const consignes = { ...(action || {}), style: ui.consigneStyle };
  const message = etat.chapitre === 0
    ? premierMessage(etat, etat.idee)
    : messageSuivant(etat, consignes);
  ui.lectureDemarree = false;
  ui.phraseCourante = 0;
  ui.phrasesCourantes = [];
  if (ui.lecture) narrateur.ouvrir(rappelsLecture);

  const surPhrase = (phrase, index) => {
    $('#chargement').hidden = true;
    ajouterPhrase(phrase, index);
    if (ui.lecture) narrateur.enfiler(phrase, index);
  };

  let chapitre;
  try {
    if (modeDemo()) {
      chapitre = chapitreDemo(etat, action);
      await attendre(500);
      for (let i = 0; i < chapitre.texte.length; i += 1) {
        surPhrase(chapitre.texte[i], i);
        await attendre(animationsReduites ? 60 : 420);
      }
    } else {
      ui.requete = new AbortController();
      chapitre = await raconter({
        cle: ui.reglages.cle,
        modele: ui.reglages.modele,
        systeme: SYSTEME,
        messages: messagesPour(etat, message),
        schema: SCHEMA,
        fallback: ui.reglages.fallback,
        signal: ui.requete.signal,
        onTitre: (titre) => {
          if (etat.chapitre === 0 && titre) majTitreHistoire(titre);
        },
        onPhrase: surPhrase,
      });
      // Filet de sécurité : si le flux n'a pas tout donné, on complète.
      (chapitre.texte || []).forEach((phrase, i) => {
        if (i >= ui.phrasesAffichees) surPhrase(phrase, i);
      });
    }
  } catch (erreur) {
    narrateur.stop();
    ui.enCours = false;
    clearTimeout(ui.minuteurAttente);
    if (erreur.name === 'AbortError') { $('#chargement').hidden = true; return; }
    noterErreur('histoire', `${erreur.message} ${erreur.aide || ''}`.trim());
    // Réseau, délai, service occupé : on retente tout seul, deux fois, sans
    // laisser l'enfant devant un écran vide.
    const recuperable = ['reseau', 'delai', 'serveur', 'limite', 'tronque', 'json', 'flux'].includes(erreur.code);
    const essais = (action?.essais || 0) + 1;
    if (recuperable && essais <= 2) {
      $('#chargement-texte').textContent = 'La Plume reprend son souffle…';
      await attendre(700);
      demanderChapitre({ ...(action || {}), essais });
      return;
    }
    $('#chargement').hidden = true;
    afficherErreur(erreur, { ...(action || {}), essais: 0 });
    return;
  } finally {
    ui.requete = null;
  }

  if (ui.lecture) narrateur.fermer();
  clearTimeout(ui.minuteurAttente);
  $('#chargement').hidden = true;
  ui.enCours = false;

  const anomalie = anomalieChapitre(chapitre, etat);
  if (anomalie) {
    noterErreur('chapitre', anomalie);
    if (!action?.correction) {
      // Une seule relance automatique, avec une consigne explicite.
      toast('La Plume s’est emmêlée, elle recommence…');
      demanderChapitre({ ...(action || {}), correction: CORRECTIONS[anomalie] });
      return;
    }
    afficherErreur(
      { message: 'La Plume Magique n’a pas réussi à écrire la suite.', aide: anomalie },
      { ...(action || {}), correction: null },
    );
    return;
  }

  // On mesure ce qui vient d'arriver : si les phrases dérivent, le tour suivant
  // le rappellera au modèle avec des chiffres.
  ui.consigneStyle = consigneStyle(mesurerTexte(chapitre.texte), etat.richesse);

  const bilan = appliquerChapitre(etat, chapitre);
  if (action?.resume) etat.chapitres[etat.chapitres.length - 1].choixFait = action.resume;
  ajouterEchange(etat, message, (chapitre.texte || []).join(' '));
  partie.enregistrer(etat);

  $('#scene').innerHTML = dessinerScene(
    { lieu: chapitre.lieu, moment: chapitre.moment, acteurs: chapitre.acteurs, objets_decor: chapitre.objets_decor },
    `${etat.id}-${etat.chapitre}`,
  );
  majTitreHistoire(etat.titre);
  majJauges();
  ui.combatEnAttente = Boolean(etat.adversaire);
  const litLeTexte = ui.lecture && narrateur.disponible && !etat.termine;
  rendreChoix(chapitre, litLeTexte);
  if (litLeTexte) surveillerLaVoix();

  if (bilan.nouveaux.length) {
    // Mémoire longue : cet objet ne sera plus proposé dans les prochaines parties.
    souvenirs.ajouterObjets(bilan.nouveaux.map((o) => o.nom));
    etat.objetsEvites = objetsDejaVus();
  }
  for (const objet of bilan.nouveaux) {
    toast(`${objet.emoji} ${objet.nom} rejoint ton sac !`);
  }
}

// Un chapitre sans une seule phrase, ou qui prétend finir l'histoire au bout de
// deux pages, est une anomalie : on ne l'applique pas, on redemande.
function anomalieChapitre(chapitre, etat) {
  const phrases = (chapitre.texte || []).filter((p) => String(p).trim());
  if (!phrases.length) return 'chapitre sans texte';
  const sansSuite = !(chapitre.choix || []).length && !chapitre.adversaire_coeurs;
  const tropTot = etat.chapitre + 1 < Math.max(3, Math.round(etat.longueur * 0.5));
  if ((chapitre.fin_titre || sansSuite) && tropTot) return 'fin annoncée beaucoup trop tôt';
  if (sansSuite && !chapitre.fin_titre) return 'chapitre sans choix ni fin';
  return null;
}

const CORRECTIONS = {
  'chapitre sans texte': 'ton chapitre précédent était vide. Écris vraiment le texte du chapitre.',
  'fin annoncée beaucoup trop tôt': 'ne termine surtout pas l’histoire maintenant : elle commence à peine. Continue l’aventure et propose 2 ou 3 choix.',
  'chapitre sans choix ni fin': 'tu n’as proposé aucun choix. Termine le chapitre par 2 ou 3 choix.',
};

function afficherErreur(erreur, action) {
  const boite = $('#erreur');
  vider(boite);
  boite.appendChild(el('h3', { text: '😕 ' + (erreur.message || 'Une erreur est survenue.') }));
  if (erreur.aide) boite.appendChild(el('p', { class: 'aide', text: erreur.aide }));
  const boutons = el('div', { class: 'ligne-boutons' });
  const reessayer = el('button', { class: 'btn btn-primaire', text: '🔁 Réessayer' });
  reessayer.addEventListener('click', () => demanderChapitre(action));
  boutons.appendChild(reessayer);
  const demo = el('button', { class: 'btn', text: '🎲 Continuer en mode démo' });
  demo.addEventListener('click', () => { ui.demo = true; demanderChapitre(action); });
  boutons.appendChild(demo);
  const maison = el('button', { class: 'btn', text: '🏠 Accueil' });
  maison.addEventListener('click', () => { majAccueil(); montrer('accueil'); });
  boutons.appendChild(maison);
  boite.appendChild(boutons);
  boite.hidden = false;
}

// --- Fin, sac, carnet -------------------------------------------------------

// Une fin arrivée trop tôt (ou dont on n'a pas envie) ne doit pas enterrer
// l'aventure : on rouvre l'histoire là où elle s'était arrêtée.
function reprendreApresFin() {
  const etat = ui.etat;
  if (!etat) return;
  etat.termine = false;
  etat.finTitre = '';
  etat.finMessage = '';
  etat.longueur = Math.max(etat.longueur, etat.chapitre + 4);
  partie.enregistrer(etat);
  montrer('jeu');
  demanderChapitre({
    resume: 'Il veut que l’histoire continue.',
    correction: 'l’aventure n’est pas finie : relance-la avec une nouvelle péripétie et 2 ou 3 choix.',
  });
}

function montrerFin() {
  const etat = ui.etat;
  narrateur.stop();
  if (!journal.charger().some((a) => a.id === etat.id)) {
    journal.ajouter({
      id: etat.id, titre: etat.titre, theme: etat.theme, etoiles: etat.etoiles,
      termine: true, chapitres: etat.chapitres, inspiration: etat.inspiration,
    });
  }
  $('#fin-titre').textContent = etat.finTitre || 'Bravo !';
  $('#fin-message').textContent = etat.finMessage || '';
  $('#fin-score').textContent = `⭐ ${etat.etoiles} étoiles · 📖 ${etat.chapitre} chapitres`;
  montrer('fin');
  if (ui.lecture) {
    const suites = ui.reglages.lireInterface
      ? ['Tu peux commencer une autre aventure, continuer celle-ci quand même, ou ouvrir ton carnet.']
      : [];
    narrateur.lire([etat.finTitre || 'Bravo !', etat.finMessage || '', ...suites].filter(Boolean), {});
  }
}

// « Où en est mon histoire ? » — reconstitué localement, sans appel à l'API.
function lignesResume() {
  const etat = ui.etat;
  if (!etat) return [];
  const lignes = [
    ['📖', `${etat.heros.prenom}, tu es au chapitre ${etat.chapitre} sur ${etat.longueur}.`],
  ];
  if (etat.quete) lignes.push(['🎯', `Ta mission : ${etat.quete}.`]);
  if (etat.compagnon) lignes.push(['🤝', `Avec toi : ${etat.compagnon}.`]);
  if (etat.personnages?.length) {
    lignes.push(['👥', `Tu as rencontré ${etat.personnages.map((p) => p.nom).join(', ')}.`]);
  }
  if (etat.sac.length) lignes.push(['🎒', `Dans ton sac : ${etat.sac.map((o) => o.nom).join(', ')}.`]);
  if (etat.memoire) lignes.push(['🕰️', `Ce qui s’est passé : ${etat.memoire}`]);
  const dernier = etat.chapitres[etat.chapitres.length - 1];
  if (dernier?.texte?.length) lignes.push(['↩️', `Et juste avant : ${dernier.texte[dernier.texte.length - 1]}`]);
  return lignes;
}

const phrasesResume = () => lignesResume().map(([, texte]) => texte);

function ouvrirResume() {
  if (!ui.etat) { toast('Commence une aventure d’abord !'); return; }
  const zone = $('#contenu-resume');
  vider(zone);
  for (const [emoji, texte] of lignesResume()) {
    zone.appendChild(el('p', { class: 'resume-ligne' }, [
      el('span', { class: 'resume-emoji', text: emoji }),
      el('span', { text: texte }),
    ]));
  }
  const carte = $('#carte-lieux');
  vider(carte);
  const lieux = (ui.etat.lieux || []).filter((l) => l.nom);
  if (lieux.length > 1 && !ui.etat.termine) {
    carte.appendChild(el('h3', { text: '🗺️ Retourner faire un tour' }));
    const grille = el('div', { class: 'grille-lieux' });
    for (const lieu of lieux.slice().reverse()) {
      const tuile = el('button', { class: 'tuile-lieu' }, [
        el('span', { class: 'vignette-lieu', html: dessinerScene(lieu.decor, `${ui.etat.id}-${lieu.nom}`) }),
        el('span', { class: 'nom-lieu', text: lieu.nom }),
      ]);
      tuile.addEventListener('click', () => {
        narrateur.stop();
        $('#modale-resume').hidden = true;
        demanderChapitre({ resume: `Il veut retourner à ${lieu.nom}.`, balade: true });
      });
      grille.appendChild(tuile);
    }
    carte.appendChild(grille);
  }
  $('#modale-resume').hidden = false;
  narrateur.debloquer();
  if (ui.lecture) narrateur.lire(phrasesResume(), {});
}

function ouvrirSac() {
  const liste = $('#liste-sac');
  vider(liste);
  const sac = ui.etat?.sac || [];
  if (!sac.length) {
    liste.appendChild(el('p', { class: 'sac-vide', text: 'Ton sac est encore vide. Continue l’aventure !' }));
  }
  for (const objet of sac) {
    const carte = el('button', { class: 'objet-sac' }, [
      el('span', { class: 'emoji', text: objet.emoji }),
      el('span', {}, [el('b', { text: objet.nom }), el('small', { text: objet.pouvoir })]),
    ]);
    carte.addEventListener('click', () => narrateur.direMot(`${objet.nom}. ${objet.pouvoir}`));
    liste.appendChild(carte);
  }
  $('#modale-sac').hidden = false;
}

function carteChapitre(aventure, chapitre) {
  const carte = el('li', { class: 'carte-carnet' });
  carte.appendChild(el('div', { class: 'vignette', html: dessinerScene(chapitre.decor, `${aventure.id}-${chapitre.n}`) }));
  const contenu = el('div', { class: 'contenu' }, [
    el('h3', { text: `Chapitre ${chapitre.n}` }),
    el('p', { text: chapitre.texte.join(' ') }),
  ]);
  if (chapitre.choixFait) {
    contenu.appendChild(el('p', { class: 'choix-fait' }, [
      el('span', { class: 'emoji', text: '👉' }),
      el('span', { text: chapitre.choixFait }),
    ]));
  }
  // Une vraie touche, plutôt qu'un bloc de texte cliquable dont rien ne le dit.
  const ecouter = el('button', { class: 'btn-ecouter' }, [
    el('span', { class: 'emoji', text: '🔊' }),
    el('span', { text: 'Écouter ce chapitre' }),
  ]);
  ecouter.addEventListener('click', () => { narrateur.debloquer(); narrateur.lire(chapitre.texte, {}); });
  contenu.appendChild(ecouter);
  carte.appendChild(contenu);
  return carte;
}

function aventuresConnues() {
  const liste = [];
  const courante = ui.etat || partie.charger();
  if (courante && courante.chapitres?.length) liste.push(courante);
  for (const ancienne of journal.charger()) {
    if (!liste.some((a) => a.id === ancienne.id)) liste.push(ancienne);
  }
  return liste;
}

// Le carnet se lit comme un livre : une couverture par aventure, puis les
// chapitres dans l'ordre où ils ont été vécus. Ils étaient affichés à l'envers.
function ouvrirCarnet() {
  const zone = $('#carnet');
  vider(zone);
  const aventures = aventuresConnues();
  if (!aventures.length) {
    zone.appendChild(el('p', { class: 'carnet-vide' }, [
      el('span', { class: 'carnet-vide-emoji', text: '📖' }),
      el('b', { text: 'Ton carnet est vide.' }),
      el('span', { text: 'Chaque aventure terminée viendra se ranger ici.' }),
    ]));
    montrer('carnet');
    return;
  }
  aventures.forEach((aventure, rang) => {
    const bloc = el('details', { class: 'aventure' });
    if (rang === 0) bloc.open = true;
    const theme = THEMES.find((t) => t.nom === aventure.theme || t.id === aventure.themeId);
    const nombre = aventure.chapitres?.length || 0;
    bloc.appendChild(el('summary', {}, [
      el('span', { class: 'couverture', text: theme?.emoji || '📖' }),
      el('span', { class: 'resume-aventure' }, [
        el('b', { text: aventure.titre || aventure.theme }),
        el('small', { text: `⭐ ${aventure.etoiles} · ${nombre} chapitre${nombre > 1 ? 's' : ''}` }),
      ]),
      el('span', {
        class: `etat-aventure ${aventure.termine ? 'finie' : 'encours'}`,
        text: aventure.termine ? '🏆 terminée' : '⏳ en cours',
      }),
    ]));
    const liste = el('ol', { class: 'chapitres' });
    aventure.chapitres.forEach((chapitre) => liste.appendChild(carteChapitre(aventure, chapitre)));
    bloc.appendChild(liste);
    zone.appendChild(bloc);
  });
  montrer('carnet');
}

// --- Réglages ---------------------------------------------------------------

function construireReglages() {
  const modele = $('#champ-modele');
  vider(modele);
  for (const m of MODELES) modele.appendChild(el('option', { value: m.id, text: m.nom }));
  modele.value = ui.reglages.modele;
  $('#champ-longueur').value = String(ui.reglages.longueur);
  $('#champ-richesse').value = ui.reglages.richesse;
  $('#champ-lire-choix').checked = ui.reglages.lireChoix;
  $('#champ-lire-interface').checked = ui.reglages.lireInterface;
  $('#champ-confirmer').checked = ui.reglages.confirmerChoix;
  $('#champ-epreuves').value = ui.reglages.epreuves;
  $('#champ-jeux-lecture').checked = ui.reglages.jeuxLecture;
  $('#champ-douceur').value = ui.reglages.douceur;
  $('#champ-fournisseur').value = ui.reglages.fournisseurVoix;
  $('#champ-cle-google').value = ui.reglages.cleGoogle;
  majBlocsVoix();
  noterVoixGoogle();
  $('#champ-cle').value = ui.reglages.cle;
  $('#version-app').textContent = `Le Livre Magique ${APP.version}`;
  const journalErreurs = $('#journal-erreurs');
  journalErreurs.textContent = JOURNAL_ERREURS.length
    ? JOURNAL_ERREURS.join('\n')
    : 'Aucun incident depuis l’ouverture de l’application.';
  $('#champ-vitesse').value = ui.reglages.vitesse;
  $('#valeur-vitesse').textContent = ui.reglages.vitesse;
  $('#champ-lecture-auto').checked = ui.reglages.lectureAuto;
  $('#champ-mot-par-mot').checked = ui.reglages.motParMot;
  $('#champ-taille').value = String(ui.reglages.tailleTexte);
  construireVoix();
}

// Certaines familles de voix (Chirp 3 HD, Journey) ignorent le réglage de vitesse.
function noterVoixGoogle() {
  const note = $('#note-voix-google');
  if (!note) return;
  const voix = ui.reglages.voixGoogle;
  const reglable = narrateur.voixReglable(voix);
  note.textContent = reglable
    ? ''
    : 'Cette voix est très naturelle mais ne permet pas de régler la vitesse.';
  note.hidden = reglable;
}

function majBlocsVoix() {
  const google = ui.reglages.fournisseurVoix === 'google';
  $('#bloc-google').hidden = !google;
  $('#bloc-navigateur').hidden = google;
  const select = $('#champ-voix-google');
  if (google && !select.options.length && ui.reglages.voixGoogle) {
    select.appendChild(el('option', { value: ui.reglages.voixGoogle, text: ui.reglages.voixGoogle }));
    select.value = ui.reglages.voixGoogle;
  }
}

async function chargerVoixGoogle() {
  const statut = $('#statut-google');
  const cle = $('#champ-cle-google').value.trim();
  enregistrerReglage('cleGoogle', cle);
  statut.textContent = 'Chargement…';
  statut.className = 'statut';
  try {
    const voix = await narrateur.listerVoixGoogle(cle);
    const select = $('#champ-voix-google');
    vider(select);
    // Regroupées par famille, les conseillées d'abord, avec l'ordre de coût.
    const familles = new Map();
    for (const v of voix) {
      const famille = familleVoix(v.nom);
      if (!familles.has(famille.nom)) familles.set(famille.nom, { famille, voix: [] });
      familles.get(famille.nom).voix.push(v);
    }
    const triees = [...familles.values()].sort((a, b) => a.famille.rang - b.famille.rang);
    for (const { famille, voix: liste } of triees) {
      const groupe = el('optgroup', {
        label: `${famille.conseillee ? '⭐ ' : ''}${famille.nom} — ${famille.cout}${famille.note ? ` · ${famille.note}` : ''}`,
      });
      for (const v of liste) {
        const genre = v.genre === 'FEMALE' ? 'femme' : v.genre === 'MALE' ? 'homme' : 'neutre';
        groupe.appendChild(el('option', { value: v.nom, text: `${v.nom} (${genre})` }));
      }
      select.appendChild(groupe);
    }
    const conseillee = triees[0]?.voix[0]?.nom || voix[0]?.nom || '';
    select.value = voix.some((v) => v.nom === ui.reglages.voixGoogle) ? ui.reglages.voixGoogle : conseillee;
    enregistrerReglage('voixGoogle', select.value);
    noterVoixGoogle();
    statut.textContent = `✅ ${voix.length} voix françaises. Les ⭐ sont le meilleur compromis qualité / prix ; essaie-les avec le bouton plus bas.`;
    statut.className = 'statut ok';
  } catch (erreur) {
    statut.textContent = `❌ ${erreur.message}`;
    statut.className = 'statut ko';
  }
}

function construireVoix() {
  const select = $('#champ-voix');
  vider(select);
  const voix = narrateur.chargerVoix();
  if (!voix.length) {
    select.appendChild(el('option', { value: '', text: 'Voix par défaut de l’appareil' }));
    return;
  }
  select.appendChild(el('option', { value: '', text: 'Voix automatique' }));
  for (const v of voix) select.appendChild(el('option', { value: v.voiceURI, text: `${v.name} (${v.lang})` }));
  select.value = ui.reglages.voix || '';
}

function enregistrerReglage(champ, valeur) {
  ui.reglages[champ] = valeur;
  storeReglages.enregistrer({ [champ]: valeur });
  appliquerReglages();
}

function ouvrirReglages() {
  construireReglages();
  const verrouille = ui.reglages.portailParental;
  $('#portail').hidden = !verrouille;
  $('#reglages').hidden = verrouille;
  if (verrouille) {
    const a = 3 + Math.floor(Math.random() * 6);
    const b = 4 + Math.floor(Math.random() * 6);
    $('#portail-question').textContent = `Combien font ${a} × ${b} ?`;
    $('#portail-question').dataset.reponse = String(a * b);
    $('#portail-reponse').value = '';
  }
  montrer('reglages');
}

// --- Branchements -----------------------------------------------------------

function brancher() {
  document.querySelectorAll('[data-retour]').forEach((bouton) => {
    bouton.addEventListener('click', () => {
      const cible = bouton.dataset.retour;
      if (cible === 'accueil') majAccueil();
      montrer(cible);
      if (cible === 'accueil') appliquerMaj();
    });
  });

  $('#btn-nouvelle').addEventListener('click', () => { narrateur.debloquer(); montrer('theme'); });
  $('#btn-continuer').addEventListener('click', reprendre);
  $('#btn-carnet').addEventListener('click', ouvrirCarnet);
  $('#btn-reglages').addEventListener('click', ouvrirReglages);
  $('#btn-demarrer').addEventListener('click', demarrer);
  $('#champ-prenom').addEventListener('keydown', (e) => { if (e.key === 'Enter') demarrer(); });

  $('#btn-maison').addEventListener('click', () => {
    if (ui.requete) ui.requete.abort();
    narrateur.stop();
    majAccueil();
    montrer('accueil');
    appliquerMaj();
  });
  $('#btn-outils').addEventListener('click', (e) => { e.stopPropagation(); menuOutils(); });
  document.addEventListener('click', (e) => {
    if ($('#menu-outils').hidden) return;
    if (e.target.closest('#menu-outils') || e.target.closest('#btn-outils')) return;
    menuOutils(false);
  });
  $('#btn-sac').addEventListener('click', ouvrirSac);
  $('#btn-resume').addEventListener('click', () => { menuOutils(false); ouvrirResume(); });
  $('#btn-fermer-resume').addEventListener('click', () => { narrateur.stop(); $('#modale-resume').hidden = true; });
  $('#btn-ecouter-resume').addEventListener('click', () => {
    narrateur.debloquer();
    narrateur.lire(phrasesResume(), {});
  });
  $('#modale-resume').addEventListener('click', (e) => {
    if (e.target.id === 'modale-resume') { narrateur.stop(); $('#modale-resume').hidden = true; }
  });
  // Un défilement du doigt ne doit pas être pris pour un appui sur un mot.
  const zoneTexte = $('.zone-histoire');
  zoneTexte.addEventListener('touchstart', () => { ui.doigtGlisse = false; }, { passive: true });
  zoneTexte.addEventListener('touchmove', () => { ui.doigtGlisse = true; }, { passive: true });

  $('#btn-passer').addEventListener('click', () => {
    narrateur.stop();
    revelerChoix();
  });
  $('#btn-texte').addEventListener('click', () => {
    textePlein();
    if ($('#ecran-jeu').classList.contains('texte-plein')) $('.zone-histoire').scrollTop = 0;
  });
  $('#btn-fermer-sac').addEventListener('click', () => { $('#modale-sac').hidden = true; });
  $('#modale-sac').addEventListener('click', (e) => { if (e.target.id === 'modale-sac') $('#modale-sac').hidden = true; });

  $('#btn-son').addEventListener('click', () => {
    ui.lecture = !ui.lecture;
    majBoutonSon();
    menuOutils(false);
    if (!ui.lecture) narrateur.stop();
    else narrateur.debloquer();
  });

  $('#btn-relire').addEventListener('click', () => {
    const chapitre = ui.etat?.dernier;
    if (!chapitre) return;
    ui.lecture = true;
    majBoutonSon();
    narrateur.debloquer();
    majBoutonPause();
    narrateur.lire(chapitre.texte || [], rappelsLecture);
  });

  $('#btn-pause').addEventListener('click', () => {
    if (narrateur.enPause) narrateur.reprendre();
    else narrateur.pause();
    majBoutonPause();
  });

  $('#btn-rejouer').addEventListener('click', () => { partie.effacer(); majAccueil(); montrer('theme'); });
  $('#btn-fin-suite').addEventListener('click', reprendreApresFin);
  $('#btn-fin-carnet').addEventListener('click', ouvrirCarnet);

  // Réglages
  $('#portail-valider').addEventListener('click', () => {
    if ($('#portail-reponse').value.trim() === $('#portail-question').dataset.reponse) {
      $('#portail').hidden = true;
      $('#reglages').hidden = false;
    } else {
      toast('Mauvaise réponse, réessaie.');
    }
  });
  $('#champ-cle').addEventListener('change', (e) => { enregistrerReglage('cle', e.target.value.trim()); majAccueil(); });
  $('#btn-voir-cle').addEventListener('click', () => {
    const champ = $('#champ-cle');
    champ.type = champ.type === 'password' ? 'text' : 'password';
  });
  $('#btn-tester-cle').addEventListener('click', async () => {
    const statut = $('#statut-cle');
    const cle = $('#champ-cle').value.trim();
    enregistrerReglage('cle', cle);
    statut.textContent = 'Test en cours…';
    statut.className = 'statut';
    try {
      await tester(cle, ui.reglages.modele);
      statut.textContent = '✅ La clé fonctionne !';
      statut.className = 'statut ok';
      majAccueil();
    } catch (erreur) {
      statut.textContent = `❌ ${erreur.message} ${erreur.aide || ''}`;
      statut.className = 'statut ko';
    }
  });
  $('#champ-modele').addEventListener('change', (e) => enregistrerReglage('modele', e.target.value));
  $('#champ-richesse').addEventListener('change', (e) => enregistrerReglage('richesse', e.target.value));
  $('#champ-lire-choix').addEventListener('change', (e) => enregistrerReglage('lireChoix', e.target.checked));
  $('#champ-lire-interface').addEventListener('change', (e) => enregistrerReglage('lireInterface', e.target.checked));
  $('#champ-confirmer').addEventListener('change', (e) => enregistrerReglage('confirmerChoix', e.target.checked));
  $('#champ-epreuves').addEventListener('change', (e) => enregistrerReglage('epreuves', e.target.value));
  $('#champ-jeux-lecture').addEventListener('change', (e) => enregistrerReglage('jeuxLecture', e.target.checked));
  $('#champ-douceur').addEventListener('change', (e) => enregistrerReglage('douceur', e.target.value));
  $('#champ-fournisseur').addEventListener('change', (e) => {
    enregistrerReglage('fournisseurVoix', e.target.value);
    ui.voixSignalee = false;
    majBlocsVoix();
  });
  $('#champ-cle-google').addEventListener('change', (e) => { enregistrerReglage('cleGoogle', e.target.value.trim()); ui.voixSignalee = false; });
  $('#btn-voir-cle-google').addEventListener('click', () => {
    const champ = $('#champ-cle-google');
    champ.type = champ.type === 'password' ? 'text' : 'password';
  });
  $('#btn-charger-voix-google').addEventListener('click', chargerVoixGoogle);
  $('#champ-voix-google').addEventListener('change', (e) => {
    enregistrerReglage('voixGoogle', e.target.value);
    ui.voixSignalee = false;
    noterVoixGoogle();
  });
  $('#champ-longueur').addEventListener('change', (e) => enregistrerReglage('longueur', Number(e.target.value)));
  $('#champ-voix').addEventListener('change', (e) => enregistrerReglage('voix', e.target.value));
  $('#champ-vitesse').addEventListener('input', (e) => {
    $('#valeur-vitesse').textContent = e.target.value;
    enregistrerReglage('vitesse', Number(e.target.value));
  });
  $('#champ-lecture-auto').addEventListener('change', (e) => enregistrerReglage('lectureAuto', e.target.checked));
  $('#champ-mot-par-mot').addEventListener('change', (e) => enregistrerReglage('motParMot', e.target.checked));
  $('#champ-taille').addEventListener('change', (e) => enregistrerReglage('tailleTexte', Number(e.target.value)));
  $('#btn-essai-voix').addEventListener('click', () => {
    ui.voixSignalee = false;
    narrateur.debloquer();
    narrateur.lire(
      ['Bonjour ! Je vais te raconter une histoire magique.', 'Écoute bien, et choisis la suite.'],
      { onErreur: (m) => toast(`Voix Google indisponible : ${m}`) },
    );
  });
  $('#btn-effacer-partie').addEventListener('click', () => {
    partie.effacer();
    ui.etat = null;
    majAccueil();
    toast('Aventure effacée.');
  });
  $('#btn-effacer-tout').addEventListener('click', () => {
    if (!window.confirm('Tout effacer, y compris la clé API ?')) return;
    Object.keys(localStorage)
      .filter((k) => k.startsWith('livre-magique:'))
      .forEach((k) => localStorage.removeItem(k));
    ui.reglages = storeReglages.charger();
    ui.etat = null;
    souvenirs.effacer();
    appliquerReglages();
    construireReglages();
    majAccueil();
    toast('Tout est effacé.');
  });

  // Installation PWA
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    ui.installPrompt = e;
    $('#btn-installer').hidden = false;
  });
  $('#btn-installer').addEventListener('click', async () => {
    if (!ui.installPrompt) return;
    ui.installPrompt.prompt();
    ui.installPrompt = null;
    $('#btn-installer').hidden = true;
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { narrateur.pause(); return; }
    // Le verrou d'écran est perdu dès que l'application passe en arrière-plan.
    if (ui.ecran === 'jeu') garderEcranAllume();
  });
  window.speechSynthesis?.addEventListener?.('voiceschanged', construireVoix);
}

// --- Démarrage --------------------------------------------------------------

function init() {
  ui.lecture = ui.reglages.lectureAuto;
  majBoutonSon();
  const heros = storeHeros.charger();
  $('#champ-prenom').value = heros.prenom || '';
  appliquerReglages();
  construireThemes();
  construireAvatars();
  brancher();
  majAccueil();

  window.addEventListener('error', (e) => signalerPepin(e.message));
  window.addEventListener('unhandledrejection', (e) => {
    const raison = e.reason;
    if (raison?.name === 'AbortError') return;
    signalerPepin(raison?.message || String(raison));
  });
  surveillerMisesAJour();
}

// Une nouvelle version publiée est appliquée dès qu'on revient à l'accueil,
// pour ne jamais couper une histoire en cours.
function surveillerMisesAJour() {
  if (!('serviceWorker' in navigator)) return;
  let dejaControle = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!dejaControle) { dejaControle = true; return; }
    ui.majEnAttente = true;
    appliquerMaj();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((enregistrement) => enregistrement.update())
      .catch(() => { /* hors ligne indisponible */ });
  });
}

export function appliquerMaj() {
  if (!ui.majEnAttente || ui.rechargement) return;
  const accueil = $('#ecran-accueil').classList.contains('actif');
  if (!accueil && ui.etat && !ui.etat.termine) {
    toast('Nouvelle version prête : elle s’installera en revenant à l’accueil.');
    return;
  }
  ui.rechargement = true;
  window.location.reload();
}

init();
