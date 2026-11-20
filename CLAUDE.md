# MH Autobattler

Autobattler PvE solo au format roguelike, dans l'univers de Monster Hunter, inspiré de Teamfight Tactics et de Guildrun.
Projet personnel, jamais publié : les noms et monstres officiels de la série sont autorisés.

## Règles de travail (à respecter dans chaque session)

- **Répondre en français.** Expliquer les solutions techniques en termes accessibles à quelqu'un qui connaît TypeScript.
- **Avancer par étapes** (voir la feuille de route) et ne pas tout développer en même temps.
- **Ne jamais inventer une décision de game design importante.** Présenter des options avec leurs avantages et inconvénients, éventuellement une tendance clairement signalée, et laisser l'utilisateur trancher.
- **Ne pas ajouter de contenu réel** (unités, traits, objets, valeurs) sans validation. Les valeurs provisoires sont marquées ⚠️ dans le code et listées dans `docs/`.
- **Documenter chaque décision validée** dans `docs/`, avec une entrée dans l'historique en fin de `docs/game-design.md`.
- **Chaque fonctionnalité doit être testée.**
- **Ne commiter ou pousser que sur demande.**

## Feuille de route

1. **Game design** : règles validées ([docs/game-design.md](docs/game-design.md)).
2. **Architecture** : faite ([docs/architecture.md](docs/architecture.md)).
3. **Moteur de combat** : en place, avec tests automatisés.
4. **Prototype jouable** : bac à sable fait ([docs/prototype-content.md](docs/prototype-content.md)).
5. **Extension du gameplay** : en cours. Fait : rangs ★ (moteur et bac à sable), zones d'effet animées, jetons illustrés. À venir : boutique et run, unités de coût 4 et 5, Dragons anciens, éléments Eau et Dragon, et les 36 objets définitifs (l'utilisateur les conçoit lui-même).
6. **Intégration graphique** : plus tard.

Les questions de game design encore ouvertes sont dans la section 14 de `docs/game-design.md`. Les choix techniques provisoires sont dans la section 7 de `docs/architecture.md`.

## Documentation

| Fichier | Contenu |
|---|---|
| `docs/game-design.md` | Règles du jeu : la référence pour toute décision |
| `docs/architecture.md` | Organisation du code, événements de combat, choix provisoires |
| `docs/prototype-content.md` | Unités, traits, matériaux, objets et escouades du prototype |

## Commandes

| Commande | Effet |
|---|---|
| `npm install` | Installe les dépendances |
| `npm run dev` | Lance le bac à sable dans le navigateur |
| `npm test` | Lance les tests (Vitest) |
| `npm run typecheck` | Vérifie les types |
| `npm run build` | Vérifie les types et construit l'application |
| `npm run simulate -- 42 hard` | Simule l'équipe de démo dans le terminal (graine 42, escouade `easy`, `medium` ou `hard`) |

Avant de considérer un travail terminé : `npm run typecheck` et `npm test` doivent passer.

## Principes d'architecture

- **Technologies** : TypeScript, Vite, HTML/CSS et Canvas 2D. Pas de React, de framework ni de backend tant qu'ils n'apportent pas d'avantage concret.
- **Dépendances à sens unique** : `core → data → rules → combat → render → ui`. Un module n'importe jamais un module situé à sa droite. L'extérieur n'utilise le moteur qu'à travers `src/combat/index.ts`.
- **Le moteur ne touche jamais au DOM.** Il fonctionne sans affichage et produit des événements que le rendu rejoue. La logique de combat et les animations ne se mélangent pas.
- **Déterminisme** : le moteur n'utilise jamais `Math.random()`. Tout le hasard passe par le générateur à graine (`src/core/rng.ts`).
- **Les données de gameplay** (`src/data/`) sont séparées de la logique.
- **Petits fichiers**, une seule responsabilité chacun.

## Conventions de code

- Identifiants en anglais, commentaires et textes affichés en français.
- Imports relatifs avec l'extension `.ts`, pour que `scripts/simulate.ts` tourne directement avec Node.
- L'option `erasableSyntaxOnly` est activée : pas d'`enum`, pas de `namespace`, pas de propriétés déclarées dans le constructeur (`constructor(private x: X)`).
- TypeScript strict, avec `noUncheckedIndexedAccess`.
- Les tests sont placés à côté du fichier testé (`hex.ts` → `hex.test.ts`) ; les aides de test sont dans `src/test-utils/`.
