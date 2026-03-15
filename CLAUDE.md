# RGsaver — Guide pour Claude

## Connexion MCP (à faire une seule fois)

```bash
claude mcp add rgsaver node mcp-server.js
```

Puis **redémarre Claude Code**. Le serveur MCP se connecte directement à `rgsaver.db`.

---

## Outils disponibles

| Outil | Description |
|-------|-------------|
| `list_rg` | Lister / rechercher des RG |
| `get_rg` | Lire une RG par `id` ou code (`"RG-001"`) |
| `create_rg` | Créer une RG (code auto-généré si absent) |
| `update_rg` | Modifier partiellement une RG |
| `delete_rg` | Supprimer une RG |
| `get_stats` | Stats globales du référentiel |

---

## Valeurs acceptées

| Champ | Valeurs |
|-------|---------|
| `statut` | `Active` · `Draft` · `En discussion` · `Obsolète` |
| `priorite` | `Critique` · `Haute` · `Normale` · `Basse` |
| `type_regle` | `Fonctionnelle` · `Technique` · `Ergonomie` · `Légale` · `Autre` |

---

## Stack technique

- **Backend** : Express.js + SQLite (`better-sqlite3`)
- **Recherche** : FTS5 full-text search
- **Frontend** : SPA vanilla JS (`public/index.html`)
- **MCP** : `mcp-server.js` — accès direct SQLite, historique d'audit automatique

## Démarrer l'app web

```bash
npm start        # production
npm run dev      # watch mode
```
