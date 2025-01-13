# MongoDB API Server w/ Fastify

A quick node HTTP server using [Fastify](https://fastify.dev/) which has REST endpoints to modify a MongoDB. This was spun up to work with Mongo Atlas and to form a neat and tidy node project. Using the project to practice secrets management via AWS Secrets Manager. As well as dependency injection to manage initialization for mocking services during testing.

## Design considerations

1. <b>Initialization of the service:</b> In this case we want the service requirements to be met and fulfilled upon initialization. In the event that the required clients or secrets are not available or created correctly, fail, and fail fast.

2. <b> Separation of the business layer and HTTP layer<b>: This adheres to the single responsibility principal. Keeps the business logic and the http layer distinct. The business layer encapsulates the core application logic, handling data processing, transformations, and interactions with external systems (e.g., databases, services), where as the HTTP layer handles HTTP-specific concerns like parsing requests, validating payloads, managing routes, and sending HTTP responses.

### How to run

```bash
# start the server
./mongodb ts-node ./src/index.ts
```

```bash
# call post to create a collection
curl -X POST http://localhost:3000/api/collections/create \
-H "Content-Type: application/json" \
-d '{"collectionName": "Automobiles"}'
```

```bash
# call post to insert a document
curl -X POST http://localhost:3000/api/collections/insert \
-H "Content-Type: application/json" \
-d '{"collectionName": "Automobiles", "document": {"maker": "chevy"}}'
```

### How to run tests

```bash
./mongodb npx jest --coverage
```
