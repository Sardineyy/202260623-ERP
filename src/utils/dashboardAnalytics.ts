import type { UploadedFile } from '../types'
import type {
  ChartItem,
  DashboardData,
  InventoryRiskItem,
  KpiCard,
  KpiStatus,
  MonthlySalesItem,
  RankingItem,
} from '../types/dashboard'
import {
  joinErpData,
  type OrderHeader,
  type OrderLineItem,
  type ProductRecord,
} from './erpDataJoin'

const CANCEL_STATUSES = ['취소', 'cancel', 'cancelled', 'canceled', '주문취소']
const RETURN_STATUSES = ['반품', 'return', 'returned', '환불']
const DISCONTINUED_STATUSES = ['단종', 'discontinued', '판매중지', '종료']

function isStatusMatch(status: string, patterns: string[]): boolean {
  const s = status.toLowerCase()
  return patterns.some((p) => s.includes(p.toLowerCase()))
}

function isCancelled(status: string): boolean {
  return isStatusMatch(status, CANCEL_STATUSES)
}

function isReturned(status: string): boolean {
  return isStatusMatch(status, RETURN_STATUSES)
}

function isValidStatus(status: string): boolean {
  return !isCancelled(status) && !isReturned(status)
}

function aggregateByKey(items: OrderLineItem[], key: keyof OrderLineItem): ChartItem[] {
  const map = new Map<string, number>()
  for (const item of items) {
    if (!isValidStatus(item.status)) continue
    const k = String(item[key]) || '미분류'
    map.set(k, (map.get(k) ?? 0) + item.amount)
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

function formatCurrency(n: number): string {
  return `₩${Math.round(n).toLocaleString('ko-KR')}`
}

function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`
}

function formatCount(n: number, unit: string): string {
  return `${n.toLocaleString('ko-KR')}${unit}`
}

function statusForMargin(margin: number): KpiStatus {
  return margin >= 25 ? 'normal' : 'caution'
}

function statusForRate(rate: number, cautionThreshold: number): KpiStatus {
  return rate <= cautionThreshold ? 'normal' : 'caution'
}

function buildDashboardFromData(
  lineItems: OrderLineItem[],
  orderHeaders: OrderHeader[],
  products: ProductRecord[],
  totalCustomers: number,
  isSample: boolean,
): DashboardData {
  const validItems = lineItems.filter((i) => isValidStatus(i.status))
  const cancelledHeaders = orderHeaders.filter((o) => isCancelled(o.status))
  const returnedHeaders = orderHeaders.filter((o) => isReturned(o.status))

  const netSales = validItems.reduce((s, i) => s + i.amount, 0)
  const cogs = validItems.reduce((s, i) => s + i.cost, 0)
  const grossProfit = netSales - cogs
  const grossMargin = netSales > 0 ? (grossProfit / netSales) * 100 : 0
  const gmv = orderHeaders.reduce((s, o) => s + o.totalAmount, 0)
  const cancelAmount = cancelledHeaders.reduce((s, o) => s + o.totalAmount, 0)
  const returnAmount = returnedHeaders.reduce((s, o) => s + o.totalAmount, 0)
  const cancelRate = gmv > 0 ? (cancelAmount / gmv) * 100 : 0
  const returnRate = gmv > 0 ? (returnAmount / gmv) * 100 : 0
  const quantitySold = validItems.reduce((s, i) => s + i.quantity, 0)

  const validOrderNos = new Set(validItems.map((i) => i.orderNo))
  const validOrderCount = validOrderNos.size
  const avgOrderValue = validOrderCount > 0 ? netSales / validOrderCount : 0

  const activeCustomerIds = new Set(validItems.map((i) => i.customerId))

  const productMap = new Map(products.map((p) => [p.productId, p]))

  const inventoryRisk: InventoryRiskItem[] = [...productMap.values()]
    .filter((p) => p.stock <= p.safetyStock)
    .map((p) => ({
      productId: p.productId,
      productName: p.productName,
      category: p.category,
      stock: p.stock,
      safetyStock: p.safetyStock,
      status: p.status,
    }))
    .sort((a, b) => a.stock - b.stock)

  const discontinued = [...productMap.values()].filter((p) =>
    isStatusMatch(p.status, DISCONTINUED_STATUSES),
  )

  const dates = orderHeaders.map((o) => o.date).sort((a, b) => a.getTime() - b.getTime())
  const periodStart = dates[0] ?? new Date()
  const periodEnd = dates[dates.length - 1] ?? new Date()
  const periodMonths = Math.max(
    1,
    (periodEnd.getFullYear() - periodStart.getFullYear()) * 12 +
      (periodEnd.getMonth() - periodStart.getMonth()) +
      1,
  )

  const monthlyMap = new Map<string, number>()
  for (const item of validItems) {
    const key = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, '0')}`
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + item.amount)
  }
  const monthlySales: MonthlySalesItem[] = [...monthlyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, sales]) => ({ month, sales }))

  const productSales = new Map<string, { name: string; value: number }>()
  for (const item of validItems) {
    const cur = productSales.get(item.productId) ?? { name: item.productName, value: 0 }
    cur.value += item.amount
    productSales.set(item.productId, cur)
  }
  const topProducts: RankingItem[] = [...productSales.entries()]
    .sort(([, a], [, b]) => b.value - a.value)
    .slice(0, 10)
    .map(([id, { name, value }], i) => ({
      rank: i + 1,
      name: name || id,
      value,
      subtext: id,
    }))

  const customerSales = new Map<string, { name: string; value: number }>()
  for (const item of validItems) {
    const cur = customerSales.get(item.customerId) ?? { name: item.customerName, value: 0 }
    cur.value += item.amount
    customerSales.set(item.customerId, cur)
  }
  const topCustomers: RankingItem[] = [...customerSales.entries()]
    .sort(([, a], [, b]) => b.value - a.value)
    .slice(0, 10)
    .map(([id, { name, value }], i) => ({
      rank: i + 1,
      name: name || id,
      value,
      subtext: id,
    }))

  const statusMap = new Map<string, number>()
  for (const header of orderHeaders) {
    const s = header.status || '미분류'
    statusMap.set(s, (statusMap.get(s) ?? 0) + 1)
  }

  const summary: KpiCard[] = [
    {
      label: '유효매출',
      value: formatCurrency(netSales),
      subtext: `유효주문 ${formatCount(validOrderCount, '건')}`,
    },
    { label: '매출원가', value: formatCurrency(cogs) },
    { label: '매출총이익', value: formatCurrency(grossProfit) },
    {
      label: '매출총이익률',
      value: formatPercent(grossMargin),
      status: statusForMargin(grossMargin),
      statusLabel: statusForMargin(grossMargin) === 'normal' ? '정상' : '주의',
    },
    { label: '평균 주문금액', value: formatCurrency(avgOrderValue) },
    { label: '판매 수량', value: formatCount(quantitySold, '개') },
    {
      label: '취소율',
      value: formatPercent(cancelRate),
      subtext: formatCurrency(cancelAmount),
      status: statusForRate(cancelRate, 10),
      statusLabel: statusForRate(cancelRate, 10) === 'normal' ? '정상' : '주의',
    },
    {
      label: '반품률',
      value: formatPercent(returnRate),
      subtext: formatCurrency(returnAmount),
      status: statusForRate(returnRate, 5),
      statusLabel: statusForRate(returnRate, 5) === 'normal' ? '정상' : '주의',
    },
    {
      label: '활성 고객',
      value: formatCount(activeCustomerIds.size, '명'),
      subtext: `전체 ${formatCount(totalCustomers, '명')}`,
    },
    {
      label: '재고 위험',
      value: formatCount(inventoryRisk.length, '건'),
      status: inventoryRisk.length > 0 ? 'caution' : 'normal',
      statusLabel: inventoryRisk.length > 0 ? '주의' : '정상',
    },
    {
      label: '단종 상품',
      value: formatCount(discontinued.length, '건'),
      status: discontinued.length > 0 ? 'caution' : 'normal',
      statusLabel: discontinued.length > 0 ? '주의' : '정상',
    },
    {
      label: '총 거래액',
      value: formatCurrency(gmv),
      subtext: '취소·반품 포함',
    },
  ]

  return {
    isSample,
    periodStart: periodStart.toISOString().slice(0, 10),
    periodEnd: periodEnd.toISOString().slice(0, 10),
    periodMonths,
    meta: {
      products: productMap.size,
      customers: totalCustomers,
      orders: orderHeaders.length,
    },
    summary,
    monthlySales,
    salesByCategory: aggregateByKey(lineItems, 'category'),
    salesByChannel: aggregateByKey(lineItems, 'channel'),
    salesByPayment: aggregateByKey(lineItems, 'payment'),
    salesByGrade: aggregateByKey(lineItems, 'grade'),
    orderStatusDistribution: [...statusMap.entries()].map(([name, value]) => ({ name, value })),
    topBrands: aggregateByKey(lineItems, 'brand').slice(0, 10),
    topRegions: aggregateByKey(lineItems, 'region').slice(0, 10),
    topProducts,
    topCustomers,
    inventoryRisk,
  }
}

export async function buildDashboardData(
  uploadedFiles: UploadedFile[],
): Promise<DashboardData | null> {
  const joined = await joinErpData(uploadedFiles)

  if (joined.lineItems.length === 0) {
    return null
  }

  return buildDashboardFromData(
    joined.lineItems,
    joined.orderHeaders,
    joined.products,
    joined.totalCustomers,
    joined.isSample,
  )
}
