// Mesure du chapitre reçu. Le modèle dérive : sur une histoire complète, 70 %
// des phrases dépassaient la longueur demandée et les chapitres comptaient
// deux phrases de trop. On mesure, et on le lui dit au tour suivant.
//
// Le rythme compte autant que la longueur. Une histoire entière lue à voix
// haute où chaque phrase fait onze mots sonne comme un métronome : on mesure
// donc aussi la variété, et on réclame des phrases courtes.

export const MAX_MOTS = 16;      // au-delà, une phrase est trop longue à l'oreille
export const CIBLE_MOTS = 11;
export const MOYENNE_MAX = 13;   // la moyenne reste basse même si une phrase monte à 16
export const ETENDUE_MIN = 7;    // écart minimal entre la plus courte et la plus longue
export const COURTE = 5;         // une phrase de respiration
export const LONGUE = 13;

// Trois phrases de suite à moins de deux mots d'écart : la lecture devient plate.
function plusLongueSuiteEgale(longueurs) {
  let record = longueurs.length ? 1 : 0;
  let courante = 1;
  for (let i = 1; i < longueurs.length; i += 1) {
    courante = Math.abs(longueurs[i] - longueurs[i - 1]) <= 2 ? courante + 1 : 1;
    record = Math.max(record, courante);
  }
  return record;
}

export function mesurerTexte(phrases = []) {
  const propres = phrases.map((p) => String(p).trim()).filter(Boolean);
  if (!propres.length) {
    return { phrases: 0, moyenne: 0, tropLongues: 0, partTropLongues: 0, courtes: 0, longues: 0, suiteEgale: 0 };
  }
  const longueurs = propres.map((p) => p.split(/\s+/).length);
  const tropLongues = longueurs.filter((l) => l > MAX_MOTS).length;
  return {
    phrases: propres.length,
    moyenne: longueurs.reduce((a, b) => a + b, 0) / longueurs.length,
    plusLongue: Math.max(...longueurs),
    plusCourte: Math.min(...longueurs),
    courtes: longueurs.filter((l) => l <= COURTE).length,
    longues: longueurs.filter((l) => l >= LONGUE).length,
    suiteEgale: plusLongueSuiteEgale(longueurs),
    // L'écart entre la plus courte et la plus longue : c'est lui qui dit si la
    // lecture respire. Quatre phrases de 15 à 18 mots n'ont aucun relief, même
    // si aucune ne dépasse la limite.
    etendue: Math.max(...longueurs) - Math.min(...longueurs),
    tropLongues,
    partTropLongues: tropLongues / longueurs.length,
  };
}

// Consigne de rattrapage à joindre au tour suivant, ou chaîne vide si le
// chapitre était dans les clous.
export function consigneStyle(mesure, richesse = 'riche') {
  const maxPhrases = richesse === 'simple' ? 6 : 8;
  const courtesVoulues = richesse === 'simple' ? 1 : 2;
  const reproches = [];
  if (mesure.moyenne > MOYENNE_MAX || mesure.partTropLongues > 0.25) {
    reproches.push(
      `tes phrases faisaient ${Math.round(mesure.moyenne)} mots en moyenne (${mesure.tropLongues} sur ${mesure.phrases} dépassaient ${MAX_MOTS} mots)`
      + `. Coupe-les en deux : vise ${CIBLE_MOTS} mots par phrase, jamais plus de ${MAX_MOTS}`,
    );
  }
  if (mesure.phrases > maxPhrases) {
    reproches.push(`tu as écrit ${mesure.phrases} phrases, n'en écris pas plus de ${maxPhrases}`);
  }
  if (mesure.phrases >= 3 && mesure.courtes < courtesVoulues) {
    reproches.push(
      `tu n'as écrit que ${mesure.courtes} phrase(s) de ${COURTE} mots ou moins, il en faut au moins ${courtesVoulues}`
      + ' : une phrase très courte relance la lecture (« Rien ne bouge. », « Zoup ! », « Il écoute. »)',
    );
  }
  if ((mesure.phrases >= 4 && mesure.etendue < ETENDUE_MIN) || mesure.suiteEgale >= 3) {
    reproches.push(
      `tes phrases font toutes entre ${mesure.plusCourte} et ${mesure.plusLongue} mots`
      + ' : lu à voix haute, cela sonne comme un métronome. Alterne vraiment court et long',
    );
  }
  return reproches.length ? `${reproches.join(' ; ')}. L'enfant écoute, il ne peut pas relire.` : '';
}
