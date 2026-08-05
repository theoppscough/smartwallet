import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import {
  createCustomCard as createCustomCardRecord,
  deleteCustomCard as deleteCustomCardRecord,
  fetchCustomCards,
} from '../services/customCards'
import { rankCards, rankNewCards } from '../services/recommendation'

const AppContext = createContext(null)

const emptyDatabase = {
  users: [],
  cards: [],
  rewardRules: [],
  userCards: [],
  expenses: [],
  customCards: [],
  customRewardRules: [],
  ads: [],
}

function normalizeProfile(row, authUser) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: authUser?.email || '',
    role: row.role,
    monthlyBudget: Number(row.monthly_budget || 0),
  }
}

function normalizeCard(row) {
  return {
    id: row.id,
    issuer: row.issuer,
    name: row.card_name,
    annualFee: Number(row.annual_fee || 0),
    active: row.active,
    source: 'catalog',
    isCustom: false,
  }
}

function normalizeRewardRule(row) {
  return {
    id: row.id,
    cardId: row.card_id,
    category: row.category,
    rate: Number(row.reward_rate || 0),
    active: row.active,
    startDate: row.start_date,
    endDate: row.end_date,
    source: 'catalog',
    isCustom: false,
  }
}

function normalizeUserCard(row) {
  return {
    id: row.id,
    userId: row.user_id,
    cardId: row.card_id,
    nickname: row.nickname || '',
  }
}

function normalizeExpense(row) {
  const custom = Boolean(row.custom_card_id)
  return {
    id: row.id,
    userId: row.user_id,
    amount: Number(row.amount),
    merchant: row.merchant,
    category: row.category,
    expenseDate: row.expense_date,
    cardId: custom ? row.custom_card_id : row.card_id,
    cardSource: custom ? 'custom' : 'catalog',
    notes: row.notes || '',
    createdAt: row.created_at,
  }
}

function normalizeError(error, fallback) {
  if (!error) return fallback
  if (error.code === '23505') return 'That record already exists.'
  return error.message || fallback
}

