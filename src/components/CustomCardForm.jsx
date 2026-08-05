import { useMemo, useState } from 'react'
import { CATEGORIES } from '../data/seed'

function initialRates() {
  return Object.fromEntries(CATEGORIES.map((category) => [category, '']))
}

const emptyForm = {
  issuer: '',
  cardName: '',
  annualFee: 0,
  rewardRates: initialRates(),
}

export default function CustomCardForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const hasAtLeastOneRate = useMemo(
    () => Object.values(form.rewardRates).some((rate) => Number(rate) > 0),
    [form.rewardRates],
  )

  function updateRate(category, value) {
    setForm((previous) => ({
      ...previous,
      rewardRates: {
        ...previous.rewardRates,
        [category]: value,
      },
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')

    if (!form.issuer.trim() || !form.cardName.trim()) {
      setMessage('Issuer and card name are required.')
      return
    }

    if (Number(form.annualFee) < 0) {
      setMessage('Annual fee cannot be negative.')
      return
    }

    const invalidRate = Object.values(form.rewardRates).some(
      (rate) => rate !== '' && (Number(rate) < 0 || Number(rate) > 100),
    )
    if (invalidRate) {
      setMessage('Reward rates must be between 0% and 100%.')
      return
    }

    if (!hasAtLeastOneRate) {
      setMessage('Enter at least one reward rate greater than 0%.')
      return
    }

    setSubmitting(true)
    const result = await onSubmit({
      ...form,
      annualFee: Number(form.annualFee) || 0,
      rewardRates: Object.fromEntries(
        Object.entries(form.rewardRates).map(([category, rate]) => [
          category,
          Number(rate) || 0,
        ]),
      ),
    })
    setSubmitting(false)

    if (!result?.ok) {
      setMessage(result?.message || 'Unable to add your card.')
      return
    }

    setForm(emptyForm)
    onCancel?.()
  }

  return (
    <form className="custom-card-form" onSubmit={handleSubmit}>
      <div className="form-grid two">
        <label>
          Card issuer
          <input
            required
            maxLength="80"
            value={form.issuer}
            onChange={(event) => setForm({ ...form, issuer: event.target.value })}
            placeholder="Example: Chase"
          />
        </label>
        <label>
          Card name
          <input
            required
            maxLength="120"
            value={form.cardName}
            onChange={(event) => setForm({ ...form, cardName: event.target.value })}
            placeholder="Example: Sapphire Preferred"
          />
        </label>
      </div>

      <label>
        Annual fee
        <input
          type="number"
          min="0"
          step="0.01"
          value={form.annualFee}
          onChange={(event) => setForm({ ...form, annualFee: event.target.value })}
        />
      </label>

      <div className="custom-rate-section">
        <div>
          <p className="eyebrow">Reward rules</p>
          <h3>Enter the reward rate for each category</h3>
          <p className="subtle-copy">
            Use the percentage shown by your card issuer. Enter 0 for categories
            that do not receive a bonus.
          </p>
        </div>
        <div className="reward-rate-grid">
          {CATEGORIES.map((category) => (
            <label key={category}>
              {category}
              <span className="rate-input-wrap">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.rewardRates[category]}
                  onChange={(event) => updateRate(category, event.target.value)}
                  placeholder="0"
                />
                <span>%</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {message && <p className="form-error">{message}</p>}

      <div className="button-row">
        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? 'Saving card…' : 'Save my card'}
        </button>
        <button className="secondary-button" type="button" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  )
}
