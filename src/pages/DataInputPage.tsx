import FileUploadZone from '../components/FileUploadZone'
import type { UploadedFile } from '../types'
import './DataInputPage.css'

interface DataInputPageProps {
  uploadedFiles: UploadedFile[]
  onFilesAdded: (files: File[]) => void
  onRemoveFile: (id: string) => void
}

export default function DataInputPage({
  uploadedFiles,
  onFilesAdded,
  onRemoveFile,
}: DataInputPageProps) {
  return (
    <div className="page data-input-page">
      <div className="page__header">
        <h2 className="page__title">데이터 입력</h2>
        <p className="page__description">
          ERP 원본 소스 파일을 업로드하여 분석을 시작하세요.
        </p>
      </div>

      <FileUploadZone
        onFilesAdded={onFilesAdded}
        uploadedFiles={uploadedFiles}
        onRemoveFile={onRemoveFile}
      />
    </div>
  )
}