export function AppProvider({ children }) {
  const [database, setDatabase] = useState(emptyDatabase)
  const [currentUser, setCurrentUser] = useState(null)
  const [initializing, setInitializing] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [lastError, setLastError] = useState('')

  const loadData = useCallback(async (authUser) => {
    if (!supabase || !authUser) {
      setCurrentUser(null)
      setDatabase(emptyDatabase)
      return null
    }

    setDataLoading(true)
    setLastError('')

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profileError) throw profileError

      const [
        cardsResult,
        rulesResult,
        walletResult,
        expensesResult,
        adsResult,
        customResult,
        profilesResult,
      ] = await Promise.all([
        supabase.from('cards').select('*').order('created_at', { ascending: true }),
        supabase.from('reward_rules').select('*').order('created_at', { ascending: true }),
        supabase.from('user_cards').select('*').order('created_at', { ascending: true }),
        supabase
          .from('expenses')
          .select('*')
          .order('expense_date', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase.from('ads').select('*').order('created_at', { ascending: true }),
        profile.role === 'user'
          ? fetchCustomCards()
          : Promise.resolve({ cards: [], rewardRules: [] }),
        supabase.from('profiles').select('*').order('created_at', { ascending: true }),
      ])

      const firstError = [
        cardsResult.error,
        rulesResult.error,
        walletResult.error,
        expensesResult.error,
        adsResult.error,
        profilesResult.error,
      ].find(Boolean)
      if (firstError) throw firstError

      const appUser = normalizeProfile(profile, authUser)
      setCurrentUser(appUser)
      setDatabase({
        users: (profilesResult.data || []).map((item) => ({
          id: item.id,
          fullName: item.full_name,
          role: item.role,
          monthlyBudget: Number(item.monthly_budget || 0),
        })),
        cards: (cardsResult.data || []).map(normalizeCard),
        rewardRules: (rulesResult.data || []).map(normalizeRewardRule),
        userCards: (walletResult.data || []).map(normalizeUserCard),
        expenses: (expensesResult.data || []).map(normalizeExpense),
        ads: adsResult.data || [],
        customCards: customResult.cards,
        customRewardRules: customResult.rewardRules,
      })
      return appUser
    } catch (error) {
      setLastError(normalizeError(error, 'Unable to load SmartWallet data.'))
      throw error
    } finally {
      setDataLoading(false)
    }
  }, [])

  const refreshData = useCallback(async () => {
    if (!supabase) return null
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    if (!data.user) return null
    return loadData(data.user)
  }, [loadData])

  useEffect(() => {
    let mounted = true

    async function initialize() {
      if (!isSupabaseConfigured || !supabase) {
        if (mounted) {
          setLastError(
            'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.',
          )
          setInitializing(false)
        }
        return
      }

      const { data, error } = await supabase.auth.getSession()
      if (!mounted) return

      if (error) {
        setLastError(error.message)
      } else if (data.session?.user) {
        try {
          await loadData(data.session.user)
        } catch {
          // loadData already stores a user-facing message.
        }
      }
      if (mounted) setInitializing(false)
    }

    initialize()

    const { data: listener } = supabase?.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      if (!session?.user) {
        setCurrentUser(null)
        setDatabase(emptyDatabase)
        return
      }
      window.setTimeout(() => {
        loadData(session.user).catch(() => {})
      }, 0)
    }) || { data: null }

    return () => {
      mounted = false
      listener?.subscription?.unsubscribe()
    }
  }, [loadData])

  const userExpenses = useMemo(() => {
    if (!currentUser) return []
    return database.expenses
      .filter(
        (expense) =>
          currentUser.role === 'admin' || expense.userId === currentUser.id,
      )
      .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate))
  }, [currentUser, database.expenses])

  const ownedCatalogCards = useMemo(() => {
    if (!currentUser) return []
    const ownedIds = database.userCards
      .filter((item) => item.userId === currentUser.id)
      .map((item) => item.cardId)
    return database.cards.filter((card) => ownedIds.includes(card.id))
  }, [currentUser, database.cards, database.userCards])

  const ownedCards = useMemo(
    () => [...ownedCatalogCards, ...database.customCards],
    [ownedCatalogCards, database.customCards],
  )

  const allRewardRules = useMemo(
    () => [...database.rewardRules, ...database.customRewardRules],
    [database.rewardRules, database.customRewardRules],
  )

  async function login(email, password) {
    if (!supabase) {
      return { ok: false, message: 'Supabase is not configured.' }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) return { ok: false, message: error.message }

    try {
      const user = await loadData(data.user)
      return { ok: true, user }
    } catch (loadError) {
      return {
        ok: false,
        message: normalizeError(loadError, 'Signed in, but data could not be loaded.'),
      }
    }
  }

  async function register({ fullName, email, password, monthlyBudget }) {
    if (!supabase) {
      return { ok: false, message: 'Supabase is not configured.' }
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          monthly_budget: Number(monthlyBudget) || 0,
        },
      },
    })

    if (error) return { ok: false, message: error.message }

    if (!data.session) {
      return {
        ok: true,
        user: null,
        requiresEmailConfirmation: true,
        message: 'Account created. Check your email to confirm the account, then sign in.',
      }
    }

    try {
      const user = await loadData(data.user)
      return { ok: true, user, requiresEmailConfirmation: false }
    } catch (loadError) {
      return {
        ok: false,
        message: normalizeError(loadError, 'Account created, but profile data could not be loaded.'),
      }
    }
  }

  async function logout() {
    if (!supabase) return
    await supabase.auth.signOut()
    setCurrentUser(null)
    setDatabase(emptyDatabase)
  }

  async function resetDemo() {
    await refreshData()
    return {
      ok: true,
      message: 'Database-backed mode refreshed. Shared Supabase data was not deleted.',
    }
  }

  async function updateProfile(changes) {
    if (!currentUser || !supabase) return { ok: false, message: 'Sign in first.' }
    const update = {}
    if (changes.fullName !== undefined) update.full_name = changes.fullName.trim()
    if (changes.monthlyBudget !== undefined) {
      update.monthly_budget = Math.max(Number(changes.monthlyBudget) || 0, 0)
    }

    const { error } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', currentUser.id)

    if (error) return { ok: false, message: error.message }
    await refreshData()
    return { ok: true }
  }

  async function addExpense(expense) {
    if (!currentUser || !supabase) return { ok: false, message: 'Sign in first.' }
    const selectedCard = ownedCards.find((card) => card.id === expense.cardId)
    if (!selectedCard) return { ok: false, message: 'Select a card in your wallet.' }

    const payload = {
      user_id: currentUser.id,
      amount: Number(expense.amount),
      merchant: expense.merchant.trim(),
      category: expense.category,
      expense_date: expense.expenseDate,
      card_id: selectedCard.isCustom ? null : selectedCard.id,
      custom_card_id: selectedCard.isCustom ? selectedCard.id : null,
      notes: expense.notes?.trim() || null,
    }

    const { error } = await supabase.from('expenses').insert(payload)
    if (error) return { ok: false, message: error.message }
    await refreshData()
    return { ok: true }
  }

  async function updateExpense(expenseId, changes) {
    if (!currentUser || !supabase) return { ok: false, message: 'Sign in first.' }
    const selectedCard = ownedCards.find((card) => card.id === changes.cardId)
    if (!selectedCard) return { ok: false, message: 'Select a card in your wallet.' }

    const { error } = await supabase
      .from('expenses')
      .update({
        amount: Number(changes.amount),
        merchant: changes.merchant.trim(),
        category: changes.category,
        expense_date: changes.expenseDate,
        card_id: selectedCard.isCustom ? null : selectedCard.id,
        custom_card_id: selectedCard.isCustom ? selectedCard.id : null,
        notes: changes.notes?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', expenseId)
      .eq('user_id', currentUser.id)

    if (error) return { ok: false, message: error.message }
    await refreshData()
    return { ok: true }
  }

  async function deleteExpense(expenseId) {
    if (!currentUser || !supabase) return { ok: false, message: 'Sign in first.' }
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)
      .eq('user_id', currentUser.id)

    if (error) return { ok: false, message: error.message }
    await refreshData()
    return { ok: true }
  }

  async function addUserCard(cardId, nickname = '') {
    if (!currentUser || !supabase) return { ok: false, message: 'Sign in first.' }
    const { error } = await supabase.from('user_cards').insert({
      user_id: currentUser.id,
      card_id: cardId,
      nickname: nickname.trim() || null,
    })

    if (error) return { ok: false, message: normalizeError(error, 'Unable to add card.') }
    await refreshData()
    return { ok: true }
  }

  async function removeUserCard(cardId) {
    if (!currentUser || !supabase) return { ok: false, message: 'Sign in first.' }
    const { error } = await supabase
      .from('user_cards')
      .delete()
      .eq('user_id', currentUser.id)
      .eq('card_id', cardId)

    if (error) return { ok: false, message: error.message }
    await refreshData()
    return { ok: true }
  }

  async function createCustomCard(card) {
    try {
      await createCustomCardRecord(card)
      await refreshData()
      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        message: normalizeError(error, 'Unable to create your card.'),
      }
    }
  }

  async function deleteCustomCard(cardId) {
    try {
      await deleteCustomCardRecord(cardId)
      await refreshData()
      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        message: normalizeError(error, 'Unable to delete your card.'),
      }
    }
  }

  async function addCard(card) {
    if (!supabase) return { ok: false, message: 'Supabase is not configured.' }
    const { error } = await supabase.from('cards').insert({
      issuer: card.issuer.trim(),
      card_name: card.name.trim(),
      annual_fee: Number(card.annualFee) || 0,
      active: true,
    })
    if (error) return { ok: false, message: normalizeError(error, 'Unable to add card.') }
    await refreshData()
    return { ok: true }
  }

  async function updateCard(cardId, changes) {
    if (!supabase) return { ok: false, message: 'Supabase is not configured.' }
    const payload = {}
    if (changes.issuer !== undefined) payload.issuer = changes.issuer.trim()
    if (changes.name !== undefined) payload.card_name = changes.name.trim()
    if (changes.annualFee !== undefined) payload.annual_fee = Number(changes.annualFee) || 0
    if (changes.active !== undefined) payload.active = Boolean(changes.active)

    const { error } = await supabase.from('cards').update(payload).eq('id', cardId)
    if (error) return { ok: false, message: error.message }
    await refreshData()
    return { ok: true }
  }

  async function addRewardRule(rule) {
    if (!supabase) return { ok: false, message: 'Supabase is not configured.' }
    const { error } = await supabase.from('reward_rules').insert({
      card_id: rule.cardId,
      category: rule.category,
      reward_rate: Number(rule.rate),
      active: true,
    })
    if (error) return { ok: false, message: error.message }
    await refreshData()
    return { ok: true }
  }

  async function updateRewardRule(ruleId, changes) {
    if (!supabase) return { ok: false, message: 'Supabase is not configured.' }
    const payload = {}
    if (changes.category !== undefined) payload.category = changes.category
    if (changes.rate !== undefined) payload.reward_rate = Number(changes.rate)
    if (changes.active !== undefined) payload.active = Boolean(changes.active)

    const { error } = await supabase
      .from('reward_rules')
      .update(payload)
      .eq('id', ruleId)
    if (error) return { ok: false, message: error.message }
    await refreshData()
    return { ok: true }
  }

  function getRecommendations(category, amount) {
    if (!currentUser) return []
    return rankCards({
      cards: ownedCards,
      rewardRules: allRewardRules,
      ownedCardIds: ownedCards.map((card) => card.id),
      category,
      amount,
    })
  }

  function getNewCardRecommendations() {
    if (!currentUser) {
      return { spendingSummary: null, recommendations: [] }
    }

    return rankNewCards({
      cards: database.cards,
      rewardRules: database.rewardRules,
      ownedCardIds: ownedCatalogCards.map((card) => card.id),
      expenses: userExpenses,
    })
  }

  const value = {
    ...database,
    currentUser,
    initializing,
    dataLoading,
    lastError,
    userExpenses,
    ownedCards,
    ownedCatalogCards,
    allRewardRules,
    login,
    register,
    logout,
    resetDemo,
    refreshData,
    updateProfile,
    addExpense,
    updateExpense,
    deleteExpense,
    addUserCard,
    removeUserCard,
    createCustomCard,
    deleteCustomCard,
    addCard,
    updateCard,
    addRewardRule,
    updateRewardRule,
    getRecommendations,
    getNewCardRecommendations,
  }

  if (initializing) {
    return (
      <div className="app-loading-screen">
        <div className="auth-brand">
          <span className="brand-mark">$</span>
          <strong>SmartWallet</strong>
        </div>
        <p>Connecting to the database…</p>
      </div>
    )
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
