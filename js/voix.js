// Narrateur unifié : voix du navigateur (gratuite) ou voix de synthèse Google Cloud
// (bien plus jolie). Même interface dans les deux cas, bascule automatique en cas de panne.
import { conteur } from './tts.js';
import { decouperMots, texteParle, ssmlAvecReperes, poidsMot } from './util.js';

const URL_GOOGLE = 'https://texttospeech.googleapis.com/v1';
const SILENCE = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQxAADB8AhSmxhIIEVCSiJrDCQBTcu3UrAIwUdkRgQbFAZC1CQEwTJ9mjRvBA4UOLD8nKVOWfh+UlK3z/177OXrfOdKl7pyn3Xf//WreyTRUoAWgBgkOAGbZHBgG1OF6zM82DWbZaUmMBptgQhGjsyYqc9ae9XFz280948NMBWInljyzsNRFLPWdnZGWrddDsjK1unuSrVN9jJsK8KuQtQCtMBjCEtImISdNKJOopIpBFpNSMbIHCSRpRR5iakjTiyzLhchUUBwCgyKiweBv/7UsQbg8isVNoMPT2AAAA0gAAABEVEfmqUlKPQAAdBS5Pn3z8//v//0S8f/oL2yZ3D8Rt8BEC/4CAAAAAAAAAAAAA=';

// --- Fournisseur Google -----------------------------------------------------

// Les « timepoints » de Google : { markName: 'm3', timeSeconds: 1.24 }. On les
// remet dans l'ordre et on ne garde que ceux qui désignent un mot connu.
export function reperesDeGoogle(timepoints, mots = []) {
  if (!Array.isArray(timepoints) || !mots.length) return [];
  return timepoints
    .map((point) => ({
      mot: Number(String(point?.markName || '').replace(/^m/, '')),
      temps: Number(point?.timeSeconds),
    }))
    .filter((r) => Number.isInteger(r.mot) && r.mot >= 0 && r.mot < mots.length && Number.isFinite(r.temps))
    .sort((a, b) => a.temps - b.temps);
}

// Les familles récentes (Chirp 3 HD, Journey…) refusent le SSML, le débit et la
// hauteur : leur envoyer ces champs fait échouer la requête.
const VOIX_SANS_OPTIONS = /chirp|journey|instant/i;

class VoixGoogle {
  constructor() {
    this.cache = new Map();
    this.cle = '';
    this.voix = 'fr-FR-Wavenet-C';
    this.vitesse = 1;
    this.simples = new Set(); // voix qui ont refusé les options, retenues pour la suite
  }

  // Cette voix accepte-t-elle SSML et réglage du débit ?
  accepteOptions(voix = this.voix) {
    return !VOIX_SANS_OPTIONS.test(voix) && !this.simples.has(voix);
  }

  configurer({ cle, voix, vitesse }) {
    if (cle !== undefined) this.cle = cle;
    if (voix) this.voix = voix;
    if (vitesse) this.vitesse = vitesse;
  }

  clef(texte) {
    return `${this.voix}|${this.vitesse}|${texte}`;
  }

  corpsRequete(texte, avecOptions) {
    const voice = { languageCode: this.voix.slice(0, 5) || 'fr-FR', name: this.voix };
    const audioConfig = { audioEncoding: 'MP3' };
    if (!avecOptions) {
      // Ces voix refusent SSML et le débit : texte brut, surlignage estimé.
      return { corps: { input: { text: texteParle(texte) }, voice, audioConfig }, mots: [] };
    }
    audioConfig.speakingRate = this.vitesse;
    audioConfig.pitch = 1;
    // Une balise <mark> devant chaque mot : Google renvoie l'instant exact où il
    // est prononcé, et le surlignage colle au son au lieu de l'estimer.
    // Le balisage n'entoure jamais un mot, donc l'apostrophe française reste
    // collée à sa lettre (« d’étoiles » n'est pas coupé).
    const { ssml, mots } = ssmlAvecReperes(texte);
    return {
      corps: { input: { ssml }, voice, audioConfig, enableTimePointing: ['SSML_MARK'] },
      mots,
    };
  }

