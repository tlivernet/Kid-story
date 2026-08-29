// Mesure du chapitre reçu. Le modèle dérive : sur une histoire complète, 70 %
// des phrases dépassaient la longueur demandée et les chapitres comptaient
// deux phrases de trop. On mesure, et on le lui dit au tour suivant.

export const MAX_MOTS = 14;      // au-delà, une phrase est trop longue à l'oreille
export const CIBLE_MOTS = 11;

export function mesurerTexte(phrases = []) {
  const propres = phrases.map((p) => String(p).trim()).filter(Boolean);
  if (!propres.length) return { phrases: 0, moyenne: 0, tropLongues: 0, partTropLongues: 0 };
  const longueurs = propres.map((p) => p.split(/\s+/).length);
  const tropLongues = longueurs.filter((l) => l > MAX_MOTS).length;
  return {
    phrases: propres.length,
    moyenne: longueurs.reduce((a, b) => a + b, 0) / longueurs.length,
    plusLongue: Math.max(...longueurs),
    tropLongues,
    partTropLongues: tropLongues / longueurs.length,
  };
}

// Consigne de rattrapage à joindre au tour suivant, ou chaîne vide si le
// chapitre était dans les clous.
export function consigneStyle(mesure, richesse = 'riche') {
  const maxPhrases = richesse === 'simple' ? 5 : 8;
  const reproches = [];
  if (mesure.moyenne > MAX_MOTS || mesure.partTropLongues > 0.3) {
    reproches.push(
      `tes phrases faisaient ${Math.round(mesure.moyenne)} mots en moyenne (${mesure.tropLongues} sur ${mesure.phrases} dépassaient ${MAX_MOTS} mots)`
      + `. Coupe-les en deux : vise ${CIBLE_MOTS} mots par phrase, jamais plus de ${MAX_MOTS}`,
    );
  }
  if (mesure.phrases > maxPhrases) {
    reproches.push(`tu as écrit ${mesure.phrases} phrases, n'en écris pas plus de ${maxPhrases}`);
  }
  return reproches.length ? `${reproches.join(' ; ')}. L'enfant écoute, il ne peut pas relire.` : '';
}
