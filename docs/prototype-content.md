# Contenu du prototype (bac à sable)

> Validé le 2026-11-20. Les règles générales sont dans [game-design.md](game-design.md).
> ⚠️ Tous les chiffres (statistiques, effets, paliers) sont des **valeurs de départ provisoires**, à ajuster pendant les tests. Ils se trouvent dans `src/data/`.

## Périmètre

- **35 unités** : 12 chasseurs (dont Lea au coût 5), 23 monstres (dont 4 Dragons anciens au coût 5 et 3 Dragons noirs au coût 6), coûts 1 à 6.
- **6 traits d'élément** : Glace (5 unités), Feu, Foudre, Sans élément, Eau et Dragon (6 chacun).
- **9 traits secondaires** : Guilde, Berserker, Bastion, Catalyseur, Wyverne volante, Dragon ancien, Dragon noir, et les traits de famille Léviathan et Wyverne brute.
- **8 matériaux**, **8 objets avec effet propre**, et une fusion générique pour les 28 autres combinaisons.
- **Mode bac à sable** : composition libre des deux camps, escouades ennemies prédéfinies, replay du combat et statistiques par unité mises à jour en direct pendant le replay (le résultat n'est annoncé qu'à la fin).

Plus tard : autres unités (armes restantes, monstres, Dragons anciens), nouveaux traits. Les traits de certaines unités pourront changer.

---

## Unités

Les chasseurs portent des noms officiels de la série, avec une arme qu'ils utilisent dans les jeux (Wilds : Fabius, Olivia · Rise/Sunbreak : Fiorayne, Fugen, Hinoa, Minoto, Rondine, Luchika, Arlow, Galleus · MH4U/World : Aiden · Frontier : Lea, une Legendary Rasta, polie hors des chasses et violente pendant). Les valeurs « a/b/c » des compétences sont celles des rangs ★1/★2/★3.

