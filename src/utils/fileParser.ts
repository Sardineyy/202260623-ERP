import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export type DataRow = Record<string, unknown>

export interface ParsedDataset {
  source: string
  rows: DataRow[]
}

async function parseCsv(file: File): Promise<DataRow[]> {
  const text = await file.text()
  const result = Papa.parse<DataRow>(text, { header: true, skipEmptyLines: true })
  return result.data
}

async function parseJson(file: File): Promise<DataRow[]> {
  const text = await file.text()
  const parsed = JSON.parse(text) as unknown
  if (Array.isArray(parsed)) return parsed as DataRow[]
  if (parsed && typeof parsed === 'object') return [parsed as DataRow]
  return []
}

async function parseExcelSheets(file: File): Promise<ParsedDataset[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  return workbook.SheetNames.map((name) => ({
    source: `${file.name}::${name}`,
    rows: XLSX.utils.sheet_to_json<DataRow>(workbook.Sheets[name]),
  }))
}

export async function parseUploadedFile(file: File): Promise<ParsedDataset[]> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''

  switch (ext) {
    case 'csv':
    case 'txt':
      return [{ source: file.name, rows: await parseCsv(file) }]
    case 'json':
      return [{ source: file.name, rows: await parseJson(file) }]
    case 'xlsx':
    case 'xls':
      return parseExcelSheets(file)
    default:
      try {
        return [{ source: file.name, rows: await parseCsv(file) }]
      } catch {
        return [{ source: file.name, rows: [] }]
      }
  }
}

export async function parseAllUploadedFiles(files: File[]): Promise<ParsedDataset[]> {
  const datasets: ParsedDataset[] = []
  for (const file of files) {
    datasets.push(...(await parseUploadedFile(file)))
  }
  return datasets
}
