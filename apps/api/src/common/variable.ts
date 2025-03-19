import { VariableWithValues } from '@/variable/variable.types'

export function getVariableWithValues(
  variableWithVersion: VariableWithValues['variable'] & {
    versions: VariableWithValues['values']
  }
): VariableWithValues {
  const values = variableWithVersion.versions
  delete variableWithVersion.versions
  const variable = variableWithVersion
  return {
    variable,
    values
  }
}
