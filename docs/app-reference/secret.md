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
- **Live Updates**: Changes to secrets are automatically propagated to your running applications without restarts
- **Easy Rotation**: Automatically rotate secrets on a schedule or manually when needed

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

## Supported Functionalities

### 1. Creating Secrets

A project can house multiple secrets. Here's how you can create one.

{% tabs %}

{% tab title="Web" %}

1. Head over to your [dashboard](https://app.keyshade.io)
2. From the list of projects, select the one under which you would like to create the secret
3. Navigate to the **Secrets** tab
4. Click on the **Create Secret** button
5. Fill in the required fields:
    - **Secret Name**: A unique name for the secret. This should be unique across your project
    - **Extra Note**: An optional description about what the secret holds
    - **Environmental Values**: Set the values for one or more environments for this secret. Different environments are ideally meant to hold different values.
6. Click on the **Add Secret** button
7. You will be redirected to the **Secrets** tab where you can see the list of secrets in your project

{% endtab %}

{% tab title="CLI" %}

- To create a secret with no values set in the environment, use this command
  ```shell
  keyshade secret create <project_slug> --name <secret_name>
  ```
  
- To create a secret with values set in the environment, use this command
  ```shell
  keyshade secret create <project_slug> --name <secret_name> -e <environment_slug>=<value>
  ```

- To create a secret with values set in multiple environments, use this command
  ```shell
  keyshade secret create <project_slug> --name <secret_name> -e <environment_slug>=<value> -e <environment_slug>=<value>
  ```

- To verify the secret has been created, use this command
  ```shell
  keyshade secret list <project_slug>
  ```
  
{% endtab %}

{% endtabs %}

### 2. Updating Secrets

{% tabs %}

{% tab title="Web" %}

1. Head over to the secret you want to edit
2. Click on the **3-dot button** or **right-click** on the secret
3. Select **Edit** from the dropdown menu
4. You can update the name, note, and also the individual environment values for this secret from here
5. Click on the **Save Changes** button once you are done
6. Your updates will be reflected on the secret

{% endtab %}

{% tab title="CLI" %}

- To update the name of a secret, use this command
  ```shell
  keyshade secret update <secret_slug> --name <secret_name>
  ```
  
- To update the note of a secret, use this command
  ```shell
  keyshade secret update <secret_slug> --note <note>
  ```

- To update the value of a secret in a specific environment, use this command
  ```shell
  keyshade secret update <secret_slug> -e <environment_slug>=<value>
  ```

- To update the value of a secret in multiple environments, use this command
  ```shell
  keyshade secret update <secret_slug> -e <environment_slug>=<value> -e <environment_slug>=<value>
  ```

{% endtab %}

{% endtabs %}

### 3. Version Management

When you update the environmental value of a secret, it creates a new revisions with your new value. This allows you to revert back to an old value. Here's how you can view and revert to an old value.

{% tabs %}

{% tab title="Web" %}

1. Head over to the secret you want to revert
2. Click on the **3-dot button** or **right-click** on the secret
3. Select **Show Version History** from the dropdown menu
4. Select the revision you want to revert to
5. Click on the **Revert** button
6. Collapse the environment that you want to revert the value of
7. Click on the "clock" button to revert to the selected revision

{% endtab %}

{% tab title="CLI" %}

- To revert a secret to a specific revision, use this command
  ```shell
  keyshade secret rollback <secret_slug> --environment <environment_slug> --version <revision_number>
  ```

{% endtab %}

{% endtabs %}

### 4. Deleting Secrets

{% tabs %}

{% tab title="Web" %}

1. Head over to the secret you want to delete
2. Click on the **3-dot button** or **right-click** on the secret
3. Select **Delete** from the dropdown menu
4. Confirm the deletion

{% endtab %}

{% tab title="CLI" %}

- To delete a secret, use this command
  ```shell
  keyshade secret delete <secret_slug>
  ```

{% endtab %}

{% endtabs %}

## Best Practices

### Naming Conventions
- Use descriptive, consistent names (e.g., `DATABASE_PASSWORD`, `STRIPE_SECRET_KEY`)
- Use uppercase with underscores for environment variable compatibility
- Include service or component name in the secret name

### Environment Management
- Use separate environments for different stages (dev, staging, prod)
- Never use production secrets in development
- Regularly rotate secrets in production environments