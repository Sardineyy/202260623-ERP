import type { ErpFileKey } from '../constants/erpFiles'
import { ERP_FILES, matchErpFileKey } from '../constants/erpFiles'
import type { UploadedFile } from '../types'
import { parseUploadedFile, type DataRow } from './fileParser'

export interface RawDataTable {
  key: ErpFileKey
  label: string
  filename: string
  columns: string[]
  rows: DataRow[]
  rowCount: number
  previewRows: DataRow[]
  isSample: boolean
}

const PREVIEW_LIMIT = 15

function formatCellValue(value: unknown): string {
  if (value == null || value === '') return '-'
  if (typeof value === 'number') return value.toLocaleString('ko-KR')
  return String(value)
}

export { formatCellValue }

export async function loadRawDataTables(uploadedFiles: UploadedFile[]): Promise<RawDataTable[]> {
  const fileByKey = new Map<ErpFileKey, UploadedFile>()
  for (const uploaded of uploadedFiles) {
    const key = matchErpFileKey(uploaded.file.name)
    if (key) fileByKey.set(key, uploaded)
  }

  const tables: RawDataTable[] = []

  for (const def of ERP_FILES) {
    const uploaded = fileByKey.get(def.key)
    if (!uploaded) {
      tables.push({
        key: def.key,
        label: def.label,
        filename: def.filename,
        columns: [],
        rows: [],
        rowCount: 0,
        previewRows: [],
        isSample: false,
      })
      continue
    }

    const datasets = await parseUploadedFile(uploaded.file)
    const rows = datasets.flatMap((d) => d.rows)
    const columns = rows.length > 0 ? Object.keys(rows[0]) : []

    tables.push({
      key: def.key,
      label: def.label,
      filename: uploaded.file.name,
      columns,
      rows,
      rowCount: rows.length,
      previewRows: rows.slice(0, PREVIEW_LIMIT),
      isSample: uploaded.isSample ?? false,
    })
  }

  return tables
}

export function getTotalRawRowCount(tables: RawDataTable[]): number {
  return tables.reduce((sum, t) => sum + t.rowCount, 0)
}
