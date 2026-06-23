import { useCallback, useEffect, useRef, useState } from 'react'
import type { AnalysisReport, ErpMetrics, UploadedFile } from '../types'
import { aggregateErpMetrics } from '../utils/aggregateMetrics'
import { generateAnalysisReport } from '../services/reportApi'
import { downloadReportAsPdf, downloadReportAsWord } from '../utils/exportReport'
import './ReportPage.css'

interface ReportPageProps {
  uploadedFiles: UploadedFile[]
}

function formatNumber(n: number): string {
  return n.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
}

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hulo])/gm, (line) => (line.trim() ? `<p>${line}</p>` : ''))
}

export default function ReportPage({ uploadedFiles }: ReportPageProps) {
  const [metrics, setMetrics] = useState<ErpMetrics | null>(null)
  const [report, setReport] = useState<AnalysisReport | null>(null)
  const [isAggregating, setIsAggregating] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [isDownloadingWord, setIsDownloadingWord] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reportContentRef = useRef<HTMLDivElement>(null)

  const loadMetrics = useCallback(async () => {
    if (uploadedFiles.length === 0) {
      setMetrics(null)
      return
    }
    setIsAggregating(true)
    setError(null)
    try {
      const result = await aggregateErpMetrics(uploadedFiles)
      setMetrics(result)
    } catch {
      setError('데이터 집계 중 오류가 발생했습니다.')
    } finally {
      setIsAggregating(false)
    }
  }, [uploadedFiles])

  useEffect(() => {
    loadMetrics()
  }, [loadMetrics])

  const handleGenerate = async () => {
    if (!metrics) return
    setIsGenerating(true)
    setError(null)
    try {
      const result = await generateAnalysisReport(metrics)
      setReport(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '보고서 생성에 실패했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerate = async () => {
    setReport(null)
    await handleGenerate()
  }

  const handleDownloadPdf = async () => {
    if (!report || !reportContentRef.current) return
    setIsDownloadingPdf(true)
    setError(null)
    try {
      await downloadReportAsPdf(reportContentRef.current)
    } catch {
      setError('PDF 다운로드 중 오류가 발생했습니다.')
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  const handleDownloadWord = async () => {
    if (!report) return
    setIsDownloadingWord(true)
    setError(null)
    try {
      await downloadReportAsWord(report.content, report.generatedAt)
    } catch {
      setError('Word 다운로드 중 오류가 발생했습니다.')
    } finally {
      setIsDownloadingWord(false)
    }
  }

  if (uploadedFiles.length === 0) {
    return (
      <div className="page report-page">
        <div className="report-page__empty">
          <div className="report-page__empty-icon" aria-hidden="true">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <rect x="12" y="6" width="40" height="52" rx="4" stroke="currentColor" strokeWidth="2" />
              <path d="M20 22h24M20 32h24M20 42h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="report-page__empty-title">분석할 데이터가 없습니다</h2>
          <p className="report-page__empty-desc">
            데이터 입력 탭에서 「샘플 데이터 불러오기」를 클릭하거나 ERP 원본 소스를 업로드한 후 분석 보고서를
            생성할 수 있습니다.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page report-page">
      <div className="page__header report-page__header">
        <div>
          <h2 className="page__title">분석보고서</h2>
          <p className="page__description">
            집계된 ERP 지표를 Gemini 2.5 Flash AI가 분석하여 보고서를 생성합니다.
          </p>
        </div>
        <button
          className="report-page__generate-btn"
          onClick={handleGenerate}
          disabled={isAggregating || isGenerating || !metrics}
        >
          {isGenerating ? (
            <>
              <span className="report-page__spinner" aria-hidden="true" />
              AI 분석 중...
            </>
          ) : (
            'AI 보고서 생성'
          )}
        </button>
      </div>

      {error && (
        <div className="report-page__error" role="alert">
          {error}
        </div>
      )}

      {isAggregating && (
        <div className="report-page__loading">데이터 집계 중...</div>
      )}

      {metrics && !isAggregating && (
        <section className="metrics-summary">
          <h3 className="metrics-summary__title">집계 지표 요약</h3>
          <div className="metrics-summary__cards">
            <div className="metrics-card">
              <span className="metrics-card__label">총 레코드</span>
              <span className="metrics-card__value">{formatNumber(metrics.totalRecords)}</span>
            </div>
            <div className="metrics-card">
              <span className="metrics-card__label">소스 파일</span>
              <span className="metrics-card__value">{metrics.files.length}개</span>
            </div>
            <div className="metrics-card">
              <span className="metrics-card__label">집계 시각</span>
              <span className="metrics-card__value metrics-card__value--sm">
                {new Date(metrics.generatedAt).toLocaleString('ko-KR')}
              </span>
            </div>
          </div>

          {metrics.highlights.length > 0 && (
            <ul className="metrics-summary__highlights">
              {metrics.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          )}

          {metrics.files.map((file) => (
            <details key={file.fileName} className="metrics-detail">
              <summary>{file.fileName} — {formatNumber(file.rowCount)}건</summary>
              <div className="metrics-detail__body">
                <p className="metrics-detail__cols">컬럼: {file.columns.join(', ')}</p>
                {Object.entries(file.numericAggregates).length > 0 && (
                  <table className="metrics-table">
                    <thead>
                      <tr>
                        <th>지표</th>
                        <th>합계</th>
                        <th>평균</th>
                        <th>최소</th>
                        <th>최대</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(file.numericAggregates).map(([col, agg]) => (
                        <tr key={col}>
                          <td>{col}</td>
                          <td>{formatNumber(agg.sum)}</td>
                          <td>{formatNumber(agg.avg)}</td>
                          <td>{formatNumber(agg.min)}</td>
                          <td>{formatNumber(agg.max)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </details>
          ))}
        </section>
      )}

      {report && (
        <section className="report-content">
          <div className="report-content__toolbar">
            <div className="report-content__meta">
              <span>Gemini {report.model}</span>
              <span>{new Date(report.generatedAt).toLocaleString('ko-KR')} 생성</span>
            </div>
            <div className="report-content__actions">
              <button
                className="report-action-btn report-action-btn--primary"
                onClick={handleRegenerate}
                disabled={isGenerating || isAggregating || !metrics}
              >
                {isGenerating ? (
                  <>
                    <span className="report-page__spinner" aria-hidden="true" />
                    재생성 중...
                  </>
                ) : (
                  '보고서 재생성'
                )}
              </button>
              <button
                className="report-action-btn"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf || isGenerating}
              >
                {isDownloadingPdf ? 'PDF 생성 중...' : 'PDF 다운로드'}
              </button>
              <button
                className="report-action-btn"
                onClick={handleDownloadWord}
                disabled={isDownloadingWord || isGenerating}
              >
                {isDownloadingWord ? 'Word 생성 중...' : 'Word 다운로드'}
              </button>
            </div>
          </div>
          <div
            ref={reportContentRef}
            className="report-content__body"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(report.content) }}
          />
        </section>
      )}
    </div>
  )
}
