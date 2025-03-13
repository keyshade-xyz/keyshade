import type {
  Environment,
  SecretVersion,
  UpdateSecretResponse,
  UpdateVariableResponse,
  Variable,
  VariableVersion
} from '@keyshade/schema'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function logout() {
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'
  document.cookie =
    'isOnboardingFinished=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'
  localStorage.clear()
  window.location.href = '/auth'
}

export function parseUpdatedEnvironmentValues(
  oldValues: Variable['values'],
  newValues: Record<string, string>
): {
  value: string
  environmentSlug: string
}[] {
  const updatedValues: {
    value: string
    environmentSlug: string
  }[] = []

  Object.entries(newValues).forEach(([environmentSlug, value]) => {
    const oldValue = oldValues.find(
      (entry) => entry.environment.slug === environmentSlug
    )

    if (!oldValue || oldValue.value !== value) {
      updatedValues.push({ environmentSlug, value })
    }
  })

  return updatedValues
}

type T = (VariableVersion | SecretVersion)[]
export function mergeExistingEnvironments(oldValues: T, newValues: T): T {
  const existingEnvironmentWithValues = new Map<
    Environment['slug'],
    T[number]
  >()

  for (const oldValue of oldValues) {
    existingEnvironmentWithValues.set(oldValue.environment.slug, oldValue)
  }

  const mergedValues:
    | UpdateVariableResponse['updatedVersions']
    | UpdateSecretResponse['updatedVersions'] = []

  for (const newValue of newValues) {
    if (existingEnvironmentWithValues.has(newValue.environment.slug)) {
      const oldValue = existingEnvironmentWithValues.get(
        newValue.environment.slug
      )!

      oldValue.value = newValue.value
      oldValue.version = newValue.version

      mergedValues.push(oldValue)
    } else {
      mergedValues.push(newValue)
    }
  }
  return mergedValues
}
