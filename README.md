# 🏹 Mon Jeu WebXR
![Build Status](https://github.com/VincentMiras/Threegame/actions/workflows/deploy.yml/badge.svg?branch=main)
![Commit Status](https://img.shields.io/github/commit-activity/t/VincentMiras/ThreeGame?)


Un jeu en 3D basé sur Three.js et WebXR, intégrant un système de combat avec des flèches et des ennemis. Réalisé en tant que projet d'école.

## Description du jeu

Ce petit jeu est un shooter dans lequel une horde de squelettes vous à pris pour cible. Terrassez les, faites les tourner et résister le plus longtemps possible à leurs attaques.

## 🎮 Fonctionnalités
- Rendu 3D avec **Three.js**
- Intégration du jeu dans le monde réel en **AR**
- **Multiples ennemis** avec animations et IA basique

## 🚀 Installation

### Prérequis
- Un appareil et un navigateur compatible WebXR
- [Node.js](https://nodejs.org/) installé (si vous voulez télécharger le jeu en local cf. ci-dessous) 

### Étapes
Jouer directement au jeu sur :
                  https://vincentmiras.github.io/webxr/

ou bien (beaucoup plus complexe):


1. **Cloner le projet**
   ```sh
   git clone https://github.com/ton-repo/mon-jeu.git
   cd mon-jeu
   ```
2. **Installer les dépendances**
   ```sh
   npm install
   ```
3. **Lancer le jeu**
   ```sh
   npm run dev
   ```
   Cela permet uniquement de le faire tourner sur un server local et donc doit nécessité un appareil compatilble.
4. **Ouvrir le server à l'extérieur**
  Pour cela vous devez créer un tunnel qui sécurise votre connexion en https avec cloudflare ou ngrok. 

<p align="center">
    <img src="public/Screen.PNG" width="400"/>
</p>

## 🎯 Commandes
| Action            | Touche |
|------------------|--------|
| Se déplacer | Bouger votre téléphone |
| Tirer une flèche | Toucher l'écran |

## 🏆 Objectif
Marquer le plus de points possible en affrontant des vagues d'ennemis !
Amusez-vous surtout !

## Sources

- Beaucoup de ressources utilisées viennent des cours de M. DOGANIS:
      https://github.com/fdoganis/three_vite
  
- La plupart des mécaniques ont été mises en place grâce à la documentation et aux exemples de threejs.
      (https://threejs.org/docs/, https://threejs.org/examples/)

## 📜 Licence
Ce projet est sous licence MIT. Utilisation libre avec attribution.

