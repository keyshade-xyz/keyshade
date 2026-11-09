import { excludeFields, toBaseSlug } from './util'

describe('Util Tests', () => {
  it('should exclude fields', () => {
    const object = {
      id: '1',
      name: 'John Doe',
      email: 'johndoe@keyshade.io',
      profilePictureUrl: 'https://keyshade.io/johndoe.jpg',
      isActive: true,
      isOnboardingFinished: false,
      isAdmin: false
    }

    const excluded = excludeFields(object, 'isActive')
    expect(excluded).not.toHaveProperty('isActive')
    expect(excluded).toEqual({
      ...object,
      isActive: undefined
    })
  })
})

describe('toBaseSlug', () => {
  it('slugifies a regular name', () => {
    expect(toBaseSlug('My Project')).toBe('my-project')
  })

  it('lowercases and collapses separators', () => {
    expect(toBaseSlug('PORT_NUMBER_19')).toBe('port_number_19')
  })

  it('trims surrounding hyphens', () => {
    expect(toBaseSlug(' -Hello- ')).toBe('hello')
  })

  it('falls back for an all-unicode name instead of producing a leading hyphen', () => {
    expect(toBaseSlug('\u4e2d\u6587\u540d\u79f0', 'environment')).toBe(
      'environment'
    )
  })

  it('falls back for an empty or missing name', () => {
    expect(toBaseSlug('', 'entity')).toBe('entity')
    expect(toBaseSlug(null)).toBe('entity')
    expect(toBaseSlug(undefined)).toBe('entity')
  })
})
