function recentDate(daysAgo) {
  const date = new Date()
  date.setDate(Math.max(1, date.getDate() - daysAgo))
  return date.toISOString().slice(0, 10)
}

export const CATEGORIES = [
  'Dining',
  'Grocery',
  'Gas',
  'Travel',
  'Online Shopping',
  'Entertainment',
  'Other',
]

export const seedDatabase = {
  users: [
    {
      id: 'user-1',
      fullName: 'Alex Morgan',
      email: 'user@smartwallet.demo',
      password: 'demo123',
      role: 'user',
      monthlyBudget: 2000,
    },
    {
      id: 'admin-1',
      fullName: 'SmartWallet Admin',
      email: 'admin@smartwallet.demo',
      password: 'admin123',
      role: 'admin',
      monthlyBudget: 0,
    },
  ],
  cards: [
    {
      id: 'card-1',
      issuer: 'American Express',
      name: 'Amex Gold',
      annualFee: 325,
      active: true,
    },
    {
      id: 'card-2',
      issuer: 'Chase',
      name: 'Freedom Flex',
      annualFee: 0,
      active: true,
    },
    {
      id: 'card-3',
      issuer: 'Citi',
      name: 'Double Cash',
      annualFee: 0,
      active: true,
    },
    {
      id: 'card-4',
      issuer: 'Capital One',
      name: 'Savor',
      annualFee: 0,
      active: true,
    },
  ],
  rewardRules: [
    { id: 'rule-1', cardId: 'card-1', category: 'Dining', rate: 4, active: true },
    { id: 'rule-2', cardId: 'card-1', category: 'Grocery', rate: 4, active: true },
    { id: 'rule-3', cardId: 'card-1', category: 'Other', rate: 1, active: true },
    { id: 'rule-4', cardId: 'card-2', category: 'Grocery', rate: 5, active: true },
    { id: 'rule-5', cardId: 'card-2', category: 'Gas', rate: 3, active: true },
    { id: 'rule-6', cardId: 'card-2', category: 'Other', rate: 1, active: true },
    { id: 'rule-7', cardId: 'card-3', category: 'Other', rate: 2, active: true },
    { id: 'rule-8', cardId: 'card-4', category: 'Dining', rate: 3, active: true },
    { id: 'rule-9', cardId: 'card-4', category: 'Entertainment', rate: 3, active: true },
    { id: 'rule-10', cardId: 'card-4', category: 'Other', rate: 1, active: true },
  ],
  userCards: [
    { id: 'uc-1', userId: 'user-1', cardId: 'card-1', nickname: 'Food card' },
    { id: 'uc-2', userId: 'user-1', cardId: 'card-2', nickname: 'Rotating rewards' },
    { id: 'uc-3', userId: 'user-1', cardId: 'card-3', nickname: 'Everyday card' },
  ],
  expenses: [
    {
      id: 'expense-1',
      userId: 'user-1',
      amount: 84.5,
      merchant: 'Whole Foods',
      category: 'Grocery',
      expenseDate: recentDate(4),
      cardId: 'card-2',
      notes: 'Weekly groceries',
    },
    {
      id: 'expense-2',
      userId: 'user-1',
      amount: 46.2,
      merchant: 'Bistro 42',
      category: 'Dining',
      expenseDate: recentDate(3),
      cardId: 'card-1',
      notes: 'Dinner',
    },
    {
      id: 'expense-3',
      userId: 'user-1',
      amount: 61.75,
      merchant: 'Shell',
      category: 'Gas',
      expenseDate: recentDate(2),
      cardId: 'card-2',
      notes: '',
    },
    {
      id: 'expense-4',
      userId: 'user-1',
      amount: 129.99,
      merchant: 'Amazon',
      category: 'Online Shopping',
      expenseDate: recentDate(1),
      cardId: 'card-3',
      notes: 'Desk accessories',
    },
  ],
}

export function cloneSeedDatabase() {
  return JSON.parse(JSON.stringify(seedDatabase))
}
