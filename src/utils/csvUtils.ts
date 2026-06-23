/** CSV 텍스트에서 UTF-8 BOM 제거 */
export function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
}

/** ID·코드 값 정규화 (앞뒤 공백·줄바꿈 제거) */
export function normalizeCell(value: unknown): string {
  return String(value ?? '')
    .replace(/^\uFEFF/, '')
    .trim()
}

export function normalizeNumericCell(value: unknown): string {
  return normalizeCell(value).replace(/,/g, '')
}
