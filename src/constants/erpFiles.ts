export type ErpFileKey = 'products' | 'customers' | 'orders' | 'orderItems'

export interface ErpFileDefinition {
  key: ErpFileKey
  label: string
  filename: string
}

export const ERP_FILES: ErpFileDefinition[] = [
  { key: 'products', label: '상품', filename: 'products.csv' },
  { key: 'customers', label: '고객', filename: 'customers.csv' },
  { key: 'orders', label: '주문', filename: 'sales_orders.csv' },
  { key: 'orderItems', label: '주문상세', filename: 'sales_order_items.csv' },
]

export const ERP_FILE_NAMES = ERP_FILES.map((f) => f.filename)

export function matchErpFileKey(filename: string): ErpFileKey | null {
  const lower = filename.toLowerCase()
  const found = ERP_FILES.find((f) => lower === f.filename || lower.endsWith(`/${f.filename}`))
  return found?.key ?? null
}

export const WORKFLOW_STEPS = [
  {
    title: '데이터 검증',
    description: 'zod 스키마로 4개 테이블을 검사하고 참조 무결성을 점검합니다.',
  },
  {
    title: '대시보드 생성',
    description: '매출·수익성·고객·재고 KPI와 차트를 자동 시각화합니다.',
  },
  {
    title: 'AI 보고서 & 다운로드',
    description: 'Gemini로 보고서를 만들고 PDF/Word로 내려받습니다.',
  },
] as const
