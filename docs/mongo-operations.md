# MongoDB Operations Guide

A quick reference for implementing MongoDB operations in Fastify routes.

## Overview

This guide covers how to implement common MongoDB operations in your route handlers:

- Create a collection
- Insert a document
- Find documents
- Find one document
- Update a document
- Delete a document

## Route Structure

All routes follow this pattern:

```typescript
import {FastifyRequest, FastifyReply, FastifyInstance} from 'fastify';
import {MongoClient} from 'mongodb';

export const myRoutes = async (fastify: FastifyInstance, dbClient: MongoClient): Promise<void> => {
    fastify.get('/endpoint', async (request: FastifyRequest, reply: FastifyReply) => {
        await myHandler(request, reply, dbClient);
    });
};

const myHandler = async (request: FastifyRequest, reply: FastifyReply, dbClient: MongoClient) => {
    // 1. Extract and validate input
    // 2. Perform MongoDB operation
    // 3. Return response
};
```

## MongoDB Client Chain

Every operation follows this chain:

```text
┌─────────────────────────────────────────────────────────────────┐
│ MongoClient                                                     │
│   └── .db()              // Get database instance               │
│           └── .collection('name')  // Get collection            │
│                   └── .operation()  // insertOne, find, etc.    │
└─────────────────────────────────────────────────────────────────┘
```

## Operations

### Create a Collection

Creates a new collection in the database.

**Route:**

```typescript
fastify.post('/collections', async (request: FastifyRequest, reply: FastifyReply) => {
    await createCollectionHandler(request, reply, dbClient);
});
```

**Handler:**

```typescript
const createCollectionHandler = async (
    request: FastifyRequest,
    reply: FastifyReply,
    dbClient: MongoClient
) => {
    const {collectionName} = request.body as {collectionName: string};

    if (!collectionName) {
        return reply.status(400).send({error: 'Collection name is required'});
    }

    try {
        const db = dbClient.db();
        await db.createCollection(collectionName);
        return reply.status(201).send({
            message: `Collection '${collectionName}' created successfully.`,
        });
    } catch (error) {
        return reply.status(500).send({error: `Error creating collection: ${error}`});
    }
};
```

**Request:**

```bash
curl -X POST http://localhost:3000/collections \
  -H "Content-Type: application/json" \
  -d '{"collectionName": "users"}'
```

### Insert a Document

Inserts a single document into a collection.

**Route:**

```typescript
fastify.post('/collections/:collectionName/documents', async (request, reply) => {
    await insertDocumentHandler(request, reply, dbClient);
});
```

**Handler:**

```typescript
const insertDocumentHandler = async (
    request: FastifyRequest,
    reply: FastifyReply,
    dbClient: MongoClient
) => {
    const {collectionName} = request.params as {collectionName: string};
    const {document} = request.body as {document: object};

    if (!collectionName || !document) {
        return reply.status(400).send({error: 'Collection name and document are required'});
    }

    try {
        const db = dbClient.db();
        const collection = db.collection(collectionName);
        const result = await collection.insertOne(document);

        return reply.status(201).send({
            message: `Document inserted successfully.`,
            insertedId: result.insertedId,
        });
    } catch (error) {
        return reply.status(500).send({error: `Error inserting document: ${error}`});
    }
};
```

**Request:**

```bash
curl -X POST http://localhost:3000/collections/users/documents \
  -H "Content-Type: application/json" \
  -d '{"document": {"name": "John", "email": "john@example.com"}}'
```

### Find All Documents

Retrieves all documents from a collection.

**Route:**

```typescript
fastify.get('/collections/:collectionName/documents', async (request, reply) => {
    await findDocumentsHandler(request, reply, dbClient);
});
```

**Handler:**

```typescript
const findDocumentsHandler = async (
    request: FastifyRequest,
    reply: FastifyReply,
    dbClient: MongoClient
) => {
    const {collectionName} = request.params as {collectionName: string};

    if (!collectionName) {
        return reply.status(400).send({error: 'Collection name is required'});
    }

    try {
        const db = dbClient.db();
        const collection = db.collection(collectionName);
        const documents = await collection.find({}).toArray();

        return reply.status(200).send(documents);
    } catch (error) {
        return reply.status(500).send({error: `Error retrieving documents: ${error}`});
    }
};
```

