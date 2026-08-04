import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { CATEGORIES } from '../data/seed'
import { formatCurrency } from '../services/formatters'

export default function RecommendPage() {
  const { ownedCards, getRecommendations } = useApp()
  const [amount, setAmount] = useState(120)
  const [category, setCategory] = useState('Dining')
  const [results, setResults] = useState([])

  function handleSubmit(event) {
    event.preventDefault()
    setResults(getRecommendations(category, Number(amount)))
  }

  const winner = results[0]

  return (
    <>
      <PageHeader
        eyebrow="Recommendation engine"
        title="Which card should I use?"
        description="Compare your active cards using the reward rules managed by the administrator."
      />

      <section className="recommend-layout">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Upcoming purchase</p>
              <h2>Purchase details</h2>
            </div>
          </div>

          <form className="stacked-form" onSubmit={handleSubmit}>
            <label>
              Purchase amount
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>
            <label>
              Spending category
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                {CATEGORIES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <button className="primary-button" type="submit" disabled={!ownedCards.length}>
              Find my best card
            </button>
          </form>
        </article>

        <article className={`recommendation-result ${winner ? 'has-result' : ''}`}>
          {!winner ? (
            <div className="recommend-empty">
              <span>✦</span>
              <h2>Ready to compare</h2>
              <p>
                Enter a purchase amount and category. SmartWallet will rank the cards
                currently saved in your wallet.
              </p>
            </div>
          ) : (
            <>
              <p className="eyebrow">Best choice</p>
              <span className="winner-badge">Recommended</span>
              <h2>{winner.name}</h2>
              <p>{winner.issuer}</p>
              <div className="winner-metrics">
                <span>
                  <small>Reward rate</small>
                  <strong>{winner.rate}%</strong>
                </span>
                <span>
                  <small>Estimated reward</small>
                  <strong>{formatCurrency(winner.estimatedReward)}</strong>
                </span>
              </div>
              <p className="recommend-reason">
                This card produces the highest estimated reward for a{' '}
                {formatCurrency(amount)} {category.toLowerCase()} purchase.
              </p>
            </>
          )}
        </article>
      </section>

      {results.length > 0 && (
        <article className="panel result-table">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Transparent comparison</p>
              <h2>All cards in your wallet</h2>
            </div>
          </div>
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Card</th>
                  <th>Category rate</th>
                  <th className="numeric">Estimated reward</th>
                </tr>
              </thead>
              <tbody>
                {results.map((card, index) => (
                  <tr key={card.id}>
                    <td>#{index + 1}</td>
                    <td>
                      <strong>{card.name}</strong>
                      <small className="table-note">{card.issuer}</small>
                    </td>
                    <td>{card.rate}%</td>
                    <td className="numeric"><strong>{formatCurrency(card.estimatedReward)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}
    </>
  )
}
