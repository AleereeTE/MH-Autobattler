/**
 * Version boss d'un monstre (game-design §9) : un bonus de statistiques (`BossRule.bonus`, par stage),
 * une compétence de boss (`UnitDefinition.bossSkill`) qui remplace la sienne quand il s'enrage, et une escorte réduite.
 * ✅ Cadre validé le 2026-11-27 · ⚠️ valeurs provisoires.
 */
export const BOSS_VERSION = {
  /** ✅ Le boss s'enrage quand ses PV tombent à cette part de ses PV max (mi-vie) : son énergie se remplit. */
  enrageHpShare: 0.5,
  /** ⚠️ Part des places d'escorte habituelles (arrondie au-dessous). */
  escortShare: 0.5,
  /** ⚠️ Part du budget habituel de la chasse donnée à l'escorte. */
  escortBudgetShare: 0.5,
} as const;
