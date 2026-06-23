import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GoogleGenerativeAI } from '@google/generative-ai'

const MODEL = 'gemini-2.5-flash'

function buildPrompt(metrics: unknown): string {
  return `당신은 ERP 데이터 분석 전문가입니다.
아래 집계된 ERP 지표 데이터를 바탕으로 경영진이 읽기 쉬운 한국어 분석 보고서를 작성하세요.

## 작성 지침
- 마크다운 형식으로 작성
- 다음 섹션을 반드시 포함:
  1. **요약** (Executive Summary) — 핵심 인사이트 3~5개
  2. **데이터 개요** — 파일별 레코드 수, 주요 컬럼 설명
  3. **주요 지표 분석** — 수치형 지표의 합계·평균·추이 해석
  4. **카테고리별 분석** — 범주형 데이터 분포 및 특이사항
  5. **리스크 및 이상 징후** — 데이터에서 발견되는 주의 사항
  6. **권고 사항** — 실행 가능한 개선 제안 3~5개
- 구체적인 수치를 인용하여 분석의 신뢰성을 높이세요
- 데이터에 없는 내용은 추측하지 말고, "데이터 부족"으로 명시하세요

## 집계 지표 데이터
\`\`\`json
${JSON.stringify(metrics, null, 2)}
\`\`\`
`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'POST 메서드만 지원합니다.' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({
      message: 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다. Vercel 대시보드에서 설정해 주세요.',
    })
  }

  const { metrics } = req.body ?? {}
  if (!metrics) {
    return res.status(400).json({ message: '집계 지표(metrics) 데이터가 필요합니다.' })
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: MODEL })

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: buildPrompt(metrics) }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 8192,
      },
    })

    const content = result.response.text()
    if (!content) {
      return res.status(500).json({ message: 'Gemini가 빈 응답을 반환했습니다.' })
    }

    return res.status(200).json({
      content,
      generatedAt: new Date().toISOString(),
      model: MODEL,
    })
  } catch (error) {
    console.error('Gemini API error:', error)
    const message = error instanceof Error ? error.message : '보고서 생성 중 오류가 발생했습니다.'
    return res.status(500).json({ message })
  }
}
