---
description: Understanding secrets in Keyshade - what they are, how they work, and all supported functionalities
---

# Secrets in Keyshade

## What are Secrets?

Secrets in Keyshade are **sensitive credentials and authentication data** that need to be protected and managed securely. These include API keys, database passwords, access tokens, private keys, and any other sensitive information that your applications need to function but should never be exposed in plaintext.

### Key Characteristics of Secrets

- **Encrypted at rest**: All secrets are encrypted using public key cryptography before being stored in the database
- **Encrypted in transit**: Secrets are transmitted securely between your application and Keyshade
- **Environment-specific**: Each secret can have different values for different environments (development, staging, production)
- **Versioned**: Every change to a secret creates a new version, allowing you to track history and rollback if needed
- **Access-controlled**: Fine-grained permissions control who can view, modify, or delete secrets

## Why Use Secrets?

### Security Benefits

1. **Prevents Hardcoding**: Eliminates the need to hardcode sensitive data directly in your source code
2. **Centralized Management**: All secrets are stored in one secure location instead of scattered across multiple systems
3. **Encryption**: Uses public key cryptography to ensure secrets are mathematically impossible to decrypt without the private key
4. **Access Control**: Control who has access to which secrets and environments

### Operational Benefits

1. **Live Updates**: Changes to secrets are automatically propagated to your running applications without restarts
2. **Version Control**: Track all changes with full audit trails
3. **Easy Rotation**: Automatically rotate secrets on a schedule or manually when needed
4. **Team Collaboration**: Share secrets securely with team members without exposing the actual values

## Common Use Cases

### API Keys and Tokens
- Third-party service API keys (Stripe, AWS, Google Cloud, etc.)
- OAuth access tokens and refresh tokens
- Webhook signing secrets
- Service-to-service authentication tokens

### Database Credentials
- Database connection strings
- Database usernames and passwords
- Connection pool configurations

### Application Secrets
- JWT signing keys
- Session secrets
- Encryption keys
- Private certificates

### Infrastructure Secrets
- SSH private keys
- Cloud provider access keys
- Container registry credentials
- CI/CD pipeline tokens

## Secret Structure and Fields

### Core Fields

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `name` | String | The name of the secret (e.g., `DATABASE_PASSWORD`) | Yes |
| `slug` | String | URL-friendly identifier (auto-generated from name) | Auto |
| `note` | String | Optional description or documentation | No |
| `rotateAt` | DateTime | When the secret should be automatically rotated | No |
| `rotateAfter` | Integer | Hours after which to rotate the secret | No |

### Versioning Fields

| Field | Type | Description |
|-------|------|-------------|
| `version` | Integer | Version number (increments with each change) |
| `value` | String | The encrypted secret value |
| `environmentId` | String | Which environment this version applies to |
| `createdOn` | DateTime | When this version was created |
| `createdById` | String | Who created this version |

### Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `createdAt` | DateTime | When the secret was first created |
| `updatedAt` | DateTime | When the secret was last modified |
| `lastUpdatedById` | String | Who last updated the secret |
| `projectId` | String | Which project this secret belongs to |

## Supported Functionalities

### 1. Creating Secrets

Secrets can be created through the dashboard interface or via CLI commands. Each secret can have different values for different environments, allowing you to maintain separate configurations for development, staging, and production.

**Key Features:**
- **Environment-specific values**: Each secret can have different values per environment
- **Bulk creation**: Import multiple secrets from configuration files
- **Rotation settings**: Configure automatic secret rotation schedules
- **Access control**: Set permissions for who can view and modify secrets

For detailed CLI commands, see the [CLI Secret Commands](../cli/secret.md) documentation.

### 2. Reading and Retrieving Secrets

Secrets can be retrieved through various methods depending on your use case. The system supports listing all secrets in a project, getting specific secret values, and runtime access for applications.

**Key Features:**
- **Project-wide listing**: View all secrets in a project with pagination and search
- **Environment-specific retrieval**: Get secret values for specific environments
- **Runtime access**: Retrieve secrets for application use without manual intervention
- **Search and filtering**: Find secrets quickly using search terms and filters

For detailed CLI commands, see the [CLI Secret Commands](../cli/secret.md) documentation.

### 3. Updating Secrets

Secret updates can include changes to metadata (name, description) or values for specific environments. The system maintains version history for all changes, allowing you to track what was changed and when.

**Key Features:**
- **Metadata updates**: Change secret names, descriptions, and rotation settings
- **Value updates**: Update secret values for specific environments
- **Bulk updates**: Update multiple secrets from configuration files
- **Version tracking**: All changes create new versions for audit trails

For detailed CLI commands, see the [CLI Secret Commands](../cli/secret.md) documentation.

### 4. Version Management

Every change to a secret creates a new version, providing complete audit trails and rollback capabilities. This ensures you can track who made changes, when they were made, and revert to previous versions if needed.

**Key Features:**
- **Version history**: View all versions of a secret with timestamps and authors
- **Rollback capability**: Revert to any previous version of a secret
- **Version comparison**: Compare different versions to see what changed
- **Audit trails**: Track who made changes and when

For detailed CLI commands, see the [CLI Secret Commands](../cli/secret.md) documentation.

### 5. Secret Rotation

Secret rotation is a critical security practice that automatically generates new secret values on a schedule or manually when needed. This helps maintain security by ensuring secrets don't remain static for extended periods.

