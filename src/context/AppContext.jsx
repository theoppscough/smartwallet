import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { cloneSeedDatabase } from '../data/seed'
import { generateId } from '../services/formatters'
import { rankCards } from '../services/recommendation'

const DB_KEY = 'smartwallet-demo-db-v1'
const SESSION_KEY = 'smartwallet-demo-session-v1'

const AppContext = createContext(null)

function loadDatabase() {
  try {
    const saved = localStorage.getItem(DB_KEY)
    return saved ? JSON.parse(saved) : cloneSeedDatabase()
  } catch {
    return cloneSeedDatabase()
  }
}

function loadSession() {
  try {
    return localStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

export function AppProvider({ children }) {
  const [database, setDatabase] = useState(loadDatabase)
  const [sessionUserId, setSessionUserId] = useState(loadSession)

  useEffect(() => {
    localStorage.setItem(DB_KEY, JSON.stringify(database))
  }, [database])

  useEffect(() => {
    if (sessionUserId) {
      localStorage.setItem(SESSION_KEY, sessionUserId)
    } else {
      localStorage.removeItem(SESSION_KEY)
    }
  }, [sessionUserId])

  const currentUser = useMemo(
    () => database.users.find((user) => user.id === sessionUserId) || null,
    [database.users, sessionUserId],
  )

  function login(email, password) {
    const normalizedEmail = email.trim().toLowerCase()
    const user = database.users.find(
      (item) =>
        item.email.toLowerCase() === normalizedEmail && item.password === password,
    )

    if (!user) {
      return { ok: false, message: 'Email or password is incorrect.' }
    }

    setSessionUserId(user.id)
    return { ok: true, user }
  }

  function register({ fullName, email, password, monthlyBudget }) {
    const normalizedEmail = email.trim().toLowerCase()
    const exists = database.users.some(
      (user) => user.email.toLowerCase() === normalizedEmail,
    )

    if (exists) {
      return { ok: false, message: 'An account with this email already exists.' }
    }

    const user = {
      id: generateId('user'),
      fullName: fullName.trim(),
      email: normalizedEmail,
      password,
      role: 'user',
      monthlyBudget: Number(monthlyBudget) || 0,
    }

    setDatabase((previous) => ({
      ...previous,
      users: [...previous.users, user],
    }))
    setSessionUserId(user.id)

    return { ok: true, user }
  }

  function logout() {
    setSessionUserId(null)
  }

  function resetDemo() {
    setDatabase(cloneSeedDatabase())
    setSessionUserId(null)
  }

  function updateProfile(changes) {
    if (!currentUser) return
    setDatabase((previous) => ({
      ...previous,
      users: previous.users.map((user) =>
        user.id === currentUser.id ? { ...user, ...changes } : user,
      ),
    }))
  }

  function addExpense(expense) {
    if (!currentUser) return
    setDatabase((previous) => ({
      ...previous,
      expenses: [
        ...previous.expenses,
        {
          ...expense,
          id: generateId('expense'),
          userId: currentUser.id,
          amount: Number(expense.amount),
        },
      ],
    }))
  }

  function updateExpense(expenseId, changes) {
    if (!currentUser) return
    setDatabase((previous) => ({
      ...previous,
      expenses: previous.expenses.map((expense) =>
        expense.id === expenseId && expense.userId === currentUser.id
          ? { ...expense, ...changes, amount: Number(changes.amount) }
          : expense,
      ),
    }))
  }

  function deleteExpense(expenseId) {
    if (!currentUser) return
    setDatabase((previous) => ({
      ...previous,
      expenses: previous.expenses.filter(
        (expense) =>
          !(expense.id === expenseId && expense.userId === currentUser.id),
      ),
    }))
  }

  function addUserCard(cardId, nickname = '') {
    if (!currentUser) return
    const exists = database.userCards.some(
      (item) => item.userId === currentUser.id && item.cardId === cardId,
    )
    if (exists) return

    setDatabase((previous) => ({
      ...previous,
      userCards: [
        ...previous.userCards,
        {
          id: generateId('user-card'),
          userId: currentUser.id,
          cardId,
          nickname,
        },
      ],
    }))
  }

  function removeUserCard(cardId) {
    if (!currentUser) return
    setDatabase((previous) => ({
      ...previous,
      userCards: previous.userCards.filter(
        (item) => !(item.userId === currentUser.id && item.cardId === cardId),
      ),
    }))
  }

  function addCard(card) {
    setDatabase((previous) => ({
      ...previous,
      cards: [
        ...previous.cards,
        {
          id: generateId('card'),
          issuer: card.issuer.trim(),
          name: card.name.trim(),
          annualFee: Number(card.annualFee) || 0,
          active: true,
        },
      ],
    }))
  }

  function updateCard(cardId, changes) {
    setDatabase((previous) => ({
      ...previous,
      cards: previous.cards.map((card) =>
        card.id === cardId
          ? {
              ...card,
              ...changes,
              annualFee: Number(changes.annualFee ?? card.annualFee),
            }
          : card,
      ),
    }))
  }

  function addRewardRule(rule) {
    setDatabase((previous) => ({
      ...previous,
      rewardRules: [
        ...previous.rewardRules,
        {
          id: generateId('rule'),
          cardId: rule.cardId,
          category: rule.category,
          rate: Number(rule.rate),
          active: true,
        },
      ],
    }))
  }

  function updateRewardRule(ruleId, changes) {
    setDatabase((previous) => ({
      ...previous,
      rewardRules: previous.rewardRules.map((rule) =>
        rule.id === ruleId
          ? { ...rule, ...changes, rate: Number(changes.rate ?? rule.rate) }
          : rule,
      ),
    }))
  }

  const userExpenses = useMemo(() => {
    if (!currentUser) return []
    return database.expenses
      .filter((expense) => expense.userId === currentUser.id)
      .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate))
  }, [currentUser, database.expenses])

  const ownedCards = useMemo(() => {
    if (!currentUser) return []
    const ownedIds = database.userCards
      .filter((item) => item.userId === currentUser.id)
      .map((item) => item.cardId)
    return database.cards.filter((card) => ownedIds.includes(card.id))
  }, [currentUser, database.cards, database.userCards])

  function getRecommendations(category, amount) {
    if (!currentUser) return []
    return rankCards({
      cards: database.cards,
      rewardRules: database.rewardRules,
      ownedCardIds: ownedCards.map((card) => card.id),
      category,
      amount,
    })
  }

  const value = {
    ...database,
    currentUser,
    userExpenses,
    ownedCards,
    login,
    register,
    logout,
    resetDemo,
    updateProfile,
    addExpense,
    updateExpense,
    deleteExpense,
    addUserCard,
    removeUserCard,
    addCard,
    updateCard,
    addRewardRule,
    updateRewardRule,
    getRecommendations,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used inside AppProvider.')
  }
  return context
}
