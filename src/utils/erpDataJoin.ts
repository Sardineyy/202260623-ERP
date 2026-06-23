import {
  COLUMN_ALIASES,
  findColumn,
  toNumber,
  toString,
} from './columnMapper'
import { parseAllUploadedFiles, type DataRow, type ParsedDataset } from './fileParser'
import { normalizeCell } from './csvUtils'
import type { UploadedFile } from '../types'

export interface OrderLineItem {
  orderNo: string
  date: Date
  amount: number
  cost: number
  quantity: number
  status: string
  channel: string
  payment: string
  category: string
  brand: string
  region: string
  grade: string
  productId: string
  productName: string
  customerId: string
  customerName: string
}

export interface OrderHeader {
  orderNo: string
  date: Date
  status: string
  channel: string
  payment: string
  customerId: string
  totalAmount: number
}

export interface ProductRecord {
  productId: string
  productName: string
  category: string
  brand: string
  stock: number
  safetyStock: number
  status: string
  unitCost: number
}

export interface CustomerRecord {
  customerId: string
  customerName: string
  grade: string
  region: string
}

export interface ErpJoinedData {
  lineItems: OrderLineItem[]
  orderHeaders: OrderHeader[]
  products: ProductRecord[]
  customers: CustomerRecord[]
  totalCustomers: number
  isSample: boolean
}

type DatasetType = 'orders' | 'items' | 'customers' | 'products' | 'flatOrders' | 'unknown'

function parseDate(value: unknown): Date | null {
  const str = toString(value)
  if (!str) return null
  const d = new Date(str)
  return Number.isNaN(d.getTime()) ? null : d
}

function classifyDataset(rows: DataRow[]): DatasetType {
  if (rows.length === 0) return 'unknown'
  const columns = Object.keys(rows[0])

  const hasOrderDate = findColumn(columns, [...COLUMN_ALIASES.orderDate])
  const hasOrderNo = findColumn(columns, [...COLUMN_ALIASES.orderId])
  const hasTotalAmount = findColumn(columns, ['total_amount_krw', ...COLUMN_ALIASES.amount])
  const hasItemAmount = findColumn(columns, ['amount_krw', ...COLUMN_ALIASES.amount])
  const hasProductId = findColumn(columns, [...COLUMN_ALIASES.productId])
  const hasCustomerName = findColumn(columns, [...COLUMN_ALIASES.customerName])
  const hasStock = findColumn(columns, [...COLUMN_ALIASES.stock])

  if (hasOrderNo && hasOrderDate && hasTotalAmount && !hasProductId) return 'orders'
  if (hasOrderNo && hasProductId && hasItemAmount && !hasOrderDate) return 'items'
  if (findColumn(columns, [...COLUMN_ALIASES.customerId]) && hasCustomerName && !hasOrderDate)
    return 'customers'
  if (hasProductId && hasStock && findColumn(columns, [...COLUMN_ALIASES.productName]))
    return 'products'
  if (hasOrderDate && findColumn(columns, [...COLUMN_ALIASES.amount])) return 'flatOrders'

  return 'unknown'
}

function parseOrderHeaders(rows: DataRow[]): OrderHeader[] {
  const columns = Object.keys(rows[0])
  const orderNoCol = findColumn(columns, [...COLUMN_ALIASES.orderId])!
  const dateCol = findColumn(columns, [...COLUMN_ALIASES.orderDate])!
  const statusCol = findColumn(columns, [...COLUMN_ALIASES.status])
  const channelCol = findColumn(columns, [...COLUMN_ALIASES.channel])
  const paymentCol = findColumn(columns, [...COLUMN_ALIASES.payment])
  const customerCol = findColumn(columns, [...COLUMN_ALIASES.customerId])
  const amountCol =
    findColumn(columns, ['total_amount_krw']) ?? findColumn(columns, [...COLUMN_ALIASES.amount])!

  const headers: OrderHeader[] = []
  for (const row of rows) {
    const date = parseDate(row[dateCol])
    if (!date) continue
    headers.push({
      orderNo: normalizeCell(row[orderNoCol]),
      date,
      status: statusCol ? toString(row[statusCol]) : '완료',
      channel: channelCol ? toString(row[channelCol]) : '미분류',
      payment: paymentCol ? toString(row[paymentCol]) : '미분류',
      customerId: customerCol ? normalizeCell(row[customerCol]) : 'UNKNOWN',
      totalAmount: toNumber(row[amountCol]),
    })
  }
  return headers
}

