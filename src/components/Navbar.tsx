import type { TabId } from '../types'
import './Navbar.css'

interface NavbarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const LEFT_TAB: { id: TabId; label: string } = { id: 'data-input', label: '데이터 입력' }

const CENTER_TABS: { id: TabId; label: string }[] = [
  { id: 'dashboard', label: '대시보드' },
  { id: 'report', label: '분석보고서' },
  { id: 'raw-data', label: '원본 데이터' },
]

export default function Navbar({ activeTab, onTabChange }: NavbarProps) {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <div className="navbar__left">
          <div className="navbar__brand">
            <div className="navbar__logo" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="6" fill="currentColor" />
                <path
                  d="M7 18V10h3v8H7zm5-5v5h3v-5h-3zm5 3v2h3v-2h-3z"
                  fill="white"
                />
              </svg>
            </div>
            <h1 className="navbar__title">ERP ANALYTICS</h1>
          </div>

          <button
            className={`navbar__tab navbar__tab--left ${activeTab === LEFT_TAB.id ? 'navbar__tab--active' : ''}`}
            onClick={() => onTabChange(LEFT_TAB.id)}
            aria-current={activeTab === LEFT_TAB.id ? 'page' : undefined}
          >
            {LEFT_TAB.label}
          </button>
        </div>

        <nav className="navbar__tabs navbar__tabs--center" aria-label="주 메뉴">
          {CENTER_TABS.map((tab) => (
            <button
              key={tab.id}
              className={`navbar__tab ${activeTab === tab.id ? 'navbar__tab--active' : ''}`}
              onClick={() => onTabChange(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
