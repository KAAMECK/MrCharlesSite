# Déploiement du formulaire Usemi Vizuri Consulting

Le formulaire ouvre WhatsApp avec le nom, l’adresse e-mail, le besoin et le choix concernant les analyses et actualités. Le même service alimente le registre et le Dashboard journalier.

1. Ouvrir le Google Sheet Usemi Vizuri Consulting — Registre des demandes.
2. Aller dans Extensions > Apps Script.
3. Remplacer le contenu de Code.gs par celui de ce dossier.
4. L’identifiant du Google Sheet est déjà renseigné dans Code.gs.
5. Ouvrir les paramètres du projet, activer l’affichage du fichier manifeste, puis remplacer appsscript.json par celui de ce dossier.
6. Cliquer sur Déployer > Nouveau déploiement > Application Web. Si une version existe déjà, créer un nouveau déploiement/version avec le Code.gs actualisé.
7. Choisir Exécuter en tant que : Moi et Qui a accès : Tout le monde.
8. Autoriser Google Sheets et l’envoi d’e-mails avec le compte propriétaire du registre.
9. Copier l’URL terminant par /exec.
10. Dans config.js, remplacer apiUrl: "#" par cette URL.

Après l’activation :

- Dashboard affiche le rapport journalier et la tendance des 31 derniers jours ;
- Activité enregistre une visite par session de navigation et chaque tentative de contact ;
- Demandes conserve les formulaires validés et le choix actualités ;
- Contacts actualités conserve sans doublon les adresses ayant donné leur accord ;
- chaque demande ouvre WhatsApp et envoie une notification à kumanehemie@gmail.com.
