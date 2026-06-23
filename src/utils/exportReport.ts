import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx'

function getReportFilename(): string {
  const date = new Date().toISOString().slice(0, 10)
  return `ERP_분석보고서_${date}`
}

function parseBoldRuns(text: string): TextRun[] {
  const parts = text.split(/(\*\*.+?\*\*)/g)
  return parts
    .filter((p) => p.length > 0)
    .map((part) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return new TextRun({ text: part.slice(2, -2), bold: true })
      }
      return new TextRun({ text: part })
    })
}

function markdownToDocxParagraphs(content: string): Paragraph[] {
  const paragraphs: Paragraph[] = []
  const lines = content.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) continue

    if (trimmed.startsWith('### ')) {
      paragraphs.push(
        new Paragraph({
          text: trimmed.slice(4),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        }),
      )
    } else if (trimmed.startsWith('## ')) {
      paragraphs.push(
        new Paragraph({
          text: trimmed.slice(3),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        }),
      )
    } else if (trimmed.startsWith('# ')) {
      paragraphs.push(
        new Paragraph({
          text: trimmed.slice(2),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),
      )
    } else if (trimmed.startsWith('- ')) {
      paragraphs.push(
        new Paragraph({
          children: parseBoldRuns(trimmed.slice(2)),
          bullet: { level: 0 },
          spacing: { after: 80 },
        }),
      )
    } else {
      paragraphs.push(
        new Paragraph({
          children: parseBoldRuns(trimmed),
          spacing: { after: 120 },
        }),
      )
    }
  }

  return paragraphs
}

export async function downloadReportAsPdf(element: HTMLElement): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 10
  const contentWidth = pageWidth - margin * 2

  const imgHeight = (canvas.height * contentWidth) / canvas.width
  let heightLeft = imgHeight
  let position = margin

  pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight)
  heightLeft -= pageHeight - margin * 2

  while (heightLeft > 0) {
    position = margin - (imgHeight - heightLeft)
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight)
    heightLeft -= pageHeight - margin * 2
  }

  pdf.save(`${getReportFilename()}.pdf`)
}

export async function downloadReportAsWord(
  content: string,
  generatedAt: string,
): Promise<void> {
  const bodyParagraphs = markdownToDocxParagraphs(content)

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: 'ERP ANALYTICS 분석 보고서',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `생성일: ${new Date(generatedAt).toLocaleString('ko-KR')}`,
                size: 20,
                color: '666666',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          ...bodyParagraphs,
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${getReportFilename()}.docx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
