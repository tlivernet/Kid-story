// Appel direct de l'API Claude depuis le navigateur (clé saisie par le parent).
// L'en-tête anthropic-dangerous-direct-browser-access autorise l'appel côté navigateur (CORS).

const URL_API = 'https://api.anthropic.com/v1/messages';
const VERSION_API = '2023-06-01';
const BETA_FALLBACK = 'server-side-fallback-2026-07-01';
const SILENCE_MAX = 30000; // au-delà, on considère que la réponse ne viendra pas

// Minuterie relancée à chaque signe de vie du flux.
function minuterie(delai, surExpiration) {
  let id = setTimeout(surExpiration, delai);
  return {
    relancer() { clearTimeout(id); id = setTimeout(surExpiration, delai); },
    arreter() { clearTimeout(id); },
  };
}

export class ErreurApi extends Error {
  constructor(message, { code = 'inconnue', aide = '' } = {}) {
    super(message);
    this.name = 'ErreurApi';
    this.code = code;
    this.aide = aide;
  }
}

function messageErreur(statut, corps) {
  const detail = corps?.error?.message || '';
  switch (statut) {
    case 401:
      return new ErreurApi('La clé API n’est pas valide.', { code: 'cle', aide: 'Vérifie la clé dans les réglages (elle commence par sk-ant-).' });
    case 403:
      return new ErreurApi('Cette clé n’a pas le droit d’écrire des histoires.', { code: 'droits', aide: detail });
    case 404:
      return new ErreurApi('Ce modèle n’existe pas ou n’est pas accessible.', { code: 'modele', aide: 'Choisis un autre modèle dans les réglages.' });
    case 429:
      return new ErreurApi('Trop d’histoires d’un coup ! Il faut attendre un petit moment.', { code: 'limite', aide: detail });
    case 400:
      return new ErreurApi('La demande a été refusée par l’API.', { code: 'requete', aide: detail });
    default:
      if (statut >= 500) return new ErreurApi('Le service est momentanément indisponible.', { code: 'serveur', aide: detail });
      return new ErreurApi(`Erreur ${statut}.`, { code: 'http', aide: detail });
  }
}

// --- Lecture partielle du JSON pendant le streaming -------------------------

