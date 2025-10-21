---
description: Understanding variables in Keyshade - what they are, how they work, and all supported functionalities
---

# Variables in Keyshade

## What are Variables?

Variables in Keyshade are **non-sensitive configuration values** that your applications need to function properly. Unlike secrets, variables are stored in plaintext and are not encrypted, making them suitable for configuration data that doesn't contain sensitive information.

### Key Characteristics of Variables

- **Stored in plaintext**: Variables are not encrypted since they don't contain sensitive data
- **Environment-specific**: Each variable can have different values for different environments
- **Versioned**: Every change to a variable creates a new version for tracking and rollback
- **Access-controlled**: Fine-grained permissions control who can view, modify, or delete variables
- **Fast access**: Since they're not encrypted, variables can be retrieved and updated quickly

## Why Use Variables?

### Configuration Management Benefits

1. **Centralized Configuration**: Store all non-sensitive configuration in one place
2. **Environment Consistency**: Ensure consistent configuration across different environments
3. **Easy Updates**: Change configuration values without code deployments
4. **Team Collaboration**: Share configuration values with team members easily

### Operational Benefits

1. **Live Updates**: Configuration changes are automatically propagated to running applications
2. **Version Control**: Track all configuration changes with full audit trails
3. **Environment Separation**: Different values for development, staging, and production
4. **No Restarts Required**: Update configuration without restarting applications

## Common Use Cases

### Application Configuration
- Port numbers and server settings
- Feature flags and toggles
- Log levels and debugging settings
- Timeout values and retry configurations

### External Service URLs
- API endpoints and base URLs
- Service discovery endpoints
- CDN URLs and asset paths
- Webhook URLs (non-sensitive)

### Environment-Specific Settings
- Database connection timeouts
- Cache TTL values
- Rate limiting configurations
- Monitoring and alerting settings

### Frontend Configuration
- Public API URLs (prefixed with `NEXT_PUBLIC_` for Next.js)
- Build-time configuration
- Feature flags for UI components
- Analytics and tracking IDs

## Variable Structure and Fields

### Core Fields

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `name` | String | The name of the variable (e.g., `PORT`, `LOG_LEVEL`) | Yes |
| `slug` | String | URL-friendly identifier (auto-generated from name) | Auto |
| `note` | String | Optional description or documentation | No |

### Versioning Fields

| Field | Type | Description |
|-------|------|-------------|
| `version` | Integer | Version number (increments with each change) |
| `value` | String | The variable value (stored in plaintext) |
| `environmentId` | String | Which environment this version applies to |
| `createdOn` | DateTime | When this version was created |
| `createdById` | String | Who created this version |

### Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `createdAt` | DateTime | When the variable was first created |
| `updatedAt` | DateTime | When the variable was last modified |
| `lastUpdatedById` | String | Who last updated the variable |
| `projectId` | String | Which project this variable belongs to |

## Supported Functionalities

### 1. Creating Variables

Variables can be created through the dashboard interface or via CLI commands. Each variable can have different values for different environments, allowing you to maintain separate configurations for development, staging, and production.

**Key Features:**
- **Environment-specific values**: Each variable can have different values per environment
- **Bulk creation**: Import multiple variables from configuration files
- **Plaintext storage**: Variables are stored without encryption for fast access
- **Access control**: Set permissions for who can view and modify variables

For detailed CLI commands, see the [CLI Variable Commands](../cli/variable.md) documentation.

### 2. Reading and Retrieving Variables

Variables can be retrieved through various methods depending on your use case. The system supports listing all variables in a project, getting specific variable values, and runtime access for applications.

**Key Features:**
- **Project-wide listing**: View all variables in a project with pagination and search
- **Environment-specific retrieval**: Get variable values for specific environments
- **Runtime access**: Retrieve variables for application use without manual intervention
- **Search and filtering**: Find variables quickly using search terms and filters

For detailed CLI commands, see the [CLI Variable Commands](../cli/variable.md) documentation.

### 3. Updating Variables

Variable updates can include changes to metadata (name, description) or values for specific environments. The system maintains version history for all changes, allowing you to track what was changed and when.

**Key Features:**
- **Metadata updates**: Change variable names and descriptions
- **Value updates**: Update variable values for specific environments
- **Bulk updates**: Update multiple variables from configuration files
- **Version tracking**: All changes create new versions for audit trails

