import PageHeader from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { formatCurrency } from '../services/formatters'

export default function CardsPage() {
  const { cards, ownedCards, userCards, currentUser, rewardRules, addUserCard, removeUserCard } =
    useApp()

  const ownedIds = new Set(ownedCards.map((card) => card.id))

  function bestRate(cardId) {
    const rates = rewardRules
      .filter((rule) => rule.cardId === cardId && rule.active)
      .map((rule) => Number(rule.rate))
    return rates.length ? Math.max(...rates) : 0
  }

  return (
    <>
      <PageHeader
        eyebrow="Wallet profile"
        title="My credit cards"
        description="Manage the cards used by the recommendation engine. No card numbers are stored."
      />

      <section className="card-grid">
        {cards.filter((card) => card.active).map((card) => {
          const owned = ownedIds.has(card.id)
          const relation = userCards.find(
            (item) => item.userId === currentUser.id && item.cardId === card.id,
          )

          return (
            <article className={`credit-card-tile ${owned ? 'owned' : ''}`} key={card.id}>
              <div className="card-topline">
                <span className="card-chip" />
                <span className="tag">{owned ? 'In wallet' : 'Available'}</span>
              </div>
              <div>
                <small>{card.issuer}</small>
                <h2>{card.name}</h2>
                {relation?.nickname && <p>{relation.nickname}</p>}
              </div>
              <div className="card-metrics">
                <span>
                  <small>Best reward</small>
                  <strong>{bestRate(card.id)}%</strong>
                </span>
                <span>
                  <small>Annual fee</small>
                  <strong>{formatCurrency(card.annualFee)}</strong>
                </span>
              </div>
              <button
                className={owned ? 'secondary-button' : 'primary-button'}
                onClick={() => (owned ? removeUserCard(card.id) : addUserCard(card.id))}
              >
                {owned ? 'Remove from wallet' : 'Add to wallet'}
              </button>
            </article>
          )
        })}
      </section>

      <article className="info-banner">
        <span>Privacy note</span>
        <p>
          This prototype stores only the card product name. It does not collect card numbers,
          expiration dates, security codes, bank credentials, or live transaction feeds.
        </p>
      </article>
    </>
  )
}