| Unité | Type | Rôle | Élément | Traits secondaires | Coût | Portée | Compétence |
|---|---|---|---|---|---|---|---|
| Barroth | Monstre | Tank | — | Bastion, Wyverne brute | 1 | 1 | **Carapace de boue** : bouclier de 150/225/340 + 12/15/18 % des PV max pendant 4 s |
| Khezu | Monstre | Tank | Foudre | Wyverne volante, Bastion | 1 | 1 | **Décharge** : 30/45/70 + 75/94/113 % puiss. élém. aux ennemis adjacents |
| Fabius (Lance) | Chasseur | Tank | Glace | Bastion | 2 | 1 | **Garde** : bouclier de 160/240/360 + 14/18/21 % des PV max pendant 4 s |
| Olivia (Marteau) | Chasseur | Bruiser | — | Guilde | 1 | 1 | **Big Bang** : 80/120/180 + 160/200/240 % attaque brute (physique) |
| Anjanath | Monstre | Bruiser | Feu | Berserker, Wyverne brute | 2 | 1 | **Souffle ardent** : 70/105/160 + 180/225/270 % puiss. élém. sur la cible et ses voisins |
| Tobi-Kadachi | Monstre | Bruiser | Foudre | Berserker | 2 | 1 | **Charge électrique** : bondit sur l'ennemi le plus faible, 60/90/135 + 180/225/270 % puiss. élém. |
| Fiorayne (Grande épée) | Chasseur | DPS | — | Guilde, Berserker | 3 | 1 | **Coup chargé** : incantation de 1 s, puis 150/225/340 + 300/375/450 % attaque brute |
| Fugen (Doubles lames) | Chasseur | DPS | Foudre | Guilde | 1 | 1 | **Mode démon** : +60 % de vitesse d'attaque pendant 4 s |
| Hinoa (Arc) | Chasseur | DPS | Glace | Catalyseur | 1 | 4 | **Pluie de flèches** : 50/75/115 + 160/200/240 % puiss. élém. sur l'ennemi le plus éloigné et ses voisins |
| Rathalos | Monstre | DPS | Feu | Wyverne volante, Catalyseur | 3 | 3 | **Boule de feu** : 120/180/270 + 200/250/300 % puiss. élém. sur la cible et ses voisins |
| Minoto (Corne de chasse) | Chasseur | Support | Feu | Guilde | 2 | 2 | **Mélodie de soin** : soigne de 80/120/180 + 200/250/300 % puiss. élém. les alliés à 2 cases ou moins |
| Legiana | Monstre | Support | Glace | Wyverne volante, Catalyseur | 3 | 3 | **Vent glacial** : 35/55/80 + 80/100/120 % puiss. élém. sur la cible et ses voisins, −30 % de vitesse d'attaque pendant 3 s |
| Zinogre | Monstre | Bruiser | Foudre | Berserker | 4 | 1 | **Supercharge** : bondit sur la cible, 100/150/225 + 220/275/330 % puiss. élém. sur elle et ses voisins |
| Deviljho | Monstre | Bruiser | Dragon | Berserker, Wyverne brute | 4 | 1 | **Souffle draconique** : 110/165/250 + 200/250/300 % puiss. élém. sur la cible et ses voisins |
| Mizutsune | Monstre | Support | Eau | Catalyseur, Léviathan | 4 | 3 | **Danse des bulles** : soigne de 120/180/270 + 220/275/330 % puiss. élém. les alliés à 2 cases ou moins |
| Arlow (Lancecanon) | Chasseur | Tank | Dragon | Guilde, Bastion | 4 | 1 | **Canon de wyverne** : 50/75/115 + 75/94/113 % puiss. élém. aux ennemis adjacents, puis bouclier de 150/225/340 + 15/19/23 % des PV max pendant 4 s |
| Galleus (Morpho-hache) | Chasseur | Bruiser | Eau | Guilde | 4 | 1 | **Décharge élémentaire** : 150/225/340 + 340/425/510 % puiss. élém. sur la cible |
| Teostra | Monstre | Bruiser | Feu | Dragon ancien | 5 | 1 | **Supernova** : incantation de 1,5 s, puis 250/375/565 + 290/363/435 % puiss. élém. aux ennemis à 2 cases ou moins |
| Namielle | Monstre | Support | Eau | Dragon ancien, Catalyseur | 5 | 3 | **Marée luminescente** : 75/115/170 + 110/138/165 % puiss. élém. sur la cible et les ennemis à 2 cases d'elle, et soigne les alliés à 2 cases de 100/150/225 + 110/138/165 % puiss. élém. |
| Safi'jiiva | Monstre | DPS | Dragon | Dragon ancien | 5 | 3 | **Rayon draconique** : 220/330/495 + 300/375/450 % puiss. élém. sur sa cible et ses voisins |
| Fatalis | Monstre | Bruiser | Dragon | Dragon noir | 6 | 1 | **Souffle du Fatalis** : incantation de 1,5 s, puis 300/450/675 + 400/500/600 % puiss. élém. sur la cible et les ennemis à 2 cases d'elle |
| Alatreon | Monstre | DPS | Glace | Dragon noir | 6 | 3 | **Jugement d'Escaton** : incantation de 1,5 s, puis 220/330/495 + 340/425/510 % puiss. élém. à tous les ennemis, et −30 % de vitesse d'attaque pendant 3 s |
| Dire Miralis | Monstre | Tank | Feu | Dragon noir | 6 | 1 | **Éruption** : 200/300/450 + 250/313/375 % puiss. élém. aux ennemis à 2 cases ou moins, puis bouclier de 250/375/565 + 10/13/15 % des PV max pendant 5 s |
| Royal Ludroth | Monstre | Support | Eau | Catalyseur, Léviathan | 1 | 2 | **Crinière spongieuse** : soigne de 50/75/115 + 150/188/225 % puiss. élém. les alliés à 2 cases ou moins |
| Kulu-Ya-Ku | Monstre | Bruiser | — | Berserker | 1 | 1 | **Coup de rocher** : 70/105/160 + 150/188/225 % attaque brute (physique) sur la cible |
| Aiden (Épée et bouclier) | Chasseur | Bruiser | Dragon | Guilde, Bastion | 1 | 1 | **Frappe tournoyante** : 50/75/115 + 150/188/225 % puiss. élém. sur la cible et ses voisins |
| Jyuratodus | Monstre | Tank | Eau | Bastion | 2 | 1 | **Bain de boue** : 30/45/70 + 70/88/105 % puiss. élém. aux ennemis adjacents, −25 % de vitesse d'attaque pendant 2 s |
| Barioth | Monstre | Bruiser | Glace | Wyverne volante | 2 | 1 | **Charge glaciale** : bondit sur l'ennemi le plus faible, 60/90/135 + 170/213/255 % puiss. élém., −20 % de vitesse d'attaque pendant 2 s |
| Rondine (Épée longue) | Chasseur | DPS | Eau | Guilde, Berserker | 2 | 1 | **Coup spirituel** : 70/105/160 + 200/250/300 % puiss. élém. sur la cible |
| Nargacuga | Monstre | DPS | — | Wyverne volante | 3 | 1 | **Queue tranchante** : bondit sur l'ennemi le plus faible, 110/165/250 + 220/275/330 % attaque brute (physique) |
| Lagiacrus | Monstre | Tank | Foudre | Bastion, Léviathan | 3 | 1 | **Décharge abyssale** : 45/70/100 + 80/100/120 % puiss. élém. aux ennemis à 2 cases ou moins |
| Luchika (Fusarbalète lourd) | Chasseur | DPS | Dragon | Guilde, Catalyseur | 3 | 4 | **Tir draconique** : 130/195/295 + 320/400/480 % puiss. élém. sur sa cible et ses voisins |
| Tigrex | Monstre | Bruiser | — | Wyverne volante, Berserker | 4 | 1 | **Rugissement** : 110/165/250 + 180/225/270 % attaque brute (physique) aux ennemis adjacents |
| Kirin | Monstre | DPS | Foudre | Dragon ancien | 5 | 3 | **Foudre divine** : 200/300/450 + 280/350/420 % puiss. élém. sur l'ennemi le plus faible et ses voisins |
| Lea (Grande épée) | Chasseur | DPS | Feu | Guilde, Berserker | 5 | 1 | **Rage de la chasseuse** : charge 1 s, puis 200/300/450 + 350/438/525 % attaque brute (physique) sur sa cible et ses voisins ; puis furie 5 s : +40 % de vitesse d'attaque et 20 % de vol de vie |

