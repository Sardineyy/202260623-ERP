import type { KpiCard } from '../../types/dashboard'
import './SummaryCards.css'

interface SummaryCardsProps {
  cards: KpiCard[]
}

export default function SummaryCards({ cards }: SummaryCardsProps) {
  return (
    <div className="summary-grid">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`summary-card ${card.status ? `summary-card--${card.status}` : ''}`}
        >
          <div className="summary-card__header">
            <span className="summary-card__label">{card.label}</span>
            {card.statusLabel && (
              <span className={`summary-card__badge summary-card__badge--${card.status}`}>
                {card.statusLabel}
              </span>
            )}
          </div>
          <div className="summary-card__value">{card.value}</div>
          {card.subtext && <div className="summary-card__subtext">{card.subtext}</div>}
        </div>
      ))}
    </div>
  )
}
