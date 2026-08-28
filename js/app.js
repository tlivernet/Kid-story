// Le Livre Magique — orchestration des écrans et du jeu.
import { THEMES, AVATARS, MODELES } from './config.js';
import { $, el, vider, decouperMots, vibrer, attendre } from './util.js';
import { reglages as storeReglages, partie, journal, heros as storeHeros } from './storage.js';
import { SYSTEME, SCHEMA, premierMessage, messageSuivant } from './prompt.js';
import { raconter, tester } from './api.js';
import { dessinerScene } from './scene.js';
import { conteur } from './tts.js';
import { lancer, animer, bonusDe, faceDe } from './dice.js';
import { nouvelEtat, appliquerChapitre, ajouterEchange, messagesPour } from './state.js';
import { chapitreDemo } from './demo.js';

const ui = {
  reglages: storeReglages.charger(),
  etat: null,
  theme: null,
  avatar: storeHeros.charger().avatar || '🦸',
  lecture: true,
  demo: false,
  enCours: false,
  requete: null,
  phrasesAffichees: 0,
  installPrompt: null,
};

const animationsReduites = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- Utilitaires d'interface ------------------------------------------------

function montrer(nom) {
  if (nom !== 'jeu') conteur.stop();
  document.querySelectorAll('.ecran').forEach((e) => e.classList.remove('actif'));
  $(`#ecran-${nom}`).classList.add('actif');
  $(`#ecran-${nom}`).scrollTop = 0;
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
  conteur.configurer({ voix: ui.reglages.voix, vitesse: ui.reglages.vitesse });
}

// --- Accueil ----------------------------------------------------------------

function majAccueil() {
  const sauvegarde = partie.charger();
  const bouton = $('#btn-continuer');
  if (sauvegarde && !sauvegarde.termine && sauvegarde.chapitre > 0) {
    bouton.hidden = false;
    $('#btn-continuer .btn-label').textContent = `Continuer : ${sauvegarde.titre || sauvegarde.theme}`;
  } else {
    bouton.hidden = true;
  }
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
  const cartes = [...THEMES, { id: 'surprise', nom: 'Surprise !', emoji: '🎲' }, { id: 'idee', nom: 'Mon idée', emoji: '✏️' }];
  for (const theme of cartes) {
    const carte = el('button', { class: 'carte-theme' }, [
      el('span', { class: 'emoji', text: theme.emoji }),
      el('span', { text: theme.nom }),
    ]);
    carte.addEventListener('click', () => {
      let choisi = theme;
      if (theme.id === 'surprise') choisi = THEMES[Math.floor(Math.random() * THEMES.length)];
      ui.theme = choisi;
      $('#bloc-idee').hidden = theme.id !== 'idee';
      montrer('heros');
      $('#champ-prenom').focus();
    });
    grille.appendChild(carte);
  }
}

function construireAvatars() {
  const grille = $('#grille-avatars');
  vider(grille);
  for (const emoji of AVATARS) {
    const bouton = el('button', { class: `avatar${emoji === ui.avatar ? ' choisi' : ''}`, text: emoji });
    bouton.addEventListener('click', () => {
      ui.avatar = emoji;
      grille.querySelectorAll('.avatar').forEach((a) => a.classList.toggle('choisi', a.textContent === emoji));
      vibrer();
    });
    grille.appendChild(bouton);
  }
}

// --- Démarrage d'une aventure ----------------------------------------------

function demarrer() {
  const prenom = $('#champ-prenom').value.trim() || 'Héros';
  const idee = $('#champ-idee').value.trim();
  const heros = { prenom, avatar: ui.avatar };
  storeHeros.enregistrer(heros);

  const theme = ui.theme && ui.theme.id !== 'idee' ? ui.theme : { id: 'idee', nom: idee || 'une histoire surprise' };
  ui.etat = nouvelEtat({
    heros,
    theme: theme.nom,
    themeId: theme.id === 'idee' ? THEMES[Math.floor(Math.random() * THEMES.length)].id : theme.id,
    longueur: Number(ui.reglages.longueur) || 12,
    idee,
  });
  ui.demo = false;
  conteur.debloquer();
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
  conteur.debloquer();
  montrer('jeu');
  majJauges();
  if (sauvegarde.dernier) rendreChapitre(sauvegarde.dernier, false);
  else demanderChapitre(null);
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
        conteur.direMot(morceau.mot || morceau.brut);
        vibrer(8);
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
  zone.appendChild(elementPhrase(texte, index));
  ui.phrasesAffichees = Math.max(ui.phrasesAffichees, index + 1);
}