For detailed CLI commands, see the [CLI Variable Commands](../cli/variable.md) documentation.

### 4. Version Management

Every change to a variable creates a new version, providing complete audit trails and rollback capabilities. This ensures you can track who made changes, when they were made, and revert to previous versions if needed.

**Key Features:**
- **Version history**: View all versions of a variable with timestamps and authors
- **Rollback capability**: Revert to any previous version of a variable
- **Version comparison**: Compare different versions to see what changed
- **Audit trails**: Track who made changes and when

For detailed CLI commands, see the [CLI Variable Commands](../cli/variable.md) documentation.

### 5. Environment Management

Variables can be enabled or disabled in specific environments, allowing you to control which environments have access to which variables. This provides fine-grained control over variable availability.

**Key Features:**
- **Environment-specific enable/disable**: Control which environments can access each variable
- **Environment listing**: View which environments have access to specific variables
- **Selective deployment**: Deploy variables only to environments that need them
- **Access control**: Restrict variable access based on environment requirements

For detailed CLI commands, see the [CLI Variable Commands](../cli/variable.md) documentation.

### 6. Access Control and Permissions

Keyshade provides fine-grained access control for variables, ensuring that only authorized users can view, modify, or delete configuration values. This is implemented through role-based permissions and workspace-level access controls.

**Permission Levels:**
- **READ_VARIABLE**: Can view variable metadata and values
- **CREATE_VARIABLE**: Can create new variables
- **UPDATE_VARIABLE**: Can modify existing variables
- **DELETE_VARIABLE**: Can delete variables

**Key Features:**
- **Role-based access**: Assign permissions based on user roles
- **Workspace-level control**: Manage access at the workspace level
- **Custom roles**: Create roles with specific permission combinations
- **Team collaboration**: Share variables with team members

For detailed CLI commands, see the [CLI Variable Commands](../cli/variable.md) documentation.

### 7. Integration Features

Keyshade provides various integration options to seamlessly incorporate variables into your development workflow and deployment pipelines.

**Key Features:**
- **Webhook notifications**: Get notified when variables change
- **API access**: Programmatic access to variables via API tokens
- **CLI integration**: Use variables directly in your applications
- **CI/CD integration**: Automatically inject variables into deployment pipelines

For detailed CLI commands, see the [CLI Variable Commands](../cli/variable.md) documentation.

### 8. Backup and Recovery

Keyshade provides comprehensive backup and recovery capabilities to ensure your variables are always available and protected against data loss.

**Key Features:**
- **Export functionality**: Export all variables from a project in various formats
- **Import capabilities**: Restore variables from backup files
- **Disaster recovery**: Automatic backups and point-in-time recovery
- **High availability**: Cross-region replication for business continuity

For detailed CLI commands, see the [CLI Variable Commands](../cli/variable.md) documentation.

## Best Practices

### Naming Conventions
- Use descriptive, consistent names (e.g., `PORT`, `LOG_LEVEL`, `API_BASE_URL`)
- Use uppercase with underscores for environment variable compatibility
- Include service or component name in the variable name when needed

### Environment Management
- Use separate environments for different stages (dev, staging, prod)
- Use appropriate values for each environment
- Document the purpose of each variable in the note field

### Access Control
- Follow principle of least privilege
- Use role-based access control
- Regularly audit who has access to what variables
- Remove access for team members who no longer need it

### Configuration Management
- Group related variables logically
- Use consistent naming patterns
- Document variable dependencies and relationships
- Test configuration changes in non-production environments first

### Security Considerations
- Never store sensitive data in variables (use secrets instead)
- Be careful with URLs that might contain sensitive information
- Regularly review variable values for accidental sensitive data
- Use environment-specific values to avoid exposing internal URLs

## Troubleshooting

### Getting Help

- Check the [CLI documentation of Variable Commands](../cli/variable.md) for command-line usage
- Review the [getting started guide](../getting-started/adding-your-first-secret-and-variable.md) for basic troubleshooting
- Contact support through the dashboard or [GitHub issues](https://github.com/keyshade/keyshade/issues)

## Related Documentation

- [Secrets in Keyshade](./secrets.md) - For sensitive configuration values
- [Environments in Keyshade](./environments.md) - For understanding environment management
- [Getting Started Guide](../getting-started/adding-your-first-secret-and-variable.md) - For basic setup