function lireChaine(source, i) {
  let sortie = '';
  i += 1;
  while (i < source.length) {
    const c = source[i];
    if (c === '\\') {
      const suivant = source[i + 1];
      if (suivant === undefined) return null;
      if (suivant === 'u') {
        const hex = source.slice(i + 2, i + 6);
        if (hex.length < 4) return null;
        sortie += String.fromCharCode(parseInt(hex, 16));
        i += 6;
      } else {
        sortie += { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', '"': '"', '\\': '\\', '/': '/' }[suivant] ?? suivant;
        i += 2;
      }
    } else if (c === '"') {
      return { valeur: sortie, fin: i + 1 };
    } else {
      sortie += c;
      i += 1;
    }
  }
  return null;
}

function valeurChaine(tampon, cle) {
  const debut = tampon.indexOf(`"${cle}"`);
  if (debut < 0) return null;
  const deuxPoints = tampon.indexOf(':', debut + cle.length + 2);
  if (deuxPoints < 0) return null;
  let i = deuxPoints + 1;
  while (i < tampon.length && /\s/.test(tampon[i])) i += 1;
  if (tampon[i] !== '"') return null;
  const lu = lireChaine(tampon, i);
  return lu ? lu.valeur : null;
}

// Phrases déjà complètes dans le tableau "texte" du JSON en cours de réception.
export function phrasesCompletes(tampon) {
  const debut = tampon.indexOf('"texte"');
  if (debut < 0) return [];
  let i = tampon.indexOf('[', debut);
  if (i < 0) return [];
  i += 1;
  const phrases = [];
  while (i < tampon.length) {
    const c = tampon[i];
    if (c === ']') break;
    if (c === '"') {
      const lu = lireChaine(tampon, i);
      if (!lu) break;
      phrases.push(lu.valeur);
      i = lu.fin;
    } else {
      i += 1;
    }
  }
  return phrases;
}

// --- Requête ----------------------------------------------------------------

function corpsRequete({ modele, systeme, messages, schema, fallback }) {
  const corps = {
    model: modele,
    max_tokens: 8000,
    stream: true,
    system: [{ type: 'text', text: systeme, cache_control: { type: 'ephemeral' } }],
    messages,
    output_config: {
      format: { type: 'json_schema', schema },
    },
  };
  // `effort` n'existe pas sur les modèles Haiku : on ne l'envoie que là où il est accepté.
  if (!/haiku/.test(modele)) corps.output_config.effort = 'low'; // histoires courtes : priorité à la rapidité
  if (fallback) corps.fallbacks = 'default';
  return corps;
}

async function lireErreur(reponse) {
  let corps = null;
  try { corps = await reponse.json(); } catch { /* corps non JSON */ }
  return messageErreur(reponse.status, corps);
}

/**
 * Demande un chapitre à Claude en streaming.
 * onPhrase(phrase, index) est appelé dès qu'une phrase est complète.
 * Retourne l'objet JSON du chapitre.
 */
export async function raconter(options) {
  const { cle, modele, systeme, messages, schema, signal, silenceMax = SILENCE_MAX } = options;
  let fallback = options.fallback !== false && /opus|fable/.test(modele);

  for (let tentative = 0; tentative < 2; tentative += 1) {
    // Une requête qui reste muette bloquerait l'histoire indéfiniment.
    const controleur = new AbortController();
    let expire = false;
    const veille = minuterie(silenceMax, () => { expire = true; controleur.abort(); });
    if (signal) {
      if (signal.aborted) { veille.arreter(); throw new DOMException('Annulé', 'AbortError'); }
      signal.addEventListener('abort', () => controleur.abort(), { once: true });
    }

    const entetes = {
      'content-type': 'application/json',
      'x-api-key': cle,
      'anthropic-version': VERSION_API,
      'anthropic-dangerous-direct-browser-access': 'true',
    };
    if (fallback) entetes['anthropic-beta'] = BETA_FALLBACK;

    let reponse;
    try {
      reponse = await fetch(URL_API, {
        method: 'POST',
        headers: entetes,
        body: JSON.stringify(corpsRequete({ modele, systeme, messages, schema, fallback })),
        signal: controleur.signal,
      });
    } catch (erreur) {
      veille.arreter();
      if (expire) {
        throw new ErreurApi('La Plume Magique met trop de temps à répondre.', {
          code: 'delai',
          aide: 'Vérifie la connexion, puis réessaie.',
        });
      }
      if (erreur.name === 'AbortError') throw erreur;
      throw new ErreurApi('Impossible de joindre la Plume Magique.', {
        code: 'reseau',
        aide: 'Vérifie la connexion Internet, puis réessaie.',
      });
    }

    if (!reponse.ok) {
      veille.arreter();
      const erreur = await lireErreur(reponse);
      // Le secours automatique est une option bêta : on réessaie sans si elle est refusée.
      if (fallback && reponse.status === 400 && /fallback|beta/i.test(erreur.aide || '')) {
        fallback = false;
        continue;
      }
      throw erreur;
    }

    try {
      return await lireFlux(reponse, options, veille);
    } catch (erreur) {
      if (expire) {
        throw new ErreurApi('L’histoire s’est interrompue en chemin.', {
          code: 'delai',
          aide: 'La connexion s’est tue pendant l’écriture. Réessaie.',
        });
      }
      throw erreur;
    } finally {
      veille.arreter();
    }
  }
  throw new ErreurApi('La demande a échoué.', { code: 'inconnue' });
}

async function lireFlux(reponse, { onPhrase, onTitre }, veille = null) {
  const lecteur = reponse.body.getReader();
  const decodeur = new TextDecoder();
  let reste = '';
  let tampon = '';
  let nbPhrases = 0;
  let titreVu = false;
  let stopReason = null;

  while (true) {
    const { done, value } = await lecteur.read();
    if (done) break;
    veille?.relancer();
    reste += decodeur.decode(value, { stream: true });
    const blocs = reste.split('\n\n');
    reste = blocs.pop() ?? '';

    for (const bloc of blocs) {
      for (const ligne of bloc.split('\n')) {
        if (!ligne.startsWith('data:')) continue;
        const donnees = ligne.slice(5).trim();
        if (!donnees || donnees === '[DONE]') continue;
        let evenement;
        try { evenement = JSON.parse(donnees); } catch { continue; }

        if (evenement.type === 'content_block_delta' && evenement.delta?.type === 'text_delta') {
          tampon += evenement.delta.text;
          if (!titreVu && onTitre) {
            const titre = valeurChaine(tampon, 'titre');
            if (titre) { titreVu = true; onTitre(titre); }
          }
          if (onPhrase) {
            const phrases = phrasesCompletes(tampon);
            for (let i = nbPhrases; i < phrases.length; i += 1) onPhrase(phrases[i], i);
            nbPhrases = phrases.length;
          }
        } else if (evenement.type === 'message_delta' && evenement.delta?.stop_reason) {
          stopReason = evenement.delta.stop_reason;
        } else if (evenement.type === 'error') {
          throw new ErreurApi('La Plume Magique s’est arrêtée en route.', {
            code: 'flux',
            aide: evenement.error?.message || '',
          });
        }
      }
    }
  }

  if (stopReason === 'max_tokens') {
    // Réponse tronquée : même si le JSON se laisse relire, le chapitre est bancal.
    throw new ErreurApi('Le chapitre a été coupé avant la fin.', {
      code: 'tronque',
      aide: 'La Plume a écrit trop long. Réessaie, ça repart en général.',
    });
  }

  if (stopReason === 'refusal') {
    throw new ErreurApi('Cette histoire a été refusée par la sécurité de Claude.', {
      code: 'refus',
      aide: 'Essaie un autre thème ou une autre idée de départ.',
    });
  }

  try {
    return JSON.parse(tampon);
  } catch {
    // Dernier recours : on retente sur le JSON tronqué au dernier objet fermé.
    const coupe = tampon.lastIndexOf('}');
    if (coupe > 0) {
      try { return JSON.parse(tampon.slice(0, coupe + 1)); } catch { /* on abandonne */ }
    }
    throw new ErreurApi('La réponse de la Plume Magique était incomplète.', {
      code: 'json',
      aide: stopReason === 'max_tokens' ? 'Le chapitre était trop long.' : 'Réessaie, ça arrive rarement.',
    });
  }
}

// Vérification rapide de la clé (utilisée dans les réglages).
export async function tester(cle, modele) {
  const reponse = await fetch(URL_API, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': cle,
      'anthropic-version': VERSION_API,
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: modele,
      max_tokens: 16,
      messages: [{ role: 'user', content: 'Réponds seulement : ok' }],
    }),
  });
  if (!reponse.ok) throw await lireErreur(reponse);
  return true;
}