const rappelsLecture = {
  onPhrase: (index) => {
    document.querySelectorAll('.phrase').forEach((p) => {
      const active = Number(p.dataset.index) === index;
      p.classList.toggle('lue', active);
      if (active) p.scrollIntoView({ block: 'nearest' });
    });
  },
  onMot: (index, debut) => {
    if (!ui.reglages.motParMot) return;
    const phrase = $(`.phrase[data-index="${index}"]`);
    if (!phrase) return;
    phrase.querySelectorAll('.mot').forEach((m) => {
      const d = Number(m.dataset.debut);
      const f = Number(m.dataset.fin);
      m.classList.toggle('actif', debut >= d && debut < f);
    });
  },
  onFin: () => {
    document.querySelectorAll('.phrase').forEach((p) => p.classList.remove('lue'));
    document.querySelectorAll('.mot.actif').forEach((m) => m.classList.remove('actif'));
  },
};

function rendreChapitre(chapitre, anime = true) {
  const zone = $('#texte-histoire');
  vider(zone);
  ui.phrasesAffichees = 0;
  (chapitre.texte || []).forEach((phrase, i) => ajouterPhrase(phrase, i));
  $('#scene').innerHTML = dessinerScene(
    { lieu: chapitre.lieu, moment: chapitre.moment, acteurs: chapitre.acteurs, objets_decor: chapitre.objets_decor },
    `${ui.etat.id}-${ui.etat.chapitre}`,
  );
  if (ui.etat.titre) {
    $('#titre-histoire').textContent = ui.etat.titre;
    $('#titre-histoire').hidden = false;
  }
  rendreChoix(chapitre);
  majJauges();
  if (anime && ui.lecture) {
    conteur.lire(chapitre.texte || [], rappelsLecture);
  }
}

function majJauges() {
  const etat = ui.etat;
  if (!etat) return;
  $('#coeurs').textContent = '❤️'.repeat(etat.coeurs) + '🤍'.repeat(Math.max(0, 3 - etat.coeurs));
  $('#etoiles').textContent = `⭐ ${etat.etoiles}`;
  const pastille = $('#pastille-sac');
  pastille.textContent = etat.sac.length;
  pastille.hidden = etat.sac.length === 0;
}

// --- Choix ------------------------------------------------------------------

function rendreChoix(chapitre) {
  const zone = $('#choix');
  vider(zone);
  if (ui.etat.termine) {
    const bouton = el('button', { class: 'carte-choix' }, [
      el('span', { class: 'emoji', text: '🏆' }),
      el('span', { class: 'libelle', text: 'Voir la fin de l’histoire' }),
    ]);
    bouton.addEventListener('click', montrerFin);
    zone.appendChild(bouton);
    return;
  }
  for (const choix of chapitre.choix || []) {
    const possede = !choix.objet_requis
      || ui.etat.sac.some((o) => o.nom.toLowerCase() === String(choix.objet_requis).toLowerCase());
    const classes = ['carte-choix'];
    if (choix.epreuve_difficulte) classes.push('epreuve');
    if (!possede) classes.push('bloque');
    const bouton = el('button', { class: classes.join(' ') }, [
      el('span', { class: 'emoji', text: choix.emoji || '👉' }),
      el('span', { class: 'libelle', text: choix.texte }),
    ]);
    if (choix.objet_requis) bouton.appendChild(el('span', { class: 'badge', text: `🎒 ${choix.objet_requis}` }));
    else if (choix.epreuve_difficulte) bouton.appendChild(el('span', { class: 'badge', text: '🎲' }));
    bouton.addEventListener('click', () => choisir(choix, possede, bouton));
    zone.appendChild(bouton);
  }
}

async function choisir(choix, possede, bouton) {
  if (ui.enCours) return;
  conteur.debloquer();
  if (!possede) {
    bouton.classList.add('secoue');
    setTimeout(() => bouton.classList.remove('secoue'), 450);
    const message = `Il te faut ${choix.objet_requis} dans ton sac.`;
    toast(message);
    if (ui.lecture) conteur.direMot(message);
    return;
  }
  vibrer(18);
  conteur.stop();

  const action = { resume: `Il a choisi : « ${choix.texte} »`, epreuve: null };
  if (choix.objet_requis) action.resume += ` en utilisant ${choix.objet_requis}.`;

  if (choix.epreuve_difficulte) {
    const resultat = await faireEpreuve(choix);
    action.epreuve = { nom: choix.epreuve_nom || 'épreuve', ...resultat };
  }
  demanderChapitre(action);
}

