import { ERP_FILES } from '../constants/erpFiles'

export const SAMPLE_DATA_FILES = ERP_FILES.map((f) => ({
  name: f.filename,
  label: f.label,
}))
export async function fetchSampleDataFiles(): Promise<File[]> {
  const files: File[] = []

  for (const { name } of SAMPLE_DATA_FILES) {
    const response = await fetch(`/sample-data/${name}`)
    if (!response.ok) {
      throw new Error(`샘플 파일(${name})을 불러올 수 없습니다.`)
    }
    const blob = await response.blob()
    files.push(new File([blob], name, { type: 'text/csv' }))
  }

  return files
}
