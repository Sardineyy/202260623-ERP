import { useCallback, useRef, useState } from 'react'
import { ERP_FILE_NAMES } from '../constants/erpFiles'
import './FileUploadZone.css'

interface FileUploadZoneProps {
  onFilesAdded: (files: File[]) => void
}

export default function FileUploadZone({ onFilesAdded }: FileUploadZoneProps) {
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
      aria-label="ERP CSV 파일 업로드"
    >
      <input
        ref={inputRef}
        type="file"
        className="upload-zone__input"
        accept=".csv"
        multiple
        onChange={handleInputChange}
        aria-hidden="true"
      />

      <div className="upload-zone__icon">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <path
            d="M20 6v20M12 14l8-8 8 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 28v4a2 2 0 002 2h20a2 2 0 002-2v-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <p className="upload-zone__title">
        {isDragging ? '여기에 파일을 놓으세요' : '4개의 ERP CSV 파일을 끌어다 놓거나 클릭하여 업로드'}
      </p>
      <p className="upload-zone__hint">
        {ERP_FILE_NAMES.join(', ')}
        <span className="upload-zone__hint-sub"> (한 번에 여러 개 선택 가능)</span>
      </p>
    </div>
  )
}
