# Monster Hunter Autobattler — Game design

> Document de référence des décisions de game design.
> Étape en cours : **Étape 3 — Moteur de combat** (règles principales validées ; contenu du prototype à définir). Architecture : voir [architecture.md](architecture.md).
> Dernière mise à jour : 2026-11-20.

Les points marqués **[à définir]** ne sont pas encore tranchés ; ils sont repris dans la section [Questions ouvertes](#14-questions-ouvertes).
Les valeurs numériques sont des valeurs de départ, ajustables pendant l'équilibrage.

---

## 1. Vision

- **Genre** : autobattler PvE solo au format roguelike, inspiré de Teamfight Tactics et de Guildrun.
- **Univers** : Monster Hunter. Projet personnel non publié : les noms, monstres et personnages officiels de la série sont utilisés.
- **Promesse** : composer une équipe de chasseurs et de monstres liés par des synergies, et la renforcer au fil d'une expédition qui se termine face à un Dragon ancien.
- **Autobattler pur** : le joueur n'intervient jamais pendant les combats. Toute la stratégie se joue pendant la préparation.

---

## 2. Structure d'une run

| Élément | Décision |
|---|---|
| Progression | Roguelike pur : chaque run repart de zéro, aucune progression entre les runs |
| Longueur | 30 chasses réparties en 3 stages |
| Un stage | 9 chasses classiques, puis 1 boss |
| Boss des stages 1 et 2 | Tiré au hasard parmi plusieurs grands monstres |
| Boss du stage 3 | Tiré au hasard parmi plusieurs Dragons anciens |
| Carte | À chaque étape, le joueur choisit entre 2 ou 3 chasses |
| Durée visée | 45 à 60 minutes |
| Défaite de la run | 3 combats perdus (chasses classiques et boss confondus) |

### Déroulement d'un tour

1. **Préparation** : réception des revenus, boutique (acheter, vendre, relancer, améliorer), placement des unités sur la grille, pose des matériaux et des objets.
2. **Combat** : simulation automatique.
3. **Résultat** :

| Issue | Conséquence |
|---|---|
| Victoire | Bonus de victoire + choix d'une récompense parmi 3 |
| Égalité | Compte comme une victoire |
| Défaite contre une chasse classique | Ni bonus ni récompense ; on passe à la chasse suivante |
| Défaite contre un boss | On réaffronte le boss ; la défaite compte parmi les 3 de la run |

Les zennys de base et les intérêts sont gagnés à chaque tour, **même en cas de défaite**.

---

## 3. Unités

### 3.1 Chasseurs et monstres

Le joueur recrute deux types d'unités, qui se mélangent sur la grille.

| | Chasseurs | Monstres |
|---|---|---|
| Identité | Personnages nommés avec une arme fixe | Monstres de la série |
| Statistiques de base | Plus faibles | Plus élevées |
| Emplacements d'objets | 3 | 1 |
| Élément | Celui de l'arme (ou aucun) | Élément naturel (ou aucun) |
| Portée | Dépend de l'arme | Dépend du rôle |
| Point fort | Progressent grâce aux objets | Puissants dès le recrutement |

Toutes les unités recrutables occupent **1 hexagone**.

### 3.2 Rôles

Chaque unité a un rôle fixe.

| Rôle | Fonction |
|---|---|
| Tank | Beaucoup de PV et de défense, se place devant |
| Bruiser | Combattant au corps à corps, équilibré entre dégâts et survie |
| DPS | Gros dégâts, fragile ; au corps à corps ou à distance selon l'unité |
| Support | Renforce, soigne ou gêne les ennemis |

Répartition indicative des armes de chasseur :

| Rôle | Armes |
|---|---|
| Tank | Lance, Lancecanon |
| Bruiser | Marteau, Épée et bouclier, Morpho-hache |
| DPS | Grande épée, Doubles lames, Épée longue, Arc, Fusarbalètes |
| Support | Corne de chasse |

### 3.3 Statistiques

| Statistique | Effet | Matériau associé |
|---|---|---|
| PV | Points de vie | Carapace |
| Attaque brute | Dégâts des attaques de base | Os |
| Puissance élémentaire | Amplifie les compétences (comme la puissance magique de TFT) | Gemme |
| Chance de critique | Probabilité qu'une attaque de base soit critique | Membrane |
| Armure | Réduit les dégâts physiques | Corne |
| Résistance élémentaire | Réduit les dégâts élémentaires | Croc |
| Vitesse d'attaque | Nombre d'attaques par seconde | Plume |
| Énergie maximale | Énergie nécessaire pour lancer la compétence | — |
| Gain passif d'énergie | Énergie gagnée chaque seconde (dépend du rôle) | Extrait (+1 par seconde) |
| Portée | Distance d'attaque, en hexagones | — |

Chaque unité possède aussi un **type d'élément** : Feu, Eau, Foudre, Glace, Dragon ou aucun.
La vitesse de déplacement est identique pour toutes les unités.

### 3.4 Coût, exemplaires et rangs

- Chaque unité coûte de **1 à 5 zennys**.
- Le nombre d'exemplaires de chaque unité est **limité selon son coût** **[valeurs à définir]**.
- 3 exemplaires identiques du même rang donnent un exemplaire du rang supérieur :

| Rang | Obtention |
|---|---|
| ★1 Rang Bas | Achat en boutique, capture |
| ★2 Rang Haut | 3 exemplaires ★1 |
| ★3 Rang Maître | 3 exemplaires ★2 |

### 3.5 Énergie et compétences

- Chaque unité possède **1 compétence**, lancée automatiquement quand son énergie atteint le maximum.
- L'énergie maximale est **propre à chaque unité**.
- Toutes les unités commencent le combat avec **0 énergie**.
- L'énergie est **bloquée pendant qu'une compétence s'exécute**.
- La façon de générer de l'énergie dépend du rôle :

| Rôle | En attaquant | En subissant des coups | Gain passif |
|---|---|---|---|
| Tank | — | Élevé | Faible |
| Bruiser | Oui | — | Oui |
| DPS | Élevé | — | Faible |
| Support | Oui | — | Oui |

Le gain passif réduit des DPS évite que les unités à attaque rapide lancent leur compétence en boucle.

L'Extrait ajoute **+1 énergie par seconde** au gain passif de l'unité qui le porte.

---

## 4. Traits et synergies

- Chaque unité possède **1 trait principal** et **1 trait secondaire** ; certaines unités ont **2 traits secondaires** (2 ou 3 traits au total).
- **Trait principal = élément** : Feu, Eau, Foudre, Glace, Dragon ou Sans élément. C'est ce trait qui relie chasseurs et monstres (exemple : un chasseur à l'arme Foudre + Tobi-Kadachi activent ensemble la synergie Foudre).
- **Traits secondaires** : liés à un effet de jeu. Certains sont réservés à un type d'unité :
  - **Guilde** : chasseurs uniquement.
  - **Dragon ancien** : monstres uniquement.
