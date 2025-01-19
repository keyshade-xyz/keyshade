![thumb](https://github.com/keyshade-xyz/keyshade/assets/74916308/d3d00d59-a031-40bc-a17e-c57871cfd166)

---

<div align="left">

<p align="center">
    <a href="https://www.keyshade.xyz?ref=github" target="_blank"><b>Website</b></a> •
    <a href="https://docs.keyshade.xyz/" target="_blank"><b>Documentation</b></a> •
    <a href="https://discord.gg/dh8F3Dzt" target="_blank"><b>Join our Community</b></a> • 
    <a href="https://twitter.com/keyshade_xyz" target="_blank"><b>Twitter</b></a>
    <a href="https://www.linkedin.com/company/keyshade-xyz/" target="_blank"><b>LinkedIn</b></a>
</p>

<div align = "center">

<a href="https://discord.gg/acfN4k6dxU"><img src="https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white" /></a>
<a href="https://twitter.com/keyshade_xyz"><img src="https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white" /></a>
<a href="https://www.linkedin.com/company/keyshade-xyz/"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" /></a>

</div>

<div align="center>
    
<a href="https://www.producthunt.com/posts/keyshade?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-keyshade" target="_blank">
<img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=436664&theme=light" alt="keyshade - Manage&#0032;all&#0032;your&#0032;secrets&#0032;securely | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" />
</a>

</div>

---

keyshade is designed to simplify the integration of your secrets and variables into your codebase. We prioritize the security of your data by leveraging the power of [Public Key Encryption](https://en.m.wikipedia.org/wiki/Public-key_cryptography) empowered by [Elliptic Curve Cryptography](https://en.wikipedia.org/wiki/Elliptic-curve_cryptography) for storing and transferring your secrets to your runtime environment in realtime.

With keyshade, managing your configurations becomes a breeze while ensuring their security.

## Why keyshade?

Any application that you host on a cloud provider would need access to configurations. These configurations help you to access other APIs or perform internal actions. You would generally be managing this from the dashboard of your project in the cloud provider. However, this comes with a few caveats:

- **Security**: Cloud providers store your sensitive data in plaintext, or decipherable hashes. This means that anyone with access to your cloud provider's dashboard can view your secrets.

- **Access Control**: Cloud providers don't give you the ability to control who can access your secrets. This becomes a problem since you might not want everyone to have access to everything.

- **Maintainability**: As the application grows, you'll need to add more secrets. This means that you'll have to update your secrets in multiple places, manually.

- **Need to restart**: Secrets are generally configured as environmental variables, which means that you'll need to restart your application to update them.

- **Collaboration**: Collaboration is hard. You'll need to share your secrets with your team members, which means that you'll have to share your cloud provider's credentials with them. Worse, you will be sending them over insecure channels such as email, or your communication platform.

This is where keyshade comes in. We intend to solve these shortcomings by providing you with a simple, secure, and easy-to-use solution for managing your secrets.

## Features

Our goal is to enable you to manage your secrets effortlessly. We don't want to bog you down with unnecessary details or complexity, and only want you to focus on building your application. Here's how we do it:

- **Security**: We use [Public Key Encryption](https://en.m.wikipedia.org/wiki/Public-key_cryptography) to encrypt your secrets. This means that your secrets are encrypted at rest and in transit. This makes it mathematically impossible for anyone to decrypt your secrets without your private key. The best part of this approach is, any of your team member can use the secrets in your runtime environment without having to know your private key.

- **Live Updates**: Whenever you make any changes to your secrets, they're automatically updated in your runtime environment. This means that you don't have to restart your application to update your secrets.

- **Multiple Environments**: We allow you to create multiple environments for your application. This feature enables you to manage your secrets for different environments such as `development`, `staging`, and `production` separately, and reference them in your codebase.

- **Secret and variable versioning**: We maintain a history of all your secrets. This means that you can easily revert to an older version of your configuration if you need to.

- **Secret Rotation**: We allow you to rotate your secrets regularly. This means that you can update your secrets without having to update your application.

- **Workspaces and projects**: Managing your data in a clean and efficient goes a long way in improving your productivity. We allow you to organize your secrets into workspaces and projects. This gives you the ability to share your secrets with your team members easily.

- **Access Control**: You are the owner of your secrets. This means that you have complete control over who can access your secrets. You can share your secrets with your team members by adding them to your workspace.

- **Custom Roles**: We allow you to create custom roles for your team members. This will allow you to fine tune your control over who gets to do what.

- **Event tracking**: For every event that happens, we maintain an in detailed log of what happened, accounting for who did what and when.

- **Auditing and anomaly detection**: Our robots are continuously monitoring access to your secrets and variables. With the power of AI, it becomes near to impossible to breach your data.

- **Integrations**: Our vast library of integration allows you to use keyshade with your favorite tools and platforms.

## Setting things up

We maintain an in-detailed documentation about how to get started with keyshade. You can find it [here](https://docs.keyshade.xyz/contributing-to-keyshade/setting-things-up).

## Contributing

We welcome contributions from everyone. Please read our [contributing guide](./CONTRIBUTING.md) to get started.

## Contributors

<a href="https://github.com/keyshade-xyz/keyshade/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=keyshade-xyz/keyshade&max=400&columns=20" />
  <img src="https://us-central1-tooljet-hub.cloudfunctions.net/github" width="0" height="0" />
</a>
