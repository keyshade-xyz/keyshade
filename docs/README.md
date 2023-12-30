---
description: Get to know about what we are building
---

# ❔ What is keyshade?

## The problem

With the rise in security concerns, software products are being made with security as their top concern. One of the most implemented strategy is to move all the secrets that the application is using to some cloud provider, where the secrets are fetched in runtime. By doing this, applications can separate their code from their configurations, ensuring both privacy and customizability.

But, this comes with a cost of heavy human effort. Consider this scenario: Your application is using Google OAuth to sign in its users. Now, some day, you decided to use a new email account to log in users. At the very least, you have to make these changes:

* **Update your keys** in the runtime environment
* **Restart your servers** to pick up the change in configuration

Along with this, you are also required to store your **sensitive data** as plain text on servers, which you own indirectly!&#x20;

## The solution

This is what led to the development of **keyshade**. keyshade is a secret-management tool that aims to make secret management a breeze, while keeping developer compatibility and integration as its top-most priority.

With keyshade integrated into your codebase, you don't need to worry about leaking your secrets, or micromanaging them! Here are a few points as to why keyshade would an opt-in solution for you:

* We use **Public Key Cryptography** at our very core. For every project that you make, you are allowed to specify a **private key** that stays in your custody forever (until you specify otherwise!). We then use a **public key** generated from your private key to encrypt and store your secrets.
* Your secrets are safe! We encrypt your data both **in transition** and **at rest**, making it mathematically impossible to sniff or tamper.
* Our SDKs are developed with **real-time** experience in mind. Feel like you need to change that API key of yours? We've got you covered! All you need to do is update it in keyshade, and leave the rest to the robots!
* **Collaborating** with others on a keyshade project is as secure as it gets! None of the collaborators will be able to see the value (not even the hashed up gibberish!) of any secret, but they will be easily able to add or update the values as and when they want to. Your private key stays safe with you!
* You are the person in command! We have put a lot of effort in developing a fine-tuned system, that allows you to micromanage the roles that you give to other users or even your own API keys.
* Lastly, we allow you to rotate your secrets periodically. This is an opt-in feature, should you want that JWT secret of yours to be regenerated so that bad folks don't breach your systems!