function parseProducts(rows: DataRow[]): ProductRecord[] {
  const columns = Object.keys(rows[0])
  const productIdCol = findColumn(columns, [...COLUMN_ALIASES.productId])!
  const productNameCol = findColumn(columns, [...COLUMN_ALIASES.productName])
  const categoryCol = findColumn(columns, [...COLUMN_ALIASES.category])
  const brandCol = findColumn(columns, [...COLUMN_ALIASES.brand])
  const stockCol = findColumn(columns, [...COLUMN_ALIASES.stock])!
  const statusCol = findColumn(columns, [...COLUMN_ALIASES.productStatus])
  const costCol = findColumn(columns, [...COLUMN_ALIASES.cost])
  const safetyCol = findColumn(columns, [...COLUMN_ALIASES.safetyStock])

  return rows.map((row) => ({
    productId: normalizeCell(row[productIdCol]),
    productName: productNameCol ? toString(row[productNameCol]) : toString(row[productIdCol]),
    category: categoryCol ? toString(row[categoryCol]) : '미분류',
    brand: brandCol ? toString(row[brandCol]) : '미분류',
    stock: toNumber(row[stockCol]),
    safetyStock: safetyCol ? toNumber(row[safetyCol]) : 20,
    status: statusCol ? toString(row[statusCol]) : '판매중',
    unitCost: costCol ? toNumber(row[costCol]) : 0,
  }))
}

interface CustomerRecordInternal {
  customerId: string
  customerName: string
  grade: string
  region: string
}

function buildCustomerMap(customers: CustomerRecordInternal[]): Map<string, CustomerRecordInternal> {
  const map = new Map<string, CustomerRecordInternal>()
  for (const customer of customers) {
    map.set(customer.customerId, customer)
    map.set(normalizeCell(customer.customerId), customer)
  }
  return map
}

function lookupCustomer(
  map: Map<string, CustomerRecordInternal>,
  customerId: string,
): CustomerRecordInternal | undefined {
  return map.get(customerId) ?? map.get(normalizeCell(customerId))
}

function parseCustomers(rows: DataRow[]): CustomerRecordInternal[] {
  const columns = Object.keys(rows[0])
  const idCol = findColumn(columns, [...COLUMN_ALIASES.customerId])!
  const nameCol =
    columns.find((c) => normalizeCell(c) === 'customer_name') ??
    findColumn(columns, ['customer_name', ...COLUMN_ALIASES.customerName])
  const gradeCol = findColumn(columns, [...COLUMN_ALIASES.grade])
  const regionCol = findColumn(columns, [...COLUMN_ALIASES.region])

  return rows.map((row) => ({
    customerId: normalizeCell(row[idCol]),
    customerName: nameCol ? normalizeCell(row[nameCol]) : normalizeCell(row[idCol]),
    grade: gradeCol ? normalizeCell(row[gradeCol]) : '미분류',
    region: regionCol ? normalizeCell(row[regionCol]) : '미분류',
  }))
}

interface OrderItemRow {
  orderNo: string
  productId: string
  qty: number
  amount: number
}