function faireEpreuve(choix) {
  return new Promise((resolve) => {
    const overlay = $('#overlay-de');
    const bouton = $('#btn-lancer-de');
    const resultatEl = $('#de-resultat');
    $('#de-titre').textContent = `Épreuve : ${choix.epreuve_nom || 'à toi de jouer'} !`;
    resultatEl.textContent = '';
    resultatEl.className = 'de-resultat';
    $('#de').innerHTML = faceDe(6);
    bouton.hidden = false;
    overlay.hidden = false;

    bouton.onclick = async () => {
      bouton.hidden = true;
      const bonus = bonusDe(ui.etat);
      const resultat = lancer(choix.epreuve_difficulte, bonus);
      await animer($('#de'), resultat, animationsReduites);
      const detail = `${resultat.de}${bonus ? ` + ${bonus}` : ''} contre ${resultat.difficulte}`;
      resultatEl.textContent = resultat.reussi ? `Réussi ! ${detail}` : `Presque ! ${detail}`;
      resultatEl.classList.add(resultat.reussi ? 'gagne' : 'rate');
      if (ui.lecture) conteur.direMot(resultat.reussi ? 'Bravo, tu as réussi !' : 'Presque ! Ce n’est pas grave.');
      vibrer(resultat.reussi ? 40 : 12);
      await attendre(animationsReduites ? 700 : 1600);
      overlay.hidden = true;
      resolve(resultat);
    };
  });
}

// --- Demande d'un chapitre --------------------------------------------------

async function demanderChapitre(action) {
  const etat = ui.etat;
  ui.enCours = true;
  ui.phrasesAffichees = 0;
  vider($('#texte-histoire'));
  vider($('#choix'));
  $('.zone-histoire').scrollTop = 0;
  $('#erreur').hidden = true;
  $('#chargement').hidden = false;
  $('#chargement-texte').textContent = modeDemo()
    ? 'La suite de l’histoire arrive…'
    : 'La Plume Magique écrit ton histoire…';

  const message = etat.chapitre === 0 ? premierMessage(etat, etat.idee) : messageSuivant(etat, action);
  if (ui.lecture) conteur.ouvrir(rappelsLecture);

  const surPhrase = (phrase, index) => {
    $('#chargement').hidden = true;
    ajouterPhrase(phrase, index);
    if (ui.lecture) conteur.enfiler(phrase, index);
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
          if (etat.chapitre === 0 && titre) {
            $('#titre-histoire').textContent = titre;
            $('#titre-histoire').hidden = false;
          }
        },
        onPhrase: surPhrase,
      });
      // Filet de sécurité : si le flux n'a pas tout donné, on complète.
      (chapitre.texte || []).forEach((phrase, i) => {
        if (i >= ui.phrasesAffichees) surPhrase(phrase, i);
      });
    }
  } catch (erreur) {
    conteur.stop();
    if (erreur.name !== 'AbortError') afficherErreur(erreur, action);
    ui.enCours = false;
    $('#chargement').hidden = true;
    return;
  } finally {
    ui.requete = null;
  }

  if (ui.lecture) conteur.fermer();
  $('#chargement').hidden = true;
  ui.enCours = false;

  const bilan = appliquerChapitre(etat, chapitre);
  ajouterEchange(etat, message, (chapitre.texte || []).join(' '));
  partie.enregistrer(etat);

  $('#scene').innerHTML = dessinerScene(
    { lieu: chapitre.lieu, moment: chapitre.moment, acteurs: chapitre.acteurs, objets_decor: chapitre.objets_decor },
    `${etat.id}-${etat.chapitre}`,
  );
  if (etat.titre) {
    $('#titre-histoire').textContent = etat.titre;
    $('#titre-histoire').hidden = false;
  }
  majJauges();
  rendreChoix(chapitre);

  for (const objet of bilan.nouveaux) {
    toast(`${objet.emoji} ${objet.nom} rejoint ton sac !`);
  }
}

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
  boite.appendChild(boutons);
  boite.hidden = false;
}

// --- Fin, sac, carnet -------------------------------------------------------

function montrerFin() {
  const etat = ui.etat;
  conteur.stop();
  if (!journal.charger().some((a) => a.id === etat.id)) {
    journal.ajouter({
      id: etat.id, titre: etat.titre, theme: etat.theme, etoiles: etat.etoiles,
      termine: true, chapitres: etat.chapitres,
    });
  }
  $('#fin-titre').textContent = etat.finTitre || 'Bravo !';
  $('#fin-message').textContent = etat.finMessage || '';
  $('#fin-score').textContent = `⭐ ${etat.etoiles} étoiles · 📖 ${etat.chapitre} chapitres`;
  montrer('fin');
  if (ui.lecture) conteur.lire([etat.finTitre || 'Bravo !', etat.finMessage || ''].filter(Boolean), {});
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
    carte.addEventListener('click', () => conteur.direMot(`${objet.nom}. ${objet.pouvoir}`));
    liste.appendChild(carte);
  }
  $('#modale-sac').hidden = false;
}

