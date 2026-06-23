export function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[\s_\-./]/g, '')
}

export function findColumn(columns: string[], aliases: string[]): string | null {
  const normalized = columns.map((c) => ({ original: c, norm: normalizeKey(c) }))
  for (const alias of aliases) {
    const target = normalizeKey(alias)
    const exact = normalized.find((c) => c.norm === target)
    if (exact) return exact.original
  }
  for (const alias of aliases) {
    const target = normalizeKey(alias)
    const partial = normalized.find((c) => c.norm.includes(target) || target.includes(c.norm))
    if (partial) return partial.original
  }
  return null
}

export function toNumber(value: unknown): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (value == null || value === '') return 0
  const n = Number(String(value).replace(/[₩,\s%원개명건]/g, ''))
  return Number.isNaN(n) ? 0 : n
}

export function toString(value: unknown): string {
  if (value == null) return ''
  return String(value).trim()
}

export const COLUMN_ALIASES = {
  orderDate: ['주문일', 'orderdate', 'order_date', 'date', '거래일', '일자'],
  orderId: ['주문번호', 'orderid', 'order_id', '주문id', 'order_no', 'orderno'],
  amount: ['주문금액', '매출', 'amount', 'revenue', 'sales', '금액', '결제금액', 'totalamount', 'total_amount_krw', 'amount_krw'],
  cost: ['매출원가', '원가', 'cost', 'cogs', 'costofgoods', 'unit_cost_krw', 'unitcostkrw'],
  quantity: ['수량', 'quantity', 'qty', '판매수량'],
  status: ['주문상태', 'status', 'orderstatus', 'order_status', '상태'],
  channel: ['채널', 'channel', '판매채널', 'saleschannel'],
  payment: ['결제수단', 'payment', 'paymentmethod', '결제방법', 'payment_method'],
  category: ['카테고리', 'category', '품목군'],
  brand: ['브랜드', 'brand'],
  region: ['지역', 'region', '권역', 'area', 'city'],
  grade: ['고객등급', '등급', 'grade', 'customerrade', 'customergrade', 'tier'],
  productId: ['상품코드', 'productid', 'product_id', '상품id', '품목코드'],
  productName: ['상품명', 'productname', 'product_name', '품목명'],
  customerId: ['고객코드', 'customerid', 'customer_id', '고객id', '회원번호'],
  customerName: ['고객명', 'customername', 'customer_name', '회원명'],
  stock: ['재고', 'stock', 'inventory', '재고수량', '현재고', 'stock_qty', 'stockqty'],
  safetyStock: ['안전재고', 'safetystock', 'safety_stock', '최소재고'],
  productStatus: ['상품상태', 'productstatus', '품목상태'],
} as const
