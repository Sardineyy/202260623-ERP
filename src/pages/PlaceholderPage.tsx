import './PlaceholderPage.css'

interface PlaceholderPageProps {
  title: string
  description: string
  icon: 'dashboard' | 'report' | 'data'
}

function PlaceholderIcon({ type }: { type: PlaceholderPageProps['icon'] }) {
  if (type === 'dashboard') {
    return (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <rect x="8" y="8" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="2" />
        <rect x="36" y="8" width="20" height="12" rx="4" stroke="currentColor" strokeWidth="2" />
        <rect x="8" y="36" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="2" />
        <rect x="36" y="28" width="20" height="28" rx="4" stroke="currentColor" strokeWidth="2" />
      </svg>
    )
  }
  if (type === 'report') {
    return (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <rect x="12" y="6" width="40" height="52" rx="4" stroke="currentColor" strokeWidth="2" />
        <path d="M20 22h24M20 32h24M20 42h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <ellipse cx="32" cy="20" rx="16" ry="6" stroke="currentColor" strokeWidth="2" />
      <path d="M16 20v24c0 3.3 7.2 6 16 6s16-2.7 16-6V20" stroke="currentColor" strokeWidth="2" />
      <path d="M16 32c0 3.3 7.2 6 16 6s16-2.7 16-6" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

export default function PlaceholderPage({ title, description, icon }: PlaceholderPageProps) {
  return (
    <div className="page placeholder-page">
      <div className="placeholder-page__content">
        <div className="placeholder-page__icon">
          <PlaceholderIcon type={icon} />
        </div>
        <h2 className="placeholder-page__title">{title}</h2>
        <p className="placeholder-page__description">{description}</p>
      </div>
    </div>
  )
}
