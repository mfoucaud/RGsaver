const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

const app = express();
const db = new Database(path.join(__dirname, 'rgsaver.db'));
db.pragma('journal_mode = WAL');

// ═══════════════════════════════════════════════════════════════
//  SCHEMA — étape 1 : tables de base (colonnes d'origine)
// ═══════════════════════════════════════════════════════════════
db.exec(`
  CREATE TABLE IF NOT EXISTS regles (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    code        TEXT NOT NULL,
    titre       TEXT NOT NULL,
    description TEXT    DEFAULT '',
    domaine     TEXT    DEFAULT '',
    statut      TEXT    DEFAULT 'Draft',
    priorite    TEXT    DEFAULT 'Normale',
    tags        TEXT    DEFAULT '',
    source      TEXT    DEFAULT '',
    lien_code   TEXT    DEFAULT '',
    created_at  TEXT    DEFAULT (datetime('now')),
    updated_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS rg_history (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    rg_id          INTEGER NOT NULL,
    action         TEXT    NOT NULL,
    before_json    TEXT,
    after_json     TEXT,
    changed_fields TEXT    DEFAULT '[]',
    created_at     TEXT    DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_statut   ON regles(statut);
  CREATE INDEX IF NOT EXISTS idx_priorite ON regles(priorite);
  CREATE INDEX IF NOT EXISTS idx_domaine  ON regles(domaine);
  CREATE INDEX IF NOT EXISTS idx_hist_rg  ON rg_history(rg_id);
`);

// ── Étape 2 : migrations idempotentes (ajoute les nouvelles colonnes) ──
for (const col of [
  'ALTER TABLE regles ADD COLUMN type_regle TEXT DEFAULT "Fonctionnelle"',
  'ALTER TABLE regles ADD COLUMN groupe     TEXT DEFAULT ""',
  'ALTER TABLE regles ADD COLUMN fichier    TEXT DEFAULT ""',
  'ALTER TABLE regles ADD COLUMN ecran      TEXT DEFAULT ""',
]) { try { db.exec(col); } catch {} }

// Indexes sur nouvelles colonnes (idempotents)
for (const idx of [
  'CREATE INDEX IF NOT EXISTS idx_type_rg ON regles(type_regle)',
  'CREATE INDEX IF NOT EXISTS idx_groupe  ON regles(groupe)',
]) { try { db.exec(idx); } catch {} }

// Copie lien_code → fichier pour les enregistrements existants
try { db.exec('UPDATE regles SET fichier = lien_code WHERE fichier = "" AND lien_code != ""'); } catch {}

// ═══════════════════════════════════════════════════════════════
//  FTS5 — reconstruit à chaque démarrage (index dérivé)
// ═══════════════════════════════════════════════════════════════
db.exec(`
  DROP TABLE   IF EXISTS regles_fts;
  DROP TRIGGER IF EXISTS rg_ai;
  DROP TRIGGER IF EXISTS rg_ad;
  DROP TRIGGER IF EXISTS rg_au;
`);
db.exec(`
  CREATE VIRTUAL TABLE regles_fts USING fts5(
    code, titre, description, domaine, tags, source,
    fichier, ecran, type_regle, groupe,
    content='regles', content_rowid='id',
    tokenize='unicode61'
  );

  INSERT INTO regles_fts(rowid, code, titre, description, domaine, tags, source, fichier, ecran, type_regle, groupe)
  SELECT id, code, titre, description, domaine, tags, source, fichier, ecran, type_regle, groupe FROM regles;

  CREATE TRIGGER rg_ai AFTER INSERT ON regles BEGIN
    INSERT INTO regles_fts(rowid, code, titre, description, domaine, tags, source, fichier, ecran, type_regle, groupe)
    VALUES (new.id, new.code, new.titre, new.description, new.domaine, new.tags, new.source, new.fichier, new.ecran, new.type_regle, new.groupe);
  END;

  CREATE TRIGGER rg_ad AFTER DELETE ON regles BEGIN
    INSERT INTO regles_fts(regles_fts, rowid, code, titre, description, domaine, tags, source, fichier, ecran, type_regle, groupe)
    VALUES ('delete', old.id, old.code, old.titre, old.description, old.domaine, old.tags, old.source, old.fichier, old.ecran, old.type_regle, old.groupe);
  END;

  CREATE TRIGGER rg_au AFTER UPDATE ON regles BEGIN
    INSERT INTO regles_fts(regles_fts, rowid, code, titre, description, domaine, tags, source, fichier, ecran, type_regle, groupe)
    VALUES ('delete', old.id, old.code, old.titre, old.description, old.domaine, old.tags, old.source, old.fichier, old.ecran, old.type_regle, old.groupe);
    INSERT INTO regles_fts(rowid, code, titre, description, domaine, tags, source, fichier, ecran, type_regle, groupe)
    VALUES (new.id, new.code, new.titre, new.description, new.domaine, new.tags, new.source, new.fichier, new.ecran, new.type_regle, new.groupe);
  END;
`);

