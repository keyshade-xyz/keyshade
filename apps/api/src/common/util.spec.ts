import { excludeFields } from './util'

describe('Util Tests', () => {
  it('should exclude fields', () => {
    const object = {
      id: '1',
      name: 'John Doe',
      email: 'johndoe@keyshade.xyz',
      profilePictureUrl: 'https://keyshade.xyz/johndoe.jpg',
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
