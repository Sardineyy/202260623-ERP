import { useCallback, useState } from 'react'
import Navbar from './components/Navbar'
import DataInputPage from './pages/DataInputPage'
import PlaceholderPage from './pages/PlaceholderPage'
import ReportPage from './pages/ReportPage'
import type { TabId, UploadedFile } from './types'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('data-input')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const handleFilesAdded = useCallback((files: File[]) => {
    const newFiles: UploadedFile[] = files.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      uploadedAt: new Date(),
    }))
    setUploadedFiles((prev) => [...prev, ...newFiles])
  }, [])

  const handleRemoveFile = useCallback((id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const renderContent = () => {
    switch (activeTab) {
      case 'data-input':
        return (
          <DataInputPage
            uploadedFiles={uploadedFiles}
            onFilesAdded={handleFilesAdded}
            onRemoveFile={handleRemoveFile}
          />
        )
      case 'dashboard':
        return (
          <PlaceholderPage
            title="대시보드"
            description="업로드된 ERP 데이터를 기반으로 한 핵심 지표와 차트가 이곳에 표시됩니다."
            icon="dashboard"
          />
        )
      case 'report':
        return <ReportPage uploadedFiles={uploadedFiles} />
      case 'raw-data':
        return (
          <PlaceholderPage
            title="원본 데이터"
            description={
              uploadedFiles.length > 0
                ? `현재 ${uploadedFiles.length}개의 원본 파일이 업로드되어 있습니다.`
                : '데이터 입력 탭에서 원본 소스를 업로드하면 이곳에서 확인할 수 있습니다.'
            }
            icon="data"
          />
        )
    }
  }

  return (
    <div className="app">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="app__main">{renderContent()}</main>
    </div>
  )
}

export default App
