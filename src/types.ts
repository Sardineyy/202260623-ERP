export type TabId = 'data-input' | 'dashboard' | 'report' | 'raw-data'

export interface UploadedFile {
  id: string
  file: File
  uploadedAt: Date
  isSample?: boolean
}

export interface NumericAggregate {
  sum: number
  avg: number
  min: number
  max: number
  count: number
}

export interface FileMetrics {
  fileName: string
  rowCount: number
  columns: string[]
  numericAggregates: Record<string, NumericAggregate>
  categoryBreakdowns: Record<string, Record<string, number>>
}

export interface ErpMetrics {
  generatedAt: string
  totalRecords: number
  files: FileMetrics[]
  highlights: string[]
}

export interface AnalysisReport {
  content: string
  generatedAt: string
  model: string
}