- Exemples de traits secondaires (illustratifs) :
  - **Berserker** : les compétences des unités Berserker peuvent faire des coups critiques ; les Berserker gagnent des chances de critique et des dégâts critiques.
  - Un trait qui donne de la réduction de dégâts.
  - Un trait qui augmente les dégâts élémentaires.
- **Chaque élément a sa propre mécanique** (et pas un simple bonus de statistiques) :
  - **Feu** : les coups des unités Feu brûlent la cible (dégâts sur la durée) ;
  - **Foudre** : à intervalles réguliers, un éclair frappe un ennemi au hasard ;
  - **Glace** : les coups des unités Glace ralentissent la vitesse d'attaque de la cible ;
  - **Sans élément** : bonus d'attaque brute.
- Les traits secondaires renforcent les unités du trait.
- Paliers et valeurs du prototype : voir [prototype-content.md](prototype-content.md). Ils évolueront avec l'arrivée de nouvelles unités.

---

## 5. Combat

| Élément | Décision |
|---|---|
| Grille | Hexagonale, 7 colonnes × 4 rangées par camp (comme TFT) |
| Écoulement du temps | Temps réel simulé par ticks |
| Contrôle du joueur | Aucun pendant le combat |
| Ciblage | L'ennemi le plus proche par défaut ; certaines compétences visent l'ennemi le plus faible ou la ligne arrière |
| Durée normale | 60 secondes |
| Mort subite | Après 60 s, les dégâts infligés augmentent progressivement et les soins diminuent progressivement |
| Limite absolue de durée | Aucune |
| Victoire | Le dernier camp debout ; une égalité compte comme une victoire du joueur |

Note technique : le moteur contiendra une limite de sécurité très élevée pour éviter une boucle infinie en cas de bug. Ce n'est pas une règle de jeu et elle ne doit jamais être atteinte en partie normale.

---

## 6. Dégâts

### 6.1 Types de dégâts

