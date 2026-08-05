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

/**
 * Summarize the user's recorded spending and annualize it using the number of
 * distinct calendar months represented by the history. A single recorded
 * month is treated as one observation month so the prototype remains useful
 * with a small demo dataset.
 */
export function summarizeSpending(expenses) {
  const validExpenses = expenses.filter(
    (expense) => Number(expense.amount) > 0 && expense.category && expense.expenseDate,
  )

  const observedMonths = new Set(
    validExpenses.map((expense) => String(expense.expenseDate).slice(0, 7)),
  )
  const observationMonths = Math.max(1, observedMonths.size)

  const categoryTotals = validExpenses.reduce((totals, expense) => {
    const amount = Number(expense.amount) || 0
    totals[expense.category] = (totals[expense.category] || 0) + amount
    return totals
  }, {})

  const totalObservedSpend = Object.values(categoryTotals).reduce(
    (sum, amount) => sum + amount,
    0,
  )

  const annualizedByCategory = Object.fromEntries(
    Object.entries(categoryTotals).map(([category, total]) => [
      category,
      (Number(total) / observationMonths) * 12,
    ]),
  )

  return {
    transactionCount: validExpenses.length,
    observationMonths,
    categoryTotals,
    totalObservedSpend,
    averageMonthlySpend: totalObservedSpend / observationMonths,
    projectedAnnualSpend: (totalObservedSpend / observationMonths) * 12,
    annualizedByCategory,
  }
}

/**
 * Rank active card products the user does not already own. The estimate applies
 * each candidate card's category reward rule to annualized historical spending,
 * then subtracts its annual fee. Cards without any active reward rule are not
 * recommendation-ready and are excluded until an administrator adds a rule.
 */
export function rankNewCards({ cards, rewardRules, ownedCardIds, expenses }) {
  const spendingSummary = summarizeSpending(expenses)

  if (!spendingSummary.transactionCount) {
    return { spendingSummary, recommendations: [] }
  }

  const recommendations = cards
    .filter((card) => {
      const hasActiveRule = rewardRules.some(
        (rule) => rule.cardId === card.id && rule.active,
      )
      return card.active && !ownedCardIds.includes(card.id) && hasActiveRule
    })
    .map((card) => {
      const categoryBreakdown = Object.entries(spendingSummary.annualizedByCategory)
        .map(([category, annualSpend]) => {
          const rate = getRuleRate(rewardRules, card.id, category)
          const estimatedReward = (Number(annualSpend) * rate) / 100
          return {
            category,
            annualSpend: Number(annualSpend),
            rate,
            estimatedReward,
          }
        })
        .sort((a, b) => b.estimatedReward - a.estimatedReward)

      const estimatedAnnualReward = categoryBreakdown.reduce(
        (sum, item) => sum + item.estimatedReward,
        0,
      )
      const netAnnualBenefit = estimatedAnnualReward - Number(card.annualFee || 0)
      const effectiveRewardRate = spendingSummary.projectedAnnualSpend
        ? (estimatedAnnualReward / spendingSummary.projectedAnnualSpend) * 100
        : 0

      return {
        ...card,
        categoryBreakdown,
        estimatedAnnualReward,
        netAnnualBenefit,
        effectiveRewardRate,
        topCategory: categoryBreakdown[0] || null,
      }
    })
    .sort((a, b) => {
      if (b.netAnnualBenefit !== a.netAnnualBenefit) {
        return b.netAnnualBenefit - a.netAnnualBenefit
      }
      if (b.estimatedAnnualReward !== a.estimatedAnnualReward) {
        return b.estimatedAnnualReward - a.estimatedAnnualReward
      }
      return a.annualFee - b.annualFee
    })

  return { spendingSummary, recommendations }
}