  async demander(texte, avecOptions) {
    const { corps, mots } = this.corpsRequete(texte, avecOptions);
    const reponse = await fetch(`${URL_GOOGLE}/text:synthesize`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': this.cle },
      body: JSON.stringify(corps),
    });
    if (!reponse.ok) {
      const detail = await reponse.json().catch(() => null);
      const erreur = new Error(detail?.error?.message || `Erreur ${reponse.status} de la voix Google`);
      erreur.statut = reponse.status;
      throw erreur;
    }
    const { audioContent, timepoints } = await reponse.json();
    const octets = Uint8Array.from(atob(audioContent), (c) => c.charCodeAt(0));
    return {
      url: URL.createObjectURL(new Blob([octets], { type: 'audio/mpeg' })),
      mots,
      reperes: reperesDeGoogle(timepoints, mots),
    };
  }

  // Renvoie (et met en cache) l'URL d'un extrait audio.
  synthetiser(texte) {
    const clef = this.clef(texte);
    if (this.cache.has(clef)) return this.cache.get(clef);

    const voix = this.voix;
    const avecOptions = this.accepteOptions(voix);
    const promesse = this.demander(texte, avecOptions).catch((erreur) => {
      // Certaines voix refusent SSML et réglage du débit : on retient et on réessaie sobrement.
      if (erreur.statut === 400 && avecOptions) {
        this.simples.add(voix);
        return this.demander(texte, false);
      }
      throw erreur;
    });

    this.cache.set(clef, promesse);
    if (this.cache.size > 60) {
      const [vieille] = this.cache.keys();
      this.cache.get(vieille)?.then((extrait) => URL.revokeObjectURL(extrait.url)).catch(() => {});
      this.cache.delete(vieille);
    }
    return promesse;
  }

  async listerVoix(cle) {
    const reponse = await fetch(`${URL_GOOGLE}/voices?languageCode=fr-FR`, {
      headers: { 'x-goog-api-key': cle },
    });
    if (!reponse.ok) {
      const detail = await reponse.json().catch(() => null);
      throw new Error(detail?.error?.message || `Erreur ${reponse.status}`);
    }
    const { voices = [] } = await reponse.json();
    return voices
      .filter((v) => v.languageCodes?.some((l) => l.startsWith('fr')))
      .map((v) => ({ nom: v.name, genre: v.ssmlGender }))
      .sort((a, b) => a.nom.localeCompare(b.nom));
  }
}

// --- Narrateur --------------------------------------------------------------

export class Narrateur {
  constructor() {
    this.google = new VoixGoogle();
    this.fournisseur = 'navigateur';
    this.file = [];
    this.termine = true;
    this.enLecture = false;
    this.rappels = {};
    this.audio = null;
    this.minuteur = null;
    this.pauseDemandee = false;
  }

  get actifGoogle() {
    return this.fournisseur === 'google' && Boolean(this.google.cle);
  }

  configurer(reglages) {
    this.fournisseur = reglages.fournisseurVoix === 'google' && reglages.cleGoogle ? 'google' : 'navigateur';
    this.google.configurer({ cle: reglages.cleGoogle, voix: reglages.voixGoogle, vitesse: reglages.vitesse });
    conteur.configurer({ voix: reglages.voix, vitesse: reglages.vitesse });
  }

  chargerVoix() {
    return conteur.chargerVoix();
  }

  listerVoixGoogle(cle) {
    return this.google.listerVoix(cle);
  }

  // Cette voix Google accepte-t-elle le réglage de vitesse ?
  voixReglable(voix) {
    return this.google.accepteOptions(voix);
  }

