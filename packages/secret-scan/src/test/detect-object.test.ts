import secretDetector from '@/index'
import { aws, github, openAI } from '@/rules'

describe('Dectect Secrets and Variables from Object', () => {
  it('should be able to differentiate variables from secrets', () => {
    const input = {
      GITHUB_KEY: github.testcases[0].input,
      AWS_KEY: aws.testcases[0].input,
      OPENAI_KEY: openAI.testcases[0].input,
      NEXT_PUBLIC_API_KEY: 'this-is-some-key',
      GOOGLE_ANALYTICS: 'UA-123456789-1',
      API_PORT: '3000'
    }
    const result = secretDetector.detectObject(input)
    expect(result.secrets).toEqual([
      ['GITHUB_KEY', input.GITHUB_KEY],
      ['AWS_KEY', input.AWS_KEY],
      ['OPENAI_KEY', input.OPENAI_KEY]
    ])
    expect(result.variables).toEqual([
      ['NEXT_PUBLIC_API_KEY', input.NEXT_PUBLIC_API_KEY],
      ['GOOGLE_ANALYTICS', input.GOOGLE_ANALYTICS],
      ['API_PORT', input.API_PORT]
    ])
  })

  it('should return empty arrays for secrets and variables when input is empty', () => {
    const input = {}
    const result = secretDetector.detectObject(input)
    expect(result.secrets).toEqual([])
    expect(result.variables).toEqual([])
  })

  it('should return only variables when there are no secrets', () => {
    const input = {
      NEXT_PUBLIC_API_KEY: 'this-is-some-key',
      GOOGLE_ANALYTICS: 'UA-123456789-1',
      API_PORT: '3000'
    }
    const result = secretDetector.detectObject(input)
    expect(result.secrets).toEqual([])
    expect(result.variables).toEqual([
      ['NEXT_PUBLIC_API_KEY', input.NEXT_PUBLIC_API_KEY],
      ['GOOGLE_ANALYTICS', input.GOOGLE_ANALYTICS],
      ['API_PORT', input.API_PORT]
    ])
  })

  it('should return only secrets when there are no variables', () => {
    const input = {
      GITHUB_KEY: github.testcases[0].input,
      AWS_KEY: aws.testcases[0].input,
      OPENAI_KEY: openAI.testcases[0].input
    }
    const result = secretDetector.detectObject(input)
    expect(result.secrets).toEqual([
      ['GITHUB_KEY', input.GITHUB_KEY],
      ['AWS_KEY', input.AWS_KEY],
      ['OPENAI_KEY', input.OPENAI_KEY]
    ])
    expect(result.variables).toEqual([])
  })
})
