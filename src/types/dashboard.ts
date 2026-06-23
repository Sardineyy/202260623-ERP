export type KpiStatus = 'normal' | 'caution' | 'none'

export interface KpiCard {
  label: string
  value: string
  subtext?: string
  status?: KpiStatus
  statusLabel?: string
}

export interface ChartItem {
  name: string
  value: number
}

export interface MonthlySalesItem {
  month: string
  sales: number
}

export interface RankingItem {
  rank: number
  name: string
  value: number
  subtext?: string
}

export interface InventoryRiskItem {
  productId: string
  productName: string
  category: string
  stock: number
  safetyStock: number
  status: string
}

export interface DashboardData {
  isSample: boolean
  periodStart: string
  periodEnd: string
  periodMonths: number
  meta: { products: number; customers: number; orders: number }
  summary: KpiCard[]
  monthlySales: MonthlySalesItem[]
  salesByCategory: ChartItem[]
  salesByChannel: ChartItem[]
  salesByPayment: ChartItem[]
  salesByGrade: ChartItem[]
  orderStatusDistribution: ChartItem[]
  topBrands: ChartItem[]
  topRegions: ChartItem[]
  topProducts: RankingItem[]
  topCustomers: RankingItem[]
  inventoryRisk: InventoryRiskItem[]
}
