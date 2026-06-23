import { useCallback, useEffect, useState } from 'react'
import type { UploadedFile } from '../types'
import {
  formatCellValue,
  getTotalRawRowCount,
  loadRawDataTables,
  type RawDataTable,
} from '../utils/rawDataLoader'
import './RawDataPage.css'

interface RawDataPageProps {
  uploadedFiles: UploadedFile[]
}

export default function RawDataPage({ uploadedFiles }: RawDataPageProps) {
  const [tables, setTables] = useState<RawDataTable[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await loadRawDataTables(uploadedFiles)
      setTables(result)
    } finally {
      setLoading(false)
    }
  }, [uploadedFiles])

  useEffect(() => {
    loadData()
  }, [loadData])

  const hasData = uploadedFiles.length > 0 && tables.some((t) => t.rowCount > 0)
  const isSample = uploadedFiles.some((f) => f.isSample)
  const totalRows = getTotalRawRowCount(tables)

  if (loading) {
    return (
      <div className="page raw-data-page">
        <div className="raw-data-page__loading">원본 데이터를 불러오는 중...</div>
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className="page raw-data-page">
        <div className="raw-data-page__empty">
          <h2 className="raw-data-page__empty-title">원본 데이터가 없습니다</h2>
          <p className="raw-data-page__empty-desc">
            데이터 입력 탭에서 ERP CSV 파일을 업로드하거나 샘플 데이터를 불러오세요.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page raw-data-page">
      <header className="raw-data-page__header">
        <div>
          <h2 className="raw-data-page__title">원본 데이터</h2>
          <p className="raw-data-page__desc">
            업로드된 ERP 소스 파일의 원본 레코드를 테이블별로 확인할 수 있습니다.
          </p>
        </div>
        <div className="raw-data-page__meta">
          {isSample && <span className="raw-data-page__badge">샘플 데이터</span>}
          <span>총 {totalRows.toLocaleString('ko-KR')}행 · {uploadedFiles.length}개 파일</span>
        </div>
      </header>

      <div className="raw-data-page__tables">
        {tables.map((table) => (
          <section key={table.key} className="raw-data-table-card">
            <div className="raw-data-table-card__header">
              <div>
                <h3 className="raw-data-table-card__title">{table.label}</h3>
                <p className="raw-data-table-card__file">{table.filename}</p>
              </div>
              <div className="raw-data-table-card__stats">
                <span>{table.rowCount.toLocaleString('ko-KR')}행</span>
                <span>{table.columns.length}개 컬럼</span>
              </div>
            </div>

            {table.rowCount === 0 ? (
              <p className="raw-data-table-card__empty">파일이 업로드되지 않았습니다.</p>
            ) : (
              <>
                <p className="raw-data-table-card__preview-note">
                  상위 {Math.min(table.previewRows.length, table.rowCount)}행 미리보기
                  {table.rowCount > table.previewRows.length &&
                    ` (전체 ${table.rowCount.toLocaleString('ko-KR')}행)`}
                </p>
                <div className="raw-data-table-card__scroll">
                  <table className="raw-data-table">
                    <thead>
                      <tr>
                        <th className="raw-data-table__index">#</th>
                        {table.columns.map((col) => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.previewRows.map((row, idx) => (
                        <tr key={idx}>
                          <td className="raw-data-table__index">{idx + 1}</td>
                          {table.columns.map((col) => (
                            <td key={col}>{formatCellValue(row[col])}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
