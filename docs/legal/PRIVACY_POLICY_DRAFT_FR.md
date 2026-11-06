# Politique de confidentialité

**Projet à finaliser avant publication.** L’identité juridique du responsable, les références des formalités CNDP, la liste réelle des prestataires et pays de traitement, ainsi que les durées précises de conservation ne figurent pas dans les archives du projet examinées. Les champs correspondants sont signalés ci-dessous et doivent être complétés avant la mise en production. Une revue juridique et opérationnelle reste nécessaire.

**Version :** 0.9  
**Dernière mise à jour :** 5 novembre 2026

Cette politique explique les données personnelles que la version actuellement examinée de KULHA! traite, pourquoi elles sont utilisées et comment exercer vos droits.

## 1. Responsable du traitement et contact

Le responsable du traitement est [DÉNOMINATION SOCIALE COMPLÈTE], [forme juridique], dont le siège est situé à [adresse complète, ville, Maroc]. Contact pour la protection des données : [adresse e-mail dédiée] · [adresse postale ou service]. Contact général : [e-mail] · [téléphone].

Référence de déclaration ou d’autorisation CNDP : [numéro, date et périmètre du récépissé/de l’autorisation, ou référence de l’exemption applicable après confirmation]. Ces renseignements doivent être complétés après détermination des formalités effectivement applicables à chaque traitement.

## 2. Périmètre de cette politique

Cette politique est fondée sur l’examen du code de l’application KULHA! fourni pour le projet. Les fonctionnalités de compte, d’authentification, de vérification d’e-mail, de demande commerçant et de gestion d’offres sont présentes dans cette version. La découverte publique de paniers, la réservation client, la commande et le paiement ne sont pas encore implémentés dans la version examinée. Cette politique devra être mise à jour avant l’activation de nouveaux traitements liés à ces fonctionnalités.

## 3. Données traitées

Selon le parcours utilisé, les catégories suivantes peuvent être traitées :

- Compte : nom complet, adresse e-mail, numéro de téléphone facultatif, identifiant du compte, rôle et état de vérification de l’adresse e-mail.
- Authentification et sécurité : empreinte cryptographique du mot de passe (le mot de passe en clair n’est pas conservé par l’application), données de session et de renouvellement, empreintes de jetons, événements de connexion et de sécurité.
- Connexion Google, uniquement si vous la choisissez : identifiant du fournisseur et identifiant de compte Google nécessaires à l’association et à l’authentification. KULHA! ne reçoit pas votre mot de passe Google.
- Dossier commerçant : nom et type d’activité, adresse, ville, téléphone, horaires, état du dossier, décisions administratives et motifs associés.
- Offres commerçants : titre, description, catégorie, prix, quantité, créneaux de retrait, informations alimentaires et déclarations d’allergènes, état et historique de modification.
- Audit et sécurité : identifiant de l’acteur, action, objet concerné, date, identifiant de corrélation et journaux techniques. L’adresse IP ou des données de diagnostic peuvent aussi apparaître dans les journaux de l’infrastructure selon la configuration de production.

## 4. Finalités et bases de traitement

Les données sont utilisées uniquement pour des finalités déterminées et dans la mesure nécessaire, notamment :

- Créer et administrer un compte, vérifier l’adresse e-mail, permettre la connexion et la récupération d’accès.
- Traiter une demande commerçant, vérifier les informations fournies, gérer l’approbation, le rejet ou la suspension et permettre la gestion des offres.
- Protéger le service, détecter les abus, limiter les tentatives automatisées, assurer l’audit et traiter les incidents.
- Répondre aux demandes de support et respecter les obligations légales ou les demandes valides des autorités.
- Le cas échéant, envoyer des communications commerciales uniquement après avoir obtenu le consentement préalable requis. La version examinée ne met pas en évidence un outil de marketing direct configuré.

## 5. Cookies et stockage de session

La version du code examinée utilise des cookies techniques nécessaires à l’authentification et à la sécurité :

- kulha_at : cookie de session d’accès, HttpOnly, SameSite=Lax, sécurisé en production ; sa durée dépend de l’expiration du jeton d’accès.
- kulha_rt : cookie de renouvellement de session, HttpOnly, SameSite=Lax, sécurisé en production ; durée maximale configurée dans le code web : 30 jours.
- kulha_google_oauth : cookie temporaire du parcours Google, HttpOnly, SameSite=Lax, sécurisé en production, limité à 10 minutes et utilisé pour protéger l’état, le nonce et le mécanisme PKCE.

## 6. Destinataires et prestataires

Les données peuvent être accessibles aux membres habilités de l’équipe KULHA! selon leurs fonctions. Elles peuvent être communiquées, dans la mesure nécessaire, aux prestataires techniques qui hébergent l’application, la base de données, les systèmes de sécurité ou l’envoi d’e-mails, ainsi qu’à Google lorsque vous choisissez la connexion Google. Les autorités publiques peuvent recevoir des données lorsqu’une obligation légale ou une demande valable l’exige.

