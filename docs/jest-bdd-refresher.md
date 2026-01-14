# Jest BDD Testing Guide

A quick reference for writing tests in this mongodb-fastify repo using Jest with a BDD approach.

## Overview

This guide covers the testing patterns used in this codebase:

- BDD structure with `describe` and `it`
- Mocking MongoDB and external dependencies
- Testing Fastify routes with `inject`
- Async error handling

## Test File Structure

```text
tests/
├── controllers/
│   └── collectionController.test.ts   # Unit tests for controllers
├── routes/
│   └── collectionRoutes.test.ts       # Integration tests for HTTP routes
└── services/
    ├── mongDbService.test.ts          # Service layer tests
    └── secretService.test.ts          # AWS Secrets Manager tests
```

## Quick Start

### Run all tests

```bash
make test
# or
npm run ci-test
```

### Run a specific test file

```bash
make test-file FILE=tests/routes/collectionRoutes.test.ts
# or
npx jest tests/routes/collectionRoutes.test.ts
```

### Run tests in watch mode

```bash
make test-watch
```

### Run tests matching a pattern

```bash
npx jest --testNamePattern="should create a collection"
```

## BDD Structure

Tests follow the Given-When-Then pattern using Jest's `describe` and `it`:

```typescript
describe('Feature or Module', () => {
    describe('specific behavior', () => {
        it('should [expected outcome] when [condition]', async () => {
            // Arrange (Given)
            // Act (When)
            // Assert (Then)
        });
    });
});
```

## Mocking Patterns

### Basic Mock Setup

Every test file in this repo follows this pattern:

```typescript
import {MongoClient} from 'mongodb';

jest.mock('mongodb');

describe('My Tests', () => {
    let dbClientMock: jest.Mocked<MongoClient>;
    let dbMock: jest.MockedFunction<any>;
    let collectionMock: jest.MockedFunction<any>;

    beforeEach(() => {
        collectionMock = jest.fn().mockReturnValue({
            insertOne: jest.fn(),
            find: jest.fn().mockReturnValue({
                toArray: jest.fn(),
            }),
        });

        dbMock = jest.fn().mockReturnValue({
            createCollection: jest.fn(),
            collection: collectionMock,
        });

        dbClientMock = {
            db: dbMock,
        } as unknown as jest.Mocked<MongoClient>;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });
});
```

**What the mocks represent:**

The mocks simulate MongoDB's object hierarchy:

```text
MongoClient (dbClientMock)
    └── .db() (dbMock)
            ├── .createCollection()
            └── .collection() (collectionMock)
                    ├── .insertOne()
                    └── .find().toArray()
```

- `dbClientMock` - The MongoDB connection client. In real code: `new MongoClient(uri)`
- `dbMock` - The database instance returned by `client.db()`. Has methods like `createCollection()` and `collection()`
- `collectionMock` - A collection returned by `db.collection('name')`. Has methods like `insertOne()`, `find()`

**What beforeEach does:**

1. Creates a fake collection with stubbed methods (`insertOne`, `find`)
2. Creates a fake db that returns the fake collection when `collection()` is called
3. Creates a fake client that returns the fake db when `db()` is called

When your code calls `dbClient.db().collection('users').insertOne(doc)`, it traverses the mock chain and you can verify each call was made with the expected arguments.

### Mock Return Values

| Method                      | When to Use                  |
|-----------------------------|------------------------------|
| `mockReturnValue(val)`      | Sync, same value every call  |
| `mockReturnValueOnce(val)`  | Sync, single call only       |
| `mockResolvedValueOnce(val)`| Async success                |
| `mockRejectedValueOnce(err)`| Async error                  |

### Mocking Success

```typescript
dbMock().createCollection.mockResolvedValueOnce({});
collectionMock().insertOne.mockResolvedValueOnce({});
collectionMock().find().toArray.mockResolvedValueOnce([{_id: '1', name: 'test'}]);
```

### Mocking Errors

```typescript
dbMock().createCollection.mockRejectedValueOnce(new Error('CreateCollectionError'));
collectionMock().insertOne.mockRejectedValueOnce(new Error('InsertOneError'));
```

## Testing Fastify Routes

### Setup

```typescript
import Fastify, {FastifyInstance} from 'fastify';
import {collectionRoutes} from '../../src/routes/collection-routes';

let fastify: FastifyInstance;

beforeEach(async () => {
    fastify = Fastify();
    await collectionRoutes(fastify, dbClientMock);
});

afterEach(async () => {
    await fastify.close();
});
```

