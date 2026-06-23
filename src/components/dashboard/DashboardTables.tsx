import type { InventoryRiskItem, RankingItem } from '../../types/dashboard'
import './DashboardTables.css'

function formatCurrency(n: number): string {
  return `₩${Math.round(n).toLocaleString('ko-KR')}`
}

interface RankingTablesProps {
  topProducts: RankingItem[]
  topCustomers: RankingItem[]
}

export function RankingTables({ topProducts, topCustomers }: RankingTablesProps) {
  return (
    <div className="ranking-grid">
      <div className="ranking-table-card">
        <h3 className="ranking-table-card__title">상위 상품 (매출 TOP 10)</h3>
        <div className="table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>순위</th>
                <th>상품명</th>
                <th>매출</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((item) => (
                <tr key={item.rank}>
                  <td className="dashboard-table__rank">{item.rank}</td>
                  <td>
                    <div className="dashboard-table__name">{item.name}</div>
                    {item.subtext && <div className="dashboard-table__sub">{item.subtext}</div>}
                  </td>
                  <td className="dashboard-table__num">{formatCurrency(item.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ranking-table-card">
        <h3 className="ranking-table-card__title">상위 고객 (매출 TOP 10)</h3>
        <div className="table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>순위</th>
                <th>고객명</th>
                <th>매출</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((item) => (
                <tr key={item.rank}>
                  <td className="dashboard-table__rank">{item.rank}</td>
                  <td>
                    <div className="dashboard-table__name">{item.name}</div>
                    {item.subtext && <div className="dashboard-table__sub">{item.subtext}</div>}
                  </td>
                  <td className="dashboard-table__num">{formatCurrency(item.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

interface InventoryRiskTableProps {
  items: InventoryRiskItem[]
}

export function InventoryRiskTable({ items }: InventoryRiskTableProps) {
  return (
    <div className="inventory-risk-card">
      <div className="inventory-risk-card__header">
        <h3 className="inventory-risk-card__title">재고 위험 품목</h3>
        <span className="inventory-risk-card__count">{items.length}건</span>
      </div>
      <p className="inventory-risk-card__desc">재고가 가장 적게 남은 순서대로 정렬되었습니다.</p>
      <div className="table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>상품코드</th>
              <th>상품명</th>
              <th>카테고리</th>
              <th>현재고</th>
              <th>안전재고</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="dashboard-table__empty">
                  재고 위험 품목이 없습니다.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.productId} className={item.stock <= item.safetyStock ? 'row--danger' : ''}>
                  <td>{item.productId}</td>
                  <td>{item.productName}</td>
                  <td>{item.category}</td>
                  <td className="dashboard-table__num dashboard-table__stock">{item.stock}</td>
                  <td className="dashboard-table__num">{item.safetyStock}</td>
                  <td>
                    <span className={`status-pill ${item.stock <= item.safetyStock ? 'status-pill--caution' : ''}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
