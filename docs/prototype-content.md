# Contenu du prototype (bac à sable)

> Validé le 2026-11-20. Les règles générales sont dans [game-design.md](game-design.md).
> ⚠️ Tous les chiffres (statistiques, effets, paliers) sont des **valeurs de départ provisoires**, à ajuster pendant les tests. Ils se trouvent dans `src/data/`.

## Périmètre

- **34 unités** : 11 chasseurs, 23 monstres (dont 4 Dragons anciens au coût 5 et 3 Dragons noirs au coût 6), coûts 1 à 6.
- **6 traits d'élément** : Feu et Glace (5 unités chacun), Foudre, Sans élément, Eau et Dragon (6 chacun).
- **9 traits secondaires** : Guilde, Berserker, Bastion, Catalyseur, Wyverne volante, Dragon ancien, Dragon noir, et les traits de famille Léviathan et Wyverne brute.
- **8 matériaux**, **8 objets avec effet propre**, et une fusion générique pour les 28 autres combinaisons.
- **Mode bac à sable** : composition libre des deux camps, escouades ennemies prédéfinies, replay du combat et statistiques par unité mises à jour en direct pendant le replay (le résultat n'est annoncé qu'à la fin).

Plus tard : autres unités (armes restantes, monstres, Dragons anciens), nouveaux traits. Les traits de certaines unités pourront changer.

---

## Unités

Les noms des chasseurs sont provisoires. Les valeurs « a/b/c » des compétences sont celles des rangs ★1/★2/★3.

