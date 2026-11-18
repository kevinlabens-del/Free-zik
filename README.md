# free-zik

Application PWA de recherche de vidéos et playlists YouTube, conversion vers `yout-ube.com`, favoris, historique et options Cast.

## Adresse publique

Quand GitHub Pages est activé avec **Build and deployment → Source → GitHub Actions** :

https://kevinlabens-del.github.io/Free-zik/

## Installation Android

Ouvrir le site dans Chrome via HTTPS, puis menu ⋮ → **Installer l’application**.

## Fonctionnement et limites

- Les recherches automatiques via Invidious dépendent d'instances tierces et peuvent échouer (CORS, disponibilité). Une clé personnelle YouTube Data API est possible dans les réglages.
- L’intégration `yout-ube.com` dans un iframe peut être bloquée par le site tiers. Le lecteur YouTube officiel et l’ouverture externe sont proposés comme solutions de secours.
- Le Cast d'une vidéo YouTube passe par l’application YouTube ; la sélection d’un appareil Google Cast seule ne diffuse pas un lien de page YouTube.
- Aucune affiliation avec Google ou YouTube.
