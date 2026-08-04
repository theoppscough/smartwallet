import { useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import { useApp } from '../context/AppContext'
import { CATEGORIES } from '../data/seed'
import { formatCurrency } from '../services/formatters'

const emptyCard = { issuer: '', name: '', annualFee: 0 }
const emptyRule = { cardId: '', category: 'Dining', rate: 1 }

export default function AdminPage() {
  const {
    users,
    cards,
    rewardRules,
    expenses,
    addCard,
    updateCard,
    addRewardRule,
    updateRewardRule,
  } = useApp()

  const [tab, setTab] = useState('reports')
  const [cardForm, setCardForm] = useState(emptyCard)
  const [ruleForm, setRuleForm] = useState(emptyRule)

  const report = useMemo(() => {
    const categoryTotals = CATEGORIES.map((category) => ({
      category,
      total: expenses
        .filter((expense) => expense.category === category)
        .reduce((sum, expense) => sum + Number(expense.amount), 0),
      count: expenses.filter((expense) => expense.category === category).length,
    })).filter((item) => item.count > 0)

    const cardTotals = cards
      .map((card) => ({
        card,
        total: expenses
          .filter((expense) => expense.cardId === card.id)
          .reduce((sum, expense) => sum + Number(expense.amount), 0),
        count: expenses.filter((expense) => expense.cardId === card.id).length,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.total - a.total)

    return {
      categoryTotals,
      cardTotals,
      totalSpend: expenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
      transactionCount: expenses.length,
      userCount: users.filter((user) => user.role === 'user').length,
    }
  }, [cards, expenses, users])

  function submitCard(event) {
    event.preventDefault()
    addCard(cardForm)
    setCardForm(emptyCard)
  }

  function submitRule(event) {
    event.preventDefault()
    if (!ruleForm.cardId) return
    addRewardRule(ruleForm)
    setRuleForm({ ...emptyRule, cardId: ruleForm.cardId })
  }

  return (
    <>
      <PageHeader
        eyebrow="Management portal"
        title="SmartWallet Admin Center"
        description="Manage the product catalog, update reward rules, and query aggregate reports."
      />

      <div className="tab-list" role="tablist">
        {[
          ['reports', 'Reports'],
          ['cards', 'Card catalog'],
          ['rewards', 'Reward rules'],
        ].map(([value, label]) => (
          <button
            key={value}
            className={tab === value ? 'active' : ''}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'reports' && (
        <>
          <section className="stats-grid three">
            <StatCard label="Prototype users" value={report.userCount} detail="Registered end users" />
            <StatCard
              label="Recorded transactions"
              value={report.transactionCount}
              detail="Across all users"
              tone="accent"
            />
            <StatCard
              label="Aggregate spending"
              value={formatCurrency(report.totalSpend)}
              detail="Prototype dataset"
              tone="success"
            />
          </section>

          <section className="dashboard-grid">
            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Query result</p>
                  <h2>Spending by category</h2>
                </div>
              </div>
              <div className="responsive-table">
                <table>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Transactions</th>
                      <th className="numeric">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.categoryTotals.map((item) => (
                      <tr key={item.category}>
                        <td><strong>{item.category}</strong></td>
                        <td>{item.count}</td>
                        <td className="numeric">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Query result</p>
                  <h2>Card usage report</h2>
                </div>
              </div>
              <div className="responsive-table">
                <table>
                  <thead>
                    <tr>
                      <th>Card</th>
                      <th>Uses</th>
                      <th className="numeric">Spend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.cardTotals.map((item) => (
                      <tr key={item.card.id}>
                        <td>
                          <strong>{item.card.name}</strong>
                          <small className="table-note">{item.card.issuer}</small>
                        </td>
                        <td>{item.count}</td>
                        <td className="numeric">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        </>
      )}

      {tab === 'cards' && (
        <section className="split-layout">
          <article className="panel sticky-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Administrator input</p>
                <h2>Add a card product</h2>
              </div>
            </div>
            <form className="stacked-form" onSubmit={submitCard}>
              <label>
                Issuer
                <input
                  required
                  value={cardForm.issuer}
                  onChange={(event) => setCardForm({ ...cardForm, issuer: event.target.value })}
                  placeholder="Bank or issuer"
                />
              </label>
              <label>
                Card name
                <input
                  required
                  value={cardForm.name}
                  onChange={(event) => setCardForm({ ...cardForm, name: event.target.value })}
                  placeholder="Product name"
                />
              </label>
              <label>
                Annual fee
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={cardForm.annualFee}
                  onChange={(event) =>
                    setCardForm({ ...cardForm, annualFee: event.target.value })
                  }
                />
              </label>
              <button className="primary-button" type="submit">Add card</button>
            </form>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Database records</p>
                <h2>Card catalog</h2>
              </div>
            </div>
            <div className="admin-card-list">
              {cards.map((card) => (
                <div className="admin-card-row" key={card.id}>
                  <div>
                    <strong>{card.name}</strong>
                    <small>{card.issuer} · {formatCurrency(card.annualFee)} annual fee</small>
                  </div>
                  <label className="switch-label">
                    <input
                      type="checkbox"
                      checked={card.active}
                      onChange={(event) =>
                        updateCard(card.id, { active: event.target.checked })
                      }
                    />
                    {card.active ? 'Active' : 'Inactive'}
                  </label>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}

      {tab === 'rewards' && (
        <section className="split-layout">
          <article className="panel sticky-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Administrator input</p>
                <h2>Add reward rule</h2>
              </div>
            </div>
            <form className="stacked-form" onSubmit={submitRule}>
              <label>
                Card
                <select
                  required
                  value={ruleForm.cardId}
                  onChange={(event) => setRuleForm({ ...ruleForm, cardId: event.target.value })}
                >
                  <option value="">Choose card</option>
                  {cards.map((card) => (
                    <option value={card.id} key={card.id}>{card.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Category
                <select
                  value={ruleForm.category}
                  onChange={(event) =>
                    setRuleForm({ ...ruleForm, category: event.target.value })
                  }
                >
                  {CATEGORIES.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label>
                Reward rate (%)
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.1"
                  required
                  value={ruleForm.rate}
                  onChange={(event) => setRuleForm({ ...ruleForm, rate: event.target.value })}
                />
              </label>
              <button className="primary-button" type="submit">Add rule</button>
            </form>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Editable database records</p>
                <h2>Reward rules</h2>
              </div>
            </div>
            <div className="responsive-table">
              <table>
                <thead>
                  <tr>
                    <th>Card</th>
                    <th>Category</th>
                    <th>Rate</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rewardRules.map((rule) => {
                    const card = cards.find((item) => item.id === rule.cardId)
                    return (
                      <tr key={rule.id}>
                        <td><strong>{card?.name || 'Unknown card'}</strong></td>
                        <td>{rule.category}</td>
                        <td>
                          <div className="inline-number">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="0.1"
                              value={rule.rate}
                              onChange={(event) =>
                                updateRewardRule(rule.id, { rate: event.target.value })
                              }
                            />
                            <span>%</span>
                          </div>
                        </td>
                        <td>
                          <label className="switch-label compact">
                            <input
                              type="checkbox"
                              checked={rule.active}
                              onChange={(event) =>
                                updateRewardRule(rule.id, { active: event.target.checked })
                              }
                            />
                            {rule.active ? 'Active' : 'Off'}
                          </label>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      )}
    </>
  )
}