function parseOrderItems(rows: DataRow[]): OrderItemRow[] {
  const columns = Object.keys(rows[0])
  const orderNoCol = findColumn(columns, [...COLUMN_ALIASES.orderId])!
  const productIdCol = findColumn(columns, [...COLUMN_ALIASES.productId])!
  const qtyCol = findColumn(columns, [...COLUMN_ALIASES.quantity])
  const amountCol =
    findColumn(columns, ['amount_krw']) ?? findColumn(columns, [...COLUMN_ALIASES.amount])!

  return rows
    .map((row) => ({
      orderNo: normalizeCell(row[orderNoCol]),
      productId: normalizeCell(row[productIdCol]),
      qty: qtyCol ? toNumber(row[qtyCol]) : 1,
      amount: toNumber(row[amountCol]),
    }))
    .filter((item) => item.orderNo && item.productId)
}

function parseFlatOrders(rows: DataRow[]): OrderLineItem[] {
  const columns = Object.keys(rows[0])
  const dateCol = findColumn(columns, [...COLUMN_ALIASES.orderDate])!
  const amountCol = findColumn(columns, [...COLUMN_ALIASES.amount])!
  const orderNoCol = findColumn(columns, [...COLUMN_ALIASES.orderId])
  const costCol = findColumn(columns, [...COLUMN_ALIASES.cost])
  const qtyCol = findColumn(columns, [...COLUMN_ALIASES.quantity])
  const statusCol = findColumn(columns, [...COLUMN_ALIASES.status])
  const channelCol = findColumn(columns, [...COLUMN_ALIASES.channel])
  const paymentCol = findColumn(columns, [...COLUMN_ALIASES.payment])
  const categoryCol = findColumn(columns, [...COLUMN_ALIASES.category])
  const brandCol = findColumn(columns, [...COLUMN_ALIASES.brand])
  const regionCol = findColumn(columns, [...COLUMN_ALIASES.region])
  const gradeCol = findColumn(columns, [...COLUMN_ALIASES.grade])
  const productIdCol = findColumn(columns, [...COLUMN_ALIASES.productId])
  const productNameCol = findColumn(columns, [...COLUMN_ALIASES.productName])
  const customerIdCol = findColumn(columns, [...COLUMN_ALIASES.customerId])
  const customerNameCol = findColumn(columns, [...COLUMN_ALIASES.customerName])

  const items: OrderLineItem[] = []
  for (const row of rows) {
    const date = parseDate(row[dateCol])
    if (!date) continue
    const amount = toNumber(row[amountCol])
    items.push({
      orderNo: orderNoCol ? toString(row[orderNoCol]) : `FLAT-${items.length}`,
      date,
      amount,
      cost: costCol ? toNumber(row[costCol]) : amount * 0.68,
      quantity: qtyCol ? toNumber(row[qtyCol]) : 1,
      status: statusCol ? toString(row[statusCol]) : '완료',
      channel: channelCol ? toString(row[channelCol]) : '미분류',
      payment: paymentCol ? toString(row[paymentCol]) : '미분류',
      category: categoryCol ? toString(row[categoryCol]) : '미분류',
      brand: brandCol ? toString(row[brandCol]) : '미분류',
      region: regionCol ? toString(row[regionCol]) : '미분류',
      grade: gradeCol ? toString(row[gradeCol]) : '미분류',
      productId: productIdCol ? toString(row[productIdCol]) : 'UNKNOWN',
      productName: productNameCol ? toString(row[productNameCol]) : '미상',
      customerId: customerIdCol ? toString(row[customerIdCol]) : 'UNKNOWN',
      customerName: customerNameCol ? toString(row[customerNameCol]) : '미상',
    })
  }
  return items
}