**Request:**

```bash
curl http://localhost:3000/collections/users/documents
```

### Find Documents with Query

Retrieves documents matching a query filter.

**Route:**

```typescript
fastify.post('/collections/:collectionName/search', async (request, reply) => {
    await searchDocumentsHandler(request, reply, dbClient);
});
```

**Handler:**

```typescript
const searchDocumentsHandler = async (
    request: FastifyRequest,
    reply: FastifyReply,
    dbClient: MongoClient
) => {
    const {collectionName} = request.params as {collectionName: string};
    const {query} = request.body as {query: object};

    if (!collectionName) {
        return reply.status(400).send({error: 'Collection name is required'});
    }

    try {
        const db = dbClient.db();
        const collection = db.collection(collectionName);
        const documents = await collection.find(query || {}).toArray();

        return reply.status(200).send(documents);
    } catch (error) {
        return reply.status(500).send({error: `Error searching documents: ${error}`});
    }
};
```

**Request:**

```bash
# Find users with name "John"
curl -X POST http://localhost:3000/collections/users/search \
  -H "Content-Type: application/json" \
  -d '{"query": {"name": "John"}}'

# Find users older than 25
curl -X POST http://localhost:3000/collections/users/search \
  -H "Content-Type: application/json" \
  -d '{"query": {"age": {"$gt": 25}}}'
```

### Find One Document by ID

Retrieves a single document by its ID.

**Route:**

```typescript
fastify.get('/collections/:collectionName/documents/:id', async (request, reply) => {
    await findOneDocumentHandler(request, reply, dbClient);
});
```

**Handler:**

```typescript
import {ObjectId} from 'mongodb';

const findOneDocumentHandler = async (
    request: FastifyRequest,
    reply: FastifyReply,
    dbClient: MongoClient
) => {
    const {collectionName, id} = request.params as {collectionName: string; id: string};

    if (!collectionName || !id) {
        return reply.status(400).send({error: 'Collection name and ID are required'});
    }

    try {
        const db = dbClient.db();
        const collection = db.collection(collectionName);
        const document = await collection.findOne({_id: new ObjectId(id)});

        if (!document) {
            return reply.status(404).send({error: 'Document not found'});
        }

        return reply.status(200).send(document);
    } catch (error) {
        return reply.status(500).send({error: `Error retrieving document: ${error}`});
    }
};
```

**Request:**

```bash
curl http://localhost:3000/collections/users/documents/507f1f77bcf86cd799439011
```

### Update a Document

Updates a single document by its ID.

**Route:**

```typescript
fastify.put('/collections/:collectionName/documents/:id', async (request, reply) => {
    await updateDocumentHandler(request, reply, dbClient);
});
```

**Handler:**

```typescript
import {ObjectId} from 'mongodb';

const updateDocumentHandler = async (
    request: FastifyRequest,
    reply: FastifyReply,
    dbClient: MongoClient
) => {
    const {collectionName, id} = request.params as {collectionName: string; id: string};
    const {update} = request.body as {update: object};

    if (!collectionName || !id || !update) {
        return reply.status(400).send({error: 'Collection name, ID, and update data are required'});
    }

    try {
        const db = dbClient.db();
        const collection = db.collection(collectionName);
        const result = await collection.updateOne(
            {_id: new ObjectId(id)},
            {$set: update}
        );

        if (result.matchedCount === 0) {
            return reply.status(404).send({error: 'Document not found'});
        }

        return reply.status(200).send({
            message: 'Document updated successfully.',
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        return reply.status(500).send({error: `Error updating document: ${error}`});
    }
};
```

**Request:**

```bash
curl -X PUT http://localhost:3000/collections/users/documents/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{"update": {"name": "John Updated", "email": "john.updated@example.com"}}'
```

### Delete a Document

Deletes a single document by its ID.

**Route:**

