# KULHA! — Notes de rédaction juridique

**Version 0.9 — 5 novembre 2026**  
**Statut : projet de travail, non certifié, à faire valider par un avocat marocain et, pour les données personnelles, par un spécialiste CNDP.**

## Documents publiés dans l’interface

- Conditions d’utilisation : `src/lib/i18n/legal-copy.ts`, propriété `terms`, affichée par `/terms`, `/en/terms` et `/ar/terms`.
- Politique de confidentialité : `src/lib/i18n/legal-copy.ts`, propriété `privacy`, affichée par `/privacy`, `/en/privacy` et `/ar/privacy`.
- Le composant de rendu commun est `src/components/legal/LegalPolicyPage.tsx`.
- Le résumé d’inscription est dans `src/lib/i18n/auth-copy.ts` et les liens de modal sont localisés via `localePath`.

Les versions françaises, anglaises et arabes sont des traductions de travail. La langue contractuelle prévalente n’a volontairement pas été inventée : elle doit être décidée et validée avant publication définitive.

## Périmètre réel retenu

La rédaction est basée sur les éléments visibles dans les sources examinées : création de compte, vérification d’e-mail, connexion par e-mail ou Google, dossier commerçant soumis à approbation, gestion d’offres par les commerçants approuvés et informations d’offre (prix MAD, quantité, créneau de retrait, informations alimentaires et allergènes).

Les sources M4 indiquent que la découverte publique par les clients, la réservation, la commande et le paiement sont des étapes ultérieures. Les conditions le disent explicitement et ne prétendent pas qu’un achat ou un paiement en ligne est déjà disponible dans cette version.

## Ce que les archives ne permettent pas d’établir

Les éléments suivants restent des champs à compléter ou des vérifications préalables :

- La dénomination sociale, la forme juridique, le capital, le siège, le RC, l’ICE, l’IF et les coordonnées officielles de l’exploitant.
- Le rôle juridique exact de KULHA! dans une vente future et l’identité du vendeur contractuel.
- Les références de déclaration/autorisation CNDP et l’analyse des formalités applicables à chaque traitement.
- Les noms des hébergeurs, prestataires e-mail, sous-traitants, pays de traitement et mécanismes de transfert.
- Les durées de conservation exactes et les mécanismes techniques de suppression.
- La procédure de demandes d’accès/rectification/opposition et le contact officiel correspondant.
- Le scan des cookies sur le déploiement de production, avec tous les scripts tiers et pixels réellement présents.
- Les modalités d’accès des mineurs.
- La langue contractuelle faisant foi en cas de divergence.

Aucune valeur n’a été inventée pour ces sujets. Les pages affichent donc clairement le statut de projet et les champs à finaliser.

## Points d’implémentation importants

1. Le formulaire d’inscription affiche une case et une modal de prise de connaissance, mais l’API d’inscription examinée ne reçoit pas de version de politique, date d’acceptation ou preuve serveur. Cette interface ne constitue donc pas encore une preuve durable et auditable du consentement/acceptation. Avant lancement, ajouter un enregistrement serveur versionné qui distingue l’acceptation des conditions de la politique de confidentialité et de tout consentement facultatif.
2. Le code source contient des cookies techniques d’authentification : `kulha_at`, `kulha_rt` et `kulha_google_oauth`. Leur configuration de production doit être vérifiée sur le site déployé.
3. Le code source examiné ne révèle pas de pixel publicitaire ou d’outil analytique configuré. Il faut néanmoins scanner le déploiement réel et mettre à jour l’inventaire avant d’affirmer définitivement qu’aucun traceur non essentiel n’est utilisé.
4. Les liens vers les textes légaux officiels sont fournis comme ressources de référence, pas comme avis juridique.
5. La règle marocaine de rétractation n’est pas résumée comme une exemption générale pour tous les aliments : la loi prévoit des exceptions spécifiques, dont certaines denrées susceptibles de se détériorer ou de se périmer rapidement. L’application doit être évaluée produit par produit et contrat par contrat.

## Sources officielles consultées

- Loi n° 09-08 : https://bdj.mmsp.gov.ma/Fr/Document/8974-Dahir.aspx
- CNDP — notifier un traitement : https://www.cndp.ma/notifier-un-traitement/
- CNDP — textes et lois : https://www.cndp.ma/textes-et-lois/
- Loi n° 31-08 — informations sur les droits des consommateurs : https://www.mcinet.gov.ma/fr/content/protection-consommateur/droits-garantis-aux-consommateurs
- Loi n° 28-07 — sécurité sanitaire des produits alimentaires, ONSSA : https://www.onssa.gov.ma/reglementation/reglementation-transversale/securite-sanitaire/

---

Ce document et les pages intégrées sont des projets de rédaction et ne constituent ni une consultation juridique ni une attestation de conformité. Ne pas les publier comme version finale avant clôture de la checklist et validation professionnelle.
