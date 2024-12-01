import {
  integrationTypeEnum,
  expiresAfterEnum,
  rotateAfterEnum,
  eventSourceEnum,
  eventTriggererEnum,
  eventSeverityEnum,
  eventTypeEnum,
  authorityEnum,
  projectAccessLevelEnum
} from '@//enums'

describe('Enums Tests', () => {
  it('integrationTypeEnum should have correct values', () => {
    expect(integrationTypeEnum.options).toEqual([
      'DISCORD',
      'SLACK',
      'GITHUB',
      'GITLAB'
    ])
  })

  it('expiresAfterEnum should have correct values', () => {
    expect(expiresAfterEnum.options).toEqual([
      'never',
      '24',
      '168',
      '720',
      '8760'
    ])
  })

  it('rotateAfterEnum should have correct values', () => {
    expect(rotateAfterEnum.options).toEqual([
      'never',
      '24',
      '168',
      '720',
      '8760'
    ])
  })

  it('eventSourceEnum should have correct values', () => {
    expect(eventSourceEnum.options).toEqual([
      'SECRET',
      'VARIABLE',
      'ENVIRONMENT',
      'PROJECT',
      'WORKSPACE',
      'WORKSPACE_ROLE',
      'INTEGRATION'
    ])
  })

  it('eventTriggererEnum should have correct values', () => {
    expect(eventTriggererEnum.options).toEqual(['USER', 'SYSTEM'])
  })

  it('eventSeverityEnum should have correct values', () => {
    expect(eventSeverityEnum.options).toEqual(['INFO', 'WARN', 'ERROR'])
  })

  it('eventTypeEnum should have correct values', () => {
    expect(eventTypeEnum.options).toEqual([
      'INVITED_TO_WORKSPACE',
      'REMOVED_FROM_WORKSPACE',
      'ACCEPTED_INVITATION',
      'DECLINED_INVITATION',
      'CANCELLED_INVITATION',
      'LEFT_WORKSPACE',
      'WORKSPACE_MEMBERSHIP_UPDATED',
      'WORKSPACE_UPDATED',
      'WORKSPACE_CREATED',
      'WORKSPACE_ROLE_CREATED',
      'WORKSPACE_ROLE_UPDATED',
      'WORKSPACE_ROLE_DELETED',
      'PROJECT_CREATED',
      'PROJECT_UPDATED',
      'PROJECT_DELETED',
      'SECRET_UPDATED',
      'SECRET_DELETED',
      'SECRET_ADDED',
      'VARIABLE_UPDATED',
      'VARIABLE_DELETED',
      'VARIABLE_ADDED',
      'ENVIRONMENT_UPDATED',
      'ENVIRONMENT_DELETED',
      'ENVIRONMENT_ADDED',
      'INTEGRATION_ADDED',
      'INTEGRATION_UPDATED',
      'INTEGRATION_DELETED'
    ])
  })

  it('authorityEnum should have correct values', () => {
    expect(authorityEnum.options).toEqual([
      'CREATE_PROJECT',
      'READ_USERS',
      'ADD_USER',
      'REMOVE_USER',
      'UPDATE_USER_ROLE',
      'READ_WORKSPACE',
      'UPDATE_WORKSPACE',
      'DELETE_WORKSPACE',
      'CREATE_WORKSPACE_ROLE',
      'READ_WORKSPACE_ROLE',
      'UPDATE_WORKSPACE_ROLE',
      'DELETE_WORKSPACE_ROLE',
      'WORKSPACE_ADMIN',
      'READ_PROJECT',
      'UPDATE_PROJECT',
      'DELETE_PROJECT',
      'CREATE_SECRET',
      'READ_SECRET',
      'UPDATE_SECRET',
      'DELETE_SECRET',
      'CREATE_ENVIRONMENT',
      'READ_ENVIRONMENT',
      'UPDATE_ENVIRONMENT',
      'DELETE_ENVIRONMENT',
      'CREATE_VARIABLE',
      'READ_VARIABLE',
      'UPDATE_VARIABLE',
      'DELETE_VARIABLE',
      'CREATE_INTEGRATION',
      'READ_INTEGRATION',
      'UPDATE_INTEGRATION',
      'DELETE_INTEGRATION',
      'CREATE_WORKSPACE',
      'CREATE_API_KEY',
      'READ_API_KEY',
      'UPDATE_API_KEY',
      'DELETE_API_KEY',
      'UPDATE_PROFILE',
      'READ_SELF',
      'UPDATE_SELF',
      'READ_EVENT'
    ])
  })

  it('projectAccessLevelEnum should have correct values', () => {
    expect(projectAccessLevelEnum.options).toEqual([
      'GLOBAL',
      'INTERNAL',
      'PRIVATE'
    ])
  })
})
