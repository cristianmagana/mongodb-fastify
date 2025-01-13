import {MongoClient} from 'mongodb';
import {getMongoService} from '../../src/services/mongoDb';

describe('getMongoService', () => {
    let mongoClientMock: jest.Mocked<MongoClient>;
    let mongoService: ReturnType<typeof getMongoService>;

    beforeEach(() => {
        mongoClientMock = {
            connect: jest.fn(),
            close: jest.fn(),
        } as unknown as jest.Mocked<MongoClient>;

        mongoService = getMongoService(mongoClientMock);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should call connect on the MongoClient when connect is called', async () => {
        await mongoService.connect();
        expect(mongoClientMock.connect).toHaveBeenCalledTimes(1);
    });

    it('should call close on the MongoClient when disconnect is called', async () => {
        await mongoService.disconnect();
        expect(mongoClientMock.close).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if MongoClient.connect fails', async () => {
        const error = new Error('Failed to connect');
        mongoClientMock.connect.mockRejectedValueOnce(error);

        await expect(mongoService.connect()).rejects.toThrow('Failed to connect');
        expect(mongoClientMock.connect).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if MongoClient.close fails', async () => {
        const error = new Error('Failed to disconnect');
        mongoClientMock.close.mockRejectedValueOnce(error);

        await expect(mongoService.disconnect()).rejects.toThrow('Failed to disconnect');
        expect(mongoClientMock.close).toHaveBeenCalledTimes(1);
    });
});