// ═══════════════════════════════════════════════════════════════
//  SEED — données d'exemple si DB vide
// ═══════════════════════════════════════════════════════════════
if (db.prepare('SELECT COUNT(*) as n FROM regles').get().n === 0) {
  const ins = db.prepare(`
    INSERT INTO regles (code,titre,description,domaine,statut,priorite,type_regle,groupe,tags,source,fichier,ecran)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  db.transaction(() => {
    ins.run('RG-001','Montant minimum de commande',
      "Le montant total d'une commande doit être ≥ 5 € avant calcul des frais de livraison. En dessous, la commande est rejetée avec un message explicite.",
      'Commande','Active','Critique','Fonctionnelle','CDC v2.1 — Commandes',
      'montant, validation, seuil','CDC v2.1 section 4.3','src/orders/validators/OrderAmountValidator.java','');

    ins.run('RG-002','Délai de rétractation client',
      "Le client dispose de 14 jours calendaires à compter de la réception pour exercer son droit de rétractation (loi Hamon, art. L221-18). Le remboursement doit intervenir sous 14 jours après réception du retour.",
      'Commande','Active','Haute','Légale','Réglementation 2023',
      'rétractation, délai, légal, retour','Direction juridique — note 2023-07','src/orders/RetractationService.java','');

    ins.run('RG-003','Calcul de la TVA par ligne',
      "TVA calculée sur le prix HT de chaque ligne puis sommée. Taux : 20% standard, 5,5% alimentation, 10% restauration. Aucun arrondi intermédiaire ; arrondi final au centime.",
      'Facturation','Active','Critique','Fonctionnelle','',
      'TVA, calcul, fiscal, taux, arrondi','DGFiP — Guide TVA e-commerce 2024','src/billing/TaxCalculator.java','');

    ins.run('RG-004','Désactivation compte inactif',
      "Compte sans connexion depuis 24 mois → désactivé automatiquement. Email de préavis J-30. Réactivation via lien signé à usage unique.",
      'Client','Active','Normale','Technique','',
      'compte, inactivité, RGPD, email','DPO — politique conservation données v3','src/customers/AccountInactivityJob.java','');

    ins.run('RG-005','Seuil de réapprovisionnement',
      "Quand le stock disponible passe sous le seuil d'alerte du gestionnaire, une demande de réappro est créée automatiquement et assignée au fournisseur référencé. Seuil par défaut : 10 unités.",
      'Stock','Active','Haute','Fonctionnelle','',
      'stock, réapprovisionnement, alerte, fournisseur','Responsable logistique — réunion 2024-01-15','src/stock/ReplenishmentAlertService.java','');

    ins.run('RG-006','Frais de port offerts',
      "Frais de port offerts si commande HT ≥ 50 € OU client statut Premium. Règle appliquée avant tout code promo. Un seul avantage en cas de cumul.",
      'Livraison','Active','Normale','Fonctionnelle','',
      'livraison, frais, port, premium','Marketing — campagne fidélité 2023','src/shipping/ShippingCostCalculator.java','');

    ins.run('RG-007','Unicité de l\'adresse email',
      "L'email est l'identifiant unique d'un compte. Tentative de création avec email existant → erreur explicite + proposition de récupération de mot de passe. Vérification insensible à la casse.",
      'Client','Active','Critique','Fonctionnelle','',
      'email, unicité, création compte, authentification','Spécification technique auth v1.0','src/customers/CustomerRegistrationService.java','Page inscription');

    ins.run('RG-008','Facturation groupée mensuelle B2B',
      "Clients B2B paiement différé : une facture unique le dernier jour ouvré du mois, regroupant toutes les commandes validées. Avoir automatique en cas d'annulation post-facturation.",
      'Facturation','En discussion','Haute','Fonctionnelle','CDC v2.1 — Facturation',
      'B2B, facturation, mensuelle, avoir','Comptabilité — demande Q1 2025','','');

    ins.run('RG-009','Limites par commande',
      "Une commande ne peut dépasser 50 références distinctes ni 999 unités d'un même article (contrainte WMS Logista). Message d'erreur clair si limite atteinte à l'ajout panier.",
      'Commande','Active','Normale','Fonctionnelle','CDC v2.1 — Commandes',
      'limite, articles, quantité, WMS','Contrat Logista — annexe B rev.2','src/orders/validators/OrderLimitsValidator.java','');

    ins.run('RG-010','Remise fidélité par paliers',
      "Bronze <500€ → 0%, Argent 500-2000€ → 5%, Or >2000€ → 10%. Recalculé le 1er janvier. OBSOLÈTE — remplacé par le programme de points (RG-006).",
      'Client','Obsolète','Basse','Fonctionnelle','',
      'fidélité, remise, palier, CA','Ancien programme fidélité — archivé 2024-01','','');

    ins.run('RG-011','Message d\'erreur de formulaire',
      "Chaque champ en erreur affiche son message directement sous le champ concerné, en rouge, avec une icône et un texte explicite en français. Les messages génériques type \"Erreur 400\" sont interdits.",
      'Interface','Active','Haute','Ergonomie','Sprint 18 — UX',
      'ergonomie, formulaire, erreur, message, accessibilité','UX Designer — atelier 2024-09','','Tous les formulaires');

    ins.run('RG-012','Confirmation avant action destructrice',
      "Toute action irréversible (suppression, annulation de commande, désactivation) doit déclencher une modale de confirmation avec : titre explicite, description de la conséquence, bouton principal rouge libellé par l'action (ex : \"Supprimer\"), bouton secondaire \"Annuler\".",
      'Interface','Active','Haute','Ergonomie','Sprint 18 — UX',
      'ergonomie, confirmation, suppression, modale, UX','UX Designer — charte graphique v2','','Toutes les pages');

    ins.run('RG-013','Accessibilité des contrastes',
      "Tout texte affiché doit respecter un ratio de contraste minimum de 4,5:1 (WCAG AA) par rapport à son arrière-plan. Les textes de grande taille (≥18pt ou 14pt gras) peuvent avoir un ratio de 3:1.",
      'Interface','En discussion','Normale','Ergonomie','Sprint 18 — UX',
      'accessibilité, contraste, WCAG, couleur','Référentiel RGAA v4.1','','Toutes les pages');
  })();
}

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════
const TRACKED = ['code','titre','description','domaine','statut','priorite','type_regle','groupe','tags','source','fichier','ecran'];

function addHistory(action, rg_id, before, after) {
  const changed = [];
  if (before && after) {
    for (const k of TRACKED) {
      if ((before[k] ?? '') !== (after[k] ?? '')) changed.push(k);
    }
  }
  db.prepare(`INSERT INTO rg_history (rg_id, action, before_json, after_json, changed_fields) VALUES (?,?,?,?,?)`)
    .run(rg_id, action,
      before ? JSON.stringify(before) : null,
      after  ? JSON.stringify(after)  : null,
      JSON.stringify(changed));
}

function sanitizeFTS(q) {
  return q.replace(/["'()*:^]/g, ' ').trim();
}

function buildFilters(query, fields) {
  let sql = '', params = [];
  const map = { domaine: 'r.domaine', statut: 'r.statut', priorite: 'r.priorite', type_regle: 'r.type_regle', groupe: 'r.groupe' };
  for (const [k, col] of Object.entries(map)) {
    if (query[k]) { sql += ` AND ${col} = ?`; params.push(query[k]); }
  }
  return { sql, params };
}

// ═══════════════════════════════════════════════════════════════
//  MIDDLEWARE
// ═══════════════════════════════════════════════════════════════
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ═══════════════════════════════════════════════════════════════
//  ROUTES
// ═══════════════════════════════════════════════════════════════

// ── Stats ──────────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  res.json({
    total:      db.prepare('SELECT COUNT(*) as n FROM regles').get().n,
    byStatut:   db.prepare('SELECT statut,    COUNT(*) as n FROM regles GROUP BY statut    ORDER BY statut').all(),
    byDomaine:  db.prepare("SELECT domaine,   COUNT(*) as n FROM regles WHERE domaine   != '' GROUP BY domaine   ORDER BY n DESC").all(),
    byPriorite: db.prepare('SELECT priorite,  COUNT(*) as n FROM regles GROUP BY priorite').all(),
    byType:     db.prepare("SELECT type_regle,COUNT(*) as n FROM regles GROUP BY type_regle ORDER BY n DESC").all(),
    byGroupe:   db.prepare("SELECT groupe,    COUNT(*) as n FROM regles WHERE groupe    != '' GROUP BY groupe    ORDER BY n DESC LIMIT 25").all(),
  });
});

// ── Autocomplete lists ─────────────────────────────────────────
app.get('/api/domaines', (_req, res) => res.json(
  db.prepare("SELECT DISTINCT domaine FROM regles WHERE domaine != '' ORDER BY domaine").all().map(r => r.domaine)
));
app.get('/api/groupes', (_req, res) => res.json(
  db.prepare("SELECT DISTINCT groupe FROM regles WHERE groupe != '' ORDER BY groupe").all().map(r => r.groupe)
));
app.get('/api/ecrans', (_req, res) => res.json(
  db.prepare("SELECT DISTINCT ecran FROM regles WHERE ecran != '' ORDER BY ecran").all().map(r => r.ecran)
));

// ── Next code ──────────────────────────────────────────────────
app.get('/api/next-code', (_req, res) => {
  const rows = db.prepare('SELECT code FROM regles').all();
  let max = 0;
  for (const { code } of rows) {
    const m = code.match(/(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1]));
  }
  res.json({ code: `RG-${String(max + 1).padStart(3, '0')}` });
});

// ── List RGs (paginé) ──────────────────────────────────────────
app.get('/api/rg', (req, res) => {
  const { q, sort = 'date' } = req.query;
  const limit  = Math.min(parseInt(req.query.limit)  || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  const { sql: filterSql, params: filterParams } = buildFilters(req.query);

  let rows, total;

  if (q && q.trim()) {
    const safe = sanitizeFTS(q);
    const terms = safe.split(/\s+/).filter(Boolean);
    if (!terms.length) { rows = []; total = 0; }
    else {
      const ftsQuery = terms.map(t => `"${t}"*`).join(' ');
      const where = `WHERE regles_fts MATCH ?${filterSql.replace(/r\./g, 'r.')}`;
      const params = [ftsQuery, ...filterParams];
      const orderBy = sort === 'code' ? 'r.code ASC' : sort === 'date' ? 'r.updated_at DESC' : 'rank';
      try {
        total = db.prepare(`SELECT COUNT(*) as n FROM regles r JOIN regles_fts ON regles_fts.rowid = r.id ${where}`).get(...params).n;
        rows  = db.prepare(`SELECT r.*, rank FROM regles r JOIN regles_fts ON regles_fts.rowid = r.id ${where} ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${offset}`).all(...params);
      } catch { rows = []; total = 0; }
    }
  } else {
    const where = `WHERE 1=1${filterSql.replace(/r\./g, '')}`;
    const params = filterParams;
    const orderBy = sort === 'code' ? 'code ASC' : 'updated_at DESC';
    total = db.prepare(`SELECT COUNT(*) as n FROM regles ${where}`).get(...params).n;
    rows  = db.prepare(`SELECT * FROM regles ${where} ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${offset}`).all(...params);
  }

  res.json({ items: rows, total, hasMore: offset + rows.length < total });
});

// ── Single RG ──────────────────────────────────────────────────
app.get('/api/rg/:id', (req, res) => {
  const rg = db.prepare('SELECT * FROM regles WHERE id = ?').get(req.params.id);
  if (!rg) return res.status(404).json({ error: 'Not found' });
  res.json(rg);
});

// ── History ────────────────────────────────────────────────────
app.get('/api/rg/:id/history', (req, res) => {
  const rows = db.prepare('SELECT * FROM rg_history WHERE rg_id = ? ORDER BY created_at DESC LIMIT 50').all(req.params.id);
  res.json(rows.map(h => ({
    ...h,
    before: h.before_json ? JSON.parse(h.before_json) : null,
    after:  h.after_json  ? JSON.parse(h.after_json)  : null,
    changed_fields: h.changed_fields ? JSON.parse(h.changed_fields) : [],
  })));
});

// ── Create ─────────────────────────────────────────────────────
app.post('/api/rg', (req, res) => {
  const { code, titre, description, domaine, statut, priorite, type_regle, groupe, tags, source, fichier, ecran } = req.body;
  const r = db.prepare(`
    INSERT INTO regles (code,titre,description,domaine,statut,priorite,type_regle,groupe,tags,source,fichier,ecran)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(code, titre, description||'', domaine||'', statut||'Draft', priorite||'Normale',
         type_regle||'Fonctionnelle', groupe||'', tags||'', source||'', fichier||'', ecran||'');
  const created = db.prepare('SELECT * FROM regles WHERE id = ?').get(r.lastInsertRowid);
  addHistory('created', created.id, null, created);
  res.json(created);
});

