
**Scolarité Pro - Système de Gestion Intégré (Full Stack) **
**Contacter moi par mail**

Scolarité Pro est une application de gestion académique complète utilisant une architecture client-serveur. Elle permet de centraliser les données des étudiants, des filières et des cycles universitaires avec une persistance des données via SQL.

🛠️ Stack Technique

Frontend : HTML5, CSS3 (Variables natives), JavaScript (Vanilla ES6).

Backend : Node.js avec le framework Express.

Base de données : SQL (MySQL/PostgreSQL/SQLite) pour une gestion relationnelle robuste.

API : RESTful API pour la communication entre le client et le serveur.

🚀 Fonctionnalités principales

Tableau de Bord : Statistiques dynamiques calculées en temps réel via des requêtes SQL.

Gestion des Étudiants : - Inscription avec validation côté serveur.

Recherche dynamique par la première lettre (optimisée côté client).

Gestion des Filières & Années : CRUD complet (Création, Lecture, Mise à jour, Suppression).

Maintenance : Exportation des données au format CSV et système de sauvegarde.

🔍 Zoom sur la Recherche Dynamique

L'interface utilise une logique de filtrage instantanée :

Méthode : startsWith() en JavaScript.

Avantage : L'utilisateur voit les résultats s'affiner dès la première lettre saisie, offrant une navigation fluide sans recharger la page.

Performance : Filtrage direct sur le DOM pour une réactivité maximale après le chargement initial des données.

📦 Installation et Configuration

1. Prérequis

Node.js installé sur votre machine.

Un serveur SQL actif.

2. Configuration du Backend

Naviguez dans le dossier server/.

Installez les dépendances :

npm install


Configurez vos variables d'environnement dans un fichier .env (Hôte, utilisateur, mot de passe SQL).

3. Lancement

Démarrez le serveur Express :

node server.js


Ouvrez le fichier index.html dans votre navigateur ou servez-le via un serveur statique.

🎨 Design & UI

Modernité : Interface épurée avec la police Inter et des icônes SVG.

UX : Feedback visuel immédiat via un système de notifications (Alerts) intégré.

Adaptabilité : Design "Mobile-First" entièrement responsive.

📄 Licence

Ce projet est distribué sous licence propriétaire pour un usage administratif interne.
