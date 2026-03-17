/**
 * Tests d'intégration — API RGsaver
 * Utilise node:test (built-in Node 18+) + supertest
 * Base de données en mémoire isolée de la production
 */

'use strict';

process.env.DB_PATH = ':memory:';

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const supertest = require('supertest');

// Chargement après avoir forcé DB_PATH
const { app, db } = require('../server');
const api = supertest(app);

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

function createRG(overrides = {}) {
  return api.post('/api/rg').send({
    code: 'RG-TEST',
    titre: 'Règle de test',
    description: 'Description de test',
    domaine: 'Test',
    statut: 'Active',
    priorite: 'Normale',
    type_regle: 'Fonctionnelle',
    groupe: 'Groupe test',
    tags: 'test, unitaire',
    source: 'Tests automatisés',
    fichier: 'src/test.js',
    ecran: 'Page test',
    ...overrides,
  });
}

const cleanDBTx = db.transaction(() => {
  db.prepare('DELETE FROM rg_history').run();
  db.prepare('DELETE FROM regles').run();
});

function cleanDB() {
  cleanDBTx();
  db.exec("INSERT INTO regles_fts(regles_fts) VALUES ('rebuild')");
}

// ─────────────────────────────────────────────────────────────
//  CRUD
// ─────────────────────────────────────────────────────────────

describe('POST /api/rg — création', () => {
  before(() => cleanDB());

  it('crée une RG et retourne l\'objet complet', async () => {
    const res = await createRG();
    assert.equal(res.status, 200);
    assert.equal(res.body.code, 'RG-TEST');
    assert.equal(res.body.titre, 'Règle de test');
    assert.equal(res.body.statut, 'Active');
    assert.ok(res.body.id > 0);
  });

  it('applique les valeurs par défaut (statut, priorite, type_regle)', async () => {
    const res = await api.post('/api/rg').send({ code: 'RG-DEF', titre: 'Défauts' });
    assert.equal(res.status, 200);
    assert.equal(res.body.statut, 'Draft');
    assert.equal(res.body.priorite, 'Normale');
    assert.equal(res.body.type_regle, 'Fonctionnelle');
  });

  it('les champs texte vides sont normalisés à ""', async () => {
    const res = await api.post('/api/rg').send({ code: 'RG-EMPTY', titre: 'Vide' });
    assert.equal(res.status, 200);
    assert.equal(res.body.description, '');
    assert.equal(res.body.domaine, '');
    assert.equal(res.body.tags, '');
  });
});

