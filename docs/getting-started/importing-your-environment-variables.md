---
description: Start importing your environment variables into Keyshade
---

# Importing your environment variables

Once your project is set up, the next step is to move your environment variables from `.env` file to Keyshade.
There are two ways to do this:

1. Manually creating them one by one
2. Importing the entire `.env` file

We would be sticking with the second option as it is the most convenient way to import your environment variables.

## Import using CLI

1. Head over to your project directory
2. Run the following command:
    ```bash
    keyshade import
    ```
3. Specify the path of the `.env` file
4. Select your default workspace (eg. **My Workspace**)
5. Select the project we created in the previous step 
6. Select the environment you want to import the environment variables to (eg. **Development**)
7. Confirm the secret and variable classification
8. Confirm the import

{% embed url="https://files.gitbook.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FklyYIOuyG5AKyh2FIsOK%2Fuploads%2FjafRHirceDhGpaewKmQR%2Fimport%20using%20cli.mp4?alt=media&token=844e42f2-0708-4c5a-a397-d03eeda71ac5" %}

## Import using the app

1. Head into the project
2. Click on **Import**
3. Select the `.env` file
4. Select the environment you want to import the environment variables to (eg. **Development**)
5. Confirm the secret and variable classification
6. Confirm the import

{% embed url="https://files.gitbook.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FklyYIOuyG5AKyh2FIsOK%2Fuploads%2F0UZn6ujnCQAIJJJNW1lp%2Fimport%20using%20platform.mp4?alt=media&token=20261603-452a-40f1-b2d7-77032bb3153c" %}

Now, you have your environment variables imported into Keyshade.