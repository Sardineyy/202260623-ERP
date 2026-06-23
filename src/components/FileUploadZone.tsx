import { useCallback, useRef, useState } from 'react'
import type { UploadedFile } from '../types'
import './FileUploadZone.css'

interface FileUploadZoneProps {
  onFilesAdded: (files: File[]) => void
  uploadedFiles: UploadedFile[]
  onRemoveFile: (id: string) => void
}

const ACCEPTED_TYPES = '.csv,.xlsx,.xls,.json,.txt,.xml'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(date: Date): string {
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function FileUploadZone({
  onFilesAdded,
  uploadedFiles,
  onRemoveFile,
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return
      onFilesAdded(Array.from(fileList))
    },
    [onFilesAdded],
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleZoneClick = () => {
    inputRef.current?.click()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    e.target.value = ''
  }

  return (
    <div className="file-upload-section">
      <div
        className={`upload-zone ${isDragging ? 'upload-zone--dragging' : ''}`}
        onClick={handleZoneClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleZoneClick()
          }
        }}
        aria-label="파일 업로드 영역"
      >
        <input
          ref={inputRef}
          type="file"
          className="upload-zone__input"
          accept={ACCEPTED_TYPES}
          multiple
          onChange={handleInputChange}
          aria-hidden="true"
        />

        <div className="upload-zone__icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <rect x="6" y="10" width="36" height="28" rx="4" stroke="currentColor" strokeWidth="2" />
            <path
              d="M24 18v12M18 24h12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <p className="upload-zone__title">
          {isDragging ? '여기에 파일을 놓으세요' : '원본 소스를 업로드하세요'}
        </p>
        <p className="upload-zone__hint">
          파일을 드래그 앤 드롭하거나 <span className="upload-zone__link">클릭하여 탐색</span>하세요
        </p>
        <p className="upload-zone__formats">CSV, Excel, JSON, TXT, XML 지원</p>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files">
          <h3 className="uploaded-files__title">
            업로드된 파일 <span className="uploaded-files__count">{uploadedFiles.length}</span>
          </h3>
          <ul className="uploaded-files__list">
            {uploadedFiles.map((item) => (
              <li key={item.id} className="uploaded-file-item">
                <div className="uploaded-file-item__icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M4 2h8l4 4v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path d="M12 2v4h4" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
                <div className="uploaded-file-item__info">
                  <span className="uploaded-file-item__name">{item.file.name}</span>
                  <span className="uploaded-file-item__meta">
                    {formatFileSize(item.file.size)} · {formatDate(item.uploadedAt)}
                  </span>
                </div>
                <button
                  className="uploaded-file-item__remove"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveFile(item.id)
                  }}
                  aria-label={`${item.file.name} 삭제`}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M4 4l8 8M12 4l-8 8"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
