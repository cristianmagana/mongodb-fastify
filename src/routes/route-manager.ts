import {FastifyInstance} from 'fastify';
import {createCollectionHandler, insertDocumentHandler} from './collection-handlers';
import {MongoClient} from 'mongodb';

export const collectionRoutes = async (fastify: FastifyInstance, dbClient: MongoClient): Promise<void> => {
    fastify.post('/create', async (request, reply) => {
        await createCollectionHandler(request, reply, dbClient);
    });

    fastify.post('/insert', async (request, reply) => {
        await insertDocumentHandler(request, reply, dbClient);
    });
};
