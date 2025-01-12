import {createCollection, modifyCollection} from '../controllers/collection';
import {MongoClient} from 'mongodb';

export const createCollectHandler = async (request: Request, dbClient: MongoClient): Promise<Response> => {
    try {
        const {collectionName} = await request.json();
        if (!collectionName) {
            return new Response(JSON.stringify({error: 'Collection name is required'}), {
                status: 400,
                headers: {'Content-Type': 'application/json'},
            });
        }

        const result = await createCollection(dbClient, collectionName);
        return new Response(JSON.stringify({message: result.message}), {
            status: 200,
            headers: {'Content-Type': 'application/json'},
        });
    } catch (error) {
        return new Response(JSON.stringify(`Error creating collection: ${error}`, null, 2), {
            status: 500,
            headers: {'Content-Type': 'application/json'},
        });
    }
};

export const modifyCollectHandler = async (request: Request, dbClient: MongoClient): Promise<Response> => {
    try {
        const {collectionName, document} = await request.json();
        if (!collectionName || !document) {
            return new Response(JSON.stringify({error: 'Collection name and document are required'}), {
                status: 400,
                headers: {'Content-Type': 'application/json'},
            });
        }

        const result = await modifyCollection(dbClient, collectionName, document);
        return new Response(JSON.stringify({message: result.message}), {
            status: 200,
            headers: {'Content-Type': 'application/json'},
        });
    } catch (error) {
        return new Response(JSON.stringify(`Error modifying collection: ${error}`, null, 2), {
            status: 500,
            headers: {'Content-Type': 'application/json'},
        });
    }
};
