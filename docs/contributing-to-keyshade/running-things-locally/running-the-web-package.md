---
description: Get to know how you can run the web package!
---

## Running the Web Package

The Web Package resides in the `apps/web` directory. It is powered by NextJS and TypeScript. To run the Web Package locally, do the following:

* Build the web app with this command:

```
turbo run build
```

* Build the docker version of the web app with:

```
docker build -t ks-web -f apps/web/Dockerfile .
```

## Testing your code

We use Jest for testing.

To run tests, use this command:

```
jest --updateSnapshot 
```

or

```
turbo run test --filter=web
```

## Viewing the Web App

* You can view the web app by first running:

```
turbo run start 
```

and opening the https://localhost:3000 URL in a browser.


* View the docker version of the web app with:

```
docker run --env-file .env --name ks-web --rm -p 3000:3000 ks-web
```
