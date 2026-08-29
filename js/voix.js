// Narrateur unifié : voix du navigateur (gratuite) ou voix de synthèse Google Cloud
// (bien plus jolie). Même interface dans les deux cas, bascule automatique en cas de panne.
import { conteur } from './tts.js';
import { decouperMots } from './util.js';

const URL_GOOGLE = 'https://texttospeech.googleapis.com/v1';
const SILENCE = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQxAADB8AhSmxhIIEVCSiJrDCQBTcu3UrAIwUdkRgQbFAZC1CQEwTJ9mjRvBA4UOLD8nKVOWfh+UlK3z/177OXrfOdKl7pyn3Xf//WreyTRUoAWgBgkOAGbZHBgG1OF6zM82DWbZaUmMBptgQhGjsyYqc9ae9XFz280948NMBWInljyzsNRFLPWdnZGWrddDsjK1unuSrVN9jJsK8KuQtQCtMBjCEtImISdNKJOopIpBFpNSMbIHCSRpRR5iakjTiyzLhchUUBwCgyKiweBv/7UsQbg8isVNoMPT2AAAA0gAAABEVEfmqUlKPQAAdBS5Pn3z8//v//0S8f/oL2yZ3D8Rt8BEC/4CAAAAAAAAAAAAA=';

// --- Fournisseur Google -----------------------------------------------------

// Les moteurs de synthèse butent sur la typographie française : apostrophe
// courbe, espaces insécables, guillemets. On leur envoie du texte simple.
export function nettoyerPourVoix(texte) {
  return String(texte)
    .replace(/[\u2019\u02BC]/g, "'")   // apostrophe courbe → apostrophe droite
    .replace(/[\u202F\u00A0\u2009]/g, ' ') // espaces insécables → espace normale
    .replace(/[«»""]/g, '')            // guillemets : la voix marque déjà le dialogue
    .replace(/\s+/g, ' ')
    .trim();
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
    if (avecOptions) {
      audioConfig.speakingRate = this.vitesse;
      audioConfig.pitch = 1;
    }
    // Texte brut plutôt que SSML : le balisage faisait détacher l'apostrophe
    // française (« d'étoiles » lu « d » puis « étoiles »).
    return { input: { text: nettoyerPourVoix(texte) }, voice, audioConfig };
  }

  async demander(texte, avecOptions) {
    const reponse = await fetch(`${URL_GOOGLE}/text:synthesize`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': this.cle },
      body: JSON.stringify(this.corpsRequete(texte, avecOptions)),
    });
    if (!reponse.ok) {
      const detail = await reponse.json().catch(() => null);
      const erreur = new Error(detail?.error?.message || `Erreur ${reponse.status} de la voix Google`);
      erreur.statut = reponse.status;
      throw erreur;
    }
    const { audioContent } = await reponse.json();
    const octets = Uint8Array.from(atob(audioContent), (c) => c.charCodeAt(0));
    return URL.createObjectURL(new Blob([octets], { type: 'audio/mpeg' }));
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
      this.cache.get(vieille)?.then((url) => URL.revokeObjectURL(url)).catch(() => {});
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
  debloquer() {
    conteur.debloquer();
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.preload = 'auto';
    }
    if (!this.audioDebloque) {
      this.audio.src = SILENCE;
      this.audio.play().then(() => { this.audioDebloque = true; }).catch(() => {});
    }
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
    const url = await entree.audio;
    if (url instanceof Error) { this._secours(url, entree); return; }
    if (!this.enLecture) return; // arrêté entre-temps

    this.debloquer();
    this.audio.src = url;
    await this._pret();
    if (!this.enLecture) return;
    this.rappels.onPhrase?.(entree.index);
    this._suivreMots(entree);

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

  // Surlignage du mot : estimé à partir de la durée de l'extrait.
  _suivreMots(entree) {
    this._arreterSuivi();
    if (!this.rappels.onMot) return;
    const morceaux = decouperMots(entree.texte);
    const positions = [];
    let offset = 0;
    for (const morceau of morceaux) {
      if (!morceau.espace) positions.push({ debut: offset, longueur: morceau.brut.length });
      offset += morceau.brut.length;
    }
    const total = positions.reduce((somme, m) => somme + m.longueur, 0) || 1;
    this.minuteur = setInterval(() => {
      const duree = this.audio?.duration;
      if (!duree || !Number.isFinite(duree)) return;
      const avance = Math.min(1, this.audio.currentTime / duree) * total;
      let cumul = 0;
      for (const mot of positions) {
        cumul += mot.longueur;
        if (avance <= cumul) { this.rappels.onMot(entree.index, mot.debut, mot.longueur); return; }
      }
    }, 90);
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
}

export const narrateur = new Narrateur();
