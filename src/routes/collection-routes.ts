import {FastifyRequest, FastifyReply, FastifyInstance} from 'fastify';
import {MongoClient, ObjectId} from 'mongodb';

export const collectionRoutes = async (fastify: FastifyInstance, dbClient: MongoClient): Promise<void> => {
    fastify.post('/create', async (request: FastifyRequest, reply: FastifyReply) => {
        await createCollectionHandler(request, reply, dbClient);
    });

    fastify.post('/insert', async (request: FastifyRequest, reply: FastifyReply) => {
        await insertDocumentHandler(request, reply, dbClient);
    });

    fastify.get('/:collectionName', async (request: FastifyRequest, reply: FastifyReply) => {
        await getCollectionHandler(request, reply, dbClient);
    });

    fastify.post('/:collectionName/query', async (request: FastifyRequest, reply: FastifyReply) => {
        await queryCollectionDocumentHandler(request, reply, dbClient);
    });

    fastify.patch('/:collectionName/documents/:id', async (request: FastifyRequest, reply: FastifyReply) => {
        await patchCollectionDocumentHandler(request, reply, dbClient);
    });
};

const patchCollectionDocumentHandler = async (request: FastifyRequest, reply: FastifyReply, dbClient: MongoClient) => {
    const {collectionName, id} = request.params as {collectionName: string; id: string};
    const updates = request.body as object;

    if (!collectionName || !id || !updates) {
        return reply.status(400).send({error: 'Collection name, ID, and updates are required'});
    }

    try {
        const db = dbClient.db();
        const collection = db.collection(collectionName);
        const result = await collection.updateOne({_id: new ObjectId(id)}, {$set: updates});
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

const queryCollectionDocumentHandler = async (request: FastifyRequest, reply: FastifyReply, dbClient: MongoClient) => {
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

const getCollectionHandler = async (request: FastifyRequest, reply: FastifyReply, dbClient: MongoClient) => {
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
        return reply.status(500).send({error: `Error retrieving collection: ${error}`});
    }
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
