/**
 * seed-2000.js — Génère 2000 règles de gestion réalistes
 * Usage : node scripts/seed-2000.js [--reset]
 *   --reset : vide la table avant d'insérer
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'rgsaver.db');
const RESET   = process.argv.includes('--reset');
const TARGET  = 2000;

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// ── Données sources ────────────────────────────────────────────

const DOMAINES = [
  'Commande', 'Facturation', 'Stock', 'Client', 'Livraison',
  'Interface', 'Paiement', 'Catalogue', 'Notification', 'Reporting',
  'Import/Export', 'Administration', 'API', 'Sécurité', 'Mobile',
];

const TYPES = [
  'Fonctionnelle', 'Fonctionnelle', 'Fonctionnelle', 'Fonctionnelle', // 40% fonctionnelle
  'Ergonomie', 'Ergonomie',                                           // 20% ergonomie
  'Technique', 'Technique',                                           // 20% technique
  'Légale',                                                           // 10% légale
  'Sécurité', 'Performance',                                          // 10% autres
];

const STATUTS = [
  'Active','Active','Active','Active','Active','Active','Active',      // 70%
  'Draft','Draft',                                                     // 20%
  'En discussion',                                                     // 7%
  'Obsolète',                                                          // 3%
];

const PRIORITES = [
  'Normale','Normale','Normale','Normale','Normale',                   // 50%
  'Haute','Haute','Haute',                                             // 30%
  'Critique',                                                          // 10%
  'Basse',                                                             // 10%
];

const GROUPES = [
  'CDC v2.1 — Commandes', 'CDC v2.1 — Facturation', 'CDC v2.1 — Stock',
  'CDC v3.0 — Refonte client', 'CDC v3.0 — Paiement',
  'Sprint 18 — UX', 'Sprint 19 — Performance', 'Sprint 20 — Sécurité',
  'Sprint 21 — Mobile', 'Sprint 22 — API',
  'Réglementation 2023', 'Réglementation 2024 — RGPD',
  'Charte graphique v2', 'Guide d\'accessibilité RGAA',
  'Contrat Logista — Annexe B', 'Contrat Stripe — Paiements',
  'Audit sécurité Q3 2024', 'Revue technique Q4 2024',
  'Backlog produit 2025', '',  '', '', // 30% sans groupe
];

const SOURCES = [
  'CDC v2.1 section {n}', 'Direction juridique — note {y}', 'DPO — politique v{n}',
  'Responsable logistique — réunion {y}-{m}', 'Comptabilité — demande Q{n} {y}',
  'UX Designer — atelier {y}-{m}', 'Architecte technique — ADR-{n}',
  'Audit sécurité {y}', 'Chef de projet — spec {y}',
  'JIRA {p}-{n}', 'Confluence — page {n}', 'Email équipe du {y}-{m}-{d}',
  'PO — atelier de raffinement {y}-{m}', 'RGPD DPO note {n}',
  'DGFiP — guide {y}', 'Contrat partenaire rev.{n}',
];

// Templates par domaine
const TEMPLATES = {
  Commande: [
    { t: 'Validation du montant minimum de commande pour {ctx}',
      d: 'Le montant total d\'une commande {ctx} doit être supérieur ou égal à {n} € avant calcul des frais. En dessous de ce seuil, la commande est rejetée avec un message explicite à l\'utilisateur.',
      tags: 'montant, validation, seuil, commande', ecran: 'Page panier' },
    { t: 'Limite du nombre de lignes par commande {ctx}',
      d: 'Une commande {ctx} ne peut pas dépasser {n} références distinctes. Cette limite est imposée par les contraintes du WMS. Un message d\'erreur clair est affiché si la limite est atteinte.',
      tags: 'limite, lignes, commande, WMS', fichier: 'src/orders/validators/OrderLimitsValidator.java' },
    { t: 'Délai d\'annulation d\'une commande {ctx}',
      d: 'Une commande {ctx} peut être annulée par le client dans un délai de {n} heures après sa validation, à condition qu\'elle ne soit pas encore en préparation. Au-delà, seule la rétractation est possible.',
      tags: 'annulation, délai, commande', ecran: 'Espace client — mes commandes' },
    { t: 'Règle de priorité de traitement des commandes {ctx}',
      d: 'Les commandes {ctx} sont traitées par ordre de validation. Les commandes Premium sont prioritaires sur les commandes Standard à heure égale. Les commandes express sont traitées avant toutes les autres.',
      tags: 'priorité, traitement, file, premium', fichier: 'src/orders/OrderProcessor.java' },
    { t: 'Gestion des ruptures de stock en commande {ctx}',
      d: 'Si un article d\'une commande {ctx} passe en rupture de stock après validation, le client est notifié par email. Il peut choisir d\'attendre le réapprovisionnement ou d\'annuler la ligne concernée.',
      tags: 'rupture, stock, notification, commande' },
    { t: 'Fusion automatique des commandes {ctx}',
      d: 'Deux commandes {ctx} passées par le même client dans un délai de {n} minutes et expédiées à la même adresse peuvent être fusionnées automatiquement si elles ne sont pas encore en préparation.',
      tags: 'fusion, commande, délai, optimisation', fichier: 'src/orders/OrderMergeService.java' },
  ],
  Facturation: [
    { t: 'Calcul de la TVA pour {ctx}',
      d: 'La TVA est calculée sur le prix HT de chaque ligne puis sommée. Taux applicable pour {ctx} : {n}%. Aucun arrondi intermédiaire n\'est appliqué ; l\'arrondi final se fait au centime le plus proche.',
      tags: 'TVA, calcul, fiscal, taux', fichier: 'src/billing/TaxCalculator.java' },
    { t: 'Numérotation des factures {ctx}',
      d: 'Les factures {ctx} suivent un format séquentiel unique : F-{y}-{seq}. La numérotation est continue et ne peut pas avoir de trous. En cas d\'annulation, un avoir est émis avec le préfixe AV-.',
      tags: 'numérotation, facture, séquentiel', fichier: 'src/billing/InvoiceNumberingService.java' },
    { t: 'Délai d\'émission des factures {ctx}',
      d: 'Les factures {ctx} doivent être émises dans les {n} jours ouvrés suivant la livraison ou la prestation. Un email de relance automatique est envoyé si la facture n\'est pas payée sous {n2} jours.',
      tags: 'délai, facturation, émission, relance', ecran: 'Backoffice facturation' },
    { t: 'Mention légales obligatoires sur facture {ctx}',
      d: 'Toute facture {ctx} doit obligatoirement mentionner : numéro SIRET, numéro TVA intracommunautaire, conditions de paiement, mentions légales selon l\'article L441-9 du Code de commerce.',
      tags: 'mentions légales, facture, conformité', fichier: 'src/billing/InvoiceGenerator.java' },
    { t: 'Gestion des avoirs {ctx}',
      d: 'Un avoir {ctx} peut être émis uniquement par un utilisateur avec le rôle BILLING_ADMIN. L\'avoir doit référencer la facture d\'origine. Le montant de l\'avoir ne peut pas dépasser celui de la facture.',
      tags: 'avoir, facture, remboursement, rôle' },
    { t: 'Archivage des factures {ctx}',
      d: 'Les factures {ctx} doivent être conservées pendant 10 ans conformément à l\'article L123-22 du Code de commerce. Elles sont archivées au format PDF/A-3 dans le système de GED.',
      tags: 'archivage, conservation, légal, GED', fichier: 'src/billing/InvoiceArchiver.java' },
  ],
  Stock: [
    { t: 'Seuil d\'alerte de réapprovisionnement {ctx}',
      d: 'Quand le stock disponible d\'un article {ctx} passe sous le seuil d\'alerte configuré, une demande de réapprovisionnement est créée automatiquement. Le seuil par défaut est {n} unités.',
      tags: 'stock, seuil, alerte, réapprovisionnement', fichier: 'src/stock/ReplenishmentService.java' },
    { t: 'Règle de valorisation du stock {ctx}',
      d: 'Le stock {ctx} est valorisé selon la méthode FIFO (premier entré, premier sorti). La valeur unitaire est recalculée à chaque mouvement de stock entrant.',
      tags: 'valorisation, FIFO, stock, coût', fichier: 'src/stock/StockValuationService.java' },
    { t: 'Gestion des emplacements en entrepôt {ctx}',
      d: 'Chaque article {ctx} est associé à un emplacement principal et un emplacement secondaire dans l\'entrepôt. En cas d\'indisponibilité de l\'emplacement principal, le picking se fait sur le secondaire.',
      tags: 'emplacement, entrepôt, picking, WMS', ecran: 'Backoffice entrepôt' },
    { t: 'Blocage de lot {ctx}',
      d: 'Un lot {ctx} peut être bloqué par le responsable qualité. Un lot bloqué n\'est pas disponible à la vente ni à la préparation. Le déblocage nécessite une validation explicite.',
      tags: 'lot, blocage, qualité, contrôle', fichier: 'src/stock/LotBlockingService.java' },
    { t: 'Inventaire tournant {ctx}',
      d: 'Un inventaire tournant {ctx} doit être effectué sur {n}% des références chaque mois. Les articles à forte rotation sont inventoriés en priorité. Les écarts > {n2}% déclenchent une alerte.',
      tags: 'inventaire, tournant, comptage, écart', ecran: 'Terminal mobile entrepôt' },
    { t: 'Traçabilité des mouvements de stock {ctx}',
      d: 'Tout mouvement de stock {ctx} (entrée, sortie, transfert, ajustement) doit être tracé avec l\'utilisateur, la date, la quantité et la raison. La traçabilité est conservée {n} ans.',
      tags: 'traçabilité, mouvement, audit, stock', fichier: 'src/stock/StockMovementTracker.java' },
  ],
  Client: [
    { t: 'Règle de validation du compte client {ctx}',
      d: 'La création d\'un compte client {ctx} nécessite une validation de l\'adresse email par lien de confirmation. Le lien expire après {n} heures. Sans validation, le compte est en statut PENDING.',
      tags: 'compte, validation, email, confirmation', ecran: 'Page inscription', fichier: 'src/customers/RegistrationService.java' },
    { t: 'Segmentation client {ctx}',
      d: 'Les clients {ctx} sont segmentés selon leur CA annuel : Bronze (<{n}€), Argent ({n}-{n2}€), Or (>{n2}€). La segmentation est recalculée le 1er janvier. Elle détermine les avantages et remises applicables.',
      tags: 'segmentation, fidélité, CA, segment', fichier: 'src/customers/CustomerSegmentationJob.java' },
    { t: 'Consentement RGPD {ctx}',
      d: 'La collecte de données personnelles {ctx} requiert un consentement explicite et granulaire. Le consentement doit être tracé avec la date, la version des CGU et l\'IP. Il peut être retiré à tout moment.',
      tags: 'RGPD, consentement, données, conformité', ecran: 'Page inscription / préférences', fichier: 'src/gdpr/ConsentService.java' },
    { t: 'Droit à l\'oubli {ctx}',
      d: 'Sur demande d\'un client {ctx}, ses données personnelles doivent être anonymisées sous {n} jours (RGPD art. 17). Les données de facturation sont conservées {n2} ans pour obligation légale.',
      tags: 'RGPD, oubli, anonymisation, données', fichier: 'src/gdpr/DataDeletionService.java' },
    { t: 'Adresses de livraison {ctx}',
      d: 'Un client {ctx} peut enregistrer jusqu\'à {n} adresses de livraison. Une adresse par défaut est obligatoire. La suppression de l\'adresse par défaut force la désignation d\'une autre adresse.',
      tags: 'adresse, livraison, carnet, client', ecran: 'Espace client — adresses' },
    { t: 'Historique des achats {ctx}',
      d: 'L\'historique des achats {ctx} est visible par le client sur {n} mois glissants. Les commandes annulées sont affichées avec le statut ANNULÉE. Le téléchargement des factures est disponible.',
      tags: 'historique, achats, commandes, client', ecran: 'Espace client — historique' },
  ],
  Livraison: [
    { t: 'Délai de livraison pour {ctx}',
      d: 'Les commandes {ctx} sont livrées sous {n} jours ouvrés en France métropolitaine. En cas de dépassement, le client reçoit une notification automatique avec le nouveau délai estimé.',
      tags: 'livraison, délai, notification', fichier: 'src/shipping/DeliveryTimeCalculator.java' },
    { t: 'Règle de choix du transporteur {ctx}',
      d: 'Le transporteur pour {ctx} est sélectionné selon le poids, le volume et la destination. En cas d\'indisponibilité du transporteur principal, le secondaire est automatiquement sélectionné.',
      tags: 'transporteur, choix, automatique, livraison', fichier: 'src/shipping/CarrierSelectionService.java' },
    { t: 'Suivi de livraison {ctx}',
      d: 'Le numéro de suivi {ctx} est communiqué au client par email dès la prise en charge par le transporteur. Le statut est mis à jour toutes les {n} heures via l\'API transporteur.',
      tags: 'suivi, tracking, transporteur, notification', ecran: 'Espace client — suivi commande' },
    { t: 'Gestion des colis perdus {ctx}',
      d: 'Un colis {ctx} est déclaré perdu après {n} jours sans mise à jour du suivi. Une investigation est ouverte automatiquement auprès du transporteur. Le client est remboursé sous {n2} jours si le colis n\'est pas retrouvé.',
      tags: 'colis, perdu, remboursement, transporteur' },
    { t: 'Livraison en point relais {ctx}',
      d: 'Le client peut choisir une livraison en point relais {ctx} parmi les {n} points les plus proches de son adresse. Le colis est disponible {n2} jours ouvrés. Un SMS de disponibilité est envoyé.',
      tags: 'point relais, livraison, SMS, disponibilité', ecran: 'Tunnel de commande — choix livraison' },
    { t: 'Règle de regroupement de livraisons {ctx}',
      d: 'Les commandes {ctx} d\'un même client livrées à la même adresse peuvent être regroupées si validées dans un délai de {n} heures. Cela réduit les frais et l\'empreinte carbone.',
      tags: 'regroupement, livraison, optimisation', fichier: 'src/shipping/DeliveryGroupingService.java' },
  ],
  Interface: [
    { t: 'Validation des formulaires {ctx}',
      d: 'Les formulaires {ctx} doivent valider les champs en temps réel (on blur). Les messages d\'erreur apparaissent sous le champ concerné en rouge. Le bouton de soumission est désactivé si le formulaire est invalide.',
      tags: 'formulaire, validation, UX, erreur', ecran: 'Tous les formulaires' },
    { t: 'Pagination des listes {ctx}',
      d: 'Les listes {ctx} affichent {n} éléments par page par défaut. L\'utilisateur peut modifier ce nombre ({n}, {n2}, {n3}). La pagination affiche le total et la plage courante.',
      tags: 'pagination, liste, affichage, UX', ecran: 'Toutes les pages liste' },
    { t: 'Messages de confirmation {ctx}',
      d: 'Toute action destructrice {ctx} doit afficher une modale de confirmation avec titre explicite, description des conséquences et bouton d\'action libellé par l\'action (pas \"OK\").',
      tags: 'confirmation, modale, UX, destructeur', ecran: 'Toutes les pages' },
    { t: 'Gestion du timeout de session {ctx}',
      d: 'Une session {ctx} inactive depuis {n} minutes affiche un avertissement {n2} minutes avant expiration. L\'utilisateur peut prolonger sa session. À expiration, il est redirigé vers la page de connexion.',
      tags: 'session, timeout, avertissement, expiration', ecran: 'Toutes les pages authentifiées' },
    { t: 'Accessibilité des couleurs {ctx}',
      d: 'Tout texte {ctx} doit respecter un ratio de contraste minimum WCAG AA (4,5:1 pour le texte normal, 3:1 pour le grand texte). Les informations ne doivent pas être transmises par la couleur seule.',
      tags: 'accessibilité, contraste, WCAG, couleur', ecran: 'Toutes les pages' },
    { t: 'Responsive design {ctx}',
      d: 'Les interfaces {ctx} doivent être utilisables sur mobile (≥320px), tablette (≥768px) et desktop (≥1024px). Les éléments interactifs ont une zone de clic minimale de 44x44px sur mobile.',
      tags: 'responsive, mobile, tablette, touch', ecran: 'Toutes les pages' },
    { t: 'Retour visuel des actions {ctx}',
      d: 'Toute action {ctx} déclenchant un traitement >300ms affiche un indicateur de chargement. L\'utilisateur ne peut pas redéclencher l\'action pendant le traitement. Un message de succès ou d\'erreur est toujours affiché.',
      tags: 'loading, feedback, UX, indicateur', ecran: 'Toutes les pages' },
    { t: 'Gestion des droits d\'accès dans l\'interface {ctx}',
      d: 'Les éléments d\'interface {ctx} non accessibles à l\'utilisateur courant sont masqués (et non désactivés). Un accès direct via URL à une ressource non autorisée redirige vers une page 403.',
      tags: 'droits, accès, masquage, 403', ecran: 'Toutes les pages', fichier: 'src/security/AccessControlFilter.java' },
  ],
  Paiement: [
    { t: 'Sécurisation des paiements {ctx}',
      d: 'Les paiements {ctx} sont traités via une page de paiement hébergée (HPP) conforme PCI-DSS. Aucune donnée de carte n\'est stockée sur nos serveurs. Le tokenisme est utilisé pour les paiements récurrents.',
      tags: 'paiement, PCI-DSS, sécurité, token', fichier: 'src/payment/PaymentGatewayService.java' },
    { t: 'Tentatives de paiement échouées {ctx}',
      d: 'Après {n} tentatives de paiement {ctx} échouées consécutives, le moyen de paiement est temporairement bloqué pendant {n2} minutes. Le client est notifié et invité à contacter sa banque.',
      tags: 'paiement, échec, blocage, tentative' },
    { t: 'Remboursement partiel {ctx}',
      d: 'Un remboursement partiel {ctx} peut être initié par un agent ADMIN uniquement. Le montant ne peut pas dépasser le montant payé. Le remboursement est effectué sur le moyen de paiement original sous {n} jours ouvrés.',
      tags: 'remboursement, partiel, paiement, admin' },
    { t: 'Paiement en plusieurs fois {ctx}',
      d: 'Le paiement en {n} fois sans frais est disponible pour les commandes {ctx} entre {n2}€ et {n3}€. La première échéance est prélevée à la commande, les suivantes à {n4} jours d\'intervalle.',
      tags: 'paiement, mensualités, facilité, échéance', ecran: 'Tunnel de commande — paiement' },
    { t: 'Réconciliation bancaire {ctx}',
      d: 'Les flux de paiement {ctx} sont réconciliés automatiquement chaque jour à {n}h avec les relevés bancaires. Les écarts sont reportés dans le tableau de bord comptabilité avec une alerte si > {n2}€.',
      tags: 'réconciliation, bancaire, comptabilité, flux', fichier: 'src/payment/BankReconciliationJob.java' },
  ],
  Catalogue: [
    { t: 'Règle de publication d\'article {ctx}',
      d: 'Un article {ctx} peut être publié uniquement s\'il possède : titre, description (>50 chars), au moins une photo, prix HT, catégorie et stock initial. La publication est validée par un CATALOG_MANAGER.',
      tags: 'publication, article, validation, catalogue', ecran: 'Backoffice catalogue' },
    { t: 'Gestion des variantes produit {ctx}',
      d: 'Un produit {ctx} peut avoir jusqu\'à {n} variantes (taille, couleur, etc.). Chaque variante a son propre stock et EAN. Une variante sans stock est affichée en "indisponible" et non masquée.',
      tags: 'variante, produit, stock, EAN', fichier: 'src/catalog/ProductVariantService.java' },
    { t: 'Règle de pricing {ctx}',
      d: 'Le prix affiché {ctx} est toujours le prix TTC arrondi au centime supérieur. Les promotions ne peuvent pas amener le prix sous le prix d\'achat + {n}%. Le barré montre le prix de référence légal.',
      tags: 'prix, TTC, promotion, barré', fichier: 'src/catalog/PricingService.java' },
    { t: 'Catégorisation des produits {ctx}',
      d: 'Un produit {ctx} doit appartenir à au moins une catégorie feuille (sans sous-catégorie). Il peut être rattaché à {n} catégories au maximum. La catégorie principale détermine le taux de TVA.',
      tags: 'catégorie, produit, TVA, arborescence', ecran: 'Backoffice catalogue' },
    { t: 'Images produit {ctx}',
      d: 'Les images {ctx} doivent être au format JPEG ou WebP, minimum {n}x{n}px, maximum {n2} Mo. La première image est l\'image principale. Les images sont automatiquement redimensionnées pour le web.',
      tags: 'image, produit, format, compression', fichier: 'src/catalog/ImageProcessingService.java' },
  ],
  Notification: [
    { t: 'Notification de changement de statut {ctx}',
      d: 'Tout changement de statut {ctx} déclenche une notification au client concerné selon ses préférences (email, SMS, push). Les notifications non délivrées sont réessayées {n} fois avec un délai exponentiel.',
      tags: 'notification, statut, email, SMS', fichier: 'src/notifications/StatusChangeNotifier.java' },
    { t: 'Désinscription aux notifications {ctx}',
      d: 'Le client peut se désinscrire de chaque type de notification {ctx} indépendamment. La désinscription est effective immédiatement. Les notifications transactionnelles (facture, confirmation) ne peuvent pas être désactivées.',
      tags: 'désinscription, notification, préférence, RGPD', ecran: 'Espace client — préférences' },
    { t: 'Templates de notification {ctx}',
      d: 'Les templates de notification {ctx} sont versionnés. Toute modification de template crée une nouvelle version. L\'historique des templates est conservé {n} ans pour traçabilité légale.',
      tags: 'template, notification, version, historique', fichier: 'src/notifications/TemplateService.java' },
    { t: 'Fréquence des notifications {ctx}',
      d: 'Un utilisateur ne peut recevoir plus de {n} notifications {ctx} par heure et {n2} par jour, hors notifications urgentes. Les notifications en excès sont regroupées en un digest quotidien.',
      tags: 'fréquence, notification, digest, limite', fichier: 'src/notifications/NotificationThrottler.java' },
  ],
  Reporting: [
    { t: 'Rapport de ventes {ctx}',
      d: 'Le rapport de ventes {ctx} est généré automatiquement chaque jour à {n}h et envoyé aux managers. Il contient : CA, nombre de commandes, panier moyen, top {n2} produits. Exportable en Excel et PDF.',
      tags: 'rapport, ventes, CA, export', ecran: 'Backoffice reporting', fichier: 'src/reporting/SalesReportJob.java' },
    { t: 'Tableau de bord temps réel {ctx}',
      d: 'Le tableau de bord {ctx} affiche les métriques en temps réel avec une latence max de {n} secondes. Les données sont mises à jour par WebSocket. En cas de déconnexion, le polling prend le relais.',
      tags: 'dashboard, temps réel, WebSocket, métriques', ecran: 'Backoffice tableau de bord' },
    { t: 'Rétention des données analytiques {ctx}',
      d: 'Les données analytiques {ctx} sont conservées à granularité journalière sur {n} ans, mensuelle sur {n2} ans. Les données brutes sont archivées sur S3 après {n3} mois.',
      tags: 'rétention, analytique, archivage, données', fichier: 'src/reporting/DataRetentionJob.java' },
    { t: 'Accès aux rapports par rôle {ctx}',
      d: 'Les rapports {ctx} sont accessibles selon les rôles : ADMIN (tous), MANAGER (domaine), ANALYST (lecture seule). Les exports de données personnelles requièrent le rôle DPO en plus.',
      tags: 'rapport, rôle, accès, DPO' },
  ],
  'Import/Export': [
    { t: 'Format d\'import des données {ctx}',
      d: 'Les imports {ctx} acceptent les formats CSV (séparateur ;, encodage UTF-8) et XLSX. La taille maximale est {n} Mo. Un fichier modèle est fourni. Les erreurs sont listées dans un rapport d\'import.',
      tags: 'import, CSV, XLSX, format', ecran: 'Backoffice import', fichier: 'src/import/FileImportService.java' },
    { t: 'Validation des données importées {ctx}',
      d: 'Avant insertion, chaque ligne importée {ctx} est validée. En cas d\'erreur sur une ligne, toute l\'opération est annulée (transaction atomique). Un rapport détaillé est généré avec les lignes en erreur.',
      tags: 'import, validation, transaction, atomique', fichier: 'src/import/ImportValidationService.java' },
    { t: 'Export RGPD {ctx}',
      d: 'Sur demande, les données personnelles {ctx} d\'un client sont exportées en JSON dans un délai de {n} jours (RGPD art. 20). L\'export est chiffré et envoyé à l\'adresse email vérifiée du compte.',
      tags: 'export, RGPD, portabilité, données', fichier: 'src/gdpr/DataPortabilityService.java' },
  ],
  Administration: [
    { t: 'Gestion des rôles utilisateur {ctx}',
      d: 'Les rôles {ctx} sont attribués par un SUPER_ADMIN uniquement. Un utilisateur peut avoir plusieurs rôles. La désactivation d\'un rôle est immédiate sur toutes les sessions actives.',
      tags: 'rôle, admin, permission, session', ecran: 'Backoffice admin — utilisateurs', fichier: 'src/admin/RoleManagementService.java' },
    { t: 'Journal d\'audit {ctx}',
      d: 'Toutes les actions d\'administration {ctx} (création, modification, suppression) sont journalisées avec l\'utilisateur, la date, l\'IP et le contenu avant/après. Le journal est en lecture seule et conservé {n} ans.',
      tags: 'audit, journal, traçabilité, admin', fichier: 'src/admin/AuditLogService.java' },
    { t: 'Configuration des paramètres système {ctx}',
      d: 'Les paramètres système {ctx} sont modifiables en backoffice par les SUPER_ADMIN. Chaque modification est tracée. Certains paramètres nécessitent un redémarrage du service pour être pris en compte.',
      tags: 'configuration, paramètres, système, admin', ecran: 'Backoffice admin — configuration' },
  ],
  API: [
    { t: 'Authentification API {ctx}',
      d: 'L\'API {ctx} utilise des tokens JWT avec une durée de vie de {n} minutes. Le refresh token est valable {n2} jours. Les tokens sont révocables. Toute requête sans token valide retourne 401.',
      tags: 'API, JWT, authentification, token', fichier: 'src/api/JwtAuthFilter.java' },
    { t: 'Rate limiting API {ctx}',
      d: 'L\'API {ctx} limite les requêtes à {n} appels par minute par token et {n2} appels par heure. En cas de dépassement, l\'API retourne 429 avec un header Retry-After. Les partenaires premium ont un quota étendu.',
      tags: 'API, rate-limit, quota, 429', fichier: 'src/api/RateLimitingFilter.java' },
    { t: 'Versioning de l\'API {ctx}',
      d: 'Les versions de l\'API {ctx} sont dans l\'URL (/api/v1/, /api/v2/). Une version est supportée {n} mois après la sortie de la suivante. La dépréciation est annoncée par header Deprecation dans les réponses.',
      tags: 'API, versioning, dépréciation, compatibilité', fichier: 'src/api/VersioningFilter.java' },
    { t: 'Format des réponses API {ctx}',
      d: 'Toutes les réponses API {ctx} suivent un format JSON unifié : data (payload), meta (pagination, total), errors (liste d\'erreurs). Les codes HTTP sont utilisés correctement (200, 201, 400, 401, 403, 404, 422, 500).',
      tags: 'API, format, JSON, HTTP', fichier: 'src/api/ResponseFormatter.java' },
  ],
  Sécurité: [
    { t: 'Politique de mot de passe {ctx}',
      d: 'Les mots de passe {ctx} doivent contenir au minimum {n} caractères, une majuscule, un chiffre et un caractère spécial. Le renouvellement est obligatoire tous les {n2} jours. Les {n3} derniers mots de passe sont mémorisés.',
      tags: 'sécurité, mot de passe, politique, complexité', ecran: 'Page connexion / profil', fichier: 'src/security/PasswordPolicyService.java' },
    { t: 'Protection CSRF {ctx}',
      d: 'Toutes les requêtes mutantes {ctx} (POST, PUT, DELETE) doivent inclure un token CSRF valide. Le token est généré à la connexion et régénéré après chaque requête mutante.',
      tags: 'CSRF, sécurité, token, protection', fichier: 'src/security/CsrfProtectionFilter.java' },
    { t: 'Chiffrement des données sensibles {ctx}',
      d: 'Les données sensibles {ctx} (IBAN, numéros de carte, données de santé) sont chiffrées au repos avec AES-256. La clé de chiffrement est stockée dans un HSM ou KMS séparé.',
      tags: 'chiffrement, AES, données sensibles, HSM', fichier: 'src/security/EncryptionService.java' },
    { t: 'Détection des comportements suspects {ctx}',
      d: 'Le système détecte les comportements suspects {ctx} : connexions depuis IPs inconnues, volume d\'actions anormal, tentatives de brute force. Une alerte est envoyée à l\'équipe sécurité et le compte peut être suspendu.',
      tags: 'sécurité, détection, anomalie, alerte', fichier: 'src/security/AnomalyDetectionService.java' },
  ],
  Mobile: [
    { t: 'Mode hors ligne de l\'application {ctx}',
      d: 'L\'application mobile {ctx} permet la consultation des données récentes en mode hors ligne. La synchronisation se lance automatiquement au retour de la connexion. Les conflits sont résolus en faveur du serveur.',
      tags: 'mobile, hors ligne, synchronisation, offline', ecran: 'Application mobile' },
    { t: 'Notifications push mobile {ctx}',
      d: 'Les notifications push {ctx} respectent les préférences de l\'OS (Do Not Disturb). Les notifications silencieuses permettent la synchronisation en arrière-plan. Le token push est rafraîchi à chaque lancement.',
      tags: 'push, mobile, notification, OS', fichier: 'src/mobile/PushNotificationService.java' },
    { t: 'Biométrie mobile {ctx}',
      d: 'L\'authentification biométrique {ctx} (Face ID, empreinte) peut remplacer la saisie du mot de passe si activée par l\'utilisateur. Le fallback vers le PIN est toujours disponible.',
      tags: 'biométrie, Face ID, empreinte, mobile', ecran: 'Application mobile — connexion' },
  ],
};

// ── Utilitaires ────────────────────────────────────────────────

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function fillTemplate(str) {
  return str
    .replace(/{n4}/g, randInt(15, 45))
    .replace(/{n3}/g, randInt(200, 2000))
    .replace(/{n2}/g, randInt(30, 365))
    .replace(/{n}/g,  randInt(3, 100))
    .replace(/{seq}/g,String(randInt(1000, 9999)).padStart(6,'0'))
    .replace(/{y}/g,  String(randInt(2022, 2025)))
    .replace(/{m}/g,  String(randInt(1, 12)).padStart(2,'0'))
    .replace(/{d}/g,  String(randInt(1, 28)).padStart(2,'0'))
    .replace(/{p}/g,  pick(['PROJ','BACK','FRONT','API','SEC','OPS']));
}

const CTX_SUFFIXES = [
  'B2B', 'B2C', 'marketplace', 'premium', 'standard',
  'web', 'mobile', 'backoffice', 'partenaire', 'API externe',
  'clients professionnels', 'clients particuliers', 'abonnés', 'invités',
  '', '', '', '', '', '', // 30% sans suffixe
];

function makeSource() {
  return fillTemplate(pick(SOURCES));
}

function makeRG(index) {
  const domaine  = pick(DOMAINES);
  const pool     = TEMPLATES[domaine] || TEMPLATES['Interface'];
  const tpl      = pick(pool);
  const ctx      = pick(CTX_SUFFIXES);
  const ctxLabel = ctx ? `(${ctx})` : '';

  const titre      = fillTemplate(tpl.t.replace('{ctx}', ctxLabel)).replace(/\s+/g,' ').trim();
  const description= fillTemplate((tpl.d || '').replace(/\{ctx\}/g, ctx || 'standard'));
  const fichier    = tpl.fichier && Math.random() > 0.3 ? tpl.fichier : '';
  const ecran      = tpl.ecran   && Math.random() > 0.4 ? tpl.ecran   : '';

  return {
    code:        `RG-${String(index).padStart(4, '0')}`,
    titre,
    description,
    domaine,
    statut:      pick(STATUTS),
    priorite:    pick(PRIORITES),
    type_regle:  pick(TYPES),
    groupe:      pick(GROUPES),
    tags:        fillTemplate(tpl.tags || ''),
    source:      makeSource(),
    fichier,
    ecran,
  };
}

// ── Insertion ──────────────────────────────────────────────────

if (RESET) {
  console.log('⚠  Suppression de toutes les règles existantes...');
  db.prepare('DELETE FROM regles').run();
  db.prepare('DELETE FROM rg_history').run();
}

const existing = db.prepare('SELECT COUNT(*) as n FROM regles').get().n;
const start    = existing + 1;
const toInsert = TARGET - existing;

if (toInsert <= 0) {
  console.log(`✓ La base contient déjà ${existing} règles (objectif : ${TARGET}). Rien à insérer.`);
  console.log('  Utilisez --reset pour vider et re-générer.');
  process.exit(0);
}

console.log(`\n  Génération de ${toInsert} règles (${existing} existantes → objectif ${TARGET})…\n`);

const ins = db.prepare(`
  INSERT INTO regles (code, titre, description, domaine, statut, priorite, type_regle, groupe, tags, source, fichier, ecran)
  VALUES (@code, @titre, @description, @domaine, @statut, @priorite, @type_regle, @groupe, @tags, @source, @fichier, @ecran)
`);

const insertBatch = db.transaction((rows) => {
  for (const row of rows) ins.run(row);
});

const BATCH = 200;
const t0 = Date.now();
let inserted = 0;

for (let i = 0; i < toInsert; i += BATCH) {
  const batch = [];
  for (let j = 0; j < BATCH && i + j < toInsert; j++) {
    batch.push(makeRG(start + i + j));
  }
  insertBatch(batch);
  inserted += batch.length;
  const pct = Math.round((inserted / toInsert) * 100);
  process.stdout.write(`\r  [${'█'.repeat(Math.floor(pct/5))}${'░'.repeat(20-Math.floor(pct/5))}] ${pct}% — ${inserted}/${toInsert}`);
}

const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
const total   = db.prepare('SELECT COUNT(*) as n FROM regles').get().n;

console.log(`\n\n  ✓ ${inserted} règles insérées en ${elapsed}s`);
console.log(`  ✓ Total en base : ${total} règles\n`);
