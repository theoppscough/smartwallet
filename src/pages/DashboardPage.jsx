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
    ownedCards,
    allRewardRules,
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
    const rate = getRuleRate(allRewardRules, expense.cardId, expense.category)
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
