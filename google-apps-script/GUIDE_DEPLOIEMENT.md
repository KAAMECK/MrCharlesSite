# Déploiement du formulaire Usemi Vizuri Consulting

Le formulaire ouvre déjà WhatsApp avec le nom, l’adresse e-mail et le besoin du visiteur. Pour activer aussi l’enregistrement Google Sheets et la notification à kumanehemie@gmail.com :

1. Ouvrir le Google Sheet Usemi Vizuri Consulting — Registre des demandes.
2. Aller dans Extensions > Apps Script.
3. Remplacer le contenu de Code.gs par celui de ce dossier.
4. L’identifiant du Google Sheet est déjà renseigné dans Code.gs.
5. Ouvrir les paramètres du projet, activer l’affichage du fichier manifeste, puis remplacer appsscript.json par celui de ce dossier.
6. Cliquer sur Déployer > Nouveau déploiement > Application Web.
7. Choisir Exécuter en tant que : Moi et Qui a accès : Tout le monde.
8. Autoriser Google Sheets et l’envoi d’e-mails avec le compte propriétaire du registre.
9. Copier l’URL terminant par /exec.
10. Dans config.js, remplacer apiUrl: "#" par cette URL.

Après cette opération, chaque envoi créera une ligne dans le registre, adressera une notification à kumanehemie@gmail.com et ouvrira WhatsApp avec le même contenu.