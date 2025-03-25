import type {
  Environment,
  SecretVersion,
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

  const mergedValues: T = []

  // Parse the incoming new changes
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

    existingEnvironmentWithValues.delete(newValue.environment.slug)
  }

  // Loop through the existing ones to make sure we don't remove the
  // ones that were not changed
  for (const oldValue of existingEnvironmentWithValues.values()) {
    mergedValues.push(oldValue)
  }

  return mergedValues
}

export function setKeyLocally(key: string, value: string) {
  localStorage.setItem(key, value)
}

export function formatTimeAgo(dateString: Date): string {
  const updatedDate = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor(
    (now.getTime() - updatedDate.getTime()) / 1000
  )

  const timeIntervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 }
  ]

  for (const interval of timeIntervals) {
    const count = Math.floor(diffInSeconds / interval.seconds)
    if (count >= 1) {
      return `Updated ${count} ${interval.label}${count > 1 ? 's' : ''} ago`
    }
  }

  return 'Updated just now'
}