function carteChapitre(aventure, chapitre) {
  const carte = el('article', { class: 'carte-carnet' });
  carte.appendChild(el('div', { class: 'vignette', html: dessinerScene(chapitre.decor, `${aventure.id}-${chapitre.n}`) }));
  const contenu = el('div', { class: 'contenu' }, [
    el('h3', { text: `Chapitre ${chapitre.n}` }),
    el('p', { text: chapitre.texte.join(' ') }),
  ]);
  contenu.addEventListener('click', () => { conteur.debloquer(); conteur.lire(chapitre.texte, {}); });
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

function ouvrirCarnet() {
  const zone = $('#carnet');
  vider(zone);
  const aventures = aventuresConnues();
  if (!aventures.length) {
    zone.appendChild(el('p', { class: 'carnet-vide', text: 'Ton carnet est vide. Commence une aventure !' }));
    montrer('carnet');
    return;
  }
  aventures.forEach((aventure, rang) => {
    const bloc = el('details', { class: 'aventure' });
    if (rang === 0) bloc.open = true;
    const etat = aventure.termine ? '🏆 terminée' : '⏳ en cours';
    bloc.appendChild(el('summary', {
      text: `${aventure.titre || aventure.theme} — ⭐ ${aventure.etoiles} · ${etat}`,
    }));
    aventure.chapitres.slice().reverse().forEach((chapitre) => bloc.appendChild(carteChapitre(aventure, chapitre)));
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
  $('#champ-cle').value = ui.reglages.cle;
  $('#champ-vitesse').value = ui.reglages.vitesse;
  $('#valeur-vitesse').textContent = ui.reglages.vitesse;
  $('#champ-lecture-auto').checked = ui.reglages.lectureAuto;
  $('#champ-mot-par-mot').checked = ui.reglages.motParMot;
  $('#champ-taille').value = String(ui.reglages.tailleTexte);
  construireVoix();
}

function construireVoix() {
  const select = $('#champ-voix');
  vider(select);
  const voix = conteur.chargerVoix();
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
    });
  });

  $('#btn-nouvelle').addEventListener('click', () => { conteur.debloquer(); montrer('theme'); });
  $('#btn-continuer').addEventListener('click', reprendre);
  $('#btn-carnet').addEventListener('click', ouvrirCarnet);
  $('#btn-reglages').addEventListener('click', ouvrirReglages);
  $('#btn-demarrer').addEventListener('click', demarrer);
  $('#champ-prenom').addEventListener('keydown', (e) => { if (e.key === 'Enter') demarrer(); });

  $('#btn-maison').addEventListener('click', () => {
    if (ui.requete) ui.requete.abort();
    conteur.stop();
    majAccueil();
    montrer('accueil');
  });
  $('#btn-sac').addEventListener('click', ouvrirSac);
  $('#btn-fermer-sac').addEventListener('click', () => { $('#modale-sac').hidden = true; });
  $('#modale-sac').addEventListener('click', (e) => { if (e.target.id === 'modale-sac') $('#modale-sac').hidden = true; });

  $('#btn-son').addEventListener('click', () => {
    ui.lecture = !ui.lecture;
    $('#btn-son').textContent = ui.lecture ? '🔊' : '🔇';
    $('#btn-son').classList.toggle('muet', !ui.lecture);
    if (!ui.lecture) conteur.stop();
    else conteur.debloquer();
  });

  $('#btn-relire').addEventListener('click', () => {
    const chapitre = ui.etat?.dernier;
    if (!chapitre) return;
    ui.lecture = true;
    $('#btn-son').textContent = '🔊';
    $('#btn-son').classList.remove('muet');
    conteur.debloquer();
    conteur.lire(chapitre.texte || [], rappelsLecture);
  });

  $('#btn-pause').addEventListener('click', () => {
    if (conteur.enPause) { conteur.reprendre(); $('#btn-pause').textContent = '⏸️'; }
    else { conteur.pause(); $('#btn-pause').textContent = '▶️'; }
  });

  $('#btn-rejouer').addEventListener('click', () => { partie.effacer(); majAccueil(); montrer('theme'); });
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
    conteur.debloquer();
    conteur.lire(['Bonjour ! Je vais te raconter une histoire magique.'], {});
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

  document.addEventListener('visibilitychange', () => { if (document.hidden) conteur.pause(); });
  window.speechSynthesis?.addEventListener?.('voiceschanged', construireVoix);
}

// --- Démarrage --------------------------------------------------------------

function init() {
  ui.lecture = ui.reglages.lectureAuto;
  $('#btn-son').textContent = ui.lecture ? '🔊' : '🔇';
  $('#btn-son').classList.toggle('muet', !ui.lecture);
  const heros = storeHeros.charger();
  $('#champ-prenom').value = heros.prenom || '';
  appliquerReglages();
  construireThemes();
  construireAvatars();
  brancher();
  majAccueil();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => { /* hors ligne indisponible */ });
    });
  }
}

init();
