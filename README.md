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


## Suggestions musicales (v2)

Dès la première lettre, un menu affiche des idées musicales et les recherches précédentes. Des suggestions récentes YouTube et des titres musicaux iTunes enrichissent ensuite la liste via le service /api/suggest sur Vercel. Navigation tactile ou au clavier. Si le service distant est indisponible, les propositions locales restent disponibles.


## Samsung Smart TV — mode Web grand écran (V7)

Ouvrir le navigateur Internet de la télévision et saisir :

**https://free-zik-creatix5.vercel.app/tv.html**

La version TV est également accessible depuis la version téléphone avec le bouton « Mode TV ». Les téléviseurs Samsung dont le navigateur annonce Tizen/SMART-TV sont orientés automatiquement vers `tv.html`. Pour revenir à la version mobile, utiliser le lien « Version mobile ».

- Interface adaptée aux écrans TV et aux petits écrans mobiles ; recherche par titre, artiste ou URL YouTube.
- Touches fléchées, OK/Entrée et Retour sur la télécommande (dans les limites du navigateur Samsung).
- Résultats depuis une API de recherche Web dans `api/search.js` utilisant des instances publiques ; la disponibilité n'est **pas garantie**.
- Historique et favoris enregistrés **localement sur chaque appareil** (pas de synchronisation téléphone-TV).
- Lecteur intégré de secours YouTube `youtube-nocookie.com` sur TV, car la page `yout-ube.com` n'est pas un lecteur vidéo fiable. Certaines vidéos peuvent refuser l'intégration, et les publicités YouTube peuvent apparaître : **sans publicité n'est pas garanti**.
- Aucun code Tizen propriétaire n'est nécessaire : simple site Web HTTPS, sans installation d'application Samsung.

### Vérifications

Le code JavaScript, les références des éléments de la page et une réponse simulée de l'API de recherche ont été vérifiés. Le déploiement Vercel V7 s'est terminé avec succès, avec la fonction `api/search` construite. Le fonctionnement de la télécommande et la lecture vidéo restent à confirmer sur un téléviseur Samsung réel (compatibilité dépendante du modèle et de sa version Tizen).