- **Attaques de base** : dégâts physiques, basés sur l'attaque brute, réduits par l'armure.
- **Compétences** : leur type de dégâts dépend de l'élément de l'unité.
  - **Unités sans élément** : ratios purement basés sur l'attaque brute ; dégâts physiques, réduits par l'armure.
  - **Unités élémentaires** : majoritairement des dégâts élémentaires, amplifiés par la puissance élémentaire et réduits par la résistance élémentaire.
  - Conséquence : la Gemme ne sert à rien sur une unité sans élément, et l'Os renforce surtout les attaques de base d'une unité élémentaire. Le bon choix de matériaux dépend donc de l'unité qui les porte.
- **Aucune faiblesse ni résistance par élément** : l'élément sert aux synergies, pas à un système de faiblesses.

### 6.2 Réduction des dégâts

Calcul par ratio, identique pour l'armure et la résistance élémentaire :

```
dégâts subis = dégâts × 100 / (100 + valeur de défense)
```

Exemples : 50 de défense → 67 % des dégâts subis ; 100 de défense → 50 % ; 200 de défense → 33 %.
Les dégâts ne tombent jamais à zéro, et chaque point de défense garde de la valeur.

### 6.3 Coups critiques

- Chance de critique apportée par les statistiques et la Membrane.
- Multiplicateur fixe : **×1,5**.
- Par défaut, **seules les attaques de base** peuvent être critiques.
- Certains traits (par exemple Berserker) permettent aux compétences d'être critiques et augmentent le multiplicateur.

---

## 7. Matériaux et objets

Vocabulaire : un **matériau** est l'élément de base ; **2 matériaux fusionnés sur une unité forment un objet**.

### 7.1 Matériaux

| Matériau | Effet |
|---|---|
| Os | Attaque brute |
| Gemme | Puissance élémentaire |
| Carapace | PV |
| Membrane | Chance de critique |
| Corne | Armure |
| Croc | Résistance élémentaire |
| Plume | Vitesse d'attaque |
| Extrait | +1 énergie par seconde (gain passif) |

8 matériaux permettent 36 objets différents. Chaque objet donne les statistiques de ses deux matériaux plus son propre effet.
Le prototype contient 8 objets avec un effet propre ; les autres combinaisons donnent un objet générique. Les 36 objets définitifs seront conçus par Théo.

### 7.2 Règles

- **Fusion sur l'unité** (comme TFT) : poser un matériau sur une unité qui en porte déjà un les fusionne en un objet, qui occupe 1 emplacement.
- **Emplacements** : 3 pour un chasseur, 1 pour un monstre. Un emplacement contient un matériau ou un objet.
- **Déplacer** :
  - un matériau : gratuit, à tout moment entre les combats ;
  - un objet : nécessite un **retire-objet**.
- **Vendre une unité** rend tous ses matériaux et objets.
- **Obtenir des retire-objets** : 1 garanti après chaque boss, et possibilité d'en obtenir dans les récompenses.

---

## 8. Économie et boutique

### 8.1 Revenus (zennys)

À chaque tour :
- **Zennys de base** : toujours gagnés, même en cas de défaite.
- **Bonus de victoire** : seulement en cas de victoire.
- **Intérêts** : +1 zenny par tranche de 10 zennys épargnés, avec un maximum de +5 (comme TFT). Toujours gagnés, même en cas de défaite.

### 8.2 Boutique

| Élément | Décision |
|---|---|
| Unités proposées | 5 par relance |
| Actions | Acheter, vendre, relancer (payant), améliorer la boutique (coût croissant) |
| Niveau de boutique | De 1 à 9 ; le niveau donne le nombre d'unités sur la grille |
| Apparition des unités chères | Par probabilités selon le niveau (comme TFT) |
| Réserve | 10 places pour les unités achetées mais non placées |

### 8.3 Valeurs à définir pendant l'équilibrage

Zennys de base, bonus de victoire, coût d'une relance, coûts d'amélioration de la boutique, prix de revente, table de probabilités par niveau, nombre d'exemplaires par coût.

---

## 9. Ennemis

- **Chasses classiques** : escouades de monstres **générées selon un budget**, qui augmente au fil de la run.
- **Chasses de boss** : la **version boss** d'un grand monstre, plus puissante que sa version unité **[contenu exact à définir]**.
- Boss sur plusieurs hexagones et parties cassables : reportés à plus tard.

---

## 10. Recrutement et capture

