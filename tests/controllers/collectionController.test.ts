import {MongoClient} from 'mongodb';
import {createCollection, insertDocument} from '../../src/controllers/collection';

jest.mock('mongodb');

describe('MongoDB Controllers', () => {
    let dbMock: jest.MockedFunction<() => {createCollection: jest.Mock; collection: jest.Mock}>;
    let collectionMock: jest.MockedFunction<() => {insertOne: jest.Mock}>;
    let dbClientMock: jest.Mocked<MongoClient>;

    beforeEach(() => {
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
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

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
            const collectionName = 'testCollection';
            const error = new Error('CreateCollectionError');
            dbMock().createCollection.mockRejectedValueOnce(error);

            await expect(createCollection(dbClientMock, collectionName)).rejects.toThrow(`Error creating collection '${collectionName}': ${error}`);
            expect(dbMock().createCollection).toHaveBeenCalledTimes(1);
        });
    });

    describe('insertDocument', () => {
        it('should insert a document successfully', async () => {
            const collectionName = 'testCollection';
            const document = {key: 'value'};
            collectionMock().insertOne.mockResolvedValueOnce({});

            const result = await insertDocument(dbClientMock, collectionName, document);

            expect(dbMock).toHaveBeenCalledTimes(1);
            expect(dbMock().collection).toHaveBeenCalledWith(collectionName);
            expect(collectionMock().insertOne).toHaveBeenCalledWith(document);
            expect(result).toEqual({
                success: true,
                message: `Document inserted into collection '${collectionName}' successfully.`,
            });
        });

        it('should throw an error when inserting a document fails', async () => {
            const collectionName = 'testCollection';
            const document = {key: 'value'};
            const error = new Error('InsertOneError');
            collectionMock().insertOne.mockRejectedValueOnce(error);

            await expect(insertDocument(dbClientMock, collectionName, document)).rejects.toThrow(
                `Error inserting document into collection '${collectionName}': ${error}`
            );
            expect(dbMock().collection).toHaveBeenCalledWith(collectionName);
            expect(collectionMock().insertOne).toHaveBeenCalledTimes(1);
        });
    });
});
