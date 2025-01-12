import {MongoClient} from 'mongodb';
import {MongoService} from '../interfaces/mongodb';

export const getMongoService = (mongoClient: MongoClient): MongoService => {
    const connect = async (): Promise<void> => {
        await mongoClient.connect();
    };

    const disconnect = async (): Promise<void> => {
        await mongoClient.close();
    };

    return {
        connect,
        disconnect,
    };
};