| Unité | Type | Rôle | Élément | Traits secondaires | Coût | Portée | Compétence |
|---|---|---|---|---|---|---|---|
| Barroth | Monstre | Tank | — | Bastion, Wyverne brute | 1 | 1 | **Carapace de boue** : bouclier de 150/225/340 + 15 % des PV max pendant 4 s |
| Khezu | Monstre | Tank | Foudre | Wyverne volante, Bastion | 1 | 1 | **Décharge** : 30/45/70 + 75 % puiss. élém. aux ennemis adjacents |
| Garrick (Lance) | Chasseur | Tank | Glace | Bastion | 2 | 1 | **Garde** : bouclier de 200/300/450 + 20 % des PV max pendant 4 s |
| Helga (Marteau) | Chasseur | Bruiser | — | Guilde | 1 | 1 | **Big Bang** : 80/120/180 + 160 % attaque brute (physique) |
| Anjanath | Monstre | Bruiser | Feu | Berserker, Wyverne brute | 2 | 1 | **Souffle ardent** : 70/105/160 + 180 % puiss. élém. sur la cible et ses voisins |
| Tobi-Kadachi | Monstre | Bruiser | Foudre | Berserker | 2 | 1 | **Charge électrique** : bondit sur l'ennemi le plus faible, 60/90/135 + 180 % puiss. élém. |
| Akira (Grande épée) | Chasseur | DPS | — | Guilde, Berserker | 3 | 1 | **Coup chargé** : incantation de 1,5 s, puis 150/225/340 + 300 % attaque brute |
| Lysa (Doubles lames) | Chasseur | DPS | Foudre | Guilde | 1 | 1 | **Mode démon** : +60 % de vitesse d'attaque pendant 4 s |
| Sylvain (Arc) | Chasseur | DPS | Glace | Catalyseur | 1 | 4 | **Pluie de flèches** : 50/75/115 + 160 % puiss. élém. sur l'ennemi le plus éloigné et ses voisins |
| Rathalos | Monstre | DPS | Feu | Wyverne volante, Catalyseur | 3 | 3 | **Boule de feu** : 120/180/270 + 250 % puiss. élém. sur la cible et ses voisins |
| Odette (Corne de chasse) | Chasseur | Support | Feu | Guilde | 2 | 2 | **Mélodie de soin** : soigne de 80/120/180 + 200 % puiss. élém. les alliés à 2 cases ou moins |
| Legiana | Monstre | Support | Glace | Wyverne volante, Catalyseur | 3 | 3 | **Vent glacial** : 35/55/80 + 80 % puiss. élém. sur la cible et ses voisins, −30 % de vitesse d'attaque pendant 3 s |
| Zinogre | Monstre | Bruiser | Foudre | Berserker | 4 | 1 | **Supercharge** : bondit sur la cible, 100/150/225 + 220 % puiss. élém. sur elle et ses voisins |
| Deviljho | Monstre | Bruiser | Dragon | Berserker, Wyverne brute | 4 | 1 | **Souffle draconique** : 110/165/250 + 200 % puiss. élém. sur la cible et ses voisins |
| Mizutsune | Monstre | Support | Eau | Catalyseur, Léviathan | 4 | 3 | **Danse des bulles** : soigne de 120/180/270 + 220 % puiss. élém. les alliés à 2 cases ou moins |
| Brann (Lancecanon) | Chasseur | Tank | Dragon | Guilde, Bastion | 4 | 1 | **Canon de wyverne** : 50/75/115 + 75 % puiss. élém. aux ennemis adjacents, puis bouclier de 150/225/340 + 15 % des PV max pendant 4 s |
| Ondine (Morpho-hache) | Chasseur | Bruiser | Eau | Guilde | 4 | 1 | **Décharge élémentaire** : incantation de 1 s, puis 150/225/340 + 250 % puiss. élém. sur la cible |
| Teostra | Monstre | Bruiser | Feu | Dragon ancien | 5 | 1 | **Supernova** : incantation de 1,5 s, puis 250/375/565 + 350 % puiss. élém. aux ennemis à 2 cases ou moins |
| Namielle | Monstre | Support | Eau | Dragon ancien, Catalyseur | 5 | 3 | **Marée luminescente** : 75/115/170 + 125 % puiss. élém. sur la cible et les ennemis à 2 cases d'elle, et soigne les alliés à 2 cases de 100/150/225 + 150 % puiss. élém. |
| Safi'jiiva | Monstre | DPS | Dragon | Dragon ancien | 5 | 3 | **Rayon draconique** : 220/330/495 + 300 % puiss. élém. sur l'ennemi le plus éloigné et ses voisins |
| Fatalis | Monstre | Bruiser | Dragon | Dragon noir | 6 | 1 | **Souffle du Fatalis** : incantation de 1,5 s, puis 300/450/675 + 400 % puiss. élém. sur la cible et les ennemis à 2 cases d'elle |
| Alatreon | Monstre | DPS | Glace | Dragon noir | 6 | 3 | **Jugement d'Escaton** : incantation de 2 s, puis 220/330/495 + 280 % puiss. élém. à tous les ennemis, et −30 % de vitesse d'attaque pendant 3 s |
| Dire Miralis | Monstre | Tank | Feu | Dragon noir | 6 | 1 | **Éruption** : 200/300/450 + 250 % puiss. élém. aux ennemis à 2 cases ou moins, puis bouclier de 400/600/900 + 20 % des PV max pendant 5 s |
| Royal Ludroth | Monstre | Support | Eau | Catalyseur, Léviathan | 1 | 2 | **Crinière spongieuse** : soigne de 50/75/115 + 150 % puiss. élém. les alliés à 2 cases ou moins |
| Kulu-Ya-Ku | Monstre | Bruiser | — | Berserker | 1 | 1 | **Coup de rocher** : 70/105/160 + 150 % attaque brute (physique) sur la cible |
| Mira (Épée et bouclier) | Chasseur | Bruiser | Dragon | Guilde, Bastion | 1 | 1 | **Frappe tournoyante** : 50/75/115 + 150 % puiss. élém. sur la cible et ses voisins |
| Jyuratodus | Monstre | Tank | Eau | Bastion | 2 | 1 | **Bain de boue** : 30/45/70 + 70 % puiss. élém. aux ennemis adjacents, −25 % de vitesse d'attaque pendant 2 s |
| Barioth | Monstre | Bruiser | Glace | Wyverne volante | 2 | 1 | **Charge glaciale** : bondit sur l'ennemi le plus faible, 60/90/135 + 170 % puiss. élém., −20 % de vitesse d'attaque pendant 2 s |
| Kaede (Épée longue) | Chasseur | DPS | Eau | Guilde, Berserker | 2 | 1 | **Coup spirituel** : 70/105/160 + 200 % puiss. élém. sur la cible |
| Nargacuga | Monstre | DPS | — | Wyverne volante | 3 | 1 | **Queue tranchante** : bondit sur l'ennemi le plus faible, 110/165/250 + 220 % attaque brute (physique) |
| Lagiacrus | Monstre | Tank | Foudre | Bastion, Léviathan | 3 | 1 | **Décharge abyssale** : 45/70/100 + 80 % puiss. élém. aux ennemis à 2 cases ou moins |
| Dorian (Fusarbalète lourd) | Chasseur | DPS | Dragon | Guilde, Catalyseur | 3 | 4 | **Tir draconique** : incantation de 1 s, puis 130/195/295 + 250 % puiss. élém. sur l'ennemi le plus éloigné et ses voisins |
| Tigrex | Monstre | Bruiser | — | Wyverne volante, Berserker | 4 | 1 | **Rugissement** : 110/165/250 + 230 % attaque brute (physique) aux ennemis adjacents |
| Kirin | Monstre | DPS | Foudre | Dragon ancien | 5 | 3 | **Foudre divine** : 200/300/450 + 280 % puiss. élém. sur l'ennemi le plus faible et ses voisins |

