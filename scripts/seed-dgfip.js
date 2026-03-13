/**
 * seed-dgfip.js — Insère les règles de gestion DGFIP (fiscalité publique française)
 * Sources : BOFiP, impots.gouv.fr, service-public.fr, legifrance.gouv.fr
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
  //  TVA — Taux
  // ══════════════════════════════════════════════════════
  {
    code: 'RG-014', groupe: 'TVA — Taux et régimes',
    titre: 'Taux normal de TVA',
    description: `Le taux normal de TVA applicable en France métropolitaine est de 20 %. Il s'applique à toutes les opérations imposables qui ne bénéficient pas d'un taux réduit, intermédiaire ou particulier. Il s'applique notamment aux ventes de biens et prestations de services sans régime spécifique.`,
    statut: 'Active', priorite: 'Critique', type_regle: 'Légale',
    tags: 'TVA, taux normal, 20%, imposition',
    source: 'CGI art. 278 — BOFiP TVA-LIQ-30-10', fichier: 'src/tax/VatRateService.java', ecran: '',
  },
  {
    code: 'RG-015', groupe: 'TVA — Taux et régimes',
    titre: 'Taux réduit de TVA à 5,5 %',
    description: `Le taux réduit de 5,5 % s'applique notamment aux produits alimentaires destinés à la consommation humaine, aux livres (y compris numériques), aux équipements et services pour personnes handicapées, aux abonnements gaz et électricité, et aux travaux de rénovation énergétique dans les logements. Les opérations concernées sont listées à l'article 278-0 bis du CGI.`,
    statut: 'Active', priorite: 'Critique', type_regle: 'Légale',
    tags: 'TVA, taux réduit, 5.5%, alimentation, livres, énergie',
    source: 'CGI art. 278-0 bis — BOFiP TVA-LIQ-30-20', fichier: 'src/tax/VatRateService.java', ecran: '',
  },
  {
    code: 'RG-016', groupe: 'TVA — Taux et régimes',
    titre: 'Taux intermédiaire de TVA à 10 %',
    description: `Le taux intermédiaire de 10 % s'applique à la restauration (consommation sur place), aux travaux d'amélioration du logement, aux produits agricoles non transformés, aux médicaments non remboursables, au transport de voyageurs, aux droits d'entrée dans les parcs d'attractions et aux activités cinématographiques.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'TVA, taux intermédiaire, 10%, restauration, travaux, transport',
    source: 'CGI art. 278 bis — BOFiP TVA-LIQ-30-30', fichier: 'src/tax/VatRateService.java', ecran: '',
  },
  {
    code: 'RG-017', groupe: 'TVA — Taux et régimes',
    titre: 'Taux particulier de TVA à 2,1 %',
    description: `Le taux particulier de 2,1 % s'applique aux médicaments remboursables par la sécurité sociale, aux publications de presse enregistrées à la Commission Paritaire des Publications, et aux premières représentations théâtrales et de cirque. Ce taux ne s'applique qu'en France métropolitaine et dans les DOM (sauf taux spécifiques).`,
    statut: 'Active', priorite: 'Normale', type_regle: 'Légale',
    tags: 'TVA, taux particulier, 2.1%, médicaments, presse',
    source: 'CGI art. 281 quater — BOFiP TVA-LIQ-30-40', fichier: 'src/tax/VatRateService.java', ecran: '',
  },

  // ══════════════════════════════════════════════════════
  //  TVA — Franchise et régimes
  // ══════════════════════════════════════════════════════
  {
    code: 'RG-018', groupe: 'TVA — Taux et régimes',
    titre: 'Franchise en base de TVA — Seuils 2024',
    description: `La franchise en base dispense de la déclaration et du paiement de la TVA. Seuils 2024 : ventes de marchandises, fourniture de logement, restauration : seuil normal 91 900 €, seuil de tolérance 101 000 € ; prestations de services et professions libérales : seuil normal 36 800 €, seuil de tolérance 39 100 €. Le dépassement du seuil de tolérance entraîne l'assujettissement à la TVA dès le 1er jour du mois de dépassement.`,
    statut: 'Active', priorite: 'Critique', type_regle: 'Légale',
    tags: 'TVA, franchise, seuil, 91900, 36800, micro-entreprise',
    source: 'CGI art. 293 B — BOFiP TVA-DECLA-40-10', fichier: '', ecran: 'Espace professionnel — seuils franchise',
  },
  {
    code: 'RG-019', groupe: 'TVA — Taux et régimes',
    titre: 'Régime réel simplifié de TVA',
    description: `Le régime réel simplifié s'applique si le CA HT est inférieur à 840 000 € (négoce/hébergement) ou 254 000 € (services), et si la TVA annuelle nette est < 15 000 €. L'entreprise dépose une déclaration annuelle CA12 et verse deux acomptes semestriels en juillet (55 % de la TVA N-1) et décembre (40 %). Si la TVA annuelle dépasse 15 000 €, passage obligatoire au régime réel normal.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'TVA, régime simplifié, CA12, acomptes, 840000',
    source: 'CGI art. 302 septies A — BOFiP TVA-DECLA-20', fichier: '', ecran: 'Espace professionnel — déclaration TVA',
  },
  {
    code: 'RG-020', groupe: 'TVA — Taux et régimes',
    titre: 'Régime réel normal de TVA — Déclaration mensuelle',
    description: `Au régime réel normal, la TVA est déclarée et payée mensuellement via la déclaration CA3. La déclaration est déposée avant le 24 du mois suivant pour les entreprises dont le CA est > 4 M€, avant le 19 pour les autres. Si la TVA annuelle est < 4 000 €, la déclaration peut être trimestrielle sur option. Le télépaiement est obligatoire.`,
    statut: 'Active', priorite: 'Critique', type_regle: 'Légale',
    tags: 'TVA, réel normal, CA3, déclaration mensuelle, télépaiement',
    source: 'CGI art. 287 — BOFiP TVA-DECLA-20-20', fichier: 'src/tax/VatDeclarationService.java', ecran: 'Espace professionnel — déclaration TVA',
  },
  {
    code: 'RG-021', groupe: 'TVA — Taux et régimes',
    titre: 'Droit à déduction de la TVA',
    description: `La TVA sur les achats de biens et services utilisés pour les besoins d'une activité taxable est déductible. La déduction est exercée sur la déclaration du mois de réception de la facture. Les biens destinés à des opérations exonérées n'ouvrent pas droit à déduction. Le prorata de déduction s'applique aux assujettis partiels (rapport CA taxé / CA total).`,
    statut: 'Active', priorite: 'Critique', type_regle: 'Légale',
    tags: 'TVA, déduction, prorata, facture, assujetti partiel',
    source: 'CGI art. 271 — BOFiP TVA-DED-10', fichier: 'src/tax/VatDeductionService.java', ecran: '',
  },
  {
    code: 'RG-022', groupe: 'TVA — Taux et régimes',
    titre: 'Remboursement de crédit de TVA',
    description: `Un crédit de TVA peut être remboursé sur demande si son montant est ≥ 760 € (mensuel) ou ≥ 150 € (trimestriel). La demande est formulée via le formulaire n°3519 joint à la déclaration CA3. Le remboursement est effectué sous 30 jours. Un contrôle peut être déclenché pour les remboursements > 15 000 €. Les exportateurs peuvent demander un remboursement mensuel sans seuil minimum.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'TVA, crédit, remboursement, 3519, 760€, exportateur',
    source: 'CGI art. 271 V — BOFiP TVA-DED-50-20', fichier: 'src/tax/VatRefundService.java', ecran: 'Espace professionnel — remboursement TVA',
  },

  // ══════════════════════════════════════════════════════
  //  Impôt sur le Revenu
  // ══════════════════════════════════════════════════════
  {
    code: 'RG-023', groupe: 'Impôt sur le Revenu',
    titre: 'Barème progressif de l\'impôt sur le revenu 2024',
    description: `Le barème progressif de l'IR 2024 (revenus 2023) est le suivant par tranche de revenu net imposable par part de quotient familial : 0 % jusqu'à 11 294 € ; 11 % de 11 294 € à 28 797 € ; 30 % de 28 797 € à 82 341 € ; 41 % de 82 341 € à 177 106 € ; 45 % au-delà de 177 106 €. Le barème est revalorisé chaque année en fonction de l'inflation.`,
    statut: 'Active', priorite: 'Critique', type_regle: 'Légale',
    tags: 'IR, barème, tranches, progressif, 11%, 30%, 41%, 45%',
    source: 'CGI art. 197 — Loi de finances 2024 — BOFiP IR-LIQ-10', fichier: 'src/tax/IncomeTaxCalculator.java', ecran: 'Simulateur impôt — impots.gouv.fr',
  },
  {
    code: 'RG-024', groupe: 'Impôt sur le Revenu',
    titre: 'Quotient familial — Plafonnement de l\'avantage',
    description: `L'avantage fiscal procuré par chaque demi-part supplémentaire est plafonné. En 2024, le plafond est fixé à 1 759 € par demi-part au-delà de 2 parts (couple) ou de 1 part (personne seule). Des plafonnements spécifiques s'appliquent pour les parents isolés (3 956 €) et les anciens combattants. Si le plafonnement est atteint, l'impôt est calculé avec le nombre de parts plafonné.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'IR, quotient familial, demi-part, plafonnement, 1759€',
    source: 'CGI art. 197 — BOFiP IR-LIQ-10-20', fichier: 'src/tax/FamilyQuotientCalculator.java', ecran: '',
  },
  {
    code: 'RG-025', groupe: 'Impôt sur le Revenu',
    titre: 'Décote de l\'impôt sur le revenu',
    description: `La décote s'applique lorsque l'impôt brut est inférieur à 1 840 € (personne seule) ou 3 045 € (couple soumis à imposition commune). Le montant de la décote est : 833 € – 45,25 % de l'impôt brut (célibataire) ou 1 378 € – 45,25 % de l'impôt brut (couple). La décote ne peut pas aboutir à un impôt négatif.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'IR, décote, faibles revenus, 833€, 45.25%',
    source: 'CGI art. 197 I-4 — BOFiP IR-LIQ-20-10', fichier: 'src/tax/IncomeTaxCalculator.java', ecran: '',
  },
  {
    code: 'RG-026', groupe: 'Impôt sur le Revenu',
    titre: 'Délais de déclaration des revenus par zone géographique',
    description: `La déclaration de revenus en ligne est obligatoire (sauf impossibilité d'accès internet). Les délais sont fixés chaque année en mai par zone : Zone 1 (dép. 01-19 + non-résidents) : fin mai environ ; Zone 2 (dép. 20-54) : début juin ; Zone 3 (dép. 55-976) : mi-juin. La déclaration papier doit être déposée à la date de la Zone 1. Le cachet de la Poste fait foi pour les envois postaux.`,
    statut: 'Active', priorite: 'Critique', type_regle: 'Légale',
    tags: 'IR, déclaration, délai, zone, télédéclaration, papier',
    source: 'CGI art. 175 — BOFiP IR-DECLA-10-10', fichier: '', ecran: 'Déclaration en ligne — impots.gouv.fr',
  },
  {
    code: 'RG-027', groupe: 'Impôt sur le Revenu',
    titre: 'Obligation de télédéclaration',
    description: `Depuis 2019, tous les contribuables disposant d'un accès internet sont tenus de déclarer leurs revenus en ligne sur impots.gouv.fr. Les exceptions autorisées à la déclaration papier : première déclaration, résidence principale sans internet, zone blanche mobile, incapacité à utiliser le service numérique. En cas de non-respect de l'obligation, une amende forfaitaire de 15 € par déclaration peut être appliquée.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'IR, télédéclaration, obligation, internet, amende, 15€',
    source: 'CGI art. 1649 quater B quater — BOFiP IR-DECLA-10-20', fichier: '', ecran: 'Déclaration en ligne — impots.gouv.fr',
  },

  // ══════════════════════════════════════════════════════
  //  Prélèvement à la Source
  // ══════════════════════════════════════════════════════
  {
    code: 'RG-028', groupe: 'Prélèvement à la source',
    titre: 'Obligation de l\'employeur — Collecte et reversement du PAS',
    description: `L'employeur collecteur a trois obligations : (1) Appliquer le taux transmis par la DGFiP via la DSN dans un délai de 60 jours après mise à disposition. (2) Retenir le PAS sur le salaire net imposable versé. (3) Reverser le PAS prélevé le mois suivant via la DSN, déposée le 5 ou 15 du mois. Les entreprises de moins de 11 salariés peuvent reverser trimestriellement sur option.`,
    statut: 'Active', priorite: 'Critique', type_regle: 'Légale',
    tags: 'PAS, prélèvement, employeur, DSN, reversement, 60 jours',
    source: 'CGI art. 1671 — BOFiP IR-PAS-20', fichier: 'src/payroll/PasCollectionService.java', ecran: '',
  },
  {
    code: 'RG-029', groupe: 'Prélèvement à la source',
    titre: 'Taux personnalisé, individualisé et neutre du PAS',
    description: `Trois types de taux PAS coexistent : (1) Taux personnalisé (taux foyer) : calculé par la DGFiP sur la base du dernier avis d'imposition, appliqué par défaut. (2) Taux individualisé : chaque conjoint a son propre taux (dispositif activé automatiquement depuis le 01/09/2025 pour les couples). (3) Taux neutre (barème) : appliqué en l'absence de taux communiqué ou si le salarié refuse la transmission. Le taux neutre est non personnalisé et basé sur un barème publié par la DGFiP.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'PAS, taux, personnalisé, individualisé, neutre, couple',
    source: 'CGI art. 204 H — BOFiP IR-PAS-30-10', fichier: 'src/payroll/PasRateService.java', ecran: 'Espace particulier — gérer mon taux',
  },
  {
    code: 'RG-030', groupe: 'Prélèvement à la source',
    titre: 'Modulation à la hausse ou à la baisse du PAS',
    description: `Le contribuable peut moduler son taux PAS si l'écart entre le prélèvement en cours et l'impôt estimé est > 10 % et > 200 €. La modulation à la baisse est possible sur estimation de l'impôt de l'année en cours. En cas d'erreur sur l'estimation (insuffisance > 10 % et > 200 €), une majoration de 10 % s'applique sur la différence entre le PAS minoré et le PAS théorique.`,
    statut: 'Active', priorite: 'Normale', type_regle: 'Légale',
    tags: 'PAS, modulation, taux, majoration, 10%, 200€',
    source: 'CGI art. 204 J — BOFiP IR-PAS-30-20', fichier: '', ecran: 'Espace particulier — moduler mon prélèvement',
  },

  // ══════════════════════════════════════════════════════
  //  Impôt sur les Sociétés
  // ══════════════════════════════════════════════════════
  {
    code: 'RG-031', groupe: 'Impôt sur les Sociétés',
    titre: 'Taux normal de l\'impôt sur les sociétés',
    description: `Depuis 2022, le taux normal de l'IS est fixé à 25 % pour toutes les entreprises, quelle que soit leur taille. Ce taux s'applique sur le bénéfice fiscal net de l'exercice après déduction des déficits reportables. Il a été réduit progressivement : 33,1/3 % en 2018, 28 % en 2020, 26,5 % en 2021, 25 % depuis 2022.`,
    statut: 'Active', priorite: 'Critique', type_regle: 'Légale',
    tags: 'IS, taux normal, 25%, bénéfice, impôt sociétés',
    source: 'CGI art. 219 — BOFiP IS-LIQ-20-10', fichier: 'src/tax/CorporateTaxCalculator.java', ecran: '',
  },
  {
    code: 'RG-032', groupe: 'Impôt sur les Sociétés',
    titre: 'Taux réduit d\'IS pour les PME',
    description: `Les PME remplissant les conditions suivantes bénéficient d'un taux réduit de 15 % sur les 42 500 premiers euros de bénéfice : CA HT < 10 M€, capital libéré et détenu à 75 % au moins par des personnes physiques, soumises à l'IS. Au-delà de 42 500 €, le taux normal de 25 % s'applique. Le seuil de 42 500 € est proratisé si l'exercice < 12 mois.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'IS, taux réduit, PME, 15%, 42500€, capital',
    source: 'CGI art. 219 I b — BOFiP IS-LIQ-20-20', fichier: 'src/tax/CorporateTaxCalculator.java', ecran: '',
  },
  {
    code: 'RG-033', groupe: 'Impôt sur les Sociétés',
    titre: 'Acomptes d\'IS — Calendrier et calcul',
    description: `Les entreprises redevables de l'IS versent 4 acomptes aux dates fixes : 15 mars, 15 juin, 15 septembre, 15 décembre. Chaque acompte est égal à 1/4 de l'IS de l'exercice précédent (ou avant-dernier pour le 1er acompte). Les entreprises dont l'IS ≤ 3 000 € sont dispensées. Les sociétés nouvelles sont dispensées lors du premier exercice. La régularisation est effectuée au plus tard le 15 du 4e mois suivant la clôture.`,
    statut: 'Active', priorite: 'Critique', type_regle: 'Légale',
    tags: 'IS, acomptes, 15 mars, 15 juin, 15 septembre, 15 décembre, 3000€',
    source: 'CGI art. 1668 — BOFiP IS-DECLA-20-10', fichier: 'src/tax/CorporateTaxInstalmentsService.java', ecran: 'Espace professionnel — paiement IS',
  },
  {
    code: 'RG-034', groupe: 'Impôt sur les Sociétés',
    titre: 'Majoration du dernier acompte IS pour grandes entreprises',
    description: `Les entreprises dont le CA est ≥ 250 M€ sont soumises à une majoration du dernier acompte d'IS. Leur dernier acompte doit représenter au minimum : 80 % de l'IS de l'exercice si CA ≥ 250 M€ et < 1 Md€ ; 90 % si CA ≥ 1 Md€ et < 5 Md€ ; 95 % si CA ≥ 5 Md€. Cette règle vise à aligner l'IS payé en cours d'exercice avec l'IS réellement dû.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'IS, acompte, grande entreprise, 250M€, 80%, 90%, 95%',
    source: 'CGI art. 1668 — BOFiP IS-DECLA-20-10-20', fichier: 'src/tax/CorporateTaxInstalmentsService.java', ecran: '',
  },
  {
    code: 'RG-035', groupe: 'Impôt sur les Sociétés',
    titre: 'Report en avant et en arrière des déficits (IS)',
    description: `Les déficits fiscaux d'une société soumise à l'IS peuvent être reportés en avant sans limite de durée, mais plafonnés à 1 M€ + 50 % du bénéfice dépassant 1 M€ par exercice. Le report en arrière (carry-back) est limité au déficit de l'exercice, à l'IS de l'exercice précédent, et au bénéfice de cet exercice. La créance de carry-back est remboursée après 5 ans si non imputée.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'IS, déficit, report, carry-back, 1M€, 50%, imputation',
    source: 'CGI art. 209 et 220 quinquies — BOFiP IS-DEF', fichier: 'src/tax/DeficitCarryService.java', ecran: '',
  },

  // ══════════════════════════════════════════════════════
  //  Fiscalité locale — CFE / CVAE
  // ══════════════════════════════════════════════════════
  {
    code: 'RG-036', groupe: 'Fiscalité locale — CFE / CVAE',
    titre: 'Cotisation Foncière des Entreprises — Redevables et base',
    description: `La CFE est due par toute personne physique ou morale exerçant une activité professionnelle non salariée à titre habituel en France au 1er janvier de l'année d'imposition. La base est la valeur locative des biens immobiliers utilisés pour l'activité au cours de la période de référence (N-2). Les entreprises nouvelles sont exonérées la première année. La CFE est due à la commune d'implantation.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'CFE, cotisation foncière, entreprise, valeur locative, commune',
    source: 'CGI art. 1447 à 1478 — BOFiP IF-CFE-10', fichier: '', ecran: 'Espace professionnel — CFE',
  },
  {
    code: 'RG-037', groupe: 'Fiscalité locale — CFE / CVAE',
    titre: 'CFE — Cotisation minimum et exonération micro',
    description: `Une cotisation minimum est due même si la base d'imposition est faible. Son montant varie de 237 € à 7 349 € selon le CA ou les recettes de l'entreprise (barème communal). Les entreprises dont le CA annuel est ≤ 5 000 € sont exonérées de cotisation minimum. La date limite de paiement est fixée au 16 décembre chaque année. Le paiement s'effectue obligatoirement par voie dématérialisée pour les professionnels.`,
    statut: 'Active', priorite: 'Normale', type_regle: 'Légale',
    tags: 'CFE, cotisation minimum, 5000€, 16 décembre, dématérialisé',
    source: 'CGI art. 1647 D — BOFiP IF-CFE-20-20', fichier: '', ecran: 'Espace professionnel — CFE',
  },
  {
    code: 'RG-038', groupe: 'Fiscalité locale — CFE / CVAE',
    titre: 'Suppression de la CVAE et calendrier',
    description: `La Cotisation sur la Valeur Ajoutée des Entreprises (CVAE) est supprimée en deux étapes : taux divisé par 2 en 2023 (0,125 % au lieu de 0,25 %), puis suppression totale en 2024. Les entreprises dont le CA > 500 000 € n'ont donc plus à déposer de déclaration n°1329-DEF à compter de la liasse fiscale 2024. La CET (CFE + CVAE) est remplacée par la seule CFE à partir de 2024.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'CVAE, suppression, 2024, CET, CFE, 500000€',
    source: 'Loi de finances 2023 art. 55 — BOFiP IF-CVAE', fichier: '', ecran: '',
  },

  // ══════════════════════════════════════════════════════
  //  Pénalités et Majorations
  // ══════════════════════════════════════════════════════
  {
    code: 'RG-039', groupe: 'Pénalités et majorations',
    titre: 'Intérêt de retard — Taux et application',
    description: `L'intérêt de retard s'applique à toute insuffisance ou retard de paiement d'impôt. Le taux est de 0,20 % par mois (soit 2,4 % annuel). Il court à partir du 1er jour du mois suivant celui au cours duquel l'impôt devait être acquitté jusqu'au dernier jour du mois de régularisation. L'intérêt de retard se cumule avec les majorations. Il n'est pas déduit du résultat fiscal.`,
    statut: 'Active', priorite: 'Critique', type_regle: 'Légale',
    tags: 'pénalité, intérêt retard, 0.20%, 2.4% annuel, majoration',
    source: 'CGI art. 1727 — BOFiP CF-INF-10-10-10', fichier: 'src/penalty/InterestCalculationService.java', ecran: '',
  },
  {
    code: 'RG-040', groupe: 'Pénalités et majorations',
    titre: 'Majoration pour retard de déclaration',
    description: `En cas de retard ou d'absence de déclaration, les majorations sont : 10 % si la déclaration est déposée spontanément en retard ; 20 % si elle est déposée dans les 30 jours suivant une mise en demeure ; 40 % si elle n'est pas déposée dans les 30 jours de la mise en demeure ; 80 % en cas de découverte d'une activité occulte. Ces majorations s'appliquent sur les droits dus, en sus de l'intérêt de retard.`,
    statut: 'Active', priorite: 'Critique', type_regle: 'Légale',
    tags: 'pénalité, majoration, retard déclaration, 10%, 20%, 40%, 80%, mise en demeure',
    source: 'CGI art. 1728 et 1729 C bis — BOFiP CF-INF-10-20', fichier: 'src/penalty/PenaltyCalculationService.java', ecran: '',
  },
  {
    code: 'RG-041', groupe: 'Pénalités et majorations',
    titre: 'Majoration pour retard de paiement',
    description: `Tout retard de paiement d'un impôt direct (IR, IS, CFE…) est sanctionné par une majoration de 10 % du montant non payé à l'échéance (art. 1730 CGI). Pour certains impôts déclaratifs payés avec dépôt de la déclaration (TVA, retenue à la source), la majoration est de 5 % (art. 1731 CGI), sauf si la déclaration est déposée avec le paiement intégral.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'pénalité, retard paiement, 10%, 5%, TVA, impôt direct',
    source: 'CGI art. 1730 et 1731 — BOFiP CF-INF-10-30', fichier: 'src/penalty/PaymentPenaltyService.java', ecran: '',
  },
  {
    code: 'RG-042', groupe: 'Pénalités et majorations',
    titre: 'Majoration pour manquement délibéré et fraude',
    description: `En cas de manquement délibéré (mauvaise foi prouvée), la majoration est portée à 40 % des droits éludés. En cas de manœuvres frauduleuses ou d'abus de droit, elle est de 80 %. En cas de flagrance fiscale, la majoration de 40 % peut être appliquée en cours d'exercice. Ces majorations excluent l'application simultanée de la majoration de retard de déclaration.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'pénalité, fraude, mauvaise foi, 40%, 80%, flagrance, abus de droit',
    source: 'CGI art. 1729 — BOFiP CF-INF-10-20-20', fichier: 'src/penalty/FraudPenaltyService.java', ecran: '',
  },

  // ══════════════════════════════════════════════════════
  //  Crédits et Réductions d'impôt
  // ══════════════════════════════════════════════════════
  {
    code: 'RG-043', groupe: 'Crédits d\'impôt — CIR / CII',
    titre: 'Crédit d\'Impôt Recherche — Taux et assiette',
    description: `Le CIR est calculé sur les dépenses de R&D éligibles : 30 % jusqu'à 100 M€, 5 % au-delà. Les dépenses éligibles comprennent : les dépenses de personnel chercheurs/techniciens, les dotations aux amortissements des équipements R&D, les dépenses de fonctionnement (43 % des dépenses de personnel + 75 % des amortissements), les dépenses de sous-traitance (plafonnée à 10 M€ entre entreprises liées) et les dépenses de veille technologique (plafonnée à 60 000 €). Le CIR s'impute sur l'IS ou l'IR dû. Si non imputé sur 3 ans, il est remboursé.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'CIR, crédit impôt recherche, 30%, 5%, 100M€, R&D, personnel',
    source: 'CGI art. 244 quater B — BOFiP BIC-RICI-10-10', fichier: 'src/tax/ResearchTaxCreditService.java', ecran: 'Espace professionnel — CIR',
  },
  {
    code: 'RG-044', groupe: 'Crédits d\'impôt — CIR / CII',
    titre: 'Crédit d\'Impôt Innovation (CII) pour PME',
    description: `Le CII est réservé aux PME (CA < 50 M€ ou bilan < 43 M€, < 250 salariés). Il porte sur les dépenses d'innovation (conception de prototypes, installations pilotes, design non éligibles au CIR). Le taux est de 20 % (30 % en Corse et DOM) sur une assiette plafonnée à 400 000 € par an, soit un crédit maximum de 80 000 €. Le CII est cumulable avec le CIR si les dépenses sont distinctes.`,
    statut: 'Active', priorite: 'Normale', type_regle: 'Légale',
    tags: 'CII, crédit innovation, PME, 20%, 400000€, prototype, design',
    source: 'CGI art. 244 quater B II k — BOFiP BIC-RICI-10-10-30', fichier: 'src/tax/InnovationTaxCreditService.java', ecran: '',
  },
  {
    code: 'RG-045', groupe: 'Crédits d\'impôt — CIR / CII',
    titre: 'Rescrit fiscal CIR — Sécurisation juridique',
    description: `Avant d'engager des dépenses de R&D, une entreprise peut demander un rescrit CIR à la DGFiP (via le MESRI pour l'éligibilité des travaux). La réponse est opposable à l'administration pendant 3 ans. En l'absence de réponse dans les 3 mois, le silence vaut accord tacite. Le rescrit ne garantit que l'éligibilité des projets décrits, pas les montants déclarés.`,
    statut: 'Active', priorite: 'Normale', type_regle: 'Légale',
    tags: 'CIR, rescrit, sécurisation, MESRI, 3 mois, accord tacite',
    source: 'LPF art. L 80 B 3° — BOFiP BIC-RICI-10-10-40', fichier: '', ecran: 'Espace professionnel — rescrit fiscal',
  },

  // ══════════════════════════════════════════════════════
  //  Contrôle fiscal
  // ══════════════════════════════════════════════════════
  {
    code: 'RG-046', groupe: 'Contrôle fiscal et prescription',
    titre: 'Délai général de reprise de l\'administration fiscale',
    description: `Le droit de reprise de l'administration fiscale s'exerce jusqu'au 31 décembre de la 3e année suivant celle au titre de laquelle l'imposition est due (délai de droit commun). Le délai est porté à 6 ans en cas d'activité occulte ou de non-respect d'obligations déclaratives formelles. En cas de fraude fiscale caractérisée, le délai est de 10 ans. Ces délais courent à partir du 1er janvier de l'année suivant celle du fait générateur.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'contrôle, prescription, reprise, 3 ans, 6 ans, 10 ans, fraude',
    source: 'LPF art. L 169 — BOFiP CF-PGR-10-40', fichier: '', ecran: '',
  },
  {
    code: 'RG-047', groupe: 'Contrôle fiscal et prescription',
    titre: 'Vérification de comptabilité — Droits et obligations',
    description: `Lors d'une vérification de comptabilité, l'entreprise doit : présenter les documents comptables pour les 3 exercices non prescrits, permettre l'accès aux données informatiques (FEC obligatoire au format DGFiP), permettre l'accès aux locaux professionnels. Le vérificateur doit remettre un avis de vérification au moins 2 jours ouvrés avant la première intervention. La vérification ne peut excéder 3 mois pour les PME (CA < seuils régime simplifié).`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'vérification, comptabilité, FEC, avis, 2 jours, 3 mois, PME',
    source: 'LPF art. L 13 — BOFiP CF-IOR-60-10', fichier: 'src/audit/FecExportService.java', ecran: '',
  },
  {
    code: 'RG-048', groupe: 'Contrôle fiscal et prescription',
    titre: 'Fichier des Écritures Comptables (FEC)',
    description: `Toute entreprise soumise à obligation comptable doit pouvoir fournir un FEC (Fichier des Écritures Comptables) lors d'un contrôle fiscal. Le FEC doit respecter le format défini par l'arrêté du 29 juillet 2013 : 18 champs obligatoires, encodage UTF-8 ou ISO-8859-1, séparateur tabulation ou pipe, nomenclature des colonnes standardisée (JournalCode, EcritureDate, etc.). Un FEC non conforme entraîne une amende de 5 000 € ou une majoration de 10 % des droits.`,
    statut: 'Active', priorite: 'Critique', type_regle: 'Technique',
    tags: 'FEC, comptabilité, format, UTF-8, 18 champs, 5000€, arrêté 2013',
    source: 'Arrêté du 29/07/2013 — CGI art. 1729 E — BOFiP CF-IOR-60-40', fichier: 'src/audit/FecExportService.java', ecran: '',
  },

  // ══════════════════════════════════════════════════════
  //  Déclarations et obligations
  // ══════════════════════════════════════════════════════
  {
    code: 'RG-049', groupe: 'Déclarations et obligations',
    titre: 'Déclaration annuelle des revenus de capitaux mobiliers (IFU)',
    description: `Les établissements payeurs (banques, assurances, sociétés) doivent déclarer à la DGFiP les revenus de capitaux mobiliers versés à leurs clients via l'Imprimé Fiscal Unique (IFU / formulaire 2561). La déclaration est déposée avant le 15 février de l'année suivant le versement. Les données sont pré-remplies dans la déclaration de revenus des bénéficiaires.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'IFU, revenus capitaux, 2561, établissement payeur, pré-remplissage, 15 février',
    source: 'CGI art. 242 ter — BOFiP RPPM-RCM-40', fichier: 'src/declarations/IfuDeclarationService.java', ecran: 'Espace professionnel — déclarations tiers',
  },
  {
    code: 'RG-050', groupe: 'Déclarations et obligations',
    titre: 'Taxe sur les salaires — Règles et exonérations',
    description: `La taxe sur les salaires est due par les employeurs non assujettis à la TVA sur 90 % au moins de leur CA (associations, établissements de santé, banques). Elle est calculée sur les rémunérations brutes versées avec un barème progressif : 4,25 % jusqu'à 8 572 €, 8,50 % de 8 572 € à 17 144 €, 13,60 % au-delà (majoré à 20 % pour la fraction > 152 122 €). Les PME dont la taxe calculée est ≤ 1 200 € sont exonérées via la franchise.`,
    statut: 'Active', priorite: 'Normale', type_regle: 'Légale',
    tags: 'taxe salaires, 4.25%, 8.50%, 13.60%, association, franchise, 1200€',
    source: 'CGI art. 231 — BOFiP TPS-TS-10', fichier: 'src/tax/PayrollTaxService.java', ecran: '',
  },
  {
    code: 'RG-051', groupe: 'Déclarations et obligations',
    titre: 'Échange automatique d\'informations — DAC6',
    description: `Les intermédiaires (conseillers fiscaux, avocats, banques) et à défaut les contribuables eux-mêmes doivent déclarer à la DGFiP les montages transfrontaliers potentiellement agressifs entrant dans les marqueurs DAC6. Le délai de déclaration est de 30 jours à compter de la mise à disposition du montage. Les déclarations sont transmises à la DGFiP via l'espace professionnel. Les sanctions en cas de manquement vont jusqu'à 10 000 €.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'DAC6, montage, transfrontalier, intermédiaire, 30 jours, 10000€',
    source: 'CGI art. 1649 AD — Directive UE 2018/822 — BOFiP CF-CPF-30-40', fichier: '', ecran: 'Espace professionnel — DAC6',
  },

  // ══════════════════════════════════════════════════════
  //  Plus-values
  // ══════════════════════════════════════════════════════
  {
    code: 'RG-052', groupe: 'Plus-values et cessions',
    titre: 'Plus-values mobilières des particuliers — Flat tax',
    description: `Les plus-values de cession de valeurs mobilières réalisées par les particuliers sont soumises par défaut au Prélèvement Forfaitaire Unique (PFU) de 30 % : 12,8 % d'IR + 17,2 % de prélèvements sociaux. Sur option globale et irrévocable pour l'année, le contribuable peut choisir l'imposition au barème progressif (avec abattements pour durée de détention sur titres acquis avant 2018). L'option est exercée lors de la déclaration de revenus.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'plus-value, PFU, flat tax, 30%, 12.8%, valeurs mobilières, abattement',
    source: 'CGI art. 150-0 A et 200 A — BOFiP RPPM-PVBMI-20', fichier: 'src/tax/CapitalGainsTaxService.java', ecran: '',
  },
  {
    code: 'RG-053', groupe: 'Plus-values et cessions',
    titre: 'Plus-values immobilières — Exonérations et abattements',
    description: `La plus-value immobilière des particuliers est exonérée pour la résidence principale. Pour les autres biens, un abattement pour durée de détention s'applique : IR : 6 % par an entre la 6e et la 21e année, 4 % la 22e année → exonération totale après 22 ans ; Prélèvements sociaux : 1,65 % de la 6e à la 21e, 1,60 % la 22e, 9 % de la 23e à la 30e → exonération totale après 30 ans. La plus-value nette est imposée à 19 % + 17,2 % PS.`,
    statut: 'Active', priorite: 'Haute', type_regle: 'Légale',
    tags: 'plus-value immobilière, résidence principale, abattement, 22 ans, 30 ans, 19%',
    source: 'CGI art. 150 U à 150 VH — BOFiP RFPI-PVI-10', fichier: 'src/tax/RealEstateGainsTaxService.java', ecran: '',
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
      code:       r.code,
      titre:      r.titre,
      description:r.description,
      domaine:    DOMAINE,
      statut:     r.statut,
      priorite:   r.priorite,
      type_regle: r.type_regle,
      groupe:     r.groupe,
      tags:       r.tags,
      source:     r.source,
      fichier:    r.fichier || '',
      ecran:      r.ecran   || '',
    });
  }
});
insertAll();

const total = db.prepare("SELECT COUNT(*) as n FROM regles WHERE domaine = 'DGFIP'").get().n;
console.log(`\n  ✓ ${total} règles DGFIP insérées dans le domaine DGFIP`);
console.log(`  ✓ Total en base : ${db.prepare('SELECT COUNT(*) as n FROM regles').get().n} règles\n`);
