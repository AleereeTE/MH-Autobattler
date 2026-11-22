# Monster Hunter Autobattler — Game design

> Document de référence des décisions de game design.
> Étape en cours : **Étape 5 — Extension du gameplay** (moteur de combat et bac à sable en place). Architecture : voir [architecture.md](architecture.md).
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
| Boss du stage 3 | Tiré au hasard parmi plusieurs Dragons anciens ; avec un peu de chance (ou de malchance), un Dragon noir |
| Carte | Une **carte visible par stage**, façon Slay the Spire : 9 étapes de 2 à 3 cases reliées par des chemins, puis le boss. On choisit sa route case par case (section 2.1) |
| Durée visée | 45 à 60 minutes |
| Défaite de la run | 3 combats perdus (chasses classiques et boss confondus) |
| Mode infini | **Principe validé** : après les 30 étapes, on peut continuer dans un mode infini où les statistiques des ennemis augmentent à chaque combat, pour voir jusqu'où on tient. Détails à définir (section 14) |

### 2.1 Carte d'un stage

| Élément | Décision |
|---|---|
| Forme | Tout le stage est affiché : 9 étapes de **2 à 3 cases**, reliées par des chemins, puis le boss (étape 10). On avance d'une étape à la fois en suivant un chemin, ce qui permet de planifier sa route (ex. passer par une forge juste avant le boss) |
| Durée | La run garde **30 étapes**. Une case sans combat remplace une chasse : moins de combats, donc moins de risques de défaite, mais ni bonus de victoire ni récompense |
| Revenus | ⚠️ Les revenus du tour (base + intérêts) sont versés à chaque étape, combat ou non |
| Informations visibles | Pour une case de combat : le **monstre cible** (le plus fort de l'escouade) et le **type de récompense**. L'escouade complète se découvre en entrant |
| Chasse | Une chasse normale (escouade générée selon le budget, section 9) |
| Quête urgente | Une chasse plus difficile : ⚠️ escouade générée avec le budget de 3 chasses plus loin (sans dépasser les limites de coût et de rang du stage). En cas de victoire, **récompenses doublées** comme après un boss. ⚠️ Une défaite compte comme une défaite normale |
| Forge (sans combat) | Pendant l'étape, **les objets se retirent des unités sans retire-objet** (on refait ses builds), et on peut **reforger jusqu'à 2 matériaux** de l'inventaire en matériaux au choix |
| Marchand (sans combat) | ⚠️ 4 matériaux tirés au hasard à 3 zennys pièce, et un retire-objet à 4 zennys |
| Boutique | Disponible à chaque étape, y compris à la forge et chez le marchand |
| Fréquence | ⚠️ Par stage, environ 1 à 2 forges, 1 à 2 marchands et 2 à 3 quêtes urgentes. L'étape 1 n'a que des chasses ; l'étape 9 (avant le boss) propose toujours une forge ou un marchand ; chaque étape garde au moins une chasse normale |
| Plus tard | Cases « Événement » (une petite situation avec un choix), talents de chasseur, récompenses variées |

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

### Première version du mode run (étape 5)

| Élément | Décision |
|---|---|
| Enchaînement | Carte par stage (section 2.1). Avant elle, les 30 chasses s'enchaînaient sans choix |
| Ennemis | Escouades générées selon un budget (section 9) |
| Boss (chasses 10, 20, 30) | **Escouade renforcée** en attendant la « version boss » (section 9) |
| Récompenses | **1 parmi 3 simplifié** (section 11) |
| Fin de la run | Victoire contre le boss de la chasse 30, ou 3 défaites |

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

- Chaque unité coûte de **1 à 5 zennys**, sauf les **Dragons noirs** (Fatalis, Alatreon, Dire Miralis) qui coûtent **6 zennys** : très difficiles à obtenir (boutique au niveau 9 seulement, 3 exemplaires chacun), mais très puissants. Leur jeton a un fond prismatique.
- Le nombre d'exemplaires de chaque unité est **limité selon son coût** (valeurs de départ dans [prototype-content.md](prototype-content.md), section « Mode run »).
- 3 exemplaires identiques du même rang donnent un exemplaire du rang supérieur :

| Rang | Obtention |
|---|---|
| ★1 Rang Bas | Achat en boutique, capture |
| ★2 Rang Haut | 3 exemplaires ★1 |
| ★3 Rang Maître | 3 exemplaires ★2 |

#### Fusion automatique

- Dès que le joueur possède **3 exemplaires identiques du même rang**, ils fusionnent aussitôt en un exemplaire du rang supérieur ; une fusion ★2 peut en entraîner une ★3.
- Les exemplaires **sur le plateau et en réserve** comptent.
- L'unité fusionnée prend la case d'un exemplaire posé sur le plateau, sinon une place de la réserve.
- Acheter un exemplaire qui déclenche une fusion reste possible **même réserve pleine**.
- Objets et matériaux : voir section 7.2.

#### Progression par rang

| Élément | ★1 | ★2 | ★3 |
|---|---|---|---|
| PV et attaque brute | ×1 | ×1,8 | ×3,24 (×1,8 à chaque rang, comme TFT) |
| Autres statistiques | Inchangées | Inchangées | Inchangées |
| Compétence | Valeur de base ★1 | Valeur de base ★2 | Valeur de base ★3 |

- **Statistiques** : seuls les PV et l'attaque brute augmentent. La puissance élémentaire, l'armure, la résistance, la vitesse d'attaque, la portée et l'énergie ne changent pas.
- **Compétences** : chaque fiche définit **une valeur de base par rang** (exemple : 60 / 90 / 135). **Les pourcentages de statistique** (attaque brute, puissance élémentaire, PV) **augmentent aussi avec le rang : ×1,25 au ★2, ×1,5 au ★3** (exemple : 250 / 313 / 375 % de la puissance élémentaire). Tous les pourcentages sont concernés, y compris ceux d'attaque brute et de PV, qui profitent en plus de la hausse de la statistique.
- **Durées et autres pourcentages** des compétences (durée d'un bouclier, bonus de vitesse d'attaque, ralentissement…) : **identiques à tous les rangs** pour l'instant.
- Valeurs de base du prototype : voir [prototype-content.md](prototype-content.md).

### 3.5 Énergie et compétences

- Chaque unité possède **1 compétence**, lancée automatiquement quand son énergie atteint le maximum.
- L'énergie maximale est **propre à chaque unité**.
- Toutes les unités commencent le combat avec **0 énergie**, sauf effet de trait (Calamité des Dragons anciens, section 4).
- L'énergie est **bloquée pendant qu'une compétence s'exécute**.
- L'énergie est aussi **bloquée tant que l'unité porte un bouclier**, jusqu'à ce qu'il soit détruit ou expire : aucune source ne passe (gain passif, attaques, coups subis, Accumulateur). Le coup qui brise le bouclier ne donne pas d'énergie non plus. Sans cette règle, un tank gagnait de l'énergie avec les coups absorbés par son bouclier et enchaînait les boucliers (Barroth en lançait jusqu'à 18 par combat).
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
  - **Sans élément** : bonus d'attaque brute ;
  - **Eau (Source de vie)** : les unités Eau soignent l'allié le plus blessé d'une partie des dégâts qu'elles infligent ;
  - **Dragon (Rage draconique)** : les unités Dragon infligent plus de dégâts quand leurs PV passent sous 50 %.
- **Dragon ancien (Calamité)** : trait secondaire des Dragons anciens (monstres de coût 5), avec des paliers à 1, 2 et 3 unités. Les Dragons anciens commencent le combat avec une partie de leur énergie, donc lancent leur compétence plus tôt.
- **Dragon noir (Terreur)** : trait secondaire des Dragons noirs (monstres de coût 6), avec un seul palier (1 unité). Tant qu'un Dragon noir est en vie, tous les ennemis infligent moins de dégâts. **Un seul Dragon noir par plateau** : à trois, le plateau devenait imbattable. Les Dragons noirs ne sont pas des Dragons anciens dans le jeu (ils n'ont pas le trait Dragon ancien).
- **Traits de famille** (monstres uniquement, paliers à 2 et 3 unités) :
  - **Léviathan (Glissade)** : les Léviathans esquivent une partie des attaques de base. Une attaque esquivée n'inflige ni dégâts ni effet d'élément ; les compétences ne s'esquivent jamais ;
  - **Wyverne brute (Masse)** : les Wyvernes brutes gagnent des PV max ;
  - **Wyverne à crocs** : prévue quand il y aura au moins 3 Wyvernes à crocs.
- Les traits secondaires renforcent les unités du trait.
- **Paliers** : **2 / 4 / 6** pour les traits d'au moins 6 unités (Foudre, Eau, Dragon, Sans élément, Guilde, Berserker, Bastion, Catalyseur, Wyverne volante) ; **2 / 4** pour Feu et Glace (5 unités, en attendant une 6e) ; **2 / 3** pour les petites familles (Léviathan, Wyverne brute) ; 1 / 2 / 3 pour Dragon ancien et 1 pour Dragon noir. Le premier palier garde son effet, celui du milieu reprend l'ancien palier 3, et le palier du haut vaut environ ×1,6 celui du milieu.
- **Couleur des synergies** : un palier atteint s'affiche en **bronze** (premier palier), **argent** (deuxième) ou **or** (dernier). Le dernier palier est toujours or : un trait à 2 paliers passe de bronze à or, et le Dragon noir (1 palier) est or d'emblée. Chaque synergie porte aussi l'insigne de son trait.
- Valeurs des paliers : voir [prototype-content.md](prototype-content.md). Elles évolueront avec l'arrivée de nouvelles unités.

---

## 5. Combat

| Élément | Décision |
|---|---|
| Grille | Hexagonale, 7 colonnes × 4 rangées par camp (comme TFT) |
| Écoulement du temps | Temps réel simulé par ticks |
| Contrôle du joueur | Aucun pendant le combat |
| Ciblage | Toujours **l'ennemi le plus proche** de l'unité, réévalué en permanence : si un autre ennemi devient plus proche, l'unité change de cible. Certaines compétences visent l'ennemi le plus faible ou la ligne arrière |
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
- **Fusion de 3 exemplaires** : l'unité fusionnée récupère les objets et matériaux des 3 exemplaires, dans la limite de ses emplacements (les matériaux seuls fusionnent entre eux selon la règle habituelle). Le surplus revient dans l'inventaire du joueur.
- **Inventaire** : les matériaux et objets qui ne sont pas posés sur une unité y attendent, entre les combats.
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
| Dragons noirs (coût 6) | **1 seul sur le plateau** (on peut en garder d'autres en réserve). Seulement au niveau 9 de la boutique, 3 exemplaires de chacun : le ★2 est un exploit, le ★3 est impossible |
| Unités obtenues au ★3 | **Plus proposées** par la boutique ni par les récompenses (les offres déjà affichées disparaissent dès que le ★3 se forme). Si le ★3 est revendu, l'unité peut de nouveau apparaître |
| Réserve | 10 places pour les unités achetées mais non placées |
| Planificateur d'équipe | Comme dans TFT : on choisit jusqu'à **9 unités** (la taille maximale du plateau, 1 Dragon noir au plus) dans la liste complète, et on voit les synergies de ce plan. En run, les unités du plan sont **signalées dans la boutique** (« 📌 Plan ») et un encadré coche celles déjà possédées. Le plan est **gardé d'une run à l'autre** |

### 8.3 Valeurs de départ

Les valeurs de départ (zennys, relance, amélioration, revente, probabilités, exemplaires) sont dans [prototype-content.md](prototype-content.md), section « Mode run ». Elles sont provisoires ⚠️ et seront ajustées pendant l'équilibrage.

- La boutique est **relancée gratuitement au début de chaque tour**. Les unités proposées mais non achetées retournent dans le stock commun.
- **Revente** : une unité rapporte son coût multiplié par le nombre d'exemplaires qu'elle représente (1, 3 ou 9), et ces exemplaires retournent dans le stock.

---

## 9. Ennemis

- **Chasses classiques** : escouades de monstres **générées selon un budget**, qui augmente au fil de la run.
- **Chasses de boss** : la **version boss** d'un grand monstre, plus puissante que sa version unité **[contenu exact à définir]**.
- **Première version** : uniquement des monstres. Le budget sert à recruter des monstres (selon leur coût) puis à monter leur rang. Les boss sont une **escouade renforcée** : un grand monstre ★3 entouré d'une escorte aux stages 1 et 2, un **Dragon ancien ★2** entouré d'une escorte au stage 3 — ou, une fois sur quelques-unes, un **Dragon noir ★1**. Les monstres de coût 4 apparaissent dans les escouades des stages 2 et 3 ; les Dragons anciens ne sont que des boss. Les règles de calcul sont dans [prototype-content.md](prototype-content.md) ⚠️.
- L'escouade de la prochaine chasse est visible sur le plateau pendant la préparation.
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
- **Première version (1 parmi 3 simplifié)** : un matériau au hasard, des zennys, ou une unité ★1 tirée comme en boutique ; pas encore d'objet fusionné, de retire-objet ni de capture parmi les choix. Après un boss, les quantités sont doublées, en plus du retire-objet garanti. Une unité ne peut être choisie que s'il y a de la place en réserve (ou si elle déclenche une fusion).

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
1. **Game design** : règles, combats, unités, progression. ← règles validées
2. **Architecture** : structure technique et responsabilités des modules. ← fait (architecture.md)
3. **Moteur de combat** : règles validées, tests automatisés, journal des événements. ← fait
4. **Prototype jouable** : préparer une équipe et observer un combat avec des formes temporaires. ← fait (bac à sable)
5. **Extension du gameplay** : armes, compétences, monstres, mécaniques avancées. ← en cours
6. **Intégration graphique** : modèles, animations, effets visuels.

---

## 14. Questions ouvertes

### Règles
1. Les ennemis sont-ils uniquement des monstres ?
2. Les monstres qui ne sont pas des Dragons anciens sont-ils tous disponibles en boutique **et** par capture, ou certains uniquement par capture ?
3. ~~Les Dragons anciens en boutique : quel coût ?~~ Tranché : coût 5.
4. La capture du boss fait-elle toujours partie des choix de récompense après un boss ?
5. Formule des ratios de compétence : valeur de base + ratio × statistique, ou pourcentage d'amplification comme la puissance magique de TFT ?
6. Contenu de la version boss d'un monstre (PV, plusieurs compétences, état enragé ?).
7. ~~Informations visibles sur chaque chasse proposée par la carte.~~ Tranché : monstre cible et type de récompense.
12. Mode infini : de combien les statistiques des ennemis augmentent-elles à chaque combat ? Y a-t-il encore une carte, des récompenses, une limite de défaites ? Comment afficher le record ?


### Confort de jeu
8. Bouton d'accélération ×2 des combats ?
9. Sauvegarde en cours de run ?

### Contenu
10. Effets des 36 objets (conçus par Théo).
11. Unités supplémentaires : arme de chasseur restante (Fusarbalète léger), autres monstres (dont des Wyvernes à crocs) et Dragons anciens.

---

## 15. Historique

- **2026-11-20** : création du document. Décisions de l'étape 1 : structure de run, unités, rôles, statistiques, énergie, traits, combat, dégâts, objets, économie, ennemis, recrutement et récompenses.
- **2026-11-20** : une défaite contre un boss compte parmi les 3 de la run ; effet de l'Extrait (+1 énergie/s) ; type de dégâts des compétences selon l'élément de l'unité ; vocabulaire matériau / objet.
- **2026-11-20** : contenu du prototype validé ([prototype-content.md](prototype-content.md)) ; mécanique propre à chaque élément ; nouveaux effets de compétence (bouclier, soin, bonus, ralentissement).
- **2026-11-20** : début de l'étape 5. Progression par rang ★ : PV et attaque brute ×1,8 à chaque rang, autres statistiques inchangées ; chaque compétence a une valeur de base par rang, les ratios restent identiques (section 3.4).
- **2026-11-20** : rangs ★ — les durées et pourcentages des compétences ne changent pas avec le rang pour l'instant. Rangs implémentés dans le moteur et le bac à sable.
- **2026-11-20** : première version du mode run — suite imposée de 30 chasses, escouades générées selon un budget, boss en escouade renforcée, récompenses 1 parmi 3 simplifiées ; fusion automatique comme TFT (plateau + réserve, objets regroupés, achat possible réserve pleine) ; valeurs de départ de l'économie (provisoires).
- **2026-11-21** : équilibrage — 1 seul Dragon noir par plateau (Terreur réduite à un palier, −15 %) ; dégâts des compétences des tanks et des supports divisés par deux (Khezu, Jyuratodus, Brann, Lagiacrus, Legiana, Namielle), sauf Dire Miralis ; boucliers, soins, ralentissements et zones inchangés.
- **2026-11-20** : 11 nouvelles unités (coûts 1 à 5, dont Kirin en Dragon ancien) ; traits de famille Léviathan (Glissade : esquive des attaques de base) et Wyverne brute (Masse : PV max) ; Wyverne à crocs reportée.
- **2026-11-20** : Dragons noirs — coût 6 (fond prismatique) pour Fatalis, Alatreon et Dire Miralis ; boutique au niveau 9 seulement, 3 exemplaires chacun ; trait Dragon noir (Terreur) ; le boss de la chasse 30 peut être un Dragon noir ★1.
- **2026-11-20** : unités de coût 4 et 5 — 8 unités (dont 3 Dragons anciens au coût 5), traits Eau (Source de vie), Dragon (Rage draconique) et Dragon ancien (Calamité), boutique à 5 coûts, monstres de coût 4 dans les escouades des stages 2 et 3, Dragon ancien ★2 en boss du stage 3.
- **2026-11-20** : ciblage — une unité vise toujours l'ennemi le plus proche, réévalué en permanence (elle ne garde plus sa cible jusqu'au K.O.). Boutique — une unité obtenue au ★3 n'est plus proposée (boutique et récompenses).
- **2026-11-21** : interface — filtre par coût dans la liste du bac à sable ; bilan des combats séparé en deux sections, alliés puis ennemis, avec le nombre d'unités encore debout.
- **2026-11-21** : paliers des traits — 2 / 4 / 6 pour les traits d'au moins 6 unités, 2 / 4 pour Feu et Glace, 2 / 3 pour Léviathan et Wyverne brute ; palier du haut ≈ ×1,6 celui du milieu (provisoire). Couleur des synergies : bronze, argent, or (le dernier palier toujours or), avec l'insigne du trait. Planificateur d'équipe comme dans TFT (9 unités, synergies, unités signalées dans la boutique, gardé d'une run à l'autre).
- **2026-11-21** : interface — aperçu d'un trait au clic droit (sur une synergie ou un insigne d'unité) : tous les paliers avec leur couleur et leur effet, et les unités qui portent le trait.
- **2026-11-21** : équilibrage des boucliers — une unité ne gagne plus d'énergie tant que son bouclier tient (détruit ou expiré), toutes sources comprises. Les tanks à bouclier n'enchaînent plus leur compétence (Barroth : de 10 à 18 boucliers par combat à 2 ou 3).
- **2026-11-21** : interface — barre d'énergie sous la barre de vie des jetons en combat (grisée quand l'énergie est bloquée), et énergie actuelle / maximale avec sa barre dans l'aperçu d'une unité en combat.
- **2026-11-22** : carte du mode run — carte visible par stage (9 étapes de 2 à 3 cases puis le boss), cases Chasse, Quête urgente (budget de 3 chasses plus loin, récompenses doublées), Forge (objets déplaçables sans retire-objet, 2 matériaux reforgés) et Marchand (4 matériaux à 3 zennys, retire-objet à 4) ; une case sans combat remplace une chasse (la run garde 30 étapes) ; on voit le monstre cible et le type de récompense. Principe d'un mode infini après les 30 étapes (détails à définir).
- **2026-11-22** : rangs ★ — les pourcentages de statistique des compétences augmentent avec le rang (×1,25 au ★2, ×1,5 au ★3), pour tous les pourcentages. Mesure sur des équipes de 6 au hasard : les combats ★2 et ★3 raccourcissent de moins d'une seconde (environ 28 à 30 s), la part des compétences dans les dégâts passe de 27 à 29 % (★2) et de 23 à 27 % (★3). **PV des unités inchangés** : on les gardera tels quels, quitte à les revoir en jouant (un multiplicateur global de PV serait alors le levier le plus simple).