```typescript
fastify.delete('/collections/:collectionName/documents/:id', async (request, reply) => {
    await deleteDocumentHandler(request, reply, dbClient);
});
```

**Handler:**

```typescript
import {ObjectId} from 'mongodb';

const deleteDocumentHandler = async (
    request: FastifyRequest,
    reply: FastifyReply,
    dbClient: MongoClient
) => {
    const {collectionName, id} = request.params as {collectionName: string; id: string};

    if (!collectionName || !id) {
        return reply.status(400).send({error: 'Collection name and ID are required'});
    }

    try {
        const db = dbClient.db();
        const collection = db.collection(collectionName);
        const result = await collection.deleteOne({_id: new ObjectId(id)});

        if (result.deletedCount === 0) {
            return reply.status(404).send({error: 'Document not found'});
        }

        return reply.status(200).send({message: 'Document deleted successfully.'});
    } catch (error) {
        return reply.status(500).send({error: `Error deleting document: ${error}`});
    }
};
```

**Request:**

```bash
curl -X DELETE http://localhost:3000/collections/users/documents/507f1f77bcf86cd799439011
```

## Complete Routes File Example

Here is a complete routes file with all CRUD operations:

```typescript
import {FastifyRequest, FastifyReply, FastifyInstance} from 'fastify';
import {MongoClient, ObjectId} from 'mongodb';

export const documentRoutes = async (
    fastify: FastifyInstance,
    dbClient: MongoClient
): Promise<void> => {
    // Create collection
    fastify.post('/collections', async (request, reply) => {
        await createCollectionHandler(request, reply, dbClient);
    });

    // Insert document
    fastify.post('/collections/:collectionName/documents', async (request, reply) => {
        await insertDocumentHandler(request, reply, dbClient);
    });

    // Find all documents
    fastify.get('/collections/:collectionName/documents', async (request, reply) => {
        await findDocumentsHandler(request, reply, dbClient);
    });

    // Search documents
    fastify.post('/collections/:collectionName/search', async (request, reply) => {
        await searchDocumentsHandler(request, reply, dbClient);
    });

    // Find one document
    fastify.get('/collections/:collectionName/documents/:id', async (request, reply) => {
        await findOneDocumentHandler(request, reply, dbClient);
    });

    // Update document
    fastify.put('/collections/:collectionName/documents/:id', async (request, reply) => {
        await updateDocumentHandler(request, reply, dbClient);
    });

    // Delete document
    fastify.delete('/collections/:collectionName/documents/:id', async (request, reply) => {
        await deleteDocumentHandler(request, reply, dbClient);
    });
};
```

## Common Query Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `$eq` | Equals | `{age: {$eq: 25}}` |
| `$gt` | Greater than | `{age: {$gt: 25}}` |
| `$gte` | Greater than or equal | `{age: {$gte: 25}}` |
| `$lt` | Less than | `{age: {$lt: 25}}` |
| `$lte` | Less than or equal | `{age: {$lte: 25}}` |
| `$ne` | Not equal | `{status: {$ne: 'deleted'}}` |
| `$in` | In array | `{status: {$in: ['active', 'pending']}}` |
| `$regex` | Pattern match | `{name: {$regex: '^John'}}` |

## Common Update Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `$set` | Set field value | `{$set: {name: 'John'}}` |
| `$unset` | Remove field | `{$unset: {tempField: ''}}` |
| `$inc` | Increment value | `{$inc: {views: 1}}` |
| `$push` | Add to array | `{$push: {tags: 'new'}}` |
| `$pull` | Remove from array | `{$pull: {tags: 'old'}}` |

## Error Handling Pattern

All handlers follow this error handling pattern:

```text
┌─────────────────────────────────────────────────────────────────┐
│ 1. VALIDATE INPUT                                               │
│    if (!requiredField) return 400 Bad Request                   │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. TRY OPERATION                                                │
│    const result = await collection.operation()                  │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. CHECK RESULT                                                 │
│    if (not found) return 404 Not Found                          │
│    else return 200/201 Success                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. CATCH ERRORS                                                 │
│    return 500 Internal Server Error                             │
└─────────────────────────────────────────────────────────────────┘
```
