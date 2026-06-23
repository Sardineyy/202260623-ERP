import { useCallback, useEffect, useState } from 'react'
import type { UploadedFile } from '../types'
import { ERP_FILES, type ErpFileKey } from '../constants/erpFiles'
import {
  validateAllErpFiles,
  type FileValidationResult,
  type ValidationStatus,
} from '../utils/csvValidation'
import './FileStatusBar.css'

interface FileStatusBarProps {
  uploadedFiles: UploadedFile[]
}

function StatusIcon({ status }: { status: ValidationStatus }) {
  if (status === 'valid') {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5.5 9l2.5 2.5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (status === 'error') {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 6l6 6M12 6l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }
  if (status === 'validating') {
    return <span className="file-status__spinner" aria-hidden="true" />
  }
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function statusLabel(status: ValidationStatus, rowCount?: number): string {
  switch (status) {
    case 'valid':
      return rowCount ? `${rowCount.toLocaleString('ko-KR')}행` : '완료'
    case 'validating':
      return '검사 중...'
    case 'error':
      return '오류'
    default:
      return '미업로드'
  }
}

export default function FileStatusBar({ uploadedFiles }: FileStatusBarProps) {
  const [results, setResults] = useState<FileValidationResult[]>(
    ERP_FILES.map((f) => ({ key: f.key, status: 'idle' as ValidationStatus })),
  )
  const [integrityError, setIntegrityError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  const runValidation = useCallback(async () => {
    if (uploadedFiles.length === 0) {
      setResults(ERP_FILES.map((f) => ({ key: f.key, status: 'idle' as ValidationStatus })))
      setIntegrityError(null)
      return
    }

    setIsValidating(true)
    setResults(ERP_FILES.map((f) => ({ key: f.key, status: 'validating' as ValidationStatus })))

    const { results: validationResults, integrityError: integrity } =
      await validateAllErpFiles(uploadedFiles)

    setResults(validationResults)
    setIntegrityError(integrity)
    setIsValidating(false)
  }, [uploadedFiles])

  useEffect(() => {
    runValidation()
  }, [runValidation])

  const resultMap = new Map<ErpFileKey, FileValidationResult>(
    results.map((r) => [r.key, r]),
  )

  return (
    <div className="file-status-wrap">
      <div className="file-status-bar">
        {ERP_FILES.map((file) => {
          const result =
            resultMap.get(file.key) ?? { key: file.key, status: 'idle' as ValidationStatus }
          const displayStatus = isValidating ? 'validating' : result.status

          return (
            <div
              key={file.key}
              className={`file-status file-status--${displayStatus}`}
              title={result.message}
            >
              <div className="file-status__header">
                <span className="file-status__label">{file.label}</span>
                <span className={`file-status__icon file-status__icon--${displayStatus}`}>
                  <StatusIcon status={displayStatus} />
                </span>
              </div>
              <span className="file-status__state">
                {statusLabel(displayStatus, result.rowCount)}
              </span>
              {result.message && displayStatus === 'error' && (
                <span className="file-status__error">{result.message}</span>
              )}
            </div>
          )
        })}
      </div>

      {integrityError && (
        <div className="file-status-integrity" role="alert">
          <strong>참조 무결성 오류:</strong> {integrityError}
        </div>
      )}
    </div>
  )
}
