/**
 * Constantes de règles.
 * ✅ = décidé dans docs/game-design.md · ⚠️ = valeur provisoire, à valider ou à équilibrer.
 */
export const BALANCE = {
  /** ✅ Durée normale d'un combat, en secondes, avant la mort subite. */
  combatDuration: 60,
  /** ✅ Multiplicateur des coups critiques. */
  critMultiplier: 1.5,
  /** ✅ PV et attaque brute multipliés à chaque rang ★ (×1,8 au ★2, ×3,24 au ★3). */
  rankStatMultiplier: 1.8,
  /** ⚠️ Mort subite : dégâts +20 % par seconde écoulée après la durée normale. */
  suddenDeathDamageRampPerSecond: 0.2,
  /** ⚠️ Mort subite : soins −5 % par seconde écoulée après la durée normale (minimum 0). */
  suddenDeathHealingDecayPerSecond: 0.05,
  /** ⚠️ Vitesse de déplacement, identique pour toutes les unités, en hexagones par seconde. */
  moveSpeed: 2,
  /** ⚠️ Réduction de dégâts maximale, toutes sources confondues. */
  maxDamageReduction: 0.75,
  /** ⚠️ Un ralentissement ne peut pas descendre sous 25 % de la vitesse d'attaque. */
  minAttackSpeedMultiplier: 0.25,
  /** ✅ Rage draconique : bonus de dégâts sous 50 % des PV. */
  rageHpThreshold: 0.5,
} as const;
