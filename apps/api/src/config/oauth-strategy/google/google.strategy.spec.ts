import { GoogleStrategy } from './google.strategy'

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy

  beforeEach(() => {
    strategy = new GoogleStrategy('clientID', 'clientSecret', 'callbackURL')
  })

  it('should be defined', () => {
    expect(strategy).toBeDefined()
  })

  it('should have a validate method', () => {
    expect(strategy.validate).toBeDefined()
  })
})
