# Contenu du prototype (bac à sable)

> Validé le 2026-11-20. Les règles générales sont dans [game-design.md](game-design.md).
> ⚠️ Tous les chiffres (statistiques, effets, paliers) sont des **valeurs de départ provisoires**, à ajuster pendant les tests. Ils se trouvent dans `src/data/`.

## Périmètre

- **12 unités** : 6 chasseurs, 6 monstres, coûts 1 à 3.
- **4 traits d'élément** : Feu, Foudre, Glace, Sans élément (3 unités chacun).
- **5 traits secondaires** : Guilde, Berserker, Bastion, Catalyseur, Wyverne volante.
- **8 matériaux**, **8 objets avec effet propre**, et une fusion générique pour les 28 autres combinaisons.
- **Mode bac à sable** : composition libre des deux camps, escouades ennemies prédéfinies, replay du combat et statistiques par unité mises à jour en direct pendant le replay (le résultat n'est annoncé qu'à la fin).

Plus tard : unités de coût 4 et 5, Dragons anciens, éléments Eau et Dragon, nouveaux traits. Les traits de certaines unités pourront changer.

---

## Unités

Les noms des chasseurs sont provisoires. Les valeurs « a/b/c » des compétences sont celles des rangs ★1/★2/★3.

| Unité | Type | Rôle | Élément | Traits secondaires | Coût | Portée | Compétence |
|---|---|---|---|---|---|---|---|
| Barroth | Monstre | Tank | — | Bastion | 1 | 1 | **Carapace de boue** : bouclier de 150/225/340 + 15 % des PV max pendant 4 s |
| Khezu | Monstre | Tank | Foudre | Wyverne volante, Bastion | 1 | 1 | **Décharge** : 60/90/135 + 150 % puiss. élém. aux ennemis adjacents |
| Garrick (Lance) | Chasseur | Tank | Glace | Bastion | 2 | 1 | **Garde** : bouclier de 200/300/450 + 20 % des PV max pendant 4 s |
| Helga (Marteau) | Chasseur | Bruiser | — | Guilde | 1 | 1 | **Big Bang** : 80/120/180 + 160 % attaque brute (physique) |
| Anjanath | Monstre | Bruiser | Feu | Berserker | 2 | 1 | **Souffle ardent** : 70/105/160 + 180 % puiss. élém. sur la cible et ses voisins |
| Tobi-Kadachi | Monstre | Bruiser | Foudre | Berserker | 2 | 1 | **Charge électrique** : bondit sur l'ennemi le plus faible, 60/90/135 + 180 % puiss. élém. |
| Akira (Grande épée) | Chasseur | DPS | — | Guilde, Berserker | 3 | 1 | **Coup chargé** : incantation de 1,5 s, puis 150/225/340 + 300 % attaque brute |
| Lysa (Doubles lames) | Chasseur | DPS | Foudre | Guilde | 1 | 1 | **Mode démon** : +60 % de vitesse d'attaque pendant 4 s |
| Sylvain (Arc) | Chasseur | DPS | Glace | Catalyseur | 1 | 4 | **Pluie de flèches** : 50/75/115 + 160 % puiss. élém. sur l'ennemi le plus éloigné et ses voisins |
| Rathalos | Monstre | DPS | Feu | Wyverne volante, Catalyseur | 3 | 3 | **Boule de feu** : 120/180/270 + 250 % puiss. élém. sur la cible et ses voisins |
| Odette (Corne de chasse) | Chasseur | Support | Feu | Guilde | 2 | 2 | **Mélodie de soin** : soigne de 80/120/180 + 200 % puiss. élém. les alliés à 2 cases ou moins |
| Legiana | Monstre | Support | Glace | Wyverne volante, Catalyseur | 3 | 3 | **Vent glacial** : 70/105/160 + 160 % puiss. élém. sur la cible et ses voisins, −30 % de vitesse d'attaque pendant 3 s |

### Rangs ★

Règle validée (voir [game-design.md](game-design.md), section 3.4) : PV et attaque brute ×1,8 à chaque rang, une valeur de base de compétence par rang, durées et pourcentages inchangés.

⚠️ Les valeurs de base ★2 et ★3 du tableau sont **provisoires**. Elles suivent une règle simple, à remplacer unité par unité pendant l'équilibrage : ★2 ≈ ★1 × 1,5 et ★3 ≈ ★1 × 2,25, arrondis à 5.

---

## Traits

Paliers : 2 et 3 unités, sauf la Guilde (2 et 4). ⚠️ Comme dans TFT, deux exemplaires de la même unité ne comptent qu'une fois.

### Éléments (mécanique propre à chaque élément)

| Trait | Palier 2 | Palier 3 |
|---|---|---|
| Feu | Les coups des unités Feu brûlent : 20 dégâts élémentaires/s pendant 3 s | 40 dégâts/s |
| Foudre | Toutes les 4 s, un éclair frappe un ennemi au hasard (80 dégâts élémentaires) | Toutes les 3 s, 150 dégâts |
| Glace | Les coups des unités Glace réduisent la vitesse d'attaque de la cible de 20 % pendant 2 s | −35 % |
| Sans élément | +15 % d'attaque brute pour les unités sans élément | +30 % |

### Traits secondaires

| Trait | Réservé à | Palier 1 | Palier 2 |
|---|---|---|---|
| Guilde | Chasseurs | (2) +6 % PV, attaque brute et puiss. élém. par objet porté | (4) +12 % par objet |
| Berserker | — | (2) Compétences critiques possibles, +15 % de chance de critique, multiplicateur +0,2 | (3) +30 %, multiplicateur +0,4 |
| Bastion | — | (2) −15 % de dégâts subis | (3) −30 % |
| Catalyseur | — | (2) +20 puissance élémentaire | (3) +45 |
| Wyverne volante | Monstres | (2) +15 % de vitesse d'attaque | (3) +30 % |

