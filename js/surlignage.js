// Surlignage de la phrase lue et du mot en cours. Isolé du reste pour être
// testable : c'est ici que le dernier mot d'une phrase restait allumé.

export function effacerMots(racine = document) {
  racine.querySelectorAll('.mot.actif').forEach((mot) => mot.classList.remove('actif'));
}

export function effacerTout(racine = document) {
  racine.querySelectorAll('.phrase.lue').forEach((phrase) => phrase.classList.remove('lue'));
  effacerMots(racine);
}

// Passage à une nouvelle phrase : on éteint tout, y compris le dernier mot
// allumé de la phrase précédente, avant d'allumer la nouvelle.
export function marquerPhrase(index, racine = document) {
  effacerMots(racine);
  let active = null;
  racine.querySelectorAll('.phrase').forEach((phrase) => {
    const courante = Number(phrase.dataset.index) === index;
    phrase.classList.toggle('lue', courante);
    if (courante) active = phrase;
  });
  return active;
}

// Mot en cours de lecture, repéré par sa position dans la phrase.
export function marquerMot(index, debut, racine = document) {
  const phrase = racine.querySelector(`.phrase[data-index="${index}"]`);
  if (!phrase) return null;
  effacerMots(racine);
  let trouve = null;
  phrase.querySelectorAll('.mot').forEach((mot) => {
    const d = Number(mot.dataset.debut);
    const f = Number(mot.dataset.fin);
    if (debut >= d && debut < f) {
      mot.classList.add('actif');
      trouve = mot;
    }
  });
  return trouve;
}
