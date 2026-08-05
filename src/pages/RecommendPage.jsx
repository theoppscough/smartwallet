import { useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { CATEGORIES } from '../data/seed'
import { formatCurrency } from '../services/formatters'

export default function RecommendPage() {
  const { ownedCards, getRecommendations, getNewCardRecommendations } = useApp()
  const [mode, setMode] = useState('use')
  const [amount, setAmount] = useState(120)
  const [category, setCategory] = useState('Dining')
  const [results, setResults] = useState([])

  const newCardAnalysis = useMemo(
    () => getNewCardRecommendations(),
    [getNewCardRecommendations],
  )
  const newCardResults = newCardAnalysis.recommendations || []
  const spendingSummary = newCardAnalysis.spendingSummary

  function handleSubmit(event) {
    event.preventDefault()
    setResults(getRecommendations(category, Number(amount)))
  }

  const winner = results[0]
  const newCardWinner = newCardResults[0]
  const topSpendingCategories = Object.entries(spendingSummary?.categoryTotals || {})
    .sort(([, totalA], [, totalB]) => totalB - totalA)
    .slice(0, 4)

  return (
    <>
      <PageHeader
        eyebrow="Recommendation engine"
        title="Smart card recommendations"
        description="Choose the best card from your wallet or discover a new card based on your recorded spending history."
      />

      <div className="tab-list advisor-tabs" role="tablist" aria-label="Recommendation type">
        <button
          type="button"
          className={mode === 'use' ? 'active' : ''}
          onClick={() => setMode('use')}
          aria-selected={mode === 'use'}
        >
          Best card to use
        </button>
        <button
          type="button"
          className={mode === 'new' ? 'active' : ''}
          onClick={() => setMode('new')}
          aria-selected={mode === 'new'}
        >
          New card to open
        </button>
      </div>

      {mode === 'use' ? (
        <CurrentWalletRecommendation
          amount={amount}
          category={category}
          ownedCards={ownedCards}
          results={results}
          winner={winner}
          setAmount={setAmount}
          setCategory={setCategory}
          handleSubmit={handleSubmit}
        />
      ) : (
        <NewCardRecommendation
          results={newCardResults}
          winner={newCardWinner}
          spendingSummary={spendingSummary}
          topSpendingCategories={topSpendingCategories}
        />
      )}
    </>
  )
}

function CurrentWalletRecommendation({
  amount,
  category,
  ownedCards,
  results,
  winner,
  setAmount,
  setCategory,
  handleSubmit,
}) {
  return (
    <>
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

function NewCardRecommendation({ results, winner, spendingSummary, topSpendingCategories }) {
  const hasHistory = Boolean(spendingSummary?.transactionCount)

  return (
    <>
      <section className="recommend-layout">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Spending analysis</p>
              <h2>Your projected profile</h2>
            </div>
          </div>

          {!hasHistory ? (
            <div className="inline-empty-state">
              <strong>Add expenses first</strong>
              <p>
                SmartWallet needs at least one recorded transaction before it can recommend
                a new card based on your spending behavior.
              </p>
            </div>
          ) : (
            <>
              <div className="analysis-metrics">
                <span>
                  <small>Transactions analyzed</small>
                  <strong>{spendingSummary.transactionCount}</strong>
                </span>
                <span>
                  <small>Months represented</small>
                  <strong>{spendingSummary.observationMonths}</strong>
                </span>
                <span>
                  <small>Average monthly spend</small>
                  <strong>{formatCurrency(spendingSummary.averageMonthlySpend)}</strong>
                </span>
                <span>
                  <small>Projected annual spend</small>
                  <strong>{formatCurrency(spendingSummary.projectedAnnualSpend)}</strong>
                </span>
              </div>

              <div className="spending-profile-list">
                <p className="mini-heading">Top spending categories</p>
                {topSpendingCategories.map(([itemCategory, total]) => (
                  <div key={itemCategory}>
                    <span>{itemCategory}</span>
                    <strong>{formatCurrency(total)}</strong>
                  </div>
                ))}
              </div>

              <p className="calculation-note">
                The prototype annualizes the recorded monthly history and subtracts each
                candidate card&apos;s annual fee. Sign-up bonuses are not included.
              </p>
            </>
          )}
        </article>

        <article className={`recommendation-result ${winner ? 'has-result new-card-result' : ''}`}>
          {!winner ? (
            <div className="recommend-empty">
              <span>＋</span>
              <h2>{hasHistory ? 'No eligible new card yet' : 'Waiting for spending history'}</h2>
              <p>
                {hasHistory
                  ? 'You may already own every active card, or the available cards need active reward rules from the administrator.'
                  : 'Record expenses to create a personalized new-card recommendation.'}
              </p>
            </div>
          ) : (
            <>
              <p className="eyebrow">Recommended new card</p>
              <span className="winner-badge">Not in your wallet</span>
              <h2>{winner.name}</h2>
              <p>{winner.issuer}</p>
              <div className="winner-metrics three-metrics">
                <span>
                  <small>Annual rewards</small>
                  <strong>{formatCurrency(winner.estimatedAnnualReward)}</strong>
                </span>
                <span>
                  <small>Annual fee</small>
                  <strong>{formatCurrency(winner.annualFee)}</strong>
                </span>
                <span>
                  <small>Net annual benefit</small>
                  <strong>{formatCurrency(winner.netAnnualBenefit)}</strong>
                </span>
              </div>
              <p className="recommend-reason">
                Based on your recorded categories, this unowned card produces the highest
                projected annual reward after its annual fee.
                {winner.topCategory && (
                  <> Its largest estimated contribution comes from {winner.topCategory.category.toLowerCase()} spending.</>
                )}
              </p>
            </>
          )}
        </article>
      </section>

      {results.length > 0 && (
        <article className="panel result-table">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Unowned card comparison</p>
              <h2>New card opportunities</h2>
            </div>
          </div>
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Card</th>
                  <th>Effective rate</th>
                  <th className="numeric">Annual rewards</th>
                  <th className="numeric">Annual fee</th>
                  <th className="numeric">Net benefit</th>
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
                    <td>{card.effectiveRewardRate.toFixed(2)}%</td>
                    <td className="numeric">{formatCurrency(card.estimatedAnnualReward)}</td>
                    <td className="numeric">{formatCurrency(card.annualFee)}</td>
                    <td className="numeric"><strong>{formatCurrency(card.netAnnualBenefit)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="table-disclaimer">
            Estimates use prototype reward rules entered by the administrator and are for
            demonstration purposes only.
          </p>
        </article>
      )}
    </>
  )
}
