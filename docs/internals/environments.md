---
description: Understanding environments in Keyshade - what they are, how they work, and all supported functionalities
---

# Environments in Keyshade

## What are Environments?

Environments in Keyshade are **logical containers** that represent different stages or contexts where your application runs. They allow you to manage different configurations for development, staging, production, and any other environments you need.

### Key Characteristics of Environments

- **Logical Separation**: Each environment represents a distinct deployment context
- **Configuration Isolation**: Secrets and variables can have different values per environment
- **Access Control**: Fine-grained permissions control who can access which environments
- **Integration Support**: Environments can be mapped to external deployment platforms
- **Version Management**: Each environment maintains its own version history for configurations

## Why Use Environments?

### Development Workflow Benefits

1. **Environment Isolation**: Keep development, staging, and production configurations separate
2. **Safe Testing**: Test configuration changes in non-production environments first
3. **Team Collaboration**: Different team members can work on different environments
4. **Deployment Flexibility**: Deploy to different environments with appropriate configurations

### Operational Benefits

1. **Configuration Management**: Centralized management of environment-specific settings
2. **Access Control**: Control who has access to sensitive production environments
3. **Audit Trail**: Track changes made to each environment separately
4. **Integration**: Map environments to external platforms (Vercel, AWS, etc.)

## Common Environment Types

### Standard Environments

#### Development
- **Purpose**: Local development and testing
- **Characteristics**: Debug settings, test data, relaxed security
- **Access**: All developers typically have access
- **Example Values**: `LOG_LEVEL=debug`, `DEBUG_MODE=true`

#### Staging
- **Purpose**: Pre-production testing and validation
- **Characteristics**: Production-like settings, test data, moderate security
- **Access**: Limited to QA team and senior developers
- **Example Values**: `LOG_LEVEL=info`, `DEBUG_MODE=false`

#### Production
- **Purpose**: Live application serving real users
- **Characteristics**: Optimized settings, real data, strict security
- **Access**: Restricted to operations team and senior developers
- **Example Values**: `LOG_LEVEL=warn`, `DEBUG_MODE=false`

### Custom Environments

#### Testing
- **Purpose**: Automated testing and CI/CD pipelines
- **Characteristics**: Test-specific configurations, mock services
- **Access**: CI/CD systems and test automation

#### Preview
- **Purpose**: Feature branch deployments and pull request previews
- **Characteristics**: Dynamic configurations, temporary data
- **Access**: Developers and reviewers

#### Demo
- **Purpose**: Client demonstrations and sales presentations
- **Characteristics**: Stable demo data, presentation-optimized settings
- **Access**: Sales team and client-facing roles

## Environment Structure and Fields

### Core Fields

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `name` | String | The name of the environment (e.g., `development`, `staging`) | Yes |
| `slug` | String | URL-friendly identifier (auto-generated from name) | Auto |
| `description` | String | Optional description of the environment's purpose | No |

### Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Unique identifier for the environment |
| `createdAt` | DateTime | When the environment was created |
| `updatedAt` | DateTime | When the environment was last modified |
| `lastUpdatedById` | String | Who last updated the environment |
| `projectId` | String | Which project this environment belongs to |

### Relationship Fields

| Field | Type | Description |
|-------|------|-------------|
| `secretVersions` | Array | Secret versions associated with this environment |
| `variableVersions` | Array | Variable versions associated with this environment |
| `integrations` | Array | External platform integrations mapped to this environment |

## Supported Functionalities

### 1. Creating Environments

Environments can be created through the dashboard interface or via CLI commands. You can create individual environments or use bulk creation for multiple environments at once.

**Key Features:**
- **Individual creation**: Create environments one at a time with custom settings
- **Bulk creation**: Create multiple environments from configuration files
- **Environment templates**: Create environments from predefined templates
- **Custom configurations**: Set up environment-specific settings during creation

For detailed CLI commands, see the [CLI Environment Commands](../cli/environment.md) documentation.

### 2. Managing Environments

Environment management includes listing, viewing details, and updating environment properties. You can also include configuration details when viewing environments.

**Key Features:**
- **Environment listing**: View all environments in a project with pagination and search
- **Detailed views**: Get comprehensive information about specific environments
- **Configuration inclusion**: View environments with their associated configurations
- **Property updates**: Modify environment names, descriptions, and settings

For detailed CLI commands, see the [CLI Environment Commands](../cli/environment.md) documentation.

### 3. Environment Access Control

Keyshade provides fine-grained access control for environments, ensuring that only authorized users can view, modify, or delete environment configurations. This is implemented through role-based permissions and workspace-level access controls.