### Compétences secrètes des Dragons noirs (★3)

Easter egg validé le 2026-11-25 : au ★3, la compétence secrète remplace la compétence habituelle. Elle vise **tous les ennemis**, avec 5 fois les dégâts de la compétence ★3, et reste cachée sur les fiches tant que l'unité n'est pas ★3.

| Dragon noir | Compétence secrète | Effet au ★3 |
|---|---|---|
| Fatalis | **Fin des temps** | Incantation de 1,5 s, puis 3375 + 3000 % puiss. élém. à tous les ennemis |
| Alatreon | **Jugement absolu** | Incantation de 1,5 s, puis 2475 + 2550 % puiss. élém. à tous les ennemis, −30 % de vitesse d'attaque pendant 3 s |
| Dire Miralis | **Cataclysme** | 2250 + 1875 % puiss. élém. à tous les ennemis, puis bouclier de 565 + 15 % des PV max pendant 5 s |

Au lancement, un bandeau traverse le plateau avec le portrait du monstre et le nom du sort ; son cri se joue si un fichier son est déposé dans `src/assets/sounds/` (voir architecture.md).

### Rangs ★

Règle validée (voir [game-design.md](game-design.md), section 3.4) : PV et attaque brute ×1,8 à chaque rang, une valeur de base de compétence par rang, durées et pourcentages inchangés.

