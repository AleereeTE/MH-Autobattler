# Monster Hunter Autobattler — Architecture technique

> Étape 2. Dernière mise à jour : 2026-11-20.
> Les règles de jeu sont décrites dans [game-design.md](game-design.md) ; ce document décrit comment le code est organisé.

---

## 1. Principes

1. **Le moteur ne connaît pas l'affichage.** Le code de combat est du TypeScript pur : aucun accès au DOM ni au Canvas. Il tourne aussi bien dans le navigateur que dans les tests ou dans un script Node.
2. **Les dépendances vont dans un seul sens** (de gauche à droite, un module n'importe jamais un module situé à sa droite) :

   ```
   core  →  data  →  rules  →  combat  →  render  →  ui
                                  └──────→  run  ──────────↗
   ```

   `run` (le mode run : boutique, réserve, fusion, chasses) utilise le moteur de combat ; seule l'interface utilise `run`.

   Exemple : `combat` peut utiliser `rules`, mais `rules` n'importe jamais `combat`. Ainsi, on peut remplacer tout le rendu sans toucher au moteur.
3. **Déterminisme.** Le moteur n'utilise jamais `Math.random()`. Le hasard vient d'un générateur à graine (seed) stocké dans l'état du combat : *même équipe + même graine = même combat*, à l'identique. C'est ce qui rend les tests fiables et les replays possibles.
4. **Le combat produit des événements.** Chaque action (déplacement, attaque, dégâts, compétence, K.O.…) est enregistrée comme un événement daté. Le moteur simule le combat entier d'un coup, puis l'affichage *rejoue* les événements à la vitesse voulue (×1, ×2…).
5. **Les données sont séparées du code.** Les fiches d'unités sont de simples objets TypeScript ; les modifier ne demande pas de toucher au moteur.
6. **Petits fichiers, une seule responsabilité chacun.**

---

## 2. Arborescence

```
src/
  core/                 Outils génériques, sans notion de jeu
    rng.ts              Générateur aléatoire à graine
    hex.ts              Grille hexagonale : coordonnées, distances, voisins
  data/                 Données de gameplay (aucune logique)
    definitions.ts      Formes des fiches : unité, statistiques, compétence, bonus
    balance.ts          Constantes de règles (durée de combat, critique…)
    energy-profiles.ts  Génération d'énergie par rôle
    traits.ts           Traits, paliers et effets
    items.ts            Matériaux et objets
    units/              Les 12 unités du prototype (chasseurs, monstres)
    squads.ts           Escouades ennemies et équipe de démonstration
  rules/                Calculs purs (entrée → sortie, sans état)
    damage.ts           Réduction par la défense, critique, montants des compétences
    stats.ts            Statistiques de combat = fiche + bonus
    ranks.ts            Rangs ★ : multiplicateur des PV et de l'attaque, valeur de base par rang
    equipment.ts        Emplacements, fusion des matériaux, objets
    traits.ts           Comptage des traits et paliers actifs
    sudden-death.ts     Multiplicateurs de la mort subite
  combat/               Moteur de combat
    index.ts            API publique du moteur (seul point d'entrée pour l'extérieur)
    constants.ts        Ticks par seconde, limite de sécurité
    state.ts            État d'un combat en cours
    events.ts           Liste des événements de combat
    setup.ts            Création et validation d'un combat (équipement, traits)
    step.ts             Un tick de simulation
    unit-turn.ts        Ce que fait une unité pendant un tick
    simulate.ts         Simule un combat complet
    energy.ts           Gain d'énergie (avec blocage pendant une compétence)
    actions/            Actions : attaque, dégâts, soin, déplacement, bond, effets à l'impact
    behaviors/          Comportements : choix de cible, recherche de chemin
    skills/             Compétences : incantation et effets (dégâts, bouclier, soin, bonus)
    status/             Effets temporaires : bonus/ralentissements, boucliers, brûlure
    traits/             Effets des traits en combat (bonus, éclairs de Foudre)
  render/               Affichage d'un combat à partir de ses événements
    replay.ts           Reconstitue l'état visible à n'importe quel instant
    board-canvas.ts     Dessin Canvas 2D temporaire (hexagones, jetons, zones d'effet)
    skill-area.ts       Animation des zones d'effet (onde du centre vers l'extérieur)
    hex-layout.ts       Passage cases ↔ pixels
    combat-summary.ts   Bilan par unité (dégâts, soins, K.O.)
    text-log.ts         Journal texte
    labels.ts           Libellés français
  run/                  Mode run (logique pure, sans affichage)
    index.ts            API publique du mode run (seul point d'entrée pour l'interface)
    state.ts            État d'une run : chasse, zennys, niveau, unités, stock, inventaire
    structure.ts        30 chasses en 3 stages, boss aux chasses 10, 20 et 30
    flow.ts             Déroulement : début de tour, combat, résultat, récompense, fin de run
    economy.ts          Revenus, intérêts, revente, prix des niveaux
    pool.ts             Stock commun des exemplaires et tirage selon le niveau de boutique
    shop.ts             Boutique : relance, achat, amélioration
    roster.ts           Réserve et plateau : réception, déplacement, vente
    merge.ts            Fusion automatique de 3 exemplaires et regroupement de l'équipement
    inventory.ts        Équiper depuis l'inventaire, retirer (retire-objet pour un objet)
    enemies.ts          Escouades ennemies générées selon un budget
    rewards.ts          Récompenses « 1 parmi 3 »
  ui/                   Interface HTML/CSS
    app.ts              Coquille : titre et onglets (« Mode run », « Bac à sable »), choisis par l'adresse (#run, #sandbox)
    run/                Page « Mode run » (bandeau, boutique, réserve, inventaire, fin de combat)
    sandbox/            Page « bac à sable » (composition, équipement)
    shared/             Éléments communs : plateau, lecteur de replay, bilan, portraits, fiche d'unité, synergies
    dom.ts              Petit utilitaire de création d'éléments
    styles.css          Styles (thème clair et sombre)
  assets/portraits/     Images des jetons, une par unité (voir la section 5)
  sandbox/              Conversion des compositions prédéfinies en combats
  test-utils/           Aides pour les tests (unités de test, runs de test)
  main.ts               Point d'entrée du navigateur
scripts/
  simulate.ts           Simule un combat dans le terminal
```

Les tests sont placés à côté du fichier testé (`hex.ts` → `hex.test.ts`).

### Correspondance avec les responsabilités demandées

| Responsabilité | Emplacement |
|---|---|
| 1. Moteur de combat | `src/combat/` (`state`, `step`, `simulate`) |
| 2. Règles et calculs | `src/rules/` |
| 3. Données des chasseurs et des monstres | `src/data/` |
| 4. Compétences et effets | `src/combat/skills/` |
| 5. Comportements des unités | `src/combat/behaviors/` |
| 6. Progression et récompenses | `src/run/` (à venir) |
| 7. Interface utilisateur | `src/ui/` |
| 8. Rendu graphique et animations | `src/render/` |

---

## 3. Déroulement d'un combat

1. **Préparation** : un `CombatSetup` liste les unités de chaque camp et leur case. `createCombatState` vérifie ce placement et crée l'état du combat.
2. **Simulation** : `step` est appelé en boucle. **Un tick = 1/20 de seconde** de combat.
3. **Résultat** : `simulateCombat` renvoie le vainqueur, la durée et la liste complète des événements.

### Ordre des opérations dans un tick

1. Le compteur de ticks avance. À 60 s, un événement « mort subite » est émis.
2. Chaque unité vivante agit, dans l'ordre de son identifiant :
   1. elle gagne son énergie passive ;
   2. si elle est en train d'incanter une compétence, l'incantation progresse ;
   3. si elle est en train de se déplacer, le déplacement progresse ;
   4. sinon, elle choisit une cible, puis : se rapproche si la cible est hors de portée, lance sa compétence si son énergie est pleine, ou attaque.
3. **Les K.O. sont résolus tous ensemble, en fin de tick.**
4. On vérifie si le combat est terminé.

Pourquoi résoudre les K.O. en fin de tick ? Deux unités qui se frappent au même instant tombent ensemble : l'ordre de traitement ne favorise personne, et l'égalité (qui compte comme une victoire du joueur) devient possible.

### Fiche et état

- Une **fiche** (`UnitDefinition`, dans `data/`) décrit une unité : nom, rôle, élément, statistiques de base, compétence. Elle ne change jamais.
- Un **état de combat** (`CombatUnit`, dans `combat/`) décrit une unité pendant un combat : position, PV restants, énergie, cible, action en cours.

Les statistiques de combat sont calculées au début du combat : statistiques de la fiche ajustées au rang ★ (PV et attaque brute ×1,8 par rang), puis bonus des matériaux, des objets et des traits. Le rang (`rank` du placement, ★1 par défaut) choisit aussi la valeur de base de la compétence.

---

## 4. Événements de combat

| Événement | Signification | Utilité pour le rendu |
|---|---|---|
| `combatStart` | Liste des unités et de leurs positions | Placer les unités |
| `move` | Une unité part vers une case voisine (avec la durée du trajet) | Animer le déplacement |
| `leap` | Une unité bondit à côté de sa cible | Animation de bond |
| `attack` | Une unité attaque sa cible | Animation d'attaque |
| `damage` | Dégâts subis (montant, part absorbée, type, cause, critique, PV restants) | Chiffres de dégâts, barre de vie |
| `heal` | PV rendus | Chiffres de soin |
| `shield` | Bouclier gagné | Barre de bouclier |
| `status` | Brûlure, ralentissement ou bonus appliqué (avec sa durée) | Icônes d'état |
| `lightning` | Éclair du trait Foudre | Effet d'éclair |
| `skillCast` | Début d'incantation d'une compétence | Animation de préparation |
| `skillResolve` | La compétence prend effet | Effet visuel de la compétence |
| `skillArea` | Zone touchée par un effet de compétence : centre (cible principale ou lanceur), rayon et type d'effet | Animation de la zone d'effet |
| `death` | Une unité est K.O. | Animation de K.O. |
| `suddenDeath` | Début de la mort subite | Alerte visuelle |
| `combatEnd` | Vainqueur et raison de la fin | Écran de résultat |

---

## 5. Jetons des unités

| Partie du jeton | Signification |
|---|---|
| Fond | Coût : gris (1), vert (2), bleu (3), violet (4), doré (5) |
| Image | Portrait de l'unité, ou ses initiales s'il n'y en a pas |
| Anneau | Élément (gris = sans élément) |
| Barre de vie | Camp : bleue pour le joueur, rouge pour l'ennemi |
| Pastille du bas | Rang : ★ bronze, ★★ argent, ★★★ or |
| Points sur le côté gauche | États : brûlure, ralentissement, accélération |

Les couleurs sont des variables CSS (`--cost-1` à `--cost-5`, `--side-player`, `--side-enemy`…) dans `src/ui/styles.css`, avec une variante pour le thème sombre.

### Portraits

- Déposer une image dans `src/assets/portraits/`, nommée d'après l'identifiant de l'unité : `barroth.png`, `tobi-kadachi.webp`… (formats acceptés : png, webp, jpg, svg).
- Une image carrée est idéale : elle est recadrée dans le cercle. Les parties transparentes laissent voir le fond de la couleur du coût.
- Vite trouve les images à la compilation (`import.meta.glob`), donc aucune liste à tenir à jour.

---

## 6. Mode run

- **Toute la logique est dans `src/run/`**, sans affichage : les fonctions modifient un `RunState` et renvoient `{ ok: true }` ou `{ ok: false, reason }` (raison affichée telle quelle).
- **Déterminisme** : une run a sa propre graine. Boutique, escouades, récompenses et graines des combats en découlent ; seule la graine de départ vient de l'interface.
- **Le combat est simulé d'un coup** au clic sur « Lancer la chasse » : la run avance aussitôt, puis l'interface rejoue le combat. Pendant le replay, le bandeau affiche les valeurs d'avant le combat, et le résultat n'apparaît qu'à la fin.
- **Fusion** : après chaque arrivée d'unité (achat, récompense), `resolveMerges` cherche 3 exemplaires identiques du même rang. Un achat réserve pleine passe par une place d'attente, consommée par la fusion. `canReceive` vérifie la place en simulant l'arrivée sur une copie de l'état.
- **Stock** : les unités affichées en boutique sont retirées du stock ; une relance les y remet, une vente y rend ses exemplaires.
- La run en cours est gardée en mémoire quand on change d'onglet, mais pas encore sauvegardée (question ouverte n°9).

---

## 7. Commandes

| Commande | Effet |
|---|---|
| `npm install` | Installe les dépendances (une seule fois) |
| `npm test` | Lance tous les tests |
| `npm run test:watch` | Relance les tests à chaque modification |
| `npm run typecheck` | Vérifie les types TypeScript |
| `npm run simulate` | Simule l'équipe de démo contre l'escouade Moyenne (`npm run simulate -- 42 hard` : graine 42, escouade Difficile) |
| `npm run dev` | Lance le bac à sable dans le navigateur |

---

## 8. Choix provisoires à valider

Ces choix ont été nécessaires pour faire tourner le moteur. Ils sont isolés dans le code pour pouvoir être changés facilement.

| Choix | Valeur actuelle | Où le changer |
|---|---|---|
| Formule des compétences (question ouverte n°5) | base + Σ (ratio × statistique) | `rules/damage.ts` |
| Précision de la simulation | 20 ticks par seconde | `combat/constants.ts` |
| Vitesse de déplacement | 2 hexagones par seconde | `data/balance.ts` |
| Mort subite | +20 % de dégâts et −5 % de soins par seconde après 60 s | `data/balance.ts` |
| Énergie reçue en subissant un coup | Valeur fixe par coup, quel que soit le montant | `data/energy-profiles.ts` |
| Profils d'énergie | Tank 0 / 8 / 2 · Bruiser 8 / 0 / 4 · DPS 10 / 0 / 1 · Support 8 / 0 / 4 (par attaque / par coup subi / par seconde) | `data/energy-profiles.ts` |
| Lancement d'une compétence | Seulement quand la cible est à portée | `combat/unit-turn.ts` |
| Incantation | Ni attaque ni déplacement ; effet appliqué à la fin du temps d'incantation | `combat/skills/cast.ts` |
| Première attaque | Après un intervalle complet (1 / vitesse d'attaque) | `combat/unit-turn.ts` |
| Égalités de distance | L'unité garde sa cible actuelle si elle fait partie des plus proches, sinon l'ennemi au plus petit identifiant est choisi | `combat/behaviors/targeting.ts` |
| Limite de sécurité | 10 minutes de combat simulé | `combat/constants.ts` |
| Comptage des traits | Deux exemplaires de la même unité ne comptent qu'une fois | `rules/traits.ts` |
| Ralentissement maximal | La vitesse d'attaque ne descend pas sous 25 % | `data/balance.ts` |
| Réduction de dégâts maximale | 75 % | `data/balance.ts` |
| Brûlure | Un nouveau coup relance la durée sans décaler le prochain tic de dégâts | `combat/status/burn.ts` |
| Éclairs de Foudre | Attribués à la première unité Foudre debout ; plus d'éclairs si toutes sont K.O. | `combat/traits/lightning.ts` |
| Animation des zones d'effet | 0,7 s, chaque anneau s'allume avec un léger retard | `render/replay.ts`, `render/skill-area.ts` |

---

## 9. Prochaines étapes techniques

- **Événements d'énergie** : pour afficher les barres d'énergie dans le rendu.
- **Les 36 objets définitifs**, une fois conçus.
- **Mode run, suite** : carte (2 ou 3 chasses au choix), récompenses complètes (objet fusionné, retire-objet, capture), vraie « version boss », sauvegarde de la run.
