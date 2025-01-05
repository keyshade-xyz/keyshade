interface ScanResult {
  file: string
  line: number
  content: string
}

interface ScanResponse {
  data?: {
    isVulnerable: boolean
    files?: ScanResult[]
  }
  error?: string
  loading?: boolean
}

export type { ScanResult, ScanResponse }
