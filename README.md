![thumb](https://github.com/keyshade-xyz/keyshade/assets/74916308/d3d00d59-a031-40bc-a17e-c57871cfd166)

---

<div align="left">

<p align="center">
    <a href="https://keyshade.xyz?ref=github" target="_blank"><b>Website</b></a> •
    <a href="https://docs.keyshade.xyz/" target="_blank"><b>Documentation</b></a> •
    <a href="https://discord.gg/m6TcpWBSdt" target="_blank"><b>Join our Community</b></a> • 
    <a href="https://twitter.com/keyshade_xyz" target="_blank"><b>Twitter</b></a>
    <a href="https://www.linkedin.com/company/keyshade-xyz/" target="_blank"><b>LinkedIn</b></a>
</p>

<div align = "center">

[![keyshade.xyz Discord](https://dcbadge.vercel.app/api/server/m6TcpWBSdt)](https://discord.gg/pbBghfnC)
<a href="https://twitter.com/keyshade_xyz"><img src="https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white" /></a>
<a href="https://www.linkedin.com/company/keyshade-xyz/"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" /></a>

</div>

---

keyshade is designed to simplify the integration of your secrets into your codebase. We prioritize the security of your data by leveraging the power of [Public Key Encryption](https://en.m.wikipedia.org/wiki/Public-key_cryptography) for storing and transferring your secrets to your runtime environment in realtime.

With keyshade, managing your secrets becomes a breeze while ensuring their security.

## Why keyshade?

Any application that you host on a cloud provider would need access to secrets. These secrets help you to access other APIs or perform internal actions such as generating JWT tokens. Hence, all cloud providers give you the ability to store your secrets in their platform. However, this comes with a few caveats:

- **Security**: Cloud providers store your secrets in plaintext. This means that anyone with access to your cloud provider's dashboard can view your secrets.

- **Access Control**: Cloud providers don't give you the ability to control who can access your secrets. This means that anyone with access to your cloud provider's dashboard can view your secrets.

- **Maintainability**: As the application grows, you'll need to add more secrets. This means that you'll have to update your secrets in multiple places, manually.

- **Need to restart**: Secrets are generally configured as environmental variables, which means that you'll need to restart your application to update them.

- **Collaboration**: Collaboration is hard. You'll need to share your secrets with your team members, which means that you'll have to share your cloud provider's credentials with them. Worse, you will be sending them over insecure channels such as email, or your communication platform.

This is where keyshade comes in. We intend to solve these shortcomings by providing you with a simple, secure, and easy-to-use solution for managing your secrets.

## Features

Our goal is to enable you to manage your secrets effortlessly. We don't want to bog you down with unnecessary details or complexity, and only want you to focus on building your application. Here's how we do it:

- **Security**: We use [Public Key Encryption](https://en.m.wikipedia.org/wiki/Public-key_cryptography) to encrypt your secrets. This means that your secrets are encrypted at rest and in transit. This makes it mathematically impossible for anyone to decrypt your secrets without your private key. The best part of this approach is, any of your team member can use the secrets in your runtime environment without having to know your private key.

- **Live Updates**: Whenever you make any changes to your secrets, they're automatically updated in your runtime environment. This means that you don't have to restart your application to update your secrets.

- **Multiple Environments**: We allow you to create multiple environments for your application. This feature enables you to manage your secrets for different environments such as `development`, `staging`, and `production` separately, and reference them in your codebase.

- **Object Values**: You can store your secrets as JSON like objects. This gives you the ability to group similar secrets together.

- **Secret versioning**: We maintain a history of all your secrets. This means that you can easily revert to an older version of your secrets if you need to.

- **Secret Rotation**: We allow you to rotate your secrets regularly. This means that you can update your secrets without having to update your application.

- **Workspaces and projects**: Managing your data in a clean and efficient goes a long way in improving your productivity. We allow you to organize your secrets into workspaces and projects. This gives you the ability to share your secrets with your team members easily.

- **Access Control**: You are the owner of your secrets. This means that you have complete control over who can access your secrets. You can share your secrets with your team members by adding them to your workspace.

## Contributing

We welcome contributions from everyone. Please read our [contributing guide](./CONTRIBUTING.md) to get started.
