---
description: Get your CLI tied up with Keyshade API
---

# Setting up your profile

In order to use the CLI with your applications, or to use the CLI to manage your configurations, you need to set up a profile. A profile contains details about the API you are using, your API key and some other relevant information.

## Create an API key

First, we need to create an API key in order to be able to add it to our profile.

- Head over to [https://app.keyshade.xyz](https://app.keyshade.xyz)
- Click on your name at the top right
- Navigate to **User Settings** -> **API Keys**
- Click on **Add API Key**
- Give a name to the key
- Set the expiration date
- Select all the authorities (you should select only the ones that you need in production environment)
- Click on **Add API Key**

Once the key is generated, you would be able to copy it. The key would be in a format `ks_<random alphanumeric string>`. Make sure that you copy the entire key, including the `ks_` prefix.

## Create a profile

Now, let's create our profile.

- Open a terminal
- Run the following command:
  ```bash
  keyshade profile create --name my-profile -a <your API key here> -m
  ```
- Once done, run this command to set your profile as the default one:

  ```bash
  keyshade profile use my-profile
  ```

## Test your profile

Now, you are set to making API calls to the keyshade API. You can run this command to check if your profile is set up correctly:

```bash
keyshade workspace list
```

This command should output a list of all the workspaces that you have access to. If you have just started, there should be only one workspace.
