interface VulnerableFile {
  name: string
  line: number
  content: string
}

interface ScanResponse {
  data?: {
    isVulnerable: boolean
    files?: VulnerableFile[]
  }
  error?: string
  loading?: boolean
}

export type { VulnerableFile, ScanResponse }