### Rangs ★

Règle validée (voir [game-design.md](game-design.md), section 3.4) : PV et attaque brute ×1,8 à chaque rang, une valeur de base de compétence par rang, durées et pourcentages inchangés.

Équilibrage du 2026-11-21 : les dégâts des compétences des tanks et des supports ont été divisés par deux (base et ratio), sauf Dire Miralis ; leurs boucliers, soins et ralentissements n'ont pas changé.

⚠️ Les valeurs de base ★2 et ★3 du tableau sont **provisoires**. Elles suivent une règle simple, à remplacer unité par unité pendant l'équilibrage : ★2 ≈ ★1 × 1,5 et ★3 ≈ ★1 × 2,25, arrondis à 5.

---

## Traits

Paliers : 2 et 3 unités, sauf la Guilde (2 et 4), Dragon ancien (1, 2 et 3) et Dragon noir (1 seul palier : 1 Dragon noir maximum par plateau). ⚠️ Comme dans TFT, deux exemplaires de la même unité ne comptent qu'une fois.

### Éléments (mécanique propre à chaque élément)

| Trait | Palier 2 | Palier 3 |
|---|---|---|
| Feu | Les coups des unités Feu brûlent : 20 dégâts élémentaires/s pendant 3 s | 40 dégâts/s |
| Foudre | Toutes les 4 s, un éclair frappe un ennemi au hasard (80 dégâts élémentaires) | Toutes les 3 s, 150 dégâts |
| Glace | Les coups des unités Glace réduisent la vitesse d'attaque de la cible de 20 % pendant 2 s | −35 % |
| Sans élément | +15 % d'attaque brute pour les unités sans élément | +30 % |
| Eau (Source de vie) | Les unités Eau soignent l'allié le plus blessé de 15 % des dégâts qu'elles infligent | 30 % |
| Dragon (Rage draconique) | Les unités Dragon infligent +20 % de dégâts quand leurs PV sont sous 50 % | +40 % |

### Traits secondaires

