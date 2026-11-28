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
| Boss du stage 3 | Tiré au hasard parmi plusieurs Dragons anciens. ✅ Jamais de Dragon noir (2026-11-27) : il ne peut apparaître en boss qu'en mode infini |
| Carte | Une **carte visible par stage**, façon Slay the Spire : 9 étapes de 2 à 3 cases reliées par des chemins, puis le boss. On choisit sa route case par case (section 2.1) |
| Durée visée | 45 à 60 minutes |
| Défaite de la run | 3 combats perdus (chasses classiques et boss confondus) |
| Mode infini | ✅ Après une run gagnée, on peut continuer dans un **mode infini** où les ennemis se renforcent à chaque étape, pour voir jusqu'où on tient (section 2.2) |

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
| Événement (sans combat) | ✅ Une petite situation avec un choix (2026-11-28). La carte n'affiche que « ? » : l'événement se découvre en arrivant. Un choix, un compte rendu, puis on reprend la route ; un choix « partir » reprend tout de suite la route. Pas de combat. Un événement ne revient pas dans la run tant qu'il en reste d'autres à rencontrer. Les 10 événements sont dans prototype-content.md |
| Boutique | Disponible à chaque étape, y compris à la forge, chez le marchand et sur un événement |
| Fréquence | ⚠️ Par stage, environ 1 à 2 forges, 1 à 2 marchands, 2 à 3 quêtes urgentes et 1 à 2 événements (entre les étapes 2 et 8). L'étape 1 n'a que des chasses ; l'étape 9 (avant le boss) propose toujours une forge ou un marchand ; chaque étape garde au moins une chasse normale |

### 2.2 Mode infini

| Élément | Décision |
|---|---|
| Accès | ✅ Proposé à la fin d'une **run gagnée** (bouton « Continuer en mode infini »), à la place de « Nouvelle run » |
| Déroulement | ✅ Les **stages continuent** (stage 4, 5…) avec la même carte : chasses, quêtes urgentes, forges, marchands, et un boss toutes les 10 étapes. On commence par les récompenses du boss de l'étape 30 (doublées, +1 retire-objet) |
| Ennemis | ✅ Escouades générées comme au stage 3 (coût 4 et rang ★3 au plus, boss Dragon ancien ou, ✅ en mode infini seulement, parfois un Dragon noir), avec un budget qui continue de grandir. ✅ **+5 % de PV, d'attaque brute et de puissance élémentaire à chaque étape** après la 30e (+50 % à l'étape 40, +150 % à l'étape 60), valeur à ajuster en jouant. Une quête urgente est renforcée comme 3 étapes plus loin |
| Fin | ✅ Le **compteur de défaites de la run est conservé** : la 3e défaite (run et mode infini confondus) termine le mode infini |
| Économie | ✅ Tout continue comme pendant la run : revenus, intérêts, boutique, niveaux, récompenses 1 parmi 3 |
| Record | La **plus haute étape atteinte** est gardée dans le navigateur et affichée en fin de run |

### 2.3 Sauvegarde

| Élément | Décision |
|---|---|
| Quand | ✅ **Après chaque action** : la run est gardée dans le navigateur (une seule run sauvegardée) |
| Reprise | ✅ **Reprise exacte** : même carte, même boutique, même résultat de combat, hasard compris. Recharger la page ne relance pas la boutique et n'annule pas un combat perdu |
| Ouverture du jeu | ✅ **Écran de choix** : « Continuer la run » (stage, étape, défaites, zennys, niveau, unités) ou « Nouvelle run », qui remplace la sauvegarde |
| Fin de run | La sauvegarde d'une run perdue est effacée ; celle d'une run gagnée est gardée tant que le mode infini peut être lancé |

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
| Boss (chasses 10, 20, 30) | **Version boss** d'un grand monstre avec une escorte réduite (section 9) |
| Récompenses | **1 parmi 3**, capture toujours proposée (sections 10 et 11) |
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

