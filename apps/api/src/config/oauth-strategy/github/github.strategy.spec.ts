import { GithubStrategy } from './github.strategy'

describe('GithubStrategy', () => {
  let strategy: GithubStrategy

  beforeEach(() => {
    strategy = new GithubStrategy('clientID', 'clientSecret', 'callbackURL')
  })

  it('should be defined', () => {
    expect(strategy).toBeDefined()
  })

  it('should have a validate method', () => {
    expect(strategy.validate).toBeDefined()
  })
})
