import { useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { CATEGORIES } from '../data/seed'
import { formatCurrency, formatDate } from '../services/formatters'

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

const emptyForm = {
  amount: '',
  merchant: '',
  category: 'Dining',
  expenseDate: todayString(),
  cardId: '',
  notes: '',
}

export default function ExpensesPage() {
  const {
    userExpenses,
    ownedCards,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useApp()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [filter, setFilter] = useState('All')
  const [message, setMessage] = useState('')

  const visibleExpenses = useMemo(
    () =>
      filter === 'All'
        ? userExpenses
        : userExpenses.filter((expense) => expense.category === filter),
    [filter, userExpenses],
  )

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')

    if (!form.cardId) {
      setMessage('Please select a card.')
      return
    }

    if (Number(form.amount) <= 0) {
      setMessage('Amount must be greater than zero.')
      return
    }

    const result = editingId
      ? await updateExpense(editingId, form)
      : await addExpense(form)

    if (!result?.ok) {
      setMessage(result?.message || 'Unable to save the expense.')
      return
    }

    setMessage(editingId ? 'Expense updated successfully.' : 'Expense added successfully.')
    setEditingId(null)
    setForm({ ...emptyForm, cardId: ownedCards[0]?.id || '' })
  }

  function startEdit(expense) {
    setEditingId(expense.id)
    setForm({
      amount: expense.amount,
      merchant: expense.merchant,
      category: expense.category,
      expenseDate: expense.expenseDate,
      cardId: expense.cardId,
      notes: expense.notes || '',
    })
    setMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm({ ...emptyForm, cardId: ownedCards[0]?.id || '' })
    setMessage('')
  }

  async function handleDelete(expenseId) {
    if (window.confirm('Delete this expense? This action cannot be undone.')) {
      const result = await deleteExpense(expenseId)
      if (!result?.ok) {
        setMessage(result?.message || 'Unable to delete the expense.')
      }
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Transactions"
        title="Expense tracker"
        description="Add, update, delete, and review transactions stored in the prototype database."
      />

      <section className="split-layout">
        <article className="panel sticky-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{editingId ? 'Update transaction' : 'New transaction'}</p>
              <h2>{editingId ? 'Edit expense' : 'Add expense'}</h2>
            </div>
          </div>

          {ownedCards.length === 0 ? (
            <p className="form-error">Add a card to your wallet before recording expenses.</p>
          ) : (
            <form className="stacked-form" onSubmit={handleSubmit}>
              <div className="form-grid two">
                <label>
                  Amount
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={form.amount}
                    onChange={(event) => setForm({ ...form, amount: event.target.value })}
                    placeholder="0.00"
                  />
                </label>
                <label>
                  Date
                  <input
                    type="date"
                    required
                    value={form.expenseDate}
                    onChange={(event) =>
                      setForm({ ...form, expenseDate: event.target.value })
                    }
                  />
                </label>
              </div>

              <label>
                Merchant
                <input
                  required
                  value={form.merchant}
                  onChange={(event) => setForm({ ...form, merchant: event.target.value })}
                  placeholder="Merchant name"
                />
              </label>

              <div className="form-grid two">
                <label>
                  Category
                  <select
                    value={form.category}
                    onChange={(event) => setForm({ ...form, category: event.target.value })}
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Card used
                  <select
                    required
                    value={form.cardId}
                    onChange={(event) => setForm({ ...form, cardId: event.target.value })}
                  >
                    <option value="">Choose card</option>
                    {ownedCards.map((card) => (
                      <option key={card.id} value={card.id}>
                        {card.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Notes
                <textarea
                  rows="3"
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  placeholder="Optional note"
                />
              </label>

              {message && (
                <p className={message.includes('successfully') ? 'form-success' : 'form-error'}>
                  {message}
                </p>
              )}

              <div className="button-row">
                <button className="primary-button" type="submit">
                  {editingId ? 'Save changes' : 'Add expense'}
                </button>
                {editingId && (
                  <button className="secondary-button" type="button" onClick={cancelEdit}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Database records</p>
              <h2>Expense history</h2>
            </div>
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option>All</option>
              {CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Merchant</th>
                  <th>Category</th>
                  <th>Card</th>
                  <th className="numeric">Amount</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {visibleExpenses.map((expense) => {
                  const card = ownedCards.find((item) => item.id === expense.cardId)
                  return (
                    <tr key={expense.id}>
                      <td>{formatDate(expense.expenseDate)}</td>
                      <td>
                        <strong>{expense.merchant}</strong>
                        {expense.notes && <small className="table-note">{expense.notes}</small>}
                      </td>
                      <td><span className="tag">{expense.category}</span></td>
                      <td>{card?.name || 'Unknown'}</td>
                      <td className="numeric"><strong>{formatCurrency(expense.amount)}</strong></td>
                      <td>
                        <div className="row-actions">
                          <button onClick={() => startEdit(expense)}>Edit</button>
                          <button className="danger-link" onClick={() => handleDelete(expense.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {visibleExpenses.length === 0 && (
              <p className="empty-state">No expenses match this filter.</p>
            )}
          </div>
        </article>
      </section>
    </>
  )
}
