export function getRuleRate(rewardRules, cardId, category) {
  const exactRule = rewardRules.find(
    (rule) => rule.cardId === cardId && rule.category === category && rule.active,
  )
  if (exactRule) return Number(exactRule.rate)

  const fallbackRule = rewardRules.find(
    (rule) => rule.cardId === cardId && rule.category === 'Other' && rule.active,
  )
  return Number(fallbackRule?.rate || 0)
}

export function rankCards({ cards, rewardRules, ownedCardIds, category, amount }) {
  return cards
    .filter((card) => card.active && ownedCardIds.includes(card.id))
    .map((card) => {
      const rate = getRuleRate(rewardRules, card.id, category)
      return {
        ...card,
        rate,
        estimatedReward: (Number(amount) * rate) / 100,
      }
    })
    .sort((a, b) => {
      if (b.estimatedReward !== a.estimatedReward) {
        return b.estimatedReward - a.estimatedReward
      }
      return a.annualFee - b.annualFee
    })
}
