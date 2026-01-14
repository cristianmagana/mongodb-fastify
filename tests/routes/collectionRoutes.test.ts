import Fastify, {FastifyInstance} from 'fastify';
import {MongoClient} from 'mongodb';
import {collectionRoutes} from '../../src/routes/collection-routes';

jest.mock('mongodb'); // Mock MongoDB

describe('Fastify API routes', () => {
    let fastify: FastifyInstance;
    let dbClientMock: jest.Mocked<MongoClient>;
    let dbMock: jest.MockedFunction<any>;
    let collectionMock: jest.MockedFunction<any>;

    beforeEach(async () => {
        collectionMock = jest.fn().mockReturnValue({
            insertOne: jest.fn(),
        });
        dbMock = jest.fn().mockReturnValue({
            createCollection: jest.fn(),
            collection: collectionMock,
        });

        dbClientMock = {
            db: dbMock,
        } as unknown as jest.Mocked<MongoClient>;

        fastify = Fastify();
        await collectionRoutes(fastify, dbClientMock);
    });

    afterEach(async () => {
        await fastify.close();
        jest.clearAllMocks();
    });

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
            expect(dbMock().createCollection).toHaveBeenCalledWith('testCollection');
        });

        it('should return 400 if collectionName is missing', async () => {
            const response = await fastify.inject({
                method: 'POST',
                url: '/create',
                payload: {},
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual({
                error: 'Collection name is required',
            });
        });

        it('should return 500 if createCollection fails', async () => {
            dbMock().createCollection.mockRejectedValueOnce(new Error('CreateCollectionError'));

            const response = await fastify.inject({
                method: 'POST',
                url: '/create',
                payload: {collectionName: 'testCollection'},
            });

            expect(response.statusCode).toBe(500);
            expect(JSON.parse(response.payload)).toEqual({
                error: 'Error creating collection: Error: CreateCollectionError',
            });
        });
    });

    describe('POST /insert', () => {
        it('should insert a document successfully', async () => {
            collectionMock().insertOne.mockResolvedValueOnce({});

            const response = await fastify.inject({
                method: 'POST',
                url: '/insert',
                payload: {
                    collectionName: 'testCollection',
                    document: {key: 'value'},
                },
            });

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.payload)).toEqual({
                message: "Document inserted into 'testCollection' successfully.",
            });
            expect(dbMock().collection).toHaveBeenCalledWith('testCollection');
            expect(collectionMock().insertOne).toHaveBeenCalledWith({key: 'value'});
        });

        it('should return 400 if collectionName or document is missing', async () => {
            const response = await fastify.inject({
                method: 'POST',
                url: '/insert',
                payload: {collectionName: 'testCollection'},
            });

            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.payload)).toEqual({
                error: 'Collection name and document are required',
            });
        });

        it('should return 500 if insertOne fails', async () => {
            collectionMock().insertOne.mockRejectedValueOnce(new Error('InsertOneError'));

            const response = await fastify.inject({
                method: 'POST',
                url: '/insert',
                payload: {
                    collectionName: 'testCollection',
                    document: {key: 'value'},
                },
            });

            expect(response.statusCode).toBe(500);
            expect(JSON.parse(response.payload)).toEqual({
                error: 'Error inserting document: Error: InsertOneError',
            });
        });
    });

    describe('GET /:collectionName', () => {
        it('should return a collection when passing in a collectionName', async () => {
            const mockDocuments = [
                {_id: '1', key: 'value'},
                {_id: '2', key: 'value2'},
            ];
            collectionMock.mockReturnValue({
                insertOne: jest.fn(),
                find: jest.fn().mockReturnValue({
                    toArray: jest.fn().mockResolvedValueOnce(mockDocuments),
                }),
            });

            const response = await fastify.inject({
                method: 'GET',
                url: '/testCollection',
            });

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.payload)).toEqual(mockDocuments);
            expect(dbMock().collection).toHaveBeenCalledWith('testCollection');
        });

        it('should return 500 if find fails', async () => {
            collectionMock.mockReturnValue({
                insertOne: jest.fn(),
                find: jest.fn().mockReturnValue({
                    toArray: jest.fn().mockRejectedValueOnce(new Error('FindError')),
                }),
            });

            const response = await fastify.inject({
                method: 'GET',
                url: '/testCollection',
            });

            expect(response.statusCode).toBe(500);
            expect(JSON.parse(response.payload)).toEqual({
                error: 'Error retrieving collection: Error: FindError',
            });
        });
    });
});