| Trait | Réservé à | Palier 1 | Palier 2 |
|---|---|---|---|
| Guilde | Chasseurs | (2) +6 % PV, attaque brute et puiss. élém. par objet porté | (4) +12 % par objet |
| Berserker | — | (2) Compétences critiques possibles, +15 % de chance de critique, multiplicateur +0,2 | (3) +30 %, multiplicateur +0,4 |
| Bastion | — | (2) −15 % de dégâts subis | (3) −30 % |
| Catalyseur | — | (2) +20 puissance élémentaire | (3) +45 |
| Wyverne volante | Monstres | (2) +15 % de vitesse d'attaque | (3) +30 % |
| Dragon ancien (Calamité) | Monstres | (1) Les Dragons anciens commencent le combat avec 40 % de leur énergie | (2) 70 % · (3) 100 % |
| Dragon noir (Terreur) | Monstres | (1) Tant qu'un Dragon noir est en vie, tous les ennemis infligent −15 % de dégâts | — (1 seul Dragon noir par plateau) |
| Léviathan (Glissade) | Monstres | (2) Les Léviathans esquivent 15 % des attaques de base | (3) 30 % |
| Wyverne brute (Masse) | Monstres | (2) +15 % de PV max pour les Wyvernes brutes | (3) +30 % |

⚠️ Esquive : une attaque esquivée n'inflige ni dégâts ni effet d'élément, mais l'attaquant gagne quand même son énergie.

⚠️ Source de vie : « l'allié le plus blessé » est celui qui a le plus petit pourcentage de PV (l'unité elle-même comprise) ; seuls les attaques et les compétences des unités Eau comptent.

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
| Exemplaires par unité | Coût 1 : 18 · coût 2 : 15 · coût 3 : 12 · coût 4 : 10 · coût 5 : 8 · coût 6 : 3 (validé) |
| Réserve | 10 places (validé) |

### Probabilités de la boutique (en %)

| Niveau | Coût 1 | Coût 2 | Coût 3 | Coût 4 | Coût 5 | Coût 6 |
|---|---|---|---|---|---|---|
| 1-2 | 100 | 0 | 0 | 0 | 0 | 0 |
| 3 | 75 | 25 | 0 | 0 | 0 | 0 |
| 4 | 55 | 30 | 15 | 0 | 0 | 0 |
| 5 | 45 | 33 | 20 | 2 | 0 | 0 |
| 6 | 30 | 40 | 25 | 5 | 0 | 0 |
| 7 | 19 | 30 | 35 | 15 | 1 | 0 |
| 8 | 18 | 25 | 32 | 22 | 3 | 0 |
| 9 | 10 | 20 | 25 | 33 | 9 | 3 (validé) |

### Ennemis

| Élément | Valeur |
|---|---|
| Budget de la chasse n | 2 + 1,25 × (n − 1), arrondi à l'inférieur (2 à la chasse 1, 12 à la chasse 9, 38 à la chasse 30) |
| Valeur d'un monstre | Coût × exemplaires : ★1 = coût, ★2 = 3 × coût, ★3 = 9 × coût |
| Nombre de monstres | 2 + 1 toutes les 4 chasses, 8 au maximum |
| Monstres possibles | Stage 1 : coût 1 et 2, rang ★2 au maximum · stages 2 et 3 : coût 1 à 4, rang ★3 au maximum (jamais de Dragon ancien hors boss) |
| Utilisation du budget | D'abord recruter des monstres au hasard jusqu'au nombre maximum, puis monter leur rang avec ce qui reste |
| Placement | Tanks et bruisers devant (rangées 3 puis 2), DPS et supports derrière (rangées 0 puis 1) |
| Boss (chasses 10 et 20) | Un monstre de coût 3 au ★3, plus une escorte générée avec le budget de la chasse (une place de moins) |
| Boss (chasse 30) | Un Dragon ancien au ★2, plus une escorte générée de la même façon ; 15 % de chances que ce soit plutôt un Dragon noir au ★1 |

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
