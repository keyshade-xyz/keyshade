import { Project, Secret } from '@prisma/client'

export interface ProjectWithSecrets extends Project {
  secrets: Secret[]
}