describe('GET /api/rg/:id — lecture', () => {
  let rgId;
  before(async () => {
    cleanDB();
    const res = await createRG();
    rgId = res.body.id;
  });

  it('retourne la RG par ID', async () => {
    const res = await api.get(`/api/rg/${rgId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.id, rgId);
    assert.equal(res.body.code, 'RG-TEST');
  });

  it('retourne 404 pour un ID inexistant', async () => {
    const res = await api.get('/api/rg/999999');
    assert.equal(res.status, 404);
    assert.ok(res.body.error);
  });
});

describe('PUT /api/rg/:id — mise à jour', () => {
  let rg;
  before(async () => {
    cleanDB();
    const res = await createRG();
    rg = res.body;
  });

  it('met à jour les champs modifiés', async () => {
    const res = await api.put(`/api/rg/${rg.id}`).send({
      ...rg,
      titre: 'Titre modifié',
      statut: 'Obsolète',
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.titre, 'Titre modifié');
    assert.equal(res.body.statut, 'Obsolète');
  });

  it('retourne 404 pour un ID inexistant', async () => {
    const res = await api.put('/api/rg/999999').send({ titre: 'X', code: 'X' });
    assert.equal(res.status, 404);
  });
});

describe('DELETE /api/rg/:id — suppression', () => {
  let rgId;
  before(async () => {
    cleanDB();
    const res = await createRG();
    rgId = res.body.id;
  });

  it('supprime la RG et retourne { ok: true }', async () => {
    const res = await api.delete(`/api/rg/${rgId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
  });

  it('la RG n\'existe plus après suppression', async () => {
    const res = await api.get(`/api/rg/${rgId}`);
    assert.equal(res.status, 404);
  });

  it('retourne 404 pour supprimer un ID inexistant', async () => {
    const res = await api.delete('/api/rg/999999');
    assert.equal(res.status, 404);
  });
});

// ─────────────────────────────────────────────────────────────
//  Liste & recherche
// ─────────────────────────────────────────────────────────────

describe('GET /api/rg — liste et filtres', () => {
  before(async () => {
    cleanDB();
    await createRG({ code: 'RG-A1', titre: 'Alpha commande', domaine: 'Finance', statut: 'Active', priorite: 'Haute' });
    await createRG({ code: 'RG-A2', titre: 'Beta stock', domaine: 'Finance/Budget', statut: 'Draft', priorite: 'Basse' });
    await createRG({ code: 'RG-A3', titre: 'Gamma livraison', domaine: 'Logistique', statut: 'Active', priorite: 'Haute' });
  });

  it('retourne toutes les RGs avec total', async () => {
    const res = await api.get('/api/rg');
    assert.equal(res.status, 200);
    assert.equal(res.body.total, 3);
    assert.equal(res.body.items.length, 3);
    assert.ok('hasMore' in res.body);
  });

  it('filtre par statut', async () => {
    const res = await api.get('/api/rg?statut=Active');
    assert.equal(res.status, 200);
    assert.equal(res.body.total, 2);
    assert.ok(res.body.items.every(r => r.statut === 'Active'));
  });

  it('filtre par priorité', async () => {
    const res = await api.get('/api/rg?priorite=Haute');
    assert.equal(res.status, 200);
    assert.equal(res.body.total, 2);
  });

  it('filtre par domaine exact', async () => {
    const res = await api.get('/api/rg?domaine=Finance');
    assert.equal(res.status, 200);
    // Doit inclure Finance et Finance/Budget (hiérarchie)
    assert.ok(res.body.total >= 1);
    assert.ok(res.body.items.some(r => r.domaine === 'Finance'));
  });

  it('filtre domaine inclut les sous-domaines (hiérarchie)', async () => {
    const res = await api.get('/api/rg?domaine=Finance');
    assert.equal(res.status, 200);
    assert.equal(res.body.total, 2); // Finance + Finance/Budget
  });

  it('pagination : limit et offset', async () => {
    const page1 = await api.get('/api/rg?limit=2&offset=0');
    assert.equal(page1.body.items.length, 2);
    assert.equal(page1.body.hasMore, true);

    const page2 = await api.get('/api/rg?limit=2&offset=2');
    assert.equal(page2.body.items.length, 1);
    assert.equal(page2.body.hasMore, false);
  });

  it('recherche full-text (FTS)', async () => {
    const res = await api.get('/api/rg?q=Alpha');
    assert.equal(res.status, 200);
    assert.equal(res.body.total, 1);
    assert.equal(res.body.items[0].titre, 'Alpha commande');
  });

  it('recherche FTS avec filtre combiné', async () => {
    // Plusieurs RGs actives, on cherche "livraison" dans Active
    const res = await api.get('/api/rg?q=livraison&statut=Active');
    assert.equal(res.status, 200);
    assert.equal(res.body.total, 1);
    assert.equal(res.body.items[0].code, 'RG-A3');
  });

  it('recherche vide ne plante pas', async () => {
    const res = await api.get('/api/rg?q=');
    assert.equal(res.status, 200);
    assert.equal(res.body.total, 3);
  });
});

// ─────────────────────────────────────────────────────────────
//  Historique
// ─────────────────────────────────────────────────────────────

describe('GET /api/rg/:id/history — historique', () => {
  let rg;
  before(async () => {
    cleanDB();
    const created = await createRG({ code: 'RG-HIST' });
    rg = created.body;
    // Une mise à jour pour générer un événement updated
    await api.put(`/api/rg/${rg.id}`).send({ ...rg, titre: 'Titre v2' });
  });

  it('retourne les événements created et updated', async () => {
    const res = await api.get(`/api/rg/${rg.id}/history`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length >= 2);
    const actions = res.body.map(h => h.action);
    assert.ok(actions.includes('created'));
    assert.ok(actions.includes('updated'));
  });

  it('l\'entrée created a after_json et before_json null', async () => {
    const res = await api.get(`/api/rg/${rg.id}/history`);
    const created = res.body.find(h => h.action === 'created');
    assert.ok(created);
    assert.equal(created.before, null);
    assert.ok(created.after !== null);
  });

  it('l\'entrée updated liste les champs modifiés', async () => {
    const res = await api.get(`/api/rg/${rg.id}/history`);
    const updated = res.body.find(h => h.action === 'updated');
    assert.ok(updated);
    assert.ok(Array.isArray(updated.changed_fields));
    assert.ok(updated.changed_fields.includes('titre'));
  });

  it('retourne un tableau vide pour une RG sans historique', async () => {
    // Crée une RG, supprime son historique manuellement
    const tmp = await createRG({ code: 'RG-NOHIST' });
    db.prepare('DELETE FROM rg_history WHERE rg_id = ?').run(tmp.body.id);
    const res = await api.get(`/api/rg/${tmp.body.id}/history`);
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, []);
  });
});

// ─────────────────────────────────────────────────────────────
//  Stats
// ─────────────────────────────────────────────────────────────

describe('GET /api/stats', () => {
  before(async () => {
    cleanDB();
    await createRG({ code: 'RG-S1', statut: 'Active', domaine: 'Finance', priorite: 'Critique', type_regle: 'Légale' });
    await createRG({ code: 'RG-S2', statut: 'Draft', domaine: 'Finance', priorite: 'Normale', type_regle: 'Fonctionnelle' });
    await createRG({ code: 'RG-S3', statut: 'Active', domaine: 'RH', priorite: 'Basse', type_regle: 'Technique' });
  });

  it('retourne les champs attendus', async () => {
    const res = await api.get('/api/stats');
    assert.equal(res.status, 200);
    assert.ok('total' in res.body);
    assert.ok('byStatut' in res.body);
    assert.ok('byDomaine' in res.body);
    assert.ok('byPriorite' in res.body);
    assert.ok('byType' in res.body);
    assert.ok('byGroupe' in res.body);
  });

  it('total est cohérent avec le nombre de RGs', async () => {
    const res = await api.get('/api/stats');
    assert.equal(res.body.total, 3);
  });

  it('byStatut reflète la répartition correcte', async () => {
    const res = await api.get('/api/stats');
    const active = res.body.byStatut.find(s => s.statut === 'Active');
    const draft  = res.body.byStatut.find(s => s.statut === 'Draft');
    assert.equal(active?.n, 2);
    assert.equal(draft?.n, 1);
  });
});

// ─────────────────────────────────────────────────────────────
//  Next code
// ─────────────────────────────────────────────────────────────

describe('GET /api/next-code', () => {
  before(() => cleanDB());

  it('retourne RG-001 quand la DB est vide', async () => {
    const res = await api.get('/api/next-code');
    assert.equal(res.status, 200);
    assert.equal(res.body.code, 'RG-001');
  });

  it('incrémente après création', async () => {
    await createRG({ code: 'RG-042' });
    const res = await api.get('/api/next-code');
    assert.equal(res.body.code, 'RG-043');
  });

  it('prend le max même avec des codes non séquentiels', async () => {
    await createRG({ code: 'RG-100' });
    const res = await api.get('/api/next-code');
    assert.equal(res.body.code, 'RG-101');
  });
});

// ─────────────────────────────────────────────────────────────
//  Listes d'autocomplétion
// ─────────────────────────────────────────────────────────────

describe('Listes d\'autocomplétion', () => {
  before(async () => {
    cleanDB();
    await createRG({ domaine: 'Finance', groupe: 'Groupe A', ecran: 'Page accueil' });
    await createRG({ domaine: 'RH', groupe: 'Groupe B', ecran: 'Page accueil' });
    await createRG({ domaine: 'Finance', groupe: 'Groupe A', ecran: 'Page détail' });
  });

  it('GET /api/domaines retourne les domaines distincts triés', async () => {
    const res = await api.get('/api/domaines');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.includes('Finance'));
    assert.ok(res.body.includes('RH'));
    // Pas de doublons
    assert.equal(res.body.filter(d => d === 'Finance').length, 1);
  });

  it('GET /api/groupes retourne les groupes distincts', async () => {
    const res = await api.get('/api/groupes');
    assert.equal(res.status, 200);
    assert.ok(res.body.includes('Groupe A'));
    assert.ok(res.body.includes('Groupe B'));
    assert.equal(res.body.filter(g => g === 'Groupe A').length, 1);
  });

  it('GET /api/ecrans retourne les écrans distincts', async () => {
    const res = await api.get('/api/ecrans');
    assert.equal(res.status, 200);
    assert.ok(res.body.includes('Page accueil'));
    assert.ok(res.body.includes('Page détail'));
    assert.equal(res.body.filter(e => e === 'Page accueil').length, 1);
  });
});

