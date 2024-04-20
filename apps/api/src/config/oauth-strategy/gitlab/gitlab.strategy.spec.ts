import { GitlabStrategy } from './gitlab.strategy'

describe('GitlabStrategy', () => {
  let strategy: GitlabStrategy

  beforeEach(() => {
    strategy = new GitlabStrategy('clientID', 'clientSecret', 'callbackURL')
  })

  it('should be defined', () => {
    expect(strategy).toBeDefined()
  })

  it('should have a validate method', () => {
    expect(strategy.validate).toBeDefined()
  })
})
