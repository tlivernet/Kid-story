// Tests du client API : lecture du flux SSE, affichage progressif, replis d'erreur.
import test from 'node:test';
import assert from 'node:assert/strict';
import { raconter, phrasesCompletes } from '../js/api.js';

const CHAPITRE = {
  titre: 'Lina et le dragon',
  texte: ['Lina ouvre la porte.', 'Un dragon éternue. Atchoum !', 'Il a perdu sa flamme.'],
  lieu: 'grotte',
  moment: 'jour',
  acteurs: ['🦸‍♀️', '🐉'],
  objets_decor: ['🔥'],
  quete: 'retrouver la flamme',
  memoire: 'Lina aide un dragon enrhumé.',
  compagnon: 'Braise le dragon 🐉',
  sac_ajouter: [{ nom: 'Écharpe', emoji: '🧣', pouvoir: 'tient chaud' }],
  sac_retirer: [],
  coeurs_delta: 0,
  etoiles_delta: 1,
  choix: [{ texte: 'Chercher la flamme', emoji: '🔦', objet_requis: '', epreuve_nom: 'chercher', epreuve_difficulte: 3 }],
  fin_titre: '',
  fin_message: '',
};

function fluxSSE(json, morceaux = 7) {
  const taille = Math.ceil(json.length / morceaux);
  const evenements = ['event: message_start\ndata: {"type":"message_start"}\n\n'];
  for (let i = 0; i < json.length; i += taille) {
    const bout = json.slice(i, i + taille);
    evenements.push(`event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: bout } })}\n\n`);
  }
  evenements.push('event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"end_turn"}}\n\n');
  evenements.push('event: message_stop\ndata: {"type":"message_stop"}\n\n');
  const encodeur = new TextEncoder();
  return new ReadableStream({
    start(controleur) {
      for (const e of evenements) controleur.enqueue(encodeur.encode(e));
      controleur.close();
    },
  });
}

const options = (extra = {}) => ({
  cle: 'sk-ant-test', modele: 'claude-opus-5', systeme: 'test',
  messages: [{ role: 'user', content: 'salut' }], schema: { type: 'object' }, ...extra,
});

test('phrasesCompletes ne renvoie que les phrases terminées', () => {
  const partiel = '{"titre":"A","texte":["Une phrase.","Deux phra';
  assert.deepEqual(phrasesCompletes(partiel), ['Une phrase.']);
});

test('phrasesCompletes gère les échappements', () => {
  const partiel = '{"texte":["Il dit : \\"bonjour\\".","Fin.';
  assert.deepEqual(phrasesCompletes(partiel), ['Il dit : "bonjour".']);
});

test('le flux livre les phrases au fur et à mesure puis le chapitre complet', async () => {
  const vues = [];
  let titre = null;
  globalThis.fetch = async () => new Response(fluxSSE(JSON.stringify(CHAPITRE)), { status: 200 });
  const chapitre = await raconter(options({
    onPhrase: (p) => vues.push(p),
    onTitre: (t) => { titre = t; },
  }));
  assert.equal(titre, CHAPITRE.titre);
  assert.deepEqual(vues, CHAPITRE.texte);
  assert.equal(chapitre.lieu, 'grotte');
  assert.equal(chapitre.choix[0].epreuve_difficulte, 3);
});

test('les bons en-têtes sont envoyés', async () => {
  let vue = null;
  globalThis.fetch = async (url, init) => {
    vue = { url, init };
    return new Response(fluxSSE(JSON.stringify(CHAPITRE)), { status: 200 });
  };
  await raconter(options());
  assert.equal(vue.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(vue.init.headers['anthropic-dangerous-direct-browser-access'], 'true');
  assert.equal(vue.init.headers['anthropic-version'], '2023-06-01');
  assert.equal(vue.init.headers['x-api-key'], 'sk-ant-test');
  const corps = JSON.parse(vue.init.body);
  assert.equal(corps.stream, true);
  assert.equal(corps.output_config.format.type, 'json_schema');
});

test('une clé invalide donne un message clair', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ error: { message: 'invalid x-api-key' } }), { status: 401 });
  await assert.rejects(raconter(options()), (e) => e.code === 'cle');
});

test('le secours bêta refusé est retenté sans l’option', async () => {
  const appels = [];
  globalThis.fetch = async (url, init) => {
    appels.push(init.headers['anthropic-beta']);
    if (appels.length === 1) {
      return new Response(JSON.stringify({ error: { message: 'unexpected fallbacks parameter (beta)' } }), { status: 400 });
    }
    return new Response(fluxSSE(JSON.stringify(CHAPITRE)), { status: 200 });
  };
  const chapitre = await raconter(options({ fallback: true }));
  assert.equal(appels.length, 2);
  assert.equal(appels[1], undefined);
  assert.equal(chapitre.titre, CHAPITRE.titre);
});

test('un refus de sécurité est signalé', async () => {
  globalThis.fetch = async () => {
    const encodeur = new TextEncoder();
    const flux = new ReadableStream({
      start(c) {
        c.enqueue(encodeur.encode('event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"refusal"}}\n\n'));
        c.close();
      },
    });
    return new Response(flux, { status: 200 });
  };
  await assert.rejects(raconter(options()), (e) => e.code === 'refus');
});