### Testing HTTP Methods

**GET request:**

```typescript
const response = await fastify.inject({
    method: 'GET',
    url: '/testCollection',
});
```

**POST request:**

```typescript
const response = await fastify.inject({
    method: 'POST',
    url: '/create',
    payload: {collectionName: 'testCollection'},
});
```

### Asserting Responses

```typescript
expect(response.statusCode).toBe(200);
expect(JSON.parse(response.payload)).toEqual({
    message: "Collection 'testCollection' created successfully.",
});
```

## Common Assertions

```typescript
// Value equality
expect(response.statusCode).toBe(200);

// Object equality
expect(JSON.parse(response.payload)).toEqual({key: 'value'});

// Function was called
expect(dbMock).toHaveBeenCalledTimes(1);
expect(dbMock().collection).toHaveBeenCalledWith('testCollection');

// Async error thrown
await expect(someAsyncFn()).rejects.toThrow('Error message');
```

## Test Templates

### Controller Test

Controller tests verify business logic in isolation. They call the controller function directly and assert on the return value and mock interactions.

```text
┌─────────────────────────────────────────────────────────────────┐
│ TEST                                                            │
│   createCollection(dbClientMock, 'users')                       │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ CONTROLLER                                                      │
│   dbClient.db()  ──────────────────────►  dbMock()              │
│       └── .createCollection('users')  ──►  jest.fn()            │
│   return { success: true, message: '...' }                      │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ ASSERTIONS                                                      │
│   expect(result).toEqual({ success: true, message: '...' })     │
│   expect(dbMock().createCollection).toHaveBeenCalledWith(...)   │
└─────────────────────────────────────────────────────────────────┘
```

```typescript
describe('createCollection', () => {
    it('should create a collection successfully', async () => {
        const collectionName = 'testCollection';

        const result = await createCollection(dbClientMock, collectionName);

        expect(dbMock).toHaveBeenCalledTimes(1);
        expect(dbMock().createCollection).toHaveBeenCalledWith(collectionName);
        expect(result).toEqual({
            success: true,
            message: `Collection '${collectionName}' created successfully.`,
        });
    });

    it('should throw an error when creating a collection fails', async () => {
        const error = new Error('CreateCollectionError');
        dbMock().createCollection.mockRejectedValueOnce(error);

        await expect(createCollection(dbClientMock, 'test')).rejects.toThrow();
    });
});
```

### Route Test

Route tests verify the full HTTP request/response cycle. Fastify's `inject` simulates an HTTP request that flows through the route handler, which then calls the mocked MongoDB client.

```text
┌─────────────────────────────────────────────────────────────────┐
│ TEST                                                            │
│   fastify.inject({ method: 'POST', url: '/create', payload })   │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ FASTIFY                                                         │
│   Routes request to POST /create handler                        │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ ROUTE HANDLER                                                   │
│   const { collectionName } = request.body                       │
│   dbClient.db()  ──────────────────────►  dbMock()              │
│       └── .createCollection(name)  ────►  jest.fn()             │
│   reply.status(200).send({ message: '...' })                    │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ ASSERTIONS                                                      │
│   expect(response.statusCode).toBe(200)                         │
│   expect(JSON.parse(response.payload)).toEqual({ message })     │
└─────────────────────────────────────────────────────────────────┘
```

```typescript
describe('POST /create', () => {
    it('should create a collection successfully', async () => {
        dbMock().createCollection.mockResolvedValueOnce({});

        const response = await fastify.inject({
            method: 'POST',
            url: '/create',
            payload: {collectionName: 'testCollection'},
        });

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.payload)).toEqual({
            message: "Collection 'testCollection' created successfully.",
        });
    });

    it('should return 400 if collectionName is missing', async () => {
        const response = await fastify.inject({
            method: 'POST',
            url: '/create',
            payload: {},
        });

        expect(response.statusCode).toBe(400);
    });

    it('should return 500 if database fails', async () => {
        dbMock().createCollection.mockRejectedValueOnce(new Error('DB Error'));

        const response = await fastify.inject({
            method: 'POST',
            url: '/create',
            payload: {collectionName: 'testCollection'},
        });

        expect(response.statusCode).toBe(500);
    });
});
```

## MongoDB Operations

This section covers common MongoDB operations, how to mock them, and how to test them.

### Create a Collection

Creates a new collection in the database.