function joinErpTables(
  orderHeaders: OrderHeader[],
  orderItems: OrderItemRow[],
  products: ProductRecord[],
  customers: CustomerRecordInternal[],
): OrderLineItem[] {
  const orderMap = new Map(orderHeaders.map((o) => [o.orderNo, o]))
  const productMap = new Map(products.map((p) => [p.productId, p]))
  const customerMap = buildCustomerMap(customers)

  const lineItems: OrderLineItem[] = []

  for (const item of orderItems) {
    const order = orderMap.get(item.orderNo)
    if (!order) continue

    const product = productMap.get(item.productId)
    const customer = lookupCustomer(customerMap, order.customerId)
    const unitCost = product?.unitCost ?? 0

    lineItems.push({
      orderNo: item.orderNo,
      date: order.date,
      amount: item.amount,
      cost: unitCost > 0 ? unitCost * item.qty : item.amount * 0.68,
      quantity: item.qty,
      status: order.status,
      channel: order.channel,
      payment: order.payment,
      category: product?.category ?? '미분류',
      brand: product?.brand ?? '미분류',
      region: customer?.region ?? '미분류',
      grade: customer?.grade ?? '미분류',
      productId: item.productId,
      productName: product?.productName ?? item.productId,
      customerId: order.customerId,
      customerName: customer?.customerName ?? '미상',
    })
  }

  return lineItems
}

function extractFromDatasets(datasets: ParsedDataset[]): ErpJoinedData {
  let orderHeaders: OrderHeader[] = []
  let orderItems: OrderItemRow[] = []
  let products: ProductRecord[] = []
  let customers: CustomerRecordInternal[] = []
  let flatLineItems: OrderLineItem[] = []

  for (const { rows } of datasets) {
    if (rows.length === 0) continue
    const type = classifyDataset(rows)

    switch (type) {
      case 'orders':
        orderHeaders.push(...parseOrderHeaders(rows))
        break
      case 'items':
        orderItems.push(...parseOrderItems(rows))
        break
      case 'products':
        products.push(...parseProducts(rows))
        break
      case 'customers':
        customers.push(...parseCustomers(rows))
        break
      case 'flatOrders':
        flatLineItems.push(...parseFlatOrders(rows))
        break
    }
  }

  if (orderHeaders.length > 0 && orderItems.length > 0) {
    const lineItems = joinErpTables(orderHeaders, orderItems, products, customers)
    const productMap = new Map(products.map((p) => [p.productId, p]))
    for (const item of lineItems) {
      if (!productMap.has(item.productId)) {
        products.push({
          productId: item.productId,
          productName: item.productName,
          category: item.category,
          brand: item.brand,
          stock: 0,
          safetyStock: 20,
          status: '판매중',
          unitCost: 0,
        })
      }
    }

    return {
      lineItems,
      orderHeaders,
      products,
      customers,
      totalCustomers: customers.length || new Set(orderHeaders.map((o) => o.customerId)).size,
      isSample: false,
    }
  }

  if (flatLineItems.length > 0) {
    const headers: OrderHeader[] = flatLineItems.map((item) => ({
      orderNo: item.orderNo,
      date: item.date,
      status: item.status,
      channel: item.channel,
      payment: item.payment,
      customerId: item.customerId,
      totalAmount: item.amount,
    }))

    return {
      lineItems: flatLineItems,
      orderHeaders: headers,
      products,
      customers,
      totalCustomers: new Set(flatLineItems.map((i) => i.customerId)).size,
      isSample: false,
    }
  }

  return {
    lineItems: [],
    orderHeaders: [],
    products,
    customers,
    totalCustomers: customers.length,
    isSample: false,
  }
}

export async function joinErpData(uploadedFiles: UploadedFile[]): Promise<ErpJoinedData> {
  if (uploadedFiles.length === 0) {
    return {
      lineItems: [],
      orderHeaders: [],
      products: [],
      customers: [],
      totalCustomers: 0,
      isSample: false,
    }
  }

  const files = uploadedFiles.map((f) => f.file)
  const datasets = await parseAllUploadedFiles(files)
  const joined = extractFromDatasets(datasets)
  joined.isSample = uploadedFiles.some((f) => f.isSample)
  return joined
}
