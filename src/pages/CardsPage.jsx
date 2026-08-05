import { useState } from 'react'
import CustomCardForm from '../components/CustomCardForm'
import PageHeader from '../components/PageHeader'
import { useApp } from '../context/AppContext'
import { formatCurrency } from '../services/formatters'

export default function CardsPage() {
  const {
    cards,
    ownedCatalogCards,
    userCards,
    currentUser,
    rewardRules,
    customCards,
    customRewardRules,
    addUserCard,
    removeUserCard,
    createCustomCard,
    deleteCustomCard,
    dataLoading,
  } = useApp()
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const ownedIds = new Set(ownedCatalogCards.map((card) => card.id))

  function bestRate(cardId, custom = false) {
    const sourceRules = custom ? customRewardRules : rewardRules
    const rates = sourceRules
      .filter((rule) => rule.cardId === cardId && rule.active)
      .map((rule) => Number(rule.rate))
    return rates.length ? Math.max(...rates) : 0
  }

  async function toggleCatalogCard(cardId, owned) {
    setMessage('')
    const result = owned ? await removeUserCard(cardId) : await addUserCard(cardId)
    setMessageType(result.ok ? 'success' : 'error')
    setMessage(
      result.ok
        ? owned
          ? 'Card removed from your wallet.'
          : 'Card added to your wallet.'
        : result.message,
    )
  }

  async function handleCreateCustomCard(card) {
    const result = await createCustomCard(card)
    if (result.ok) {
      setMessageType('success')
      setMessage('Your personal card was saved and added to Best Card to Use.')
    }
    return result
  }

  async function handleDeleteCustomCard(cardId) {
    if (!window.confirm('Delete this personal card and its reward rules?')) return
    const result = await deleteCustomCard(cardId)
    setMessageType(result.ok ? 'success' : 'error')
    setMessage(result.ok ? 'Personal card deleted.' : result.message)
  }

  return (
    <>
      <PageHeader
        eyebrow="Wallet profile"
        title="My credit cards"
        description="Choose a card from the shared catalog or privately add a card that is not listed. No card numbers are stored."
        action={
          <button className="primary-button" onClick={() => setShowCustomForm((value) => !value)}>
            {showCustomForm ? 'Close form' : '+ Add my own card'}
          </button>
        }
      />

      {showCustomForm && (
        <article className="panel custom-card-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Private wallet card</p>
              <h2>Add a card not shown in the catalog</h2>
            </div>
            <span className="tag">Visible only to you</span>
          </div>
          <CustomCardForm
            onSubmit={handleCreateCustomCard}
            onCancel={() => setShowCustomForm(false)}
          />
        </article>
      )}

      {message && (
        <p className={messageType === 'success' ? 'form-success page-message' : 'form-error page-message'}>
          {message}
        </p>
      )}

      {customCards.length > 0 && (
        <section className="wallet-section">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Private cards</p>
              <h2>Cards you added</h2>
            </div>
            <p>These cards are stored under your Supabase user ID and are not shared with other users.</p>
          </div>
          <div className="card-grid">
            {customCards.map((card) => (
              <article className="credit-card-tile owned custom-card-tile" key={card.id}>
                <div className="card-topline">
                  <span className="card-chip" />
                  <span className="tag">Personal card</span>
                </div>
                <div>
                  <small>{card.issuer}</small>
                  <h2>{card.name}</h2>
                  <p>Automatically included in Best Card to Use.</p>
                </div>
                <div className="card-metrics">
                  <span>
                    <small>Best reward</small>
                    <strong>{bestRate(card.id, true)}%</strong>
                  </span>
                  <span>
                    <small>Annual fee</small>
                    <strong>{formatCurrency(card.annualFee)}</strong>
                  </span>
                </div>
                <button
                  className="secondary-button danger-button"
                  disabled={dataLoading}
                  onClick={() => handleDeleteCustomCard(card.id)}
                >
                  Delete personal card
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="wallet-section">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Shared catalog</p>
            <h2>Cards managed by SmartWallet administrators</h2>
          </div>
          <p>Admin additions and reward-rule updates are visible here after the database refreshes.</p>
        </div>

        <div className="card-grid">
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
                  disabled={dataLoading}
                  onClick={() => toggleCatalogCard(card.id, owned)}
                >
                  {owned ? 'Remove from wallet' : 'Add to wallet'}
                </button>
              </article>
            )
          })}
        </div>
      </section>

      <article className="info-banner">
        <span>Privacy note</span>
        <p>
          SmartWallet stores only product names, annual fees, and reward percentages.
          It does not collect card numbers, expiration dates, security codes, bank
          credentials, or live banking transactions.
        </p>
      </article>
    </>
  )
}
