---
description: API testing using Bruno
---

# API Testing

We use Bruno to test our APIs. All of our endpoints are tested using Bruno and we maintain a detailed documentation of every endpoint in our Postman collection. You can find the it in [here](../../../api-collection/).

Although we recommend to use Bruno, you can always import the collections into your favorite tool.

## Getting started

- For starters, make sure you have Bruno installed on your system. If not, you can download it from [here](https://www.usebruno.com/downloads)
- Once you have Postman installed, open it up.
- Click on `Import Collection`
- Point to the [`api-collection`](../../../api-collection/) folder
- For every collection in the API, the requests hold one or more examples that you can use to test the API. You can also find the schema of the request itself.

## Making changes to the API

Whenever you make a change to the API that adds / removes / updates one or more requests, you are required to update the corresponding collection in the [api-collection](../../../api-collection/) folder. Since the collections are tracked in the branch, we expect you to make all the changes in the same branch which you are working on.