```text
┌─────────────────────────────────────────────────────────────────┐
│ YOUR CODE                                                       │
│   const db = dbClient.db();                                     │
│   await db.createCollection('users');                           │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ MOCK CHAIN                                                      │
│   dbClient.db()  ────────────────────►  dbMock()                │
│       └── .createCollection('users')  ►  jest.fn()              │
└─────────────────────────────────────────────────────────────────┘
```

**Mock setup:**

```typescript
dbMock().createCollection.mockResolvedValueOnce({});
```

**Test example:**

```typescript
it('should create a collection', async () => {
    dbMock().createCollection.mockResolvedValueOnce({});

    await createCollection(dbClientMock, 'users');

    expect(dbMock().createCollection).toHaveBeenCalledWith('users');
});
```

### Insert a Document

Inserts a single document into a collection.

```text
┌─────────────────────────────────────────────────────────────────┐
│ YOUR CODE                                                       │
│   const db = dbClient.db();                                     │
│   const collection = db.collection('users');                    │
│   await collection.insertOne({ name: 'John', age: 30 });        │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ MOCK CHAIN                                                      │
│   dbClient.db()  ────────────────────►  dbMock()                │
│       └── .collection('users')  ─────►  collectionMock()        │
│               └── .insertOne(doc)  ──►  jest.fn()               │
└─────────────────────────────────────────────────────────────────┘
```

**Mock setup:**

```typescript
collectionMock.mockReturnValue({
    insertOne: jest.fn().mockResolvedValueOnce({
        acknowledged: true,
        insertedId: 'abc123',
    }),
});
```

**Test example:**

```typescript
it('should insert a document', async () => {
    const doc = {name: 'John', age: 30};
    collectionMock().insertOne.mockResolvedValueOnce({acknowledged: true});

    await insertDocument(dbClientMock, 'users', doc);

    expect(dbMock().collection).toHaveBeenCalledWith('users');
    expect(collectionMock().insertOne).toHaveBeenCalledWith(doc);
});
```

### Find Documents

Retrieves documents from a collection. Returns an array via `find().toArray()`.

```text
┌─────────────────────────────────────────────────────────────────┐
│ YOUR CODE                                                       │
│   const db = dbClient.db();                                     │
│   const collection = db.collection('users');                    │
│   const docs = await collection.find({}).toArray();             │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ MOCK CHAIN                                                      │
│   dbClient.db()  ────────────────────►  dbMock()                │
│       └── .collection('users')  ─────►  collectionMock()        │
│               └── .find({})  ────────►  { toArray: jest.fn() }  │
│                       └── .toArray()  ►  jest.fn()              │
└─────────────────────────────────────────────────────────────────┘
```

**Mock setup:**

```typescript
collectionMock.mockReturnValue({
    find: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValueOnce([
            {_id: '1', name: 'John'},
            {_id: '2', name: 'Jane'},
        ]),
    }),
});
```

**Test example:**

```typescript
it('should find all documents', async () => {
    const mockDocs = [{_id: '1', name: 'John'}];
    collectionMock.mockReturnValue({
        find: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValueOnce(mockDocs),
        }),
    });

    const result = await getDocuments(dbClientMock, 'users');

    expect(dbMock().collection).toHaveBeenCalledWith('users');
    expect(result).toEqual(mockDocs);
});
```

### Find One Document

Retrieves a single document matching a query.

```text
┌─────────────────────────────────────────────────────────────────┐
│ YOUR CODE                                                       │
│   const db = dbClient.db();                                     │
│   const collection = db.collection('users');                    │
│   const doc = await collection.findOne({ _id: 'abc123' });      │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ MOCK CHAIN                                                      │
│   dbClient.db()  ────────────────────►  dbMock()                │
│       └── .collection('users')  ─────►  collectionMock()        │
│               └── .findOne(query)  ──►  jest.fn()               │
└─────────────────────────────────────────────────────────────────┘
```

**Mock setup:**

```typescript
collectionMock.mockReturnValue({
    findOne: jest.fn().mockResolvedValueOnce({_id: 'abc123', name: 'John'}),
});
```

**Test example:**

```typescript
it('should find one document by id', async () => {
    const mockDoc = {_id: 'abc123', name: 'John'};
    collectionMock().findOne.mockResolvedValueOnce(mockDoc);

    const result = await getDocumentById(dbClientMock, 'users', 'abc123');

    expect(collectionMock().findOne).toHaveBeenCalledWith({_id: 'abc123'});
    expect(result).toEqual(mockDoc);
});

it('should return null if document not found', async () => {
    collectionMock().findOne.mockResolvedValueOnce(null);

    const result = await getDocumentById(dbClientMock, 'users', 'notfound');

    expect(result).toBeNull();
});
```

