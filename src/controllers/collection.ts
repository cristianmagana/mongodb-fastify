import {MongoClient} from 'mongodb';

export const createCollection = async (dbClient: MongoClient, collectionName: string): Promise<{success: boolean; message: string}> => {
    try {
        await dbClient.db().createCollection(collectionName);
        return {success: true, message: `Collection '${collectionName}' created successfully.`};
    } catch (error) {
        throw new Error(`Error creating collection '${collectionName}': ${error}`);
    }
};

export const insertDocument = async (dbClient: MongoClient, collectionName: string, document: object): Promise<{success: boolean; message: string}> => {
    try {
        await dbClient.db().collection(collectionName).insertOne(document);
        return {success: true, message: `Document inserted into collection '${collectionName}' successfully.`};
    } catch (error) {
        throw new Error(`Error inserting document into collection '${collectionName}': ${error}`);
    }
};
