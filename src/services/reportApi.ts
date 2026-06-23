import type { AnalysisReport, ErpMetrics } from '../types'

export async function generateAnalysisReport(metrics: ErpMetrics): Promise<AnalysisReport> {
  const response = await fetch('/api/generate-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metrics }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '보고서 생성에 실패했습니다.' }))
    throw new Error(error.message ?? `서버 오류 (${response.status})`)
  }

  return response.json()
}
