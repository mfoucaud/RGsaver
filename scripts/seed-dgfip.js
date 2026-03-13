/**
 * seed-dgfip.js — Règles de gestion pour les collectivités territoriales
 * Thèmes : marchés publics, factures, budget M57, immobilisations, subventions, PES V2
 * Sources : code de la commande publique, CGCT, instruction M57, circulaires DGFiP
 * Usage : node scripts/seed-dgfip.js
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'rgsaver.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

const ins = db.prepare(`
  INSERT INTO regles (code, titre, description, domaine, statut, priorite, type_regle, groupe, tags, source, fichier, ecran)
  VALUES (@code, @titre, @description, @domaine, @statut, @priorite, @type_regle, @groupe, @tags, @source, @fichier, @ecran)
`);

const DOMAINE = 'DGFIP';

const regles = [

  // ══════════════════════════════════════════════════════
  //  MARCHÉS PUBLICS — Seuils et procédures
  // ══════════════════════════════════════════════════════
  {
    code: 'RG-014', groupe: 'Marchés publics — Seuils et procédures',
    titre: 'Marché public sans mise en concurrence < 40 000 € HT',
    description: `En dessous de 40 000 € HT, l'acheteur public peut passer un marché sans publicité ni mise en concurrence formelle. Il doit néanmoins veiller à une bonne utilisation des deniers publics et à ne pas contracter systématiquement avec le même fournisseur. Cette règle s'applique aux fournitures, services et travaux. Le montant de 40 000 € s'apprécie en agrégeant les besoins de même nature sur l'ensemble de l'exercice budgétaire.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'marché public, seuil, 40000€, sans mise en concurrence, acheteur',
    source: 'Code de la commande publique art. R2122-8 — Décret 2019-1344', fichier: '', ecran: 'Saisie bon de commande',
  },
  {
    code: 'RG-015', groupe: 'Marchés publics — Seuils et procédures',
    titre: 'MAPA — Marché à procédure adaptée (fournitures/services < 221 000 € HT)',
    description: `Entre 40 000 € HT et 221 000 € HT pour les fournitures et services, l'acheteur suit une procédure adaptée (MAPA). Les règles de publicité et de mise en concurrence sont définies librement dans le règlement de consultation, en fonction de l'objet et du montant estimé. La publicité est obligatoire mais sans formalisme imposé ; elle peut être réalisée sur le profil d'acheteur. Le délai minimum de réception des offres doit être raisonnable (généralement 15 à 30 jours).`,
    statut: 'Active', priorite: 'Critique', type_regle: 'Légale',
    tags: 'MAPA, marché adapté, 221000€, fournitures, services, publicité',
    source: 'Code de la commande publique art. L2123-1 et R2123-1', fichier: '', ecran: 'Gestion marchés',
  },
  {
    code: 'RG-016', groupe: 'Marchés publics — Seuils et procédures',
    titre: 'Appel d\'offres ouvert — Seuils 2024 (fournitures/services)',
    description: `Pour les collectivités territoriales et leurs établissements publics, l'appel d'offres ouvert est obligatoire à partir de 221 000 € HT pour les marchés de fournitures et de services. Le délai minimum de réception des offres est de 35 jours à compter de la date d'envoi de l'avis de marché. Il peut être réduit à 15 jours si un avis de préinformation a été publié. La publication se fait au JOUE (Journal Officiel de l'Union Européenne) et au BOAMP.`,
    statut: 'Active', priorite: 'Critique', type_regle: 'Légale',
    tags: 'appel offres, seuil européen, 221000€, JOUE, BOAMP, 35 jours',
    source: 'Code de la commande publique art. L2124-2 — Règlement UE 2023/2493', fichier: '', ecran: 'Gestion marchés',
  },
  {
    code: 'RG-017', groupe: 'Marchés publics — Seuils et procédures',
    titre: 'Appel d\'offres ouvert — Seuil travaux 2024',
    description: `Pour les marchés de travaux des collectivités locales, le seuil de l'appel d'offres obligatoire est fixé à 5 538 000 € HT en 2024. En dessous, une procédure adaptée (MAPA travaux) est possible. Au-dessus du seuil communautaire, la publication est obligatoire au JOUE avec un délai minimal de 35 jours pour la remise des offres. Ce seuil est révisé tous les deux ans par la Commission européenne.`,
    statut: 'Active', priorite: 'Critique', type_regle: 'Légale',
    tags: 'appel offres, travaux, 5538000€, seuil européen, MAPA travaux',
    source: 'Code de la commande publique art. L2124-2 — Règlement UE 2023/2493', fichier: '', ecran: 'Gestion marchés',
  },
  {
    code: 'RG-018', groupe: 'Marchés publics — Seuils et procédures',
    titre: 'Dématérialisation obligatoire des marchés ≥ 40 000 € HT',
    description: `Depuis le 1er octobre 2018, la dématérialisation est obligatoire pour les marchés ≥ 25 000 € HT (seuil abaissé à 40 000 € HT pour certaines collectivités). Le profil d'acheteur dématérialisé est obligatoire pour la publication et le dépôt des offres. Les échanges (notifications, questions, réponses) doivent être réalisés par voie électronique. La signature électronique est recommandée mais non obligatoire pour les marchés < seuils européens.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'dématérialisation, profil acheteur, 40000€, signature électronique, offres',
    source: 'Code de la commande publique art. R2132-1 — Décret 2016-360', fichier: '', ecran: 'Gestion marchés — profil acheteur',
  },
  {
    code: 'RG-019', groupe: 'Marchés publics — Seuils et procédures',
    titre: 'Contrôle de légalité préfectoral sur les marchés publics',
    description: `Les marchés de travaux, fournitures et services d'un montant ≥ 209 000 € HT (seuil 2024) sont soumis à l'obligation de transmission au contrôle de légalité préfectoral. Cette transmission doit être effectuée dans les 15 jours suivant la notification du marché. En dessous de ce seuil, la transmission est facultative mais l'acheteur reste responsable de la légalité de ses actes.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'contrôle légalité, préfet, transmission, 209000€, notification',
    source: 'CGCT art. L2131-2 et L3131-2 — Code de la commande publique', fichier: '', ecran: 'Gestion marchés',
  },
  {
    code: 'RG-020', groupe: 'Marchés publics — Seuils et procédures',
    titre: 'Avances sur marchés publics — Obligation et calcul',
    description: `Pour les marchés > 50 000 € HT d'une durée > 2 mois, une avance est obligatoire si le titulaire n'y renonce pas. Le taux minimum légal est de 5 % du montant initial TTC du marché. La collectivité peut prévoir un taux plus élevé (jusqu'à 30 % en général). Le remboursement commence lorsque les paiements atteignent 65 % du montant initial et doit être terminé à 80 %. Le titulaire doit fournir une garantie à première demande si l'avance dépasse 30 % du montant HT.`,
    statut: 'Active', priorite: 'Normale', type_regle: 'Légale',
    tags: 'avance, marché public, 5%, 50000€, garantie, remboursement, 65%',
    source: 'Code de la commande publique art. R2191-3 à R2191-9', fichier: 'src/marches/AvanceService.java', ecran: 'Suivi marchés — avances',
  },
  {
    code: 'RG-021', groupe: 'Marchés publics — Seuils et procédures',
    titre: 'Délai global de paiement des marchés publics',
    description: `Le délai global de paiement (DGP) pour les collectivités territoriales est de 30 jours à compter de la réception de la demande de paiement. En cas de dépassement, des intérêts moratoires sont dus automatiquement, sans mise en demeure, au taux de la BCE majoré de 8 points. Une indemnité forfaitaire de recouvrement de 40 € est également due par facture impayée dans les délais. Pour les entreprises de sous-traitance, le délai court à partir du paiement du titulaire principal.`,
    statut: 'Active', priorite: 'Critique', type_regle: 'Légale',
    tags: 'paiement, DGP, 30 jours, intérêts moratoires, 40€, BCE, sous-traitant',
    source: 'Code de la commande publique art. L2192-10 — Décret 2013-269', fichier: 'src/facturation/PaiementService.java', ecran: 'Suivi marchés — paiements',
  },

  // ══════════════════════════════════════════════════════
  //  FACTURES PUBLIQUES
  // ══════════════════════════════════════════════════════
  {
    code: 'RG-022', groupe: 'Factures publiques — Dématérialisation',
    titre: 'Facturation électronique obligatoire via Chorus Pro',
    description: `Depuis le 1er janvier 2020, toutes les entreprises (quelle que soit leur taille) qui facturent une entité publique doivent émettre leurs factures via la plateforme Chorus Pro. Les formats acceptés sont : PDF structuré (Factur-X), XML UBL 2.1, XML CII (Cross Industry Invoice), et EDI. La facture papier n'est plus acceptée. Les collectivités territoriales doivent paramétrer leurs codes service et engagements juridiques dans Chorus Pro pour recevoir et traiter les factures.`,
    statut: 'Active', priorite: 'Critique', type_regle: 'Légale',
    tags: 'Chorus Pro, facture électronique, Factur-X, XML, UBL, fournisseur',
    source: 'Ordonnance 2014-697 — Décret 2016-1478 — DGFIP Chorus Pro', fichier: 'src/facturation/ChorusProService.java', ecran: 'Réception factures',
  },
  {
    code: 'RG-023', groupe: 'Factures publiques — Dématérialisation',
    titre: 'Mentions obligatoires sur une facture de marché public',
    description: `Une facture destinée à une collectivité publique doit comporter : le numéro SIRET du fournisseur et de la collectivité, le numéro de marché ou de bon de commande, le code service destinataire (SIRET + code), le numéro d'engagement juridique si requis, la désignation précise des prestations, les montants HT, les taux et montants de TVA, le montant TTC, les coordonnées bancaires (IBAN/BIC), et la date d'émission. L'absence de ces mentions peut entraîner un refus de la facture par l'ordonnateur ou le comptable.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Fonctionnelle',
    tags: 'facture, mentions obligatoires, SIRET, IBAN, marché, code service',
    source: 'Code de la commande publique art. R2192-1 — Arrêté du 09/12/2016', fichier: 'src/facturation/FactureValidationService.java', ecran: 'Saisie facture — vérification',
  },
  {
    code: 'RG-024', groupe: 'Factures publiques — Dématérialisation',
    titre: 'Pièces justificatives obligatoires pour le paiement',
    description: `Le comptable public ne peut payer une dépense que si elle est accompagnée des pièces justificatives réglementaires listées dans le décret PJ (nomenclature des PJ). Pour les marchés, les PJ minimales sont : l'acte d'engagement ou bon de commande, le procès-verbal de service fait, la facture. Pour les subventions : la convention signée, l'état liquidatif ou appel de fonds. Le comptable engage sa responsabilité personnelle et pécuniaire s'il paye sans PJ suffisantes.`,
    statut: 'Active', priorite: 'Critique', type_regle: 'Légale',
    tags: 'pièces justificatives, comptable, paiement, service fait, responsabilité, PJ',
    source: 'Décret 2016-33 — Instruction M57 — CGCT art. L1617-2', fichier: 'src/facturation/PiecesJustifService.java', ecran: 'Validation facture — PJ',
  },

  // ══════════════════════════════════════════════════════
  //  BUDGET M57
  // ══════════════════════════════════════════════════════
  {
    code: 'RG-025', groupe: 'Budget M57 — Règles budgétaires',
    titre: 'Débat d\'Orientation Budgétaire (DOB) obligatoire',
    description: `Les communes de plus de 3 500 habitants, les EPCI à fiscalité propre, les départements et les régions doivent organiser un débat d'orientation budgétaire (DOB) dans les 2 mois précédant l'examen du budget primitif. Ce débat porte sur les orientations budgétaires de l'exercice à venir et les engagements pluriannuels. Il donne lieu à une délibération dont la tenue constitue une condition de légalité du budget. Les collectivités < 3 500 habitants ne sont pas soumises à cette obligation.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'DOB, orientation budgétaire, 3500 habitants, délibération, budget primitif',
    source: 'CGCT art. L2312-1 et L3312-1 — Loi NOTRe 2015', fichier: '', ecran: 'Préparation budget',
  },
  {
    code: 'RG-026', groupe: 'Budget M57 — Règles budgétaires',
    titre: 'Vote du budget primitif avant le 15 avril',
    description: `Le budget primitif doit être voté avant le 15 avril de l'exercice budgétaire (sauf année de renouvellement du conseil, délai porté au 30 juin). Si le budget n'est pas voté à temps, le préfet peut saisir la chambre régionale des comptes. En l'absence de budget voté au 1er janvier, la collectivité peut engager des dépenses de fonctionnement dans la limite de 1/12e mensuel des crédits votés l'année précédente, et des dépenses d'investissement jusqu'à 1/4 du montant ouvert l'exercice précédent.`,
    statut: 'Active', priorite: 'Critique', type_regle: 'Légale',
    tags: 'budget primitif, 15 avril, vote, préfet, CRC, 1/12, investissement',
    source: 'CGCT art. L1612-2 et L1612-12 — Instruction M57', fichier: '', ecran: 'Préparation budget',
  },
  {
    code: 'RG-027', groupe: 'Budget M57 — Règles budgétaires',
    titre: 'Règle d\'équilibre réel du budget',
    description: `Le budget d'une collectivité territoriale doit être voté en équilibre réel : les recettes et les dépenses de chaque section (fonctionnement et investissement) doivent être évaluées de façon sincère. Le remboursement de la dette en capital ne peut être financé que par des ressources propres (recettes définitives). Le budget n'est pas en équilibre réel si le prélèvement sur les résultats ou le recours à l'emprunt couvre des dépenses de fonctionnement. La CRC peut être saisie en cas de budget insincère.`,
    statut: 'Active', priorite: 'Critique', type_regle: 'Légale',
    tags: 'équilibre, budget, sincérité, CRC, fonctionnement, investissement, dette',
    source: 'CGCT art. L1612-4 — Instruction M57 titre 1', fichier: '', ecran: 'Contrôle budgétaire',
  },
  {
    code: 'RG-028', groupe: 'Budget M57 — Règles budgétaires',
    titre: 'Dépenses imprévues plafonnées à 7,5 % des crédits de la section',
    description: `Les crédits pour dépenses imprévues inscrites au budget ne peuvent excéder 7,5 % des dépenses réelles prévisionnelles de chaque section (fonctionnement et investissement). Ces crédits permettent à l'exécutif de faire face à des dépenses urgentes et non prévues entre deux séances de l'assemblée délibérante. Leur utilisation est retracée dans le compte administratif. Ils ne constituent pas une enveloppe globale mais doivent être ventilés en fin d'exercice.`,
    statut: 'Active', priorite: 'Normale', type_regle: 'Légale',
    tags: 'dépenses imprévues, 7.5%, crédits, fonctionnement, investissement, exécutif',
    source: 'CGCT art. L2322-1 — Instruction M57 § 2.3.2', fichier: '', ecran: 'Préparation budget',
  },
  {
    code: 'RG-029', groupe: 'Budget M57 — Règles budgétaires',
    titre: 'Clôture de l\'exercice comptable au 31 janvier N+1',
    description: `En comptabilité publique M57, l'exercice budgétaire se clôture le 31 décembre N mais la période complémentaire s'étend jusqu'au 31 janvier N+1. Durant cette période complémentaire, les mandats et titres rattachés à l'exercice N peuvent encore être émis (reports de l'exercice antérieur, régularisations). Au-delà du 31 janvier, toute opération est rattachée à l'exercice N+1. Le compte de gestion du comptable et le compte administratif de l'ordonnateur doivent être concordants.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'clôture exercice, 31 janvier, période complémentaire, M57, compte administratif',
    source: 'Instruction M57 — CGCT art. L2342-1', fichier: 'src/budget/ClotureExerciceService.java', ecran: 'Clôture — période complémentaire',
  },
  {
    code: 'RG-030', groupe: 'Budget M57 — Règles budgétaires',
    titre: 'Virements de crédits entre chapitres — Délégation à l\'exécutif',
    description: `Les virements de crédits entre chapitres différents relèvent en principe de l'assemblée délibérante. Toutefois, celle-ci peut déléguer à l'exécutif (maire, président) la capacité de procéder à des virements entre chapitres dans la limite de 7,5 % des crédits votés de chaque chapitre. Les virements entre nature de dépenses à l'intérieur d'un même chapitre relèvent de la seule compétence de l'exécutif, sans limitation. Toute délégation doit faire l'objet d'une délibération.`,
    statut: 'Active', priorite: 'Normale', type_regle: 'Légale',
    tags: 'virement, crédits, chapitre, délégation, exécutif, 7.5%, délibération',
    source: 'CGCT art. L2311-7 — Instruction M57 § 2.4', fichier: '', ecran: 'Gestion budgétaire — virements',
  },

  // ══════════════════════════════════════════════════════
  //  IMMOBILISATIONS — Instruction M57
  // ══════════════════════════════════════════════════════
  {
    code: 'RG-031', groupe: 'Immobilisations — Comptabilité patrimoniale',
    titre: 'Seuil d\'immobilisation — Biens < 500 € comptabilisés en charges',
    description: `En instruction M57, les biens d'une valeur unitaire inférieure à 500 € HT peuvent être comptabilisés directement en charges (compte 606 — achats non stockés) plutôt qu'immobilisés. Au-delà de 500 € HT, le bien est inscrit à l'actif du bilan (comptes 21xx) et soumis à amortissement. La collectivité peut décider d'un seuil plus élevé par délibération, dans la limite de 1 000 € HT pour les communes de moins de 3 500 habitants.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Fonctionnelle',
    tags: 'immobilisation, seuil, 500€, charges, actif, amortissement, M57',
    source: 'Instruction M57 — Tome 2 — Plan de comptes', fichier: 'src/patrimoine/ImmobilisationService.java', ecran: 'Saisie immobilisation',
  },
  {
    code: 'RG-032', groupe: 'Immobilisations — Comptabilité patrimoniale',
    titre: 'Durées d\'amortissement réglementaires en M57',
    description: `L'instruction M57 fixe des durées d'amortissement minimales selon la nature des biens : bâtiments administratifs 40 ans, bâtiments à usage industriel 20 ans, voiries 30 ans, réseaux 30-40 ans, matériel roulant 5 ans, matériel de bureau et informatique 3-5 ans, logiciels 3 ans, mobilier 10 ans. L'amortissement est calculé selon le mode linéaire. Le mode dégressif est autorisé pour certains biens. Les collectivités de moins de 3 500 habitants et les SDIS ne sont pas obligatoirement soumis à l'amortissement.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'amortissement, durée, bâtiment, voirie, informatique, linéaire, M57',
    source: 'Instruction M57 — CGCT art. R2321-1 — Décret 2005-1661', fichier: 'src/patrimoine/AmortissementService.java', ecran: 'Calcul amortissements',
  },
  {
    code: 'RG-033', groupe: 'Immobilisations — Comptabilité patrimoniale',
    titre: 'Inventaire du patrimoine — Obligation de tenue',
    description: `Chaque collectivité territoriale doit tenir un inventaire de ses biens immobiliers et mobiliers. Cet inventaire, tenu par l'ordonnateur, doit être concordant avec l'état de l'actif tenu par le comptable public. Il recense pour chaque bien : la nature, la date d'acquisition, le coût d'acquisition ou de production, la durée et le montant des amortissements cumulés, la valeur nette comptable. L'inventaire physique doit être rapproché annuellement de l'actif comptable. Le préfet peut demander sa communication.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'inventaire, patrimoine, biens, ordonnateur, comptable, concordance, actif',
    source: 'CGCT art. L2241-1 — Instruction M57 Tome 2 — Circulaire 2003', fichier: 'src/patrimoine/InventaireService.java', ecran: 'Inventaire patrimoine',
  },
  {
    code: 'RG-034', groupe: 'Immobilisations — Comptabilité patrimoniale',
    titre: 'Composants d\'une immobilisation — Comptabilisation séparée',
    description: `En M57, la méthode des composants s'applique aux immobilisations dont certains éléments ont des durées d'utilisation différentes de la structure principale. Exemple : un bâtiment peut être décomposé en structure (50 ans), toiture (25 ans), façades (25 ans), installations techniques (15-20 ans). Chaque composant est alors amorti séparément. Le remplacement d'un composant est immobilisé et l'ancien composant est sorti de l'actif.`,
    statut: 'Active', priorite: 'Normale', type_regle: 'Fonctionnelle',
    tags: 'composant, immobilisation, bâtiment, toiture, amortissement, sortie actif',
    source: 'Instruction M57 Tome 2 § 3.2 — PCG art. 322-2', fichier: 'src/patrimoine/ComposantService.java', ecran: 'Saisie immobilisation — composants',
  },

  // ══════════════════════════════════════════════════════
  //  SUBVENTIONS
  // ══════════════════════════════════════════════════════
  {
    code: 'RG-035', groupe: 'Subventions — Attribution et contrôle',
    titre: 'Convention obligatoire pour les subventions > 23 000 €',
    description: `Toute subvention accordée par une collectivité territoriale à un organisme de droit privé d'un montant annuel > 23 000 € doit faire l'objet d'une convention. Cette convention précise l'objet, le montant, les conditions d'utilisation, les modalités de contrôle et les obligations de compte-rendu du bénéficiaire. Depuis la loi Egalité et Citoyenneté 2017, la collectivité peut exiger un plan de financement pluriannuel. Le défaut de convention expose la collectivité à un risque d'illégalité.`,
    statut: 'Active', priorite: 'Critique', type_regle: 'Légale',
    tags: 'subvention, convention, 23000€, organisme, contrôle, compte-rendu',
    source: 'Loi 2000-321 art. 10 — Décret 2001-495 — CGCT', fichier: 'src/subventions/ConventionService.java', ecran: 'Attribution subvention',
  },
  {
    code: 'RG-036', groupe: 'Subventions — Attribution et contrôle',
    titre: 'Rapport d\'activité annuel obligatoire pour les subventionnés',
    description: `Tout organisme bénéficiaire d'une subvention > 153 000 € doit déposer ses comptes annuels (bilan, compte de résultat, annexe) en préfecture et les publier sur son site internet. Pour les subventions entre 23 000 € et 153 000 €, un compte-rendu financier annuel justifiant l'emploi de la subvention doit être transmis à la collectivité dans les 6 mois suivant la fin de l'exercice. L'absence de ce document justifie le refus du renouvellement ou la demande de remboursement.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'subvention, rapport activité, 153000€, comptes, préfecture, 6 mois',
    source: 'Loi 2000-321 art. 10 — Décret 2001-495 art. 4 et 5', fichier: 'src/subventions/RapportActiviteService.java', ecran: 'Suivi subventions',
  },
  {
    code: 'RG-037', groupe: 'Subventions — Attribution et contrôle',
    titre: 'Subvention d\'investissement — Reprise d\'actif et règle de non-cession',
    description: `Lorsqu'une collectivité attribue une subvention d'investissement à une association ou un organisme pour l'acquisition d'un bien, la convention doit prévoir une clause de retour en cas de cession ou de dissolution dans les 10 ans. Si le bien est cédé avant ce délai, la subvention doit être remboursée prorata temporis. En comptabilité M57, les subventions d'investissement versées sont inscrites dans les comptes 204x (pour les entités publiques) ou 657 (associations) selon la nature du bénéficiaire.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'subvention investissement, non-cession, 10 ans, remboursement, 204x, clause',
    source: 'CGCT — Instruction M57 — Jurisprudence CRC', fichier: 'src/subventions/SubventionInvestService.java', ecran: 'Attribution subvention — investissement',
  },
  {
    code: 'RG-038', groupe: 'Subventions — Attribution et contrôle',
    titre: 'Interdiction de subventionner les partis et groupements politiques',
    description: `Les collectivités territoriales ne peuvent pas accorder de subventions à des partis ou groupements politiques, ni à des associations ou organismes dont l'objet est de soutenir un candidat ou un parti. Cette interdiction est absolue et s'applique quelle que soit la forme de la subvention (numéraire, nature, mise à disposition gratuite). Toute délibération accordant une telle subvention est illégale et susceptible d'annulation par le juge administratif.`,
    statut: 'Active', priorite: 'Critique', type_regle: 'Légale',
    tags: 'subvention, partis politiques, interdiction, illégalité, juge administratif',
    source: 'CGCT art. L2252-1 — Jurisprudence CE — CPC électoraux', fichier: '', ecran: 'Attribution subvention',
  },

  // ══════════════════════════════════════════════════════
  //  PES V2 — Protocole d'Echange Standard
  // ══════════════════════════════════════════════════════
  {
    code: 'RG-039', groupe: 'PES V2 — Protocole d\'Echange Standard',
    titre: 'PES V2 — Généralisation obligatoire depuis 2015',
    description: `Le Protocole d'Echange Standard version 2 (PES V2) est obligatoire pour tous les échanges dématérialisés entre les ordonnateurs (collectivités) et les comptables (trésoreries) depuis le 1er janvier 2015. Il remplace le protocole INDIGO. Le PES V2 est le format unique d'échange avec Hélios, l'application de la DGFiP pour la gestion comptable publique. La transmission des flux s'effectue via TIPI, la plateforme d'échange de la DGFiP.`,
    statut: 'Active', priorite: 'Critique', type_regle: 'Technique',
    tags: 'PES V2, Hélios, TIPI, dématérialisation, comptable, ordonnateur, INDIGO',
    source: 'Circulaire DGFiP 2013 — Instruction M57 — DGFIP Hélios', fichier: 'src/pes/PesV2Service.java', ecran: 'Envoi flux PES',
  },
  {
    code: 'RG-040', groupe: 'PES V2 — Protocole d\'Echange Standard',
    titre: 'PES V2 — Structure des flux XML',
    description: `Le PES V2 définit plusieurs types de flux XML structurés selon le schéma XSD DGFiP : PES_Aller (dépenses) contient les mandats de paiement avec les pièces justificatives ; PES_Retour contient les accusés de réception et les rejets du comptable. Chaque flux est encapsulé dans une enveloppe Bordereau avec un en-tête (BordEnTete) identifiant l'émetteur (SIRET), le destinataire, le numéro d'exercice et la date d'émission. La signature électronique de l'enveloppe est obligatoire pour les flux PES_Aller.`,
    statut: 'Active', priorite: 'Critique', type_regle: 'Technique',
    tags: 'PES V2, XML, XSD, PES_Aller, PES_Retour, mandat, SIRET, signature',
    source: 'Schéma XSD DGFiP — Documentation technique PES V2 v5.0', fichier: 'src/pes/PesV2Serializer.java', ecran: '',
  },
  {
    code: 'RG-041', groupe: 'PES V2 — Protocole d\'Echange Standard',
    titre: 'PES V2 — Pièces justificatives dématérialisées (PJ)',
    description: `Le PES V2 permet la dématérialisation des pièces justificatives (PJ). Les PJ sont jointes en annexe du flux PES_Aller au format PDF/A (archivage). Chaque PJ est identifiée par un identifiant unique, son type (selon la nomenclature réglementaire) et son empreinte numérique (hash SHA-256). La collectivité doit conserver les PJ originales pendant 10 ans. Si les PJ sont dématérialisées, leur authenticité et intégrité doivent être garanties (signature ou horodatage).`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Technique',
    tags: 'PES V2, PJ, pièces justificatives, PDF/A, SHA-256, conservation, 10 ans',
    source: 'Décret 2016-33 — Documentation PES V2 — DGFiP circulaire 2015', fichier: 'src/pes/PjAttachmentService.java', ecran: 'Gestion PJ',
  },
  {
    code: 'RG-042', groupe: 'PES V2 — Protocole d\'Echange Standard',
    titre: 'PES V2 — Flux recettes : émission et titres de recettes',
    description: `Pour les recettes, l'ordonnateur émet des titres de recettes (TR) transmis au comptable via le flux PES_Aller (volet recettes). Chaque titre doit comporter : l'identifiant du débiteur (SIRET ou NIR), la nature de la recette (code article budgétaire), le montant, le délai de paiement et la référence de la décision fondant la créance. Le comptable prend en charge les titres dans Hélios et déclenche les relances automatiques en cas de non-paiement dans les délais légaux.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Technique',
    tags: 'PES V2, recettes, titre, SIRET, NIR, comptable, Hélios, relance',
    source: 'CGCT art. L1617-5 — Documentation PES V2 — Instruction M57', fichier: 'src/pes/TitreRecetteService.java', ecran: 'Emission titres recettes',
  },
  {
    code: 'RG-043', groupe: 'PES V2 — Protocole d\'Echange Standard',
    titre: 'PES V2 — Rejet comptable et gestion des retours',
    description: `Lorsque le comptable rejette un mandat ou un titre dans Hélios, un flux PES_Retour de type "Accusé de Rejet" (AR_Rejet) est émis vers le logiciel de l'ordonnateur. Ce flux contient le motif de rejet codifié (code erreur DGFiP) et les informations permettant d'identifier la pièce rejetée. L'ordonnateur doit traiter le rejet, corriger la pièce et la renvoyer. Les rejets non traités dans un délai de 3 mois peuvent faire l'objet d'une procédure de régularisation d'office par le comptable.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Technique',
    tags: 'PES V2, rejet, PES_Retour, AR_Rejet, Hélios, motif, régularisation',
    source: 'Documentation PES V2 — Instruction DGFiP — CGCT art. L1617-2', fichier: 'src/pes/RejetComptableService.java', ecran: 'Traitement rejets',
  },
];

// ── Insertion ─────────────────────────────────────────────────
const existing = db.prepare("SELECT COUNT(*) as n FROM regles WHERE domaine = 'DGFIP'").get().n;
if (existing > 0) {
  console.log(`ℹ  ${existing} règles DGFIP déjà présentes. Suppression avant réinsertion…`);
  db.prepare("DELETE FROM regles WHERE domaine = 'DGFIP'").run();
}

const insertAll = db.transaction(() => {
  for (const r of regles) {
    ins.run({
      code:        r.code,
      titre:       r.titre,
      description: r.description,
      domaine:     DOMAINE,
      statut:      r.statut,
      priorite:    r.priorite,
      type_regle:  r.type_regle,
      groupe:      r.groupe,
      tags:        r.tags,
      source:      r.source,
      fichier:     r.fichier || '',
      ecran:       r.ecran   || '',
    });
  }
});
insertAll();

const total = db.prepare("SELECT COUNT(*) as n FROM regles WHERE domaine = 'DGFIP'").get().n;
console.log(`\n  ✓ ${total} règles collectivités territoriales insérées dans le domaine DGFIP`);
console.log(`  ✓ Total en base : ${db.prepare('SELECT COUNT(*) as n FROM regles').get().n} règles\n`);