- Chaque unité coûte de **1 à 5 zennys**, sauf les **Dragons noirs** (Fatalis, Alatreon, Dire Miralis) qui coûtent **6 zennys** : très difficiles à obtenir (boutique aux niveaux 9 et 10 seulement), mais très puissants. Leur jeton a un fond prismatique.
- ✅ **Coûts 5 et 6 : 9 exemplaires** de chaque unité (2026-11-25), juste assez pour un ★3 à condition de tous les obtenir.
- ✅ **Easter egg des Dragons noirs ★3** : au ★3, une **compétence secrète** remplace la leur (Fatalis « Fin des temps », Alatreon « Jugement absolu », Dire Miralis « Cataclysme »). Elle se charge normalement, puis frappe **tous les ennemis avec 5 fois les dégâts** de leur compétence ★3 : très forte, sans gagner à tous les coups. Elle reste cachée tant qu'on n'a pas l'unité ★3. Au lancement, un **bandeau** avec le portrait du monstre et le nom du sort traverse le plateau, avec le cri du monstre si son fichier son est fourni.
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
  - **Guilde** : chasseurs uniquement. ✅ Chaque objet porté par une unité Guilde renforce **toutes** les unités Guilde, même celles qui ne portent rien (+3 / 4 / 5 % de PV, attaque brute et puissance élémentaire par objet selon le palier, 9 objets comptés au plus).
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
- **Paliers** : **2 / 4 / 6** pour les traits d'au moins 6 unités (Feu, Foudre, Eau, Dragon, Sans élément, Guilde, Berserker, Bastion, Catalyseur, Wyverne volante) ; **2 / 4** pour Glace (5 unités, en attendant une 6e) ; **2 / 3** pour les petites familles (Léviathan, Wyverne brute) ; 1 / 2 / 3 pour Dragon ancien et 1 pour Dragon noir. Le premier palier garde son effet, celui du milieu reprend l'ancien palier 3, et le palier du haut vaut environ ×1,6 celui du milieu.
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
Les **36 objets sont définis** (validés le 2026-11-23, liste dans [prototype-content.md](prototype-content.md)) : des noms de talents de Monster Hunter et, pour la plupart, un effet propre (vol de vie, explosion, poison, paralysie, renvoi de dégâts…). Ils sont tous codés (3 lots).

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
| Niveau de boutique | De 1 à 10 (✅ niveau 10 ajouté le 2026-11-25) ; le niveau donne le nombre d'unités sur la grille |
| Apparition des unités chères | Par probabilités selon le niveau (comme TFT) |
| Dragons noirs (coût 6) | **1 seul sur le plateau** (on peut en garder d'autres en réserve). Seulement aux niveaux 9 et 10 de la boutique, 9 exemplaires de chacun : le ★3 est possible mais rarissime, et débloque leur compétence secrète |
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
- **Chasses de boss** : la **version boss** d'un grand monstre, plus puissante que sa version unité (✅ validée le 2026-11-27), pour tous les boss : monstres de coût 3 ★3 aux stages 1 et 2, Dragon ancien ★2 au stage 3, Dragon ancien ★2 ou parfois Dragon noir ★1 en mode infini.
  - ✅ **Bonus de statistiques** (PV, attaque brute, puissance élémentaire), ⚠️ réglé par simulation pour que chaque boss soit **un peu plus dur** que l'ancienne escouade renforcée (environ 10 points de victoire en moins) ; valeurs par stage dans prototype-content.md.
  - ✅ **Rage à mi-vie** : quand ses PV tombent à 50 %, le boss s'enrage, une fois par combat. Sa **compétence de boss**, propre à chaque monstre, remplace sa compétence normale jusqu'à la fin du combat, et son énergie se remplit pour qu'il la lance tout de suite. Un bandeau « … s'enrage ! » traverse le plateau, avec le cri du monstre s'il est fourni.
  - ✅ **Escorte réduite** : ⚠️ la moitié des places et du budget habituels.
  - Le jeton du boss porte un anneau et une couronne dorés, rouges une fois enragé ; sa fiche (clic droit) montre sa compétence de boss.
  - La capture du boss donne sa version unité (sans bonus ni compétence de boss).
- **Première version** : uniquement des monstres. Le budget sert à recruter des monstres (selon leur coût) puis à monter leur rang. Les boss étaient alors une **escouade renforcée** (un grand monstre entouré d'une escorte complète), remplacée par la version boss le 2026-11-27. Les monstres de coût 4 apparaissent dans les escouades des stages 2 et 3 ; les Dragons anciens ne sont que des boss. Les règles de calcul sont dans [prototype-content.md](prototype-content.md) ⚠️.
- L'escouade de la prochaine chasse est visible sur le plateau pendant la préparation.
- Boss sur plusieurs hexagones et parties cassables : reportés à plus tard.

---

## 10. Recrutement et capture

- **Boutique** : principale source d'unités.
- ✅ **Tous les monstres restent achetables en boutique** : aucun n'est réservé à la capture, pour ne pas limiter la diversité des équipes (2026-11-26).
- ✅ **Capture ciblée** : après chaque combat gagné, l'une des 3 récompenses est la capture. On choisit **un des monstres de l'escouade vaincue**, qui rejoint la réserve au ★1, quel que soit son rang dans l'escouade. Le plus fort est proposé en premier.
- ✅ **Stock commun** : les exemplaires capturés sont pris dans le stock, comme un achat. Un monstre dont le stock est vide, ou que le joueur possède déjà au ★3, n'est pas proposé.
- ✅ Comme pour une unité, il faut de la place en réserve (ou une fusion).
- ✅ **Boss des stages 1 et 2** : toujours capturables après leur victoire ; on obtient leur version unité, **2 exemplaires ★1** (récompenses doublées).
- **Dragons anciens et Dragons noirs** : jamais capturables ; on ne peut les obtenir qu'en boutique. Après le boss du stage 3, seule son escorte se capture.
- Si aucun monstre de l'escouade ne peut être capturé, la capture est remplacée par un autre choix tiré au hasard.

---

## 11. Récompenses

- **Après une victoire** : choix d'une récompense parmi 3. ✅ **La capture est toujours proposée** (section 10) ; les 2 autres choix sont tirés au hasard, de types différents, parmi : unité ★1 tirée comme en boutique, objet déjà fusionné, matériaux, retire-objet et zennys (⚠️ quantités et chances dans prototype-content.md).
- **Après un boss ou une quête urgente** : ✅ toutes les quantités sont doublées, capture comprise ; après un boss, 1 retire-objet garanti en plus.
- **Après une défaite** : aucune récompense (les zennys de base et les intérêts restent gagnés).
- Une unité ou une capture ne peuvent être choisies que s'il y a de la place en réserve (ou si elles déclenchent une fusion).

### 11.1 Talents de chasseur

L'équivalent des augments de TFT (validé le 2026-11-24).

| Élément | Décision |
|---|---|
| Moment | ✅ Au **début des stages 1, 2 et 3**, avant de choisir la première case : **3 talents au plus par run**. Pas de talent en mode infini |
| Rareté | ✅ Tirée à chaque choix : **argent, or ou prismatique, 1 chance sur 3 chacune**. Les 3 propositions ont la même rareté |
| Propositions | ✅ **3 propositions**, chacune **relançable une fois** (comme dans TFT) ; un talent déjà pris n'est plus proposé |
| Familles | ✅ Combat (bonus en combat), économie (zennys, intérêts, relances, niveau, places sur le plateau), objets, unités, traits |
| Traits | ✅ Les talents de trait (Insigne, Blason, Couronne) tirent un trait (sauf Dragon ancien et Dragon noir), visible sur la proposition. Les unités en plus ne comptent que si **au moins une unité du trait est sur le plateau**, et s'affichent dans la boîte des synergies |
| Unités | Les talents qui donnent une unité la tirent dans le stock commun (pas une unité déjà obtenue au ★3) et l'affichent sur la proposition ; il faut de la place en réserve pour les prendre |
| Contenu | ✅ 24 talents, 8 par rareté (liste dans prototype-content.md) ; ⚠️ valeurs provisoires |

---

## 12. Hors périmètre

### Reporté à plus tard (étape 5 ou après)
- Statuts comme traits principaux, et Sommeil. (Poison, Paralysie et Explosion existent déjà comme effets d'objets.)
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
2. ~~Monstres disponibles uniquement par capture ?~~ Tranché le 2026-11-26 : non, tous restent en boutique (section 10).
3. ~~Les Dragons anciens en boutique : quel coût ?~~ Tranché : coût 5.
4. ~~La capture du boss fait-elle toujours partie des choix après un boss ?~~ Tranché le 2026-11-26 : oui, aux stages 1 et 2 (section 10).
5. Formule des ratios de compétence : valeur de base + ratio × statistique, ou pourcentage d'amplification comme la puissance magique de TFT ?
6. ~~Contenu de la version boss d'un monstre.~~ Tranché le 2026-11-27 (section 9) : bonus de statistiques, rage à mi-vie avec une compétence de boss propre à chaque monstre, escorte réduite.
7. ~~Informations visibles sur chaque chasse proposée par la carte.~~ Tranché : monstre cible et type de récompense.
12. ~~Mode infini : renforcement, carte, récompenses, défaites, record.~~ Tranché le 2026-11-24 (section 2.2).
13. Écart de puissance entre les coûts : une unité de coût 2 ne bat une unité de coût 1 que dans 55 % des cas, et une de coût 3 une de coût 2 dans 55 % des cas aussi (mesure du 2026-11-24). Faut-il renforcer les coûts 2 et 3 (piste testée : PV et attaque +8 % et +12 %) ? Et un Dragon noir bat une unité de coût 5 dans 96 % des cas : est-ce voulu ?


### Confort de jeu
8. ~~Bouton d'accélération ×2 des combats ?~~ Déjà là : vitesses ×1, ×2 et ×4 en mode run (et ×0,5 dans le bac à sable).
9. ~~Sauvegarde en cours de run ?~~ Tranché le 2026-11-28 (section 2.3).

### Contenu
10. ~~Effets des 36 objets.~~ Tranché le 2026-11-23 (prototype-content.md).
11. Unités supplémentaires : arme de chasseur restante (Fusarbalète léger, pour Nadia de Wilds), autres monstres (dont des Wyvernes à crocs) et Dragons anciens.

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
- **2026-11-23** : les chasseurs prennent des noms officiels de la série, avec une arme qu'ils utilisent dans les jeux : Garrick → Fabius (Lance), Helga → Olivia (Marteau), Akira → Fiorayne (Grande épée), Lysa → Fugen (Doubles lames), Sylvain → Hinoa (Arc), Odette → Minoto (Corne de chasse), Kaede → Rondine (Épée longue), Dorian → Luchika (Fusarbalète lourd), Mira → Aiden (Épée et bouclier), Brann → Arlow (Lancecanon), Ondine → Galleus (Morpho-hache). Nadia (Wilds, Fusarbalète léger) est gardée pour le futur Fusarbalète léger. Les anciens noms restent dans les entrées précédentes de l'historique.
- **2026-11-23** : les 36 objets sont validés — les 8 existants sont gardés, 28 nouveaux s'y ajoutent, nommés d'après des talents de Monster Hunter, avec de nouvelles mécaniques (vol de vie, explosion, poison, paralysie, renvoi de dégâts, effets d'énergie…). Codage en 3 lots : effets au coup porté, effets quand l'unité est touchée, statuts et énergie.
- **2026-11-23** : les 36 objets sont codés (lots 1 à 3). Deux nouveaux statuts arrivent avec les objets : poison (dégâts par seconde, soins reçus −40 %) et paralysie (l'unité n'agit plus) ; Anti-fléaux en protège, comme de la brûlure et des ralentissements.
- **2026-11-24** : équilibrage des unités d'après une mesure sur environ 120 000 combats simulés — 7 unités trop fortes affaiblies (Dire Miralis, Tigrex, Rathalos, Barroth, Teostra, Namielle, Fabius), 9 trop faibles renforcées (Galleus, Safi'jiiva, Luchika, Alatreon, Fiorayne, Fugen, Olivia, Rondine, Fatalis) ; Safi'jiiva et Luchika visent désormais leur cible actuelle et non plus l'ennemi le plus éloigné (détail dans prototype-content.md). Nouvelle Guilde : chaque objet porté par une unité Guilde renforce toutes les unités Guilde (+3 / 4 / 5 % par objet, 9 objets au plus) au lieu du seul porteur (+6 / 12 / 20 %).
- **2026-11-24** : mode infini — proposé après une run gagnée ; les stages continuent avec la carte (boss toutes les 10 étapes), escouades du stage 3 et ennemis +5 % de PV, d'attaque brute et de puissance élémentaire à chaque étape après la 30e ; le compteur de défaites de la run est conservé ; économie et récompenses continuent ; record de la plus haute étape atteinte gardé dans le navigateur.
- **2026-11-24** : talents de chasseur (équivalent des augments de TFT) — un choix au début des stages 1, 2 et 3 (rien en mode infini), rareté argent, or ou prismatique à 1 chance sur 3, 3 propositions de la même rareté relançables une fois chacune ; 24 talents validés (combat, économie, objets, unités, traits), un talent pris n'est plus proposé ; les talents de trait ne comptent que si le trait a au moins une unité sur le plateau.
- **2026-11-25** : 9 exemplaires pour les unités de coût 5 et 6 (le ★3 devient possible) ; niveau 10 de la boutique (passage 9 → 10 à 64 zennys, chances 5 / 15 / 25 / 35 / 15 / 5 %, 10 unités sur le plateau) ; easter egg des Dragons noirs ★3 : compétence secrète (Fin des temps, Jugement absolu, Cataclysme) sur tout le plateau avec 5 fois les dégâts, cachée jusqu'au ★3, annoncée par un bandeau avec le portrait et le cri du monstre.
- **2026-11-25** : nouvelle chasseuse de coût 5, **Lea** (リア), Legendary Rasta de Monster Hunter Frontier : Grande épée, DPS Feu, Guilde et Berserker ; compétence « Rage de la chasseuse » (frappe chargée sur la cible et ses voisins, puis furie de 5 s : +40 % de vitesse d'attaque et 20 % de vol de vie). Feu passe à 6 unités et gagne un palier 6 (brûlure de 65 dégâts/s pendant 3 s).
- **2026-11-26** : récompenses complètes et capture — tous les monstres restent achetables en boutique ; après chaque victoire, la capture est toujours proposée (on choisit un monstre de l'escouade vaincue, qui rejoint la réserve au ★1, exemplaires pris dans le stock commun ; jamais de Dragon ancien ni de Dragon noir), avec 2 autres choix tirés au hasard parmi unité, objet fusionné, matériaux, retire-objet et zennys ; après un boss ou une quête urgente, tout est doublé, capture comprise (boss des stages 1 et 2 : 2 exemplaires ★1).
- **2026-11-27** : le boss du stage 3 est toujours un Dragon ancien ; le Dragon noir ne peut plus apparaître en boss qu'en mode infini (⚠️ 15 % de chances). Cadre de la version boss : bonus de statistiques et 2e compétence propre à chaque monstre, escorte réduite, pour tous les boss (monstres de coût 3, Dragons anciens, Dragons noirs) ; mécanique et contenu à valider.
- **2026-11-27** : version boss — à mi-vie, le boss s'enrage (une fois) : sa compétence de boss remplace la sienne et son énergie se remplit, avec un bandeau « … s'enrage ! ». 11 compétences de boss validées (Rathalos, Legiana, Nargacuga, Lagiacrus, Kirin, Namielle, Safi'jiiva, Teostra, Fatalis, Alatreon, Dire Miralis). Bonus de statistiques par stage réglés par simulation pour des boss un peu plus durs qu'avant ; escorte réduite à la moitié des places et du budget.
- **2026-11-28** : sauvegarde du mode run — après chaque action, une seule run, reprise exacte (hasard compris : recharger n'annule rien) ; à l'ouverture, un écran propose « Continuer la run » ou « Nouvelle run ». Les vitesses ×2 et ×4 des combats existaient déjà (question 8).
- **2026-11-28** : cases Événement — 1 à 2 par stage (étapes 2 à 8), affichées « ? » et découvertes en arrivant, sans combat, sans répétition dans une run tant qu'il en reste ; 10 événements validés : Boîte du Felyne, Œuf de wyverne, Chasseur blessé, Cantine du campement, Médecin de la Guilde, Commission de recherche, Monstre endormi, Caravane renversée, Pari des Felynes, Stèle ancienne (détail dans prototype-content.md).