Équilibrage du 2026-11-21 : les dégâts des compétences des tanks et des supports ont été divisés par deux (base et ratio), sauf Dire Miralis ; leurs boucliers, soins et ralentissements n'ont pas changé.

### Équilibrage du 2026-11-24

Mesure sur environ 120 000 combats simulés : chaque unité (★1, sans objet) affronte chaque unité de son coût, entourées des mêmes coéquipiers et adversaires de 6 unités tirés au hasard, des deux côtés du plateau. 16 unités qui s'écartaient trop de 50 % de victoires ont été retouchées ; après retouche, toutes sont entre 44 et 62 %. Les compétences du tableau ci-dessus sont déjà à jour.

| Unité | Retouche | Victoires contre son coût, avant → après |
|---|---|---|
| Dire Miralis | PV 2 100 → 1 900, énergie max 100 → 120, bouclier 400 + 20 % → 250 + 10 % des PV max | 73 → 57 % |
| Tigrex | PV 1 100 → 1 000, attaque 80 → 68, Rugissement 230 → 180 % | 73 → 56 % |
| Rathalos | PV 850 → 750, attaque 65 → 55, Boule de feu 250 → 200 % | 71 → 60 % |
| Barroth | PV 850 → 780, armure 45 → 40, énergie max 70 → 90, bouclier 15 → 12 % des PV max | 65 → 62 % |
| Teostra | PV 1 250 → 1 100, Supernova 350 → 290 % | 63 → 53 % |
| Namielle | PV 1 100 → 1 000, dégâts 125 → 110 %, soin 150 → 110 % | 62 → 55 % |
| Fabius | bouclier 200 + 20 % → 160 + 14 % des PV max | 61 → 60 % |
| Galleus | PV 800 → 1 100, attaque 62 → 75, puiss. élém. 45 → 55, armure 35 → 40, énergie max 70 → 60, incantation 1 → 0,5 s, 250 → 340 % | 23 → 43 % |
| Safi'jiiva | vise sa cible actuelle au lieu de l'ennemi le plus éloigné | 30 → 54 % |
| Luchika | vise sa cible actuelle, PV 550 → 750, incantation 1 → 0,5 s, 250 → 320 % | 34 → 44 % |
| Alatreon | PV 1 500 → 1 900, incantation 2 → 1,5 s, 280 → 340 % | 28 → 47 % |
| Fiorayne | PV 700 → 850, armure 30 → 35, énergie max 70 → 60, charge 1,5 → 1 s | 40 → 44 % |
| Fugen | PV 550 → 680, armure 20 → 35, attaque 45 → 48 | 39 → 45 % |
| Olivia | PV 650 → 760, armure 30 → 35, attaque 55 → 58 | 41 → 46 % |
| Rondine | PV 580 → 700, armure 20 → 30 | 43 → 47 % |
| Fatalis | PV 1 800 → 1 900 | 44 → 45 % |