// ── Update ─────────────────────────────────────────────────────
app.put('/api/rg/:id', (req, res) => {
  const before = db.prepare('SELECT * FROM regles WHERE id = ?').get(req.params.id);
  if (!before) return res.status(404).json({ error: 'Not found' });
  const { code, titre, description, domaine, statut, priorite, type_regle, groupe, tags, source, fichier, ecran } = req.body;
  db.prepare(`
    UPDATE regles SET code=?,titre=?,description=?,domaine=?,statut=?,priorite=?,type_regle=?,groupe=?,tags=?,source=?,fichier=?,ecran=?,updated_at=datetime('now')
    WHERE id=?
  `).run(code, titre, description||'', domaine||'', statut, priorite,
         type_regle||'Fonctionnelle', groupe||'', tags||'', source||'', fichier||'', ecran||'', req.params.id);
  const after = db.prepare('SELECT * FROM regles WHERE id = ?').get(req.params.id);
  addHistory('updated', after.id, before, after);
  res.json(after);
});

// ── Delete ─────────────────────────────────────────────────────
app.delete('/api/rg/:id', (req, res) => {
  const before = db.prepare('SELECT * FROM regles WHERE id = ?').get(req.params.id);
  if (!before) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM regles WHERE id = ?').run(req.params.id);
  addHistory('deleted', before.id, before, null);
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════
//  START
// ═══════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  const nets = Object.values(os.networkInterfaces()).flat().filter(i => i.family === 'IPv4' && !i.internal);
  console.log('\n  🗂  RGsaver — Référentiel de Règles de Gestion');
  console.log(`  Local  →  http://localhost:${PORT}`);
  nets.forEach(i => console.log(`  Réseau →  http://${i.address}:${PORT}`));
  console.log();
});