**Permission Levels:**
- **READ_ENVIRONMENT**: Can view environment details and configurations
- **CREATE_ENVIRONMENT**: Can create new environments
- **UPDATE_ENVIRONMENT**: Can modify environment properties
- **DELETE_ENVIRONMENT**: Can delete environments

**Key Features:**
- **Role-based access**: Assign permissions based on user roles
- **Environment-specific access**: Control access to individual environments
- **Workspace-level control**: Manage access at the workspace level
- **Custom roles**: Create roles with specific permission combinations

For detailed CLI commands, see the [CLI Environment Commands](../cli/environment.md) documentation.

### 4. Configuration Management

Environment configuration management allows you to set different values for secrets and variables across different environments, apply bulk configurations, and create environment inheritance hierarchies.

**Key Features:**
- **Environment-specific values**: Set different configurations for each environment
- **Bulk configuration**: Apply configurations to multiple environments at once
- **Environment inheritance**: Create environments that inherit from others
- **Configuration templates**: Use predefined configuration templates

For detailed CLI commands, see the [CLI Environment Commands](../cli/environment.md) documentation.

### 5. Integration Management

Environment integration management allows you to connect environments to external platforms, CI/CD pipelines, and webhook systems for automated deployment and monitoring.

**Key Features:**
- **Platform integrations**: Map environments to external platforms like Vercel, AWS, etc.
- **CI/CD integration**: Connect environments to CI/CD pipelines for automated deployments
- **Webhook integration**: Set up webhooks for environment change notifications
- **Automated deployment**: Automatically deploy configurations to connected platforms

For detailed CLI commands, see the [CLI Environment Commands](../cli/environment.md) documentation.

### 6. Environment Monitoring

Environment monitoring provides comprehensive visibility into environment health, configuration drift, and audit trails to ensure environments are functioning correctly and securely.

**Key Features:**
- **Configuration drift detection**: Identify differences between environments
- **Health checks**: Monitor environment health and performance
- **Audit logging**: Track all environment changes and access
- **Drift reporting**: Generate detailed reports on configuration differences

For detailed CLI commands, see the [CLI Environment Commands](../cli/environment.md) documentation.

### 7. Environment Lifecycle Management

Environment lifecycle management includes promoting configurations between environments, cloning environments, and cleaning up unused or old configurations.

**Key Features:**
- **Environment promotion**: Move configurations from one environment to another
- **Environment cloning**: Create copies of environments with all or selective configurations
- **Environment cleanup**: Remove old or unused environment configurations
- **Lifecycle automation**: Automate environment lifecycle processes

For detailed CLI commands, see the [CLI Environment Commands](../cli/environment.md) documentation.

### 8. Backup and Recovery

Environment backup and recovery provides comprehensive protection for your environment configurations, ensuring you can restore environments from backups and maintain business continuity.

**Key Features:**
- **Environment backup**: Create backups of entire environments or specific configurations
- **Environment restore**: Restore environments from backup files
- **Selective backup**: Backup only specific types of configurations
- **Cross-environment restore**: Restore environments to different environment names

For detailed CLI commands, see the [CLI Environment Commands](../cli/environment.md) documentation.

## Environment Best Practices

### Naming Conventions
- Use descriptive, consistent names (e.g., `development`, `staging`, `production`)
- Use lowercase with hyphens for multi-word names (e.g., `staging-v2`, `preview-branch`)
- Avoid using sensitive information in environment names

### Environment Organization
- Create environments that match your deployment pipeline
- Use consistent naming across all projects
- Document the purpose of each environment in the description field

### Access Control
- Follow principle of least privilege
- Restrict production environment access to essential personnel only
- Use role-based access control for different environment types
- Regularly audit environment access permissions

### Configuration Management
- Use environment-specific values for all configurations
- Avoid hardcoding environment-specific values in code
- Test configuration changes in non-production environments first
- Document configuration dependencies and relationships

### Security Considerations
- Use different credentials for each environment
- Implement proper access controls for sensitive environments
- Monitor access to production environments
- Regularly rotate credentials in all environments

### Integration Management
- Map environments to external platforms consistently
- Use environment-specific integration configurations
- Monitor integration health and performance
- Document integration dependencies

## Troubleshooting

### Getting Help

- Check the [CLI documentation of Environment Commands](../cli/environment.md) for command-line usage
- Review [troubleshooting guide](../getting-started/troubleshooting.md)
- Contact support through the dashboard or [GitHub issues](https://github.com/keyshade/keyshade/issues)

## Related Documentation

- [Secrets in Keyshade](./secrets.md) - For sensitive configuration values
- [Variables in Keyshade](./variables.md) - For non-sensitive configuration values
- [Getting Started Guide](../getting-started/adding-your-first-secret-and-variable.md) - For basic setup