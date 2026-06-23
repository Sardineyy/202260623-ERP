import { useCallback, useState } from 'react'

import Navbar from './components/Navbar'

import DataInputPage from './pages/DataInputPage'

import PlaceholderPage from './pages/PlaceholderPage'

import DashboardPage from './pages/DashboardPage'

import ReportPage from './pages/ReportPage'

import { fetchSampleDataFiles } from './services/sampleData'
import { matchErpFileKey } from './constants/erpFiles'
import type { TabId, UploadedFile } from './types'

import './App.css'



function App() {

  const [activeTab, setActiveTab] = useState<TabId>('data-input')

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const [isLoadingSample, setIsLoadingSample] = useState(false)

  const [sampleError, setSampleError] = useState<string | null>(null)



  const handleFilesAdded = useCallback((files: File[]) => {
    const newFiles: UploadedFile[] = files.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      uploadedAt: new Date(),
    }))

    setUploadedFiles((prev) => {
      const merged = [...prev]
      for (const newFile of newFiles) {
        const key = matchErpFileKey(newFile.file.name)
        if (key) {
          const idx = merged.findIndex((f) => matchErpFileKey(f.file.name) === key)
          if (idx >= 0) merged.splice(idx, 1)
        }
        merged.push(newFile)
      }
      return merged
    })
  }, [])



  const handleLoadSampleData = useCallback(async () => {

    setIsLoadingSample(true)

    setSampleError(null)

    try {

      const files = await fetchSampleDataFiles()

      const sampleFiles: UploadedFile[] = files.map((file) => ({

        id: `sample-${file.name}`,

        file,

        uploadedAt: new Date(),

        isSample: true,

      }))

      setUploadedFiles(sampleFiles)

    } catch (err) {

      setSampleError(err instanceof Error ? err.message : '샘플 데이터를 불러오지 못했습니다.')

    } finally {

      setIsLoadingSample(false)

    }

  }, [])



  const renderContent = () => {

    switch (activeTab) {

      case 'data-input':

        return (

          <>

            {sampleError && (

              <div className="app__error-banner" role="alert">

                {sampleError}

              </div>

            )}

            <DataInputPage
              uploadedFiles={uploadedFiles}
              onFilesAdded={handleFilesAdded}
              onLoadSampleData={handleLoadSampleData}
              isLoadingSample={isLoadingSample}
            />

          </>

        )

      case 'dashboard':

        return <DashboardPage uploadedFiles={uploadedFiles} />

      case 'report':

        return <ReportPage uploadedFiles={uploadedFiles} />

      case 'raw-data':

        return (

          <PlaceholderPage

            title="원본 데이터"

            description={

              uploadedFiles.length > 0

                ? `현재 ${uploadedFiles.length}개의 원본 파일이 업로드되어 있습니다.${uploadedFiles.some((f) => f.isSample) ? ' (샘플 데이터)' : ''}`

                : '데이터 입력 탭에서 원본 소스를 업로드하거나 샘플 데이터를 불러오세요.'

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

