# Jeu "Trouve le Dessin"

Un jeu interactif où des images SVG bougent sur un canvas. Le joueur doit cliquer sur l'image correspondant au nom affiché en haut.

## Comment jouer

1. Ouvrez `index.html` dans un navigateur web.
2. Le nom d'une image est affiché en haut.
3. Cliquez sur l'image correspondante parmi celles qui bougent sur le canvas.
4. Gagnez des points pour les bonnes réponses, évitez les erreurs.

## Fichiers

- `index.html`: Page HTML principale avec le canvas et les éléments UI.
- `sketch.js`: Code JavaScript pour la logique du jeu (mouvement des images, clics, score).
- `Assets/SVG/`: Dossier contenant les 49 images SVG des personnages.
- `Assets/wanted-minigame.mp3`: Fichier audio pour la musique de fond.

## Développement

Utilisez un serveur local pour éviter les problèmes CORS. Par exemple, avec Python :
```
python -m http.server 8000
```
Puis ouvrez http://localhost:8000 dans votre navigateur.