### Update a Document

Updates a single document matching a query.

```text
┌─────────────────────────────────────────────────────────────────┐
│ YOUR CODE                                                       │
│   const db = dbClient.db();                                     │
│   const collection = db.collection('users');                    │
│   await collection.updateOne(                                   │
│       { _id: 'abc123' },                                        │
│       { $set: { name: 'John Updated' } }                        │
│   );                                                            │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ MOCK CHAIN                                                      │
│   dbClient.db()  ────────────────────►  dbMock()                │
│       └── .collection('users')  ─────►  collectionMock()        │
│               └── .updateOne(filter, update)  ►  jest.fn()      │
└─────────────────────────────────────────────────────────────────┘
```

**Mock setup:**

```typescript
collectionMock.mockReturnValue({
    updateOne: jest.fn().mockResolvedValueOnce({
        acknowledged: true,
        matchedCount: 1,
        modifiedCount: 1,
    }),
});
```

**Test example:**

```typescript
it('should update a document', async () => {
    collectionMock().updateOne.mockResolvedValueOnce({
        matchedCount: 1,
        modifiedCount: 1,
    });

    await updateDocument(dbClientMock, 'users', 'abc123', {name: 'Updated'});

    expect(collectionMock().updateOne).toHaveBeenCalledWith(
        {_id: 'abc123'},
        {$set: {name: 'Updated'}}
    );
});

it('should handle document not found', async () => {
    collectionMock().updateOne.mockResolvedValueOnce({
        matchedCount: 0,
        modifiedCount: 0,
    });

    const result = await updateDocument(dbClientMock, 'users', 'notfound', {});

    expect(result.matchedCount).toBe(0);
});
```

### Delete a Document

Deletes a single document matching a query.

```text
┌─────────────────────────────────────────────────────────────────┐
│ YOUR CODE                                                       │
│   const db = dbClient.db();                                     │
│   const collection = db.collection('users');                    │
│   await collection.deleteOne({ _id: 'abc123' });                │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ MOCK CHAIN                                                      │
│   dbClient.db()  ────────────────────►  dbMock()                │
│       └── .collection('users')  ─────►  collectionMock()        │
│               └── .deleteOne(filter)  ►  jest.fn()              │
└─────────────────────────────────────────────────────────────────┘
```

**Mock setup:**

```typescript
collectionMock.mockReturnValue({
    deleteOne: jest.fn().mockResolvedValueOnce({
        acknowledged: true,
        deletedCount: 1,
    }),
});
```

**Test example:**

```typescript
it('should delete a document', async () => {
    collectionMock().deleteOne.mockResolvedValueOnce({deletedCount: 1});

    await deleteDocument(dbClientMock, 'users', 'abc123');

    expect(collectionMock().deleteOne).toHaveBeenCalledWith({_id: 'abc123'});
});

it('should handle document not found on delete', async () => {
    collectionMock().deleteOne.mockResolvedValueOnce({deletedCount: 0});

    const result = await deleteDocument(dbClientMock, 'users', 'notfound');

    expect(result.deletedCount).toBe(0);
});
```

### Complete Mock Setup for All Operations

To test all operations, include all methods in your `beforeEach`:

```typescript
beforeEach(() => {
    collectionMock = jest.fn().mockReturnValue({
        insertOne: jest.fn(),
        find: jest.fn().mockReturnValue({
            toArray: jest.fn(),
        }),
        findOne: jest.fn(),
        updateOne: jest.fn(),
        deleteOne: jest.fn(),
    });

    dbMock = jest.fn().mockReturnValue({
        createCollection: jest.fn(),
        collection: collectionMock,
    });

    dbClientMock = {
        db: dbMock,
    } as unknown as jest.Mocked<MongoClient>;
});
```

## Checklist for New Tests

- [ ] Mock all external dependencies (MongoDB, AWS, etc.)
- [ ] Use `beforeEach` to reset mocks
- [ ] Use `afterEach` with `jest.clearAllMocks()`
- [ ] Test the happy path (success case)
- [ ] Test validation errors (400 responses)
- [ ] Test error handling (500 responses)
- [ ] Use descriptive `it('should...')` names
