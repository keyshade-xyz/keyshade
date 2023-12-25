import { AdminGuard } from './admin.guard'

describe('AdminGuard', () => {
  it('should be defined', () => {
    expect(new AdminGuard()).toBeDefined()
  })
})
