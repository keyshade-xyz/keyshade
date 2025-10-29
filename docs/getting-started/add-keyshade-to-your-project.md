---
description: Start using keyshade in your project
---

# Add keyshade to your project

Initialize keyshade in your local project:
1. Run `keyshade init`
    ```shell
    keyshade init
    ```
2. Select the workspace
3. Select the project
4. Enter the private key that you downloaded after creating the project
5. Select the environment

{% embed url="https://files.gitbook.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FklyYIOuyG5AKyh2FIsOK%2Fuploads%2FwA0awuRV5FEDUgSsgzJe%2Fkeyshade%20init.mp4?alt=media&token=3c717427-9866-48dc-b850-6aa05f2819b2" %}

Alternatively, you can do all of that in a single command:
```shell
keyshade init --workspace <workspace slug> --project <project slug> --environment <environment slug> --private-key <private key>
```

Once done, it will generate a `keyshade.json` file in your project root. This contains all the information the CLI needs to connect to your keyshade project.
```json
{
  "workspace": "my-workspace-630",
  "project": "my-app-3",
  "environment": "default-223",
  "quitOnDecryptionFailure": false
}
```