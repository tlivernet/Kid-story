// Tests de la requête envoyée à la synthèse vocale Google : chaque famille de
// voix accepte des champs différents, et une famille inconnue doit se rattraper.
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.URL.createObjectURL = () => 'blob:extrait';
const { narrateur } = await import('../js/voix.js');

function espionnerFetch(reponses) {
  const appels = [];
  globalThis.fetch = async (url, init) => {
    appels.push({ url, corps: JSON.parse(init.body), entetes: init.headers });
    const reponse = reponses.shift();
    if (reponse?.statut && reponse.statut !== 200) {
      return new Response(JSON.stringify({ error: { message: reponse.message } }), { status: reponse.statut });
    }
    return new Response(JSON.stringify({
      audioContent: btoa('son'),
      timepoints: reponse?.timepoints,
    }), { status: 200 });
  };
  return appels;
}

function configurer(voixGoogle) {
  narrateur.configurer({
    fournisseurVoix: 'google', cleGoogle: 'AIza-test', voixGoogle, vitesse: 0.9, voix: '',
  });
  narrateur.google.cache.clear();
  narrateur.google.simples.clear();
}

// Le surlignage était estimé d'après le nombre de lettres et prenait du retard
// sur le son. Les voix qui acceptent le SSML reçoivent une balise <mark> devant
// chaque mot : Google renvoie alors l'instant exact de chacun.
test('une voix WaveNet reçoit du SSML balisé, des repères et le réglage de débit', async () => {
  configurer('fr-FR-Wavenet-C');
  const appels = espionnerFetch([{ statut: 200 }]);
  await narrateur.google.synthetiser('Bonjour Lina.');
  const { corps, entetes } = appels[0];
  assert.equal(entetes['x-goog-api-key'], 'AIza-test');
  assert.equal(corps.input.text, undefined);
  assert.equal(corps.input.ssml, '<speak><mark name="m0"/>Bonjour <mark name="m1"/>Lina.</speak>');
  assert.deepEqual(corps.enableTimePointing, ['SSML_MARK']);
  assert.equal(corps.audioConfig.speakingRate, 0.9);
  assert.equal(corps.voice.languageCode, 'fr-FR');
});

// Le balisage avait déjà cassé les apostrophes une fois : « d'étoiles » était lu
// « d » puis « étoiles ». Une balise ne doit jamais tomber à l'intérieur d'un mot.
test('le texte est préparé pour l’oreille, et aucune balise ne coupe un mot', async () => {
  configurer('fr-FR-Wavenet-C');
  const appels = espionnerFetch([{ statut: 200 }]);
  await narrateur.google.synthetiser("Il y a plein d'étoiles, dit-il : « viens ! »");
  const { ssml } = appels[0].corps.input;
  assert.match(ssml, /<mark name="m4"\/>d’étoiles,/, 'l’apostrophe reste collée à sa lettre');
  assert.doesNotMatch(ssml, /[\p{L}]<mark/u, 'aucune balise à l’intérieur d’un mot');
  assert.doesNotMatch(ssml, /[«»]/, 'les guillemets sont retirés');
});

test('une voix Chirp 3 HD reçoit du texte brut, sans débit ni hauteur', async () => {
  configurer('fr-FR-Chirp3-HD-Achernar');
  const appels = espionnerFetch([{ statut: 200 }]);
  await narrateur.google.synthetiser('Bonjour Lina.');
  const { corps } = appels[0];
  assert.equal(corps.input.text, 'Bonjour Lina.');
  assert.equal(corps.input.ssml, undefined);
  assert.equal(corps.audioConfig.speakingRate, undefined);
  assert.equal(corps.audioConfig.pitch, undefined);
});

test('une famille inconnue qui refuse les options est réessayée sobrement, puis retenue', async () => {
  configurer('fr-FR-Nouveaute-X');
  const appels = espionnerFetch([
    { statut: 400, message: 'Request contains an invalid argument.' },
    { statut: 200 },
    { statut: 200 },
  ]);
  await narrateur.google.synthetiser('Première phrase.');
  assert.equal(appels.length, 2, 'la requête est rejouée une fois');
  assert.equal(appels[0].corps.audioConfig.speakingRate, 0.9, 'premier essai avec options');
  assert.equal(appels[1].corps.audioConfig.speakingRate, undefined, 'second essai sans options');

  await narrateur.google.synthetiser('Deuxième phrase.');
  assert.equal(appels.length, 3, 'pas de nouvel essai raté');
  assert.equal(appels[2].corps.audioConfig.speakingRate, undefined, 'la voix reste en mode sobre');
});

test('les caractères réservés au XML sont échappés dans le SSML', async () => {
  configurer('fr-FR-Neural2-A');
  const appels = espionnerFetch([{ statut: 200 }]);
  await narrateur.google.synthetiser('Il dit : viens & sourit <fort>');
  const { ssml } = appels[0].corps.input;
  assert.match(ssml, /&amp;/);
  assert.match(ssml, /&lt;fort&gt;/);
  assert.doesNotMatch(ssml, /<fort>/);
});

test('les repères de Google sont rattachés aux mots et remis dans l’ordre', async () => {
  const { reperesDeGoogle } = await import('../js/voix.js');
  const mots = [{ debut: 0, longueur: 2 }, { debut: 3, longueur: 5 }, { debut: 9, longueur: 4 }];
  const reperes = reperesDeGoogle([
    { markName: 'm2', timeSeconds: 1.4 },
    { markName: 'm0', timeSeconds: 0.1 },
    { markName: 'm9', timeSeconds: 2 },        // hors du texte : ignoré
    { markName: 'm1', timeSeconds: 0.7 },
    { markName: 'bruit', timeSeconds: 3 },     // marque étrangère : ignorée
  ], mots);
  assert.deepEqual(reperes, [
    { mot: 0, temps: 0.1 }, { mot: 1, temps: 0.7 }, { mot: 2, temps: 1.4 },
  ]);
  assert.deepEqual(reperesDeGoogle(undefined, mots), [], 'sans repères, on retombe sur l’estimation');
});

// Estimation de repli, pour les voix qui refusent le SSML : compter les lettres
// seules fait prendre du retard, car chaque mot coûte aussi un temps fixe.
test('l’estimation donne un poids minimal à chaque mot et une pause à la ponctuation', async () => {
  const { poidsMot } = await import('../js/util.js');
  assert.ok(poidsMot('le') > 2, 'un mot très court ne pèse pas presque rien');
  assert.ok(poidsMot('fin.') > poidsMot('fine'), 'un point impose une pause');
  assert.ok(poidsMot('mot,') > poidsMot('mot'), 'une virgule aussi');
  assert.ok(poidsMot('extraordinaire') > poidsMot('le'), 'un mot long pèse plus qu’un court');
});

test('un extrait déjà demandé n’est pas resynthétisé', async () => {
  configurer('fr-FR-Wavenet-C');
  const appels = espionnerFetch([{ statut: 200 }, { statut: 200 }]);
  await narrateur.google.synthetiser('Même phrase.');
  await narrateur.google.synthetiser('Même phrase.');
  assert.equal(appels.length, 1);
});
