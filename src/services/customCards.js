import { supabase } from '../lib/supabase'

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Check the VITE_SUPABASE_* environment variables.')
  }
  return supabase
}

export function normalizeCustomCard(row) {
  return {
    id: row.id,
    userId: row.user_id,
    issuer: row.issuer,
    name: row.card_name,
    annualFee: Number(row.annual_fee || 0),
    active: row.active,
    isCustom: true,
    source: 'custom',
    createdAt: row.created_at,
  }
}

export function normalizeCustomRewardRule(row) {
  return {
    id: row.id,
    cardId: row.custom_card_id,
    category: row.category,
    rate: Number(row.reward_rate || 0),
    active: row.active,
    isCustom: true,
    source: 'custom',
  }
}

export async function fetchCustomCards() {
  const client = requireSupabase()
  const [{ data: cards, error: cardsError }, { data: rules, error: rulesError }] =
    await Promise.all([
      client
        .from('user_custom_cards')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: true }),
      client
        .from('user_custom_reward_rules')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: true }),
    ])

  if (cardsError) throw cardsError
  if (rulesError) throw rulesError

  return {
    cards: (cards || []).map(normalizeCustomCard),
    rewardRules: (rules || []).map(normalizeCustomRewardRule),
  }
}

export async function createCustomCard({ issuer, cardName, annualFee, rewardRates }) {
  const client = requireSupabase()
  const normalizedRules = Object.fromEntries(
    Object.entries(rewardRates).map(([category, rate]) => [
      category,
      Number(rate) || 0,
    ]),
  )

  const { data, error } = await client.rpc('create_user_custom_card', {
    p_issuer: issuer.trim(),
    p_card_name: cardName.trim(),
    p_annual_fee: Number(annualFee) || 0,
    p_rules: normalizedRules,
  })

  if (error) throw error
  return data
}

export async function deleteCustomCard(customCardId) {
  const client = requireSupabase()
  const { error } = await client
    .from('user_custom_cards')
    .delete()
    .eq('id', customCardId)

  if (error) throw error
}
