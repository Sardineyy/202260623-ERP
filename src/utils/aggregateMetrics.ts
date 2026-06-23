import type { ErpMetrics, FileMetrics, NumericAggregate, UploadedFile } from '../types'
import { joinErpData } from './erpDataJoin'
import { parseUploadedFile } from './fileParser'

function isNumeric(value: unknown): value is number {
  if (typeof value === 'number' && !Number.isNaN(value)) return true
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value.replace(/,/g, ''))
    return !Number.isNaN(n)
  }
  return false
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  return Number(String(value).replace(/,/g, ''))
}

function aggregateNumeric(values: number[]): NumericAggregate {
  const sum = values.reduce((a, b) => a + b, 0)
  return {
    sum,
    avg: values.length > 0 ? sum / values.length : 0,
    min: values.length > 0 ? Math.min(...values) : 0,
    max: values.length > 0 ? Math.max(...values) : 0,
    count: values.length,
  }
}

function buildFileMetrics(fileName: string, rows: Record<string, unknown>[]): FileMetrics {
  if (rows.length === 0) {
    return {
      fileName,
      rowCount: 0,
      columns: [],
      numericAggregates: {},
      categoryBreakdowns: {},
    }
  }

  const columns = Object.keys(rows[0])
  const numericAggregates: Record<string, NumericAggregate> = {}
  const categoryBreakdowns: Record<string, Record<string, number>> = {}

  for (const col of columns) {
    const values = rows.map((r) => r[col])
    const numericValues = values.filter(isNumeric).map(toNumber)

    if (numericValues.length > rows.length * 0.5) {
      numericAggregates[col] = aggregateNumeric(numericValues)
    } else {
      const breakdown: Record<string, number> = {}
      for (const v of values) {
        const key = String(v ?? '(빈값)')
        breakdown[key] = (breakdown[key] ?? 0) + 1
      }
      const uniqueCount = Object.keys(breakdown).length
      if (uniqueCount > 1 && uniqueCount <= 50) {
        categoryBreakdowns[col] = breakdown
      }
    }
  }

  return {
    fileName,
    rowCount: rows.length,
    columns,
    numericAggregates,
    categoryBreakdowns,
  }
}

function buildHighlights(files: FileMetrics[]): string[] {
  const highlights: string[] = []

  for (const f of files) {
    highlights.push(`${f.fileName}: ${f.rowCount.toLocaleString('ko-KR')}건`)

    const topNumeric = Object.entries(f.numericAggregates)
      .sort(([, a], [, b]) => b.sum - a.sum)
      .slice(0, 3)

    for (const [col, agg] of topNumeric) {
      highlights.push(
        `${f.fileName} · ${col} 합계 ${agg.sum.toLocaleString('ko-KR')} (평균 ${agg.avg.toLocaleString('ko-KR', { maximumFractionDigits: 2 })})`,
      )
    }
  }

  return highlights
}

function buildErpHighlights(
  joined: Awaited<ReturnType<typeof joinErpData>>,
  fileMetrics: FileMetrics[],
): string[] {
  const highlights = buildHighlights(fileMetrics)

  if (joined.lineItems.length === 0) return highlights

  const validItems = joined.lineItems.filter(
    (i) => !['취소', '반품'].some((s) => i.status.includes(s)),
  )
  const netSales = validItems.reduce((s, i) => s + i.amount, 0)
  const cogs = validItems.reduce((s, i) => s + i.cost, 0)

  return [
    `주문 ${joined.orderHeaders.length.toLocaleString('ko-KR')}건 · 상품 ${joined.products.length.toLocaleString('ko-KR')}개 · 고객 ${joined.totalCustomers.toLocaleString('ko-KR')}명`,
    `유효매출 ₩${Math.round(netSales).toLocaleString('ko-KR')} · 매출원가 ₩${Math.round(cogs).toLocaleString('ko-KR')}`,
    `매출총이익 ₩${Math.round(netSales - cogs).toLocaleString('ko-KR')} · 이익률 ${netSales > 0 ? (((netSales - cogs) / netSales) * 100).toFixed(1) : 0}%`,
    ...highlights.slice(0, 5),
  ]
}

export async function aggregateErpMetrics(uploadedFiles: UploadedFile[]): Promise<ErpMetrics> {
  const files: FileMetrics[] = []
  const joined = await joinErpData(uploadedFiles)

  for (const { file } of uploadedFiles) {
    const datasets = await parseUploadedFile(file)
    for (const { source, rows } of datasets) {
      files.push(buildFileMetrics(source, rows))
    }
  }

  const totalRecords = files.reduce((sum, f) => sum + f.rowCount, 0)

  return {
    generatedAt: new Date().toISOString(),
    totalRecords,
    files,
    highlights: buildErpHighlights(joined, files),
  }
}
