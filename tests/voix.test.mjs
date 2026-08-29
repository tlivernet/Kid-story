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
    return new Response(JSON.stringify({ audioContent: btoa('son') }), { status: 200 });
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

test('une voix WaveNet reçoit le SSML et le réglage de débit', async () => {
  configurer('fr-FR-Wavenet-C');
  const appels = espionnerFetch([{ statut: 200 }]);
  await narrateur.google.synthetiser('Bonjour Lina.');
  const { corps, entetes } = appels[0];
  assert.equal(entetes['x-goog-api-key'], 'AIza-test');
  assert.match(corps.input.ssml, /<break time="250ms"\/>Bonjour Lina\./);
  assert.equal(corps.audioConfig.speakingRate, 0.9);
  assert.equal(corps.voice.languageCode, 'fr-FR');
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
  assert.ok(appels[0].corps.input.ssml, 'premier essai avec options');
  assert.equal(appels[1].corps.input.text, 'Première phrase.', 'second essai sans options');

  await narrateur.google.synthetiser('Deuxième phrase.');
  assert.equal(appels.length, 3, 'pas de nouvel essai raté');
  assert.equal(appels[2].corps.input.text, 'Deuxième phrase.', 'la voix reste en mode sobre');
});

test('le texte est échappé avant d’entrer dans le SSML', async () => {
  configurer('fr-FR-Neural2-A');
  const appels = espionnerFetch([{ statut: 200 }]);
  await narrateur.google.synthetiser('Il dit : « Viens ! » & sourit <fort>');
  assert.match(appels[0].corps.input.ssml, /&amp; sourit &lt;fort&gt;/);
});

test('un extrait déjà demandé n’est pas resynthétisé', async () => {
  configurer('fr-FR-Wavenet-C');
  const appels = espionnerFetch([{ statut: 200 }, { statut: 200 }]);
  await narrateur.google.synthetiser('Même phrase.');
  await narrateur.google.synthetiser('Même phrase.');
  assert.equal(appels.length, 1);
});
