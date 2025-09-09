import type {
  Environment,
  SecretVersion,
  Variable,
  VariableVersion,
  CreateProjectRequest
} from '@keyshade/schema'
import { type ClassValue, clsx } from 'clsx'
import dayjs from 'dayjs'
import { posthog } from 'posthog-js'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function logout() {
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'
  document.cookie =
    'isOnboardingFinished=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'
  localStorage.clear()
  posthog.reset()
  window.location.href = '/auth'
}

export function formatDate(date: string): string {
  return dayjs(date).format('D MMMM, YYYY')
}

export function formatTime(date: string): string {
  return dayjs(date).format('HH:mm')
}

export function formatText(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function parseUpdatedEnvironmentValues(
  oldValues: Variable['versions'] | SecretVersion[],
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

/* ------------------------------
   parseEnvironmentsText util
   Strict parser: only accepts env-like key/value pairs
   Supported formats per line:
     - KEY=VALUE
     - KEY: VALUE
     - KEY VALUE
     - standalone KEY (no value) -> description ""
   Returns CreateProjectRequest['environments']
   ------------------------------ */

type Env = NonNullable<CreateProjectRequest['environments']>[number]
type Envs = NonNullable<CreateProjectRequest['environments']>

export function parseEnvironmentsText(text: string, max = 200): Envs {
  if (!text) return []

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const results: Env[] = []
  let autoIndex = 1

  for (const line of lines) {
    if (results.length >= max) break;

    // KEY=VALUE (allow VALUE to contain '=')
    if (line.includes('=')) {
      const [k, ...rest] = line.split('=');
      const name = k.trim();
      const description = rest.join('=').trim();
      if (name && /^[A-Za-z0-9_.-]+$/.test(name)) {
        results.push({ name, description });
      }
      continue;
    }

    // KEY: VALUE (allow VALUE to contain ':')
    if (line.includes(':')) {
      const [k, ...rest] = line.split(':');
      const name = k.trim();
      const description = rest.join(':').trim();
      if (name && /^[A-Za-z0-9_.-]+$/.test(name)) {
        results.push({ name, description });
      }
      continue;
    }

    // KEY VALUE (first token is key)
    const parts = line.split(/\s+/)
    if (parts.length > 1) {
      const name = parts[0].trim();
      const description = parts.slice(1).join(' ').trim();
      if (name && /^[A-Za-z0-9_.-]+$/.test(name)) {
        results.push({ name, description });
      }
      continue;
    }

    // standalone key → no value (allow only safe key chars)
    if (line && /^[A-Za-z0-9_.-]+$/.test(line)) {
      results.push({ name: line, description: '' })
    }
  }

  // ensure unique names by appending -2, -3 etc.
  const seen = new Map<string, number>();
  return results.map((env) => {
    let name = env.name || `env-${autoIndex++}`;
    const count = (seen.get(name) ?? 0) + 1;
    seen.set(name, count);
    if (count > 1) name = `${name}-${count}`
    return { name, description: env.description ?? '' }
  })
}
