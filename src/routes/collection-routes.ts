import {FastifyRequest, FastifyReply, FastifyInstance} from 'fastify';
import {MongoClient} from 'mongodb';

export const collectionRoutes = async (fastify: FastifyInstance, dbClient: MongoClient): Promise<void> => {
    fastify.post('/create', async (request: FastifyRequest, reply: FastifyReply) => {
        await createCollectionHandler(request, reply, dbClient);
    });

    fastify.post('/insert', async (request: FastifyRequest, reply: FastifyReply) => {
        await insertDocumentHandler(request, reply, dbClient);
    });
};

const createCollectionHandler = async (request: FastifyRequest, reply: FastifyReply, dbClient: MongoClient) => {
    const {collectionName} = request.body as {collectionName: string};

    if (!collectionName) {
        return reply.status(400).send({error: 'Collection name is required'});
    }

    try {
        const db = dbClient.db();
        await db.createCollection(collectionName);
        return reply.status(200).send({message: `Collection '${collectionName}' created successfully.`});
    } catch (error) {
        return reply.status(500).send({error: `Error creating collection: ${error}`});
    }
};

const insertDocumentHandler = async (request: FastifyRequest, reply: FastifyReply, dbClient: MongoClient) => {
    const {collectionName, document} = request.body as {collectionName: string; document: object};

    if (!collectionName || !document) {
        return reply.status(400).send({error: 'Collection name and document are required'});
    }

    try {
        const db = dbClient.db();
        const collection = db.collection(collectionName);
        await collection.insertOne(document);

        return reply.status(200).send({message: `Document inserted into '${collectionName}' successfully.`});
    } catch (error) {
        return reply.status(500).send({error: `Error inserting document: ${error}`});
    }
};