  // Un premier geste de l'enfant débloque la parole ET l'audio (obligatoire sur iOS).
  // Le déverrouillage utilise son propre élément : autrefois il réutilisait celui
  // de la narration et coupait l'histoire en plein milieu à chaque appui.
  debloquer() {
    conteur.debloquer();
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.preload = 'auto';
    }
    if (this.audioDebloque) return;
    this.audioDebloque = true; // une seule tentative, réussie ou non
    try {
      const amorce = new Audio(SILENCE);
      amorce.volume = 0;
      amorce.play().catch(() => { /* le premier vrai extrait fera l'affaire */ });
    } catch { /* sans importance */ }
  }

  // --- File de phrases ------------------------------------------------------

  ouvrir(rappels = {}) {
    this.stop();
    this.rappels = rappels;
    this.termine = false;
    if (!this.actifGoogle) conteur.ouvrir(rappels);
  }

  enfiler(texte, index) {
    if (!this.actifGoogle) { conteur.enfiler(texte, index); return; }
    const entree = { texte, index, audio: this.google.synthetiser(texte).catch((e) => e) };
    this.file.push(entree);
    this._jouerSuivant();
  }

  fermer() {
    this.termine = true;
    if (!this.actifGoogle) { conteur.fermer(); return; }
    if (!this.enLecture && !this.file.length) this.rappels.onFin?.();
  }

  lire(phrases, rappels = {}) {
    this.ouvrir(rappels);
    phrases.forEach((phrase, i) => this.enfiler(phrase, i));
    this.fermer();
  }

  async _jouerSuivant() {
    if (this.enLecture) return;
    const entree = this.file.shift();
    if (!entree) {
      if (this.termine) this.rappels.onFin?.();
      return;
    }
    this.enLecture = true;
    this.courant = entree;
    const extrait = await entree.audio;
    if (extrait instanceof Error) { this._secours(extrait, entree); return; }
    if (!this.enLecture) return; // arrêté entre-temps

    this.debloquer();
    this.audio.src = extrait.url;
    await this._pret();
    if (!this.enLecture) return;
    this.rappels.onPhrase?.(entree.index);
    this._suivreMots(entree, extrait);

    this.audio.onended = () => {
      this._arreterSuivi();
      this.enLecture = false;
      this._jouerSuivant();
    };
    this.audio.onerror = () => this._secours(new Error('Lecture audio impossible'), entree);
    try {
      await this.audio.play();
    } catch {
      // Lecture refusée (pas encore de geste utilisateur) : on repassera par un bouton.
      this._arreterSuivi();
      this.enLecture = false;
    }
  }

  // On ne lance la lecture qu'une fois assez de son chargé, sinon le début saute.
  _pret() {
    const audio = this.audio;
    if (!audio || audio.readyState >= 3) return Promise.resolve();
    return new Promise((resoudre) => {
      const fini = () => {
        audio.removeEventListener('canplaythrough', fini);
        clearTimeout(minuteur);
        resoudre();
      };
      const minuteur = setTimeout(fini, 1500);
      audio.addEventListener('canplaythrough', fini);
    });
  }

  // Surlignage du mot. Deux régimes : les repères exacts renvoyés par Google
  // quand la voix accepte le SSML, sinon une estimation pondérée.
  _suivreMots(entree, extrait) {
    this._arreterSuivi();
    if (!this.rappels.onMot) return;
    if (extrait?.reperes?.length) { this._suivreReperes(entree, extrait); return; }
    this._suivreEstimation(entree);
  }

  _suivreReperes(entree, extrait) {
    const { reperes, mots } = extrait;
    this.minuteur = setInterval(() => {
      const t = this.audio?.currentTime;
      if (!Number.isFinite(t)) return;
      let courant = null;
      for (const repere of reperes) {
        if (repere.temps > t + 0.03) break;
        courant = repere;
      }
      const mot = courant && mots[courant.mot];
      if (mot) this.rappels.onMot(entree.index, mot.debut, mot.longueur);
    }, 60);
  }

  _suivreEstimation(entree) {
    const morceaux = decouperMots(entree.texte);
    const positions = [];
    let offset = 0;
    for (const morceau of morceaux) {
      if (!morceau.espace) {
        positions.push({ debut: offset, longueur: morceau.brut.length, poids: poidsMot(morceau.brut) });
      }
      offset += morceau.brut.length;
    }
    const total = positions.reduce((somme, m) => somme + m.poids, 0) || 1;
    this.minuteur = setInterval(() => {
      const duree = this.audio?.duration;
      if (!duree || !Number.isFinite(duree)) return;
      const avance = Math.min(1, this.audio.currentTime / duree) * total;
      let cumul = 0;
      for (const mot of positions) {
        cumul += mot.poids;
        if (avance <= cumul) { this.rappels.onMot(entree.index, mot.debut, mot.longueur); return; }
      }
    }, 70);
  }

  _arreterSuivi() {
    clearInterval(this.minuteur);
    this.minuteur = null;
  }

  // Panne de la voix Google : la phrase en cours et les suivantes passent à la voix du navigateur.
  _secours(erreur, entree) {
    this._arreterSuivi();
    const restantes = [entree, ...this.file].filter((e) => e && e.index >= 0);
    this.file = [];
    this.enLecture = false;
    this.fournisseur = 'navigateur';
    this.rappels.onErreur?.(erreur.message || 'La voix Google ne répond pas.');
    if (!restantes.length) { this.rappels.onFin?.(); return; }
    conteur.ouvrir(this.rappels);
    restantes.forEach((e) => conteur.enfiler(e.texte, e.index));
    if (this.termine) conteur.fermer();
  }

  // --- Contrôles ------------------------------------------------------------

  pause() {
    this.pauseDemandee = true;
    if (this.actifGoogle) this.audio?.pause();
    else conteur.pause();
  }

  reprendre() {
    this.pauseDemandee = false;
    if (this.actifGoogle) this.audio?.play().catch(() => {});
    else conteur.reprendre();
  }

  get enPause() {
    if (this.actifGoogle) return Boolean(this.audio && this.audio.paused && this.enLecture);
    return conteur.enPause;
  }

  stop() {
    this._arreterSuivi();
    this.file = [];
    this.enLecture = false;
    this.pauseDemandee = false;
    if (this.audio) {
      this.audio.pause();
      this.audio.onended = null;
      this.audio.onerror = null;
    }
    conteur.stop();
  }

  // Lecture d'un fragment isolé : un mot touché, un choix, un message.
  // onFin permet d'enchaîner (reprendre l'histoire après avoir dit un mot).
  direMot(texte, onFin) {
    if (!texte) { onFin?.(); return; }
    if (!this.actifGoogle) { conteur.direMot(texte, onFin); return; }
    this.stop();
    this.rappels = { onFin };
    this.termine = true;
    this.file.push({ texte, index: 0, audio: this.google.synthetiser(texte).catch((e) => e) });
    this._jouerSuivant();
  }

  get disponible() {
    return this.actifGoogle || conteur.disponible;
  }

  // La voix est-elle encore au travail ? Sert au filet de sécurité de l'écran
  // de jeu, qui ne doit pas conclure à une panne pendant une lecture normale.
  get occupe() {
    if (this.actifGoogle) return this.enLecture || this.file.length > 0;
    return conteur.occupe;
  }
}

export const narrateur = new Narrateur();