Les noms juridiques des prestataires, leurs rôles, les données accessibles, les sous-traitants ultérieurs et les pays de traitement ne sont pas identifiables de manière complète dans les fichiers de code fournis. Ils doivent être inscrits dans un inventaire des prestataires et reflétés dans les formalités CNDP applicables avant le lancement. KULHA! ne vend pas les données personnelles dans le fonctionnement décrit par cette version.

## 7. Traitements et transferts hors du Maroc

Certains services d’authentification, d’hébergement, de base de données ou d’e-mail peuvent traiter des données depuis un pays situé hors du Maroc. Les destinations exactes ne sont pas établies par les fichiers fournis. Avant d’activer ces services en production, KULHA! doit identifier chaque pays destinataire, le prestataire, les catégories de données et le mécanisme juridique applicable, puis accomplir les formalités ou obtenir les autorisations CNDP nécessaires conformément à la loi n° 09-08.

## 8. Durées de conservation

Les données ne doivent pas être conservées au-delà de la durée nécessaire aux finalités annoncées, sous réserve des obligations légales, de la sécurité et de la défense de droits en justice. Le code confirme une validité de 24 heures pour les liens de vérification d’e-mail et d’une heure pour les liens de réinitialisation du mot de passe ; ces durées de validité ne prouvent pas à elles seules la durée de conservation des enregistrements correspondants en base.

Un calendrier de conservation et de suppression doit être approuvé avant publication : [durée du compte après fermeture] ; [durée des dossiers commerçants et décisions] ; [durée des journaux de sécurité et d’audit] ; [durée des demandes de support] ; [règles de purge des jetons expirés]. Les durées doivent être justifiées, mises en œuvre techniquement et communiquées aux personnes concernées.

## 9. Vos droits

Dans les conditions prévues par la loi marocaine n° 09-08, vous pouvez notamment demander l’accès aux données vous concernant, leur rectification lorsqu’elles sont inexactes ou incomplètes et vous opposer à certains traitements pour des motifs légitimes. La loi prévoit également, dans les cas qu’elle définit, le blocage ou l’effacement de données traitées en violation de ses dispositions. Vous pouvez vous opposer gratuitement à l’utilisation de vos données à des fins de prospection directe.

Pour exercer vos droits, écrivez à [adresse e-mail dédiée aux données personnelles] en précisant votre demande et en fournissant les éléments raisonnablement nécessaires à la vérification de votre identité. KULHA! doit définir une procédure interne, un délai de traitement et un registre des demandes avant le lancement. Vous pouvez également saisir la CNDP dans les conditions prévues par la loi.

## 10. Sécurité

L’application examinée utilise notamment le hachage Argon2id pour les mots de passe, des jetons de session opaques stockés sous forme d’empreintes dans le backend, et des cookies de session HttpOnly. Ces mesures ne remplacent pas un examen complet de la configuration d’hébergement, des sauvegardes, des accès administrateurs, du chiffrement en transit et au repos, de la gestion des incidents et des contrats de sous-traitance.

Aucun service accessible par Internet ne peut garantir une sécurité absolue. KULHA! doit maintenir des mesures techniques et organisationnelles proportionnées aux risques et documenter le traitement des incidents de sécurité.

## 11. Enfants, communications et évolution du service

Les modalités d’accès des mineurs et les éventuelles vérifications d’âge doivent être définies par l’exploitant et validées juridiquement avant la mise en production. Les utilisateurs ne doivent pas fournir de données personnelles d’un tiers sans base légitime.

Toute prospection électronique devra respecter les conditions de consentement préalable, d’information et d’opposition prévues par la loi applicable. Si KULHA! active des réservations, commandes, paiements, géolocalisation, outils d’analyse ou publicités, la présente politique devra être mise à jour avant la collecte correspondante.

## 12. Réclamation et mise à jour de la politique

Pour toute question relative à cette politique ou à vos données, contactez [adresse e-mail dédiée] ou [adresse postale complète]. Date d’entrée en vigueur : [à compléter]. Version : 0.9 — projet de travail du 5 novembre 2026.

Vous pouvez saisir la Commission Nationale de contrôle de la protection des Données à caractère Personnel (CNDP) selon les modalités publiées sur son site officiel. Toute modification substantielle de cette politique sera datée et portée à votre connaissance ; une nouvelle information ou un nouveau consentement sera recueilli lorsque la loi l’exige.

## Textes officiels et ressources

- [Loi n° 09-08 — texte officiel (Base de données juridiques du Maroc)](https://bdj.mmsp.gov.ma/Fr/Document/8974-Dahir.aspx)
- [CNDP — notifier un traitement et formalités applicables](https://www.cndp.ma/notifier-un-traitement/)
- [CNDP — textes et lois](https://www.cndp.ma/textes-et-lois/)

## Éléments qui empêchent encore une publication définitive

Identité et adresse du responsable ; e-mail/délégué ou service de contact ; références et périmètre des déclarations/autorisations CNDP ; cartographie des prestataires, sous-traitants et pays ; base juridique de chaque traitement et de chaque transfert ; durées de conservation chiffrées et procédures de purge ; canal et délais de traitement des droits ; scan des cookies en production ; preuve serveur de la version et de la date de consentement aux politiques.
