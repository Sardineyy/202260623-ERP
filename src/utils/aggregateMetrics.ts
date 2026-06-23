import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type { ErpMetrics, FileMetrics, NumericAggregate, UploadedFile } from '../types'

type Row = Record<string, unknown>

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

function buildFileMetrics(fileName: string, rows: Row[]): FileMetrics {
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

async function parseCsv(file: File): Promise<Row[]> {
  const text = await file.text()
  const result = Papa.parse<Row>(text, { header: true, skipEmptyLines: true })
  return result.data
}

async function parseJson(file: File): Promise<Row[]> {
  const text = await file.text()
  const parsed = JSON.parse(text) as unknown
  if (Array.isArray(parsed)) return parsed as Row[]
  if (parsed && typeof parsed === 'object') return [parsed as Row]
  return []
}

async function parseExcel(file: File): Promise<Row[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return []
  const sheet = workbook.Sheets[sheetName]
  return XLSX.utils.sheet_to_json<Row>(sheet)
}

async function parseFile(file: File): Promise<Row[]> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''

  switch (ext) {
    case 'csv':
    case 'txt':
      return parseCsv(file)
    case 'json':
      return parseJson(file)
    case 'xlsx':
    case 'xls':
      return parseExcel(file)
    default:
      try {
        return await parseCsv(file)
      } catch {
        return []
      }
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

export async function aggregateErpMetrics(uploadedFiles: UploadedFile[]): Promise<ErpMetrics> {
  const files: FileMetrics[] = []

  for (const { file } of uploadedFiles) {
    const rows = await parseFile(file)
    files.push(buildFileMetrics(file.name, rows))
  }

  const totalRecords = files.reduce((sum, f) => sum + f.rowCount, 0)

  return {
    generatedAt: new Date().toISOString(),
    totalRecords,
    files,
    highlights: buildHighlights(files),
  }
}
