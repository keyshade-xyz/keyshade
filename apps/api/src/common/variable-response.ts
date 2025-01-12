import { Variable } from '@prisma/client'

export interface VariableWithValues {
  variable: Variable & { lastUpdatedBy: { id: string; name: string } }
  values: Array<{
    environment: {
      id: string
      name: string
      slug: string
    }
    value: string
    version: number
  }>
}

export function getVariableWithValues(
  variableWithVersion: VariableWithValues['variable'] & {
    versions: VariableWithValues['values']
  }
): VariableWithValues {
  const { versions, ...variable } = variableWithVersion
  return {
    variable,
    values: versions
  }
}
