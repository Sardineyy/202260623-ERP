import Papa from 'papaparse'
import { z } from 'zod'
import type { ErpFileKey } from '../constants/erpFiles'
import type { UploadedFile } from '../types'
import { matchErpFileKey } from '../constants/erpFiles'
import { normalizeCell, stripBom } from './csvUtils'

export type ValidationStatus = 'idle' | 'validating' | 'valid' | 'error'

export interface FileValidationResult {
  key: ErpFileKey
  status: ValidationStatus
  message?: string
  rowCount?: number
}

const productsRowSchema = z.object({
  product_id: z.coerce.string().min(1),
  product_name: z.string().min(1),
  category: z.string().min(1),
  brand: z.string().min(1),
  unit_cost_krw: z.coerce.number(),
  unit_price_krw: z.coerce.number(),
  stock_qty: z.coerce.number(),
  status: z.string().min(1),
})

const customersRowSchema = z.object({
  customer_id: z.coerce.string().min(1),
  customer_name: z.string().min(1),
  customer_type: z.string().min(1),
  city: z.string().min(1),
  tier: z.string().min(1),
})

const ordersRowSchema = z.object({
  order_no: z.coerce.string().min(1),
  customer_id: z.coerce.string().min(1),
  order_date: z.string().min(1),
  status: z.string().min(1),
  channel: z.string().min(1),
  payment_method: z.string().min(1),
  total_amount_krw: z.coerce.number(),
})

const orderItemsRowSchema = z.object({
  order_item_id: z.coerce.string().min(1),
  order_no: z.coerce.string().min(1),
  product_id: z.coerce.string().min(1),
  qty: z.coerce.number().positive(),
  unit_price_krw: z.coerce.number(),
  amount_krw: z.coerce.number(),
})

const SCHEMAS: Record<ErpFileKey, z.ZodType> = {
  products: productsRowSchema,
  customers: customersRowSchema,
  orders: ordersRowSchema,
  orderItems: orderItemsRowSchema,
}

const REQUIRED_COLUMNS: Record<ErpFileKey, string[]> = {
  products: ['product_id', 'product_name', 'category', 'brand', 'unit_cost_krw', 'unit_price_krw', 'stock_qty', 'status'],
  customers: ['customer_id', 'customer_name', 'customer_type', 'city', 'tier'],
  orders: ['order_no', 'customer_id', 'order_date', 'status', 'channel', 'payment_method', 'total_amount_krw'],
  orderItems: ['order_item_id', 'order_no', 'product_id', 'qty', 'unit_price_krw', 'amount_krw'],
}

async function parseCsvText(file: File): Promise<Record<string, unknown>[]> {
  const raw = await file.text()
  const text = stripBom(raw)
  const result = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => normalizeCell(header),
    transform: (value) => (typeof value === 'string' ? value.trim() : value),
  })
  return result.data
}

function validateRows(key: ErpFileKey, rows: Record<string, unknown>[]): string | null {
  const schema = SCHEMAS[key]
  const sampleSize = Math.min(rows.length, 50)

  for (let i = 0; i < sampleSize; i++) {
    const result = schema.safeParse(rows[i])
    if (!result.success) {
      const issue = result.error.issues[0]
      return `${i + 1}행: ${issue.path.join('.')} - ${issue.message}`
    }
  }

  return null
}

function checkReferentialIntegrity(
  datasets: Partial<Record<ErpFileKey, Record<string, unknown>[]>>,
): string | null {
  const orders = datasets.orders ?? []
  const items = datasets.orderItems ?? []
  const products = datasets.products ?? []
  const customers = datasets.customers ?? []

  if (orders.length === 0 || items.length === 0) return null

  const customerIds = new Set(customers.map((r) => normalizeCell(r.customer_id)))
  const productIds = new Set(products.map((r) => normalizeCell(r.product_id)))
  const orderNos = new Set(orders.map((r) => normalizeCell(r.order_no)))

  let orphanCustomers = 0
  let orphanOrders = 0
  let orphanProducts = 0

  for (const order of orders) {
    if (!customerIds.has(normalizeCell(order.customer_id))) orphanCustomers++
  }
  for (const item of items) {
    if (!orderNos.has(normalizeCell(item.order_no))) orphanOrders++
    if (!productIds.has(normalizeCell(item.product_id))) orphanProducts++
  }

  const issues: string[] = []
  if (orphanCustomers > 0) issues.push(`고객 참조 오류 ${orphanCustomers}건`)
  if (orphanOrders > 0) issues.push(`주문 참조 오류 ${orphanOrders}건`)
  if (orphanProducts > 0) issues.push(`상품 참조 오류 ${orphanProducts}건`)

  return issues.length > 0 ? issues.join(', ') : null
}

export interface ValidationSummary {
  results: FileValidationResult[]
  integrityError: string | null
}

export async function validateErpFile(file: File, key: ErpFileKey): Promise<FileValidationResult> {
  try {
    const rows = await parseCsvText(file)
    if (rows.length === 0) {
      return { key, status: 'error', message: '데이터가 비어 있습니다.' }
    }

    const columns = Object.keys(rows[0])
    const missing = REQUIRED_COLUMNS[key].filter((col) => !columns.includes(col))
    if (missing.length > 0) {
      return { key, status: 'error', message: `필수 컬럼 누락: ${missing.join(', ')}` }
    }

    const rowError = validateRows(key, rows)
    if (rowError) {
      return { key, status: 'error', message: rowError }
    }

    return { key, status: 'valid', rowCount: rows.length }
  } catch {
    return { key, status: 'error', message: '파일을 읽을 수 없습니다.' }
  }
}

export async function validateAllErpFiles(
  uploadedFiles: UploadedFile[],
): Promise<ValidationSummary> {
  const keys: ErpFileKey[] = ['products', 'customers', 'orders', 'orderItems']
  const fileMap = new Map<ErpFileKey, File>()
  const parsedData: Partial<Record<ErpFileKey, Record<string, unknown>[]>> = {}

  for (const { file } of uploadedFiles) {
    const key = matchErpFileKey(file.name)
    if (key) fileMap.set(key, file)
  }

  const results: FileValidationResult[] = []

  for (const key of keys) {
    const file = fileMap.get(key)
    if (!file) {
      results.push({ key, status: 'idle' })
      continue
    }

    const result = await validateErpFile(file, key)
    results.push(result)

    if (result.status === 'valid') {
      parsedData[key] = await parseCsvText(file)
    }
  }

  const allValid = results.every((r) => r.status === 'valid')
  const integrityError = allValid ? checkReferentialIntegrity(parsedData) : null

  return { results, integrityError }
}