Pour la Wyverne volante, c'est l'option « vitesse d'attaque » qui a été retenue pour l'instant. L'esquive reste possible plus tard.

---

## Matériaux et objets

Chaque objet donne les statistiques de ses deux matériaux **plus** son propre effet.

| Matériau | Effet |
|---|---|
| Os | +15 attaque brute |
| Gemme | +15 puissance élémentaire |
| Carapace | +150 PV |
| Membrane | +10 % de chance de critique |
| Corne | +20 armure |
| Croc | +20 résistance élémentaire |
| Plume | +10 % de vitesse d'attaque |
| Extrait | +1 énergie par seconde |

| Matériaux | Objet | Effet en plus des matériaux |
|---|---|---|
| Os + Os | Bonus d'attaque | +20 attaque brute |
| Membrane + Membrane | Œil critique | +20 % de chance de critique |
| Os + Membrane | Bonus critique | Multiplicateur critique +0,3 (×1,8) |
| Gemme + Gemme | Attaque élémentaire | +20 puissance élémentaire |
| Gemme + Extrait | Accumulateur | Regagne 20 énergie après chaque compétence |
| Carapace + Carapace | Santé | +300 PV |
| Corne + Croc | Défense totale | +20 armure et +20 résistance élémentaire |
| Plume + Os | Agitateur | +3 % de vitesse d'attaque par seconde de combat (max +45 %) |

**Les 28 autres combinaisons** donnent un objet générique : les statistiques des deux matériaux, +50 %, sans effet spécial. Elles seront remplacées par les 36 objets que tu concevras.

---

## Escouades ennemies prédéfinies

| Escouade | Composition |
|---|---|
| Facile | Barroth, Khezu, Anjanath |
| Moyenne | Barroth, Khezu, Anjanath, Tobi-Kadachi |
| Difficile | Barroth, Khezu, Anjanath, Tobi-Kadachi, Rathalos, Legiana, avec quelques objets |

---

## Mode run

Règles : [game-design.md](game-design.md), sections 2, 3.4, 7.2, 8, 9 et 11. ⚠️ Toutes les valeurs ci-dessous sont des valeurs de départ, à ajuster en jouant. Elles se trouvent dans `src/data/run-balance.ts`.

### Économie

| Élément | Valeur |
|---|---|
| Départ | Boutique niveau 2, 5 zennys (+ le revenu du 1er tour, soit 10 zennys pour la première boutique) |
| Revenu de base | 5 zennys par tour, même en cas de défaite |
| Bonus de victoire | +1 zenny au tour suivant |
| Intérêts | +1 par tranche de 10 zennys épargnés, 5 au maximum (validé) |
| Relance | 2 zennys (gratuite au début de chaque tour) |
| Amélioration de la boutique | 2→3 : 4 · 3→4 : 8 · 4→5 : 12 · 5→6 : 20 · 6→7 : 28 · 7→8 : 36 · 8→9 : 48 |
| Revente | Coût × exemplaires : ★1 = coût, ★2 = 3 × coût, ★3 = 9 × coût |
| Exemplaires par unité | Coût 1 : 18 · coût 2 : 15 · coût 3 : 12 |
| Réserve | 10 places (validé) |

### Probabilités de la boutique (coût 1 / 2 / 3)

| Niveau | 1-2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|
| % | 100 / 0 / 0 | 75 / 25 / 0 | 55 / 35 / 10 | 45 / 40 / 15 | 35 / 40 / 25 | 25 / 40 / 35 | 20 / 35 / 45 | 15 / 35 / 50 |

Les unités de coût 4 et 5 n'existent pas encore : la table sera complétée avec elles.

### Ennemis

| Élément | Valeur |
|---|---|
| Budget de la chasse n | 2 + 1,25 × (n − 1), arrondi à l'inférieur (2 à la chasse 1, 12 à la chasse 9, 38 à la chasse 30) |
| Valeur d'un monstre | Coût × exemplaires : ★1 = coût, ★2 = 3 × coût, ★3 = 9 × coût |
| Nombre de monstres | 2 + 1 toutes les 4 chasses, 8 au maximum |
| Monstres possibles | Stage 1 : coût 1 et 2, rang ★2 au maximum · stages 2 et 3 : coût 1 à 3, rang ★3 au maximum |
| Utilisation du budget | D'abord recruter des monstres au hasard jusqu'au nombre maximum, puis monter leur rang avec ce qui reste |
| Placement | Tanks et bruisers devant (rangées 3 puis 2), DPS et supports derrière (rangées 0 puis 1) |
| Boss (chasses 10, 20, 30) | Un monstre de coût 3 au ★3, plus une escorte générée avec le budget de la chasse (une place de moins) |

### Récompenses (1 parmi 3)

| Choix | Chasse classique | Boss |
|---|---|---|
| Matériau au hasard | 1 | 2 |
| Zennys | 4 | 8 |
| Unité ★1 tirée comme en boutique | 1 exemplaire | 2 exemplaires de la même unité |
| Retire-objet | — | +1 garanti, en plus du choix |

---

## Effets de compétence ajoutés au moteur

- **Bouclier** : absorbe les dégâts avant les PV, pendant une durée limitée.
- **Soin** : rend des PV sans dépasser le maximum ; réduit pendant la mort subite.
- **Bonus temporaire** : vitesse d'attaque augmentée pendant une durée limitée.
- **Ralentissement** : vitesse d'attaque réduite pendant une durée limitée.
- **Zone centrée sur le lanceur** (Khezu) et **bond** vers la cible (Tobi-Kadachi).
- ⚠️ Boucliers et soins peuvent s'appuyer sur les PV max du lanceur.
