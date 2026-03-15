#!/usr/bin/env node
/**
 * RGsaver — Serveur MCP
 * Expose les outils CRUD sur les Règles de Gestion pour Claude Code.
 */

const { McpServer }         = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z }                 = require('zod');
const Database              = require('better-sqlite3');
const path                  = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'rgsaver.db');
const db      = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// ── helpers ────────────────────────────────────────────────────
const TRACKED = ['code','titre','description','domaine','statut','priorite','type_regle','groupe','tags','source','fichier','ecran'];

function addHistory(action, rg_id, before, after) {
  const changed = [];
  if (before && after) {
    for (const k of TRACKED) {
      if ((before[k] ?? '') !== (after[k] ?? '')) changed.push(k);
    }
  }
  db.prepare(`INSERT INTO rg_history (rg_id, action, before_json, after_json, changed_fields)
              VALUES (?,?,?,?,?)`)
    .run(rg_id, action,
      before ? JSON.stringify(before) : null,
      after  ? JSON.stringify(after)  : null,
      JSON.stringify(changed));
}

function sanitizeFTS(q) {
  return q.replace(/["'()*:^]/g, ' ').trim();
}

// ── serveur MCP ────────────────────────────────────────────────
const server = new McpServer({ name: 'rgsaver', version: '1.0.0' });

// ── list_rg ────────────────────────────────────────────────────
server.tool(
  'list_rg',
  'Recherche et liste des Règles de Gestion avec filtres optionnels.',
  {
    q:          z.string().optional().describe('Texte libre (recherche full-text)'),
    domaine:    z.string().optional().describe('Filtrer par domaine'),
    statut:     z.enum(['Active','Draft','En discussion','Obsolète']).optional(),
    priorite:   z.enum(['Critique','Haute','Normale','Basse']).optional(),
    type_regle: z.enum(['Fonctionnelle','Technique','Ergonomie','Légale','Autre']).optional(),
    groupe:     z.string().optional().describe('Filtrer par groupe'),
    limit:      z.number().int().min(1).max(200).default(20),
    offset:     z.number().int().min(0).default(0),
    sort:       z.enum(['date','code']).default('date'),
  },
  ({ q, domaine, statut, priorite, type_regle, groupe, limit, offset, sort }) => {
    const filters = { domaine, statut, priorite, type_regle, groupe };
    let filterSql = '', filterParams = [];
    const map = { domaine:'domaine', statut:'statut', priorite:'priorite', type_regle:'type_regle', groupe:'groupe' };
    for (const [k, col] of Object.entries(map)) {
      if (filters[k]) { filterSql += ` AND ${col} = ?`; filterParams.push(filters[k]); }
    }

    let rows, total;

    if (q && q.trim()) {
      const safe  = sanitizeFTS(q);
      const terms = safe.split(/\s+/).filter(Boolean);
      if (!terms.length) { rows = []; total = 0; }
      else {
        const ftsQuery = terms.map(t => `"${t}"*`).join(' ');
        const where  = `WHERE regles_fts MATCH ?${filterSql}`;
        const params = [ftsQuery, ...filterParams];
        const order  = sort === 'code' ? 'r.code ASC' : 'r.updated_at DESC';
        try {
          total = db.prepare(`SELECT COUNT(*) as n FROM regles r JOIN regles_fts ON regles_fts.rowid = r.id ${where}`).get(...params).n;
          rows  = db.prepare(`SELECT r.* FROM regles r JOIN regles_fts ON regles_fts.rowid = r.id ${where} ORDER BY ${order} LIMIT ${limit} OFFSET ${offset}`).all(...params);
        } catch { rows = []; total = 0; }
      }
    } else {
      const where  = `WHERE 1=1${filterSql}`;
      const order  = sort === 'code' ? 'code ASC' : 'updated_at DESC';
      total = db.prepare(`SELECT COUNT(*) as n FROM regles ${where}`).get(...filterParams).n;
      rows  = db.prepare(`SELECT * FROM regles ${where} ORDER BY ${order} LIMIT ${limit} OFFSET ${offset}`).all(...filterParams);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ items: rows, total, hasMore: offset + rows.length < total }, null, 2),
      }],
    };
  }
);

// ── get_rg ─────────────────────────────────────────────────────
server.tool(
  'get_rg',
  'Lire une Règle de Gestion par son id ou son code (ex: RG-001).',
  { id: z.union([z.number().int(), z.string()]).describe('id numérique ou code RG-XXX') },
  ({ id }) => {
    const rg = typeof id === 'number' || /^\d+$/.test(String(id))
      ? db.prepare('SELECT * FROM regles WHERE id = ?').get(Number(id))
      : db.prepare('SELECT * FROM regles WHERE code = ?').get(id);

    if (!rg) return { content: [{ type: 'text', text: 'Règle non trouvée.' }] };
    return { content: [{ type: 'text', text: JSON.stringify(rg, null, 2) }] };
  }
);

// ── get_history ────────────────────────────────────────────────
server.tool(
  'get_history',
  "Consulter l'historique des modifications d'une Règle de Gestion.",
  { id: z.number().int().describe('id de la règle') },
  ({ id }) => {
    const rows = db.prepare('SELECT * FROM rg_history WHERE rg_id = ? ORDER BY created_at DESC LIMIT 50').all(id);
    const parsed = rows.map(h => ({
      ...h,
      before: h.before_json ? JSON.parse(h.before_json) : null,
      after:  h.after_json  ? JSON.parse(h.after_json)  : null,
      changed_fields: h.changed_fields ? JSON.parse(h.changed_fields) : [],
    }));
    return { content: [{ type: 'text', text: JSON.stringify(parsed, null, 2) }] };
  }
);

