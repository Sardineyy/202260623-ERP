import FileUploadZone from '../components/FileUploadZone'
import FileStatusBar from '../components/FileStatusBar'
import { WORKFLOW_STEPS } from '../constants/erpFiles'
import type { UploadedFile } from '../types'
import './DataInputPage.css'

interface DataInputPageProps {
  uploadedFiles: UploadedFile[]
  onFilesAdded: (files: File[]) => void
  onLoadSampleData: () => void
  isLoadingSample: boolean
}

export default function DataInputPage({
  uploadedFiles,
  onFilesAdded,
  onLoadSampleData,
  isLoadingSample,
}: DataInputPageProps) {
  return (
    <div className="page data-input-page">
      <header className="data-input-page__header">
        <h2 className="data-input-page__title">ERP 데이터 입력</h2>
        <p className="data-input-page__desc">
          4개의 CSV(상품·고객·주문·주문상세)를 업로드하거나 샘플 데이터를 불러오세요.
          입력 즉시 유효성 검사를 수행합니다.
        </p>
      </header>

      <section className="data-input-page__upload">
        <FileUploadZone onFilesAdded={onFilesAdded} />
      </section>

      <section className="data-input-page__status">
        <FileStatusBar uploadedFiles={uploadedFiles} />
      </section>

      <section className="sample-banner">
        <p className="sample-banner__text">
          처음이신가요? 내장된 샘플 ERP 데이터(2023~2025, 약 2.3만 행)를 불러와 바로 체험해 보세요.
        </p>
        <button
          className="sample-banner__btn"
          onClick={onLoadSampleData}
          disabled={isLoadingSample}
        >
          {isLoadingSample ? '불러오는 중...' : '샘플 데이터 불러오기'}
        </button>
      </section>

      <section className="workflow-section">
        <div className="workflow-grid">
          {WORKFLOW_STEPS.map((step, index) => (
            <div key={step.title} className="workflow-card">
              <span className="workflow-card__step">{index + 1}</span>
              <h3 className="workflow-card__title">{step.title}</h3>
              <p className="workflow-card__desc">{step.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
