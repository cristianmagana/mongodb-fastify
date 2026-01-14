import Fastify, {FastifyInstance} from 'fastify';
import {MongoClient} from 'mongodb';
import {collectionRoutes} from '../../src/routes/collection-routes';

jest.mock('mongodb');

describe('App API routes', () => {
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
