import { User } from '@prisma/client'

export const user: User = {
  id: '1',
  name: 'John Doe',
  email: 'johndoe@keyshade.xyz',
  profilePictureUrl: 'https://keyshade.xyz/johndoe.jpg',
  isActive: true,
  isOnboardingFinished: false,
  isAdmin: false
}

export const users: Array<User> = [
  {
    id: '1',
    name: 'Cristobal Hessel',
    email: 'cristobal@keyshade.xyz',
    profilePictureUrl: 'https://keyshade.xyz/cristobal.jpg',
    isActive: true,
    isOnboardingFinished: false,
    isAdmin: false
  },
  {
    id: '2',
    name: 'John Doe',
    email: 'johndoe@keyshade.xyz',
    profilePictureUrl: 'https://keyshade.xyz/johndoe.jpg',
    isActive: true,
    isOnboardingFinished: false,
    isAdmin: false
  },
  {
    id: '3',
    name: 'Jocelyn Larkin',
    email: 'jocelyn@keyshade.xyz',
    profilePictureUrl: 'https://keyshade.xyz/jocelyn.jpg',
    isActive: false,
    isOnboardingFinished: false,
    isAdmin: false
  },
  {
    id: '4',
    name: 'Kadin Stiedemann',
    email: 'kadin@keyshade.xyz',
    profilePictureUrl: 'https://keyshade.xyz/kadin.jpg',
    isActive: true,
    isOnboardingFinished: false,
    isAdmin: true
  }
]
