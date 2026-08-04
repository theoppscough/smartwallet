import { Link } from 'react-router'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import { useApp } from '../context/AppContext'
import { CATEGORIES } from '../data/seed'
import { currentMonthKey, formatCurrency, formatDate } from '../services/formatters'
import { getRuleRate } from '../services/recommendation'

export default function DashboardPage() {
  const {
    currentUser,
    userExpenses,
    cards,
    rewardRules,
  } = useApp()

  const monthKey = currentMonthKey()
  const monthExpenses = userExpenses.filter((expense) =>
    expense.expenseDate.startsWith(monthKey),
  )
  const totalSpent = monthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
  const remaining = Math.max(Number(currentUser.monthlyBudget) - totalSpent, 0)
  const budgetPercent =
    currentUser.monthlyBudget > 0
      ? Math.min((totalSpent / currentUser.monthlyBudget) * 100, 100)
      : 0

  const categoryTotals = CATEGORIES.map((category) => ({
    category,
    total: monthExpenses
      .filter((expense) => expense.category === category)
      .reduce((sum, expense) => sum + Number(expense.amount), 0),
  }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total)

  const maxCategoryTotal = Math.max(...categoryTotals.map((item) => item.total), 1)

  const totalRewards = monthExpenses.reduce((sum, expense) => {
    const rate = getRuleRate(rewardRules, expense.cardId, expense.category)
    return sum + (Number(expense.amount) * rate) / 100
  }, 0)

  const topCategory = categoryTotals[0]

  return (
    <>
      <PageHeader
        eyebrow="User dashboard"
        title={`Good afternoon, ${currentUser.fullName.split(' ')[0]}.`}
        description="Here is your monthly spending and reward performance."
        action={
          <Link className="primary-button" to="/expenses">
            + Add expense
          </Link>
        }
      />

      <section className="stats-grid">
        <StatCard
          label="Spent this month"
          value={formatCurrency(totalSpent)}
          detail={`${budgetPercent.toFixed(0)}% of monthly budget`}
        />
        <StatCard
          label="Budget remaining"
          value={formatCurrency(remaining)}
          detail={`Budget: ${formatCurrency(currentUser.monthlyBudget)}`}
          tone={remaining === 0 ? 'warning' : 'success'}
        />
        <StatCard
          label="Estimated rewards"
          value={formatCurrency(totalRewards)}
          detail="Based on stored reward rules"
          tone="accent"
        />
        <StatCard
          label="Top category"
          value={topCategory?.category || 'No spending'}
          detail={topCategory ? formatCurrency(topCategory.total) : 'Add an expense to begin'}
        />
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Budget progress</p>
              <h2>Monthly overview</h2>
            </div>
            <strong>{budgetPercent.toFixed(0)}%</strong>
          </div>
          <div className="progress-track" aria-label={`${budgetPercent}% of budget used`}>
            <span style={{ width: `${budgetPercent}%` }} />
          </div>
          <div className="budget-labels">
            <span>{formatCurrency(totalSpent)} spent</span>
            <span>{formatCurrency(currentUser.monthlyBudget)} budget</span>
          </div>

          <div className="category-chart">
            {categoryTotals.length === 0 ? (
              <p className="empty-state">No expenses recorded this month.</p>
            ) : (
              categoryTotals.map((item) => (
                <div className="bar-row" key={item.category}>
                  <span>{item.category}</span>
                  <div className="bar-track">
                    <span style={{ width: `${(item.total / maxCategoryTotal) * 100}%` }} />
                  </div>
                  <strong>{formatCurrency(item.total)}</strong>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Latest activity</p>
              <h2>Recent expenses</h2>
            </div>
            <Link to="/expenses">View all</Link>
          </div>

          <div className="transaction-list">
            {userExpenses.slice(0, 5).map((expense) => {
              const card = cards.find((item) => item.id === expense.cardId)
              return (
                <div className="transaction-item" key={expense.id}>
                  <span className="transaction-icon">
                    {expense.merchant.charAt(0).toUpperCase()}
                  </span>
                  <span className="transaction-info">
                    <strong>{expense.merchant}</strong>
                    <small>
                      {expense.category} · {card?.name || 'No card'} ·{' '}
                      {formatDate(expense.expenseDate)}
                    </small>
                  </span>
                  <strong>{formatCurrency(expense.amount)}</strong>
                </div>
              )
            })}
          </div>
        </article>
      </section>
    </>
  )
}