**Key Features:**
- **Manual rotation**: Rotate secrets immediately when needed
- **Automatic rotation**: Set up scheduled rotation (24h, 168h, 720h, 8760h, or never)
- **Date-based rotation**: Schedule rotation for specific dates and times
- **Event-based rotation**: Trigger rotation based on external events

**Rotation Policies:**
- **Time-based**: Rotate after a specific number of hours
- **Date-based**: Rotate at a specific date and time
- **Event-based**: Rotate when triggered by external events

For detailed CLI commands, see the [CLI Secret Commands](../cli/secret.md) documentation.

### 6. Environment Management

Secrets can be enabled or disabled in specific environments, allowing you to control which environments have access to which secrets. This provides fine-grained control over secret availability.

**Key Features:**
- **Environment-specific enable/disable**: Control which environments can access each secret
- **Environment listing**: View which environments have access to specific secrets
- **Selective deployment**: Deploy secrets only to environments that need them
- **Access control**: Restrict secret access based on environment requirements

For detailed CLI commands, see the [CLI Secret Commands](../cli/secret.md) documentation.

### 7. Access Control and Permissions

Keyshade provides fine-grained access control for secrets, ensuring that only authorized users can view, modify, or delete sensitive information. This is implemented through role-based permissions and workspace-level access controls.

**Permission Levels:**
- **READ_SECRET**: Can view secret metadata and values
- **CREATE_SECRET**: Can create new secrets
- **UPDATE_SECRET**: Can modify existing secrets
- **DELETE_SECRET**: Can delete secrets

**Key Features:**
- **Role-based access**: Assign permissions based on user roles
- **Workspace-level control**: Manage access at the workspace level
- **Custom roles**: Create roles with specific permission combinations
- **Team collaboration**: Share secrets securely with team members

For detailed CLI commands, see the [CLI Secret Commands](../cli/secret.md) documentation.

### 8. Security Features

Keyshade implements multiple layers of security to protect your sensitive data, including encryption, audit logging, and access monitoring.

**Encryption Details:**
- **Algorithm**: RSA public key encryption
- **Key Management**: Each project has its own key pair
- **Key Storage**: Private keys can be stored in Keyshade or locally
- **Transmission**: All data encrypted in transit using TLS

**Key Features:**
- **End-to-end encryption**: Secrets are encrypted at rest and in transit
- **Audit logging**: Track all secret access and modifications
- **Access monitoring**: Monitor who accessed secrets and when
- **Failed access tracking**: Monitor and alert on unauthorized access attempts

For detailed CLI commands, see the [CLI Secret Commands](../cli/secret.md) documentation.

### 9. Integration Features

Keyshade provides various integration options to seamlessly incorporate secrets into your development workflow and deployment pipelines.

**Key Features:**
- **Webhook notifications**: Get notified when secrets change
- **API access**: Programmatic access to secrets via API tokens
- **CLI integration**: Use secrets directly in your applications
- **CI/CD integration**: Automatically inject secrets into deployment pipelines

For detailed CLI commands, see the [CLI Secret Commands](../cli/secret.md) documentation.

### 10. Backup and Recovery

Keyshade provides comprehensive backup and recovery capabilities to ensure your secrets are always available and protected against data loss.

**Key Features:**
- **Export functionality**: Export all secrets from a project in various formats
- **Import capabilities**: Restore secrets from backup files
- **Disaster recovery**: Automatic backups and point-in-time recovery
- **High availability**: Cross-region replication for business continuity

**Recovery Options:**
- **Automatic backups**: Encrypted secrets are automatically backed up
- **Point-in-time recovery**: Restore to any previous state
- **Cross-region replication**: Ensure availability across multiple regions

For detailed CLI commands, see the [CLI Secret Commands](../cli/secret.md) documentation.

## Best Practices

### Naming Conventions
- Use descriptive, consistent names (e.g., `DATABASE_PASSWORD`, `STRIPE_SECRET_KEY`)
- Use uppercase with underscores for environment variable compatibility
- Include service or component name in the secret name

### Environment Management
- Use separate environments for different stages (dev, staging, prod)
- Never use production secrets in development
- Regularly rotate secrets in production environments

### Access Control
- Follow principle of least privilege
- Use role-based access control
- Regularly audit who has access to what secrets
- Remove access for team members who no longer need it

### Security
- Never log or print secret values
- Use secure channels for sharing secrets
- Regularly rotate secrets, especially after security incidents
- Monitor for unauthorized access attempts

### Version Control
- Document changes in secret notes
- Use meaningful version descriptions
- Keep a reasonable number of versions for rollback purposes
- Test secret changes in non-production environments first

## Troubleshooting

### Getting Help

- Check the [CLI documentation of Secret Commands](../cli/secret.md) for command-line usage
- Review the [getting started guide](../getting-started/adding-your-first-secret-and-variable.md) for basic troubleshooting
- Contact support through the dashboard or [GitHub issues](https://github.com/keyshade/keyshade/issues)

## Related Documentation

- [Variables in Keyshade](./variables.md) - For non-sensitive configuration values
- [Environments in Keyshade](./environments.md) - For understanding environment management
- [Getting Started Guide](../getting-started/adding-your-first-secret-and-variable.md) - For basic setup
