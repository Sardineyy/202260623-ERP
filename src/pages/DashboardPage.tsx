import { useCallback, useEffect, useState } from 'react'
import type { UploadedFile } from '../types'
import type { DashboardData } from '../types/dashboard'
import { buildDashboardData } from '../utils/dashboardAnalytics'
import SummaryCards from '../components/dashboard/SummaryCards'
import DashboardCharts from '../components/dashboard/DashboardCharts'
import { RankingTables, InventoryRiskTable } from '../components/dashboard/DashboardTables'
import './DashboardPage.css'

interface DashboardPageProps {
  uploadedFiles: UploadedFile[]
}

export default function DashboardPage({ uploadedFiles }: DashboardPageProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await buildDashboardData(uploadedFiles)
      setData(result)
    } catch {
      setError('대시보드 데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [uploadedFiles])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  if (loading) {
    return (
      <div className="page dashboard-page">
        <div className="dashboard-page__loading">대시보드 데이터를 집계하는 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page dashboard-page">
        <div className="dashboard-page__error">{error}</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="page dashboard-page">
        <div className="dashboard-page__empty">
          <h2 className="dashboard-page__empty-title">대시보드 데이터가 없습니다</h2>
          <p className="dashboard-page__empty-desc">
            {uploadedFiles.length === 0
              ? '데이터 입력 탭에서 「샘플 데이터 불러오기」를 클릭하거나 ERP 원본 파일을 업로드해 주세요.'
              : '업로드된 파일에서 주문·상품·고객 데이터를 인식하지 못했습니다. sales_orders, sales_order_items, products, customers 형식의 파일을 확인해 주세요.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page dashboard-page">
      <header className="dashboard-page__header">
        <div>
          <h2 className="dashboard-page__title">경영 대시보드</h2>
          <p className="dashboard-page__period">
            분석 기간 {data.periodStart} ~ {data.periodEnd} ({data.periodMonths}개월)
          </p>
        </div>
        <div className="dashboard-page__meta">
          상품 {data.meta.products.toLocaleString('ko-KR')} · 고객{' '}
          {data.meta.customers.toLocaleString('ko-KR')} · 주문{' '}
          {data.meta.orders.toLocaleString('ko-KR')}
        </div>
      </header>

      {data.isSample && (
        <div className="dashboard-page__notice">
          샘플 ERP 데이터로 대시보드를 표시하고 있습니다. (주문 5,000건 · 상품 1,000개 · 고객 2,000명)
        </div>
      )}

      <section className="dashboard-section">
        <SummaryCards cards={data.summary} />
      </section>

      <section className="dashboard-section">
        <DashboardCharts
          monthlySales={data.monthlySales}
          salesByCategory={data.salesByCategory}
          salesByChannel={data.salesByChannel}
          salesByPayment={data.salesByPayment}
          salesByGrade={data.salesByGrade}
          orderStatusDistribution={data.orderStatusDistribution}
          topBrands={data.topBrands}
          topRegions={data.topRegions}
        />
      </section>

      <section className="dashboard-section">
        <RankingTables topProducts={data.topProducts} topCustomers={data.topCustomers} />
      </section>

      <section className="dashboard-section">
        <InventoryRiskTable items={data.inventoryRisk} />
      </section>
    </div>
  )
}
