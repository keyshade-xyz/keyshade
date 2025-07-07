---
description: How to set up Keyshade with AWS Lambda for secure runtime secrets and environment variables — automatically sync your secrets to Lambda functions.
---

# Set up Keyshade with AWS Lambda

**Keyshade** integrates seamlessly with AWS Lambda to automatically sync your secrets and environment variables directly to your Lambda functions. This eliminates the need to manually update environment variables in the AWS console every time your secrets or variables change.

This guide walks you through integrating Keyshade with your AWS Lambda functions step by step.

> Prefer to dive straight? Jump to [Configuring the Integration](#configure-keyshade-integration)

## Coming Up

Here's what this guide covers:

-   [Create or use an existing AWS Lambda function](https://docs.aws.amazon.com/lambda/latest/dg/getting-started.html)
-   [Set up IAM roles and policies for Keyshade access](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_create-console.html)
-   [Configure AWS access credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html)
-   [Create a Keyshade project and add secrets/variables](/docs/getting-started/adding-your-first-secret-and-variable.md)
-   [Configure the AWS Lambda integration in Keyshade](#configure-keyshade-integration)
-   [Test the integration with automatic secret synchronization](#test-secret-synchronization)

> 💡 If you're not familiar with how Keyshade works, we recommend starting with [What is Keyshade?](/docs/getting-started/introduction.md)

## Create or Use an Existing Lambda Function
You can either create a new Lambda function or use and existing one. Based on your preference follow the below steps:

### Creating a New Lambda Function

Create a Lambda function using the AWS Console:

1. **Sign in to AWS Console**
   - Go to the [AWS Lambda Console](https://console.aws.amazon.com/lambda/) and Sign In to you account.
   - Click **"Create function"**

2. **Configure Basic Information**
   - Choose **"Author from scratch"**
   - **Function name**: Enter a descriptive name (e.g., `keyshade-demo-function`)
   - **Runtime**: Choose your preferred runtime (e.g., Node.js 20.x, Python 3.12, etc.)
   - **Architecture**: Select x86_64 or arm64 based on your needs

3. **Set Permissions**
   - **Execution role**: Choose "Create a new role with basic Lambda permissions"
   - This creates a basic execution role that allows your function to write logs to CloudWatch

4. **Advanced Settings** (Optional)
   - Configure VPC, environment variables, tags, etc., as needed for your use case
   - You can leave these as default for testing purposes

5. **Create Function**
   - Click **"Create function"**
   - Note down your function's ARN (Amazon Resource Name) - you'll need this later

### Using an Existing Lambda Function

If you're using an existing Lambda function:

1. Navigate to your function in the [AWS Lambda Console](https://console.aws.amazon.com/lambda/)
2. Note down the function's ARN from the function overview
3. Ensure you have the necessary permissions to modify the function's configuration

## Set Up IAM Roles and Policies

Keyshade needs specific permissions to update your Lambda function's environment variables. You'll need to create an IAM policy and either create a new user or attach the policy to an existing user.

### Create an IAM Policy

1. **Navigate to IAM Console**
   - Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
   - Click **"Policies"** in the left sidebar
   - Click **"Create policy"**

2. **Define Policy Permissions**
   - Click the **"JSON"** tab
   - Replace the default policy with the following:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowKeyshade",
            "Effect": "Allow",
            "Action": [
                "lambda:UpdateFunctionConfiguration",
                "lambda:GetFunctionConfiguration"
            ],
            "Resource": "arn:aws:lambda:<<REGION>>:<<ACCOUNT_ID>>:function:<<LAMBDA_FUNCTION_NAME>>"
        }
    ]
}
```

3. **Replace Placeholders**
   - `<<REGION>>`: Your AWS region (e.g., `us-east-1`, `eu-west-1`)
   - `<<ACCOUNT_ID>>`: Your AWS account ID (12-digit number)
   - `<<LAMBDA_FUNCTION_NAME>>`: Your Lambda function name

   **Example:**
   ```json
   "Resource": "arn:aws:lambda:us-east-1:123456789012:function:keyshade-demo-function"
   ```

4. **Complete Policy Creation**
   - Click **"Next"**
   - **Policy name**: Enter a descriptive name (e.g., `KeyshadeUpdateLambdaPolicy`)
   - **Description**: "Allows Keyshade to update Lambda function environment variables"
   - Click **"Create policy"**

### Understanding the Policy

This policy grants Keyshade the minimum required permissions:

- **`lambda:UpdateFunctionConfiguration`**: Allows updating environment variables
- **`lambda:GetFunctionConfiguration`**: Allows reading current configuration
- **Resource restriction**: Limits access to only your specific Lambda function

## Configure AWS Access

You can either create a new IAM user specifically for Keyshade or use an existing user. Both approaches are covered below.

### Option 1: Create a New IAM User

1. **Create User**
   - In the IAM Console, click **"Users"** → **"Create user"**
   - **User name**: Enter a descriptive name (e.g., `keyshade-lambda-user`)
   - **Access type**: Select "Programmatic access"
   - Click **"Next"**

2. **Attach Permissions**
   - Click **"Attach policies directly"**
   - Search for and select the policy you created earlier (`KeyshadeUpdateLambdaPolicy`)
   - Click **"Next"**

3. **Review and Create**
   - Review the configuration
   - Click **"Create user"**

4. **Save Credentials**
   - **Important**: Copy and securely store the **Access Key ID** and **Secret Access Key**
   - These will be needed for Keyshade configuration
   - You won't be able to see the Secret Access Key again

### Option 2: Use an Existing IAM User

1. **Navigate to User**
   - In the IAM Console, click **"Users"**
   - Select your existing user

2. **Attach Policy**
   - Click the **"Permissions"** tab
   - Click **"Add permissions"** → **"Attach policies directly"**
   - Search for and select `KeyshadeUpdateLambdaPolicy`
   - Click **"Add permissions"**

3. **Generate Access Keys** (if needed)
   - Click the **"Security credentials"** tab
   - In the "Access keys" section, click **"Create access key"**
   - Choose **"Application running outside AWS"**
   - Click **"Next"** → **"Create access key"**
   - Copy and securely store the credentials

## Create a Keyshade Project and Add Secrets

1. **Access Keyshade Dashboard**
   - Go to the [Keyshade Dashboard](https://app.keyshade.xyz/)
   - Sign in to your account

2. **Create or Select Project**
   - Click **"Create Project"** [(Refer the docs)](../../getting-started/adding-your-first-secret-and-variable.md) or select an existing project
   - Name your project (e.g., `lambda-secrets-project`)

3. **Add Secrets and Variables**
> 💡 **Secrets vs Variables:**
>
>* **Secrets** are sensitive credentials like API keys or tokens. These are encrypted at rest.
>
>* **Variables** are non-sensitive configs like ports, flags, or feature toggles. These are stored as-is.

   - Click the **"Secrets"** tab to add your secrets
   - Click the **"Variables"** tab to add your variables
   - Example secrets/variables:
     - Secret: `DATABASE_PASSWORD`, `API_KEY` 
     - Variable: `LOG_LEVEL`, `FEATURE_FLAG_ENABLED`

4. **Configure Environment**
   - Ensure you have at least one environment (e.g., `development`, `production`)
   - **Important**: Each AWS Lambda integration can only sync with one environment


## Configure Keyshade Integration

### Access Integration Settings

1. **Navigate to Integrations**
   - In your Keyshade project dashboard
   - Click **"Integrations"** in the left sidebar
   - Click **"Add Integration"**

2. **Select AWS Lambda**
   - Choose **"AWS Lambda"** from the available integrations
   - Click **"Configure"**

### Configure Integration Settings

Fill in the following configuration details:

#### Basic Configuration
- **Integration Name**: Enter a descriptive name (e.g., `Production Lambda Sync`)
- **Description**: Optional description of this integration

#### Event Triggers
Select when Keyshade should sync secrets to Lambda:
- **Secret Events**: Get notified about all secret-related events
- **Variable Events**: Get notified about all variable-related events

> 💡 **Tip**: Enable all triggers for complete synchronization

#### AWS Lambda Configuration
- **AWS Region**: Your Lambda function's region (e.g., `us-east-1`)
- **Access Key ID**: The AWS access key ID you created earlier
- **Secret Access Key**: The corresponding secret access key
- **Lambda Function Name**: Exact name of your Lambda function

#### Keyshade Configuration
- **Project**: Your Keyshade project (auto-selected)
- **Environment**: Choose the environment to sync (e.g., `production`)
- **Private Key**: Your project's private key for secure access

> ⚠️ **Important**: You can only choose **one environment** per AWS Lambda integration.

### Test the Integration

1. **Save Configuration**
   - Click **"Save Integration"**
   - Keyshade will validate the AWS credentials and Lambda access

2. **Trigger a Test Sync**
   - Click **"Test Integration"** to perform a manual sync
   - Check the integration logs for any errors

3. **Verify in AWS Console**
   - Go to your Lambda function in the AWS Console
   - Click the **"Configuration"** tab
   - Click **"Environment variables"**
   - Confirm that your Keyshade secrets and variables appear as environment variables

## Test Secret Synchronization

### Update a Secret in Keyshade

1. **Modify a Secret**
   - In your Keyshade project, go to the **"Secrets"** tab
   - Click on an existing secret or create a new one
   - Update the value and save

2. **Verify Automatic Sync**
   - The integration should automatically trigger based on your event trigger settings
   - Check the integration logs in Keyshade for sync status

3. **Confirm in Lambda**
   - Refresh your Lambda function's environment variables in the AWS Console
   - The updated value should appear within a few moments

### Test with a Lambda Function

Create a simple test function to verify that secrets are accessible:

**Node.js Example:**
```javascript
export const handler = async (event) => {
  const response = {
    statusCode: 200,
    body: {
      PORT_NUMBER: process.env.PORT_NUMBER || '3000',
      API_TOKEN: process.env.API_TOKEN || 'supersecret'
    },
  };
  return response;
};
```

### Test the Function

1. **Deploy the Code**
   - Copy the example code to your Lambda function
   - Click **"Deploy"**

2. **Create a Test Event**
   - Click **"Test"**
   - Create a new test event (default settings are fine)
   - Click **"Test"**

3. **Verify Response**
   - Check the execution result
   - Confirm that secrets show as "Secret loaded" and variables display their values

## Troubleshooting

### Common Issues

**Integration fails to save:**
- Verify AWS credentials are correct
- Check that the IAM policy is properly attached
- Ensure the Lambda function name and region are accurate

**Secrets not syncing:**
- Verify event triggers are enabled
- Check integration logs for error messages
- Ensure the Lambda function exists and is accessible

**Permission errors:**
- Verify the IAM policy includes the correct Lambda function ARN
- Check that the AWS user has the policy attached
- Ensure the AWS region matches your Lambda function's region

### Best Practices

1. **Use separate IAM users** for each integration to maintain security boundaries
2. **Enable CloudTrail logging** to monitor Lambda configuration changes
3. **Test integrations** in development environments before production
4. **Regularly rotate access keys** for enhanced security
5. **Monitor integration logs** for any sync failures or errors

**You're All Set 🎊**

_Your AWS Lambda function is now automatically synchronized with Keyshade. No more manual environment variable updates, no more deployment delays due to secret changes, and no more configuration drift between environments._

> Ready to explore more integrations? Check out [Integrations Hub](/docs/integrations)!