// ─────────────────────────────────────────────────────────────
//  Suggestion de tags
// ─────────────────────────────────────────────────────────────

describe('POST /api/suggest-tags', () => {
  it('retourne des suggestions basées sur le titre', async () => {
    const res = await api.post('/api/suggest-tags').send({
      titre: 'Calcul TVA taux réduit alimentation',
      description: '',
    });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.tags));
    assert.ok(res.body.tags.length > 0);
    // Les acronymes ont un fort poids
    assert.ok(res.body.tags.includes('tva'));
  });

  it('extrait les acronymes avec priorité haute', async () => {
    const res = await api.post('/api/suggest-tags').send({
      titre: 'Conformité RGPD et DGFIP pour les données clients',
      description: '',
    });
    assert.equal(res.status, 200);
    assert.ok(res.body.tags.includes('rgpd') || res.body.tags.includes('dgfip'));
  });

  it('exclut les tags déjà existants', async () => {
    const res = await api.post('/api/suggest-tags').send({
      titre: 'Calcul TVA',
      description: 'Règle de calcul TVA',
      tags: 'tva',
    });
    assert.equal(res.status, 200);
    assert.ok(!res.body.tags.includes('tva'));
  });

  it('retourne au maximum 8 suggestions', async () => {
    const res = await api.post('/api/suggest-tags').send({
      titre: 'Règle validation commande montant minimum seuil calcul taux facturation client',
      description: 'Description longue avec beaucoup de mots différents pour tester la limite maximale de suggestions retournées',
    });
    assert.equal(res.status, 200);
    assert.ok(res.body.tags.length <= 8);
  });

  it('gère les entrées vides sans erreur', async () => {
    const res = await api.post('/api/suggest-tags').send({});
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.tags));
  });
});
