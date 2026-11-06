import type { SiteLocale } from "./site-copy";

export type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalDocumentCopy = {
  eyebrow: string;
  title: string;
  lead: string;
  draftNoticeTitle: string;
  draftNotice: string;
  versionLabel: string;
  updatedLabel: string;
  updatedDate: string;
  sections: LegalSection[];
  referencesTitle: string;
  references: { label: string; url: string }[];
  completionTitle: string;
  completionBody: string;
};

export const legalCopy: Record<SiteLocale, { terms: LegalDocumentCopy; privacy: LegalDocumentCopy }> = {
  fr: {
    terms: {
      eyebrow: "INFORMATIONS JURIDIQUES · PROJET DE TRAVAIL",
      title: "Conditions d’utilisation",
      lead: "Ces conditions décrivent le fonctionnement actuellement prévu de KULHA! pour les utilisateurs et les commerces partenaires. Lisez-les avant de créer un compte.",
      draftNoticeTitle: "Projet à finaliser avant publication",
      draftNotice: "Cette version est un projet de travail préparé à partir du code et des parcours actuellement disponibles. Elle ne doit pas être présentée comme la version contractuelle définitive tant que l’identité juridique de l’exploitant, ses coordonnées, les informations obligatoires du vendeur et les points de validation listés ci-dessous n’ont pas été complétés et revus par un juriste au Maroc.",
      versionLabel: "Version",
      updatedLabel: "Dernière mise à jour",
      updatedDate: "5 novembre 2026",
      sections: [
        {
          title: "1. Éditeur et exploitant du service",
          paragraphs: [
            "Le service KULHA! est édité et exploité par [DÉNOMINATION SOCIALE COMPLÈTE], [forme juridique], au capital de [montant et devise, si applicable], dont le siège est situé à [adresse complète, ville, Maroc], immatriculée au Registre du commerce de [ville] sous le numéro [RC], identifiant commun de l’entreprise [ICE] et identifiant fiscal [IF, si applicable].",
            "Contact général : [adresse e-mail de contact] · [numéro de téléphone]. Contact relatif aux données personnelles : [adresse e-mail dédiée]. Ces informations doivent être renseignées et vérifiées avant toute publication de cette version comme conditions définitives."
          ]
        },
        {
          title: "2. Objet et état actuel du service",
          paragraphs: [
            "KULHA! est conçu comme un service numérique qui met en relation des utilisateurs et des commerces de proximité proposant de valoriser des produits alimentaires disponibles. Les fonctionnalités effectivement accessibles dépendent de la version du site et de leur activation par KULHA!.",
            "Dans la version du logiciel examinée pour ce projet, les fonctions opérationnelles comprennent notamment la création et la sécurisation d’un compte, la vérification de l’adresse e-mail, la connexion par e-mail ou par Google, la demande d’accès commerçant, sa validation administrative et la gestion d’offres par les commerces approuvés. La recherche publique de paniers, la réservation par un client, la commande et le paiement en ligne ne sont pas encore activés dans cette version. Les descriptions marketing de fonctionnalités futures ne constituent pas une confirmation de commande ni une promesse qu’une fonctionnalité non activée est disponible.",
            "Avant l’activation d’une fonction de vente à distance, KULHA! devra publier les informations précontractuelles, le parcours de confirmation et les conditions propres aux commandes, paiements, annulations, retraits et remboursements applicables à cette fonction."
          ]
        },
        {
          title: "3. Création et sécurité du compte",
          paragraphs: [
            "L’utilisateur doit fournir des informations exactes, à jour et qui lui appartiennent. L’adresse e-mail doit être vérifiée lorsque le parcours le demande. Une connexion par Google n’est possible que si l’utilisateur choisit cette méthode et termine le processus d’authentification.",
            "L’utilisateur est responsable de la confidentialité de ses moyens d’accès et doit signaler rapidement toute utilisation non autorisée à [adresse e-mail de sécurité/support]. Les identifiants ne doivent pas être partagés ni utilisés pour usurper l’identité d’une autre personne.",
            "Un compte peut être limité, suspendu ou fermé en cas d’utilisation frauduleuse, de risque pour la sécurité, de violation substantielle des présentes conditions ou d’obligation légale. Dans la mesure permise par la loi, KULHA! informe l’utilisateur du motif et lui indique un moyen de contacter le support."
          ]
        },
        {
          title: "4. Comptes et obligations des commerces",
          paragraphs: [
            "La création d’un compte ne donne pas automatiquement le droit de publier des offres. Le commerce doit compléter son dossier et obtenir l’approbation de KULHA!. Les accès du personnel et les comptes partagés ne sont pas proposés dans la version examinée ; le titulaire du compte reste responsable des actions réalisées depuis celui-ci.",
            "Le commerce doit fournir des informations exactes sur son identité, son établissement, son adresse, ses horaires et ses coordonnées. Il doit détenir et maintenir les immatriculations, agréments, autorisations et assurances exigés pour son activité, lorsque ceux-ci sont requis.",
            "Le commerce reste responsable de la conformité et de la sécurité des denrées qu’il manipule ou met sur le marché, de leur conservation et de leur transport, de leur traçabilité, des informations fournies aux consommateurs et du respect des règles sanitaires applicables, notamment celles issues de la loi marocaine n° 28-07 et de ses textes d’application. La validation d’un compte par KULHA! ne remplace aucune autorisation administrative ou sanitaire."
          ]
        },
        {
          title: "5. Offres, prix, quantités et informations alimentaires",
          paragraphs: [
            "Le commerce est responsable du contenu de chaque offre qu’il publie : description, catégorie, prix affiché en dirhams marocains (MAD), quantité disponible, fenêtre de retrait, notes alimentaires et informations relatives aux allergènes. Il doit mettre à jour ou retirer sans délai une information devenue inexacte ou une offre qui ne peut plus être honorée.",
            "Le statut d’allergènes « non renseigné » signifie qu’aucune déclaration n’a été fournie dans ce champ. Il ne signifie jamais qu’un produit est exempt d’allergènes, qu’il est sans danger pour une personne allergique ou qu’une absence de contamination croisée a été vérifiée. L’utilisateur qui a une allergie ou une restriction alimentaire doit demander directement au commerce des informations fiables avant toute consommation.",
            "KULHA! peut masquer, refuser ou suspendre une offre lorsque son contenu paraît trompeur, incomplet, dangereux, contraire à la loi ou aux règles de la plateforme. Cette intervention ne transfère pas à KULHA! les obligations sanitaires qui incombent au professionnel responsable des denrées."
          ]
        },
        {
          title: "6. Vente, réservation, retrait et paiement",
          paragraphs: [
            "Aucune réservation client ni aucun paiement en ligne n’est ouvert dans la version actuellement examinée. En conséquence, les présentes conditions ne créent pas à elles seules un contrat de vente portant sur un panier alimentaire.",
            "Lorsqu’une fonction de réservation ou de commande sera activée, l’écran précédant la confirmation devra identifier le professionnel vendeur et afficher notamment les caractéristiques essentielles du panier, son prix total en MAD et les frais éventuels, les modalités de paiement, la quantité, le lieu et le créneau de retrait, les règles d’annulation et les coordonnées utiles. L’utilisateur devra pouvoir vérifier et corriger sa commande avant de la confirmer.",
            "La qualification juridique exacte de KULHA! dans la relation de vente (intermédiaire technique, mandataire ou autre rôle) ainsi que l’identité de la partie qui conclut la vente avec le consommateur doivent être déterminées et présentées clairement avant l’ouverture de cette fonctionnalité. Aucune clause des présentes ne peut supprimer une responsabilité ou un droit impératif prévu par la loi."
          ]
        },
        {
          title: "7. Information du consommateur et droit de rétractation",
          paragraphs: [
            "Lorsque KULHA! permet la conclusion d’un contrat à distance avec un consommateur, les informations prévues par la loi n° 31-08 doivent être communiquées avant la commande et confirmées dans les conditions prévues par cette loi. Les droits impératifs du consommateur restent applicables.",
            "La loi n° 31-08 prévoit un délai de rétractation de sept jours dans les situations qu’elle définit. Elle prévoit également des exceptions, notamment pour certaines denrées ou marchandises susceptibles de se détériorer ou de se périmer rapidement. L’application d’une exception doit être appréciée pour le produit et le contrat concernés ; KULHA! et les commerces ne peuvent pas annoncer une exclusion générale du droit de rétractation pour tous les paniers alimentaires sans validation juridique."
          ]
        },
        {
          title: "8. Utilisation acceptable et propriété intellectuelle",
          paragraphs: [
            "Il est interdit d’utiliser KULHA! pour publier des informations fausses ou illicites, proposer des denrées dangereuses, porter atteinte aux droits d’autrui, contourner les contrôles de sécurité, perturber le service, tenter d’accéder à un compte tiers ou transmettre des logiciels malveillants.",
            "Les marques, logos, textes, interfaces et éléments graphiques de KULHA! sont protégés et demeurent la propriété de leurs titulaires. L’utilisateur conserve les droits qu’il détient sur ses contenus et autorise KULHA!, pour la durée nécessaire au service, à les héberger, reproduire et afficher afin de fournir les fonctionnalités demandées. Il garantit disposer des droits nécessaires sur les contenus transmis."
          ]
        },
        {
          title: "9. Disponibilité, modifications et suspension",
          paragraphs: [
            "KULHA! peut faire évoluer, maintenir ou interrompre temporairement une fonctionnalité pour des raisons techniques, de sécurité, de conformité ou d’exploitation. KULHA! s’efforcera de limiter les interruptions et de communiquer les changements importants lorsque cela est raisonnablement possible.",
            "Une offre ou un compte peut être retiré ou suspendu lorsqu’il existe un motif sérieux lié à la sécurité alimentaire, à une information trompeuse, à une fraude, à la sécurité du système ou au respect de la loi. Les mesures sont prises sans préjudice des droits de recours et des obligations légales des parties."
          ]
        },
        {
          title: "10. Responsabilité et réclamations",
          paragraphs: [
            "Chaque partie répond des obligations qui lui incombent en vertu de la loi et du contrat qui la lie à l’autre partie. Les présentes conditions ne limitent pas les garanties, droits du consommateur ou responsabilités qui ne peuvent légalement être écartés.",
            "Pour une question relative à un compte, au fonctionnement de la plateforme ou à une réclamation, contactez [adresse e-mail support] ou [numéro de téléphone], du [jours/heures à compléter]. Pour une question sur la composition, la conservation, les allergènes ou la sécurité d’un produit, le professionnel indiqué sur l’offre doit également être contacté directement. Les coordonnées du vendeur devront être visibles avant toute vente à distance."
          ]
        },
        {
          title: "11. Modification des conditions et langues",
          paragraphs: [
            "KULHA! peut mettre à jour ces conditions pour refléter une évolution du service ou de la loi. La version applicable, sa date d’entrée en vigueur et, lorsque cela est nécessaire, une nouvelle demande d’acceptation seront présentées avant que les changements substantiels ne s’appliquent.",
            "Le site propose des textes en français, en arabe et en anglais. La langue contractuelle faisant foi en cas de divergence doit être expressément choisie et validée par le conseil juridique de l’exploitant avant publication définitive. D’ici là, les traductions sont fournies pour faciliter la compréhension et ne doivent pas masquer une différence de sens."
          ]
        },
        {
          title: "12. Droit applicable",
          paragraphs: [
            "Les présentes conditions sont préparées pour un service exploité au Maroc et sont soumises au droit marocain, sous réserve des règles impératives applicables. Tout différend relève des juridictions compétentes déterminées conformément au droit applicable, sans priver le consommateur d’une compétence ou d’un recours impératif dont il bénéficie."
          ]
        }
      ],
      referencesTitle: "Textes officiels et ressources",
      references: [
        { label: "Loi n° 31-08 relative à la protection du consommateur — Ministère de l’Industrie et du Commerce", url: "https://www.mcinet.gov.ma/fr/content/protection-consommateur/droits-garantis-aux-consommateurs" },
        { label: "Loi n° 28-07 — texte intégral publié par l’ONSSA", url: "https://www.onssa.gov.ma/wp-content/uploads/2021/11/LOI.28-07.FR%20%282%29.pdf" },
        { label: "ONSSA — réglementation de la sécurité sanitaire des aliments", url: "https://www.onssa.gov.ma/reglementation/reglementation-transversale/securite-sanitaire/" }
      ],
      completionTitle: "Informations obligatoires à renseigner avant publication",
      completionBody: "Dénomination et forme juridique de l’exploitant, capital si applicable, siège et adresse de réclamation, RC, ICE, IF, téléphone et e-mail ; identité et coordonnées des commerces vendeurs affichées avant toute vente ; rôle exact de KULHA! dans la vente ; règles opérationnelles de commande, de paiement, de retrait, d’annulation et de remboursement ; langue contractuelle de référence."
    },
    privacy: {
      eyebrow: "INFORMATIONS JURIDIQUES · PROJET DE TRAVAIL",
      title: "Politique de confidentialité",
      lead: "Cette politique explique les données personnelles que la version actuellement examinée de KULHA! traite, pourquoi elles sont utilisées et comment exercer vos droits.",
      draftNoticeTitle: "Projet à finaliser avant publication",
      draftNotice: "L’identité juridique du responsable, les références des formalités CNDP, la liste réelle des prestataires et pays de traitement, ainsi que les durées précises de conservation ne figurent pas dans les archives du projet examinées. Les champs correspondants sont signalés ci-dessous et doivent être complétés avant la mise en production. Une revue juridique et opérationnelle reste nécessaire.",
      versionLabel: "Version",
      updatedLabel: "Dernière mise à jour",
      updatedDate: "5 novembre 2026",
      sections: [
        {
          title: "1. Responsable du traitement et contact",
          paragraphs: [
            "Le responsable du traitement est [DÉNOMINATION SOCIALE COMPLÈTE], [forme juridique], dont le siège est situé à [adresse complète, ville, Maroc]. Contact pour la protection des données : [adresse e-mail dédiée] · [adresse postale ou service]. Contact général : [e-mail] · [téléphone].",
            "Référence de déclaration ou d’autorisation CNDP : [numéro, date et périmètre du récépissé/de l’autorisation, ou référence de l’exemption applicable après confirmation]. Ces renseignements doivent être complétés après détermination des formalités effectivement applicables à chaque traitement."
          ]
        },
        {
          title: "2. Périmètre de cette politique",
          paragraphs: [
            "Cette politique est fondée sur l’examen du code de l’application KULHA! fourni pour le projet. Les fonctionnalités de compte, d’authentification, de vérification d’e-mail, de demande commerçant et de gestion d’offres sont présentes dans cette version. La découverte publique de paniers, la réservation client, la commande et le paiement ne sont pas encore implémentés dans la version examinée. Cette politique devra être mise à jour avant l’activation de nouveaux traitements liés à ces fonctionnalités."
          ]
        },
        {
          title: "3. Données traitées",
          paragraphs: ["Selon le parcours utilisé, les catégories suivantes peuvent être traitées :"],
          bullets: [
            "Compte : nom complet, adresse e-mail, numéro de téléphone facultatif, identifiant du compte, rôle et état de vérification de l’adresse e-mail.",
            "Authentification et sécurité : empreinte cryptographique du mot de passe (le mot de passe en clair n’est pas conservé par l’application), données de session et de renouvellement, empreintes de jetons, événements de connexion et de sécurité.",
            "Connexion Google, uniquement si vous la choisissez : identifiant du fournisseur et identifiant de compte Google nécessaires à l’association et à l’authentification. KULHA! ne reçoit pas votre mot de passe Google.",
            "Dossier commerçant : nom et type d’activité, adresse, ville, téléphone, horaires, état du dossier, décisions administratives et motifs associés.",
            "Offres commerçants : titre, description, catégorie, prix, quantité, créneaux de retrait, informations alimentaires et déclarations d’allergènes, état et historique de modification.",
            "Audit et sécurité : identifiant de l’acteur, action, objet concerné, date, identifiant de corrélation et journaux techniques. L’adresse IP ou des données de diagnostic peuvent aussi apparaître dans les journaux de l’infrastructure selon la configuration de production."
          ]
        },
        {
          title: "4. Finalités et bases de traitement",
          paragraphs: ["Les données sont utilisées uniquement pour des finalités déterminées et dans la mesure nécessaire, notamment :"],
          bullets: [
            "Créer et administrer un compte, vérifier l’adresse e-mail, permettre la connexion et la récupération d’accès.",
            "Traiter une demande commerçant, vérifier les informations fournies, gérer l’approbation, le rejet ou la suspension et permettre la gestion des offres.",
            "Protéger le service, détecter les abus, limiter les tentatives automatisées, assurer l’audit et traiter les incidents.",
            "Répondre aux demandes de support et respecter les obligations légales ou les demandes valides des autorités.",
            "Le cas échéant, envoyer des communications commerciales uniquement après avoir obtenu le consentement préalable requis. La version examinée ne met pas en évidence un outil de marketing direct configuré."
          ]
        },
        {
          title: "5. Cookies et stockage de session",
          paragraphs: ["La version du code examinée utilise des cookies techniques nécessaires à l’authentification et à la sécurité :"],
          bullets: [
            "kulha_at : cookie de session d’accès, HttpOnly, SameSite=Lax, sécurisé en production ; sa durée dépend de l’expiration du jeton d’accès.",
            "kulha_rt : cookie de renouvellement de session, HttpOnly, SameSite=Lax, sécurisé en production ; durée maximale configurée dans le code web : 30 jours.",
            "kulha_google_oauth : cookie temporaire du parcours Google, HttpOnly, SameSite=Lax, sécurisé en production, limité à 10 minutes et utilisé pour protéger l’état, le nonce et le mécanisme PKCE."
          ]
        },
        {
          title: "6. Destinataires et prestataires",
          paragraphs: [
            "Les données peuvent être accessibles aux membres habilités de l’équipe KULHA! selon leurs fonctions. Elles peuvent être communiquées, dans la mesure nécessaire, aux prestataires techniques qui hébergent l’application, la base de données, les systèmes de sécurité ou l’envoi d’e-mails, ainsi qu’à Google lorsque vous choisissez la connexion Google. Les autorités publiques peuvent recevoir des données lorsqu’une obligation légale ou une demande valable l’exige.",
            "Les noms juridiques des prestataires, leurs rôles, les données accessibles, les sous-traitants ultérieurs et les pays de traitement ne sont pas identifiables de manière complète dans les fichiers de code fournis. Ils doivent être inscrits dans un inventaire des prestataires et reflétés dans les formalités CNDP applicables avant le lancement. KULHA! ne vend pas les données personnelles dans le fonctionnement décrit par cette version."
          ]
        },
        {
          title: "7. Traitements et transferts hors du Maroc",
          paragraphs: [
            "Certains services d’authentification, d’hébergement, de base de données ou d’e-mail peuvent traiter des données depuis un pays situé hors du Maroc. Les destinations exactes ne sont pas établies par les fichiers fournis. Avant d’activer ces services en production, KULHA! doit identifier chaque pays destinataire, le prestataire, les catégories de données et le mécanisme juridique applicable, puis accomplir les formalités ou obtenir les autorisations CNDP nécessaires conformément à la loi n° 09-08."
          ]
        },
        {
          title: "8. Durées de conservation",
          paragraphs: [
            "Les données ne doivent pas être conservées au-delà de la durée nécessaire aux finalités annoncées, sous réserve des obligations légales, de la sécurité et de la défense de droits en justice. Le code confirme une validité de 24 heures pour les liens de vérification d’e-mail et d’une heure pour les liens de réinitialisation du mot de passe ; ces durées de validité ne prouvent pas à elles seules la durée de conservation des enregistrements correspondants en base.",
            "Un calendrier de conservation et de suppression doit être approuvé avant publication : [durée du compte après fermeture] ; [durée des dossiers commerçants et décisions] ; [durée des journaux de sécurité et d’audit] ; [durée des demandes de support] ; [règles de purge des jetons expirés]. Les durées doivent être justifiées, mises en œuvre techniquement et communiquées aux personnes concernées."
          ]
        },
        {
          title: "9. Vos droits",
          paragraphs: [
            "Dans les conditions prévues par la loi marocaine n° 09-08, vous pouvez notamment demander l’accès aux données vous concernant, leur rectification lorsqu’elles sont inexactes ou incomplètes et vous opposer à certains traitements pour des motifs légitimes. La loi prévoit également, dans les cas qu’elle définit, le blocage ou l’effacement de données traitées en violation de ses dispositions. Vous pouvez vous opposer gratuitement à l’utilisation de vos données à des fins de prospection directe.",
            "Pour exercer vos droits, écrivez à [adresse e-mail dédiée aux données personnelles] en précisant votre demande et en fournissant les éléments raisonnablement nécessaires à la vérification de votre identité. KULHA! doit définir une procédure interne, un délai de traitement et un registre des demandes avant le lancement. Vous pouvez également saisir la CNDP dans les conditions prévues par la loi."
          ]
        },
        {
          title: "10. Sécurité",
          paragraphs: [
            "L’application examinée utilise notamment le hachage Argon2id pour les mots de passe, des jetons de session opaques stockés sous forme d’empreintes dans le backend, et des cookies de session HttpOnly. Ces mesures ne remplacent pas un examen complet de la configuration d’hébergement, des sauvegardes, des accès administrateurs, du chiffrement en transit et au repos, de la gestion des incidents et des contrats de sous-traitance.",
            "Aucun service accessible par Internet ne peut garantir une sécurité absolue. KULHA! doit maintenir des mesures techniques et organisationnelles proportionnées aux risques et documenter le traitement des incidents de sécurité."
          ]
        },
        {
          title: "11. Enfants, communications et évolution du service",
          paragraphs: [
            "Les modalités d’accès des mineurs et les éventuelles vérifications d’âge doivent être définies par l’exploitant et validées juridiquement avant la mise en production. Les utilisateurs ne doivent pas fournir de données personnelles d’un tiers sans base légitime.",
            "Toute prospection électronique devra respecter les conditions de consentement préalable, d’information et d’opposition prévues par la loi applicable. Si KULHA! active des réservations, commandes, paiements, géolocalisation, outils d’analyse ou publicités, la présente politique devra être mise à jour avant la collecte correspondante."
          ]
        },
        {
          title: "12. Réclamation et mise à jour de la politique",
          paragraphs: [
            "Pour toute question relative à cette politique ou à vos données, contactez [adresse e-mail dédiée] ou [adresse postale complète]. Date d’entrée en vigueur : [à compléter]. Version : 0.9 — projet de travail du 5 novembre 2026.",
            "Vous pouvez saisir la Commission Nationale de contrôle de la protection des Données à caractère Personnel (CNDP) selon les modalités publiées sur son site officiel. Toute modification substantielle de cette politique sera datée et portée à votre connaissance ; une nouvelle information ou un nouveau consentement sera recueilli lorsque la loi l’exige."
          ]
        }
      ],
      referencesTitle: "Textes officiels et ressources",
      references: [
        { label: "Loi n° 09-08 — texte officiel (Base de données juridiques du Maroc)", url: "https://bdj.mmsp.gov.ma/Fr/Document/8974-Dahir.aspx" },
        { label: "CNDP — notifier un traitement et formalités applicables", url: "https://www.cndp.ma/notifier-un-traitement/" },
        { label: "CNDP — textes et lois", url: "https://www.cndp.ma/textes-et-lois/" }
      ],
      completionTitle: "Éléments qui empêchent encore une publication définitive",
      completionBody: "Identité et adresse du responsable ; e-mail/délégué ou service de contact ; références et périmètre des déclarations/autorisations CNDP ; cartographie des prestataires, sous-traitants et pays ; base juridique de chaque traitement et de chaque transfert ; durées de conservation chiffrées et procédures de purge ; canal et délais de traitement des droits ; scan des cookies en production ; preuve serveur de la version et de la date de consentement aux politiques."
    }
  },
  en: {
    terms: {
      eyebrow: "LEGAL INFORMATION · WORKING DRAFT",
      title: "Terms of Use",
      lead: "These terms describe the KULHA! service as currently planned for users and partner shops. Please read them before creating an account.",
      draftNoticeTitle: "Working draft — complete before publication",
      draftNotice: "This document is a working draft based on the project source and the features currently present. It must not be presented as final contractual terms until the operator's legal identity, contact details, seller information and the review items below have been completed and reviewed by Moroccan counsel.",
      versionLabel: "Version",
      updatedLabel: "Last updated",
      updatedDate: "5 November 2026",
      sections: [
        { title: "1. Operator and contact details", paragraphs: ["KULHA! is operated by [FULL LEGAL NAME], a [legal form] with registered capital of [amount/currency, if applicable], registered office at [full address, city, Morocco], Commercial Register (RC) number [number], Common Company Identifier (ICE) [number] and Tax Identifier (IF) [number, if applicable].", "General contact: [contact email] · [telephone]. Personal-data contact: [dedicated privacy email]. These details must be completed and verified before these terms are published as final."] },
        { title: "2. Purpose and current service status", paragraphs: ["KULHA! is designed as a digital service connecting users with local shops that offer available food products. The features actually available depend on the version of the website and on activation by KULHA!.", "In the software version reviewed for this project, current functions include account creation and security, email verification, sign-in by email or Google, merchant applications, administrative review and offer management by approved shops. Public customer discovery, customer reservations, ordering and online payment are not yet enabled in this version. Marketing descriptions of planned features do not confirm an order or guarantee that an inactive feature is available.", "Before any distance-selling feature is activated, KULHA! must publish the applicable pre-contract information and specific terms for orders, payments, cancellations, collection and refunds."] },
        { title: "3. Accounts and account security", paragraphs: ["Users must provide accurate, current information about themselves. Email verification may be required. Google sign-in is used only when the user chooses it and completes the authentication flow.", "Users are responsible for keeping their access credentials confidential and must promptly report suspected unauthorized use to [security/support email]. Credentials must not be shared or used to impersonate another person.", "An account may be restricted, suspended or closed for fraud, security risk, a material breach of these terms or a legal requirement. Where legally permitted, KULHA! will communicate the reason and a support contact."] },
        { title: "4. Merchant accounts and obligations", paragraphs: ["Creating an account does not automatically authorize a shop to publish offers. The shop must submit its application and receive KULHA! approval. Staff accounts and shared staff access are not available in the reviewed version; the account holder remains responsible for actions performed through the account.", "The shop must provide accurate identity, establishment, address, city, telephone and opening-hours information, and maintain any registration, licence, approval, permit and insurance required for its activity.", "The shop remains responsible for the safety and compliance of food it handles or places on the market, including storage, transport, traceability and consumer information, under Moroccan Law No. 28-07 and its implementing rules where applicable. KULHA! account approval does not replace any sanitary or administrative authorization."] },
        { title: "5. Offers, prices and food information", paragraphs: ["The shop is responsible for each offer it publishes, including its description, category, price in Moroccan dirhams (MAD), available quantity, collection window, food notes and allergen declarations. It must promptly correct or remove information that becomes inaccurate or an offer it can no longer fulfil.", "An allergen status of 'not provided' means no declaration has been entered. It does not mean that a product is allergen-free, safe for a person with an allergy, or verified as free from cross-contamination. Anyone with an allergy or dietary restriction should obtain reliable information directly from the shop before consuming a product.", "KULHA! may hide, reject or suspend an offer that appears misleading, incomplete, unsafe, unlawful or contrary to platform rules. This does not transfer the food operator's statutory duties to KULHA!."] },
        { title: "6. Sales, reservations, collection and payment", paragraphs: ["Customer reservations and online payment are not available in the software version reviewed. These terms therefore do not, by themselves, create a food-basket sale contract.", "When ordering or reservation features are activated, the screen before confirmation must identify the seller and show the essential basket characteristics, total price in MAD and any fees, payment method, quantity, collection location and time window, cancellation rules and relevant contact details. Users must be able to review and correct the order before confirming it.", "KULHA!'s legal role in the sale (technical intermediary, agent or another role) and the identity of the party contracting with the consumer must be determined and clearly disclosed before the feature is launched. Nothing in these terms excludes mandatory liability or statutory rights."] },
        { title: "7. Consumer information and withdrawal rights", paragraphs: ["Where KULHA! enables a distance contract with a consumer, the information required by Moroccan Law No. 31-08 must be provided before the order and confirmed as required by that law. Mandatory consumer rights continue to apply.", "Law No. 31-08 provides a seven-day withdrawal period in the situations it defines. It also provides exceptions, including for certain goods liable to deteriorate or expire rapidly. An exception must be assessed for the particular product and contract; no blanket exclusion of withdrawal rights for all food baskets should be published without legal review."] },
        { title: "8. Acceptable use and intellectual property", paragraphs: ["Users must not publish false or unlawful information, offer unsafe food, infringe third-party rights, bypass security controls, disrupt the service, attempt to access another person's account or transmit malicious software.", "KULHA! names, marks, logos, text, interfaces and graphics remain the property of their respective owners. Users retain rights in content they own and authorize KULHA!, for as long as needed to provide the service, to host, reproduce and display that content for the requested features. Users warrant that they have the necessary rights to submit it."] },
        { title: "9. Availability, changes and suspension", paragraphs: ["KULHA! may update, maintain or temporarily interrupt a feature for technical, security, compliance or operational reasons. It will seek to limit interruptions and communicate material changes where reasonably possible.", "An offer or account may be removed or suspended for a serious reason involving food safety, misleading information, fraud, system security or compliance with law. Any action is without prejudice to legal remedies and mandatory duties."] },
        { title: "10. Liability and complaints", paragraphs: ["Each party remains responsible for the obligations imposed on it by applicable law and by its contract with the other party. These terms do not limit warranties, consumer rights or liability that cannot legally be excluded.", "For account, platform or support complaints, contact [support email] or [telephone], [days/hours to be completed]. Questions about ingredients, storage, allergens or food safety should also be directed to the professional identified on the offer. Seller contact details must be visible before any distance sale."] },
        { title: "11. Changes and language versions", paragraphs: ["KULHA! may update these terms to reflect changes in the service or law. The applicable version and effective date will be shown; where required, users will be asked to accept material changes before they apply.", "The website provides French, Arabic and English texts. The controlling contractual language in case of inconsistency must be expressly selected and approved by the operator's Moroccan legal counsel before final publication. Until then, translations are provided to aid understanding and must not conceal any difference in meaning."] },
        { title: "12. Governing law", paragraphs: ["These terms are prepared for a service operated in Morocco and are governed by Moroccan law, subject to mandatory applicable rules. Disputes fall within the jurisdiction of the courts determined under applicable law, without depriving consumers of any mandatory jurisdiction or remedy available to them."] }
      ],
      referencesTitle: "Official laws and resources",
      references: [
        { label: "Law No. 31-08 on consumer protection — Ministry of Industry and Trade", url: "https://www.mcinet.gov.ma/en/content/rights-guaranteed-consumers" },
        { label: "Law No. 28-07 — full text published by ONSSA (French)", url: "https://www.onssa.gov.ma/wp-content/uploads/2021/11/LOI.28-07.FR%20%282%29.pdf" },
        { label: "ONSSA — food-safety regulations", url: "https://www.onssa.gov.ma/transversal-regulation/food-safety/?lang=en" }
      ],
      completionTitle: "Information to complete before publication",
      completionBody: "Operator's full legal name and form, capital if applicable, registered office and complaints address, RC, ICE, IF, telephone and email; seller identity and contact details shown before any sale; KULHA!'s exact role in sales; operational rules for orders, payment, collection, cancellation and refunds; controlling contractual language."
    },
    privacy: {
      eyebrow: "LEGAL INFORMATION · WORKING DRAFT",
      title: "Privacy Policy",
      lead: "This policy explains which personal data the reviewed KULHA! version processes, why it is used and how you can exercise your rights.",
      draftNoticeTitle: "Working draft — complete before publication",
      draftNotice: "The legal identity of the controller, CNDP filing references, the actual list of providers and processing countries, and precise retention periods are not present in the reviewed project archives. The relevant fields are identified below and must be completed before production. Legal and operational review is still required.",
      versionLabel: "Version",
      updatedLabel: "Last updated",
      updatedDate: "5 November 2026",
      sections: [
        { title: "1. Data controller and contact", paragraphs: ["The data controller is [FULL LEGAL NAME], [legal form], with registered office at [full address, city, Morocco]. Privacy contact: [dedicated email] · [postal address or service]. General contact: [email] · [telephone].", "CNDP declaration or authorization reference: [number, date and scope of receipt/authorization, or confirmed applicable exemption reference]. Complete this information after determining the formalities applicable to each processing activity."] },
        { title: "2. Scope of this policy", paragraphs: ["This policy is based on the KULHA! application source provided for review. Account, authentication, email verification, merchant application and merchant offer-management functions are present in this version. Public basket discovery, customer reservations, orders and payments are not yet implemented in the reviewed version. This policy must be updated before new processing related to those features begins."] },
        { title: "3. Data we process", paragraphs: ["Depending on the feature used, the following categories may be processed:"], bullets: ["Account: full name, email address, optional telephone number, account identifier, role and email-verification status.", "Authentication and security: cryptographic password hash (the application does not store the plain-text password), session and refresh-token data, token hashes, sign-in and security events.", "Google sign-in, only when selected: provider identifier and Google account subject needed to link and authenticate the account. KULHA! does not receive your Google password.", "Merchant application: business name and type, address, city, telephone, opening hours, application status, administrative decisions and related reasons.", "Merchant offers: title, description, category, price, quantity, collection window, food notes, allergen declarations, status and change history.", "Audit and security: actor identifier, action, affected object, timestamp, correlation identifier and technical logs. IP address or diagnostic data may also appear in infrastructure logs depending on production configuration."] },
        { title: "4. Purposes and legal grounds", paragraphs: ["Data is used for specified purposes and only to the extent necessary, including:"], bullets: ["Creating and administering an account, verifying email, enabling sign-in and account recovery.", "Handling a merchant application, checking submitted information, managing approval/rejection/suspension and enabling offer management.", "Protecting the service, detecting abuse, rate-limiting automated attempts, maintaining audit records and handling incidents.", "Responding to support requests and complying with legal obligations or valid authority requests.", "Where applicable, sending commercial communications only after obtaining the prior consent required by law. No direct-marketing tool was identified in the reviewed source snapshot."] },
        { title: "5. Cookies and session storage", paragraphs: ["The reviewed source code uses essential technical cookies for authentication and security:"], bullets: ["kulha_at: access-session cookie, HttpOnly, SameSite=Lax and Secure in production; its lifetime follows the access-token expiry.", "kulha_rt: session-refresh cookie, HttpOnly, SameSite=Lax and Secure in production; maximum age configured in the web code is 30 days.", "kulha_google_oauth: temporary Google sign-in cookie, HttpOnly, SameSite=Lax and Secure in production, limited to 10 minutes and used to protect state, nonce and PKCE data."] },
        { title: "6. Recipients and service providers", paragraphs: ["Data may be accessed by KULHA! team members authorized according to their roles. Where necessary, it may be shared with technical providers that host the application, database, security infrastructure or email delivery, and with Google when you choose Google sign-in. Public authorities may receive data where required by law or a valid request.", "The legal names of providers, their roles, data access, subprocessors and processing countries cannot be fully identified from the source files provided. They must be recorded in a provider inventory and reflected in the applicable CNDP formalities before launch. KULHA! does not sell personal data in the operation described by this version."] },
        { title: "7. Processing and transfers outside Morocco", paragraphs: ["Some authentication, hosting, database or email services may process data from a country outside Morocco. The exact destinations are not established by the supplied source files. Before these services are enabled in production, KULHA! must identify each destination country, provider, data category and applicable legal mechanism, and complete any required CNDP formalities or authorizations under Law No. 09-08."] },
        { title: "8. Retention periods", paragraphs: ["Data should not be kept longer than necessary for the stated purposes, subject to legal obligations, security and the establishment or defence of legal claims. The source code confirms a 24-hour validity period for email-verification links and a one-hour validity period for password-reset links; these validity periods do not by themselves establish how long the related database records are retained.", "A retention and deletion schedule must be approved before publication: [account data after closure]; [merchant applications and decisions]; [security and audit logs]; [support requests]; [purging of expired tokens]. Each period must be justified, technically implemented and communicated to users."] },
        { title: "9. Your rights", paragraphs: ["Under the conditions in Moroccan Law No. 09-08, you may request access to personal data concerning you, rectification of inaccurate or incomplete data and, on legitimate grounds, object to certain processing. The law also provides, in defined circumstances, for blocking or erasure of data processed in breach of its provisions. You may object free of charge to direct marketing.", "To exercise your rights, contact [dedicated privacy email] with your request and information reasonably needed to verify your identity. KULHA! must define an internal process, response timeline and request register before launch. You may also submit a complaint to the CNDP under the conditions provided by law."] },
        { title: "10. Security", paragraphs: ["The reviewed application uses Argon2id password hashing, opaque session tokens stored as hashes in the backend, and HttpOnly session cookies. These controls do not replace a full review of hosting configuration, backups, administrator access, encryption in transit and at rest, incident management and processor contracts.", "No Internet-accessible service can guarantee absolute security. KULHA! must maintain technical and organizational measures proportionate to risk and document its security-incident process."] },
        { title: "11. Children, communications and service changes", paragraphs: ["The operator must define and obtain legal review of access rules for minors and any age checks before production. Users must not provide another person's personal data without a lawful basis.", "Electronic direct marketing must comply with applicable prior-consent, information and objection requirements. If KULHA! enables reservations, orders, payments, geolocation, analytics or advertising tools, this policy must be updated before the related data is collected."] },
        { title: "12. Complaints and policy updates", paragraphs: ["For questions about this policy or your data, contact [dedicated email] or [full postal address]. Effective date: [to be completed]. Version: 0.9 — working draft dated 5 November 2026.", "You may contact the Moroccan National Commission for the Control of Personal Data Protection (CNDP) using the procedures on its official website. Material changes will be dated and communicated; new information or consent will be obtained where required by law."] }
      ],
      referencesTitle: "Official laws and resources",
      references: [
        { label: "Law No. 09-08 — official legal database", url: "https://bdj.mmsp.gov.ma/Fr/Document/8974-Dahir.aspx" },
        { label: "CNDP — notify a processing activity and applicable formalities", url: "https://www.cndp.ma/notifier-un-traitement/" },
        { label: "CNDP — laws and regulations", url: "https://www.cndp.ma/textes-et-lois/" }
      ],
      completionTitle: "Items that still prevent final publication",
      completionBody: "Controller identity and address; privacy contact; CNDP filing/authorization references and scope; provider, subprocessor and country map; legal basis for each processing and transfer; specific retention periods and purge processes; channel and response times for rights requests; production cookie scan; server-side evidence of the policy version and acceptance date."
    }
  },
  ar: {
    terms: {
      eyebrow: "معلومات قانونية · مسودة عمل",
      title: "شروط الاستخدام",
      lead: "توضح هذه الشروط طريقة عمل KULHA! الحالية والمخطط لها للمستخدمين والمتاجر الشريكة. يرجى قراءتها قبل إنشاء حساب.",
      draftNoticeTitle: "مسودة يجب استكمالها قبل النشر",
      draftNotice: "هذه وثيقة عمل أُعدّت استناداً إلى ملفات المشروع والوظائف الموجودة حالياً. لا يجوز تقديمها باعتبارها الشروط التعاقدية النهائية قبل استكمال الهوية القانونية للمشغّل وبيانات الاتصال ومعلومات البائع وبنود المراجعة أدناه، ومراجعتها من طرف مستشار قانوني في المغرب.",
      versionLabel: "الإصدار",
      updatedLabel: "آخر تحديث",
      updatedDate: "5 نوفمبر 2026",
      sections: [
        { title: "1. الجهة المشغلة وبيانات الاتصال", paragraphs: ["تُشغّل خدمة KULHA! شركة [الاسم القانوني الكامل]، [الشكل القانوني]، برأسمال قدره [المبلغ والعملة إن انطبق]، ومقرها في [العنوان الكامل، المدينة، المغرب]، والمسجلة في السجل التجاري بمدينة [المدينة] تحت رقم [RC]، ورقم التعريف الموحد للمقاولة [ICE]، والمعرف الضريبي [IF إن انطبق].", "للتواصل العام: [البريد الإلكتروني] · [رقم الهاتف]. ولحماية البيانات الشخصية: [البريد الإلكتروني المخصص]. يجب استكمال هذه المعلومات والتحقق منها قبل نشر هذه الوثيقة بصفتها شروطاً نهائية."] },
        { title: "2. موضوع الخدمة ووضعها الحالي", paragraphs: ["تم تصميم KULHA! كخدمة رقمية تربط المستخدمين بالمتاجر المحلية التي تعرض منتجات غذائية متاحة. وتعتمد الوظائف المتاحة فعلياً على إصدار الموقع وعلى تفعيل KULHA! لها.", "في إصدار البرنامج الذي تمت مراجعته لهذا المشروع، تشمل الوظائف إنشاء الحساب وتأمينه، والتحقق من البريد الإلكتروني، وتسجيل الدخول بالبريد أو Google، وطلبات انضمام المتاجر، ومراجعتها إدارياً، وإدارة العروض من طرف المتاجر المعتمدة. أما البحث العام عن السلال وحجزها من طرف العملاء والطلبات والدفع الإلكتروني فلم يتم تفعيلها بعد في هذا الإصدار. ولا تعني العبارات التسويقية المتعلقة بوظائف مستقبلية تأكيد طلب أو ضمان توفر وظيفة غير مفعلة.", "قبل تفعيل أي وظيفة للبيع عن بُعد، ستنشر KULHA! المعلومات السابقة للتعاقد والشروط الخاصة بالطلبات والدفع والإلغاء والاستلام والاسترداد."] },
        { title: "3. إنشاء الحساب وأمنه", paragraphs: ["يجب على المستخدم تقديم معلومات صحيحة وحديثة تخصه. وقد يُطلب منه التحقق من البريد الإلكتروني. ولا يتم تسجيل الدخول بواسطة Google إلا إذا اختار المستخدم هذه الطريقة وأكمل مسار المصادقة.", "يتحمل المستخدم مسؤولية الحفاظ على سرية بيانات الدخول، وعليه الإبلاغ سريعاً عن أي استخدام غير مصرح به عبر [بريد الدعم/الأمن]. لا يجوز مشاركة بيانات الدخول أو استعمالها لانتحال هوية شخص آخر.", "يجوز تقييد الحساب أو تعليقه أو إغلاقه عند وجود احتيال أو خطر أمني أو إخلال جوهري بهذه الشروط أو التزام قانوني. وحيث يسمح القانون، ستوضح KULHA! السبب ووسيلة التواصل مع الدعم."] },
        { title: "4. حسابات المتاجر والتزاماتها", paragraphs: ["لا يمنح إنشاء الحساب وحده الحق في نشر العروض. يجب على المتجر إكمال ملفه والحصول على موافقة KULHA!. ولا تتوفر حسابات الموظفين أو الحسابات المشتركة في الإصدار الذي تمت مراجعته؛ ويبقى صاحب الحساب مسؤولاً عن العمليات المنفذة من خلاله.", "يجب على المتجر تقديم معلومات صحيحة عن هويته ومؤسسته وعنوانه ومدينته ورقم هاتفه وساعات العمل، والحفاظ على كل تسجيل أو ترخيص أو اعتماد أو تأمين يتطلبه نشاطه.", "يبقى المتجر مسؤولاً عن مطابقة وسلامة الأغذية التي يتعامل معها أو يطرحها في السوق، بما في ذلك التخزين والنقل والتتبع ومعلومات المستهلك، وفق القانون المغربي رقم 28.07 ونصوصه التطبيقية عند الاقتضاء. ولا تحل موافقة KULHA! على الحساب محل أي ترخيص صحي أو إداري."] },
        { title: "5. العروض والأسعار ومعلومات الأغذية", paragraphs: ["يتحمل المتجر مسؤولية كل عرض ينشره، بما في ذلك الوصف والفئة والسعر بالدرهم المغربي والكمية المتاحة وموعد الاستلام والملاحظات الغذائية وبيانات مسببات الحساسية. ويجب عليه تصحيح أو حذف أي معلومة لم تعد صحيحة أو عرض لم يعد قادراً على تنفيذه.", "تعني حالة مسببات الحساسية «غير مصرح بها» أنه لم يتم إدخال تصريح في هذا الحقل. ولا تعني أن المنتج خالٍ من مسببات الحساسية أو آمن للشخص المصاب بالحساسية أو تم التحقق من خلوه من التلوث المتبادل. وعلى من لديه حساسية أو قيود غذائية طلب معلومات موثوقة مباشرة من المتجر قبل الاستهلاك.", "يجوز لـ KULHA! إخفاء العرض أو رفضه أو تعليقه إذا بدا مضللاً أو ناقصاً أو غير آمن أو مخالفاً للقانون أو لقواعد المنصة. ولا ينقل هذا التدخل الالتزامات الصحية القانونية من المهني المسؤول عن الأغذية إلى KULHA!."] },
        { title: "6. البيع والحجز والاستلام والدفع", paragraphs: ["لا تتوفر حجوزات العملاء ولا عمليات الدفع عبر الإنترنت في إصدار البرنامج الذي تمت مراجعته. لذلك لا تنشئ هذه الشروط وحدها عقد بيع لسلة غذائية.", "عند تفعيل الطلب أو الحجز، يجب أن تعرض الشاشة السابقة للتأكيد هوية البائع والخصائص الأساسية للسلة والسعر الإجمالي بالدرهم وأي رسوم وطريقة الدفع والكمية ومكان وموعد الاستلام وقواعد الإلغاء وبيانات الاتصال ذات الصلة. ويجب تمكين المستخدم من مراجعة الطلب وتصحيحه قبل التأكيد.", "يجب تحديد الصفة القانونية الدقيقة لـ KULHA! في عملية البيع وهوية الطرف المتعاقد مع المستهلك والإفصاح عنهما بوضوح قبل إطلاق هذه الوظيفة. ولا يجوز لأي بند في هذه الشروط استبعاد مسؤولية قانونية إلزامية أو حق مقرر للمستهلك."] },
        { title: "7. معلومات المستهلك وحق التراجع", paragraphs: ["عندما تتيح KULHA! إبرام عقد عن بُعد مع مستهلك، يجب تقديم المعلومات التي يفرضها القانون المغربي رقم 31.08 قبل الطلب وتأكيدها وفق أحكام ذلك القانون. وتظل حقوق المستهلك الإلزامية سارية.", "ينص القانون رقم 31.08 على أجل للتراجع مدته سبعة أيام في الحالات التي يحددها. كما يتضمن استثناءات، منها بعض السلع القابلة للتلف أو انتهاء الصلاحية بسرعة. ويجب تقييم الاستثناء بحسب المنتج والعقد المعنيين؛ ولا ينبغي نشر استبعاد عام لحق التراجع عن جميع السلال الغذائية دون مراجعة قانونية."] },
        { title: "8. الاستخدام المقبول والملكية الفكرية", paragraphs: ["يُمنع نشر معلومات كاذبة أو غير قانونية، أو عرض أغذية غير آمنة، أو انتهاك حقوق الغير، أو تجاوز ضوابط الأمن، أو تعطيل الخدمة، أو محاولة الدخول إلى حساب الغير، أو إرسال برمجيات ضارة.", "تبقى العلامات والشعارات والنصوص والواجهات والعناصر الرسومية الخاصة بـ KULHA! ملكاً لأصحابها. ويحتفظ المستخدم بحقوقه في المحتوى الذي يملكه، ويمنح KULHA! الإذن باستضافته ونسخه وعرضه طوال المدة اللازمة لتقديم الوظائف المطلوبة، ويضمن امتلاكه الحقوق اللازمة لإرساله."] },
        { title: "9. توفر الخدمة والتغييرات والتعليق", paragraphs: ["يجوز لـ KULHA! تطوير وظيفة أو صيانتها أو إيقافها مؤقتاً لأسباب تقنية أو أمنية أو تنظيمية أو تشغيلية. وستسعى إلى الحد من الانقطاعات وإبلاغ المستخدمين بالتغييرات المهمة متى كان ذلك ممكناً بشكل معقول.", "يجوز حذف عرض أو تعليق حساب عند وجود سبب جدي يتعلق بسلامة الأغذية أو المعلومات المضللة أو الاحتيال أو أمن النظام أو الامتثال للقانون، دون المساس بوسائل الانتصاف والالتزامات القانونية."] },
        { title: "10. المسؤولية والشكاوى", paragraphs: ["يتحمل كل طرف الالتزامات المفروضة عليه بموجب القانون والعقد الذي يربطه بالطرف الآخر. ولا تحد هذه الشروط من الضمانات أو حقوق المستهلك أو المسؤوليات التي لا يجوز استبعادها قانوناً.", "للاستفسارات المتعلقة بالحساب أو المنصة أو الدعم، يرجى التواصل عبر [بريد الدعم] أو [رقم الهاتف] خلال [الأيام والساعات]. أما الأسئلة المتعلقة بالمكونات والتخزين ومسببات الحساسية وسلامة الغذاء فيجب توجيهها أيضاً إلى المهني المحدد في العرض. ويجب إظهار بيانات اتصال البائع قبل أي بيع عن بُعد."] },
        { title: "11. تعديل الشروط واللغات", paragraphs: ["يجوز لـ KULHA! تحديث هذه الشروط لتعكس تطور الخدمة أو القانون. وسيتم بيان الإصدار وتاريخ سريانه، كما سيُطلب قبول التغييرات الجوهرية قبل تطبيقها متى كان ذلك مطلوباً.", "يوفر الموقع نصوصاً بالفرنسية والعربية والإنجليزية. ويجب تحديد اللغة التعاقدية المعتمدة عند وجود اختلاف وموافقة المستشار القانوني المغربي عليها قبل النشر النهائي. وحتى ذلك الحين، توفر الترجمات لتسهيل الفهم ولا يجوز أن تخفي اختلافاً في المعنى."] },
        { title: "12. القانون الواجب التطبيق", paragraphs: ["أُعدت هذه الشروط لخدمة تُشغل في المغرب، وتخضع للقانون المغربي مع مراعاة القواعد الإلزامية واجبة التطبيق. وتختص المحاكم التي يحددها القانون بالنظر في النزاعات، دون حرمان المستهلك من أي اختصاص أو وسيلة انتصاف إلزامية مقررة له."] }
      ],
      referencesTitle: "النصوص القانونية والمصادر الرسمية",
      references: [
        { label: "القانون رقم 31.08 لحماية المستهلك — وزارة الصناعة والتجارة", url: "https://www.mcinet.gov.ma/fr/content/protection-consommateur/droits-garantis-aux-consommateurs" },
        { label: "القانون رقم 28.07 — النص الكامل المنشور من ONSSA (بالفرنسية)", url: "https://www.onssa.gov.ma/wp-content/uploads/2021/11/LOI.28-07.FR%20%282%29.pdf" },
        { label: "ONSSA — تنظيم السلامة الصحية للمنتجات الغذائية", url: "https://www.onssa.gov.ma/reglementation/reglementation-transversale/securite-sanitaire/" }
      ],
      completionTitle: "معلومات يجب استكمالها قبل النشر",
      completionBody: "الاسم القانوني والشكل القانوني للمشغل ورأس المال إن انطبق والمقر وعنوان الشكاوى وRC وICE وIF والهاتف والبريد الإلكتروني؛ هوية المتاجر البائعة وبياناتها قبل أي بيع؛ الدور القانوني الدقيق لـ KULHA!؛ قواعد الطلب والدفع والاستلام والإلغاء والاسترداد؛ اللغة التعاقدية المعتمدة."
    },
    privacy: {
      eyebrow: "معلومات قانونية · مسودة عمل",
      title: "سياسة الخصوصية",
      lead: "توضح هذه السياسة البيانات الشخصية التي يعالجها إصدار KULHA! الذي تمت مراجعته، وأسباب استخدامها وكيفية ممارسة حقوقك.",
      draftNoticeTitle: "مسودة يجب استكمالها قبل النشر",
      draftNotice: "لم تتضمن ملفات المشروع التي تمت مراجعتها الهوية القانونية لمسؤول المعالجة أو مراجع إجراءات CNDP أو القائمة الفعلية لمقدمي الخدمات وبلدان المعالجة أو مدد الاحتفاظ الدقيقة. تم تحديد الحقول الناقصة أدناه ويجب استكمالها قبل الإنتاج، مع إجراء مراجعة قانونية وتشغيلية.",
      versionLabel: "الإصدار",
      updatedLabel: "آخر تحديث",
      updatedDate: "5 نوفمبر 2026",
      sections: [
        { title: "1. مسؤول المعالجة وبيانات الاتصال", paragraphs: ["مسؤول المعالجة هو [الاسم القانوني الكامل]، [الشكل القانوني]، ومقره في [العنوان الكامل، المدينة، المغرب]. للتواصل بشأن الخصوصية: [البريد الإلكتروني المخصص] · [العنوان البريدي أو المصلحة]. للتواصل العام: [البريد الإلكتروني] · [الهاتف].", "مرجع التصريح أو الترخيص لدى CNDP: [الرقم والتاريخ والنطاق، أو مرجع الإعفاء بعد التحقق منه]. يجب استكمال هذه البيانات بعد تحديد الإجراءات المطبقة على كل عملية معالجة."] },
        { title: "2. نطاق هذه السياسة", paragraphs: ["أُعدت هذه السياسة استناداً إلى ملفات تطبيق KULHA! المقدمة للمراجعة. وتشمل النسخة الحالية الحساب والمصادقة والتحقق من البريد الإلكتروني وطلب انضمام المتجر وإدارة عروضه. أما البحث العام عن السلال وحجوزات العملاء والطلبات والمدفوعات فلم يتم تنفيذها بعد في النسخة التي تمت مراجعتها. ويجب تحديث السياسة قبل بدء أي معالجة جديدة مرتبطة بهذه الوظائف."] },
        { title: "3. البيانات التي نعالجها", paragraphs: ["بحسب الوظيفة المستخدمة، قد تتم معالجة الفئات التالية:"], bullets: ["الحساب: الاسم الكامل والبريد الإلكتروني ورقم الهاتف الاختياري ومعرف الحساب والدور وحالة التحقق من البريد.", "المصادقة والأمن: بصمة مشفرة لكلمة المرور (لا يحتفظ التطبيق بكلمة المرور بنصها الصريح) وبيانات الجلسة وتجديدها وبصمات الرموز وأحداث الدخول والأمن.", "تسجيل الدخول بواسطة Google، عند اختياره فقط: معرف المزود ومعرف حساب Google اللازم لربط الحساب والمصادقة. لا تتلقى KULHA! كلمة مرور Google.", "ملف المتجر: اسم النشاط ونوعه والعنوان والمدينة والهاتف وساعات العمل وحالة الطلب والقرارات الإدارية وأسبابها.", "عروض المتجر: العنوان والوصف والفئة والسعر والكمية وموعد الاستلام والملاحظات الغذائية وتصريحات مسببات الحساسية والحالة وسجل التعديلات.", "التدقيق والأمن: معرف المستخدم المنفذ والإجراء والعنصر المعني والطابع الزمني ومعرف الترابط والسجلات التقنية. وقد تظهر عناوين IP أو بيانات تشخيصية في سجلات البنية التحتية بحسب إعدادات الإنتاج."] },
        { title: "4. الأغراض والأسس القانونية", paragraphs: ["تُستخدم البيانات لأغراض محددة وبالقدر الضروري، ومنها:"], bullets: ["إنشاء الحساب وإدارته والتحقق من البريد وتسجيل الدخول واستعادة الوصول.", "معالجة طلب المتجر والتحقق من المعلومات وإدارة الموافقة أو الرفض أو التعليق وتمكين إدارة العروض.", "حماية الخدمة واكتشاف إساءة الاستخدام والحد من المحاولات الآلية والاحتفاظ بسجلات التدقيق ومعالجة الحوادث.", "الرد على طلبات الدعم والامتثال للالتزامات القانونية أو الطلبات الصحيحة الصادرة عن السلطات.", "إرسال المراسلات التجارية، عند الاقتضاء، بعد الحصول على الموافقة المسبقة التي يفرضها القانون. ولم يظهر في نسخة المصدر التي تمت مراجعتها إعداد أداة للتسويق المباشر."] },
        { title: "5. ملفات تعريف الارتباط وتخزين الجلسة", paragraphs: ["يستخدم الكود الذي تمت مراجعته ملفات تعريف ارتباط تقنية أساسية للمصادقة والأمن:"], bullets: ["kulha_at: ملف جلسة للوصول، بخصائص HttpOnly وSameSite=Lax وSecure في الإنتاج؛ وتعتمد مدته على انتهاء رمز الوصول.", "kulha_rt: ملف لتجديد الجلسة، بخصائص HttpOnly وSameSite=Lax وSecure في الإنتاج؛ والحد الأقصى للمدة المضبوط في كود الويب هو 30 يوماً.", "kulha_google_oauth: ملف مؤقت لمسار Google، بخصائص HttpOnly وSameSite=Lax وSecure في الإنتاج، ومدته 10 دقائق لحماية state وnonce وبيانات PKCE."] },
        { title: "6. الجهات المتلقية ومقدمو الخدمات", paragraphs: ["يمكن لأعضاء فريق KULHA! المخولين بحسب مهامهم الوصول إلى البيانات. وقد تتم مشاركتها عند الضرورة مع مقدمي الخدمات التقنية الذين يستضيفون التطبيق أو قاعدة البيانات أو البنية الأمنية أو خدمة إرسال البريد، ومع Google عند اختيار تسجيل الدخول بواسطة Google. وقد تتلقى السلطات العامة البيانات إذا فرض القانون ذلك أو بناءً على طلب صحيح.", "لا يمكن تحديد الأسماء القانونية لمقدمي الخدمات وأدوارهم والمتعاقدين الفرعيين وبلدان المعالجة بشكل كامل من ملفات المصدر المقدمة. ويجب تسجيلها في قائمة للمزودين وإدراجها في إجراءات CNDP المطبقة قبل الإطلاق. ولا تبيع KULHA! البيانات الشخصية ضمن التشغيل الموصوف في هذا الإصدار."] },
        { title: "7. المعالجة والتحويل خارج المغرب", paragraphs: ["قد تعالج بعض خدمات المصادقة أو الاستضافة أو قواعد البيانات أو البريد البيانات من بلد خارج المغرب. ولا تحدد الملفات المقدمة الوجهات بدقة. وقبل تفعيل هذه الخدمات في الإنتاج، يجب على KULHA! تحديد كل بلد ومزود وفئة بيانات والآلية القانونية المطبقة، واستكمال إجراءات أو تراخيص CNDP المطلوبة بموجب القانون رقم 09.08."] },
        { title: "8. مدد الاحتفاظ", paragraphs: ["لا ينبغي الاحتفاظ بالبيانات لمدة تتجاوز ما يلزم للأغراض المحددة، مع مراعاة الالتزامات القانونية والأمن وإقامة الدعاوى أو الدفاع عنها. ويؤكد كود المصدر صلاحية روابط التحقق من البريد لمدة 24 ساعة وروابط إعادة تعيين كلمة المرور لمدة ساعة؛ ولا تثبت مدة الصلاحية وحدها مدة الاحتفاظ بسجلاتها في قاعدة البيانات.", "يجب اعتماد جدول للاحتفاظ والحذف قبل النشر: [مدة بيانات الحساب بعد إغلاقه]؛ [مدة ملفات المتاجر والقرارات]؛ [مدة سجلات الأمن والتدقيق]؛ [مدة طلبات الدعم]؛ [قواعد حذف الرموز المنتهية]. ويجب تبرير كل مدة وتنفيذها تقنياً وإبلاغ المستخدمين بها."] },
        { title: "9. حقوقك", paragraphs: ["وفق الشروط المنصوص عليها في القانون المغربي رقم 09.08، يمكنك طلب الوصول إلى البيانات المتعلقة بك وتصحيح البيانات غير الدقيقة أو غير المكتملة والاعتراض على بعض المعالجات لأسباب مشروعة. وينص القانون أيضاً، في الحالات المحددة فيه، على حجب أو محو البيانات التي تمت معالجتها خلافاً لأحكامه. ويمكنك الاعتراض مجاناً على استخدام بياناتك لأغراض التسويق المباشر.", "لممارسة حقوقك، راسل [البريد الإلكتروني المخصص للخصوصية] مع بيان طلبك وتقديم المعلومات اللازمة بشكل معقول للتحقق من هويتك. ويجب على KULHA! تحديد إجراء داخلي وأجل للرد وسجل للطلبات قبل الإطلاق. كما يمكنك تقديم شكوى إلى CNDP وفق الشروط القانونية."] },
        { title: "10. الأمن", paragraphs: ["يستخدم التطبيق الذي تمت مراجعته تشفير كلمات المرور باستخدام Argon2id، ورموز جلسة غير مكشوفة مخزنة على شكل بصمات في الخادم، وملفات جلسة من نوع HttpOnly. ولا تغني هذه الإجراءات عن مراجعة كاملة لإعدادات الاستضافة والنسخ الاحتياطي وصلاحيات المسؤولين والتشفير أثناء النقل والتخزين وإدارة الحوادث وعقود المعالجة.", "لا يمكن لأي خدمة متصلة بالإنترنت ضمان أمن مطلق. ويجب على KULHA! الحفاظ على تدابير تقنية وتنظيمية تتناسب مع المخاطر وتوثيق إجراءات التعامل مع الحوادث الأمنية."] },
        { title: "11. القاصرون والمراسلات وتطور الخدمة", paragraphs: ["يجب على المشغّل تحديد قواعد وصول القاصرين وأي تحقق من العمر والحصول على مراجعة قانونية لها قبل الإنتاج. ولا يجوز للمستخدم تقديم بيانات شخص آخر دون أساس قانوني.", "يجب أن تحترم الرسائل التسويقية الإلكترونية شروط الموافقة المسبقة والإعلام والاعتراض المنصوص عليها في القانون. وإذا فعّلت KULHA! الحجوزات أو الطلبات أو المدفوعات أو تحديد الموقع أو التحليلات أو الإعلانات، فيجب تحديث هذه السياسة قبل جمع البيانات المرتبطة بها."] },
        { title: "12. الشكاوى وتحديث السياسة", paragraphs: ["للاستفسار عن هذه السياسة أو بياناتك، يرجى التواصل عبر [البريد الإلكتروني المخصص] أو [العنوان البريدي الكامل]. تاريخ السريان: [يستكمل]. الإصدار: 0.9 — مسودة عمل بتاريخ 5 نوفمبر 2026.", "يمكنك التواصل مع اللجنة الوطنية لمراقبة حماية المعطيات ذات الطابع الشخصي (CNDP) وفق الإجراءات المنشورة على موقعها الرسمي. وستؤرخ التغييرات الجوهرية وسيتم إبلاغك بها، كما ستُطلب معلومات أو موافقة جديدة عندما يفرض القانون ذلك."] }
      ],
      referencesTitle: "النصوص القانونية والمصادر الرسمية",
      references: [
        { label: "القانون رقم 09.08 — قاعدة البيانات القانونية الرسمية", url: "https://bdj.mmsp.gov.ma/Fr/Document/8974-Dahir.aspx" },
        { label: "CNDP — التصريح بالمعالجة والإجراءات المطبقة", url: "https://www.cndp.ma/notifier-un-traitement/" },
        { label: "CNDP — النصوص والقوانين", url: "https://www.cndp.ma/textes-et-lois/" }
      ],
      completionTitle: "عناصر تمنع النشر النهائي حالياً",
      completionBody: "هوية مسؤول المعالجة وعنوانه؛ جهة اتصال الخصوصية؛ مراجع ونطاق تصريحات/تراخيص CNDP؛ قائمة مقدمي الخدمات والمتعاقدين الفرعيين والبلدان؛ الأساس القانوني لكل معالجة وتحويل؛ مدد احتفاظ محددة وإجراءات الحذف؛ قناة وآجال ممارسة الحقوق؛ فحص ملفات تعريف الارتباط في الإنتاج؛ دليل خادمي على إصدار السياسة وتاريخ الموافقة."
    }
  }
};
