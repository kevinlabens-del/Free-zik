# free-zik 📺

PWA indépendante, avec recherche de vidéos et playlists YouTube, conversion vers `yout-ube.com`, historique, favoris et options de diffusion TV.

## Ouvrir l'application

**[free-zik en ligne](https://free-zik-creatix5.vercel.app/)**

L'application est hébergée en HTTPS sur le projet Vercel indépendant `free-zik`. Elle est également conservée dans ce dépôt GitHub.

## Installation Android

Ouvrir le lien HTTPS dans Chrome sur Android puis sélectionner **⋮ → Installer l'application** (ou **Ajouter à l'écran d'accueil**, selon le navigateur).

## Publication GitHub Pages (optionnelle)

Le workflow `.github/workflows/deploy.yml` est prêt, mais GitHub Pages doit être activé une première fois par le propriétaire du dépôt dans **Settings → Pages → Build and deployment → Source → GitHub Actions**. Après activation, relancer le workflow pour publier également sur `https://kevinlabens-del.github.io/Free-zik/`.

## Limites de fonctionnement

- La recherche sans clé API dépend de serveurs Invidious publics qui peuvent être indisponibles ou bloquer les requêtes depuis le navigateur.
- `yout-ube.com` peut refuser l'intégration dans un lecteur. Un lecteur YouTube officiel et l'ouverture du lien sont disponibles en secours.
- Pour caster du contenu YouTube, ouvrir YouTube et utiliser son bouton Cast. Sélectionner un écran via la PWA ne lance pas automatiquement le flux vidéo.
- free-zik n'est pas affilié à YouTube ou Google.

**État** : fichiers GitHub publiés ; déploiement Vercel prêt. Le déploiement GitHub Pages attend l'activation de Pages par le propriétaire.
