// Ce que la voix reçoit vraiment : les élisions et les majuscules ont fait
// épeler des mots lettre par lettre.
import test from 'node:test';
import assert from 'node:assert/strict';
import { texteParle } from '../js/util.js';

test('l’apostrophe droite devient l’apostrophe française', () => {
  assert.equal(texteParle("Il y a plein d'étoiles."), 'Il y a plein d’étoiles.');
  assert.equal(texteParle("C'est à lui, s'il te plaît."), 'C’est à lui, s’il te plaît.');
  assert.equal(texteParle('L’ourson dort déjà.'), 'L’ourson dort déjà.', 'celle qui est déjà correcte ne bouge pas');
});

test('un mot tout en majuscules n’est plus épelé', () => {
  assert.equal(texteParle('C’est LUI !'), 'C’est Lui !');
  assert.equal(texteParle('Le TRÉSOR brille.'), 'Le Trésor brille.');
  assert.equal(texteParle('OK, dit le robot.'), 'Ok, dit le robot.');
});

test('les majuscules isolées et les prénoms sont laissés tranquilles', () => {
  assert.equal(texteParle('Lina ouvre la porte.'), 'Lina ouvre la porte.');
  assert.equal(texteParle('Élise appelle Nino.'), 'Élise appelle Nino.');
});

test('guillemets et espaces insécables disparaissent', () => {
  assert.equal(texteParle('Il dit : « Viens ! »'), 'Il dit : Viens !');
  assert.equal(texteParle('Deux mots serrés.'), 'Deux mots serrés.');
});

test('le texte affiché n’est pas modifié, seul celui de la voix l’est', () => {
  const original = "C'est LUI !";
  texteParle(original);
  assert.equal(original, "C'est LUI !");
});