Lea (ajoutée le 2026-11-25, statistiques ★1 : PV 1 100, attaque brute 95, puissance élémentaire 40, critique 20 %, armure 40, résistance 35, vitesse d'attaque 0,65, énergie max 70) : environ 48 % de victoires contre les autres unités de coût 5, sans objet. Son jeton est provisoire : l'icône de Grande épée de Fiorayne (`src/assets/portraits/lea.webp`), à remplacer par un portrait.

⚠️ Ces valeurs restent provisoires : la mesure ne couvre ni les rangs ★2 et ★3, ni les compositions optimisées, et elle surestime sans doute un peu les tanks (une équipe tirée au hasard manque souvent de première ligne).

⚠️ À surveiller en partie réelle : avec 2 objets par chasseur et 1 par monstre, les chasseurs Guilde passent à 55–72 % contre leur coût (Arlow 72 %, Galleus 66 %). La Guilde partagée ajoute 8 à 14 points, autant que l'ancienne Guilde dans ce cas précis (2 chasseurs à 2 objets : +12 % chacun avec les deux règles).

⚠️ Les valeurs de base ★2 et ★3 du tableau sont **provisoires**. Elles suivent une règle simple, à remplacer unité par unité pendant l'équilibrage : ★2 ≈ ★1 × 1,5 et ★3 ≈ ★1 × 2,25, arrondis à 5.

---

## Traits

Paliers (✅) : **2 / 4 / 6** pour les traits d'au moins 6 unités, **2 / 4** pour Glace (5 unités, en attendant une 6e), **2 / 3** pour Léviathan et Wyverne brute, 1 / 2 / 3 pour Dragon ancien et 1 seul palier pour Dragon noir (1 Dragon noir maximum par plateau). ⚠️ Comme dans TFT, deux exemplaires de la même unité ne comptent qu'une fois.

⚠️ Valeurs : le premier palier est inchangé, celui du milieu reprend l'ancien palier 3, et le nouveau palier du haut vaut environ ×1,6 celui du milieu. Exceptions arrondies vers le bas : Bastion 6 à −45 % (au lieu de −48 %) et Berserker 6 à ×2,1 (multiplicateur +0,6 au lieu de +0,64).

Dans les panneaux de synergies, un palier atteint est en **bronze** (premier), **argent** (deuxième) ou **or** (dernier, toujours or).

### Éléments (mécanique propre à chaque élément)

| Trait | Palier 2 | Palier 4 | Palier 6 |
|---|---|---|---|
| Feu | Les coups des unités Feu brûlent : 20 dégâts élémentaires/s pendant 3 s | 40 dégâts/s | 65 dégâts/s (✅ depuis Lea) |
| Foudre | Toutes les 4 s, un éclair frappe un ennemi au hasard (80 dégâts élémentaires) | Toutes les 3 s, 150 dégâts | Toutes les 2,5 s, 240 dégâts |
| Glace | Les coups des unités Glace réduisent la vitesse d'attaque de la cible de 20 % pendant 2 s | −35 % | — |
| Sans élément | +15 % d'attaque brute pour les unités sans élément | +30 % | +50 % |
| Eau (Source de vie) | Les unités Eau soignent l'allié le plus blessé de 15 % des dégâts qu'elles infligent | 30 % | 50 % |
| Dragon (Rage draconique) | Les unités Dragon infligent +20 % de dégâts quand leurs PV sont sous 50 % | +40 % | +65 % |

### Traits secondaires

| Trait | Réservé à | Palier 2 | Palier 4 | Palier 6 |
|---|---|---|---|---|
| Guilde | Chasseurs | Toutes les unités Guilde : +3 % PV, attaque brute et puiss. élém. par objet porté par une unité Guilde (9 objets comptés au plus) | +4 % par objet | +5 % par objet |
| Berserker | — | Compétences critiques possibles, +15 % de chance de critique, multiplicateur +0,2 (×1,7) | +30 %, multiplicateur +0,4 (×1,9) | +50 %, multiplicateur +0,6 (×2,1) |
| Bastion | — | −15 % de dégâts subis | −30 % | −45 % |
| Catalyseur | — | +20 puissance élémentaire | +45 | +70 |
| Wyverne volante | Monstres | +15 % de vitesse d'attaque | +30 % | +50 % |

Autres traits secondaires (paliers propres) :

| Trait | Réservé à | Palier 1 | Palier 2 |
|---|---|---|---|
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

Les 36 objets ont été validés le 2026-11-23. Leurs noms viennent des talents de Monster Hunter. ⚠️ Toutes les valeurs sont provisoires. Les 36 objets sont codés (en 3 lots). Une attaque esquivée ne déclenche aucun effet d'objet « au coup ». Les dégâts sur la durée (brûlure, poison) ne comptent pas comme des « coups » pour les objets (Ressentiment, Bénédiction divine, Soif de sang).

| Matériaux | Objet | Effet en plus des matériaux | Lot |
|---|---|---|---|
| Os + Os | Bonus d'attaque | +20 attaque brute | ✅ |
| Membrane + Membrane | Œil critique | +20 % de chance de critique | ✅ |
| Os + Membrane | Bonus critique | Multiplicateur critique +0,3 (×1,8) | ✅ |
| Gemme + Gemme | Attaque élémentaire | +20 puissance élémentaire | ✅ |
| Gemme + Extrait | Accumulateur | Regagne 20 énergie après chaque compétence | ✅ |
| Carapace + Carapace | Santé | +300 PV | ✅ |
| Corne + Croc | Défense totale | +20 armure et +20 résistance élémentaire | ✅ |
| Plume + Os | Agitateur | +3 % de vitesse d'attaque par seconde de combat (max +45 %) | ✅ |
| Plume + Plume | Balistique | +1 de portée | ✅ lot 1 |
| Extrait + Extrait | Concentration | Énergie maximale −20 % | ✅ lot 1 |
| Gemme + Membrane | Élément critique | Compétences critiques possibles ; multiplicateur critique +0,2 (×1,7) | ✅ lot 1 |
| Carapace + Membrane | Héroïsme | +30 % de dégâts sous 50 % des PV | ✅ lot 1 |
| Os + Gemme | Éveil élémentaire | Les attaques de base infligent en plus 40 % de la puissance élémentaire en dégâts élémentaires | ✅ lot 1 |
| Os + Carapace | Soif de sang | Soigne l'unité de 15 % des dégâts qu'elle inflige (attaques, compétences, effets d'objets) | ✅ lot 1 |
| Os + Croc | Briseur | Chaque attaque de base qui touche retire 4 armure à la cible, pour tout le combat (max −24) | ✅ lot 1 |
| Membrane + Corne | Œil de l'esprit | Les attaques de base ignorent 50 % de l'armure de la cible | ✅ lot 1 |
| Membrane + Croc | Faiblesse exploitée | +25 % de chance de critique contre les cibles sous 50 % de leurs PV | ✅ lot 1 |
| Membrane + Plume | Furie | Chaque coup critique : +6 % de vitesse d'attaque (max +36 %) | ✅ lot 1 |
| Os + Extrait | Pouvoir latent | Après 10 s de combat : +30 % de chance de critique et +20 % de vitesse d'attaque | ✅ lot 1 |
| Gemme + Plume | Attaque explosion | Toutes les 4 attaques de base qui touchent : explosion de 60 + 60 % de la puissance élémentaire sur la cible et ses voisins | ✅ lot 1 |
| Corne + Corne | Garde | Les attaques de base subies ne sont jamais critiques et infligent −20 % de dégâts | ✅ lot 2 |
| Os + Corne | Contre-attaque | Renvoie 30 % des dégâts des attaques de base subies à l'attaquant | ✅ lot 2 |
| Carapace + Corne | Bénédiction divine | 25 % de chances de réduire de moitié les dégâts d'un coup subi | ✅ lot 2 |
| Carapace + Croc | Récupération | Régénère 1,5 % des PV max par seconde | ✅ lot 2 |
| Carapace + Plume | Ressentiment | Chaque coup subi : +2 % de vitesse d'attaque (max +40 %) | ✅ lot 2 |
| Carapace + Extrait | Garde offensive | +4 énergie à chaque coup subi, quel que soit le rôle (pas à travers un bouclier) | ✅ lot 2 |
| Corne + Extrait | Garde renforcée | Après chaque compétence : +30 armure et +30 résistance élémentaire pendant 4 s | ✅ lot 2 |
| Gemme + Carapace | Bonus soin | Soins et boucliers de la compétence +30 % | ✅ lot 2 |
| Gemme + Corne | Coalescence | Chaque compétence lancée : +10 % de dégâts des compétences pour le reste du combat (max +50 %) | ✅ lot 2 |
| Croc + Croc | Anti-fléaux | Immunité à la brûlure, aux ralentissements et aux statuts (poison, paralysie) | ✅ lot 3 |
| Gemme + Croc | Attaque poison | Les compétences empoisonnent : 20 + 20 % de la puissance élémentaire par seconde pendant 4 s, et la cible reçoit −40 % de soins | ✅ lot 3 |
| Corne + Plume | Attaque paralysie | Les attaques de base ont 10 % de chances de paralyser la cible 1,5 s (elle n'agit plus) | ✅ lot 3 |
| Croc + Plume | Intimidateur | Les attaques de base retirent 5 énergie à la cible | ✅ lot 3 |
| Croc + Extrait | Grand rayon | Quand l'unité lance sa compétence, les alliés à 2 cases ou moins gagnent 10 énergie | ✅ lot 3 |
| Membrane + Extrait | Coups en chaîne | Chaque coup critique rend 5 énergie | ✅ lot 3 |
| Plume + Extrait | Récupération d'endurance | Les attaques de base donnent 3 énergie de plus | ✅ lot 3 |

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
| Amélioration de la boutique | 2→3 : 4 · 3→4 : 8 · 4→5 : 12 · 5→6 : 20 · 6→7 : 28 · 7→8 : 36 · 8→9 : 48 · 9→10 : 64 (validé) |
| Revente | Coût × exemplaires : ★1 = coût, ★2 = 3 × coût, ★3 = 9 × coût |
| Exemplaires par unité | Coût 1 : 18 · coût 2 : 15 · coût 3 : 12 · coût 4 : 10 · coût 5 : 9 · coût 6 : 9 (validé ; 9 = juste assez pour un ★3) |
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
| 10 | 5 | 15 | 25 | 35 | 15 | 5 (validé) |

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

| Choix | Chasse classique | Boss ou quête urgente |
|---|---|---|
| Matériau au hasard | 1 | 2 |
| Zennys | 4 | 8 |
| Unité ★1 tirée comme en boutique | 1 exemplaire | 2 exemplaires de la même unité |
| Retire-objet | — | Boss seulement : +1 garanti, en plus du choix |

### Talents de chasseur (game-design §11.1)

Validés le 2026-11-24. ⚠️ Toutes les valeurs sont provisoires. « Toute l'équipe » : les unités du joueur sur le plateau, en combat.

| Rareté | Talent | Famille | Effet |
|---|---|---|---|
| Argent | Repas de cantine | Combat | Toute l'équipe : +10 % PV |
| Argent | Graine de puissance | Combat | Toute l'équipe : +8 % attaque brute et puissance élémentaire |
| Argent | Réflexes de chasseur | Combat | Toute l'équipe : +8 % vitesse d'attaque |
| Argent | Bourse de la Guilde | Économie | +10 zennys tout de suite |
| Argent | Commerce félyne | Économie | Une relance gratuite de la boutique à chaque tour |
| Argent | Kit de récolte | Objets | 3 matériaux au hasard |
| Argent | Nouvelle recrue | Unités | 2 exemplaires d'une unité de coût 3 tirée au hasard |
| Argent | Insigne de trait | Traits | +1 au compteur d'un trait tiré au hasard |
| Or | Poudre démoniaque | Combat | Toute l'équipe : +15 % attaque brute et puissance élémentaire |
| Or | Poudre de carapace | Combat | Toute l'équipe : +25 armure et +25 résistance élémentaire |
| Or | Chasseurs d'élite | Combat | Les chasseurs : +20 % PV, attaque brute et puissance élémentaire |
| Or | Banquier félyne | Économie | Intérêts plafonnés à 8 zennys au lieu de 5, et +5 zennys tout de suite |
| Or | Rang supérieur | Économie | +1 niveau de boutique tout de suite, gratuit (9 au plus) |
| Or | Commande au forgeron | Objets | Un objet complet tiré au hasard et un retire-objet |
| Or | Renfort de la Guilde | Unités | Une unité de coût 4 tirée au hasard |
| Or | Blason de trait | Traits | +1 au compteur d'un trait tiré au hasard, et ses unités gagnent +10 % PV |
| Prismatique | Sang de l'Ancien | Combat | Toute l'équipe : +20 % PV, attaque brute et puissance élémentaire |
| Prismatique | Éveil draconique | Combat | Toute l'équipe commence le combat avec 40 % de son énergie |
| Prismatique | Instinct du prédateur | Combat | Toute l'équipe : +20 % vitesse d'attaque et +15 % de chance de critique |
| Prismatique | Fortune du Commandant | Économie | +4 zennys à chaque tour |
| Prismatique | Grand chasseur | Économie | +1 place sur le plateau, sans changer le niveau |
| Prismatique | Arsenal de la Guilde | Objets | 2 objets complets tirés au hasard et 2 retire-objets |
| Prismatique | Appel de l'Ancien | Unités | Un Dragon ancien ★1 tiré au hasard |
| Prismatique | Couronne de trait | Traits | +2 au compteur d'un trait tiré au hasard |

### Carte (game-design §2.1)

| Élément | Valeur |
|---|---|
| Forme | 9 étapes de 2 à 3 cases (tirées au hasard), puis le boss ; chemins sans croisement (✅) |
| Embranchements | ⚠️ 80 % de chances d'ajouter un chemin vers une case voisine quand il ne croise rien (environ 1,6 chemin par case en moyenne ; sans croisement, on ne peut guère faire plus) |
| Cases spéciales par stage | ⚠️ Forges : 1 à 2 · marchands : 1 à 2 · quêtes urgentes : 2 à 3, à partir de l'étape 3 |
| Règles de placement | Étape 1 : que des chasses · étape 9 : une forge ou un marchand · chaque étape garde au moins une chasse normale |
| Quête urgente | ⚠️ Budget et nombre de monstres de 3 chasses plus loin, limites de coût et de rang du stage en cours ; récompenses ×2 |
| Forge | Objets retirés gratuitement pendant l'étape · 2 matériaux de l'inventaire reforgés au choix |
| Marchand | ⚠️ 4 matériaux tirés au hasard à 3 zennys · 1 retire-objet à 4 zennys |
| Monstre cible affiché | Le plus fort de l'escouade : coût × exemplaires (★1 = 1, ★2 = 3, ★3 = 9), puis le coût |

### Mode infini (game-design §2.2)

| Élément | Valeur |
|---|---|
| Renforcement des ennemis | ✅ +5 % de PV, d'attaque brute et de puissance élémentaire par étape après la 30e (étape 40 : +50 %, étape 60 : +150 %) ; quête urgente : comme 3 étapes plus loin |
| Escouades | Règles du stage 3 : coût 4 et rang ★3 au plus, boss Dragon ancien ★2 (⚠️ 15 % de chances d'un Dragon noir ★1) ; budget et nombre de monstres selon la formule habituelle |
| Défaites | Compteur de la run conservé (3 au total) |

---

## Effets de compétence ajoutés au moteur

- **Bouclier** : absorbe les dégâts avant les PV, pendant une durée limitée. ✅ Tant que le bouclier tient (détruit ou expiré), l'unité ne gagne pas d'énergie (Barroth, Fabius, Arlow, Dire Miralis). Le rappel figure sur leur fiche.
- **Soin** : rend des PV sans dépasser le maximum ; réduit pendant la mort subite.
- **Bonus temporaire** : vitesse d'attaque augmentée pendant une durée limitée.
- **Ralentissement** : vitesse d'attaque réduite pendant une durée limitée.
- **Zone centrée sur le lanceur** (Khezu) et **bond** vers la cible (Tobi-Kadachi).
- ⚠️ Boucliers et soins peuvent s'appuyer sur les PV max du lanceur.
