// Lecture à voix haute (Web Speech API) : file de phrases, surlignage du mot lu,
// et petits contournements pour iOS et Chrome.

export class Conteur {
  constructor() {
    this.synth = typeof speechSynthesis !== 'undefined' ? speechSynthesis : null;
    this.file = [];
    this.enCours = false;
    this.termine = true;
    this.utterance = null;
    this.voixChoisie = null;
    this.vitesse = 0.95;
    this.debloque = false;
    this.rappels = {};
    this.pompe = null;
    if (this.synth) {
      this.chargerVoix();
      this.synth.addEventListener?.('voiceschanged', () => this.chargerVoix());
    }
  }

  get disponible() {
    return Boolean(this.synth) && typeof SpeechSynthesisUtterance !== 'undefined';
  }

  chargerVoix() {
    if (!this.synth) return [];
    this.voix = this.synth.getVoices().filter((v) => /^fr/i.test(v.lang));
    if (!this.voixChoisie && this.voix.length) this.voixChoisie = this.meilleureVoix();
    return this.voix;
  }

  meilleureVoix() {
    const liste = this.voix || [];
    // On préfère une voix française locale, féminine si on peut la reconnaître.
    return (
      liste.find((v) => v.localService && /(amelie|amélie|audrey|marie|julie|female|virginie)/i.test(v.name))
      || liste.find((v) => v.localService)
      || liste[0]
      || null
    );
  }

  configurer({ voix, vitesse }) {
    if (vitesse) this.vitesse = vitesse;
    if (voix !== undefined) {
      const trouvee = (this.voix || []).find((v) => v.voiceURI === voix || v.name === voix);
      this.voixChoisie = trouvee || this.meilleureVoix();
    }
  }

  // iOS n'autorise la synthèse qu'après une interaction : on la « réveille » au premier geste.
  debloquer() {
    if (!this.disponible || this.debloque) return;
    try {
      const vide = new SpeechSynthesisUtterance(' ');
      vide.volume = 0;
      this.synth.speak(vide);
      this.debloque = true;
    } catch { /* sans importance */ }
  }

  lire(phrases, rappels = {}) {
    this.stop();
    this.rappels = rappels;
    this.termine = false;
    this.chauffer();
    phrases.forEach((texte, index) => this.file.push({ texte, index }));
    this.termine = true;
    this._demarrer();
  }

  // Mode streaming : on enfile les phrases au fur et à mesure de leur arrivée.
  ouvrir(rappels = {}) {
    this.stop();
    this.rappels = rappels;
    this.termine = false;
    this.chauffer();
  }

  // Une inspiration muette avant de parler : certains moteurs tronquent sinon
  // le début de leur toute première phrase.
  chauffer() {
    if (!this.disponible) return;
    try {
      const souffle = new SpeechSynthesisUtterance(' ');
      souffle.volume = 0;
      this.synth.speak(souffle);
    } catch { /* sans importance */ }
  }

  enfiler(texte, index) {
    this.file.push({ texte, index });
    this._demarrer();
  }

  fermer() {
    this.termine = true;
    if (!this.enCours && !this.file.length) this.rappels.onFin?.();
  }

  _demarrer() {
    if (!this.disponible || this.enCours) return;
    // Chrome avale le premier mot si speak() suit cancel() de trop près.
    const depuisAnnulation = Date.now() - (this.tempsAnnulation || 0);
    if (depuisAnnulation < 200) {
      this.enCours = true;
      setTimeout(() => { this.enCours = false; this._demarrer(); }, 200 - depuisAnnulation);
      return;
    }
    const suivant = this.file.shift();
    if (!suivant) {
      if (this.termine) this.rappels.onFin?.();
      return;
    }
    this.enCours = true;
    const u = new SpeechSynthesisUtterance(suivant.texte);
    u.lang = 'fr-FR';
    if (this.voixChoisie) u.voice = this.voixChoisie;
    u.rate = this.vitesse;
    u.pitch = 1.05;
    this.utterance = u;
    this.rappels.onPhrase?.(suivant.index);

    u.onboundary = (e) => {
      if (e.name && e.name !== 'word') return;
      this.rappels.onMot?.(suivant.index, e.charIndex ?? 0, e.charLength ?? 0);
    };
    u.onend = () => {
      this.enCours = false;
      this.utterance = null;
      this._demarrer();
    };
    u.onerror = () => {
      this.enCours = false;
      this.utterance = null;
      this._demarrer();
    };

    try {
      this.synth.speak(u);
      // La relance anti-coupure de Chrome n'est utile que sur les longs passages,
      // et sur les courts elle hache le son : on ne l'arme qu'au-delà de ~15 secondes.
      if (suivant.texte.length > 220) this._pomper();
    } catch {
      this.enCours = false;
    }
  }

  // Chrome coupe la synthèse au bout d'une quinzaine de secondes : on la relance.
  _pomper() {
    clearInterval(this.pompe);
    this.pompe = setInterval(() => {
      if (!this.synth || !this.synth.speaking) { clearInterval(this.pompe); return; }
      if (!this.synth.paused) { this.synth.pause(); this.synth.resume(); }
    }, 9000);
  }

  pause() {
    if (this.synth?.speaking && !this.synth.paused) this.synth.pause();
  }

  reprendre() {
    if (this.synth?.paused) this.synth.resume();
  }

  get enPause() {
    return Boolean(this.synth?.paused);
  }

  stop() {
    clearInterval(this.pompe);
    this.file = [];
    this.enCours = false;
    this.utterance = null;
    if (this.synth?.speaking || this.synth?.pending) this.tempsAnnulation = Date.now();
    try { this.synth?.cancel(); } catch { /* ignoré */ }
  }

  // Lecture d'un fragment isolé (un mot touché, un choix énoncé).
  direMot(mot, onFin) {
    if (!this.disponible || !mot) { onFin?.(); return; }
    this.stop();
    const u = new SpeechSynthesisUtterance(mot);
    u.lang = 'fr-FR';
    if (this.voixChoisie) u.voice = this.voixChoisie;
    u.rate = Math.min(this.vitesse, 0.85);
    u.onend = () => onFin?.();
    u.onerror = () => onFin?.();
    // Même précaution qu'ailleurs : parler juste après cancel() coupe le début.
    setTimeout(() => {
      try { this.synth.speak(u); } catch { onFin?.(); }
    }, 200);
  }
}

export const conteur = new Conteur();