// ── create_rg ──────────────────────────────────────────────────
server.tool(
  'create_rg',
  'Créer une nouvelle Règle de Gestion. Le code est auto-généré si non fourni.',
  {
    code:       z.string().optional().describe('Ex: RG-042 (auto si absent)'),
    titre:      z.string().min(1).describe('Titre court de la règle'),
    description:z.string().default(''),
    domaine:    z.string().default(''),
    statut:     z.enum(['Active','Draft','En discussion','Obsolète']).default('Draft'),
    priorite:   z.enum(['Critique','Haute','Normale','Basse']).default('Normale'),
    type_regle: z.enum(['Fonctionnelle','Technique','Ergonomie','Légale','Autre']).default('Fonctionnelle'),
    groupe:     z.string().default(''),
    tags:       z.string().default(''),
    source:     z.string().default(''),
    fichier:    z.string().default(''),
    ecran:      z.string().default(''),
  },
  (fields) => {
    // Auto-génération du code si absent
    if (!fields.code) {
      const rows = db.prepare('SELECT code FROM regles').all();
      let max = 0;
      for (const { code } of rows) {
        const m = code.match(/(\d+)$/);
        if (m) max = Math.max(max, parseInt(m[1]));
      }
      fields.code = `RG-${String(max + 1).padStart(3, '0')}`;
    }

    const r = db.prepare(`
      INSERT INTO regles (code,titre,description,domaine,statut,priorite,type_regle,groupe,tags,source,fichier,ecran)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(fields.code, fields.titre, fields.description, fields.domaine,
           fields.statut, fields.priorite, fields.type_regle, fields.groupe,
           fields.tags, fields.source, fields.fichier, fields.ecran);

    const created = db.prepare('SELECT * FROM regles WHERE id = ?').get(r.lastInsertRowid);
    addHistory('created', created.id, null, created);
    return { content: [{ type: 'text', text: JSON.stringify(created, null, 2) }] };
  }
);

// ── update_rg ──────────────────────────────────────────────────
server.tool(
  'update_rg',
  'Mettre à jour une Règle de Gestion existante (seuls les champs fournis sont modifiés).',
  {
    id:         z.number().int().describe('id de la règle à modifier'),
    code:       z.string().optional(),
    titre:      z.string().optional(),
    description:z.string().optional(),
    domaine:    z.string().optional(),
    statut:     z.enum(['Active','Draft','En discussion','Obsolète']).optional(),
    priorite:   z.enum(['Critique','Haute','Normale','Basse']).optional(),
    type_regle: z.enum(['Fonctionnelle','Technique','Ergonomie','Légale','Autre']).optional(),
    groupe:     z.string().optional(),
    tags:       z.string().optional(),
    source:     z.string().optional(),
    fichier:    z.string().optional(),
    ecran:      z.string().optional(),
  },
  ({ id, ...fields }) => {
    const before = db.prepare('SELECT * FROM regles WHERE id = ?').get(id);
    if (!before) return { content: [{ type: 'text', text: 'Règle non trouvée.' }] };

    // Merge : on garde l'ancienne valeur pour les champs non fournis
    const merged = {};
    for (const k of TRACKED) {
      merged[k] = fields[k] !== undefined ? fields[k] : before[k];
    }

    db.prepare(`
      UPDATE regles
      SET code=?,titre=?,description=?,domaine=?,statut=?,priorite=?,type_regle=?,groupe=?,tags=?,source=?,fichier=?,ecran=?,updated_at=datetime('now')
      WHERE id=?
    `).run(merged.code, merged.titre, merged.description, merged.domaine,
           merged.statut, merged.priorite, merged.type_regle, merged.groupe,
           merged.tags, merged.source, merged.fichier, merged.ecran, id);

    const after = db.prepare('SELECT * FROM regles WHERE id = ?').get(id);
    addHistory('updated', id, before, after);
    return { content: [{ type: 'text', text: JSON.stringify(after, null, 2) }] };
  }
);

// ── delete_rg ──────────────────────────────────────────────────
server.tool(
  'delete_rg',
  'Supprimer définitivement une Règle de Gestion (enregistré dans l\'historique).',
  { id: z.number().int().describe('id de la règle à supprimer') },
  ({ id }) => {
    const before = db.prepare('SELECT * FROM regles WHERE id = ?').get(id);
    if (!before) return { content: [{ type: 'text', text: 'Règle non trouvée.' }] };
    db.prepare('DELETE FROM regles WHERE id = ?').run(id);
    addHistory('deleted', id, before, null);
    return { content: [{ type: 'text', text: `Règle ${before.code} — "${before.titre}" supprimée.` }] };
  }
);

// ── get_stats ──────────────────────────────────────────────────
server.tool(
  'get_stats',
  'Obtenir les statistiques globales du référentiel de RG.',
  {},
  () => {
    const stats = {
      total:      db.prepare('SELECT COUNT(*) as n FROM regles').get().n,
      byStatut:   db.prepare('SELECT statut, COUNT(*) as n FROM regles GROUP BY statut ORDER BY statut').all(),
      byDomaine:  db.prepare("SELECT domaine, COUNT(*) as n FROM regles WHERE domaine != '' GROUP BY domaine ORDER BY n DESC").all(),
      byPriorite: db.prepare('SELECT priorite, COUNT(*) as n FROM regles GROUP BY priorite').all(),
      byType:     db.prepare("SELECT type_regle, COUNT(*) as n FROM regles GROUP BY type_regle ORDER BY n DESC").all(),
    };
    return { content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }] };
  }
);

// ── démarrage ──────────────────────────────────────────────────
const transport = new StdioServerTransport();
server.connect(transport);