- **Boutique** : principale source d'unités.
- **Capture** (version simple) : après une chasse gagnée, l'une des récompenses proposées peut être la capture d'un monstre affronté, qui rejoint la réserve en ★1.
- **Boss des stages 1 et 2** : capturables ; on obtient leur version unité en ★1.
- **Dragons anciens** : jamais capturables ; on ne peut les obtenir qu'en boutique.

---

## 11. Récompenses

- **Après une victoire** : choix d'une récompense parmi 3 : unité, objet (déjà fusionné), matériaux, zennys, retire-objet ou capture.
- **Après un boss** : récompenses de meilleure qualité que celles des chasses classiques, plus 1 retire-objet garanti.
- **Après une défaite** : aucune récompense (les zennys de base et les intérêts restent gagnés).

---

## 12. Hors périmètre

### Reporté à plus tard (étape 5 ou après)
- Statuts (Poison, Paralysie, Sommeil, Explosion…), y compris comme traits principaux.
- Parties cassables et boss sur plusieurs hexagones.
- Compagnons (Palicos), endurance, tranchant, consommables.
- Compétences à ratios mixtes (attaque brute + puissance élémentaire), ou qui utilisent la statistique la plus élevée de l'unité.

### Exclu par choix de design
- Intervention du joueur pendant les combats.
- Progression entre les runs.
- Faiblesses et résistances par élément.

---

## 13. Contraintes du projet

### Technologies
- TypeScript pour toute la logique du jeu, Vite pour l'environnement de développement.
- HTML et CSS pour les interfaces, Canvas 2D si nécessaire pour afficher les combats.
- Données de gameplay en JSON ou en objets TypeScript.
- Pas de React, de framework complexe ni de backend tant qu'ils n'apportent pas d'avantage concret.

### Principes d'architecture
- La logique de jeu est indépendante de l'affichage : le moteur de combat fonctionne sans rendu, pour les tests et l'équilibrage.
- Chaque action de combat produit un **événement de gameplay**, que le rendu utilisera plus tard pour afficher une animation.
- Le hasard utilise une graine (seed) : un même combat peut être rejoué à l'identique.
- Le rendu temporaire doit pouvoir être remplacé par un moteur graphique plus avancé sans reconstruire les systèmes de combat.

### Feuille de route
1. **Game design** : règles, combats, unités, progression. ← règles validées, contenu du prototype à définir
2. **Architecture** : structure technique et responsabilités des modules. ← fait (architecture.md)
3. **Moteur de combat** : règles validées, tests automatisés, journal des événements. ← en cours
4. **Prototype jouable** : préparer une équipe et observer un combat avec des formes temporaires.
5. **Extension du gameplay** : armes, compétences, monstres, mécaniques avancées.
6. **Intégration graphique** : modèles, animations, effets visuels.

---

## 14. Questions ouvertes

### Règles
1. Les ennemis sont-ils uniquement des monstres ?
2. Les monstres qui ne sont pas des Dragons anciens sont-ils tous disponibles en boutique **et** par capture, ou certains uniquement par capture ?
3. Les Dragons anciens en boutique : quel coût (5 ?)
4. La capture du boss fait-elle toujours partie des choix de récompense après un boss ?
5. Formule des ratios de compétence : valeur de base + ratio × statistique, ou pourcentage d'amplification comme la puissance magique de TFT ?
6. Contenu de la version boss d'un monstre (PV, plusieurs compétences, état enragé ?).
7. Informations visibles sur chaque chasse proposée par la carte (ennemis, type de récompense ?).

### Confort de jeu
8. Bouton d'accélération ×2 des combats ?
9. Sauvegarde en cours de run ?

### Contenu
10. Effets des 36 objets (conçus par Théo).
11. Unités de coût 4 et 5, Dragons anciens, éléments Eau et Dragon.

---

## 15. Historique

- **2026-11-20** : création du document. Décisions de l'étape 1 : structure de run, unités, rôles, statistiques, énergie, traits, combat, dégâts, objets, économie, ennemis, recrutement et récompenses.
- **2026-11-20** : une défaite contre un boss compte parmi les 3 de la run ; effet de l'Extrait (+1 énergie/s) ; type de dégâts des compétences selon l'élément de l'unité ; vocabulaire matériau / objet.
- **2026-11-20** : contenu du prototype validé ([prototype-content.md](prototype-content.md)) ; mécanique propre à chaque élément ; nouveaux effets de compétence (bouclier, soin, bonus, ralentissement).
