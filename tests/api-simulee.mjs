// Pannes venues du modèle, rejouées avec une API simulée : ce sont elles qui
// ont bloqué une aventure en cours (chapitre vide pris pour une fin).
//   npx http-server -p 8123 -c-1 &   puis   node tests/api-simulee.mjs
const ADRESSE = process.env.ADRESSE || 'http://127.0.0.1:8123/index.html';

let chromium;
try { ({ chromium } = await import('playwright')); } catch {
  console.error('Playwright manquant : npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}

const echecs = [];
const verifier = (condition, message) => {
  console.log(`${condition ? '✅' : '❌'} ${message}`);
  if (!condition) echecs.push(message);
};

// `defaut` décrit ce que renvoie la fausse API au 2e appel.
async function scenario(defaut, panne = null) {
  const navigateur = await chromium.launch();
  const page = await navigateur.newPage({ viewport: { width: 420, height: 860 } });
  const erreursJs = [];
  page.on('pageerror', (e) => erreursJs.push(e.message));

  await page.addInitScript(({ panne: defautChapitre, incident }) => {
    localStorage.setItem('livre-magique:reglages', JSON.stringify({
      cle: 'sk-ant-faux', modele: 'claude-opus-5', lectureAuto: false, epreuves: 'de',
    }));
    window.__appels = 0;
    const plein = (n) => ({
      titre: n === 1 ? 'Lina et la clé' : '', texte: [`Chapitre ${n}, une phrase.`, 'Et une autre.'],
      lieu: 'foret', lieu_nom: `endroit ${n}`, moment: 'jour', acteurs: ['🦸'], objets_decor: [],
      quete: 'trouver la clé', memoire: 'des faits', compagnon: '', personnages: [],
      promesse_plantee: '', promesse_payee: '', adversaire_nom: '', adversaire_emoji: '',
      adversaire_coeurs: 0, sac_ajouter: [], sac_retirer: [], coeurs_delta: 0, etoiles_delta: 0,
      choix: [{ texte: 'Avancer', emoji: '👟', objet_requis: '', epreuve_nom: '', epreuve_difficulte: 0 }],
      fin_titre: '', fin_message: '',
    });
    window.fetch = async () => {
      window.__appels += 1;
      if (incident && window.__appels === 2) {
        if (incident === 'reseau') throw new TypeError('Failed to fetch');
        return new Response(JSON.stringify({ error: { message: 'overloaded' } }), { status: 529 });
      }
      const corps = window.__appels === 2 ? { ...plein(2), ...defautChapitre } : plein(window.__appels);
      const json = JSON.stringify(corps);
      const evenements = [
        'event: message_start\ndata: {"type":"message_start"}\n\n',
        `event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: json } })}\n\n`,
        'event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"end_turn"}}\n\n',
      ];
      const encodeur = new TextEncoder();
      return new Response(new ReadableStream({
        start(flot) { evenements.forEach((e) => flot.enqueue(encodeur.encode(e))); flot.close(); },
      }), { status: 200 });
    };
  }, { panne: defaut, incident: panne });

  await page.goto(ADRESSE);
  await page.click('#btn-nouvelle');
  await page.click('.grille-themes .carte-theme:nth-child(1)');
  await page.fill('#champ-prenom', 'Lina');
  await page.click('#btn-demarrer');
  await page.waitForSelector('#choix:not(.masque) .carte-choix', { timeout: 20000 });
  await page.click('#choix .carte-choix');
  await page.waitForTimeout(4500);
  await page.waitForSelector('#choix:not(.masque) .carte-choix', { timeout: 20000 });

  const vue = await page.evaluate(() => ({
    appels: window.__appels,
    phrases: document.querySelectorAll('.phrase').length,
    choix: [...document.querySelectorAll('#choix .carte-choix .libelle')].map((n) => n.textContent),
    incident: document.querySelector('#journal-erreurs')?.textContent || '',
  }));
  await page.click('#btn-maison');
  vue.continuer = await page.isVisible('#btn-continuer');
  vue.erreursJs = erreursJs;
  await navigateur.close();
  return vue;
}

// 1. Chapitre entièrement vide (la panne signalée).
const vide = await scenario({ texte: [], choix: [] });
verifier(vide.appels === 3, `un chapitre vide déclenche une relance automatique (${vide.appels} appels)`);
verifier(vide.phrases >= 2, `le texte du chapitre de remplacement s’affiche (${vide.phrases} phrases)`);
verifier(!vide.choix.some((c) => /fin de l’histoire/.test(c)), 'l’histoire n’est pas déclarée finie');
verifier(vide.continuer, '« Continuer » reste proposé sur l’accueil');

// 2. Fin annoncée au deuxième chapitre.
const finTot = await scenario({ choix: [], fin_titre: 'Bravo', fin_message: 'C’est fini !' });
verifier(finTot.appels === 3, `une fin trop précoce est refusée et relancée (${finTot.appels} appels)`);
verifier(!finTot.choix.some((c) => /fin de l’histoire/.test(c)), 'l’aventure continue malgré la fausse fin');

// 3. Chapitre sans aucun choix.
const sansChoix = await scenario({ choix: [] });
verifier(sansChoix.appels === 3, `un chapitre sans choix est relancé (${sansChoix.appels} appels)`);
verifier(sansChoix.choix.length > 0, 'des choix sont de nouveau proposés');

// 4. Coupure réseau puis service saturé : relance automatique, sans écran vide.
const reseau = await scenario({}, 'reseau');
verifier(reseau.appels === 3, `une coupure réseau est retentée toute seule (${reseau.appels} appels)`);
verifier(reseau.phrases >= 2, 'le chapitre finit par s’afficher après la relance');
verifier(reseau.choix.length > 0, 'des choix sont proposés après la relance');

const sature = await scenario({}, 'serveur');
verifier(sature.appels === 3, `un service saturé est retenté tout seul (${sature.appels} appels)`);
verifier(sature.phrases >= 2, 'le chapitre s’affiche après la relance');

const toutesErreurs = [...vide.erreursJs, ...finTot.erreursJs, ...sansChoix.erreursJs,
  ...reseau.erreursJs, ...sature.erreursJs];
verifier(toutesErreurs.length === 0, `aucune erreur JavaScript${toutesErreurs.length ? ` (${toutesErreurs.join(' | ')})` : ''}`);
process.exit(echecs.length ? 1 : 0);
