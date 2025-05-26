import { Project, Secret } from '@prisma/client'

export interface ProjectWithSecrets extends Project {
  secrets: Secret[]
}

export interface ProjectWithCounts extends Partial<Project> {
  secretCount: number
  variableCount: number
  environmentCount: number
}

export { ExportFormat, ExportData } from './export/export.types'
